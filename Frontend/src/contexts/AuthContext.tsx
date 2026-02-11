import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { authApi, AuthResponse } from "@/services/api";

export type UserRole = "citizen" | "police" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  station?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  registerAdmin: (name: string, email: string, password: string) => Promise<boolean>;
  registerPolice: (name: string, email: string, password: string, station: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const mapBackendRole = (role: string): UserRole => {
  return role.toLowerCase() as UserRole;
};

const mapToBackendRole = (role: UserRole): 'CITIZEN' | 'POLICE' | 'ADMIN' => {
  return role.toUpperCase() as 'CITIZEN' | 'POLICE' | 'ADMIN';
};

const mapAuthResponse = (response: AuthResponse): User => ({
  id: response.id.toString(),
  name: response.name,
  email: response.email,
  role: mapBackendRole(response.role),
  station: response.station,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      const response = await authApi.login({
        email,
        password,
        role: mapToBackendRole(role),
      });
      
      const authData = response.data;
      const userData = mapAuthResponse(authData);
      
      // Store in localStorage
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(authData.token);
      setUser(userData);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.register({
        name,
        email,
        password,
        role: 'CITIZEN',
      });
      
      const authData = response.data;
      const userData = mapAuthResponse(authData);
      
      // Store in localStorage
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(authData.token);
      setUser(userData);
      
      return true;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const registerAdmin = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.register({
        name,
        email,
        password,
        role: 'ADMIN',
      });
      
      const authData = response.data;
      const userData = mapAuthResponse(authData);
      
      // Store in localStorage
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(authData.token);
      setUser(userData);
      
      return true;
    } catch (error) {
      console.error('Admin register error:', error);
      return false;
    }
  };

  const registerPolice = async (name: string, email: string, password: string, station: string): Promise<boolean> => {
    try {
      const response = await authApi.register({
        name,
        email,
        password,
        role: 'POLICE',
        station,
      });
      
      const authData = response.data;
      const userData = mapAuthResponse(authData);
      
      // Store in localStorage
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(authData.token);
      setUser(userData);
      
      return true;
    } catch (error) {
      console.error('Police register error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, registerAdmin, registerPolice, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
