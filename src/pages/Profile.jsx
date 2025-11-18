import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useChat } from '../contexts/ChatContext'
import { 
  User, 
  Mail, 
  Building, 
  Briefcase, 
  Save, 
  Trash2, 
  Download,
  AlertTriangle,
  CheckCircle,
  Shield
} from 'lucide-react'

const Profile = () => {
  const { user, updateProfile, deleteAccount } = useAuth()
  const { conversations, clearAllConversations } = useChat()
  
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    company: user.company,
    role: user.role
  })
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const roles = [
    'HR Manager',
    'HR Director',
    'HR Business Partner',
    'HR Specialist',
    'People Operations Manager',
    'Talent Acquisition Manager',
    'Compliance Officer',
    'Legal Counsel',
    'Data Protection Officer',
    'General Manager',
    'Operations Manager',
    'Other'
  ]

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const showMessage = (text, type = 'success') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => {
      setMessage('')
      setMessageType('')
    }, 5000)
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await updateProfile(formData)
      showMessage('Profile updated successfully!')
    } catch (error) {
      showMessage(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = () => {
    const userData = {
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        company: user.company,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      conversations: conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messageCount: conv.messages.length,
        messages: conv.messages.map(msg => ({
          content: msg.content,
          sender: msg.sender,
          timestamp: msg.timestamp
        }))
      })),
      exportedAt: new Date().toISOString()
    }

    const dataStr = JSON.stringify(userData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hrdc-data-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showMessage('Data exported successfully!')
  }

  const handleClearConversations = () => {
    if (window.confirm('Are you sure you want to delete all conversations? This action cannot be undone.')) {
      clearAllConversations()
      showMessage('All conversations deleted successfully!')
    }
  }

  const handleDeleteAccount = async () => {
    const confirmText = 'DELETE'
    const userInput = window.prompt(
      `This will permanently delete your account and all data. This action cannot be undone.\n\nType "${confirmText}" to confirm:`
    )

    if (userInput === confirmText) {
      try {
        await deleteAccount()
        showMessage('Account deleted successfully. You will be redirected shortly.')
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      } catch (error) {
        showMessage(error.message, 'error')
      }
    }
  }

  const totalMessages = conversations.reduce((acc, conv) => acc + conv.messages.length, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Profile Settings
        </h1>
        <p className="text-secondary-600">
          Manage your account information and data preferences
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
          messageType === 'error' 
            ? 'bg-red-50 border border-red-200 text-red-700' 
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {messageType === 'error' ? (
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span>{message}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-900 mb-6">
              Personal Information
            </h2>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-secondary-700 mb-1">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="input-field pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-secondary-700 mb-1">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="input-field pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-secondary-700 mb-1">
                  Company
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <input
                    id="company"
                    name="company"
                    type="text"
                    required
                    value={formData.company}
                    onChange={handleChange}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-secondary-700 mb-1">
                  Your Role
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <select
                    id="role"
                    name="role"
                    required
                    value={formData.role}
                    onChange={handleChange}
                    className="input-field pl-10"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Update Profile
              </button>
            </form>
          </div>
        </div>

        {/* Account Stats & Data Management */}
        <div className="space-y-6">
          {/* Account Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Account Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary-600">Conversations</span>
                <span className="font-medium">{conversations.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Total Messages</span>
                <span className="font-medium">{totalMessages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Member Since</span>
                <span className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Data Management
            </h3>
            <div className="space-y-3">
              <button
                onClick={handleExportData}
                className="w-full btn-secondary flex items-center justify-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export My Data
              </button>
              
              <button
                onClick={handleClearConversations}
                className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Chats
              </button>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-2">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  Your Privacy Matters
                </h4>
                <p className="text-sm text-blue-800">
                  All your data is stored locally in your browser. You have full control 
                  over your information and can export or delete it at any time.
                </p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card border-red-200 bg-red-50">
            <h3 className="text-lg font-semibold text-red-900 mb-4">
              Danger Zone
            </h3>
            <p className="text-sm text-red-700 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
