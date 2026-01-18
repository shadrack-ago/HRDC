-- Admin Actions Migration (Safe Version)
-- This only adds NEW functionality without conflicting with existing schema

-- 1. Create admin_actions table for logging admin activities
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('subscription_elevated', 'user_suspended', 'user_reactivated', 'admin_granted', 'admin_revoked')),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS on admin_actions table
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for admin_actions
-- Drop existing policies first (safe to run multiple times)
DROP POLICY IF EXISTS "Admins can view all admin actions" ON admin_actions;
DROP POLICY IF EXISTS "Admins can insert admin actions" ON admin_actions;

-- Only admins can view admin actions
CREATE POLICY "Admins can view all admin actions" ON admin_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can insert admin actions
CREATE POLICY "Admins can insert admin actions" ON admin_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_user_id ON admin_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action ON admin_actions(action);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at);

-- 5. Grant necessary permissions
GRANT SELECT, INSERT ON admin_actions TO authenticated;

-- 6. Update existing elevation function to include admin logging
CREATE OR REPLACE FUNCTION elevate_user_subscription_admin(
  target_user_id uuid, 
  plan_type text DEFAULT 'standard', 
  duration_months integer DEFAULT 1
)
RETURNS TABLE (
  success boolean,
  message text,
  subscription_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_check boolean;
  expires_at timestamptz;
  new_subscription_id uuid;
BEGIN
  -- Check if current user is admin using existing function
  SELECT public.is_admin() INTO admin_check;
  
  IF NOT admin_check THEN
    RETURN QUERY SELECT false, 'Access denied: Admin privileges required', NULL::uuid;
    RETURN;
  END IF;

  -- Calculate expiration date
  expires_at := NOW() + (duration_months || ' months')::interval;

  -- Update or create subscription
  INSERT INTO subscriptions (
    user_id, 
    plan_type, 
    status, 
    paystack_subscription_id, 
    paystack_customer_id, 
    amount_paid, 
    currency, 
    expires_at, 
    updated_at, 
    created_at
  ) VALUES (
    target_user_id,
    plan_type,
    'active',
    'admin_' || target_user_id || '_' || EXTRACT(EPOCH FROM NOW()),
    NULL,
    0,
    'KES',
    expires_at,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    plan_type = EXCLUDED.plan_type,
    status = EXCLUDED.status,
    paystack_subscription_id = EXCLUDED.paystack_subscription_id,
    paystack_customer_id = EXCLUDED.paystack_customer_id,
    amount_paid = EXCLUDED.amount_paid,
    currency = EXCLUDED.currency,
    expires_at = EXCLUDED.expires_at,
    updated_at = EXCLUDED.updated_at
  RETURNING id INTO new_subscription_id;

  -- Log the admin action
  INSERT INTO admin_actions (
    admin_id,
    user_id,
    action,
    details
  ) VALUES (
    auth.uid(),
    target_user_id,
    'subscription_elevated',
    jsonb_build_object(
      'plan_type', plan_type,
      'duration_months', duration_months,
      'expires_at', expires_at,
      'elevated_by', (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

  RETURN QUERY SELECT true, 'User subscription elevated successfully', new_subscription_id;
END;
$$;

-- 7. Grant execute permission for elevation function
GRANT EXECUTE ON FUNCTION elevate_user_subscription_admin TO authenticated;

-- 8. Create or replace view for admin dashboard with subscription info
DROP VIEW IF EXISTS admin_users_with_subscriptions;
CREATE VIEW admin_users_with_subscriptions AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  au.email,
  p.company,
  p.role,
  p.is_admin,
  p.created_at,
  COALESCE(s.plan_type, 'free') as current_plan,
  COALESCE(s.status, 'active') as subscription_status,
  s.expires_at,
  CASE 
    WHEN s.plan_type = 'free' THEN true
    WHEN s.plan_type = 'standard' AND s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW()) THEN true
    ELSE false
  END as is_subscription_active
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
LEFT JOIN subscriptions s ON p.id = s.user_id AND s.status = 'active'
ORDER BY p.created_at DESC;

-- 9. Grant select permission on admin view
GRANT SELECT ON admin_users_with_subscriptions TO authenticated;

-- 10. Create policy for admin view (only admins can access)
-- Note: Views don't support RLS policies in the same way as tables
-- Access control is handled through the underlying tables' RLS policies
-- The grant above allows authenticated users to query the view,
-- but the profiles, auth.users, and subscriptions RLS policies will filter results

-- 11. Add helpful comments
COMMENT ON TABLE admin_actions IS 'Logs all administrative actions for audit trail';
COMMENT ON FUNCTION elevate_user_subscription_admin IS 'Secure function for admins to elevate user subscriptions with proper logging';
COMMENT ON VIEW admin_users_with_subscriptions IS 'Admin dashboard view showing users with their subscription information';

-- Migration complete!
SELECT 'Admin actions functionality installed successfully!' as status;
