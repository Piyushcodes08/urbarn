import { Link, useLocation, useSearch } from "wouter";
import {
  Wrench, Menu, X, LogIn, LogOut, User, ShieldAlert, Award,
  UserCheck, Star, CalendarDays, UserPlus, LayoutDashboard,
  Search, Grid
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth, SEED_USERS } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  useListServices,
  useListCategories,
  useListProfessionals,
  getListServicesQueryKey,
  getListCategoriesQueryKey,
  getListProfessionalsQueryKey,
} from "@workspace/api-client-react";

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, showLoginModal, setShowLoginModal, login, logout } = useAuth();

  // Search states & refs
  const searchUrlParams = useSearch();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Sync searchQuery with URL params if it changes from external navigation
  useEffect(() => {
    const params = new URLSearchParams(searchUrlParams);
    const query = params.get("search") || "";
    setSearchQuery(query);
  }, [searchUrlParams]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search results dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        (searchRef.current && !searchRef.current.contains(event.target as Node)) &&
        (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node))
      ) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch search items using simulated local database query hooks
  const { data: searchCategories } = useListCategories({
    query: {
      enabled: debouncedSearch.trim().length > 0,
    },
  });

  const { data: searchServices } = useListServices(
    { search: debouncedSearch.trim() || undefined },
    {
      query: {
        enabled: debouncedSearch.trim().length > 0,
      },
    }
  );

  const { data: searchProfessionals } = useListProfessionals(
    undefined,
    {
      query: {
        enabled: debouncedSearch.trim().length > 0,
      },
    }
  );

  // Filter client-side for category name and professional details
  const filteredCategories = debouncedSearch.trim()
    ? (searchCategories?.filter((cat) =>
        cat.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      ) || [])
    : [];

  const filteredServices = debouncedSearch.trim() ? (searchServices || []) : [];

  const filteredProfessionals = debouncedSearch.trim()
    ? (searchProfessionals?.filter((pro) =>
        pro.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        pro.bio.toLowerCase().includes(debouncedSearch.toLowerCase())
      ) || [])
    : [];

  const hasResults =
    filteredCategories.length > 0 ||
    filteredServices.length > 0 ||
    filteredProfessionals.length > 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSearchFocused(false);
    } else if (e.key === "Enter" && searchQuery.trim()) {
      setLocation(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchFocused(false);
    }
  };

  const renderSearchResults = () => {
    if (!debouncedSearch.trim()) return null;

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-popover text-popover-foreground rounded-xl border border-border shadow-lg max-h-[350px] overflow-y-auto z-50 divide-y divide-border animate-in fade-in slide-in-from-top-1 duration-150">
        {/* Categories Section */}
        {filteredCategories.length > 0 && (
          <div className="p-2">
            <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Categories
            </div>
            {filteredCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                onClick={() => {
                  setSearchQuery("");
                  setSearchFocused(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted text-sm text-foreground transition-colors"
              >
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                  <Grid className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium text-xs">{cat.name}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Services Section */}
        {filteredServices.length > 0 && (
          <div className="p-2">
            <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Services
            </div>
            {filteredServices.map((svc) => (
              <Link
                key={svc.id}
                href={`/services/${svc.id}`}
                onClick={() => {
                  setSearchQuery("");
                  setSearchFocused(false);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted text-sm text-foreground transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded bg-accent/10 flex items-center justify-center text-accent">
                    <Wrench className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="font-medium text-xs truncate">{svc.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{svc.categoryName}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors pl-2">
                  ₹{svc.basePrice}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Professionals Section */}
        {filteredProfessionals.length > 0 && (
          <div className="p-2">
            <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Professionals
            </div>
            {filteredProfessionals.map((pro) => (
              <Link
                key={pro.id}
                href={`/professionals/${pro.id}`}
                onClick={() => {
                  setSearchQuery("");
                  setSearchFocused(false);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted text-sm text-foreground transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-medium text-xs">{pro.name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                      <span className="text-[10px] text-muted-foreground">{pro.rating} ({pro.reviewCount})</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-medium px-2 py-0.5 rounded">
                  Pro
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Footer Link if there are results */}
        {hasResults ? (
          <div className="p-2 bg-muted/40">
            <button
              onClick={() => {
                setLocation(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
                setSearchQuery("");
                setSearchFocused(false);
              }}
              className="w-full text-center px-3 py-1.5 text-xs text-primary font-medium hover:underline"
            >
              Search all services for "{searchQuery}" &rarr;
            </button>
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No matches found for "{searchQuery}"
          </div>
        )}
      </div>
    );
  };


  // Custom form state for simulation modal
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [customRole, setCustomRole] = useState<"customer" | "vendor" | "admin">("customer");

  // ── Base nav links (always visible) ───────────────────────────────────────
  const baseLinks = [
    { href: "/", label: "Home" },
    { href: "/categories", label: "Services" },
    { href: "/professionals", label: "Professionals" },
  ];

  // ── Role-specific nav links ────────────────────────────────────────────────
  const roleLinks = (() => {
    if (!user) return [];
    if (user.role === "customer") {
      return [
        { href: "/bookings", label: "My Bookings" },
      ];
    }
    if (user.role === "vendor") {
      return [
        { href: "/vendor-dashboard", label: "Dashboard" },
        { href: "/vendor/bookings", label: "My Jobs" },
      ];
    }
    if (user.role === "admin") {
      return [
        { href: "/admin", label: "Admin Panel" },
      ];
    }
    return [];
  })();

  const navLinks = [...baseLinks, ...roleLinks];

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    const mockProId = customRole === "vendor" ? 1 : undefined;
    login(customRole, customEmail, customName || undefined, mockProId);
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleLogout = () => {
    logout();
    setLocation("/");
    setMenuOpen(false);
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

            {/* Global Search Bar (Desktop) */}
            <div ref={searchRef} className="hidden md:block relative w-48 lg:w-64 xl:w-80 mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search services, categories..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchFocused(true);
                  }}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={handleKeyDown}
                  className="pl-9 pr-8 h-9 text-xs rounded-full border border-border bg-muted/40 hover:bg-muted/60 focus:bg-background transition-all focus-visible:ring-1 focus-visible:ring-primary w-full"
                  data-testid="global-search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchFocused(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              {searchFocused && renderSearchResults()}
            </div>

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

            {/* Desktop Right Section */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  {/* User Dropdown */}
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
                          <div className="mt-1.5">
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

                      {/* Customer menu items */}
                      {user.role === "customer" && (
                        <>
                          <DropdownMenuItem onClick={() => setLocation("/bookings")} className="cursor-pointer">
                            <CalendarDays className="mr-2 h-4 w-4" />
                            <span>My Bookings</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                          </DropdownMenuItem>
                        </>
                      )}

                      {/* Vendor menu items */}
                      {user.role === "vendor" && (
                        <>
                          <DropdownMenuItem onClick={() => setLocation("/vendor-dashboard")} className="cursor-pointer">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Vendor Dashboard</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLocation("/vendor/bookings")} className="cursor-pointer">
                            <CalendarDays className="mr-2 h-4 w-4" />
                            <span>Vendor Bookings</span>
                          </DropdownMenuItem>
                        </>
                      )}

                      {/* Admin menu items */}
                      {user.role === "admin" && (
                        <DropdownMenuItem onClick={() => setLocation("/admin")} className="cursor-pointer">
                          <ShieldAlert className="mr-2 h-4 w-4" />
                          <span>Admin Panel</span>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Role-specific CTA */}
                  {user.role === "customer" && (
                    <Link href="/bookings/new">
                      <Button size="sm" data-testid="button-book-now">Book Now</Button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  {/* Not logged in */}
                  <Link href="/login">
                    <Button variant="outline" size="sm" className="flex items-center gap-1.5" data-testid="button-login">
                      <LogIn className="w-4 h-4" />
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="outline" size="sm" className="flex items-center gap-1.5" data-testid="button-register">
                      <UserPlus className="w-4 h-4" />
                      Register
                    </Button>
                  </Link>
                  <Link href="/vendor-register">
                    <Button size="sm" data-testid="button-become-provider">
                      Become a Provider
                    </Button>
                  </Link>
                </>
              )}
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
            {/* Global Search Bar (Mobile) */}
            <div ref={mobileSearchRef} className="relative mb-3 px-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search services, categories..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchFocused(true);
                  }}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={handleKeyDown}
                  className="pl-9 pr-8 h-9 text-xs rounded-full border border-border bg-muted/40 hover:bg-muted/60 focus:bg-background transition-all focus-visible:ring-1 focus-visible:ring-primary w-full"
                  data-testid="mobile-search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchFocused(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              {searchFocused && renderSearchResults()}
            </div>

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

                  {/* Mobile role-specific links */}
                  {user.role === "customer" && (
                    <>
                      <Link href="/bookings" onClick={() => setMenuOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-sm">
                          <CalendarDays className="w-4 h-4" /> My Bookings
                        </Button>
                      </Link>
                      <Link href="/profile" onClick={() => setMenuOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-sm">
                          <User className="w-4 h-4" /> Profile
                        </Button>
                      </Link>
                    </>
                  )}
                  {user.role === "vendor" && (
                    <>
                      <Link href="/vendor-dashboard" onClick={() => setMenuOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-sm">
                          <LayoutDashboard className="w-4 h-4" /> Vendor Dashboard
                        </Button>
                      </Link>
                      <Link href="/vendor/bookings" onClick={() => setMenuOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-sm">
                          <CalendarDays className="w-4 h-4" /> Vendor Bookings
                        </Button>
                      </Link>
                    </>
                  )}
                  {user.role === "admin" && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-sm">
                        <ShieldAlert className="w-4 h-4" /> Admin Panel
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive border-destructive/20 hover:bg-destructive/10 flex items-center justify-center gap-1.5 mt-1"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1.5">
                      <LogIn className="w-4 h-4" /> Login
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1.5">
                      <UserPlus className="w-4 h-4" /> Register
                    </Button>
                  </Link>
                  <Link href="/vendor-register" onClick={() => setMenuOpen(false)}>
                    <Button size="sm" className="w-full">
                      Become a Provider
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Simulation / Offline Login Modal (kept for dev/fallback) ─────────── */}
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
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{cust.name}</p>
                      <p className="text-xs text-muted-foreground">{cust.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">Quick Sign In →</span>
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
                      <Award className="w-4 h-4" />
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
                  <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">Quick Sign In →</span>
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
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{adm.name}</p>
                      <p className="text-xs text-muted-foreground">{adm.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">Quick Sign In →</span>
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

          {/* Custom Form */}
          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="custom-name" className="text-xs font-semibold">Your Name</Label>
                <Input id="custom-name" type="text" placeholder="John Doe" value={customName} onChange={(e) => setCustomName(e.target.value)} className="h-9 text-xs rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custom-role" className="text-xs font-semibold">Simulated Role</Label>
                <select
                  id="custom-role"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value as typeof customRole)}
                  className="flex h-9 w-full rounded-lg border border-input bg-card px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor / Partner</option>
                  <option value="admin">Platform Admin</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custom-email" className="text-xs font-semibold">Email Address</Label>
              <Input id="custom-email" type="email" placeholder="john@example.com" required value={customEmail} onChange={(e) => setCustomEmail(e.target.value)} className="h-9 text-xs rounded-lg" />
            </div>
            <Button type="submit" size="sm" className="w-full h-9 rounded-lg font-semibold text-xs mt-2">
              Sign In as Custom Account
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Want to use your real account?{" "}
              <button
                onClick={() => { setShowLoginModal(false); setLocation("/login"); }}
                className="text-primary hover:underline underline-offset-2 font-medium"
              >
                Go to Login Page →
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
