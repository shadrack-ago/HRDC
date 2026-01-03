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

  const promiseWithTimeout = (p, ms) => {
    let timer
    return Promise.race([
      new Promise((resolve, reject) => {
        const settle = () => clearTimeout(timer)
        Promise.resolve(p).then(
          (v) => { settle(); resolve(v) },
          (e) => { settle(); reject(e) }
        )
      }),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('TIMEOUT')), ms)
      })
    ])
  }

  // Load conversations when user changes
  useEffect(() => {
    if (user) {
      console.log('[Chat] user set, loading conversations for', user.id)
      loadConversations()
    } else {
      console.log('[Chat] no user, resetting conversations state')
      setConversations([])
      setCurrentConversation(null)
    }
  }, [user])

  const loadConversations = async () => {
    if (!user) return
    
    try {
      console.log('[Chat] loadConversations:start')
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
      console.log('[Chat] loadConversations:success count=', transformedConversations.length)
    } catch (error) {
      console.error('[Chat] loadConversations:error', error)
      setConversations([])
    }
  }

  const createNewConversation = async (title = 'New Conversation') => {
    if (!user) throw new Error('User not authenticated')

    try {
      console.log('[Chat] createNewConversation:start title=', title)
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
      console.log('[Chat] createNewConversation:success id=', newConversation.id)
      
      return newConversation
    } catch (error) {
      console.error('[Chat] createNewConversation:error', error)
      throw error
    }
  }

  const saveMessageToSupabase = async (conversationId, content, sender, isError = false) => {
    try {
      console.log('[Chat] saveMessage:start', { conversationId, sender, isError })
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

      const result = {
        id: message.id,
        content: message.content,
        sender: message.sender,
        timestamp: message.created_at,
        isError: message.is_error || false
      }
      console.log('[Chat] saveMessage:success id=', result.id)
      return result
    } catch (error) {
      console.error('[Chat] saveMessage:error', error)
      throw error
    }
  }

  const updateConversationInSupabase = async (conversationId, updates) => {
    try {
      console.log('[Chat] updateConversation:start', { conversationId })
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
      console.log('[Chat] updateConversation:success', { conversationId })
    } catch (error) {
      console.error('[Chat] updateConversation:error', error)
      throw error
    }
  }

  const sendMessage = async (message, conversationId = null) => {
    if (!user) throw new Error('User not authenticated')
    
    let targetConversation = currentConversation
    
    // If no conversation exists, create one
    if (!targetConversation && !conversationId) {
      console.log('[Chat] sendMessage:no active conversation, creating new one')
      targetConversation = await createNewConversation()
    } else if (conversationId) {
      targetConversation = conversations.find(c => c.id === conversationId)
    }
    
    if (!targetConversation) throw new Error('No conversation found')
    
    try {
      console.log('[Chat] sendMessage:start', { conversationId: targetConversation.id })
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
      
      console.log('[Chat] n8n:request ->', message)
      
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
      
      console.log('[Chat] n8n:response status', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('HTTP Error Response:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to send message to AI agent'}`)
      }
      
      // Get response text first to handle different content types
      const responseText = await response.text()
      console.log('[Chat] n8n:response body', responseText)
      
      let responseData
      try {
        responseData = JSON.parse(responseText)
        // parsed ok
      } catch (parseError) {
        console.error('[Chat] n8n:parse error, fallback to text', parseError)
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
        console.log('[Chat] AI message saved id=', aiMessage.id)
        
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
      console.error('[Chat] n8n:no message content', responseData)
      throw new Error('No message content received from AI agent')
      
    } catch (error) {
      console.error('[Chat] sendMessage:error', error)
      
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
        console.error('[Chat] save error message failed:', saveError)
      }
      
      throw error
    } finally {
      setLoading(false)
      console.log('[Chat] sendMessage:end')
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
