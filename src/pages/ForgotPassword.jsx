import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Shield, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (!email.trim()) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        throw error
      }

      setEmailSent(true)
      setMessage('Password reset email sent! Please check your inbox.')
    } catch (err) {
      setError(err.message || 'Failed to send password reset email')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setEmail(e.target.value)
    if (error) setError('')
    if (message) setMessage('')
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="gradient-bg p-3 rounded-lg w-fit mx-auto mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-secondary-900">
              Check Your Email
            </h2>
            <p className="mt-2 text-secondary-600">
              We've sent password reset instructions to your email
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-medium text-green-900">Email Sent Successfully</h3>
                <p className="text-sm text-green-700">
                  Check your inbox for password reset instructions.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p className="mb-2">We've sent a password reset link to:</p>
                <p className="font-medium text-gray-900">{email}</p>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <span className="font-medium">1.</span>
                  <span>Check your email inbox (and spam folder)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium">2.</span>
                  <span>Click the reset password link in the email</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium">3.</span>
                  <span>Create a new password</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-3">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={() => {
                  setEmailSent(false)
                  setEmail('')
                  setMessage('')
                }}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Try again with a different email
              </button>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="gradient-bg p-3 rounded-lg w-fit mx-auto mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-secondary-900">
            Reset Password
          </h2>
          <p className="mt-2 text-secondary-600">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-green-700 text-sm">{message}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="Enter your email address"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  <span>Send Reset Link</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
