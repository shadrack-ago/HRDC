# Webhook Integration for Subscription Checking

## 🎯 **Overview**

Your n8n webhook at `https://agents.customcx.com/webhook/HDRC` needs to be updated to check user subscription status before responding to queries.

## 🔧 **Required Webhook Updates**

### **1. Add Subscription Check Logic**

Update your n8n workflow to include these steps:

```javascript
// 1. Extract user ID from the incoming request
const userId = $json.userId;

// 2. Check user's subscription status in Supabase
const subscriptionCheck = await fetch('https://your-supabase-url.supabase.co/rest/v1/rpc/get_user_subscription', {
  method: 'POST',
  headers: {
    'apikey': 'your-supabase-anon-key',
    'Authorization': 'Bearer your-supabase-anon-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ user_id: userId })
});

const subscription = await subscriptionCheck.json();

// 3. Check usage limit
const usageCheck = await fetch('https://your-supabase-url.supabase.co/rest/v1/rpc/check_usage_limit', {
  method: 'POST',
  headers: {
    'apikey': 'your-supabase-anon-key',
    'Authorization': 'Bearer your-supabase-anon-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ user_id: userId })
});

const usage = await usageCheck.json();

// 4. Determine if user can query
const canQuery = usage[0]?.can_query || false;

if (!canQuery) {
  return {
    message: "You've reached your daily query limit. Please upgrade to Standard plan for unlimited access.",
    error: true,
    upgrade_required: true
  };
}

// 5. If user can query, proceed with normal AI response
// ... your existing AI logic here ...
```

### **2. Alternative: Simple Header-Based Check**

If you prefer a simpler approach, you can check subscription in your frontend and pass it as a header:

**Frontend (ChatContext.jsx):**
```javascript
// Before sending to webhook, check subscription
const usage = await checkUsageLimit(user.id);
if (!usage.can_query) {
  throw new Error('Usage limit exceeded');
}

// Send request with subscription info
const response = await fetch('https://agents.customcx.com/webhook/HDRC', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Plan': subscription.plan_type,
    'X-Can-Query': usage.can_query.toString()
  },
  body: JSON.stringify({
    message: message,
    userId: user.id,
    conversationId: conversationId,
    userProfile: userProfile
  })
});
```

**Webhook (n8n):**
```javascript
// Check headers in webhook
const canQuery = $node["Webhook"].json.headers['x-can-query'] === 'true';
const userPlan = $node["Webhook"].json.headers['x-user-plan'];

if (!canQuery) {
  return {
    message: "Usage limit exceeded. Please upgrade your plan.",
    error: true
  };
}

// Continue with AI processing...
```

## 📋 **Implementation Steps**

### **Step 1: Update Your .env File**
Add these Paystack environment variables:
```env
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
VITE_PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
```

### **Step 2: Run Database Schema**
Execute the `paystack-schema.sql` in your Supabase SQL Editor to create the subscription tables.

### **Step 3: Get Paystack Keys**
1. Sign up at [Paystack](https://paystack.com)
2. Get your test keys from the dashboard
3. Add them to your environment variables

### **Step 4: Test the Flow**
1. Register a new user (gets free plan automatically)
2. Send 2 messages (should work)
3. Try to send 3rd message (should show upgrade prompt)
4. Complete payment (should unlock unlimited access)

## 🎯 **User Flow**

### **Free Users (2 queries/day):**
1. ✅ **Query 1-2**: Normal AI response
2. ❌ **Query 3+**: "Upgrade required" message from webhook

### **Paid Users (unlimited):**
1. ✅ **All queries**: Normal AI response
2. 🔄 **Auto-renewal**: Monthly subscription

## 🔒 **Security Considerations**

1. **Validate subscription server-side** in your webhook
2. **Don't trust client-side subscription status** alone
3. **Use Supabase RLS policies** to protect subscription data
4. **Verify Paystack webhooks** for payment confirmations

## 📊 **Monitoring & Analytics**

Track these metrics:
- Daily query usage per user
- Conversion rate from free to paid
- Subscription renewal rates
- Revenue per user

## 🚀 **Ready to Deploy!**

The payment system is now fully integrated with:
- ✅ **Database schema** for subscriptions
- ✅ **Usage tracking** and limits
- ✅ **Payment UI** with Paystack
- ✅ **Frontend integration** in chat
- ✅ **Webhook guidance** for backend

Just add your Paystack keys and update your webhook logic! 🎉
