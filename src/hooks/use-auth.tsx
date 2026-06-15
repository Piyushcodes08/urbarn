import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, isConfigured } from "@/lib/firebase";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = "customer" | "vendor" | "admin";
export type VendorStatus = "pending" | "approved" | "rejected";

export interface CustomerData {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: "customer";
  createdAt?: unknown;
}

export interface VendorData {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: "vendor";
  status: VendorStatus;
  serviceCategory: string;
  experience: string;
  city: string;
  address: string;
  businessName: string;
  idProof: string;
  createdAt?: unknown;
}

export interface AdminData {
  uid: string;
  name: string;
  email: string;
  role: "admin";
  createdAt?: unknown;
}

export type UserData = CustomerData | VendorData | AdminData;

// Kept for backward-compat with Navbar quick-login simulation (offline/dev mode)
export const SEED_USERS = {
  admin: [{ name: "System Admin", email: "admin@urbanservices.com" }],
  vendor: [
    { name: "Priya Sharma (Salon)", email: "priya@urbanservices.com", professionalId: 1 },
    { name: "Rajesh Kumar (AC & Appliances)", email: "rajesh@urbanservices.com", professionalId: 2 },
  ],
  customer: [
    { name: "Anjali Mehta", email: "anjali@urbanservices.com" },
    { name: "Piyush Sharma", email: "piyush@urbanservices.com" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Legacy User shape (used by existing pages — kept for backward-compat)
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  professionalId?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Context
// ─────────────────────────────────────────────────────────────────────────────

interface AuthContextType {
  // Firebase user object
  firebaseUser: FirebaseUser | null;
  // Firestore profile (typed with role/status)
  userData: UserData | null;
  // Legacy shape for existing pages
  user: User | null;
  isLoading: boolean;
  loading: boolean; // alias
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;

  // Auth actions
  login: (
    emailOrRole: string | UserRole,
    emailOrPassword?: string,
    name?: string,
    professionalId?: number
  ) => Promise<void>;
  logout: () => Promise<void>;
  registerCustomer: (
    name: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<void>;
  registerVendor: (fields: {
    name: string;
    email: string;
    password: string;
    phone: string;
    serviceCategory: string;
    experience: string;
    city: string;
    address: string;
    businessName: string;
    idProof?: string;
  }) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In-memory fallback for offline/dev mode (no localStorage)
let fallbackUserSession: User | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildLegacyUser(uid: string, data: UserData): User {
  return {
    id: uid,
    name: data.name,
    email: data.email,
    role: data.role,
    professionalId: "professionalId" in data ? (data as any).professionalId : undefined,
  };
}

async function fetchUserData(uid: string): Promise<UserData | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) return snap.data() as UserData;
    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { toast } = useToast();

  // ── Listen to Firebase Auth state ──────────────────────────────────────────
  useEffect(() => {
    if (!isConfigured) {
      // Offline fallback: restore in-memory session
      setUser(fallbackUserSession);
      setIsLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const profile = await fetchUserData(fbUser.uid);
        if (profile) {
          setUserData(profile);
          setUser(buildLegacyUser(fbUser.uid, profile));
        } else {
          // Auth user exists but no Firestore doc — treat as customer
          const fallback: CustomerData = {
            uid: fbUser.uid,
            name: fbUser.displayName || "User",
            email: fbUser.email || "",
            phone: "",
            role: "customer",
          };
          setUserData(fallback);
          setUser(buildLegacyUser(fbUser.uid, fallback));
        }
      } else {
        setFirebaseUser(null);
        setUserData(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return unsub;
  }, []);

  // ── Refresh user data from Firestore ──────────────────────────────────────
  const refreshUserData = useCallback(async () => {
    if (!firebaseUser || !isConfigured) return;
    const profile = await fetchUserData(firebaseUser.uid);
    if (profile) {
      setUserData(profile);
      setUser(buildLegacyUser(firebaseUser.uid, profile));
    }
  }, [firebaseUser]);

  // ── Register Customer ──────────────────────────────────────────────────────
  const registerCustomer = async (
    name: string,
    email: string,
    password: string,
    phone = ""
  ) => {
    if (!isConfigured) {
      toast({ title: "Firebase not configured", variant: "destructive" });
      return;
    }
    try {
      setIsLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const customerDoc: CustomerData = {
        uid,
        name,
        email,
        phone,
        role: "customer",
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", uid), customerDoc);
      setShowLoginModal(false);
      toast({
        title: "Account Created!",
        description: `Welcome, ${name}! You're now logged in as a customer.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed.";
      toast({ title: "Registration Failed", description: message, variant: "destructive" });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ── Register Vendor ────────────────────────────────────────────────────────
  const registerVendor = async (fields: {
    name: string;
    email: string;
    password: string;
    phone: string;
    serviceCategory: string;
    experience: string;
    city: string;
    address: string;
    businessName: string;
    idProof?: string;
  }) => {
    if (!isConfigured) {
      toast({ title: "Firebase not configured", variant: "destructive" });
      return;
    }
    try {
      setIsLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, fields.email, fields.password);
      const uid = cred.user.uid;
      const vendorDoc: VendorData = {
        uid,
        name: fields.name,
        email: fields.email,
        phone: fields.phone,
        role: "vendor",
        status: "pending",
        serviceCategory: fields.serviceCategory,
        experience: fields.experience,
        city: fields.city,
        address: fields.address,
        businessName: fields.businessName,
        idProof: fields.idProof || "",
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", uid), vendorDoc);
      // Sign out immediately — vendor must be approved first
      await signOut(auth);
      toast({
        title: "Application Submitted!",
        description: "Your vendor account is pending admin approval. You'll be notified once approved.",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed.";
      toast({ title: "Registration Failed", description: message, variant: "destructive" });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  // Supports two calling conventions:
  //  1. Real login:    login(email, password)
  //  2. Legacy simulation: login(role, email, name?, professionalId?)
  const login = async (
    emailOrRole: string | UserRole,
    emailOrPassword?: string,
    name?: string,
    professionalId?: number
  ) => {
    const isSimulationCall =
      emailOrRole === "customer" || emailOrRole === "vendor" || emailOrRole === "admin";

    // ── Offline / not-configured fallback ────────────────────────────────────
    if (!isConfigured) {
      const role = isSimulationCall ? (emailOrRole as UserRole) : "customer";
      const email = isSimulationCall ? (emailOrPassword ?? "") : emailOrRole;
      let finalName = name || "User";
      if (!name) {
        const roleUsers = SEED_USERS[role as keyof typeof SEED_USERS] || [];
        const found = roleUsers.find((u) => u.email === email);
        if (found) finalName = found.name.split(" (")[0];
      }
      const loggedIn: User = {
        id: Math.random().toString(36).slice(2, 9),
        name: finalName,
        email,
        role,
        professionalId,
      };
      fallbackUserSession = loggedIn;
      setUser(loggedIn);
      setShowLoginModal(false);
      toast({
        title: "Logged In (Offline Mode)",
        description: `Welcome, ${finalName}! (Simulated ${role})`,
      });
      return;
    }

    // ── Real Firebase login ───────────────────────────────────────────────────
    try {
      setIsLoading(true);

      let email: string;
      let password: string;

      if (isSimulationCall) {
        // Legacy simulation call from Navbar modal — use fixed password
        email = emailOrPassword ?? "";
        password = "password123";
      } else {
        // Real login call from LoginPage
        email = emailOrRole;
        password = emailOrPassword ?? "";
      }

      let credential;
      try {
        credential = await signInWithEmailAndPassword(auth, email, password);
      } catch (authErr: unknown) {
        const errCode = (authErr as { code?: string })?.code ?? "";
        if (
          isSimulationCall &&
          (
            errCode === "auth/user-not-found" ||
            errCode === "auth/invalid-credential" ||
            errCode === "auth/cannot-find-user"
          )
        ) {
          // Auto-register seed user for simulation
          credential = await createUserWithEmailAndPassword(auth, email, password);
        } else {
          throw authErr;
        }
      }

      const fbUser = credential.user;
      const userRef = doc(db, "users", fbUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists() && isSimulationCall) {
        // Create Firestore doc for simulation seed user
        const role = emailOrRole as UserRole;
        let finalName = name || "User";
        if (!name) {
          const roleUsers = SEED_USERS[role as keyof typeof SEED_USERS] || [];
          const found = roleUsers.find((u) => u.email === email);
          if (found) finalName = found.name.split(" (")[0];
        }
        const seedDoc =
          role === "vendor"
            ? {
                uid: fbUser.uid,
                name: finalName,
                email,
                phone: "",
                role: "vendor" as const,
                status: "approved" as VendorStatus,
                serviceCategory: "Salon",
                experience: "5",
                city: "Mumbai",
                address: "Mumbai",
                businessName: finalName,
                idProof: "",
                createdAt: serverTimestamp(),
              }
            : role === "admin"
            ? {
                uid: fbUser.uid,
                name: finalName,
                email,
                role: "admin" as const,
                createdAt: serverTimestamp(),
              }
            : {
                uid: fbUser.uid,
                name: finalName,
                email,
                phone: "",
                role: "customer" as const,
                createdAt: serverTimestamp(),
              };
        await setDoc(userRef, seedDoc);
      }

      // Reload user data — onAuthStateChanged will fire and update state
      setShowLoginModal(false);
      toast({
        title: "Logged In",
        description: "Welcome back!",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed.";
      toast({ title: "Login Failed", description: message, variant: "destructive" });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    if (!isConfigured) {
      fallbackUserSession = null;
      setUser(null);
      toast({ title: "Logged Out", description: "You have been securely logged out." });
      return;
    }
    try {
      setIsLoading(true);
      await signOut(auth);
      setUserData(null);
      setUser(null);
      toast({ title: "Logged Out", description: "You have been securely logged out." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Logout failed.";
      toast({ title: "Logout Error", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userData,
        user,
        isLoading,
        loading: isLoading,
        showLoginModal,
        setShowLoginModal,
        login,
        logout,
        registerCustomer,
        registerVendor,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
