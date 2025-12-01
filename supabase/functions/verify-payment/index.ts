// Supabase Edge Function for payment verification
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables (stored securely in Supabase)
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured')
    }

    const { reference } = await req.json()

    // Verify payment with Paystack API
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Payment verification failed')
    }

    const paymentData = await response.json()

    if (paymentData.status && paymentData.data.status === 'success') {
      // Create Supabase client with service role (bypass RLS)
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

      // Update subscription in database?
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 1) // 1 month subscription

      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: paymentData.data.metadata.user_id,
          plan_type: 'standard',
          status: 'active',
          paystack_subscription_id: paymentData.data.id,
          paystack_customer_id: paymentData.data.customer?.id,
          amount_paid: paymentData.data.amount / 100,
          currency: paymentData.data.currency,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        throw new Error(`Database update failed: ${error.message}`)
      }

      // Update transaction status
      await supabase
        .from('payment_transactions')
        .update({
          status: 'success',
          paystack_transaction_id: paymentData.data.id,
          updated_at: new Date().toISOString()
        })
        .eq('paystack_reference', reference)

      return new Response(
        JSON.stringify({ 
          success: true, 
          subscription: subscription,
          message: 'Payment verified and subscription updated' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    } else {
      return new Response(
        JSON.stringify({ success: false, message: 'Payment verification failed' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
