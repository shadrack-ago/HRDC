-- URGENT FIX: Remove problematic RLS policies and recreate them properly
-- Run this in Supabase SQL Editor to fix the infinite recursion error

-- 1. Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- 2. Create corrected policies without circular dependencies

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Simplified admin policy - check admin status via auth.jwt() claims or use a different approach
-- For now, we'll remove the problematic admin policy and handle admin access in the application layer
-- You can manually grant admin access by updating the is_admin field directly

-- Alternative: If you need admin access, you can temporarily disable RLS for admin operations
-- or create a separate admin function that bypasses RLS

-- 3. Verify RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Test the policies
-- After running this, try logging in again. The infinite recursion should be resolved.
