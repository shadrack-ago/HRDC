-- Reset Usage for Standard Plan Users
-- This clears the usage tracking for users with active standard subscriptions
-- so they can start using unlimited queries immediately

-- Option 1: Reset usage for your specific account (run this for immediate fix)
DELETE FROM usage_tracking 
WHERE user_id = auth.uid() 
AND query_date = CURRENT_DATE;

-- Option 2: Reset usage for ALL standard plan users (optional - use if needed)
-- DELETE FROM usage_tracking 
-- WHERE user_id IN (
--   SELECT user_id 
--   FROM subscriptions 
--   WHERE plan_type = 'standard' 
--   AND status = 'active'
--   AND (expires_at IS NULL OR expires_at > NOW())
-- )
-- AND query_date = CURRENT_DATE;

-- Verify your usage is cleared
SELECT * FROM usage_tracking 
WHERE user_id = auth.uid() 
AND query_date = CURRENT_DATE;
-- Should return no rows

-- Verify you can now query
SELECT * FROM check_usage_limit(auth.uid());
-- Should show: queries_today=0, can_query=true, limit_reached=false
