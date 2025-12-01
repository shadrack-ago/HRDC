import React, { useState } from 'react'
import { X, Check, CreditCard, Zap, Shield, Users } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { SUBSCRIPTION_PLANS, initializePayment, updateSubscription } from '../lib/paystack'

const SubscriptionModal = ({ isOpen, onClose, onSubscriptionUpdate }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('standard')

  if (!isOpen) return null

  const handlePayment = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Initialize payment with Paystack
      const { config } = await initializePayment(user, selectedPlan)
      
      // Load Paystack script if not already loaded
      if (!window.PaystackPop) {
        const script = document.createElement('script')
        script.src = 'https://js.paystack.co/v1/inline.js'
        script.onload = () => {
          initiatePayment(config)
        }
        document.head.appendChild(script)
      } else {
        initiatePayment(config)
      }
    } catch (error) {
      console.error('Payment initialization failed:', error)
      alert('Failed to initialize payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const initiatePayment = (config) => {
    const handler = window.PaystackPop.setup({
      ...config,
      callback: function(response) {
        // Handle async operations inside but don't make function async
        updateSubscription(user.id, response)
          .then(() => {
            // Notify parent component
            if (onSubscriptionUpdate) {
              onSubscriptionUpdate()
            }
            
            alert('Payment successful! Your subscription has been activated.')
            onClose()
          })
          .catch((error) => {
            console.error('Subscription update failed:', error)
            alert('Payment successful but subscription update failed. Please contact support with reference: ' + response.reference)
          })
      },
      onClose: function() {
        console.log('Payment window closed')
      }
    })
    
    handler.openIframe()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Upgrade Your Plan</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              You've reached your daily query limit
            </h3>
            <p className="text-gray-600">
              Upgrade to Standard plan for unlimited queries and premium features
            </p>
          </div>

          {/* Plan Comparison */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Free Plan */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Free Plan</h4>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  KES 0<span className="text-sm font-normal text-gray-500">/month</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                {SUBSCRIPTION_PLANS.free.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <div className="text-center">
                <span className="text-sm text-gray-500">Current Plan</span>
              </div>
            </div>

            {/* Standard Plan */}
            <div className="border-2 border-primary-500 rounded-lg p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  RECOMMENDED
                </span>
              </div>
              
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Standard Plan</h4>
                <div className="text-3xl font-bold text-primary-600 mt-2">
                  KES 3,000<span className="text-sm font-normal text-gray-500">/month</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                {SUBSCRIPTION_PLANS.standard.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Processing...' : 'Upgrade Now'}
              </button>
            </div>
          </div>

          {/* Features Highlight */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="h-5 w-5 text-primary-500 mr-2" />
              Why Upgrade to Standard?
            </h4>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="bg-primary-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary-600" />
                </div>
                <h5 className="font-medium text-gray-900 mb-1">Unlimited Queries</h5>
                <p className="text-xs text-gray-600">Ask as many questions as you need</p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary-600" />
                </div>
                <h5 className="font-medium text-gray-900 mb-1">Priority Support</h5>
                <p className="text-xs text-gray-600">Get faster response times</p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary-600" />
                </div>
                <h5 className="font-medium text-gray-900 mb-1">Advanced Features</h5>
                <p className="text-xs text-gray-600">Access to premium tools</p>
              </div>
            </div>
          </div>

          {/* Payment Security */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                Secure Payment
              </div>
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 mr-1" />
                Powered by Paystack
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Your payment information is encrypted and secure
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionModal
