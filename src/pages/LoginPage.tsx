import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, type VendorData } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, LogIn, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { user, userData, login, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect after login based on role
  useEffect(() => {
    if (!user || !userData) return;

    if (user.role === "admin") {
      setLocation("/admin");
      return;
    }

    if (user.role === "vendor") {
      const vendorData = userData as VendorData;
      if (vendorData.status === "approved") {
        setLocation("/vendor-dashboard");
      }
      // pending/rejected handled by RoleProtectedRoute — stay on page
      return;
    }

    if (user.role === "customer") {
      setLocation("/bookings");
    }
  }, [user, userData, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed.";
      // Make Firebase errors more readable
      if (msg.includes("invalid-credential") || msg.includes("user-not-found") || msg.includes("wrong-password")) {
        setError("Invalid email or password. Please try again.");
      } else if (msg.includes("too-many-requests")) {
        setError("Too many attempts. Please try again later.");
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
        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Wrench className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Welcome back
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Sign in to your UrbanServices account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-sm font-semibold">
                Email Address
              </Label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password" className="text-sm font-semibold">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
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
              className="w-full h-11 rounded-xl font-semibold text-sm"
              disabled={submitting || isLoading}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-medium">
                New here?
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <Link href="/register">
              <Button variant="outline" className="w-full h-11 rounded-xl font-semibold text-sm">
                Create Customer Account
              </Button>
            </Link>
            <Link href="/vendor-register">
              <Button
                variant="ghost"
                className="w-full h-11 rounded-xl font-semibold text-sm text-muted-foreground hover:text-foreground"
              >
                Register as a Service Provider →
              </Button>
            </Link>
          </div>
        </div>

        {/* Admin link */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Are you an admin?{" "}
          <Link href="/admin-login" className="text-primary hover:underline underline-offset-2 font-medium">
            Admin Login
          </Link>
        </p>
      </div>
    </div>
  );
}
