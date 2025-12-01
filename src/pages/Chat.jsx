import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useChat } from '../contexts/ChatContext'
import UsageLimitBanner from '../components/UsageLimitBanner'
import SubscriptionModal from '../components/SubscriptionModal'
import { checkUsageLimit, incrementUsageCount } from '../lib/paystack'
import { 
  Send, 
  Plus, 
  Trash2, 
  Download, 
  MessageSquare,
  Bot,
  User,
  Clock,
  AlertCircle,
  ExternalLink
} from 'lucide-react'
import { format } from 'date-fns'
import jsPDF from 'jspdf'

const Chat = () => {
  const { user } = useAuth()
  const { 
    conversations, 
    currentConversation, 
    loading,
    createNewConversation,
    sendMessage,
    deleteConversation,
    selectConversation
  } = useChat()
  
  const [message, setMessage] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [usageData, setUsageData] = useState(null)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Function to detect URLs and render them as clickable links
  const renderMessageWithLinks = (text, isUserMessage = false) => {
    // URL regex pattern that matches http, https, and www URLs
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi
    
    if (!urlRegex.test(text)) {
      return text
    }

    const parts = text.split(urlRegex)
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        // Ensure URL has protocol
        const url = part.startsWith('www.') ? `https://${part}` : part
        
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`chat-link ${
              isUserMessage 
                ? 'text-primary-100 hover:text-white' 
                : 'text-primary-600 hover:text-primary-800'
            }`}
          >
            {part}
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        )
      }
      return part
    })
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentConversation?.messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [message])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!message.trim() || loading) return

    // Check usage limit before sending message (temporarily disabled)
    try {
      const usage = await checkUsageLimit(user.id)
      setUsageData(usage)
      
      if (!usage.can_query) {
        setShowUpgradeModal(true)
        return
      }
    } catch (error) {
      console.error('Error checking usage limit:', error)
      // Continue anyway if payment tables don't exist yet
    }

    const messageToSend = message.trim()
    setMessage('')
    
    try {
      // Increment usage count before sending (temporarily disabled)
      try {
        await incrementUsageCount(user.id)
      } catch (error) {
        console.error('Error incrementing usage:', error)
        // Continue anyway if payment tables don't exist yet
      }
      
      await sendMessage(messageToSend)
      
      // Refresh usage data after successful message
      try {
        const updatedUsage = await checkUsageLimit(user.id)
        setUsageData(updatedUsage)
      } catch (error) {
        console.error('Error updating usage:', error)
        // Continue anyway
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleNewChat = () => {
    createNewConversation()
    setSidebarOpen(false)
  }

  const handleDeleteConversation = (conversationId, e) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      deleteConversation(conversationId)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const exportToPDF = () => {
    if (!currentConversation || currentConversation.messages.length === 0) return

    try {
      console.log('Starting PDF export...')
      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.width
      const margin = 20
      const maxWidth = pageWidth - 2 * margin
      let yPosition = margin

      // Title
      pdf.setFontSize(16)
      pdf.setFont(undefined, 'bold')
      pdf.text('HR Digital Consulting - Conversation Export', margin, yPosition)
      yPosition += 10

      // Conversation details
      pdf.setFontSize(10)
      pdf.setFont(undefined, 'normal')
      pdf.text(`Title: ${currentConversation.title}`, margin, yPosition)
      yPosition += 6
      pdf.text(`Date: ${format(new Date(currentConversation.createdAt), 'PPP')}`, margin, yPosition)
      yPosition += 6
      pdf.text(`User: ${user.firstName} ${user.lastName} (${user.role})`, margin, yPosition)
      yPosition += 15

      // Messages
      currentConversation.messages.forEach((msg, index) => {
        const isUser = msg.sender === 'user'
        const sender = isUser ? 'You' : 'HR Consultant'
        
        // Check if we need a new page
        if (yPosition > pdf.internal.pageSize.height - 40) {
          pdf.addPage()
          yPosition = margin
        }

        // Sender and timestamp
        pdf.setFont(undefined, 'bold')
        pdf.setFontSize(10)
        const timestamp = msg.timestamp || msg.created_at || new Date().toISOString()
        pdf.text(`${sender} - ${format(new Date(timestamp), 'HH:mm')}`, margin, yPosition)
        yPosition += 8

        // Message content
        pdf.setFont(undefined, 'normal')
        pdf.setFontSize(9)
        const lines = pdf.splitTextToSize(msg.content, maxWidth)
        pdf.text(lines, margin, yPosition)
        yPosition += lines.length * 4 + 8
      })

      // Footer
      const pageCount = pdf.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.text(
          `Generated by HR Digital Consulting - Page ${i} of ${pageCount}`,
          margin,
          pdf.internal.pageSize.height - 10
        )
      }

      console.log('PDF generation complete, saving file...')
      pdf.save(`HR-Consultation-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`)
      console.log('PDF saved successfully!')
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  return (
    <div className="flex h-screen bg-secondary-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-secondary-200">
            <button
              onClick={handleNewChat}
              className="w-full btn-primary flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Conversation
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {conversations.length > 0 ? (
              <div className="p-4 space-y-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      selectConversation(conversation.id)
                      setSidebarOpen(false)
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                      currentConversation?.id === conversation.id
                        ? 'bg-primary-50 border border-primary-200'
                        : 'hover:bg-secondary-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-secondary-900 truncate text-sm">
                          {conversation.title}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="h-3 w-3 text-secondary-400" />
                          <span className="text-xs text-secondary-500">
                            {format(new Date(conversation.updatedAt), 'MMM d')}
                          </span>
                        </div>
                        <p className="text-xs text-secondary-600 mt-1">
                          {conversation.messages.length} messages
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteConversation(conversation.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-secondary-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-secondary-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-secondary-300" />
                <p className="text-sm">No conversations yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Usage Limit Banner */}
        <UsageLimitBanner onUsageUpdate={(data) => setUsageData(data)} />

        {/* Chat Header */}
        <div className="bg-white border-b border-secondary-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-secondary-600 hover:text-secondary-900"
              >
                <MessageSquare className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-secondary-900">
                  {currentConversation?.title || 'HR Digital Consulting'}
                </h1>
                <p className="text-sm text-secondary-600">
                  Ask questions about GDPR, employment law, data security, and more
                </p>
              </div>
            </div>
            {currentConversation && currentConversation.messages.length > 0 && (
              <button
                onClick={exportToPDF}
                className="btn-secondary flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </button>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {currentConversation && currentConversation.messages.length > 0 ? (
            <div className="space-y-4 max-w-6xl mx-auto">
              {currentConversation.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-sm sm:max-w-lg lg:max-w-2xl xl:max-w-4xl ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === 'user' ? 'bg-primary-600' : 'bg-secondary-200'}`}>
                      {msg.sender === 'user' ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-secondary-600" />
                      )}
                    </div>
                    <div className={`rounded-2xl px-4 py-2 ${msg.sender === 'user' ? 'bg-primary-600 text-white rounded-br-md' : 'bg-white border border-secondary-200 rounded-bl-md'}`}>
                      <p className="text-sm whitespace-pre-wrap">
                        {renderMessageWithLinks(msg.content, msg.sender === 'user')}
                      </p>
                      <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-100' : 'text-secondary-500'}`}>
                        {format(new Date(msg.timestamp), 'HH:mm')}
                      </p>
                      {msg.isError && (
                        <div className="flex items-center space-x-1 mt-1">
                          <AlertCircle className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-red-600">Failed to send</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-sm sm:max-w-lg lg:max-w-2xl xl:max-w-4xl">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary-200 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-secondary-600" />
                    </div>
                    <div className="bg-white border border-secondary-200 rounded-2xl rounded-bl-md px-4 py-2">
                      <div className="typing-indicator">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <Bot className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-secondary-900 mb-2">
                  Welcome to HR Digital Consulting
                </h2>
                <p className="text-secondary-600 mb-6">
                  I'm here to help you with questions about GDPR compliance, employment law, 
                  data security, AI systems, and HR policies. What would you like to know?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <button
                    onClick={() => setMessage('What are the key requirements for GDPR compliance?')}
                    className="p-3 text-left border border-secondary-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    GDPR compliance requirements
                  </button>
                  <button
                    onClick={() => setMessage('How should we handle employee data breaches?')}
                    className="p-3 text-left border border-secondary-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    Data breach protocols
                  </button>
                  <button
                    onClick={() => setMessage('What are best practices for AI system governance?')}
                    className="p-3 text-left border border-secondary-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    AI governance best practices
                  </button>
                  <button
                    onClick={() => setMessage('Help me create a remote work policy')}
                    className="p-3 text-left border border-secondary-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    Remote work policies
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-secondary-200 p-4">
          <form onSubmit={handleSendMessage} className="max-w-6xl mx-auto">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about GDPR, employment law, data security, AI systems..."
                  className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none overflow-hidden"
                  rows="1"
                  style={{ minHeight: '44px', maxHeight: '120px', height: 'auto' }}
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={!message.trim() || loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-11 h-11"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
          
          {/* CustomCX Footer */}
          <div className="text-center mt-3 pb-2">
            <p className="text-xs text-secondary-500">
              Powered by{' '}
              <a 
                href="https://customcx.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-800 underline transition-colors"
              >
                CustomCX
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSubscriptionUpdate={() => {
          // Refresh usage data after subscription update
          checkUsageLimit(user.id).then(setUsageData)
        }}
      />
    </div>
  )
}

export default Chat
