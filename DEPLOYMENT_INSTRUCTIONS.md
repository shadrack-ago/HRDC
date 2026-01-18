# Deployment Instructions for HRDC Platform

## ✅ Production Ready Status

All features have been implemented and tested:
- ✅ User authentication and profiles
- ✅ AI-powered chat consultation
- ✅ Subscription management (Free & Standard plans)
- ✅ Payment integration (Paystack)
- ✅ Admin dashboard with user elevation
- ✅ Usage tracking and limits
- ✅ Terms and Conditions page
- ✅ Subscription check logic fixed

---

## 📋 Database Migrations (Run in Order)

Before deploying, ensure all database migrations are run in your **production Supabase** instance:

### 1. Base Schema
```bash
File: supabase-schema.sql
```

### 2. Admin Fixes
```bash
File: supabase-admin-fix.sql
```

### 3. Payment & Subscriptions
```bash
File: paystack-schema-safe.sql
```

### 4. Admin Actions & Elevation
```bash
File: admin-actions-safe-migration.sql
```

### 5. Subscription Function Fix (CRITICAL)
```bash
File: FINAL_FIX_SUBSCRIPTION_FUNCTION.sql
```

**Note:** The last migration is critical for proper subscription checking. Without it, standard users will see usage limits.

---

## 🔐 Environment Variables

Ensure these are set in your Netlify deployment:

```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

**Important:** Never commit `.env` file to GitHub. Use `.env.example` as template.

---

## 🚀 Deployment Steps

### Step 1: Push to GitHub

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Production ready: Fixed subscription checks, admin elevation, and payment integration"

# Push to GitHub
git push origin main
```

### Step 2: Netlify Auto-Deploy

Since you have CI/CD configured:
1. Netlify will automatically detect the push
2. Build will start automatically
3. Site will deploy when build completes

### Step 3: Verify Deployment

After deployment, test:
- [ ] User registration and login
- [ ] Chat functionality
- [ ] Subscription upgrade (payment flow)
- [ ] Admin dashboard access
- [ ] User elevation by admin
- [ ] Standard users can chat unlimited (no banner)
- [ ] Free users see 2-query limit

---

## 🗄️ Database Setup Checklist

In your production Supabase:

- [ ] All 5 migration files run successfully
- [ ] RLS policies enabled on all tables
- [ ] Functions created and permissions granted
- [ ] At least one admin user created:
  ```sql
  UPDATE profiles 
  SET is_admin = TRUE 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'your-admin@email.com');
  ```

---

## 🔧 Post-Deployment Configuration

### 1. Paystack Webhook (Optional but Recommended)
Set up webhook in Paystack dashboard to verify payments:
- URL: `https://your-domain.netlify.app/api/paystack-webhook`
- Events: `charge.success`

### 2. Email Configuration
In Supabase Dashboard → Authentication → Email Templates:
- Customize confirmation email
- Customize password reset email
- Set up SMTP for production emails

### 3. CORS Settings
In Supabase Dashboard → Settings → API:
- Add your Netlify domain to allowed origins

---

## 📊 Monitoring

After deployment, monitor:
- Netlify build logs for any errors
- Supabase logs for database errors
- Browser console for frontend errors
- Payment transactions in Paystack dashboard

---

## 🐛 Troubleshooting

### Issue: Users see usage banner despite having standard subscription
**Solution:** Ensure `FINAL_FIX_SUBSCRIPTION_FUNCTION.sql` was run in production database.

### Issue: Payment successful but subscription not updated
**Solution:** Check Supabase logs and verify `updateSubscription` function in `paystack.js` is working.

### Issue: Admin can't elevate users
**Solution:** Verify admin user has `is_admin = true` in profiles table.

### Issue: Build fails on Netlify
**Solution:** Check build logs, ensure all dependencies in `package.json` are correct.

---

## 📝 Important Files for Production

### Keep in Repository:
- All `.sql` migration files (for documentation)
- `.env.example` (template for environment variables)
- `README.md`
- All documentation files

### Excluded from Repository (via .gitignore):
- `.env` (contains secrets)
- `node_modules/`
- `dist/` (build output)
- `.netlify/`

---

## ✅ Final Checklist Before Push

- [x] All console.log debug statements removed
- [x] Environment variables configured in Netlify
- [x] Database migrations ready
- [x] `.env` file in `.gitignore`
- [x] All features tested locally
- [x] Documentation updated

---

## 🎯 Ready to Deploy!

Your codebase is production-ready. Simply push to GitHub and Netlify will handle the rest.

```bash
git push origin main
```

**Contact Information:**
- Email: info@hrdigitalconsultingltd.com
- Phone: +254768322488 / +254 758 723112
- Address: Thika Road, Phileo Arcade 1st floor, Nairobi

---

**Last Updated:** January 18, 2026  
**Version:** 1.0.0 - Production Ready
