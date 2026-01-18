# Database Migrations Guide - HRDC Platform

## Overview
This guide provides the correct order and instructions for running database migrations for the HRDC platform.

---

## 📋 Migration Files Order

Run these SQL files in **EXACTLY** this order in your Supabase SQL Editor:

### 1. Base Schema (REQUIRED)
**File:** `supabase-schema.sql`

**What it creates:**
- `profiles` table (user profiles)
- `conversations` table (chat conversations)
- `messages` table (chat messages)
- Basic RLS policies
- Triggers for auto-profile creation
- Admin stats view

**Run this:** ✅ FIRST

---

### 2. Admin Fixes (REQUIRED)
**File:** `supabase-admin-fix.sql`

**What it creates:**
- Fixed admin policies (no recursion)
- `is_admin()` function
- `get_recent_users()` function
- Security invoker view for admin stats

**Run this:** ✅ SECOND

---

### 3. Payment & Subscriptions (REQUIRED)
**File:** `paystack-schema-safe.sql`

**What it creates:**
- `subscriptions` table
- `usage_tracking` table
- `payment_transactions` table
- RLS policies for payment tables
- `get_user_subscription()` function
- `check_usage_limit()` function
- `increment_usage_count()` function
- Auto-create free subscription trigger

**Run this:** ✅ THIRD

---

### 4. Admin Actions & Elevation (REQUIRED)
**File:** `admin-actions-safe-migration.sql`

**What it creates:**
- `admin_actions` table (audit logging)
- `elevate_user_subscription_admin()` function
- `admin_users_with_subscriptions` view
- RLS policies for admin actions

**Run this:** ✅ FOURTH

---

## 🚀 Quick Start Commands

### Step-by-Step in Supabase SQL Editor

1. **Open Supabase Dashboard** → Your Project → SQL Editor

2. **Run Migration 1:**
```sql
-- Copy and paste contents of supabase-schema.sql
-- Click "Run" or press Ctrl+Enter
```

3. **Run Migration 2:**
```sql
-- Copy and paste contents of supabase-admin-fix.sql
-- Click "Run"
```

4. **Run Migration 3:**
```sql
-- Copy and paste contents of paystack-schema-safe.sql
-- Click "Run"
```

5. **Run Migration 4:**
```sql
-- Copy and paste contents of admin-actions-safe-migration.sql
-- Click "Run"
```

---

## ✅ Verification Queries

After running all migrations, verify everything is set up correctly:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Expected tables:
-- admin_actions
-- conversations
-- messages
-- payment_transactions
-- profiles
-- subscriptions
-- usage_tracking

-- Check all functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- Expected functions:
-- check_usage_limit
-- elevate_user_subscription_admin
-- get_recent_users
-- get_user_subscription
-- handle_new_user
-- increment_usage_count
-- initialize_free_subscription
-- is_admin
-- is_current_user_admin
-- update_updated_at_column

-- Check all views exist
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';

-- Expected views:
-- admin_stats
-- admin_users_with_subscriptions
```

---

## 🔧 Troubleshooting

### Error: "relation already exists"
**Solution:** The table/function already exists. Safe to ignore or drop and recreate.

### Error: "policy already exists"
**Solution:** The safe migration files drop existing policies first. Re-run the file.

### Error: "column does not exist"
**Solution:** Make sure you ran migrations in the correct order.

### Error: "function does not exist"
**Solution:** A previous migration didn't complete. Re-run from the beginning.

---

## 🗑️ Clean Slate (Reset Database)

If you need to start fresh:

```sql
-- WARNING: This will delete ALL data!

-- Drop tables (in reverse order due to foreign keys)
DROP TABLE IF EXISTS admin_actions CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS usage_tracking CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop views
DROP VIEW IF EXISTS admin_users_with_subscriptions CASCADE;
DROP VIEW IF EXISTS admin_stats CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS elevate_user_subscription_admin CASCADE;
DROP FUNCTION IF EXISTS is_current_user_admin CASCADE;
DROP FUNCTION IF EXISTS get_recent_users CASCADE;
DROP FUNCTION IF EXISTS increment_usage_count CASCADE;
DROP FUNCTION IF EXISTS check_usage_limit CASCADE;
DROP FUNCTION IF EXISTS get_user_subscription CASCADE;
DROP FUNCTION IF EXISTS initialize_free_subscription CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;

-- Now re-run all migrations in order
```

---

## 📝 Making Your First Admin User

After migrations are complete, make a user an admin:

```sql
-- Replace with your actual user email
UPDATE profiles 
SET is_admin = TRUE 
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'your-admin-email@example.com'
);
```

---

## 🔐 Security Checklist

After running migrations:

- [ ] Verify RLS is enabled on all tables
- [ ] Test that users can only see their own data
- [ ] Test admin can see all data
- [ ] Test subscription limits work
- [ ] Test payment flow
- [ ] Test admin elevation function

---

## 📊 Database Schema Overview

```
auth.users (Supabase managed)
    ↓
profiles (user info)
    ↓
├── conversations (chat history)
│   └── messages (chat messages)
├── subscriptions (payment plans)
├── usage_tracking (query limits)
├── payment_transactions (payment history)
└── admin_actions (audit log)
```

---

## 🆘 Support

If you encounter issues:

1. Check the error message carefully
2. Verify migration order
3. Check Supabase logs
4. Review RLS policies
5. Contact: info@hrdigitalconsultingltd.com

---

**Last Updated:** January 18, 2026  
**Version:** 1.0
