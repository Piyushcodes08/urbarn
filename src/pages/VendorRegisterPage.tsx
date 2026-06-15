import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { db, auth, isConfigured } from "@/lib/firebase";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  User, Mail, Phone, Lock, Eye, EyeOff, Briefcase, MapPin,
  Star, Clock, CreditCard, CheckCircle2, AlertCircle,
  Loader2, Upload, ChevronRight, ChevronLeft, Building2,
  IndianRupee, ShieldCheck, Calendar, Camera, X,
} from "lucide-react";

const SERVICE_CATEGORIES = [
  "AC Repair & Service","Washing Machine Repair","Refrigerator Repair",
  "Geyser / Water Heater","Microwave Repair","Chimney Service",
  "Salon at Home – Haircut & Styling","Salon at Home – Massage Therapy",
  "Salon at Home – Facial & Skin Care","Salon at Home – Waxing & Threading",
  "Salon at Home – Manicure & Pedicure","Spa & Wellness","Bridal & Party Makeup",
  "Home Cleaning","Bathroom & Kitchen Cleaning","Sofa & Carpet Cleaning",
  "Electrician","Plumbing","Painting","Pest Control","Carpenter","Other",
];

const VENDOR_TYPES = ["Individual Professional","Small Business","Registered Company","Freelancer"];
const PAYMENT_METHODS = ["Cash","UPI","Bank Transfer","Card","All Methods"];
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const STEPS = [
  { id: 1, label: "Account Setup", icon: User },
  { id: 2, label: "Professional Identity", icon: Briefcase },
  { id: 3, label: "Service Coverage", icon: MapPin },
  { id: 4, label: "Service Pricing", icon: IndianRupee },
  { id: 5, label: "Availability", icon: Calendar },
  { id: 6, label: "Verification Docs", icon: ShieldCheck },
  { id: 7, label: "Bank & Payout", icon: CreditCard },
  { id: 8, label: "Review & Submit", icon: CheckCircle2 },
];

interface FData {
  fullName: string; email: string; mobile: string;
  password: string; confirmPassword: string;
  profilePhoto: File | null; profilePhotoPreview: string;
  vendorType: string; businessName: string; serviceCategory: string;
  experience: string; bio: string; skills: string;
  city: string; area: string; address: string; pincode: string; serviceRadius: string;
  startingPrice: string; visitingCharge: string; serviceCharge: string;
  minBookingAmount: string; paymentAccepted: string[];
  discount: string; cancellationCharge: string;
  workingDays: string[]; startTime: string; endTime: string;
  emergencyService: boolean; sameDayBooking: boolean;
  aadhaarFront: File | null; aadhaarBack: File | null; panCard: File | null;
  businessCertificate: File | null; experienceCertificate: File | null;
  policeVerification: File | null; gstNumber: string;
  accountHolderName: string; bankName: string;
  accountNumber: string; confirmAccountNumber: string;
  ifscCode: string; upiId: string;
  agreeTerms: boolean; agreeAccuracy: boolean;
}

const INIT: FData = {
  fullName:"",email:"",mobile:"",password:"",confirmPassword:"",
  profilePhoto:null,profilePhotoPreview:"",
  vendorType:"",businessName:"",serviceCategory:"",experience:"",bio:"",skills:"",
  city:"",area:"",address:"",pincode:"",serviceRadius:"",
  startingPrice:"",visitingCharge:"",serviceCharge:"",minBookingAmount:"",
  paymentAccepted:[],discount:"",cancellationCharge:"",
  workingDays:[],startTime:"09:00",endTime:"18:00",
  emergencyService:false,sameDayBooking:false,
  aadhaarFront:null,aadhaarBack:null,panCard:null,
  businessCertificate:null,experienceCertificate:null,policeVerification:null,gstNumber:"",
  accountHolderName:"",bankName:"",accountNumber:"",confirmAccountNumber:"",ifscCode:"",upiId:"",
  agreeTerms:false,agreeAccuracy:false,
};

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="flex items-center gap-1.5 text-xs text-red-600 mt-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{msg}</p>;
}

function SecTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">{children}</h3>;
}

function FileField({ label, required, file, onChange }: {
  label: string; required?: boolean; file: File | null; onChange: (f: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-slate-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      <div onClick={() => ref.current?.click()} className={cn(
        "flex items-center gap-3 h-11 px-3 rounded-xl border cursor-pointer transition-all text-sm",
        file ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 text-slate-500"
      )}>
        {file ? (
          <><CheckCircle2 className="w-4 h-4 shrink-0" /><span className="truncate text-xs font-medium flex-1">{file.name}</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); onChange(null); }} className="text-emerald-600 hover:text-red-500"><X className="w-4 h-4" /></button></>
        ) : (
          <><Upload className="w-4 h-4 shrink-0" /><span className="text-xs">Click to upload</span></>
        )}
      </div>
      <input ref={ref} type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </div>
  );
}

function ReviewCard({ title, rows }: { title: string; rows: { label: string; value: string }[] }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden mb-4">
      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</p>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start px-4 py-2.5 gap-4">
            <span className="text-xs text-slate-500 w-40 shrink-0">{r.label}</span>
            <span className="text-sm font-medium text-slate-800 break-all">{r.value || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function validate(step: number, f: FData): Record<string, string> {
  const e: Record<string, string> = {};
  if (step === 1) {
    if (!f.fullName.trim()) e.fullName = "Full name is required.";
    if (!f.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Valid email is required.";
    if (!f.mobile.trim() || f.mobile.replace(/\D/g, "").length < 10) e.mobile = "Valid 10-digit mobile number is required.";
    if (f.password.length < 6) e.password = "Password must be at least 6 characters.";
    if (f.password !== f.confirmPassword) e.confirmPassword = "Passwords do not match.";
  }
  if (step === 2) {
    if (!f.vendorType) e.vendorType = "Please select vendor type.";
    if (!f.businessName.trim()) e.businessName = "Business name is required.";
    if (!f.serviceCategory) e.serviceCategory = "Please select a category.";
    if (!f.experience.trim()) e.experience = "Experience is required.";
    if (!f.bio.trim()) e.bio = "Professional bio is required.";
  }
  if (step === 3) {
    if (!f.city.trim()) e.city = "City is required.";
    if (!f.area.trim()) e.area = "Area/locality is required.";
    if (!f.address.trim()) e.address = "Address is required.";
    if (!f.pincode.trim() || f.pincode.replace(/\D/g, "").length < 6) e.pincode = "Valid 6-digit pincode is required.";
    if (!f.serviceRadius.trim()) e.serviceRadius = "Service radius is required.";
  }
  if (step === 4) {
    if (!f.startingPrice.trim()) e.startingPrice = "Starting price is required.";
    if (f.paymentAccepted.length === 0) e.paymentAccepted = "Select at least one payment method.";
  }
  if (step === 5) {
    if (f.workingDays.length === 0) e.workingDays = "Select at least one working day.";
    if (!f.startTime) e.startTime = "Start time is required.";
    if (!f.endTime) e.endTime = "End time is required.";
  }
  if (step === 6) {
    if (!f.aadhaarFront) e.aadhaarFront = "Aadhaar front is required.";
    if (!f.aadhaarBack) e.aadhaarBack = "Aadhaar back is required.";
    if (!f.panCard) e.panCard = "PAN card is required.";
  }
  if (step === 7) {
    if (!f.accountHolderName.trim()) e.accountHolderName = "Account holder name is required.";
    if (!f.bankName.trim()) e.bankName = "Bank name is required.";
    if (!f.accountNumber.trim()) e.accountNumber = "Account number is required.";
    if (f.accountNumber !== f.confirmAccountNumber) e.confirmAccountNumber = "Account numbers do not match.";
    if (!f.ifscCode.trim()) e.ifscCode = "IFSC code is required.";
  }
  if (step === 8) {
    if (!f.agreeTerms) e.agreeTerms = "Please accept Terms & Conditions.";
    if (!f.agreeAccuracy) e.agreeAccuracy = "Please confirm information accuracy.";
  }
  return e;
}

export default function VendorRegisterPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FData>(INIT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.role === "customer") setLocation("/bookings");
    if (user?.role === "admin") setLocation("/admin");
  }, [user, setLocation]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const set = <K extends keyof FData>(k: K, v: FData[K]) => setForm(p => ({ ...p, [k]: v }));

  const fld = (k: keyof FData) => ({
    value: form[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      set(k, e.target.value as FData[typeof k]),
  });

  const toggle = (k: "paymentAccepted" | "workingDays", v: string) => {
    const arr = form[k] as string[];
    set(k, arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  };

  const next = () => {
    const errs = validate(step, form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
  };

  const back = () => { setErrors({}); setStep(s => s - 1); };

  const uploadFile = async (uid: string, file: File, path: string) => {
    const storage = getStorage();
    const r = storageRef(storage, `vendors/${uid}/${path}`);
    await uploadBytes(r, file);
    return getDownloadURL(r);
  };

  const submit = async () => {
    const errs = validate(8, form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (!isConfigured) { setSubmitError("Firebase is not configured."); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      const uid = cred.user.uid;
      let profilePhotoUrl = "", aadhaarFrontUrl = "", aadhaarBackUrl = "";
      let panCardUrl = "", bizCertUrl = "", expCertUrl = "", policeUrl = "";
      if (form.profilePhoto) profilePhotoUrl = await uploadFile(uid, form.profilePhoto, "profile-photo");
      if (form.aadhaarFront) aadhaarFrontUrl = await uploadFile(uid, form.aadhaarFront, "aadhaar-front");
      if (form.aadhaarBack) aadhaarBackUrl = await uploadFile(uid, form.aadhaarBack, "aadhaar-back");
      if (form.panCard) panCardUrl = await uploadFile(uid, form.panCard, "pan-card");
      if (form.businessCertificate) bizCertUrl = await uploadFile(uid, form.businessCertificate, "business-cert");
      if (form.experienceCertificate) expCertUrl = await uploadFile(uid, form.experienceCertificate, "exp-cert");
      if (form.policeVerification) policeUrl = await uploadFile(uid, form.policeVerification, "police-ver");
      const vDoc = {
        uid, name: form.fullName.trim(), email: form.email.trim(), phone: form.mobile.trim(),
        profilePhotoUrl, vendorType: form.vendorType, businessName: form.businessName.trim(),
        serviceCategory: form.serviceCategory, experience: form.experience.trim(),
        bio: form.bio.trim(), skills: form.skills.trim(),
        city: form.city.trim(), area: form.area.trim(), address: form.address.trim(),
        pincode: form.pincode.trim(), serviceRadius: form.serviceRadius.trim(),
        startingPrice: form.startingPrice, visitingCharge: form.visitingCharge,
        serviceCharge: form.serviceCharge, minBookingAmount: form.minBookingAmount,
        paymentAccepted: form.paymentAccepted, discount: form.discount,
        cancellationCharge: form.cancellationCharge,
        workingDays: form.workingDays, startTime: form.startTime, endTime: form.endTime,
        emergencyService: form.emergencyService, sameDayBooking: form.sameDayBooking,
        documents: { aadhaarFront: aadhaarFrontUrl, aadhaarBack: aadhaarBackUrl, panCard: panCardUrl,
          businessCertificate: bizCertUrl, experienceCertificate: expCertUrl, policeVerification: policeUrl },
        gstNumber: form.gstNumber,
        bank: { accountHolderName: form.accountHolderName.trim(), bankName: form.bankName.trim(),
          accountNumber: form.accountNumber.trim(), ifscCode: form.ifscCode.trim(), upiId: form.upiId.trim() },
        role: "vendor", status: "pending", isApproved: false,
        rating: 0, totalBookings: 0, createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "vendors", uid), vDoc);
      await setDoc(doc(db, "users", uid), {
        uid, name: form.fullName.trim(), email: form.email.trim(), phone: form.mobile.trim(),
        role: "vendor", status: "pending", createdAt: serverTimestamp(),
      });
      await signOut(auth);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed.";
      setSubmitError(msg.includes("email-already-in-use") ? "This email is already registered. Please log in." : msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 text-center border border-slate-100">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Application Submitted!</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Your vendor application has been submitted successfully. Please wait for admin approval.
            You'll be notified once reviewed (typically within 24–48 hours).
          </p>
          <div className="bg-slate-50 rounded-2xl p-5 text-left space-y-3 mb-8 border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">What happens next</p>
            {["Admin reviews your documents and profile","You receive an approval notification","Once approved, log in at /login to access your dashboard"].map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-sm text-slate-600">{s}</span>
              </div>
            ))}
          </div>
          <Link href="/login"><Button className="w-full h-12 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-white">Back to Login</Button></Link>
        </div>
      </div>
    );
  }

  const progress = Math.round(((step - 1) / (STEPS.length - 1)) * 100);

  return (
    <div ref={topRef} className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">Become a Service Professional</h1>
          <p className="text-slate-500 text-sm mt-2">Complete all 8 steps to register as a verified service provider on UrbanServices.</p>
        </div>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Sidebar */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sticky top-24">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 px-2">Registration Steps</p>
              <nav className="space-y-1">
                {STEPS.map((s) => {
                  const Icon = s.icon;
                  const done = step > s.id;
                  const active = step === s.id;
                  return (
                    <button key={s.id} type="button" onClick={() => done && setStep(s.id)}
                      className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all",
                        active ? "bg-blue-600 text-white font-semibold shadow-sm" : done ? "text-slate-600 hover:bg-slate-50 cursor-pointer" : "text-slate-400 cursor-default")}>
                      <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                        active ? "bg-white/20 text-white" : done ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                        {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.id}
                      </span>
                      <span className="truncate">{s.label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="mt-5 px-2">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1.5"><span>Progress</span><span>{progress}%</span></div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Mobile pills */}
            <div className="lg:hidden flex gap-1.5 mb-4 overflow-x-auto pb-1">
              {STEPS.map((s) => (
                <div key={s.id} className={cn("shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  step === s.id ? "bg-blue-600 text-white scale-110 shadow" : step > s.id ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400")}>
                  {step > s.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.id}
                </div>
              ))}
            </div>
            {/* Mobile progress */}
            <div className="lg:hidden mb-5">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold">Step {step} of {STEPS.length}: {STEPS[step - 1].label}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:p-8">
              {/* Step header */}
              <div className="flex items-center gap-3 mb-7 pb-5 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                  {(() => { const Icon = STEPS[step - 1].icon; return <Icon className="w-5 h-5 text-white" />; })()}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Step {step} of {STEPS.length}</p>
                  <h2 className="text-lg font-bold text-slate-800">{STEPS[step - 1].label}</h2>
                </div>
              </div>

              {/* STEP 1: Account Setup */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="flex flex-col items-center gap-2 mb-2">
                    <div className="relative w-24 h-24 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all overflow-hidden"
                      onClick={() => document.getElementById("pp-input")?.click()}>
                      {form.profilePhotoPreview
                        ? <img src={form.profilePhotoPreview} alt="Profile" className="w-full h-full object-cover" />
                        : <div className="flex flex-col items-center gap-1 text-slate-400"><Camera className="w-6 h-6" /><span className="text-[10px]">Photo</span></div>}
                    </div>
                    <input id="pp-input" type="file" className="hidden" accept="image/*"
                      onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; set("profilePhoto", f); set("profilePhotoPreview", URL.createObjectURL(f)); }} />
                    <p className="text-xs text-slate-400">Upload profile photo (optional)</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-sm font-semibold text-slate-700">Full Name <span className="text-red-500">*</span></Label>
                      <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Priya Sharma" {...fld("fullName")} className="pl-9 h-11 rounded-xl border-slate-200" /></div>
                      <Err msg={errors.fullName} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-slate-700">Email Address <span className="text-red-500">*</span></Label>
                      <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input type="email" placeholder="priya@example.com" {...fld("email")} className="pl-9 h-11 rounded-xl border-slate-200" /></div>
                      <Err msg={errors.email} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-slate-700">Mobile Number <span className="text-red-500">*</span></Label>
                      <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input type="tel" placeholder="+91 98765 43210" {...fld("mobile")} className="pl-9 h-11 rounded-xl border-slate-200" /></div>
                      <Err msg={errors.mobile} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-slate-700">Password <span className="text-red-500">*</span></Label>
                      <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input type={showPwd ? "text" : "password"} placeholder="Min 6 characters" {...fld("password")} className="pl-9 pr-10 h-11 rounded-xl border-slate-200" />
                        <button type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button></div>
                      <Err msg={errors.password} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-slate-700">Confirm Password <span className="text-red-500">*</span></Label>
                      <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input type={showPwd ? "text" : "password"} placeholder="Repeat password" {...fld("confirmPassword")} className="pl-9 pr-10 h-11 rounded-xl border-slate-200" />
                        {form.confirmPassword && <span className="absolute right-3 top-1/2 -translate-y-1/2">
                          {form.password === form.confirmPassword ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                        </span>}</div>
                      <Err msg={errors.confirmPassword} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Professional Identity */}
              {step === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Vendor Type <span className="text-red-500">*</span></Label>
                    <select {...fld("vendorType")} className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option value="">Select type…</option>
                      {VENDOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <Err msg={errors.vendorType} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Business / Professional Name <span className="text-red-500">*</span></Label>
                    <div className="relative"><Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input placeholder="Priya's Beauty Studio" {...fld("businessName")} className="pl-9 h-11 rounded-xl border-slate-200" /></div>
                    <Err msg={errors.businessName} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Service Category <span className="text-red-500">*</span></Label>
                    <select {...fld("serviceCategory")} className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option value="">Select category…</option>
                      {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <Err msg={errors.serviceCategory} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Years of Experience <span className="text-red-500">*</span></Label>
                    <div className="relative"><Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input type="number" min="0" max="50" placeholder="e.g. 5" {...fld("experience")} className="pl-9 h-11 rounded-xl border-slate-200" /></div>
                    <Err msg={errors.experience} />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Professional Bio <span className="text-red-500">*</span></Label>
                    <textarea rows={3} placeholder="Briefly describe your expertise and what makes you stand out…"
                      value={form.bio} onChange={(e) => set("bio", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                    <Err msg={errors.bio} />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Main Skills / Services</Label>
                    <Input placeholder="e.g. Haircut, Facial, Waxing (comma separated)" {...fld("skills")} className="h-11 rounded-xl border-slate-200" />
                  </div>
                </div>
              )}

              {/* STEP 3: Service Coverage */}
              {step === 3 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">City <span className="text-red-500">*</span></Label>
                    <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input placeholder="Mumbai" {...fld("city")} className="pl-9 h-11 rounded-xl border-slate-200" /></div>
                    <Err msg={errors.city} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Area / Locality <span className="text-red-500">*</span></Label>
                    <Input placeholder="Andheri West" {...fld("area")} className="h-11 rounded-xl border-slate-200" />
                    <Err msg={errors.area} />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Complete Address <span className="text-red-500">*</span></Label>
                    <Input placeholder="Shop no., Street, Landmark, Area, City" {...fld("address")} className="h-11 rounded-xl border-slate-200" />
                    <Err msg={errors.address} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Pincode <span className="text-red-500">*</span></Label>
                    <Input placeholder="400001" maxLength={6} {...fld("pincode")} className="h-11 rounded-xl border-slate-200" />
                    <Err msg={errors.pincode} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Service Radius <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input placeholder="e.g. 10" {...fld("serviceRadius")} className="h-11 rounded-xl border-slate-200 pr-10" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">km</span>
                    </div>
                    <Err msg={errors.serviceRadius} />
                  </div>
                </div>
              )}

              {/* STEP 4: Service Pricing */}
              {step === 4 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { k: "startingPrice", label: "Starting Price", req: true, prefix: true, ph: "299" },
                      { k: "visitingCharge", label: "Visiting Charge", req: false, prefix: true, ph: "50" },
                      { k: "serviceCharge", label: "Service Charge", req: false, prefix: true, ph: "100" },
                      { k: "minBookingAmount", label: "Min Booking Amount", req: false, prefix: true, ph: "199" },
                      { k: "discount", label: "Discount / Offer", req: false, prefix: false, ph: "10% off on first booking" },
                      { k: "cancellationCharge", label: "Cancellation Charge", req: false, prefix: true, ph: "0" },
                    ].map(({ k, label, req, prefix, ph }) => (
                      <div key={k} className="space-y-1.5">
                        <Label className="text-sm font-semibold text-slate-700">{label}{req && <span className="text-red-500 ml-0.5">*</span>}</Label>
                        <div className="relative">
                          {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>}
                          <Input placeholder={ph} value={form[k as keyof FData] as string}
                            onChange={(e) => set(k as keyof FData, e.target.value as FData[keyof FData])}
                            className={cn("h-11 rounded-xl border-slate-200", prefix && "pl-7")} />
                        </div>
                        <Err msg={errors[k]} />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Payment Accepted <span className="text-red-500">*</span></Label>
                    <div className="flex flex-wrap gap-2">
                      {PAYMENT_METHODS.map(m => (
                        <button key={m} type="button" onClick={() => toggle("paymentAccepted", m)}
                          className={cn("px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all",
                            form.paymentAccepted.includes(m) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-400")}>
                          {m}
                        </button>
                      ))}
                    </div>
                    <Err msg={errors.paymentAccepted} />
                  </div>
                </div>
              )}

              {/* STEP 5: Availability */}
              {step === 5 && (
                <div className="space-y-5">
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">Working Days <span className="text-red-500">*</span></Label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map(d => (
                        <button key={d} type="button" onClick={() => toggle("workingDays", d)}
                          className={cn("px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all",
                            form.workingDays.includes(d) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-400")}>
                          {d.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                    <Err msg={errors.workingDays} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Start Time <span className="text-red-500">*</span></Label>
                      <Input type="time" {...fld("startTime")} className="h-11 rounded-xl border-slate-200" />
                      <Err msg={errors.startTime} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> End Time <span className="text-red-500">*</span></Label>
                      <Input type="time" {...fld("endTime")} className="h-11 rounded-xl border-slate-200" />
                      <Err msg={errors.endTime} />
                    </div>
                  </div>
                  {[
                    { k: "emergencyService", label: "Emergency Service Available", desc: "Accept urgent/out-of-hours bookings" },
                    { k: "sameDayBooking", label: "Same Day Booking Available", desc: "Accept bookings for the same day" },
                  ].map(({ k, label, desc }) => (
                    <label key={k} className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all">
                      <input type="checkbox" checked={form[k as keyof FData] as boolean}
                        onChange={(e) => set(k as keyof FData, e.target.checked as FData[keyof FData])}
                        className="mt-0.5 w-4 h-4 rounded accent-blue-600" />
                      <div><p className="text-sm font-semibold text-slate-700">{label}</p><p className="text-xs text-slate-500 mt-0.5">{desc}</p></div>
                    </label>
                  ))}
                </div>
              )}

              {/* STEP 6: Verification Documents */}
              {step === 6 && (
                <div className="space-y-5">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">Upload clear photos or scanned copies. All documents are securely stored and used only for verification. Accepted: JPG, PNG, PDF.</p>
                  </div>
                  <div>
                    <SecTitle>Identity Proof (Required)</SecTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><FileField label="Aadhaar Card – Front" required file={form.aadhaarFront} onChange={(f) => set("aadhaarFront", f)} /><Err msg={errors.aadhaarFront} /></div>
                      <div><FileField label="Aadhaar Card – Back" required file={form.aadhaarBack} onChange={(f) => set("aadhaarBack", f)} /><Err msg={errors.aadhaarBack} /></div>
                      <div><FileField label="PAN Card" required file={form.panCard} onChange={(f) => set("panCard", f)} /><Err msg={errors.panCard} /></div>
                    </div>
                  </div>
                  <div>
                    <SecTitle>Business Documents (Optional)</SecTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FileField label="Business Certificate / Shop License" file={form.businessCertificate} onChange={(f) => set("businessCertificate", f)} />
                      <FileField label="Experience Certificate" file={form.experienceCertificate} onChange={(f) => set("experienceCertificate", f)} />
                      <FileField label="Police Verification Certificate" file={form.policeVerification} onChange={(f) => set("policeVerification", f)} />
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-slate-700">GST Number <span className="text-xs font-normal text-slate-400">(optional)</span></Label>
                        <Input placeholder="22AAAAA0000A1Z5" {...fld("gstNumber")} className="h-11 rounded-xl border-slate-200" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: Bank & Payout */}
              {step === 7 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                    <CreditCard className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 leading-relaxed">Your bank details are encrypted and used only for service payment settlements. Never shared publicly.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-slate-700">Account Holder Name <span className="text-red-500">*</span></Label>
                      <Input placeholder="Priya Sharma" {...fld("accountHolderName")} className="h-11 rounded-xl border-slate-200" />
                      <Err msg={errors.accountHolderName} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-slate-700">Bank Name <span className="text-red-500">*</span></Label>
                      <Input placeholder="State Bank of India" {...fld("bankName")} className="h-11 rounded-xl border-slate-200" />
                      <Err msg={errors.bankName} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-slate-700">Account Number <span className="text-red-500">*</span></Label>
                      <Input type="password" placeholder="Enter account number" {...fld("accountNumber")} className="h-11 rounded-xl border-slate-200" />
                      <Err msg={errors.accountNumber} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-slate-700">Confirm Account Number <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Input type="password" placeholder="Re-enter account number" {...fld("confirmAccountNumber")} className="h-11 rounded-xl border-slate-200 pr-10" />
                        {form.confirmAccountNumber && <span className="absolute right-3 top-1/2 -translate-y-1/2">
                          {form.accountNumber === form.confirmAccountNumber ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                        </span>}
                      </div>
                      <Err msg={errors.confirmAccountNumber} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-slate-700">IFSC Code <span className="text-red-500">*</span></Label>
                      <Input placeholder="SBIN0001234" {...fld("ifscCode")} className="h-11 rounded-xl border-slate-200" />
                      <Err msg={errors.ifscCode} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-slate-700">UPI ID <span className="text-xs font-normal text-slate-400">(optional)</span></Label>
                      <Input placeholder="priya@okaxis" {...fld("upiId")} className="h-11 rounded-xl border-slate-200" />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 8: Review & Submit */}
              {step === 8 && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">Review all your information carefully before submitting.</p>
                  <ReviewCard title="Account Setup" rows={[
                    { label: "Full Name", value: form.fullName },
                    { label: "Email", value: form.email },
                    { label: "Mobile", value: form.mobile },
                  ]} />
                  <ReviewCard title="Professional Identity" rows={[
                    { label: "Vendor Type", value: form.vendorType },
                    { label: "Business Name", value: form.businessName },
                    { label: "Service Category", value: form.serviceCategory },
                    { label: "Experience", value: form.experience ? `${form.experience} years` : "" },
                    { label: "Bio", value: form.bio },
                    { label: "Skills", value: form.skills },
                  ]} />
                  <ReviewCard title="Service Coverage" rows={[
                    { label: "City", value: form.city },
                    { label: "Area", value: form.area },
                    { label: "Address", value: form.address },
                    { label: "Pincode", value: form.pincode },
                    { label: "Service Radius", value: form.serviceRadius ? `${form.serviceRadius} km` : "" },
                  ]} />
                  <ReviewCard title="Pricing" rows={[
                    { label: "Starting Price", value: form.startingPrice ? `₹${form.startingPrice}` : "" },
                    { label: "Visiting Charge", value: form.visitingCharge ? `₹${form.visitingCharge}` : "" },
                    { label: "Min Booking Amount", value: form.minBookingAmount ? `₹${form.minBookingAmount}` : "" },
                    { label: "Payment Methods", value: form.paymentAccepted.join(", ") },
                  ]} />
                  <ReviewCard title="Availability" rows={[
                    { label: "Working Days", value: form.workingDays.map(d => d.slice(0, 3)).join(", ") },
                    { label: "Hours", value: form.startTime && form.endTime ? `${form.startTime} – ${form.endTime}` : "" },
                    { label: "Emergency Service", value: form.emergencyService ? "Yes" : "No" },
                    { label: "Same Day Booking", value: form.sameDayBooking ? "Yes" : "No" },
                  ]} />
                  <ReviewCard title="Bank Details" rows={[
                    { label: "Account Holder", value: form.accountHolderName },
                    { label: "Bank", value: form.bankName },
                    { label: "IFSC", value: form.ifscCode },
                    { label: "UPI ID", value: form.upiId },
                  ]} />
                  <div className="space-y-3 pt-2">
                    {[
                      { k: "agreeTerms", label: "I have read and agree to the Terms & Conditions and Privacy Policy of UrbanServices." },
                      { k: "agreeAccuracy", label: "I confirm that all information provided is accurate and I am the rightful owner of the documents submitted." },
                    ].map(({ k, label }) => (
                      <label key={k} className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={form[k as keyof FData] as boolean}
                          onChange={(e) => set(k as keyof FData, e.target.checked as FData[keyof FData])}
                          className="mt-0.5 w-4 h-4 rounded accent-blue-600 shrink-0" />
                        <span className="text-sm text-slate-600 leading-relaxed">{label}</span>
                      </label>
                    ))}
                    <Err msg={errors.agreeTerms || errors.agreeAccuracy} />
                  </div>
                  {submitError && (
                    <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{submitError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className={cn("flex mt-8 pt-6 border-t border-slate-100", step === 1 ? "justify-end" : "justify-between")}>
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={back}
                    className="h-11 px-6 rounded-xl border-slate-200 text-slate-600 hover:border-slate-300 font-semibold gap-2">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>
                )}
                {step < 8 ? (
                  <Button type="button" onClick={next}
                    className="h-11 px-7 rounded-xl font-semibold gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                    Continue <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button type="button" onClick={submit} disabled={submitting}
                    className="h-11 px-7 rounded-xl font-semibold gap-2 bg-slate-800 hover:bg-slate-700 text-white shadow-sm">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><CheckCircle2 className="w-4 h-4" /> Submit Application</>}
                  </Button>
                )}
              </div>
            </div>

            <p className="text-center text-sm text-slate-500 mt-5">
              Already registered?{" "}
              <Link href="/login" className="text-blue-600 font-semibold hover:underline underline-offset-2">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
