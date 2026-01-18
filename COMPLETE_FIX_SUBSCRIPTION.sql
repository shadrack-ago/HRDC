-- COMPLETE FIX FOR SUBSCRIPTION ISSUE
-- Run this entire file in Supabase SQL Editor

-- Step 1: Drop and recreate the get_user_subscription function
DROP FUNCTION IF EXISTS get_user_subscription(uuid);

CREATE OR REPLACE FUNCTION get_user_subscription(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  plan_type text,
  status text,
  expires_at timestamptz,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(s.plan_type, 'free')::text as plan_type,
    COALESCE(s.status, 'active')::text as status,
    s.expires_at,
    CASE 
      WHEN s.plan_type = 'free' OR s.plan_type IS NULL THEN true
      WHEN s.plan_type = 'standard' AND s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW()) THEN true
      ELSE false
    END as is_active
  FROM auth.users u
  LEFT JOIN subscriptions s ON u.id = s.user_id
  WHERE u.id = p_user_id
  LIMIT 1;
END;
$$;

-- Step 2: Drop and recreate the check_usage_limit function
DROP FUNCTION IF EXISTS check_usage_limit(uuid);

CREATE OR REPLACE FUNCTION check_usage_limit(p_user_id uuid DEFAULT auth.uid())
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
  v_plan_type text;
  v_is_active boolean;
  v_queries_today integer;
BEGIN
  -- Get subscription info
  SELECT plan_type, is_active 
  INTO v_plan_type, v_is_active
  FROM get_user_subscription(p_user_id)
  LIMIT 1;
  
  -- Get today's query count
  SELECT COALESCE(query_count, 0)
  INTO v_queries_today
  FROM usage_tracking
  WHERE usage_tracking.user_id = p_user_id
  AND query_date = CURRENT_DATE;
  
  -- Default to 0 if null
  v_queries_today := COALESCE(v_queries_today, 0);
  
  -- Return based on plan type
  IF v_plan_type = 'standard' AND v_is_active THEN
    -- Standard users: unlimited queries
    RETURN QUERY SELECT 
      v_queries_today,
      false as limit_reached,
      true as can_query;
  ELSE
    -- Free users: 2 queries per day
    RETURN QUERY SELECT 
      v_queries_today,
      (v_queries_today >= 2) as limit_reached,
      (v_queries_today < 2) as can_query;
  END IF;
END;
$$;

-- Step 3: Clear usage for standard plan users
DELETE FROM usage_tracking
WHERE user_id IN (
  SELECT user_id 
  FROM subscriptions 
  WHERE plan_type = 'standard' 
  AND status = 'active'
  AND (expires_at IS NULL OR expires_at > NOW())
)
AND query_date = CURRENT_DATE;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION get_user_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_usage_limit(uuid) TO authenticated;

-- Step 5: Verify the fix
SELECT 'Subscription Check:' as test, * FROM get_user_subscription(auth.uid());
SELECT 'Usage Limit Check:' as test, * FROM check_usage_limit(auth.uid());
SELECT 'Current Subscription:' as test, plan_type, status, expires_at FROM subscriptions WHERE user_id = auth.uid();
