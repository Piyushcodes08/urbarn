import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { Search, Settings, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StarRating from "@/components/StarRating";
import {
  useListServices,
  useListCategories,
  getListServicesQueryKey,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";

export default function ServicesPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialCategoryId = params.get("categoryId") ? Number(params.get("categoryId")) : undefined;

  const [categoryId, setCategoryId] = useState<number | undefined>(initialCategoryId);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: services, isLoading } = useListServices(
    { categoryId, search: debouncedSearch || undefined },
    { query: { queryKey: getListServicesQueryKey({ categoryId, search: debouncedSearch || undefined }) } }
  );

  const { data: categories } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 overflow-hidden">
      <div className="mb-8" data-aos="fade-down">
        <h1 className="text-3xl font-bold text-foreground">Services</h1>
        <p className="text-muted-foreground mt-1">Book a professional for any home need</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8" data-aos="fade-up">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-services"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Button
            variant={categoryId === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryId(undefined)}
            data-testid="filter-all"
          >
            All
          </Button>
          {categories?.map((cat) => (
            <Button
              key={cat.id}
              variant={categoryId === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryId(cat.id)}
              data-testid={`filter-category-${cat.id}`}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
              <Skeleton className="h-44 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : services?.length === 0 ? (
        <div className="text-center py-20" data-aos="fade-up">
          <Settings className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">No services found. Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services?.map((svc, i) => (
            <Link key={svc.id} href={`/services/${svc.id}`} data-testid={`card-service-${svc.id}`}>
              <div 
                className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group h-full flex flex-col"
                data-aos="fade-up"
                data-aos-delay={(i % 3) * 100}
              >
                <div className="h-44 bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
                  <Settings className="w-14 h-14 text-primary/30 group-hover:scale-110 transition-transform" />
                </div>
                <div className="p-5 flex-1 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base text-foreground leading-snug">{svc.name}</h3>
                    {svc.isFeatured && <Badge className="text-xs bg-accent/20 text-accent border-accent/30 flex-shrink-0">Popular</Badge>}
                  </div>
                  {svc.categoryName && (
                    <Badge variant="secondary" className="text-xs w-fit">{svc.categoryName}</Badge>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{svc.description}</p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                    <StarRating rating={svc.rating} count={svc.reviewCount} />
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">₹{svc.basePrice}</p>
                      <p className="text-xs text-muted-foreground">{svc.durationMinutes} min</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
