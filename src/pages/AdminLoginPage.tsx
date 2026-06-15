import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, LogIn, Eye, EyeOff, Loader2, AlertCircle, Lock } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

/**
 * Admin Login Page — /admin-login
 *
 * ADMIN ACCOUNT SETUP (do this once):
 * 1. Go to Firebase Console → Authentication → Users → Add User
 * 2. Create the admin email & password (e.g., admin@homemate.com)
 * 3. Copy the UID from the user list
 * 4. Go to Firestore → users collection → Add Document
 * 5. Set Document ID = the admin's Firebase UID
 * 6. Add fields:
 *      uid: "<admin_uid>"
 *      name: "Admin"
 *      email: "admin@homemate.com"
 *      role: "admin"
 *      createdAt: <timestamp>
 * 7. Admin can now login here and will be redirected to /admin
 */
export default function AdminLoginPage() {
  const { user, login, refreshUserData, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Only redirect if already logged in as admin
  // Other roles (customer/vendor) can still access this page to switch to admin
  useEffect(() => {
    if (user?.role === "admin") setLocation("/admin");
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter your admin email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);

      // Verify and auto-create Firestore document if missing
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          // Create admin record automatically for seamless flow
          const adminDoc = {
            uid: currentUser.uid,
            name: "Admin",
            email: currentUser.email,
            role: "admin",
            createdAt: serverTimestamp(),
          };
          await setDoc(userRef, adminDoc);
          await refreshUserData();
        } else {
          // If document exists but is not admin, warn them
          const data = snap.data();
          if (data?.role !== "admin") {
            setError(`Account found, but role is "${data?.role}" instead of "admin".`);
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed.";
      if (msg.includes("invalid-credential") || msg.includes("user-not-found") || msg.includes("wrong-password")) {
        setError("Invalid admin credentials. Please try again.");
      } else if (msg.includes("too-many-requests")) {
        setError("Too many attempts. Please wait before trying again.");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
          {/* Accent header stripe */}
          <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-rose-500 to-orange-400" />

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
                <ShieldAlert className="w-7 h-7 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Admin Portal
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Restricted access — authorised personnel only
              </p>
            </div>

            {/* Security notice */}
            <div className="flex items-center gap-2.5 bg-muted/60 border border-border rounded-xl px-4 py-3 mb-6 text-xs text-muted-foreground">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>
                Admin accounts are created manually. Do not share your credentials.
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {error && (
                <div className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="admin-email" className="text-sm font-semibold">
                  Admin Email
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@homemate.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-password" className="text-sm font-semibold">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-xl pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-700 text-white"
                disabled={submitting || isLoading}
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Authenticating…</>
                ) : (
                  <><LogIn className="w-4 h-4 mr-2" />Sign In as Admin</>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                ← Back to regular login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
