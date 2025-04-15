import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "firebase/auth";
import { 
  subscribeToAuthChanges, 
  getCurrentUser,
  getUserProfile,
  UserProfile
} from "./auth";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load user profile when user is authenticated
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    loadUserProfile();
  }, [user]);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((authUser) => {
      console.log("Auth state changed:", authUser ? "Logged in" : "Logged out");
      setUser(authUser);
      setLoading(true);
    });

    return () => unsubscribe();
  }, []);

  // Function to refresh user profile
  const refreshProfile = async () => {
    setLoading(true);
    if (user) {
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
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