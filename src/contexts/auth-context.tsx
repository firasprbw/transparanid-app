import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

export interface AuthUser {
  id: string
  username: string
  email: string
  role: string
  isBanned: boolean
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (token: string, user: AuthUser) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [token, setToken]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restore = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token")
        const storedUser  = await AsyncStorage.getItem("user")
        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    restore()
  }, [])

  const login = async (newToken: string, newUser: AuthUser) => {
    await AsyncStorage.setItem("token", newToken)
    await AsyncStorage.setItem("user", JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const logout = async () => {
    await AsyncStorage.removeItem("token")
    await AsyncStorage.removeItem("user")
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}