// Paystack Integration Library
import { supabase } from './supabase'

// Paystack configuration
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
const PAYSTACK_SECRET_KEY = import.meta.env.VITE_PAYSTACK_SECRET_KEY // Only for server-side operations

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free Plan',
    price: 0,
    currency: 'KES',
    queryLimit: 2,
    features: ['2 queries per day', 'Basic support']
  },
  standard: {
    name: 'Standard Plan',
    price: 3000,
    currency: 'KES',
    queryLimit: 'unlimited',
    features: ['Unlimited queries', 'Priority support', 'Advanced features']
  }
}

// Initialize Paystack payment
export const initializePayment = async (user, plan = 'standard') => {
  try {
    const planDetails = SUBSCRIPTION_PLANS[plan]
    const reference = `hrdc_${user.id}_${Date.now()}`
    
    // Create transaction record in database
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        paystack_reference: reference,
        amount: planDetails.price,
        currency: planDetails.currency,
        status: 'pending',
        metadata: {
          plan_type: plan,
          user_email: user.email,
          user_name: `${user.firstName} ${user.lastName}`
        }
      })
      .select()
      .single()

    if (error) {
      throw new Error('Failed to create transaction record')
    }

    // Paystack payment configuration
    const paymentConfig = {
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: planDetails.price * 100, // Paystack expects amount in kobo (smallest currency unit)
      currency: planDetails.currency,
      reference: reference,
      callback: function(response) {
        // This will be handled by the component
        console.log('Payment successful:', response)
      },
      onClose: function() {
        console.log('Payment window closed')
      },
      metadata: {
        custom_fields: [
          {
            display_name: "Plan Type",
            variable_name: "plan_type",
            value: plan
          },
          {
            display_name: "User ID",
            variable_name: "user_id", 
            value: user.id
          }
        ]
      }
    }

    return {
      config: paymentConfig,
      transaction: transaction
    }
  } catch (error) {
    console.error('Error initializing payment:', error)
    throw error
  }
}

// Verify payment status using Supabase Edge Function
export const verifyPayment = async (reference) => {
  try {
    // Call Supabase Edge Function for secure payment verification
    const response = await supabase.functions.invoke('verify-payment', {
      body: { reference }
    })

    if (response.error) {
      throw new Error(response.error.message || 'Payment verification failed')
    }

    return response.data
  } catch (error) {
    console.error('Error verifying payment:', error)
    throw error
  }
}

// Update subscription after successful payment
export const updateSubscription = async (userId, transactionData) => {
  try {
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1) // 1 month subscription

    // Update or create subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan_type: 'standard',
        status: 'active',
        paystack_subscription_id: transactionData.id,
        paystack_customer_id: transactionData.customer?.id,
        amount_paid: transactionData.amount / 100, // Convert from kobo
        currency: transactionData.currency,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (subError) {
      throw new Error('Failed to update subscription')
    }

    // Update transaction status
    const { error: transError } = await supabase
      .from('payment_transactions')
      .update({
        status: 'success',
        paystack_transaction_id: transactionData.id,
        updated_at: new Date().toISOString()
      })
      .eq('paystack_reference', transactionData.reference)

    if (transError) {
      console.error('Failed to update transaction status:', transError)
    }

    return subscription
  } catch (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
}

// Get user's current subscription status
export const getUserSubscription = async (userId) => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_subscription', { user_id: userId })

    if (error) {
      throw error
    }

    return data[0] || { plan_type: 'free', status: 'active', is_active: true }
  } catch (error) {
    console.error('Error getting user subscription:', error)
    return { plan_type: 'free', status: 'active', is_active: true }
  }
}

// Check if user can make a query
export const checkUsageLimit = async (userId) => {
  try {
    const { data, error } = await supabase
      .rpc('check_usage_limit', { user_id: userId })

    if (error) {
      throw error
    }

    return data[0] || { queries_today: 0, limit_reached: false, can_query: true }
  } catch (error) {
    console.error('Error checking usage limit:', error)
    return { queries_today: 0, limit_reached: false, can_query: true }
  }
}

// Increment usage count
export const incrementUsageCount = async (userId) => {
  try {
    const { error } = await supabase
      .rpc('increment_usage_count', { user_id: userId })

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error('Error incrementing usage count:', error)
    return false
  }
}
