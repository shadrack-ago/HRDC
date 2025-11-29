import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await fetchUserProfile(session.user)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching profile:', error)
        return
      }

      const userData = {
        id: authUser.id,
        email: authUser.email,
        emailConfirmed: authUser.email_confirmed_at ? true : false,
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        company: profile?.company || '',
        role: profile?.role || '',
        isAdmin: profile?.is_admin || false,
        createdAt: authUser.created_at,
        lastLogin: new Date().toISOString()
      }

      setUser(userData)
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
    }
  }

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw error
      }

      return data.user
    } catch (error) {
      throw new Error(error.message || 'Login failed')
    }
  }

  const register = async (userData) => {
    try {
      const { email, password, firstName, lastName, company, role } = userData
      
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) {
        throw error
      }

      // Create profile record
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            company,
            role,
            is_admin: false
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
        }
      }

      return data.user
    } catch (error) {
      throw new Error(error.message || 'Registration failed')
    }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      setUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const updateProfile = async (updatedData) => {
    try {
      if (!user) {
        throw new Error('No user logged in')
      }

      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: updatedData.firstName,
          last_name: updatedData.lastName,
          company: updatedData.company,
          role: updatedData.role
        })
        .eq('id', user.id)

      if (error) {
        throw error
      }

      // Update local user state
      const updatedUser = {
        ...user,
        firstName: updatedData.firstName || user.firstName,
        lastName: updatedData.lastName || user.lastName,
        company: updatedData.company || user.company,
        role: updatedData.role || user.role
      }

      setUser(updatedUser)
      return updatedUser
    } catch (error) {
      throw new Error(error.message || 'Failed to update profile')
    }
  }

  const deleteAccount = async () => {
    try {
      if (!user) {
        throw new Error('No user logged in')
      }

      // Delete user conversations first
      const { error: conversationsError } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', user.id)

      if (conversationsError) {
        console.error('Error deleting conversations:', conversationsError)
      }

      // Delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (profileError) {
        console.error('Error deleting profile:', profileError)
      }

      // Delete auth user (this will cascade delete related data)
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id)
      
      if (authError) {
        console.error('Error deleting auth user:', authError)
        // Note: Regular users can't delete their own auth record via admin API
        // They would need to use the user management API or handle this server-side
      }

      setUser(null)
    } catch (error) {
      throw new Error(error.message || 'Failed to delete account')
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    deleteAccount
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
