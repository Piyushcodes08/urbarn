import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, isConfigured } from "@/lib/firebase";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "customer" | "vendor" | "admin";
  professionalId?: number; // linked if they are a vendor
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  login: (
    role: "customer" | "vendor" | "admin",
    email: string,
    name?: string,
    professionalId?: number
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SEED_USERS = {
  admin: [
    { name: "System Admin", email: "admin@urbanservices.com" }
  ],
  vendor: [
    { name: "Priya Sharma (Salon)", email: "priya@urbanservices.com", professionalId: 1 },
    { name: "Rajesh Kumar (AC & Appliances)", email: "rajesh@urbanservices.com", professionalId: 2 }
  ],
  customer: [
    { name: "Anjali Mehta", email: "anjali@urbanservices.com" },
    { name: "Piyush Sharma", email: "piyush@urbanservices.com" }
  ]
};

// Global in-memory variable for offline fallback session (No localStorage!)
let fallbackUserSession: User | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isConfigured) {
      // Offline fallback session retrieval
      setUser(fallbackUserSession);
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user details from Firestore users collection
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              name: profile.name,
              email: firebaseUser.email || profile.email,
              role: profile.role,
              professionalId: profile.professionalId,
            });
          } else {
            // Profile document doesn't exist yet, build from Auth metadata
            setUser({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || "User",
              email: firebaseUser.email || "",
              role: "customer",
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (
    role: "customer" | "vendor" | "admin",
    email: string,
    name?: string,
    professionalId?: number
  ) => {
    // Find pre-seeded name if not provided
    let finalName = name || "User";
    if (!name) {
      if (role === "admin") {
        const found = SEED_USERS.admin.find(u => u.email === email);
        if (found) finalName = found.name;
      } else if (role === "vendor") {
        const found = SEED_USERS.vendor.find(u => u.email === email);
        if (found) finalName = found.name.split(" (")[0]; // Remove helper info
      } else {
        const found = SEED_USERS.customer.find(u => u.email === email);
        if (found) finalName = found.name;
      }
    }

    if (!isConfigured) {
      // Offline fallback login logic
      const loggedInUser: User = {
        id: Math.random().toString(36).substring(2, 9),
        name: finalName,
        email,
        role,
        professionalId
      };
      fallbackUserSession = loggedInUser;
      setUser(loggedInUser);
      setShowLoginModal(false);
      toast({
        title: "Successfully Logged In (Fallback Mode)",
        description: `Welcome back, ${finalName}! Logged in as ${role} (offline).`,
      });
      return;
    }

    try {
      setIsLoading(true);
      let credential;
      
      try {
        // Try sign-in with standard password
        credential = await signInWithEmailAndPassword(auth, email, "password123");
      } catch (authError: any) {
        // If account does not exist, register them automatically
        if (
          authError.code === "auth/user-not-found" ||
          authError.code === "auth/invalid-credential" ||
          authError.code === "auth/cannot-find-user"
        ) {
          credential = await createUserWithEmailAndPassword(auth, email, "password123");
        } else {
          throw authError;
        }
      }

      const firebaseUser = credential.user;
      
      // Ensure user profile document exists in Firestore users collection
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      
      const userProfile = {
        id: firebaseUser.uid,
        name: finalName,
        email,
        role,
        professionalId: professionalId ?? null,
      };

      if (!userSnap.exists()) {
        await setDoc(userRef, userProfile);
      } else {
        // Make sure the role and professionalId are up-to-date in database if quick-logging in
        const existingData = userSnap.data();
        if (existingData.role !== role || existingData.professionalId !== professionalId) {
          await setDoc(userRef, { ...existingData, role, professionalId: professionalId ?? null });
        }
      }

      setUser({
        id: firebaseUser.uid,
        name: finalName,
        email,
        role,
        professionalId
      });

      setShowLoginModal(false);
      toast({
        title: "Successfully Logged In",
        description: `Welcome back, ${finalName}! Logged in as ${role}.`,
      });
    } catch (error: any) {
      console.error("Firebase Login Error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Failed to authenticate with Firebase Auth.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!isConfigured) {
      fallbackUserSession = null;
      setUser(null);
      toast({
        title: "Logged Out (Fallback Mode)",
        description: "You have been securely logged out.",
      });
      return;
    }

    try {
      setIsLoading(true);
      await signOut(auth);
      setUser(null);
      toast({
        title: "Logged Out",
        description: "You have been securely logged out.",
      });
    } catch (error: any) {
      console.error("Firebase Sign Out Error:", error);
      toast({
        title: "Logout Error",
        description: "Could not log out from Firebase.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        showLoginModal,
        setShowLoginModal,
        login,
        logout
      }}
    >
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
