import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useLocation } from "wouter";
import { User } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]!));
    return !payload.exp || Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

function loadStoredAuth(): { token: string | null; user: User | null } {
  const savedToken = localStorage.getItem("auth_token");
  const savedUser = localStorage.getItem("auth_user");

  if (!savedToken || isTokenExpired(savedToken)) {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    return { token: null, user: null };
  }

  try {
    const user = savedUser ? (JSON.parse(savedUser) as User) : null;
    return { token: savedToken, user };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = loadStoredAuth();
  const [token, setTokenState] = useState<string | null>(stored.token);
  const [user, setUserState] = useState<User | null>(stored.user);
  const [, setLocation] = useLocation();

  useEffect(() => {
    setAuthTokenGetter(() => token);
  }, [token]);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setTokenState(null);
    setUserState(null);
    setLocation("/role");
  }, [setLocation]);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("auth_user", JSON.stringify(newUser));
    setTokenState(newToken);
    setUserState(newUser);
  }, []);

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener("auth:unauthorized", handler);
    return () => window.removeEventListener("auth:unauthorized", handler);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
