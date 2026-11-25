import { createContext, useContext, useEffect, useState } from 'react'
import { fetchMe, loginUser, registerUser, logoutUser } from './api.js'

// status is one of:
//   loading    the server has not answered yet
//   user       somebody is logged in (`user` is set)
//   anonymous  the server says nobody is logged in
//   unknown    the server cannot be reached, or does not know accounts
// Pages only block visitors who are known to be anonymous. When the server cannot say, they show their
// content: the server checks every request anyway.
const AuthContext = createContext({
  user: null,
  status: 'unknown',
  login: async () => null,
  register: async () => null,
  logout: async () => {},
})

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, status: 'loading' })

  useEffect(() => {
    let isActive = true
    fetchMe()
      .then((user) => {
        if (isActive) setState(user ? { user, status: 'user' } : { user: null, status: 'anonymous' })
      })
      .catch(() => {
        if (isActive) setState({ user: null, status: 'unknown' })
      })
    return () => {
      isActive = false
    }
  }, [])

  async function login(credentials) {
    const user = await loginUser(credentials)
    setState({ user, status: 'user' })
    return user
  }

  async function register(details) {
    const user = await registerUser(details)
    setState({ user, status: 'user' })
    return user
  }

  async function logout() {
    try {
      await logoutUser()
    } finally {
      setState({ user: null, status: 'anonymous' })
    }
  }

  return <AuthContext.Provider value={{ ...state, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
