import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const ML_API = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000';
const TOKEN_KEY = 'secondlife_jwt';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'buyer' | 'seller' | 'admin';
  green_credits: number;
  co2_saved_kg: number;
  created_at: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Decode JWT payload without verifying signature (client-side only, for UX) */
function decodeJWT(token: string): any | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;
  return Date.now() / 1000 > payload.exp;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const authFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    
    // Check if body is FormData - if so, don't set Content-Type (browser will set it with boundary)
    const isFormData = options.body instanceof FormData;
    
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };
    
    // Only add Content-Type if not FormData and not already set
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (storedToken) {
      headers['Authorization'] = `Bearer ${storedToken}`;
    }
    
    return fetch(url, { ...options, headers });
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);

    // No token stored — go straight to login
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    // Token is expired — clear and go to login
    if (isTokenExpired(storedToken)) {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    // Token looks valid — decode it immediately for instant UI (no backend round-trip needed)
    const payload = decodeJWT(storedToken);
    if (payload) {
      const localUser: AuthUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        green_credits: 500,
        co2_saved_kg: 22.4,
        created_at: new Date(payload.iat * 1000).toISOString(),
      };
      setUser(localUser);
      setToken(storedToken);
      setIsLoading(false); // Show the app immediately

      // Then silently refresh from backend in background (optional)
      try {
        const resp = await fetch(`${ML_API}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (resp.ok) {
          const json = await resp.json();
          setUser(json.data as AuthUser);
        }
      } catch {
        // Backend offline — local token is good enough, user stays logged in
      }
      return;
    }

    // Corrupt token — clear it
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const resp = await fetch(`${ML_API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed. Check email and password.');
    }
    const data = await resp.json();
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);
    setUser(data.user as AuthUser);
  };

  const register = async (email: string, password: string, name: string, role: string) => {
    const resp = await fetch(`${ML_API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed.');
    }
    const data = await resp.json();
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);
    setUser(data.user as AuthUser);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
