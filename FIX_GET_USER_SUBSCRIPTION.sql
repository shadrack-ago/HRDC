-- Fix get_user_subscription to properly return subscription data
-- The issue is that the function is not finding the subscription in the database

-- First, verify your subscription exists
SELECT 
  'Your current subscription in database:' as info,
  user_id,
  plan_type,
  status,
  expires_at,
  created_at
FROM subscriptions
WHERE user_id = auth.uid();

-- Drop and recreate the function with better logic
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
DECLARE
  v_plan_type text;
  v_status text;
  v_expires_at timestamptz;
  v_is_active boolean;
BEGIN
  -- Try to get subscription from subscriptions table
  SELECT 
    s.plan_type,
    s.status,
    s.expires_at
  INTO v_plan_type, v_status, v_expires_at
  FROM subscriptions s
  WHERE s.user_id = p_user_id
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
  
  -- Return the subscription data
  RETURN QUERY SELECT v_plan_type, v_status, v_expires_at, v_is_active;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_subscription(uuid) TO authenticated;

-- Test the function
SELECT 'Testing get_user_subscription:' as test;
SELECT * FROM get_user_subscription(auth.uid());

-- Verify it matches your actual subscription
SELECT 
  'Comparison:' as info,
  'Database subscription:' as source,
  plan_type,
  status,
  expires_at
FROM subscriptions
WHERE user_id = auth.uid()
UNION ALL
SELECT 
  'Comparison:' as info,
  'Function result:' as source,
  plan_type,
  status,
  expires_at
FROM get_user_subscription(auth.uid());
