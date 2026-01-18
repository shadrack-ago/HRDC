-- Check if subscription actually exists in the database

-- 1. Check subscriptions table for your user
SELECT 
  'Subscriptions for your user:' as info,
  *
FROM subscriptions
WHERE user_id = auth.uid();

-- 2. Check if there are ANY subscriptions in the table
SELECT 
  'Total subscriptions in table:' as info,
  COUNT(*) as total_count
FROM subscriptions;

-- 3. Check your user ID
SELECT 
  'Your user ID:' as info,
  auth.uid() as user_id;

-- 4. Check if you have a subscription with a different user_id somehow
SELECT 
  'All subscriptions (limited to 10):' as info,
  user_id,
  plan_type,
  status,
  expires_at,
  created_at
FROM subscriptions
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check your profile to see if is_admin is set
SELECT 
  'Your profile:' as info,
  id,
  first_name,
  last_name,
  is_admin
FROM profiles
WHERE id = auth.uid();
