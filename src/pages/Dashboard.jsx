import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useChat } from '../contexts/ChatContext'
import { 
  MessageSquare, 
  FileText, 
  Clock, 
  TrendingUp,
  Shield,
  Brain,
  Users,
  Lock,
  Plus,
  ArrowRight
} from 'lucide-react'
import { format } from 'date-fns'

const Dashboard = () => {
  const { user } = useAuth()
  const { conversations, createNewConversation } = useChat()

  const recentConversations = conversations.slice(0, 5)
  const totalMessages = conversations.reduce((acc, conv) => acc + conv.messages.length, 0)

  const quickTopics = [
    {
      icon: Shield,
      title: 'GDPR Compliance',
      description: 'Data protection and privacy regulations',
      color: 'bg-blue-500'
    },
    {
      icon: FileText,
      title: 'Employment Law',
      description: 'Contracts, policies, and workplace rights',
      color: 'bg-green-500'
    },
    {
      icon: Brain,
      title: 'AI Systems',
      description: 'AI governance and ethical implementation',
      color: 'bg-purple-500'
    },
    {
      icon: Lock,
      title: 'Data Security',
      description: 'Security frameworks and breach protocols',
      color: 'bg-red-500'
    },
    {
      icon: Users,
      title: 'HR Policies',
      description: 'Workplace guidelines and procedures',
      color: 'bg-yellow-500'
    }
  ]

  const handleQuickStart = (topic) => {
    const conversation = createNewConversation(`${topic.title} Consultation`)
    // Navigate to chat would happen here, but we'll let the user click the chat link
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-secondary-600">
          Ready to get expert HR and legal guidance? Start a new consultation or continue a previous conversation.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="bg-primary-100 p-3 rounded-lg">
              <MessageSquare className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-secondary-900">{conversations.length}</p>
              <p className="text-secondary-600">Consultations</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-secondary-900">{totalMessages}</p>
              <p className="text-secondary-600">Total Messages</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-secondary-900">
                {user.role}
              </p>
              <p className="text-secondary-600">Your Role</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Quick Start Section */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-secondary-900">
                Quick Start Topics
              </h2>
              <Link to="/chat" className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Link>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {quickTopics.map((topic, index) => (
                <Link
                  key={index}
                  to="/chat"
                  className="p-4 border border-secondary-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`${topic.color} p-2 rounded-lg`}>
                      <topic.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-secondary-900 group-hover:text-primary-700 transition-colors">
                        {topic.title}
                      </h3>
                      <p className="text-sm text-secondary-600 mt-1">
                        {topic.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-secondary-400 group-hover:text-primary-600 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="card">
          <h2 className="text-xl font-semibold text-secondary-900 mb-6">
            Recent Conversations
          </h2>
          
          {recentConversations.length > 0 ? (
            <div className="space-y-4">
              {recentConversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  to="/chat"
                  className="block p-3 border border-secondary-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-secondary-900 truncate">
                        {conversation.title}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="h-3 w-3 text-secondary-400" />
                        <span className="text-xs text-secondary-500">
                          {format(new Date(conversation.updatedAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="text-xs text-secondary-600 mt-1">
                        {conversation.messages.length} messages
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                  </div>
                </Link>
              ))}
              
              {conversations.length > 5 && (
                <Link
                  to="/chat"
                  className="block text-center py-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View all conversations
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-600 mb-4">
                No conversations yet
              </p>
              <Link to="/chat" className="btn-primary">
                Start Your First Chat
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 card gradient-bg text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">
              Need Help Getting Started?
            </h2>
            <p className="text-blue-100">
              Our AI consultant is ready to help with GDPR, employment law, data security, and more.
            </p>
          </div>
          <Link
            to="/chat"
            className="bg-white text-primary-600 hover:bg-blue-50 font-semibold py-2 px-6 rounded-lg transition-colors flex-shrink-0 ml-6"
          >
            Ask a Question
          </Link>
        </div>
      </div>

      {/* Terms and Conditions Notice */}
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <div className="bg-amber-100 p-2 rounded-lg">
            <FileText className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              Important: Terms and Conditions
            </h3>
            <p className="text-amber-800 text-sm mb-3">
              Please review our updated Terms and Conditions to understand your rights and responsibilities when using HR Digital Consulting services.
            </p>
            <div className="flex items-center space-x-4">
              <Link
                to="/terms-and-conditions"
                className="text-amber-700 hover:text-amber-900 font-medium text-sm underline"
              >
                Read Full Terms & Conditions
              </Link>
              <span className="text-amber-600 text-sm">•</span>
              <span className="text-amber-600 text-sm">
                Last updated: January 18, 2026
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
