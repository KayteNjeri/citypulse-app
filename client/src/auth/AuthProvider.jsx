import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from './authContext'
import { hashPassword, normalizeEmail } from './authUtils'

const USERS_KEY = 'citypulse.users'
const SESSION_KEY = 'citypulse.session'

// localStorage can be unavailable (private mode, blocked storage), so never let it crash the app.
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable: the session just won't survive a refresh.
  }
}

export const AuthProvider = ({ children }) => {
  // Restores the logged-in user after a page refresh.
  const [user, setUser] = useState(() => readJSON(SESSION_KEY, null))

  const startSession = useCallback((account) => {
    const session = { name: account.name, email: account.email }
    writeJSON(SESSION_KEY, session)
    setUser(session)
    return session
  }, [])

  const navi = useNavigate()
  let tokenExpiry;

  const tokenExpiryTime = (expTime) => {
    clearTimeout(tokenExpiry);
    const expiryTime = expTime - Date.now()

    if (expiryTime > 60000) {
      tokenExpiry = setTimeout(() => {
        Refresh();
      }, expiryTime - 60000)
    } else {
      navi("/login")
    }
  }
  const Refresh = () =>
    fetch("/me", {
      method: "GET",
    }).then(response => {

      if (!response.ok) throw new Error("Token Unavailable");
      return response.json()

    }).then(({token, expiry}) => {

      localStorage.setItem("token", token);
      tokenExpiryTime(expiry * 100);

    }).catch (() => navi("/login"))

    const signup = useCallback(
    async ({ name, email, password }) => {
      const users = readJSON(USERS_KEY, [])
      const normalized = normalizeEmail(email)
      if (users.some((u) => u.email === normalized)) {
        throw new Error('An account with this email already exists. Try logging in.')
      }
      const account = {
        name: name.trim(),
        email: normalized,
        passwordHash: await hashPassword(normalized, password),
      }
      writeJSON(USERS_KEY, [...users, account])
      return startSession(account)
    },
    [startSession],
  )
  const login = useCallback(
    async ({ email, password }) => {
      const normalized = normalizeEmail(email)
      const account = readJSON(USERS_KEY, []).find((u) => u.email === normalized)
      // Same message either way, so the form doesn't reveal which emails have accounts.
      if (!account || account.passwordHash !== (await hashPassword(normalized, password))) {
        throw new Error('Incorrect email or password.')
      }
      return startSession(account)
    },
    [startSession],
  )

  const logout = useCallback(() => {
    writeJSON(SESSION_KEY, null)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, signup, login, logout }), [user, signup, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
