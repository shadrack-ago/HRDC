# Supabase Setup Guide for HR Digital Consulting Platform

## Overview
This guide will help you set up Supabase authentication and database for the HR Digital Consulting platform.

## Prerequisites
- Supabase account
- Project URL: `https://epspagpwvpqrypxpphpd.supabase.co`
- Anon public key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwc3BhZ3B3dnBxcnlweHBwaHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMzA1MTQsImV4cCI6MjA3OTkwNjUxNH0.R6YT4xac97XF9WM-Bo_VOt-JXaKomNpOScapfDCfazE`

## Step 1: Environment Variables
Create a `.env` file in the project root with:
```
VITE_SUPABASE_URL=https://epspagpwvpqrypxpphpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwc3BhZ3B3dnBxcnlweHBwaHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMzA1MTQsImV4cCI6MjA3OTkwNjUxNH0.R6YT4xac97XF9WM-Bo_VOt-JXaKomNpOScapfDCfazE
```

## Step 2: Database Schema Setup
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the SQL commands to create tables and policies

## Step 3: Authentication Configuration
1. Go to Authentication > Settings in Supabase Dashboard
2. Enable the following:
   - **Enable email confirmations**: ON
   - **Confirm email**: ON
   - **Enable password reset**: ON
   - **Enable phone confirmations**: OFF (unless needed)

3. Configure Email Templates (optional but recommended):
   - Go to Authentication > Email Templates
   - Customize the confirmation email template
   - Customize the password reset email template
   - Set confirmation redirect URL to: `https://your-domain.com/dashboard`
   - Set password reset redirect URL to: `https://your-domain.com/reset-password`

## Step 4: Row Level Security (RLS)
The schema automatically sets up RLS policies that ensure:
- Users can only access their own data
- Admins can view all data for dashboard purposes
- Proper security isolation between users

## Step 5: Create First Admin User
After the first user registers, make them an admin by running this SQL in Supabase:
```sql
UPDATE profiles 
SET is_admin = TRUE 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'your-admin-email@example.com'
);
```

## Step 6: Test the Setup
1. Start the development server: `npm run dev`
2. Register a new user
3. Check email for confirmation link
4. Confirm email and login
5. Test chat functionality
6. Make user admin and test admin dashboard

## Database Schema Overview

### Tables Created:
1. **profiles** - Extended user information
   - Links to auth.users
   - Stores first_name, last_name, company, role, is_admin
   
2. **conversations** - Chat conversations
   - Belongs to a user
   - Has title and timestamps
   
3. **messages** - Individual chat messages
   - Belongs to a conversation
   - Stores content, sender (user/ai), error status

### Key Features:
- **Email Verification**: Users must confirm email before accessing
- **Admin Dashboard**: Admins can view user statistics
- **Persistent Chat**: All conversations stored in database
- **Row Level Security**: Data isolation between users
- **Automatic Profile Creation**: Profile created on user signup

## Troubleshooting

### Common Issues:
1. **Environment variables not loading**: Ensure `.env` file is in project root
2. **Database connection errors**: Check URL and API key
3. **RLS blocking queries**: Verify policies are set up correctly
4. **Email confirmation not working**: Check email settings in Supabase

### Debug Steps:
1. Check browser console for errors
2. Verify Supabase project is active
3. Test database connection in Supabase dashboard
4. Check authentication logs in Supabase

## Migration from localStorage
The new system automatically handles:
- User authentication via Supabase Auth
- Profile management in database
- Conversation persistence in database
- Message storage with proper relationships

Old localStorage data will not be migrated automatically. Users will need to start fresh with the new system.

## Security Notes
- All sensitive operations require authentication
- RLS policies prevent unauthorized data access
- Admin privileges are database-controlled
- Email verification prevents fake accounts
- API keys are properly scoped (anon key only)

## Next Steps
1. Set up custom email templates
2. Configure custom domain for emails
3. Set up monitoring and analytics
4. Add backup procedures
5. Consider implementing rate limiting
