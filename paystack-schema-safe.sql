-- Paystack Payment & Subscription Schema (Safe Version)
-- This version checks if objects exist before creating

-- 1. Drop existing policies first (safe to run multiple times)
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can view own usage" ON usage_tracking;
DROP POLICY IF EXISTS "Users can update own usage" ON usage_tracking;
DROP POLICY IF EXISTS "Users can insert own usage" ON usage_tracking;
DROP POLICY IF EXISTS "Users can view own transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON payment_transactions;

-- 2. Drop trigger FIRST (before dropping function it depends on)
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;

-- 3. Drop existing functions
DROP FUNCTION IF EXISTS get_user_subscription(uuid);
DROP FUNCTION IF EXISTS check_usage_limit(uuid);
DROP FUNCTION IF EXISTS increment_usage_count(uuid);
DROP FUNCTION IF EXISTS initialize_free_subscription();

-- 4. Drop and recreate subscriptions table (ensures clean state)
DROP TABLE IF EXISTS subscriptions CASCADE;

CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'standard')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  paystack_subscription_id TEXT,
  paystack_customer_id TEXT,
  amount_paid DECIMAL(10,2),
  currency TEXT DEFAULT 'KES',
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Drop and recreate usage tracking table
DROP TABLE IF EXISTS usage_tracking CASCADE;

CREATE TABLE usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query_date DATE DEFAULT CURRENT_DATE,
  query_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, query_date)
);

-- 6. Drop and recreate payment transactions table
DROP TABLE IF EXISTS payment_transactions CASCADE;

CREATE TABLE payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  paystack_reference TEXT UNIQUE NOT NULL,
  paystack_transaction_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
  payment_method TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enable RLS on tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for subscriptions
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. Create RLS policies for usage tracking
CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON usage_tracking
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. Create RLS policies for payment transactions
CREATE POLICY "Users can view own transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON payment_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 11. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date ON usage_tracking(user_id, query_date);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference ON payment_transactions(paystack_reference);

-- 12. Create function to get user's current subscription
CREATE OR REPLACE FUNCTION get_user_subscription(user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  plan_type text,
  status text,
  expires_at timestamptz,
  is_active boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(s.plan_type, 'free') as plan_type,
    COALESCE(s.status, 'active') as status,
    s.expires_at,
    CASE 
      WHEN s.plan_type = 'free' THEN true
      WHEN s.plan_type = 'standard' AND s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW()) THEN true
      ELSE false
    END as is_active
  FROM profiles p
  LEFT JOIN subscriptions s ON p.id = s.user_id AND s.status = 'active'
  WHERE p.id = user_id
  ORDER BY s.created_at DESC
  LIMIT 1;
$$;

-- 13. Create function to check daily usage limit
CREATE OR REPLACE FUNCTION check_usage_limit(user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  queries_today integer,
  limit_reached boolean,
  can_query boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_sub AS (
    SELECT * FROM get_user_subscription(user_id)
  ),
  today_usage AS (
    SELECT COALESCE(query_count, 0) as queries_today
    FROM usage_tracking 
    WHERE user_id = check_usage_limit.user_id 
    AND query_date = CURRENT_DATE
  )
  SELECT 
    COALESCE(tu.queries_today, 0) as queries_today,
    CASE 
      WHEN us.plan_type = 'standard' AND us.is_active THEN false
      WHEN us.plan_type = 'free' AND COALESCE(tu.queries_today, 0) >= 2 THEN true
      ELSE false
    END as limit_reached,
    CASE 
      WHEN us.plan_type = 'standard' AND us.is_active THEN true
      WHEN us.plan_type = 'free' AND COALESCE(tu.queries_today, 0) < 2 THEN true
      ELSE false
    END as can_query
  FROM user_sub us
  CROSS JOIN today_usage tu;
$$;

-- 14. Create function to increment usage count
CREATE OR REPLACE FUNCTION increment_usage_count(user_id uuid DEFAULT auth.uid())
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO usage_tracking (user_id, query_date, query_count)
  VALUES (user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, query_date)
  DO UPDATE SET 
    query_count = usage_tracking.query_count + 1,
    updated_at = NOW();
$$;

-- 15. Create function to initialize free subscription for new users
CREATE OR REPLACE FUNCTION initialize_free_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 16. Create trigger to auto-create free subscription for new users
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION initialize_free_subscription();

-- 17. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON usage_tracking TO authenticated;
GRANT SELECT, INSERT ON payment_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION check_usage_limit TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage_count TO authenticated;

-- 18. Create free subscriptions for existing users
INSERT INTO subscriptions (user_id, plan_type, status)
SELECT id, 'free', 'active'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Schema installation complete!
SELECT 'Paystack payment schema installed successfully!' as status;
