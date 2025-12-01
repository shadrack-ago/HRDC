import React, { useState, useEffect } from 'react'
import { AlertCircle, Zap, CreditCard } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { checkUsageLimit, getUserSubscription } from '../lib/paystack'
import SubscriptionModal from './SubscriptionModal'

const UsageLimitBanner = ({ onUsageUpdate }) => {
  const { user } = useAuth()
  const [usageData, setUsageData] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadUsageData()
    }
  }, [user])

  const loadUsageData = async () => {
    try {
      setLoading(true)
      const [usage, sub] = await Promise.all([
        checkUsageLimit(user.id),
        getUserSubscription(user.id)
      ])
      
      setUsageData(usage)
      setSubscription(sub)
    } catch (error) {
      console.error('Error loading usage data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscriptionUpdate = () => {
    loadUsageData()
    if (onUsageUpdate) {
      onUsageUpdate()
    }
  }

  if (loading || !usageData || !subscription) {
    return null
  }

  // Don't show banner for standard plan users
  if (subscription.plan_type === 'standard' && subscription.is_active) {
    return null
  }

  const remainingQueries = Math.max(0, 2 - usageData.queries_today)
  const isLimitReached = usageData.limit_reached

  return (
    <>
      <div className={`mx-4 mb-4 rounded-lg border p-4 ${
        isLimitReached 
          ? 'bg-red-50 border-red-200' 
          : remainingQueries === 1 
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 ${
            isLimitReached 
              ? 'text-red-500' 
              : remainingQueries === 1 
                ? 'text-yellow-500'
                : 'text-blue-500'
          }`}>
            {isLimitReached ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <Zap className="h-5 w-5" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-medium ${
              isLimitReached 
                ? 'text-red-800' 
                : remainingQueries === 1 
                  ? 'text-yellow-800'
                  : 'text-blue-800'
            }`}>
              {isLimitReached 
                ? 'Daily Query Limit Reached' 
                : `${remainingQueries} ${remainingQueries === 1 ? 'Query' : 'Queries'} Remaining Today`
              }
            </h3>
            
            <div className={`mt-1 text-sm ${
              isLimitReached 
                ? 'text-red-700' 
                : remainingQueries === 1 
                  ? 'text-yellow-700'
                  : 'text-blue-700'
            }`}>
              {isLimitReached ? (
                <p>
                  You've used all 2 free queries for today. Upgrade to Standard plan for unlimited access.
                </p>
              ) : (
                <p>
                  You're on the Free plan with 2 queries per day. 
                  {remainingQueries === 1 && ' Consider upgrading for unlimited access.'}
                </p>
              )}
            </div>

            {/* Usage Progress Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={isLimitReached ? 'text-red-600' : 'text-gray-600'}>
                  Daily Usage
                </span>
                <span className={isLimitReached ? 'text-red-600' : 'text-gray-600'}>
                  {usageData.queries_today}/2
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isLimitReached 
                      ? 'bg-red-500' 
                      : usageData.queries_today === 1 
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${(usageData.queries_today / 2) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {(isLimitReached || remainingQueries === 1) && (
            <div className="flex-shrink-0">
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="btn-primary text-xs px-3 py-1 flex items-center"
              >
                <CreditCard className="h-3 w-3 mr-1" />
                Upgrade
              </button>
            </div>
          )}
        </div>
      </div>

      <SubscriptionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSubscriptionUpdate={handleSubscriptionUpdate}
      />
    </>
  )
}

export default UsageLimitBanner
