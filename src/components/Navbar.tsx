import { Link, useLocation } from "wouter";
import { Wrench, Menu, X, LogIn, LogOut, User, ShieldAlert, Award, UserCheck, Star } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth, SEED_USERS } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, showLoginModal, setShowLoginModal, login, logout } = useAuth();
  
  // Custom form state for simulation
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [customRole, setCustomRole] = useState<"customer" | "vendor" | "admin">("customer");

  // Dynamic Nav Links
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/categories", label: "Services" },
    { href: "/professionals", label: "Professionals" },
  ];

  if (user) {
    if (user.role === "customer") {
      navLinks.push({ href: "/bookings", label: "My Bookings" });
    } else if (user.role === "vendor") {
      navLinks.push({ href: "/vendor-dashboard", label: "Vendor Dashboard" });
    } else if (user.role === "admin") {
      navLinks.push({ href: "/admin", label: "Admin Panel" });
    }
  }

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    
    // Set a mock professional ID for vendor if custom logged in
    const mockProId = customRole === "vendor" ? 1 : undefined;
    login(customRole, customEmail, customName || undefined, mockProId);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group" data-testid="link-home-logo">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Wrench className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground tracking-tight">
                Urban<span className="text-primary">Services</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  data-testid={`nav-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location === link.href
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* User Session Management */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-testid="user-menu-trigger">
                      <Avatar className="h-10 w-10 border border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-foreground">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        <div className="mt-1.5 flex">
                          {user.role === "admin" && (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              Administrator
                            </span>
                          )}
                          {user.role === "vendor" && (
                            <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                              Vendor/Partner
                            </span>
                          )}
                          {user.role === "customer" && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              Customer
                            </span>
                          )}
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user.role === "customer" && (
                      <DropdownMenuItem onClick={() => setLocation("/bookings")} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>My Bookings</span>
                      </DropdownMenuItem>
                    )}
                    {user.role === "vendor" && (
                      <DropdownMenuItem onClick={() => setLocation("/vendor-dashboard")} className="cursor-pointer">
                        <Award className="mr-2 h-4 w-4" />
                        <span>Vendor Dashboard</span>
                      </DropdownMenuItem>
                    )}
                    {user.role === "admin" && (
                      <DropdownMenuItem onClick={() => setLocation("/admin")} className="cursor-pointer">
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        logout();
                        setLocation("/");
                      }}
                      className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowLoginModal(true)} className="flex items-center gap-1.5" data-testid="button-login">
                  <LogIn className="w-4 h-4" />
                  Login
                </Button>
              )}
              
              <Link href="/bookings/new">
                <Button size="sm" data-testid="button-book-now">Book Now</Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => setMenuOpen(!menuOpen)}
              data-testid="button-mobile-menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location === link.href
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
            
            <div className="border-t border-border mt-3 pt-3 space-y-2">
              {user ? (
                <div className="space-y-2 px-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground leading-none">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive border-destructive/20 hover:bg-destructive/10 flex items-center justify-center gap-1.5 mt-2"
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                      setLocation("/");
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-1.5"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowLoginModal(true);
                  }}
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Button>
              )}
              <Link href="/bookings/new" onClick={() => setMenuOpen(false)}>
                <Button size="sm" className="w-full mt-2" data-testid="button-mobile-book-now">Book Now</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Modern, Beautiful Multi-role Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="max-w-md p-6 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
          <DialogHeader className="mb-4">
            <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Wrench className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center text-foreground">
              Sign In to UrbanServices
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground text-sm">
              Select a quick simulation account or sign in with your email.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6 bg-muted/60 p-1 rounded-xl">
              <TabsTrigger value="customer" className="rounded-lg text-xs font-medium">Customer</TabsTrigger>
              <TabsTrigger value="vendor" className="rounded-lg text-xs font-medium">Professional</TabsTrigger>
              <TabsTrigger value="admin" className="rounded-lg text-xs font-medium">Admin</TabsTrigger>
            </TabsList>

            {/* Customers Tab */}
            <TabsContent value="customer" className="space-y-3 focus-visible:outline-none">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Simulated Customer Accounts</p>
              {SEED_USERS.customer.map((cust) => (
                <div
                  key={cust.email}
                  onClick={() => login("customer", cust.email, cust.name)}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      <UserCheck className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{cust.name}</p>
                      <p className="text-xs text-muted-foreground">{cust.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">Quick Sign In &rarr;</span>
                </div>
              ))}
            </TabsContent>

            {/* Vendors Tab */}
            <TabsContent value="vendor" className="space-y-3 focus-visible:outline-none">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Simulated Vendor Profiles</p>
              {SEED_USERS.vendor.map((vend) => (
                <div
                  key={vend.email}
                  onClick={() => login("vendor", vend.email, vend.name, vend.professionalId)}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      <Award className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        {vend.name.split(" (")[0]}
                      </p>
                      <p className="text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-medium px-2 py-0.5 rounded w-fit my-0.5">
                        {vend.name.includes("Salon") ? "Salon Beauty Partner" : "AC & Repair Expert"}
                      </p>
                      <p className="text-xs text-muted-foreground">{vend.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">Quick Sign In &rarr;</span>
                </div>
              ))}
            </TabsContent>

            {/* Admins Tab */}
            <TabsContent value="admin" className="space-y-3 focus-visible:outline-none">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Simulated Admin Account</p>
              {SEED_USERS.admin.map((adm) => (
                <div
                  key={adm.email}
                  onClick={() => login("admin", adm.email, adm.name)}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      <Wrench className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{adm.name}</p>
                      <p className="text-xs text-muted-foreground">{adm.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">Quick Sign In &rarr;</span>
                </div>
              ))}
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-semibold">Or Custom login</span>
            </div>
          </div>

          {/* Custom Form for Custom Account Simulation */}
          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="custom-name" className="text-xs font-semibold">Your Name</Label>
                <Input
                  id="custom-name"
                  type="text"
                  placeholder="John Doe"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="h-9 text-xs rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custom-role" className="text-xs font-semibold">Simulated Role</Label>
                <select
                  id="custom-role"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value as any)}
                  className="flex h-9 w-full rounded-lg border border-input bg-card px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor / Partner</option>
                  <option value="admin">Platform Admin</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custom-email" className="text-xs font-semibold">Email Address</Label>
              <Input
                id="custom-email"
                type="email"
                placeholder="john@example.com"
                required
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="h-9 text-xs rounded-lg"
              />
            </div>
            <Button type="submit" size="sm" className="w-full h-9 rounded-lg font-semibold text-xs mt-2">
              Sign In as Custom Account
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
