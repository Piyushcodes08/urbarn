import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Star,
  Clock,
  ChevronRight,
  ShoppingCart,
  Check,
  Plus,
  Minus,
  BadgeCheck,
  Info,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getCategoryBySlug,
  type CategoryDetail,
  type SubCategory,
  type ServiceOption,
} from "@/data/categoryServicesData";
import { useToast } from "@/hooks/use-toast";

// ─── Cart State ───────────────────────────────────────────────────────────────

interface CartItem {
  service: ServiceOption;
  subCategoryName: string;
  qty: number;
}

// ─── Tag Colour Map ───────────────────────────────────────────────────────────

const TAG_STYLES: Record<string, string> = {
  Bestseller: "bg-amber-100 text-amber-700 border-amber-200",
  New: "bg-blue-100 text-blue-700 border-blue-200",
  "Limited Offer": "bg-rose-100 text-rose-700 border-rose-200",
};

// ─── Sub Components ───────────────────────────────────────────────────────────

function ServiceCard({
  service,
  subCategoryName,
  cart,
  onAdd,
  onRemove,
}: {
  service: ServiceOption;
  subCategoryName: string;
  cart: CartItem[];
  onAdd: (s: ServiceOption, scName: string) => void;
  onRemove: (id: string) => void;
}) {
  const cartItem = cart.find((c) => c.service.id === service.id);
  const qty = cartItem?.qty ?? 0;

  return (
    <div className="uc-service-card group">
      {/* Tag */}
      {service.tag && (
        <span
          className={`uc-tag ${TAG_STYLES[service.tag] ?? "bg-gray-100 text-gray-700"}`}
        >
          {service.tag}
        </span>
      )}

      <div className="uc-service-body">
        {/* Text content */}
        <div className="uc-service-info">
          <h3 className="uc-service-name">{service.name}</h3>

          {/* Rating + Duration */}
          <div className="uc-service-meta">
            <span className="uc-meta-item">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">{service.rating}</span>
              <span className="text-muted-foreground">
                ({service.reviewCount.toLocaleString()})
              </span>
            </span>
            <span className="uc-meta-divider" />
            <span className="uc-meta-item">
              <Clock className="w-3.5 h-3.5" />
              {service.duration}
            </span>
          </div>

          <p className="uc-service-desc">{service.description}</p>

          {/* Includes */}
          <ul className="uc-includes-list">
            {service.includes.slice(0, 4).map((item) => (
              <li key={item} className="uc-include-item">
                <Check className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Price + CTA */}
        <div className="uc-service-cta">
          <p className="uc-price">₹{service.price.toLocaleString()}</p>

          {qty === 0 ? (
            <button
              className="uc-add-btn"
              onClick={() => onAdd(service, subCategoryName)}
              aria-label={`Add ${service.name}`}
            >
              Add
            </button>
          ) : (
            <div className="uc-qty-control">
              <button
                className="uc-qty-btn"
                onClick={() => onRemove(service.id)}
                aria-label="Remove one"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="uc-qty-count">{qty}</span>
              <button
                className="uc-qty-btn"
                onClick={() => onAdd(service, subCategoryName)}
                aria-label="Add one more"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CartBar({
  cart,
  accentColor,
  onView,
}: {
  cart: CartItem[];
  accentColor: string;
  onView: () => void;
}) {
  const total = cart.reduce((s, c) => s + c.service.price * c.qty, 0);
  const count = cart.reduce((s, c) => s + c.qty, 0);

  if (count === 0) return null;

  return (
    <div className="uc-cart-bar">
      <div className="uc-cart-info">
        <ShoppingCart className="w-5 h-5 text-white" />
        <span className="text-white font-medium">
          {count} {count === 1 ? "service" : "services"} added
        </span>
      </div>
      <div className="uc-cart-right">
        <span className="text-white font-bold">₹{total.toLocaleString()}</span>
        <button className="uc-cart-view-btn" onClick={onView}>
          View Cart <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CartModal({
  cart,
  onClose,
  onRemove,
  onAdd,
}: {
  cart: CartItem[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onAdd: (s: ServiceOption, scName: string) => void;
}) {
  const total = cart.reduce((s, c) => s + c.service.price * c.qty, 0);
  const [, setLocation] = useLocation();

  return (
    <div className="uc-modal-overlay" onClick={onClose}>
      <div
        className="uc-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
      >
        <div className="uc-modal-header">
          <h2 className="text-lg font-bold text-foreground">Your Cart</h2>
          <button className="uc-modal-close" onClick={onClose} aria-label="Close cart">
            <X className="w-5 h-5" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No services added yet.</p>
          </div>
        ) : (
          <>
            <div className="uc-modal-list">
              {cart.map((item) => (
                <div key={item.service.id} className="uc-modal-item">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground leading-snug">
                      {item.service.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.subCategoryName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="uc-qty-control-sm">
                      <button
                        onClick={() => onRemove(item.service.id)}
                        className="uc-qty-btn-sm"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-semibold w-4 text-center">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => onAdd(item.service, item.subCategoryName)}
                        className="uc-qty-btn-sm"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-foreground w-20 text-right">
                      ₹{(item.service.price * item.qty).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="uc-modal-summary">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>Visit charges</span>
                <span className="text-emerald-600 font-medium">FREE</span>
              </div>
              <div className="border-t border-border mt-3 pt-3 flex justify-between font-bold text-foreground">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>

            <button
              className="uc-proceed-btn"
              onClick={() => {
                onClose();
                setLocation("/bookings/new");
              }}
            >
              Proceed to Book
            </button>

            <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
              All services are backed by our satisfaction guarantee
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const category = getCategoryBySlug(slug ?? "");

  const [activeSubId, setActiveSubId] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const subNavRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const { toast } = useToast();

  // Set first sub-category as active on load
  useEffect(() => {
    if (category && category.subCategories.length > 0) {
      setActiveSubId(category.subCategories[0].id);
    }
  }, [category]);

  // Scroll spy
  useEffect(() => {
    const handleScroll = () => {
      const entries = Object.entries(sectionRefs.current);
      for (const [id, el] of entries) {
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 160 && rect.bottom >= 160) {
          setActiveSubId(id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!category) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-3">Category Not Found</h1>
        <p className="text-muted-foreground mb-8">
          We couldn't find this service category.
        </p>
        <Link href="/categories">
          <Button>Browse All Categories</Button>
        </Link>
      </div>
    );
  }

  // ── Cart handlers ────────────────────────────────────────────────────────

  const handleAdd = (service: ServiceOption, subCategoryName: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.service.id === service.id);
      if (existing) {
        return prev.map((c) =>
          c.service.id === service.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { service, subCategoryName, qty: 1 }];
    });
    toast({
      title: `${service.name} added`,
      description: `₹${service.price} · ${service.duration}`,
      duration: 2000,
    });
  };

  const handleRemove = (serviceId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.service.id === serviceId);
      if (!existing) return prev;
      if (existing.qty === 1) return prev.filter((c) => c.service.id !== serviceId);
      return prev.map((c) =>
        c.service.id === serviceId ? { ...c, qty: c.qty - 1 } : c
      );
    });
  };

  // ── Sub-nav scroll ───────────────────────────────────────────────────────

  const scrollToSub = (subId: string) => {
    setActiveSubId(subId);
    const el = sectionRefs.current[subId];
    if (el) {
      const offset = 130; // sticky header height
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
    // Scroll sub-nav pill into view
    const navBtn = subNavRef.current?.querySelector(`[data-sub="${subId}"]`);
    navBtn?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  };

  // Scroll to sub-category if specified in URL query on load
  useEffect(() => {
    if (category && category.subCategories.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const subParam = params.get("sub");
      if (subParam) {
        const matchedSub = category.subCategories.find((s) => s.id === subParam);
        if (matchedSub) {
          setTimeout(() => {
            scrollToSub(matchedSub.id);
          }, 450);
        }
      }
    }
  }, [category]);

  return (
    <>
      {/* ── Page ─────────────────────────────────────────────────────────── */}
      <div className="min-h-screen bg-background">
        {/* Hero Banner */}
        <div className={`uc-hero bg-gradient-to-br ${category.gradient}`}>
          <div className="uc-hero-inner">
            <Link href="/categories" className="uc-back-btn">
              <ArrowLeft className="w-4 h-4" />
              All Categories
            </Link>
            <div className="uc-hero-content">
              <span className="uc-hero-icon">{category.icon}</span>
              <div>
                <h1 className="uc-hero-title">{category.name}</h1>
                <p className="uc-hero-tagline">{category.tagline}</p>
                <div className="uc-hero-badges">
                  <span className="uc-hero-badge">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified Professionals
                  </span>
                  <span className="uc-hero-badge">
                    <Star className="w-3.5 h-3.5 fill-white" /> 4.8 Avg Rating
                  </span>
                  <span className="uc-hero-badge">
                    <Check className="w-3.5 h-3.5" /> Satisfaction Guarantee
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Sub-Category Nav */}
        <div className="uc-sub-nav-wrapper" role="navigation" aria-label="Sub categories">
          <div className="uc-sub-nav-inner" ref={subNavRef}>
            {category.subCategories.map((sub) => (
              <button
                key={sub.id}
                data-sub={sub.id}
                className={`uc-sub-nav-pill ${activeSubId === sub.id ? "uc-sub-nav-pill--active" : ""}`}
                onClick={() => scrollToSub(sub.id)}
              >
                <span className="text-base">{sub.icon}</span>
                {sub.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="uc-page-content">
          {/* Trust strip */}
          <div className="uc-trust-strip">
            <div className="uc-trust-item">
              <BadgeCheck className="w-4 h-4 text-emerald-500" />
              <span>Background verified pros</span>
            </div>
            <div className="uc-trust-item">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>4.8 average rating</span>
            </div>
            <div className="uc-trust-item">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>On-time guarantee</span>
            </div>
            <div className="uc-trust-item">
              <Info className="w-4 h-4 text-purple-500" />
              <span>30-day service warranty</span>
            </div>
          </div>

          {/* Sub-category sections */}
          {category.subCategories.map((sub) => (
            <section
              key={sub.id}
              id={`sub-${sub.id}`}
              ref={(el: HTMLElement | null) => { if (sectionRefs.current) sectionRefs.current[sub.id] = el; }}
              className="uc-sub-section"
            >
              {/* Sub-category Header */}
              <div className="uc-sub-header">
                <span className="uc-sub-icon">{sub.icon}</span>
                <div>
                  <h2 className="uc-sub-name">{sub.name}</h2>
                  <p className="uc-sub-desc">{sub.description}</p>
                </div>
              </div>

              {/* Service Cards */}
              <div className="uc-service-list">
                {sub.services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    subCategoryName={sub.name}
                    cart={cart}
                    onAdd={handleAdd}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </section>
          ))}

          {/* Bottom padding for cart bar */}
          <div className="h-24" />
        </div>
      </div>

      {/* Cart Sticky Bar */}
      <CartBar
        cart={cart}
        accentColor={category.accent}
        onView={() => setShowCart(true)}
      />

      {/* Cart Modal */}
      {showCart && (
        <CartModal
          cart={cart}
          onClose={() => setShowCart(false)}
          onRemove={handleRemove}
          onAdd={handleAdd}
        />
      )}
    </>
  );
}
