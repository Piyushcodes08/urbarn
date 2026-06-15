import { Link } from "wouter";
import { Scissors, Sparkles, Wind, Zap, Droplets, PaintBucket, Settings, Bug, ArrowRight, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useListCategories, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { CATEGORY_DETAILS } from "@/data/categoryServicesData";

const iconMap: Record<string, React.ElementType> = {
  Scissors, Sparkles, Wind, Zap, Droplets, PaintBucket, Settings, Bug,
};

// Map Firestore category names → our local slugs (case-insensitive fuzzy match)
function getSlugForCategory(name: string): string | null {
  const lower = name.toLowerCase();
  const found = CATEGORY_DETAILS.find(
    (c) =>
      lower.includes(c.slug.replace(/-/g, " ")) ||
      c.name.toLowerCase().includes(lower) ||
      lower.includes(c.name.toLowerCase().split(" ")[0])
  );
  return found?.slug ?? null;
}

export default function CategoriesPage() {
  const { data: categories, isLoading } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 overflow-hidden">
      <div className="mb-10" data-aos="fade-down">
        <h1 className="text-3xl font-bold text-foreground">Home services at your doorstep</h1>
        <p className="text-muted-foreground mt-2">
          Browse our wide range of home services. All professionals are verified and trained.
        </p>
      </div>

      {/* Static UC-style featured categories */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-5">Popular Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {CATEGORY_DETAILS.map((cat, i) => {
            const totalServices = cat.subCategories.reduce((sum, s) => sum + s.services.length, 0);
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                data-testid={`card-uc-category-${cat.id}`}
              >
                <div
                  className="rounded-2xl border border-border bg-card hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer group h-full flex flex-col overflow-hidden"
                  data-aos="fade-up"
                  data-aos-delay={(i % 4) * 80}
                >
                  {/* Gradient Header */}
                  <div className={`h-24 bg-gradient-to-br ${cat.gradient} flex items-end p-4 relative overflow-hidden`}>
                    <div className="absolute top-3 right-3 text-4xl opacity-30 group-hover:opacity-50 transition-opacity group-hover:scale-110 transition-transform">
                      {cat.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-snug drop-shadow-sm">{cat.name}</h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 flex-1">
                      {cat.tagline}
                    </p>

                    {/* Sub-category chips */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {cat.subCategories.slice(0, 3).map((sub) => (
                        <span
                          key={sub.id}
                          className="inline-flex items-center gap-1 text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border"
                        >
                          {sub.icon} {sub.name}
                        </span>
                      ))}
                      {cat.subCategories.length > 3 && (
                        <span className="text-[10px] font-medium text-muted-foreground px-2 py-0.5">
                          +{cat.subCategories.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{cat.subCategories.length} subcategories</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                        <span>{totalServices} services</span>
                      </div>
                      <span className="text-primary text-xs font-semibold group-hover:underline flex items-center gap-0.5">
                        Browse <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick-access sub-category shortcuts */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-5">Quick Access Services</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {CATEGORY_DETAILS.flatMap((cat) =>
            cat.subCategories.slice(0, 2).map((sub) => ({
              catSlug: cat.slug,
              catName: cat.name,
              catGradient: cat.gradient,
              sub,
            }))
          ).map(({ catSlug, catName, catGradient, sub }, i) => (
            <Link
              key={`${catSlug}-${sub.id}`}
              href={`/categories/${catSlug}?sub=${sub.id}`}
              data-testid={`shortcut-${catSlug}-${sub.id}`}
            >
              <div
                className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group text-center"
                data-aos="zoom-in"
                data-aos-delay={(i % 6) * 40}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${catGradient} flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
                  {sub.icon}
                </div>
                <span className="text-xs font-semibold text-foreground leading-tight line-clamp-2">{sub.name}</span>
                <span className="text-[10px] text-muted-foreground">{sub.services.length} services</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Firestore-backed categories (if any) */}
      {!isLoading && categories && categories.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-foreground mb-5">More Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <Skeleton className="w-14 h-14 rounded-full" />
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              : categories.map((cat, i) => {
                  const Icon = iconMap[cat.icon] ?? Settings;
                  const slug = getSlugForCategory(cat.name);
                  const href = slug ? `/categories/${slug}` : `/services?categoryId=${cat.id}`;
                  return (
                    <Link
                      key={cat.id}
                      href={href}
                      data-testid={`card-category-${cat.id}`}
                    >
                      <div
                        className="rounded-2xl border border-border bg-card p-6 hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer group h-full flex flex-col"
                        data-aos="fade-up"
                        data-aos-delay={(i % 4) * 100}
                      >
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-7 h-7 text-primary" />
                        </div>
                        <h3 className="font-bold text-lg text-foreground">{cat.name}</h3>
                        {cat.description && (
                          <p className="text-muted-foreground text-sm mt-2 flex-1 leading-relaxed">{cat.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                          <span className="text-xs text-muted-foreground">{cat.serviceCount} services</span>
                          <span className="text-primary text-sm font-medium group-hover:underline flex items-center gap-1">
                            Browse <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </div>
      )}
    </div>
  );
}
