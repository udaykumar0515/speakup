import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { auth, googleProvider } from "@/firebase";

// Auth user type based on Firebase
type AuthUser = {
  uid: string;  // Firebase UID
  email: string;
  name: string;
  photoURL: string | null;
  age?: number | null;
  gender?: string | null;
  occupation?: string | null;
  avatarUrl?: string | null;
};

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in - get basic info from Firebase
        const authUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          photoURL: firebaseUser.photoURL,
        };
        
        // Fetch additional metadata from backend
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch(`http://localhost:8000/api/users/${firebaseUser.uid}`, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            // Merge backend data with Firebase data
            const metadata = userData.metadata || {};
            authUser.age = metadata.age || userData.age;
            authUser.gender = metadata.gender || userData.gender;
            authUser.occupation = metadata.occupation || userData.occupation;
            authUser.avatarUrl = metadata.avatarUrl || userData.avatarUrl;
          }
        } catch (error) {
          console.log("Could not fetch user metadata:", error);
          // Continue with basic auth data
        }
        
        setUser(authUser);
      } else {
        // User is signed out
        setUser(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      setLocation("/dashboard");
      toast({ title: "Welcome back!", description: "Logged in successfully" });
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signupWithEmail = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name using Firebase updateProfile
      if (userCredential.user) {
        await firebaseUpdateProfile(userCredential.user, {
          displayName: name
        });
        // Refresh user state
        await userCredential.user.reload();
      }
      
      setLocation("/dashboard");
      toast({ title: "Account created!", description: "Welcome to SpeakUp" });
    } catch (error: any) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      await signInWithPopup(auth, googleProvider);
      setLocation("/dashboard");
      toast({ title: "Welcome!", description: "Logged in with Google" });
    } catch (error: any) {
      toast({ title: "Google login failed", description: error.message, variant: "destructive" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setLocation("/auth");
      toast({ title: "Logged out", description: "See you soon!" });
    } catch (error: any) {
      toast({ title: "Logout failed", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ 
        title: "Reset email sent", 
        description: `Password reset link sent to ${email}` 
      });
    } catch (error: any) {
      toast({ 
        title: "Reset failed", 
        description: error.message, 
        variant: "destructive" 
      });
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user || !auth.currentUser) return;
    
    try {
      // Update backend via API
      const response = await fetch(`http://localhost:8000/api/users/${user.uid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await auth.currentUser.getIdToken()}`
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        // Update local state
        setUser({ ...user, ...updates });
        toast({ title: "Profile updated", description: "Your changes have been saved." });
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error: any) {
      toast({ 
        title: "Update failed", 
        description: error.message, 
        variant: "destructive" 
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      loginWithEmail, 
      signupWithEmail, 
      loginWithGoogle, 
      logout, 
      resetPassword,
      updateProfile
    }}>
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
