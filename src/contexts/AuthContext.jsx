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

  const clearSupabaseAuthTokens = () => {
    try {
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k))
    } catch (_) {}
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        // Cross-check with getUser to detect corrupted/stale tokens on old devices
        const { data: userResp, error: userErr } = await supabase.auth.getUser()

        if (session?.user && userResp?.user && session.user.id === userResp.user.id) {
          await fetchUserProfile(session.user)
        } else {
          // If session exists but getUser fails or mismatch, clear tokens and reset
          if (session?.user && (userErr || !userResp?.user)) {
            clearSupabaseAuthTokens()
          }
          setUser(null)
        }
      } catch (_) {
        // On any bootstrap error, clear tokens to self-heal
        clearSupabaseAuthTokens()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user)
      } else {
        setUser(null)
        if (event === 'SIGNED_OUT') {
          clearSupabaseAuthTokens()
        }
      }

      // Also treat token refresh/user updated as valid sign-in states
      if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
        await fetchUserProfile(session.user)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (authUser) => {
    try {
      // Prepare minimal user immediately
      const minimalUser = {
        id: authUser.id,
        email: authUser.email,
        emailConfirmed: authUser.email_confirmed_at ? true : false,
        firstName: '',
        lastName: '',
        company: '',
        role: '',
        isAdmin: false,
        createdAt: authUser.created_at,
        lastLogin: new Date().toISOString()
      }

      // Immediately set minimal user so routes can proceed while profile loads
      setUser(minimalUser)

      // Try to fetch profile with a timeout to avoid hanging indefinitely on old devices
      let profile = null
      let error = null
      try {
        const result = await promiseWithTimeout(
          supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single(),
          2500
        )
        profile = result.data
        error = result.error
      } catch (e) {
        // silently proceed with minimal user on timeout or fetch error
      }

      // Proceed with basic auth user data to avoid redirect loops when profile is not readable

      const userData = {
        ...minimalUser,
        firstName: profile?.first_name || minimalUser.firstName,
        lastName: profile?.last_name || minimalUser.lastName,
        company: profile?.company || minimalUser.company,
        role: profile?.role || minimalUser.role,
        isAdmin: profile?.is_admin || minimalUser.isAdmin
      }

      setUser(userData)
    } catch (error) {
      // swallow errors to avoid console noise in production
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
