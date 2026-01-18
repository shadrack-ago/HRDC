-- Your subscription EXISTS but the function isn't finding it
-- Your user_id: 72ae89e0-6b29-4bb1-9ebc-89e43e17582a
-- Your subscription: standard, expires 2026-02-18

-- Let's verify the function can see it
SELECT 
  'Direct query - Your subscription:' as test,
  user_id,
  plan_type,
  status,
  expires_at
FROM subscriptions
WHERE user_id = '72ae89e0-6b29-4bb1-9ebc-89e43e17582a';

-- Now test if auth.uid() matches
SELECT 
  'Your auth.uid():' as test,
  auth.uid() as user_id;

-- Test the function with explicit user_id
SELECT 
  'Function with explicit ID:' as test,
  *
FROM get_user_subscription('72ae89e0-6b29-4bb1-9ebc-89e43e17582a'::uuid);

-- Test the function with auth.uid()
SELECT 
  'Function with auth.uid():' as test,
  *
FROM get_user_subscription(auth.uid());

-- If auth.uid() doesn't match, there might be a session issue
-- Let's check if you're logged in as the right user
SELECT 
  'Current user email:' as test,
  email
FROM auth.users
WHERE id = auth.uid();
