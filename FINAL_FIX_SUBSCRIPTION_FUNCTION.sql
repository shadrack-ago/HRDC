-- FINAL FIX: Make function parameter name match what frontend sends
-- Frontend sends: { user_id: userId }
-- Function needs to accept: user_id (not p_user_id)

-- Drop and recreate get_user_subscription with correct parameter name
DROP FUNCTION IF EXISTS get_user_subscription(uuid);

CREATE OR REPLACE FUNCTION get_user_subscription(user_id uuid DEFAULT auth.uid())
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
DECLARE
  v_plan_type text;
  v_status text;
  v_expires_at timestamptz;
  v_is_active boolean;
BEGIN
  -- Get subscription from subscriptions table
  SELECT 
    s.plan_type,
    s.status,
    s.expires_at
  INTO v_plan_type, v_status, v_expires_at
  FROM subscriptions s
  WHERE s.user_id = get_user_subscription.user_id
  LIMIT 1;
  
  -- If no subscription found, default to free
  IF v_plan_type IS NULL THEN
    v_plan_type := 'free';
    v_status := 'active';
    v_expires_at := NULL;
    v_is_active := true;
  ELSE
    -- Check if subscription is active
    IF v_plan_type = 'free' THEN
      v_is_active := true;
    ELSIF v_plan_type = 'standard' AND v_status = 'active' AND (v_expires_at IS NULL OR v_expires_at > NOW()) THEN
      v_is_active := true;
    ELSE
      v_is_active := false;
    END IF;
  END IF;
  
  RETURN QUERY SELECT v_plan_type, v_status, v_expires_at, v_is_active;
END;
$$;

-- Drop and recreate check_usage_limit with correct parameter name
DROP FUNCTION IF EXISTS check_usage_limit(uuid);

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
  v_plan_type text;
  v_is_active boolean;
  v_queries_today integer;
BEGIN
  -- Get subscription info
  SELECT plan_type, is_active 
  INTO v_plan_type, v_is_active
  FROM get_user_subscription(check_usage_limit.user_id)
  LIMIT 1;
  
  -- Get today's query count
  SELECT COALESCE(query_count, 0)
  INTO v_queries_today
  FROM usage_tracking
  WHERE usage_tracking.user_id = check_usage_limit.user_id
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_usage_limit(uuid) TO authenticated;

-- Test with your user ID
SELECT 'Test for user 72ae89e0-6b29-4bb1-9ebc-89e43e17582a:' as test;
SELECT * FROM get_user_subscription('72ae89e0-6b29-4bb1-9ebc-89e43e17582a'::uuid);
SELECT * FROM check_usage_limit('72ae89e0-6b29-4bb1-9ebc-89e43e17582a'::uuid);
