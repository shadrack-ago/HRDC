# 🚀 Production Deployment Checklist

## ✅ Pre-Deployment Checks (Complete Before Deploy)

### **1. Environment Variables**

#### **Frontend (.env file):**
- [ ] `VITE_SUPABASE_URL` - Production Supabase URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Production anon key
- [ ] `VITE_PAYSTACK_PUBLIC_KEY` - **LIVE** Paystack key (`pk_live_xxx`)
- [ ] **NO** secret keys in .env file

#### **Supabase Edge Functions Secrets:**
Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets

- [ ] `PAYSTACK_SECRET_KEY` - **LIVE** Paystack secret key (`sk_live_xxx`)
- [ ] `SUPABASE_URL` - Production URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key

---

### **2. Paystack Configuration**

Go to [Paystack Dashboard](https://dashboard.paystack.com):

- [ ] **Switch to Live Mode** (toggle in top right corner)
- [ ] **Copy Live Keys** (Settings → API Keys & Webhooks)
  - Public Key: `pk_live_xxxxx`
  - Secret Key: `sk_live_xxxxx`
- [ ] **Configure Webhook** (if using webhooks for subscription renewals):
  - URL: `https://your-webhook-url/functions/v1/paystack-webhook`
  - Events: `charge.success`, `subscription.create`, `subscription.disable`

---

### **3. Supabase Database**

- [ ] **Run Production Schema** - Ensure `paystack-schema-safe.sql` is executed in production database
- [ ] **Verify Tables Exist:**
  ```sql
  SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
  AND tablename IN ('subscriptions', 'usage_tracking', 'payment_transactions');
  ```
- [ ] **Check RLS Policies** - Run query from earlier session to verify policies
- [ ] **Test Functions:**
  ```sql
  SELECT * FROM get_user_subscription('test-user-id');
  SELECT * FROM check_usage_limit('test-user-id');
  ```

---

### **4. Edge Functions**

- [ ] **Verify `verify-payment` is deployed** in production Supabase
- [ ] **Test function** in Supabase Dashboard → Edge Functions → verify-payment → Invoke
- [ ] **Check logs** for any errors

---

### **5. Code Quality**

- [ ] **No demo credentials** (already removed ✅)
- [ ] **No test API keys** hardcoded in code
- [ ] **Console logs** are for errors only (acceptable ✅)
- [ ] **No sensitive data** logged
- [ ] **.gitignore** includes `.env` file ✅

---

### **6. Security Review**

- [ ] **RLS Policies Active** on all tables
- [ ] **Email verification** configured (optional but recommended)
- [ ] **Password reset** flow tested
- [ ] **Paystack webhook** secured (if using)
- [ ] **CORS** properly configured in Edge Functions

---

### **7. User Experience**

- [ ] **Usage limits** working (2 queries for free users)
- [ ] **Upgrade modal** appears after limit reached
- [ ] **Payment flow** tested end-to-end
- [ ] **Success/error messages** clear and helpful
- [ ] **Mobile responsive** design verified

---

## 🚀 Deployment Steps

### **Option A: Deploy to Netlify**

1. **Connect Repository:**
   ```bash
   git init
   git add .
   git commit -m "Production ready deployment"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Netlify Dashboard:**
   - New site from Git
   - Select your repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Add environment variables (from your .env file)

3. **Deploy:**
   - Click "Deploy site"
   - Wait for deployment to complete

### **Option B: Deploy to Vercel**

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Add Environment Variables:**
   - In Vercel dashboard
   - Settings → Environment Variables
   - Add all VITE_ variables

---

## 🧪 Post-Deployment Testing

### **Test Checklist:**

1. **Authentication:**
   - [ ] Register new user
   - [ ] Login with credentials
   - [ ] Logout
   - [ ] Password reset flow

2. **Free Tier:**
   - [ ] Send first message (should work)
   - [ ] Send second message (should work)
   - [ ] Usage banner updates correctly
   - [ ] Try third message (should show upgrade modal)

3. **Payment Flow:**
   - [ ] Click "Upgrade Now"
   - [ ] Payment modal opens
   - [ ] Complete payment with **REAL CARD** (small amount)
   - [ ] Verify subscription activated
   - [ ] Verify unlimited access granted

4. **Subscription Management:**
   - [ ] Check subscription in database
   - [ ] Verify expiry date is 1 month from now
   - [ ] Test usage tracking for paid users

---

## 📊 Monitoring

### **Track These Metrics:**

1. **User Registrations** - Monitor in Supabase Auth dashboard
2. **Daily Active Users** - Check conversations table
3. **Conversion Rate** - Free to paid ratio
4. **Payment Success Rate** - Check payment_transactions table
5. **Error Logs** - Monitor Edge Functions logs

### **Supabase Monitoring:**
- Dashboard → Logs
- Check for errors in Edge Functions
- Monitor database performance

### **Paystack Monitoring:**
- Dashboard → Transactions
- Monitor successful payments
- Check for failed payments
- Review customer disputes

---

## 🔒 Security Best Practices

- [ ] **Never commit .env file** to git
- [ ] **Rotate keys regularly** (every 90 days)
- [ ] **Monitor suspicious activity** in Supabase logs
- [ ] **Set up alerts** for failed payments
- [ ] **Regular database backups** (Supabase automatic)
- [ ] **Review RLS policies** monthly

---

## 🆘 Rollback Plan

If something goes wrong:

1. **Immediate Issues:**
   - Revert to previous deployment in Netlify/Vercel
   - Check error logs
   - Verify environment variables

2. **Database Issues:**
   - Supabase has automatic backups (Point-in-time recovery)
   - Can restore to any point in last 7 days

3. **Payment Issues:**
   - Contact Paystack support immediately
   - Manually verify transactions in dashboard
   - Refund if necessary

---

## 📞 Support Contacts

- **Supabase Support:** https://supabase.com/support
- **Paystack Support:** support@paystack.com
- **Netlify Support:** https://answers.netlify.com

---

## ✅ Final Checklist Before Going Live

- [ ] All environment variables set correctly
- [ ] Paystack in LIVE mode with live keys
- [ ] Database schema deployed to production
- [ ] Edge functions deployed and tested
- [ ] Payment flow tested with real transaction
- [ ] Monitoring and alerts configured
- [ ] Backup and rollback plan ready
- [ ] Team notified of deployment

---

## 🎉 Post-Launch

After successful deployment:

1. **Monitor for 24 hours** - Watch for errors
2. **Test all critical flows** - Auth, chat, payments
3. **Verify first real payment** - Celebrate! 🎊
4. **Collect user feedback** - Monitor support requests
5. **Plan next features** - Iterate and improve

---

**Good luck with your production launch! 🚀**
