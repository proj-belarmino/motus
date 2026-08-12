/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useLayoutEffect,
} from "react";
import { User, TokenService } from "../services/TokenService";
import { axiosInstance } from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  setAuthSession: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(TokenService.getUser());
  const navigate = useNavigate();

  const setAuthSession = (token: string, userData: User) => {
    TokenService.setToken(token);
    TokenService.setUser(userData);
    setUser(userData);
  };

  const logout = () => {
    TokenService.clearAuth();
    setUser(null);
    navigate("/login");
  };

  useLayoutEffect(() => {
    const interceptorId = axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          TokenService.clearAuth();
          setUser(null);
          if (
            !window.location.pathname.startsWith("/login") &&
            !window.location.pathname.startsWith("/register")
          ) {
            navigate("/login");
          }
        }
        return Promise.reject(error);
      },
    );

    return () => {
      axiosInstance.interceptors.response.eject(interceptorId);
    };
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, setAuthSession, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
