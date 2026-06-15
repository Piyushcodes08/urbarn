import { Link } from "wouter";
import { ArrowRight, Shield, Clock, ThumbsUp, Award, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import StarRating from "@/components/StarRating";
import {
  useListFeaturedServices,
  useListProfessionals,
  getListFeaturedServicesQueryKey,
  getListProfessionalsQueryKey,
} from "@workspace/api-client-react";
import { CATEGORY_DETAILS } from "@/data/categoryServicesData";



function TrustBadge({ icon, title, desc, delay }: { icon: React.ReactNode; title: string; desc: string; delay?: number }) {
  return (
    <div className="flex items-start gap-3 p-4" data-aos="fade-up" data-aos-delay={delay}>
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { data: featured, isLoading: featLoading } = useListFeaturedServices({
    query: { queryKey: getListFeaturedServicesQueryKey() },
  });
  const { data: professionals, isLoading: proLoading } = useListProfessionals(undefined, {
    query: { queryKey: getListProfessionalsQueryKey() },
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary to-[hsl(160,40%,20%)] text-primary-foreground py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_70%,hsl(25,80%,55%)_0%,transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-white/20 text-primary-foreground border-white/30 hover:bg-white/30" data-aos="fade-down">
              Trusted by 10,000+ customers
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4" data-aos="fade-up" data-aos-delay="100">
              Home services,<br />
              <span className="text-[hsl(25,80%,70%)]">done right.</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 mb-8 leading-relaxed" data-aos="fade-up" data-aos-delay="200">
              Verified professionals for cleaning, repair, beauty, and more — 
              at your doorstep, on your schedule.
            </p>
            <div className="flex flex-col sm:flex-row gap-3" data-aos="fade-up" data-aos-delay="300">
              <Link href="/services">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" data-testid="button-explore-services">
                  Explore Services
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/bookings/new">
                <Button size="lg" variant="outline" className="border-white/50 text-primary-foreground hover:bg-white/10" data-testid="button-book-now-hero">
                  Book Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust indicators */}
      <section className="bg-card border-b border-border overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          <TrustBadge icon={<Shield className="w-5 h-5" />} title="Verified Pros" desc="Background checked" delay={100} />
          <TrustBadge icon={<Clock className="w-5 h-5" />} title="On-Time" desc="Guaranteed arrival" delay={200} />
          <TrustBadge icon={<ThumbsUp className="w-5 h-5" />} title="Satisfaction" desc="100% guarantee" delay={300} />
          <TrustBadge icon={<Award className="w-5 h-5" />} title="Trained Staff" desc="Certified professionals" delay={400} />
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-14 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div data-aos="fade-right">
            <h2 className="text-2xl font-bold text-foreground">Home services at your doorstep</h2>
            <p className="text-muted-foreground text-sm mt-1">Find the right service for your home</p>
          </div>
          <Link href="/categories">
            <Button variant="outline" size="sm" data-testid="link-all-categories" data-aos="fade-left">
              View All <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </Link>
        </div>
        {/* UC-style category pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          {CATEGORY_DETAILS.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              data-testid={`card-category-uc-${cat.id}`}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group"
              data-aos="zoom-in"
              data-aos-delay={(i % 8) * 50}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
                {cat.icon}
              </div>
              <span className="text-xs font-medium text-center text-foreground leading-tight">{cat.name}</span>
            </Link>
          ))}
        </div>
        {/* Sub-category quick shortcuts */}
        <div className="flex flex-wrap gap-2">
          {CATEGORY_DETAILS.flatMap((cat) =>
            cat.subCategories.slice(0, 1).map((sub) => ({
              label: sub.name,
              icon: sub.icon,
              href: `/categories/${cat.slug}?sub=${sub.id}`,
              id: `${cat.id}-${sub.id}`,
            }))
          ).map(({ label, icon, href, id }) => (
            <Link
              key={id}
              href={href}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
            >
              <span>{icon}</span> {label}
            </Link>
          ))}
          <Link href="/categories" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-semibold text-primary transition-all hover:bg-primary/10">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </section>


      {/* Featured Services */}
      <section className="bg-muted/30 py-14 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div data-aos="fade-right">
              <h2 className="text-2xl font-bold text-foreground">Most Popular Services</h2>
              <p className="text-muted-foreground text-sm mt-1">Highly rated by customers</p>
            </div>
            <Link href="/services">
              <Button variant="outline" size="sm" data-testid="link-all-services" data-aos="fade-left">
                All Services <ArrowRight className="ml-1 w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                    <Skeleton className="h-40 w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              : featured?.slice(0, 4).map((svc, i) => (
                  <Link key={svc.id} href={`/services/${svc.id}`} data-testid={`card-service-${svc.id}`}>
                    <div 
                      className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md hover:border-primary/30 transition-all h-full flex flex-col group cursor-pointer"
                      data-aos="fade-up"
                      data-aos-delay={i * 100}
                    >
                      <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Settings className="w-12 h-12 text-primary/40 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="p-4 flex-1 flex flex-col gap-2">
                        {svc.categoryName && (
                          <Badge variant="secondary" className="text-xs w-fit">{svc.categoryName}</Badge>
                        )}
                        <h3 className="font-semibold text-sm text-foreground leading-snug">{svc.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{svc.description}</p>
                        <div className="flex items-center justify-between mt-auto pt-2">
                          <StarRating rating={svc.rating} count={svc.reviewCount} />
                          <span className="text-sm font-bold text-foreground">₹{svc.basePrice}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* Top Professionals */}
      <section className="max-w-7xl mx-auto px-4 py-14 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div data-aos="fade-right">
            <h2 className="text-2xl font-bold text-foreground">Top Professionals</h2>
            <p className="text-muted-foreground text-sm mt-1">Handpicked, trained, and verified</p>
          </div>
          <Link href="/professionals">
            <Button variant="outline" size="sm" data-testid="link-all-professionals" data-aos="fade-left">
              All Pros <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {proLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))
            : professionals?.slice(0, 4).map((pro, i) => (
                <Link key={pro.id} href={`/professionals/${pro.id}`} data-testid={`card-professional-${pro.id}`}>
                  <div 
                    className="rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                    data-aos="fade-up"
                    data-aos-delay={i * 100}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-bold text-primary">{pro.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{pro.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {pro.isVerified && (
                            <Badge className="text-xs px-1 py-0 bg-emerald-100 text-emerald-700 border-emerald-200">Verified</Badge>
                          )}
                          {pro.isAvailable ? (
                            <Badge className="text-xs px-1 py-0 bg-green-100 text-green-700 border-green-200">Available</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs px-1 py-0">Busy</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <StarRating rating={pro.rating} count={pro.reviewCount} />
                    <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                      <span><strong className="text-foreground">{pro.completedJobs.toLocaleString()}</strong> jobs</span>
                      <span><strong className="text-foreground">{pro.yearsExperience}yr</strong> exp.</span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="bg-gradient-to-r from-accent to-[hsl(25,70%,45%)] py-12 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-white">
          <div data-aos="fade-right">
            <p className="text-sm font-semibold uppercase tracking-wider opacity-80">Limited Time Offer</p>
            <h3 className="text-2xl font-bold mt-1">First service at 20% off</h3>
            <p className="text-white/80 mt-1 text-sm">Use code WELCOME20 at checkout</p>
          </div>
          <Link href="/bookings/new">
            <Button size="lg" className="bg-white text-accent hover:bg-white/90 font-semibold" data-testid="button-claim-offer" data-aos="fade-left">
              Claim Offer
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">Urban Services</p>
          <p>Connecting homes with verified professionals.</p>
        </div>
      </footer>
    </div>
  );
}
