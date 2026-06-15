import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, UserPlus, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const { user, registerCustomer, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", phone: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) setLocation("/bookings");
  }, [user, setLocation]);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Please enter your full name.");
    if (!form.email.trim()) return setError("Please enter your email address.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");

    setSubmitting(true);
    try {
      await registerCustomer(form.name.trim(), form.email.trim(), form.password, form.phone.trim());
      // AuthProvider will update state; useEffect will redirect to /bookings
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      if (msg.includes("email-already-in-use")) {
        setError("This email is already registered. Try logging in instead.");
      } else if (msg.includes("invalid-email")) {
        setError("Please enter a valid email address.");
      } else if (msg.includes("weak-password")) {
        setError("Password is too weak. Use at least 6 characters.");
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
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <UserPlus className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Create Account</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Join UrbanServices and book home services instantly
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="reg-name" className="text-sm font-semibold">Full Name</Label>
              <Input
                id="reg-name"
                type="text"
                placeholder="Anjali Mehta"
                autoComplete="name"
                value={form.name}
                onChange={set("name")}
                className="h-11 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-email" className="text-sm font-semibold">Email Address</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="anjali@example.com"
                autoComplete="email"
                value={form.email}
                onChange={set("email")}
                className="h-11 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-phone" className="text-sm font-semibold">
                Phone Number <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="reg-phone"
                type="tel"
                placeholder="+91 98765 43210"
                autoComplete="tel"
                value={form.phone}
                onChange={set("phone")}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reg-password" className="text-sm font-semibold">Password</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 chars"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={set("password")}
                    className="h-11 rounded-xl pr-10"
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
              <div className="space-y-1.5">
                <Label htmlFor="reg-confirm" className="text-sm font-semibold">Confirm</Label>
                <div className="relative">
                  <Input
                    id="reg-confirm"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={set("confirmPassword")}
                    className="h-11 rounded-xl pr-10"
                    required
                  />
                  {form.confirmPassword && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {form.password === form.confirmPassword ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-semibold text-sm mt-2"
              disabled={submitting || isLoading}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account…</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" />Create Customer Account</>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-medium">Already have an account?</span>
            </div>
          </div>

          <Link href="/login">
            <Button variant="outline" className="w-full h-11 rounded-xl font-semibold text-sm">
              Sign In Instead
            </Button>
          </Link>
        </div>

        <div className="text-center mt-6 space-y-1">
          <p className="text-xs text-muted-foreground">
            Want to offer services?{" "}
            <Link href="/vendor-register" className="text-primary hover:underline underline-offset-2 font-medium">
              Register as a Provider →
            </Link>
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <Wrench className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">UrbanServices</span>
          </div>
        </div>
      </div>
    </div>
  );
}
