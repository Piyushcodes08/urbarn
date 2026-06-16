import { Link, useLocation, useSearch } from "wouter";
import {
  Wrench,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  ShieldAlert,
  Star,
  CalendarDays,
  UserPlus,
  LayoutDashboard,
  Search,
  Grid,
  ChevronDown,
  Sparkles,
  Bell,
  MapPin,
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
import { UserCheck } from "lucide-react";
import {
  useListServices,
  useListCategories,
  useListProfessionals,
} from "@workspace/api-client-react";

// ─── Role badge config ─────────────────────────────────────────────────────
const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  admin: {
    label: "Administrator",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  vendor: {
    label: "Partner",
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  },
  customer: {
    label: "Member",
    className:
      "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  },
};

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, showLoginModal, setShowLoginModal, login, logout } = useAuth();

  // ── Search state ────────────────────────────────────────────────────────
  const searchUrlParams = useSearch();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // ── Scroll state for header elevation ───────────────────────────────────
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sync search with URL
  useEffect(() => {
    const params = new URLSearchParams(searchUrlParams);
    setSearchQuery(params.get("search") || "");
  }, [searchUrlParams]);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        searchRef.current?.contains(e.target as Node) ||
        mobileSearchRef.current?.contains(e.target as Node)
      )
        return;
      setSearchFocused(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  // ── Search data ─────────────────────────────────────────────────────────
  const enabled = debouncedSearch.trim().length > 0;

  const { data: searchCategories } = useListCategories({ query: { enabled } });
  const { data: searchServices } = useListServices(
    { search: debouncedSearch.trim() || undefined },
    { query: { enabled } }
  );
  const { data: searchProfessionals } = useListProfessionals(undefined, {
    query: { enabled },
  });

  const q = debouncedSearch.toLowerCase();
  const filteredCategories = enabled
    ? (searchCategories?.filter((c) => c.name.toLowerCase().includes(q)) ?? [])
    : [];
  const filteredServices = enabled ? (searchServices ?? []) : [];
  const filteredProfessionals = enabled
    ? (searchProfessionals?.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.bio.toLowerCase().includes(q)
      ) ?? [])
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

  // ── Nav links ───────────────────────────────────────────────────────────
  const baseLinks = [
    { href: "/", label: "Home" },
    { href: "/categories", label: "Services" },
    { href: "/professionals", label: "Professionals" },
  ];

  const roleLinks = (() => {
    if (!user) return [];
    if (user.role === "customer")
      return [{ href: "/bookings", label: "My Bookings" }];
    if (user.role === "vendor")
      return [
        { href: "/vendor-dashboard", label: "Dashboard" },
        { href: "/vendor/bookings", label: "My Jobs" },
      ];
    if (user.role === "admin")
      return [{ href: "/admin", label: "Admin Panel" }];
    return [];
  })();

  const navLinks = [...baseLinks, ...roleLinks];

  // ── Helpers ─────────────────────────────────────────────────────────────
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  // ── Dev modal state ──────────────────────────────────────────────────────
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [customRole, setCustomRole] = useState<"customer" | "vendor" | "admin">(
    "customer"
  );

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    const mockProId = customRole === "vendor" ? 1 : undefined;
    login(customRole, customEmail, customName || undefined, mockProId);
  };

  // ── Search results dropdown ──────────────────────────────────────────────
  const SearchResults = () => {
    if (!debouncedSearch.trim()) return null;
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-popover text-popover-foreground rounded-2xl border border-border shadow-2xl max-h-[400px] overflow-y-auto z-50 divide-y divide-border/60 animate-in fade-in slide-in-from-top-2 duration-150">
        {filteredCategories.length > 0 && (
          <div className="p-2">
            <p className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Categories
            </p>
            {filteredCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                onClick={() => { setSearchQuery(""); setSearchFocused(false); }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted/80 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Grid className="w-3.5 h-3.5 text-primary" />
                </span>
                <span className="text-sm font-medium">{cat.name}</span>
              </Link>
            ))}
          </div>
        )}

        {filteredServices.length > 0 && (
          <div className="p-2">
            <p className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Services
            </p>
            {filteredServices.map((svc) => (
              <Link
                key={svc.id}
                href={`/services/${svc.id}`}
                onClick={() => { setSearchQuery(""); setSearchFocused(false); }}
                className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-muted/80 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Wrench className="w-3.5 h-3.5 text-accent" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{svc.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{svc.categoryName}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground pl-3 shrink-0">
                  ₹{svc.basePrice}
                </span>
              </Link>
            ))}
          </div>
        )}

        {filteredProfessionals.length > 0 && (
          <div className="p-2">
            <p className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Professionals
            </p>
            {filteredProfessionals.map((pro) => (
              <Link
                key={pro.id}
                href={`/professionals/${pro.id}`}
                onClick={() => { setSearchQuery(""); setSearchFocused(false); }}
                className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-muted/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{pro.name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-xs text-muted-foreground">
                        {pro.rating} · {pro.reviewCount} reviews
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                  Pro
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="p-2 bg-muted/30">
          {hasResults ? (
            <button
              onClick={() => {
                setLocation(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
                setSearchQuery("");
                setSearchFocused(false);
              }}
              className="w-full text-center py-2 text-xs text-primary font-semibold hover:underline rounded-xl"
            >
              View all results for &ldquo;{searchQuery}&rdquo; →
            </button>
          ) : (
            <p className="text-center py-2 text-xs text-muted-foreground">
              No matches for &ldquo;{searchQuery}&rdquo;
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ── Announcement bar ──────────────────────────────────────────────── */}
      <div className="text-white text-center text-xs py-2 px-4 font-semibold tracking-wide hidden md:flex items-center justify-center gap-2" style={{ background: "linear-gradient(90deg, #1e3560 0%, #e07b1a 100%)" }}>
        <Sparkles className="w-3.5 h-3.5 shrink-0" />
        <span>
          Get 20% off your first booking this month &mdash; use {"  "}
           <span className="text-[#072E59] font-bold"> Home</span>
                <span className="text-[#C7AB86]"> ♥ </span>
                <span className="text-[#F47C19] font-bold">Mate</span>
        </span>
      </div>

      {/* ── Main header ───────────────────────────────────────────────────── */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "bg-card/95 backdrop-blur-md border-b border-border shadow-md"
            : "bg-card border-b border-border"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center h-16 gap-4">



            {/* ── Logo ──────────────────────────────────────────────────── */}
            <Link
              href="/"
              className="shrink-0 flex flex-col items-center leading-none"
              data-testid="link-home-logo"
            >
              <img
                src="/homemate.png"
                alt="HomeMate"
                className="h-12 w-auto object-contain select-none"
                draggable={false}
              />
              <div className="text-slate-500 tracking-wide mt-0.5 pl-0.5">
               
                <span className="text-[#072E59] font-semibold"> Home</span>
                <span className="text-[#C7AB86]">♥</span>
                <span className="text-[#F47C19] font-semibold">Mate</span>
               
              </div>
            </Link>


  {/* ── Desktop nav links ──────────────────────────────────────── */}
            <nav className="hidden lg:flex items-center gap-0.5 shrink-0 mx-auto" aria-label="Main navigation">
              {navLinks.map((link) => {
                const active = location === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    data-testid={`nav-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                    className={cn(
                      "relative px-3.5 py-2 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    {link.label}
                    {active && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </nav>
            {/* ── Desktop search + right actions — single div ───────────── */}
            <div className="hidden md:flex items-center gap-3 ml-auto">

              {/* Search */}
              <div ref={searchRef} className="relative w-48 lg:w-64 xl:w-80">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Search for services, categories…"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setSearchFocused(true); }}
                    onFocus={() => setSearchFocused(true)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 pr-9 h-10 text-sm rounded-full border-border bg-muted/50 hover:bg-muted/80 focus:bg-background focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/60 transition-all w-full"
                    data-testid="global-search-input"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(""); setSearchFocused(false); }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {searchFocused && <SearchResults />}
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-border shrink-0" />

              {/* Auth / user controls */}
              {user ? (
                <>
                  {/* Location pill */}
                  <button className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full border border-border hover:border-foreground/20 transition-colors">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="max-w-[80px] truncate">Mumbai</span>
                    <ChevronDown className="w-3 h-3 shrink-0" />
                  </button>

                  {/* Notification bell */}
                  <button
                    className="relative w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4.5 h-4.5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary border-2 border-card" />
                  </button>

                  {/* Book Now CTA */}
                  {user.role === "customer" && (
                    <Link href="/bookings/new">
                      <Button size="sm" className="rounded-full px-4 font-semibold shadow-sm" data-testid="button-book-now">
                        Book Now
                      </Button>
                    </Link>
                  )}

                  {/* Avatar dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-border hover:border-primary/40 hover:bg-muted/40 transition-all group"
                        data-testid="user-menu-trigger"
                      >
                        <Avatar className="h-7 w-7 border border-primary/30">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden lg:block text-sm font-medium text-foreground max-w-[90px] truncate">
                          {user.name.split(" ")[0]}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-60 p-2 rounded-2xl border-border shadow-2xl" align="end" sideOffset={8}>
                      {/* User info */}
                      <div className="flex items-center gap-3 px-2 py-2 mb-1">
                        <Avatar className="h-10 w-10 border border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          {ROLE_BADGE[user.role] && (
                            <span className={cn(
                              "inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
                              ROLE_BADGE[user.role].className
                            )}>
                              {ROLE_BADGE[user.role].label}
                            </span>
                          )}
                        </div>
                      </div>

                      <DropdownMenuSeparator className="my-1" />

                      {user.role === "customer" && (
                        <>
                          <DropdownMenuItem onClick={() => setLocation("/bookings")} className="rounded-xl cursor-pointer gap-2.5 py-2">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            My Bookings
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLocation("/profile")} className="rounded-xl cursor-pointer gap-2.5 py-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            Profile Settings
                          </DropdownMenuItem>
                        </>
                      )}

                      {user.role === "vendor" && (
                        <>
                          <DropdownMenuItem onClick={() => setLocation("/vendor-dashboard")} className="rounded-xl cursor-pointer gap-2.5 py-2">
                            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                            Vendor Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLocation("/vendor/bookings")} className="rounded-xl cursor-pointer gap-2.5 py-2">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            My Jobs
                          </DropdownMenuItem>
                        </>
                      )}

                      {user.role === "admin" && (
                        <DropdownMenuItem onClick={() => setLocation("/admin")} className="rounded-xl cursor-pointer gap-2.5 py-2">
                          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                          Admin Panel
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator className="my-1" />

                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="rounded-xl cursor-pointer gap-2.5 py-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Link href="/login">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full font-semibold gap-2 px-5 border-border hover:border-primary/50 hover:text-primary transition-all"
                    data-testid="button-login"
                  >
                    <LogIn className="w-4 h-4" />
                    Log in
                  </Button>
                </Link>
              )}
            </div>

            {/* ── Mobile: search icon + burger ──────────────────────────── */}
            <div className="flex md:hidden items-center gap-1 ml-auto">
              <button
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => { setMenuOpen(true); }}
                aria-label="Open search"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
                data-testid="button-mobile-menu"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile drawer ─────────────────────────────────────────────── */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-card animate-in slide-in-from-top-2 duration-200">
            {/* Mobile search */}
            <div ref={mobileSearchRef} className="px-4 pt-4 pb-2 relative">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search services, categories…"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSearchFocused(true); }}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 pr-9 h-10 text-sm rounded-full border-border bg-muted/50"
                  data-testid="mobile-search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(""); setSearchFocused(false); }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {searchFocused && <SearchResults />}
            </div>

            {/* Mobile nav links */}
            <nav className="px-2 pb-2 space-y-0.5" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    location === link.href
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile user section */}
            <div className="border-t border-border mx-4 mt-2 pt-3 pb-4 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-muted/40">
                    <Avatar className="h-10 w-10 border border-primary/20 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    {ROLE_BADGE[user.role] && (
                      <span className={cn(
                        "ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                        ROLE_BADGE[user.role].className
                      )}>
                        {ROLE_BADGE[user.role].label}
                      </span>
                    )}
                  </div>

                  {user.role === "customer" && (
                    <>
                      <Link href="/bookings" onClick={() => setMenuOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 rounded-xl">
                          <CalendarDays className="w-4 h-4" /> My Bookings
                        </Button>
                      </Link>
                      <Link href="/profile" onClick={() => setMenuOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 rounded-xl">
                          <User className="w-4 h-4" /> Profile Settings
                        </Button>
                      </Link>
                      <Link href="/bookings/new" onClick={() => setMenuOpen(false)}>
                        <Button size="sm" className="w-full rounded-xl font-semibold">
                          Book a Service
                        </Button>
                      </Link>
                    </>
                  )}
                  {user.role === "vendor" && (
                    <>
                      <Link href="/vendor-dashboard" onClick={() => setMenuOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 rounded-xl">
                          <LayoutDashboard className="w-4 h-4" /> Vendor Dashboard
                        </Button>
                      </Link>
                      <Link href="/vendor/bookings" onClick={() => setMenuOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 rounded-xl">
                          <CalendarDays className="w-4 h-4" /> My Jobs
                        </Button>
                      </Link>
                    </>
                  )}
                  {user.role === "admin" && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start gap-2 rounded-xl">
                        <ShieldAlert className="w-4 h-4" /> Admin Panel
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  {/* Primary: Log in */}
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    <Button size="sm" className="w-full rounded-xl gap-2 font-semibold h-11" data-testid="mobile-button-login">
                      <LogIn className="w-4 h-4" /> Log in
                    </Button>
                  </Link>

                  {/* Divider */}
                  <div className="relative my-1">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-2 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                        or
                      </span>
                    </div>
                  </div>

                  {/* Sign up */}
                  <Link href="/register" onClick={() => setMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full rounded-xl gap-2 font-semibold h-10" data-testid="mobile-button-register">
                      <UserPlus className="w-4 h-4" /> Create an account
                    </Button>
                  </Link>

                  {/* Become a Pro */}
                  <Link href="/vendor-register" onClick={() => setMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full rounded-xl gap-2 font-semibold h-10 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20" data-testid="mobile-button-become-provider">
                      <Sparkles className="w-4 h-4" /> Become a Pro
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Dev / Simulation Login Modal ─────────────────────────────────── */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="max-w-md p-6 rounded-3xl border border-border bg-card shadow-2xl">
          <DialogHeader className="mb-4 text-center">
            <div className="flex justify-center mb-3">
              <img
                src="/homemate.png"
                alt="HomeMate"
                className="h-14 w-auto object-contain"
                draggable={false}
              />
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground">
              Sign in to HomeMate
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm mt-1">
              Pick a simulation account or enter custom credentials.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid grid-cols-3 mb-5 bg-muted/60 p-1 rounded-xl h-10">
              <TabsTrigger value="customer" className="rounded-lg text-xs font-semibold">Customer</TabsTrigger>
              <TabsTrigger value="vendor" className="rounded-lg text-xs font-semibold">Professional</TabsTrigger>
              <TabsTrigger value="admin" className="rounded-lg text-xs font-semibold">Admin</TabsTrigger>
            </TabsList>

            {/* Customer tab */}
            <TabsContent value="customer" className="space-y-2 focus-visible:outline-none">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                Simulated Accounts
              </p>
              {SEED_USERS.customer.map((cust) => (
                <div
                  key={cust.email}
                  onClick={() => login("customer", cust.email, cust.name)}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        {cust.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{cust.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Sign in →
                  </span>
                </div>
              ))}
            </TabsContent>

            {/* Vendor tab */}
            <TabsContent value="vendor" className="space-y-2 focus-visible:outline-none">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                Simulated Accounts
              </p>
              {SEED_USERS.vendor.map((v) => (
                <div
                  key={v.email}
                  onClick={() => login("vendor", v.email, v.name, 1)}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card hover:bg-violet-50 dark:hover:bg-violet-900/10 hover:border-violet-300 dark:hover:border-violet-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                      <Star className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {v.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{v.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-violet-600 dark:text-violet-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Sign in →
                  </span>
                </div>
              ))}
            </TabsContent>

            {/* Admin tab */}
            <TabsContent value="admin" className="space-y-2 focus-visible:outline-none">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                Simulated Accounts
              </p>
              {SEED_USERS.admin.map((a) => (
                <div
                  key={a.email}
                  onClick={() => login("admin", a.email, a.name)}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-300 dark:hover:border-red-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        {a.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{a.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-red-600 dark:text-red-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Sign in →
                  </span>
                </div>
              ))}
            </TabsContent>
          </Tabs>

          {/* Custom credentials form */}
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Custom Credentials
            </p>
            <form onSubmit={handleCustomLogin} className="space-y-3">
              <Input
                placeholder="Email address"
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="h-10 rounded-xl text-sm"
                required
              />
              <Input
                placeholder="Display name (optional)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="h-10 rounded-xl text-sm"
              />
              <select
                value={customRole}
                onChange={(e) =>
                  setCustomRole(e.target.value as "customer" | "vendor" | "admin")
                }
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="customer">Customer</option>
                <option value="vendor">Vendor / Professional</option>
                <option value="admin">Administrator</option>
              </select>
              <Button type="submit" className="w-full rounded-xl font-semibold h-10">
                Sign In
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
