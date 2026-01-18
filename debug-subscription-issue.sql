-- Debug Subscription Issue
-- Run these queries one by one to diagnose the problem

-- 1. Check your current subscription in the database
SELECT 
  s.user_id,
  s.plan_type,
  s.status,
  s.expires_at,
  s.created_at,
  s.updated_at,
  CASE 
    WHEN s.expires_at IS NULL THEN 'No expiry'
    WHEN s.expires_at > NOW() THEN 'Valid'
    ELSE 'Expired'
  END as expiry_status
FROM subscriptions s
WHERE s.user_id = auth.uid();

-- 2. Check what get_user_subscription returns
SELECT * FROM get_user_subscription(auth.uid());

-- 3. Check what check_usage_limit returns
SELECT * FROM check_usage_limit(auth.uid());

-- 4. Check your current usage tracking
SELECT 
  user_id,
  query_date,
  query_count,
  created_at,
  updated_at
FROM usage_tracking
WHERE user_id = auth.uid()
ORDER BY query_date DESC
LIMIT 5;

-- 5. Check your user profile
SELECT 
  u.id,
  u.email,
  p.first_name,
  p.last_name,
  p.is_admin
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.id = auth.uid();
