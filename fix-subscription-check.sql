-- Fix for Subscription Check Issue
-- This ensures the check_usage_limit function properly recognizes standard plan users

-- First, verify your subscription exists
-- Run this to check your current subscription:
-- SELECT * FROM subscriptions WHERE user_id = auth.uid();

-- Recreate the get_user_subscription function to ensure it works correctly
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
  FROM auth.users u
  LEFT JOIN subscriptions s ON u.id = s.user_id
  WHERE u.id = user_id
  LIMIT 1;
$$;

-- Recreate the check_usage_limit function with better logic
CREATE OR REPLACE FUNCTION check_usage_limit(user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  queries_today integer,
  limit_reached boolean,
  can_query boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_plan text;
  plan_active boolean;
  today_count integer;
BEGIN
  -- Get user's subscription
  SELECT plan_type, is_active INTO user_plan, plan_active
  FROM get_user_subscription(user_id);
  
  -- Get today's usage
  SELECT COALESCE(query_count, 0) INTO today_count
  FROM usage_tracking 
  WHERE usage_tracking.user_id = check_usage_limit.user_id 
  AND query_date = CURRENT_DATE;
  
  -- Set default if null
  IF today_count IS NULL THEN
    today_count := 0;
  END IF;
  
  -- Return results based on plan
  RETURN QUERY SELECT 
    today_count as queries_today,
    CASE 
      -- Standard plan users never hit limit
      WHEN user_plan = 'standard' AND plan_active THEN false
      -- Free plan users hit limit at 2 queries
      WHEN user_plan = 'free' AND today_count >= 2 THEN true
      ELSE false
    END as limit_reached,
    CASE 
      -- Standard plan users can always query
      WHEN user_plan = 'standard' AND plan_active THEN true
      -- Free plan users can query if under limit
      WHEN user_plan = 'free' AND today_count < 2 THEN true
      ELSE false
    END as can_query;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION check_usage_limit TO authenticated;

-- Test the function (run this to verify it works for your account)
-- SELECT * FROM check_usage_limit(auth.uid());
-- Expected result for standard plan: queries_today=X, limit_reached=false, can_query=true

-- Verify your subscription status
-- SELECT 
--   u.email,
--   s.plan_type,
--   s.status,
--   s.expires_at,
--   CASE 
--     WHEN s.plan_type = 'standard' AND s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW()) THEN true
--     ELSE false
--   END as is_active
-- FROM auth.users u
-- LEFT JOIN subscriptions s ON u.id = s.user_id
-- WHERE u.id = auth.uid();
