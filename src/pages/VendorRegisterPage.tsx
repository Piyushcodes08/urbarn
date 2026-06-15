import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Wrench, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2,
  Briefcase, MapPin, Star,
} from "lucide-react";

const SERVICE_CATEGORIES = [
  // Appliance Repair
  "AC Repair & Service",
  "Washing Machine Repair",
  "Refrigerator Repair",
  "Geyser / Water Heater",
  "Microwave Repair",
  "Chimney Service",
  // Salon & Beauty
  "Salon at Home – Haircut & Styling",
  "Salon at Home – Massage Therapy",
  "Salon at Home – Facial & Skin Care",
  "Salon at Home – Waxing & Threading",
  "Salon at Home – Manicure & Pedicure",
  "Spa & Wellness",
  "Bridal & Party Makeup",
  // Cleaning
  "Home Cleaning",
  "Bathroom & Kitchen Cleaning",
  "Sofa & Carpet Cleaning",
  // Electrician
  "Electrician",
  // Plumbing
  "Plumbing",
  // Painting
  "Painting",
  // Pest Control
  "Pest Control",
  // Other
  "Carpenter",
  "Other",
];

export default function VendorRegisterPage() {
  const { user, registerVendor, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    serviceCategory: "",
    experience: "",
    city: "",
    address: "",
    businessName: "",
    idProof: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Redirect if already logged in as non-vendor
  useEffect(() => {
    if (user && user.role === "customer") setLocation("/bookings");
    if (user && user.role === "admin") setLocation("/admin");
  }, [user, setLocation]);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Please enter your full name.");
    if (!form.email.trim()) return setError("Please enter your email address.");
    if (!form.phone.trim()) return setError("Please enter your phone number.");
    if (!form.serviceCategory) return setError("Please select a service category.");
    if (!form.businessName.trim()) return setError("Please enter your business/professional name.");
    if (!form.city.trim()) return setError("Please enter your city.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");

    setSubmitting(true);
    try {
      await registerVendor({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        serviceCategory: form.serviceCategory,
        experience: form.experience.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        businessName: form.businessName.trim(),
        idProof: form.idProof.trim(),
      });
      setSubmitted(true);
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

  // ── Success State ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl shadow-lg p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Application Submitted!</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Your vendor application has been submitted successfully. Our team will review your
              profile and approve your account within <strong>24–48 hours</strong>.
              You'll be able to log in once approved.
            </p>
            <div className="bg-muted/50 rounded-xl p-4 text-left text-sm space-y-2 mb-6 border border-border">
              <p className="font-semibold text-foreground text-xs uppercase tracking-wider">What happens next?</p>
              <p className="text-muted-foreground">1. Admin reviews your application</p>
              <p className="text-muted-foreground">2. Account gets approved or rejected</p>
              <p className="text-muted-foreground">3. Login at <code className="text-primary">/login</code> once approved</p>
            </div>
            <Link href="/login">
              <Button className="w-full h-11 rounded-xl font-semibold">
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration Form ──────────────────────────────────────────────────────
  return (
    <div className="min-h-[85vh] px-4 py-12 bg-background">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Briefcase className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Become a Service Provider
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Register to offer your services on UrbanServices platform
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {error && (
              <div className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Section: Personal Info */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center text-[10px] font-bold">1</span>
                Personal Information
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="v-name" className="text-sm font-semibold">Full Name *</Label>
                  <Input id="v-name" type="text" placeholder="Priya Sharma" value={form.name} onChange={set("name")} className="h-11 rounded-xl" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="v-phone" className="text-sm font-semibold">Phone Number *</Label>
                  <Input id="v-phone" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set("phone")} className="h-11 rounded-xl" required />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="v-email" className="text-sm font-semibold">Email Address *</Label>
                  <Input id="v-email" type="email" placeholder="priya@example.com" autoComplete="email" value={form.email} onChange={set("email")} className="h-11 rounded-xl" required />
                </div>
              </div>
            </div>

            {/* Section: Business Info */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center text-[10px] font-bold">2</span>
                Professional Details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="v-biz" className="text-sm font-semibold">Business / Professional Name *</Label>
                  <Input id="v-biz" type="text" placeholder="Priya's Beauty Studio" value={form.businessName} onChange={set("businessName")} className="h-11 rounded-xl" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="v-category" className="text-sm font-semibold">Service Category *</Label>
                  <select
                    id="v-category"
                    value={form.serviceCategory}
                    onChange={set("serviceCategory")}
                    className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Select category…</option>
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="v-exp" className="text-sm font-semibold">
                    Experience <span className="font-normal text-muted-foreground">(years)</span>
                  </Label>
                  <div className="relative">
                    <Input id="v-exp" type="number" min="0" max="50" placeholder="e.g. 5" value={form.experience} onChange={set("experience")} className="h-11 rounded-xl pl-9" />
                    <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="v-city" className="text-sm font-semibold">City *</Label>
                  <div className="relative">
                    <Input id="v-city" type="text" placeholder="Mumbai" value={form.city} onChange={set("city")} className="h-11 rounded-xl pl-9" required />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="v-address" className="text-sm font-semibold">Full Address</Label>
                  <Input id="v-address" type="text" placeholder="Shop/flat no., street, area, city" value={form.address} onChange={set("address")} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="v-idproof" className="text-sm font-semibold">
                    ID Proof Reference <span className="font-normal text-muted-foreground">(Aadhaar / PAN / Driving License no.)</span>
                  </Label>
                  <Input id="v-idproof" type="text" placeholder="e.g. AADHAAR 1234 5678 9012" value={form.idProof} onChange={set("idProof")} className="h-11 rounded-xl" />
                </div>
              </div>
            </div>

            {/* Section: Password */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center text-[10px] font-bold">3</span>
                Set Password
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="v-password" className="text-sm font-semibold">Password *</Label>
                  <div className="relative">
                    <Input id="v-password" type={showPassword ? "text" : "password"} placeholder="Min 6 characters" autoComplete="new-password" value={form.password} onChange={set("password")} className="h-11 rounded-xl pr-11" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="v-confirm" className="text-sm font-semibold">Confirm Password *</Label>
                  <div className="relative">
                    <Input id="v-confirm" type={showPassword ? "text" : "password"} placeholder="Repeat password" autoComplete="new-password" value={form.confirmPassword} onChange={set("confirmPassword")} className="h-11 rounded-xl pr-11" required />
                    {form.confirmPassword && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {form.password === form.confirmPassword
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          : <AlertCircle className="w-4 h-4 text-destructive" />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="bg-muted/50 border border-border rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Note:</strong> After registration your account will be in{" "}
              <span className="text-yellow-600 font-semibold">pending</span> status. You can log in only once admin
              approves your profile. This process typically takes 24–48 hours.
            </div>

            <Button type="submit" className="w-full h-11 rounded-xl font-semibold text-sm" disabled={submitting || isLoading}>
              {submitting
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting application…</>
                : <><Wrench className="w-4 h-4 mr-2" />Submit Vendor Application</>
              }
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-medium">Already registered?</span>
            </div>
          </div>
          <Link href="/login">
            <Button variant="outline" className="w-full h-11 rounded-xl font-semibold text-sm">
              Sign In Instead
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
