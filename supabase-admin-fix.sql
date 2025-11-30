-- Complete Admin Dashboard Fix for Supabase
-- This combines the security_invoker view with proper admin policies

-- 1. First, run the basic policy fix to stop infinite recursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all conversations" ON conversations;
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;

-- 2. Create basic user policies (no recursion)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Create the admin stats view with security_invoker (as recommended by Supabase)
DROP VIEW IF EXISTS public.admin_stats;
CREATE VIEW public.admin_stats WITH (security_invoker = on) AS
SELECT 
  (SELECT count(*) FROM profiles) AS total_users,
  (SELECT count(*) FROM conversations) AS total_conversations,
  (SELECT count(*) FROM messages) AS total_messages,
  (SELECT count(*) FROM profiles WHERE profiles.created_at >= date_trunc('month'::text, CURRENT_DATE::timestamp with time zone)) AS users_this_month;

-- 4. Create a function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT is_admin 
    FROM profiles 
    WHERE id = user_id
  ), false);
$$;

-- 5. Create admin policies using the function (this avoids direct table recursion)
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view all conversations" ON conversations
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view all messages" ON messages
  FOR SELECT USING (public.is_admin());

-- 6. Grant access to the admin_stats view for authenticated users
GRANT SELECT ON public.admin_stats TO authenticated;

-- 7. Grant execute permission on the is_admin function
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;

-- 8. Create a function to get recent users for admins
CREATE OR REPLACE FUNCTION public.get_recent_users(limit_count integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  email text,
  company text,
  role text,
  is_admin boolean,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    au.email,
    p.company,
    p.role,
    p.is_admin,
    p.created_at
  FROM profiles p
  JOIN auth.users au ON p.id = au.id
  WHERE public.is_admin()  -- Only admins can call this
  ORDER BY p.created_at DESC
  LIMIT limit_count;
$$;

-- 9. Grant execute permission on the get_recent_users function
GRANT EXECUTE ON FUNCTION public.get_recent_users TO authenticated;

-- 10. Test queries (run these to verify everything works)
-- SELECT * FROM public.admin_stats;  -- Should work for admins
-- SELECT * FROM public.get_recent_users(5);  -- Should work for admins
