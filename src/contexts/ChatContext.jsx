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

  const promiseWithTimeout = (promise, ms) => {
    let timer
    return Promise.race([
      promise.finally(() => clearTimeout(timer)),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('TIMEOUT')), ms)
      })
    ])
  }

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
      const { data: conversations, error } = await promiseWithTimeout(
        supabase
        .from('conversations')
        .select(`
          *,
          messages (*)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false }),
        3000
      )

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
      const { data: conversation, error } = await promiseWithTimeout(
        supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single(),
        3000
      )

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

  const saveMessageToSupabase = async (conversationId, content, sender, isError = false) => {
    try {
      const { data: message, error } = await promiseWithTimeout(
        supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content,
          sender,
          is_error: isError,
          created_at: new Date().toISOString()
        })
        .select()
        .single(),
        3000
      )

      if (error) {
        throw error
      }

      return {
        id: message.id,
        content: message.content,
        sender: message.sender,
        timestamp: message.created_at,
        isError: message.is_error || false
      }
    } catch (error) {
      console.error('Error saving message:', error)
      throw error
    }
  }

  const updateConversationInSupabase = async (conversationId, updates) => {
    try {
      const { error } = await promiseWithTimeout(
        supabase
        .from('conversations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId),
        3000
      )

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error updating conversation:', error)
      throw error
    }
  }

  const sendMessage = async (message, conversationId = null) => {
    if (!user) throw new Error('User not authenticated')
    
    let targetConversation = currentConversation
    
    // If no conversation exists, create one
    if (!targetConversation && !conversationId) {
      targetConversation = await createNewConversation()
    } else if (conversationId) {
      targetConversation = conversations.find(c => c.id === conversationId)
    }
    
    if (!targetConversation) throw new Error('No conversation found')
    
    try {
      // Save user message to Supabase
      const userMessage = await saveMessageToSupabase(
        targetConversation.id,
        message,
        'user'
      )

      // Update conversation title if it's the first message
      const newTitle = targetConversation.messages.length === 0 
        ? message.substring(0, 50) + (message.length > 50 ? '...' : '')
        : targetConversation.title

      if (newTitle !== targetConversation.title) {
        await updateConversationInSupabase(targetConversation.id, { title: newTitle })
      }

      // Update local state with user message
      const updatedMessages = [...targetConversation.messages, userMessage]
      const updatedConversation = {
        ...targetConversation,
        messages: updatedMessages,
        title: newTitle,
        updatedAt: new Date().toISOString()
      }

      const updatedConversations = conversations.map(c => 
        c.id === updatedConversation.id ? updatedConversation : c
      )

      setConversations(updatedConversations)
      setCurrentConversation(updatedConversation)

      // Send to n8n webhook and wait for response
      setLoading(true)
      
      console.log('Sending message to n8n:', message)
      
      // External request with timeout
      const controller = new AbortController()
      const fetchTimeout = setTimeout(() => controller.abort(), 20000)
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
        }),
        signal: controller.signal
      })
      clearTimeout(fetchTimeout)
      
      console.log('Response status:', response.status)
      
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
        // Save AI message to Supabase
        const aiMessage = await saveMessageToSupabase(
          targetConversation.id,
          aiMessageContent,
          'ai'
        )
        
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
        
        return aiMessage
      }
      
      // If no message content found, show error
      console.error('No message content found in response:', responseData)
      throw new Error('No message content received from AI agent')
      
    } catch (error) {
      console.error('Error sending message:', error)
      
      try {
        // Add error message to Supabase
        const errorMessage = await saveMessageToSupabase(
          targetConversation.id,
          'I apologize, but I encountered an issue processing your request. Please try again.',
          'ai',
          true
        )
        
        const errorMessages = [...(currentConversation?.messages || []), errorMessage]
        const errorConversation = {
          ...currentConversation,
          messages: errorMessages,
          updatedAt: new Date().toISOString()
        }
        
        const errorConversations = conversations.map(c => 
          c.id === errorConversation.id ? errorConversation : c
        )
        
        setConversations(errorConversations)
        setCurrentConversation(errorConversation)
      } catch (saveError) {
        console.error('Error saving error message:', saveError)
      }
      
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteConversation = async (conversationId) => {
    try {
      // Delete from Supabase (messages will be deleted via cascade)
      const { error } = await promiseWithTimeout(
        supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId),
        3000
      )

      if (error) {
        throw error
      }

      // Update local state
      const updatedConversations = conversations.filter(c => c.id !== conversationId)
      setConversations(updatedConversations)
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null)
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      throw error
    }
  }

  const selectConversation = (conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId)
    setCurrentConversation(conversation || null)
  }

  const clearAllConversations = async () => {
    if (!user) return

    try {
      // Delete all conversations for the user from Supabase
      const { error } = await promiseWithTimeout(
        supabase
        .from('conversations')
        .delete()
        .eq('user_id', user.id),
        3000
      )

      if (error) {
        throw error
      }

      // Update local state
      setConversations([])
      setCurrentConversation(null)
    } catch (error) {
      console.error('Error clearing conversations:', error)
      throw error
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
