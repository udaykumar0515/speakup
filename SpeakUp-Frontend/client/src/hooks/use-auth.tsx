import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Mock user type for the frontend state
type AuthUser = {
  id: number;
  email: string;
  name: string;
  age: number | null;
  gender: string | null;
  occupation: string | null;
  avatarUrl: string | null;
  firebaseUid: string;
};

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Check localStorage on mount
    const storedUser = localStorage.getItem("speakup_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, _password: string) => {
    setIsLoading(true);
    
    const mockUser: AuthUser = {
      id: 1, 
      email,
      name: email.split("@")[0],
      age: null,
      gender: null,
      occupation: null,
      avatarUrl: null,
      firebaseUid: "mock-firebase-uid",
    };
    
    setUser(mockUser);
    localStorage.setItem("speakup_user", JSON.stringify(mockUser));
    setIsLoading(false);
    toast({ title: "Welcome back!", description: "Successfully logged in." });
    setLocation("/dashboard");
  };

  const signup = async (email: string, _password: string, name: string) => {
    setIsLoading(true);
    
    const mockUser: AuthUser = {
      id: Math.floor(Math.random() * 1000) + 1,
      email,
      name: name || email.split("@")[0],
      age: null,
      gender: null,
      occupation: null,
      avatarUrl: null,
      firebaseUid: `mock-uid-${Date.now()}`,
    };
    
    setUser(mockUser);
    localStorage.setItem("speakup_user", JSON.stringify(mockUser));
    setIsLoading(false);
    toast({ title: "Account created", description: "Welcome to SpeakUp!" });
    setLocation("/dashboard");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("speakup_user");
    toast({ title: "Logged out", description: "See you next time." });
    setLocation("/auth");
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem("speakup_user", JSON.stringify(updatedUser));
    toast({ title: "Profile updated", description: "Your changes have been saved locally." });
  };

  const resetPassword = async (email: string) => {
    toast({ title: "Mock Reset Email", description: `A reset link would be sent to ${email} in production.` });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, resetPassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
