import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

const ChatContext = createContext()

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

export const ChatProvider = ({ children }) => {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [currentConversation, setCurrentConversation] = useState(null)
  const [loading, setLoading] = useState(false)

  // Load conversations when user changes
  useEffect(() => {
    if (user) {
      loadConversations()
    } else {
      setConversations([])
      setCurrentConversation(null)
    }
  }, [user])

  const loadConversations = async () => {
    if (!user) return
    
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (*)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error loading conversations:', error)
        setConversations([])
        return
      }

      // Transform the data to match the existing format
      const transformedConversations = conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        messages: conv.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender,
          timestamp: msg.created_at,
          isError: msg.is_error || false
        })),
        createdAt: conv.created_at,
        updatedAt: conv.updated_at
      }))

      setConversations(transformedConversations)
    } catch (error) {
      console.error('Error loading conversations:', error)
      setConversations([])
    }
  }

  const createNewConversation = async (title = 'New Conversation') => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      const newConversation = {
        id: conversation.id,
        title: conversation.title,
        messages: [],
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at
      }
      
      const updatedConversations = [newConversation, ...conversations]
      setConversations(updatedConversations)
      setCurrentConversation(newConversation)
      
      return newConversation
    } catch (error) {
      console.error('Error creating conversation:', error)
      throw error
    }
  }

  const sendMessage = async (message, conversationId = null) => {
    if (!user) throw new Error('User not authenticated')
    
    let targetConversation = currentConversation
    
    // If no conversation exists, create one
    if (!targetConversation && !conversationId) {
      targetConversation = createNewConversation()
    } else if (conversationId) {
      targetConversation = conversations.find(c => c.id === conversationId)
    }
    
    if (!targetConversation) throw new Error('No conversation found')
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    }
    
    const updatedMessages = [...targetConversation.messages, userMessage]
    
    // Update conversation with user message
    const updatedConversation = {
      ...targetConversation,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
      title: targetConversation.messages.length === 0 ? message.substring(0, 50) + '...' : targetConversation.title
    }
    
    const updatedConversations = conversations.map(c => 
      c.id === updatedConversation.id ? updatedConversation : c
    )
    
    setConversations(updatedConversations)
    setCurrentConversation(updatedConversation)
    saveConversations(updatedConversations)
    
    // Send to n8n webhook and wait for response
    setLoading(true)
    try {
      console.log('Sending message to n8n:', message)
      
      const response = await fetch('https://agents.customcx.com/webhook/HDRC', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          userId: user.id,
          conversationId: updatedConversation.id,
          userProfile: {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            company: user.company,
            role: user.role
          }
        })
      })
      
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('HTTP Error Response:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to send message to AI agent'}`)
      }
      
      // Get response text first to handle different content types
      const responseText = await response.text()
      console.log('Raw response:', responseText)
      
      let responseData
      try {
        responseData = JSON.parse(responseText)
        console.log('Parsed response data:', responseData)
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError)
        // If it's not JSON, treat the text as the message
        responseData = { message: responseText }
      }
      
      // Handle different response formats from n8n
      let aiMessageContent = null
      
      // Check various possible response formats
      if (responseData.message) {
        aiMessageContent = responseData.message
      } else if (responseData.response) {
        aiMessageContent = responseData.response
      } else if (responseData.text) {
        aiMessageContent = responseData.text
      } else if (responseData.content) {
        aiMessageContent = responseData.content
      } else if (responseData.output) {
        aiMessageContent = responseData.output
      } else if (typeof responseData === 'string') {
        aiMessageContent = responseData
      } else if (responseData.data && typeof responseData.data === 'string') {
        aiMessageContent = responseData.data
      } else {
        // If response is an object but no recognized message field, stringify it
        aiMessageContent = JSON.stringify(responseData, null, 2)
      }
      
      if (aiMessageContent) {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          content: aiMessageContent,
          sender: 'ai',
          timestamp: new Date().toISOString()
        }
        
        const finalMessages = [...updatedMessages, aiMessage]
        const finalConversation = {
          ...updatedConversation,
          messages: finalMessages,
          updatedAt: new Date().toISOString()
        }
        
        const finalConversations = conversations.map(c => 
          c.id === finalConversation.id ? finalConversation : c
        )
        
        setConversations(finalConversations)
        setCurrentConversation(finalConversation)
        saveConversations(finalConversations)
        
        return aiMessage
      }
      
      // If no message content found, show error
      console.error('No message content found in response:', responseData)
      throw new Error('No message content received from AI agent')
      
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Add error message
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I encountered an issue processing your request. Please try again.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
        isError: true
      }
      
      const errorMessages = [...updatedMessages, errorMessage]
      const errorConversation = {
        ...updatedConversation,
        messages: errorMessages,
        updatedAt: new Date().toISOString()
      }
      
      const errorConversations = conversations.map(c => 
        c.id === errorConversation.id ? errorConversation : c
      )
      
      setConversations(errorConversations)
      setCurrentConversation(errorConversation)
      saveConversations(errorConversations)
      
      throw error
    } finally {
      setLoading(false)
    }
  }

  const pollForResponse = async (requestId, conversation, messages, maxAttempts = 30) => {
    let attempts = 0
    const pollInterval = 2000 // 2 seconds
    
    const poll = async () => {
      try {
        attempts++
        
        // Poll the n8n webhook for response
        const response = await fetch(`https://agents.customcx.com/webhook/HDRC/status/${requestId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          
          if (data.status === 'completed' && data.message) {
            // Response received, add AI message
            const aiMessage = {
              id: (Date.now() + 1).toString(),
              content: data.message,
              sender: 'ai',
              timestamp: new Date().toISOString()
            }
            
            const finalMessages = [...messages, aiMessage]
            const finalConversation = {
              ...conversation,
              messages: finalMessages,
              updatedAt: new Date().toISOString()
            }
            
            // Update conversations state
            setConversations(prevConversations => {
              const updatedConversations = prevConversations.map(c => 
                c.id === finalConversation.id ? finalConversation : c
              )
              saveConversations(updatedConversations)
              return updatedConversations
            })
            setCurrentConversation(finalConversation)
            setLoading(false)
            return
          }
          
          if (data.status === 'failed') {
            throw new Error(data.error || 'AI processing failed')
          }
        }
        
        // Continue polling if not completed and haven't exceeded max attempts
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval)
        } else {
          throw new Error('Response timeout - please try again')
        }
        
      } catch (error) {
        console.error('Polling error:', error)
        
        // Add timeout/error message
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          content: 'I apologize, but the response is taking longer than expected. Please try again.',
          sender: 'ai',
          timestamp: new Date().toISOString(),
          isError: true
        }
        
        const errorMessages = [...messages, errorMessage]
        const errorConversation = {
          ...conversation,
          messages: errorMessages,
          updatedAt: new Date().toISOString()
        }
        
        // Update conversations state
        setConversations(prevConversations => {
          const updatedConversations = prevConversations.map(c => 
            c.id === errorConversation.id ? errorConversation : c
          )
          saveConversations(updatedConversations)
          return updatedConversations
        })
        setCurrentConversation(errorConversation)
        setLoading(false)
      }
    }
    
    // Start polling after a short delay
    setTimeout(poll, pollInterval)
  }

  const deleteConversation = (conversationId) => {
    const updatedConversations = conversations.filter(c => c.id !== conversationId)
    setConversations(updatedConversations)
    saveConversations(updatedConversations)
    
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null)
    }
  }

  const selectConversation = (conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId)
    setCurrentConversation(conversation || null)
  }

  const clearAllConversations = () => {
    setConversations([])
    setCurrentConversation(null)
    if (user) {
      localStorage.removeItem(`hrdc_chats_${user.id}`)
    }
  }

  const value = {
    conversations,
    currentConversation,
    loading,
    createNewConversation,
    sendMessage,
    deleteConversation,
    selectConversation,
    clearAllConversations
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}
