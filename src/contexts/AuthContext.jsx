import React, { createContext, useContext, useState, useEffect } from 'react'

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
    // Load user from localStorage on app start
    const savedUser = localStorage.getItem('hrdc_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('hrdc_user')
      }
    }
    setLoading(false)
  }, [])

  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem('hrdc_users') || '[]')
      
      // Find user with matching credentials
      const foundUser = users.find(u => u.email === email && u.password === password)
      
      if (foundUser) {
        const userWithoutPassword = { ...foundUser }
        delete userWithoutPassword.password
        
        setUser(userWithoutPassword)
        localStorage.setItem('hrdc_user', JSON.stringify(userWithoutPassword))
        resolve(userWithoutPassword)
      } else {
        reject(new Error('Invalid email or password'))
      }
    })
  }

  const register = (userData) => {
    return new Promise((resolve, reject) => {
      const { email, password, firstName, lastName, company, role } = userData
      
      // Get existing users
      const users = JSON.parse(localStorage.getItem('hrdc_users') || '[]')
      
      // Check if user already exists
      if (users.find(u => u.email === email)) {
        reject(new Error('User with this email already exists'))
        return
      }
      
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        email,
        password,
        firstName,
        lastName,
        company,
        role,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }
      
      // Save to users array
      users.push(newUser)
      localStorage.setItem('hrdc_users', JSON.stringify(users))
      
      // Auto-login the new user
      const userWithoutPassword = { ...newUser }
      delete userWithoutPassword.password
      
      setUser(userWithoutPassword)
      localStorage.setItem('hrdc_user', JSON.stringify(userWithoutPassword))
      resolve(userWithoutPassword)
    })
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('hrdc_user')
  }

  const updateProfile = (updatedData) => {
    return new Promise((resolve, reject) => {
      try {
        const users = JSON.parse(localStorage.getItem('hrdc_users') || '[]')
        const userIndex = users.findIndex(u => u.id === user.id)
        
        if (userIndex !== -1) {
          // Update user in users array
          users[userIndex] = { ...users[userIndex], ...updatedData }
          localStorage.setItem('hrdc_users', JSON.stringify(users))
          
          // Update current user
          const updatedUser = { ...user, ...updatedData }
          setUser(updatedUser)
          localStorage.setItem('hrdc_user', JSON.stringify(updatedUser))
          
          resolve(updatedUser)
        } else {
          reject(new Error('User not found'))
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  const deleteAccount = () => {
    return new Promise((resolve, reject) => {
      try {
        // Remove user from users array
        const users = JSON.parse(localStorage.getItem('hrdc_users') || '[]')
        const filteredUsers = users.filter(u => u.id !== user.id)
        localStorage.setItem('hrdc_users', JSON.stringify(filteredUsers))
        
        // Remove user data
        localStorage.removeItem('hrdc_user')
        localStorage.removeItem(`hrdc_chats_${user.id}`)
        
        setUser(null)
        resolve()
      } catch (error) {
        reject(error)
      }
    })
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
