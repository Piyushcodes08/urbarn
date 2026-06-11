import { Link } from "wouter";
import { Wrench, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube, ArrowRight, Heart, ShieldCheck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Footer() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast({
      title: "Subscribed successfully!",
      description: "Welcome to UrbanServices! You will now receive our latest updates and exclusive offers.",
    });
    setEmail("");
  };

  return (
    <footer className="bg-sidebar text-sidebar-foreground border-t border-sidebar-border mt-auto">
      {/* Upper Newsletter & Action Banner */}
      <div className="border-b border-sidebar-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Value Proposition */}
            <div className="lg:col-span-5 space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sidebar-accent text-sidebar-foreground border border-sidebar-border">
                <ShieldCheck className="w-3.5 h-3.5 text-sidebar-primary" />
                100% Happiness Guaranteed
              </span>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight">
                Subscribe to our service tips & offers
              </h3>
              <p className="text-sm text-sidebar-foreground/70 max-w-md">
                Get monthly maintenance checklists, early access to seasonal discounts, and verified home hacks.
              </p>
            </div>

            {/* Newsletter Subscription Input */}
            <div className="lg:col-span-7">
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 sm:max-w-xl lg:ml-auto">
                <div className="relative flex-grow">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-foreground/40" />
                  <Input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-sidebar-accent/50 border-sidebar-border hover:border-sidebar-border/80 focus:border-sidebar-primary text-sidebar-foreground placeholder:text-sidebar-foreground/45 w-full rounded-lg"
                    data-testid="input-footer-email"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 font-semibold px-6 h-11 transition-all rounded-lg shrink-0 flex items-center justify-center gap-2"
                  data-testid="button-footer-subscribe"
                >
                  Subscribe
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Main Directory Links Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Column 1: Brand & Bio */}
          <div className="lg:col-span-4 space-y-5">
            <Link href="/" className="flex items-center gap-2 group max-w-fit">
              <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center transition-transform group-hover:scale-105">
                <Wrench className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-sidebar-foreground tracking-tight">
                Urban<span className="text-sidebar-primary">Services</span>
              </span>
            </Link>
            <p className="text-sm text-sidebar-foreground/75 leading-relaxed">
              Leading on-demand home services marketplace. We connect customers with certified, background-verified professionals for beauty treatments, appliance repair, deep cleaning, electrical installations, and more.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="w-9 h-9 rounded-lg bg-sidebar-accent hover:bg-sidebar-primary hover:text-sidebar-primary-foreground flex items-center justify-center text-sidebar-foreground/85 transition-all" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-sidebar-accent hover:bg-sidebar-primary hover:text-sidebar-primary-foreground flex items-center justify-center text-sidebar-foreground/85 transition-all" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-sidebar-accent hover:bg-sidebar-primary hover:text-sidebar-primary-foreground flex items-center justify-center text-sidebar-foreground/85 transition-all" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-sidebar-accent hover:bg-sidebar-primary hover:text-sidebar-primary-foreground flex items-center justify-center text-sidebar-foreground/85 transition-all" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-sidebar-accent hover:bg-sidebar-primary hover:text-sidebar-primary-foreground flex items-center justify-center text-sidebar-foreground/85 transition-all" aria-label="YouTube">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Popular Categories */}
          <div className="lg:col-span-3 lg:col-start-6 space-y-4">
            <h4 className="text-sm font-semibold tracking-wider uppercase text-sidebar-primary">
              Popular Services
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/services?categoryId=1" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors flex items-center gap-1">
                  Salon & Grooming at Home
                </Link>
              </li>
              <li>
                <Link href="/services?categoryId=3" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors flex items-center gap-1">
                  Home Deep Cleaning
                </Link>
              </li>
              <li>
                <Link href="/services?categoryId=2" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors flex items-center gap-1">
                  AC Service & Repair
                </Link>
              </li>
              <li>
                <Link href="/services?categoryId=7" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors flex items-center gap-1">
                  Appliance Servicing
                </Link>
              </li>
              <li>
                <Link href="/services?categoryId=6" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors flex items-center gap-1">
                  Professional Painting
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Navigation */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-semibold tracking-wider uppercase text-sidebar-primary">
              Company & Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                  Home Page
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                  All Categories
                </Link>
              </li>
              <li>
                <Link href="/professionals" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                  Our Specialists
                </Link>
              </li>
              <li>
                <Link href="/bookings" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                  My Booking History
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-sm font-semibold tracking-wider uppercase text-sidebar-primary">
              Get in Touch
            </h4>
            <ul className="space-y-3.5 text-sm text-sidebar-foreground/70">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-sidebar-primary shrink-0 mt-0.5" />
                <span>100 Service Boulevard, Tech Park, Suite 400, NY 10001</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-sidebar-primary shrink-0" />
                <a href="tel:+18005550199" className="hover:text-sidebar-foreground transition-colors">+1 (800) 555-0199</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-sidebar-primary shrink-0" />
                <a href="mailto:support@urbanservices.com" className="hover:text-sidebar-foreground transition-colors">support@urbanservices.com</a>
              </li>
              <li className="flex items-center gap-2.5 pt-1">
                <HelpCircle className="w-4 h-4 text-sidebar-primary shrink-0" />
                <span className="text-xs italic">Support operating 24/7</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Bottom Metadata & Copyright */}
      <div className="border-t border-sidebar-border/50 bg-sidebar-accent/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-sidebar-foreground/60 text-center md:text-left">
            © {new Date().getFullYear()} UrbanServices. All rights reserved.
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-sidebar-foreground/60">
            <a href="#" className="hover:text-sidebar-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-sidebar-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-sidebar-foreground transition-colors">Safety Guidelines</a>
            <a href="#" className="hover:text-sidebar-foreground transition-colors">Cookie Preferences</a>
          </div>
          <div className="text-xs text-sidebar-foreground/50 flex items-center gap-1">
            Handcrafted with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" /> for home care.
          </div>
        </div>
      </div>
    </footer>
  );
}
