import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [user, setUserState] = useState<User | null>(() => {
    const saved = localStorage.getItem("auth_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [, setLocation] = useLocation();

  useEffect(() => {
    setAuthTokenGetter(() => token);
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("auth_user", JSON.stringify(newUser));
    setTokenState(newToken);
    setUserState(newUser);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setTokenState(null);
    setUserState(null);
    setLocation("/role");
  };

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
