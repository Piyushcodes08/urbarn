import { Link } from "wouter";
import { Scissors, Sparkles, Wind, Zap, Droplets, PaintBucket, Settings, Bug, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useListCategories, getListCategoriesQueryKey } from "@workspace/api-client-react";

const iconMap: Record<string, React.ElementType> = {
  Scissors, Sparkles, Wind, Zap, Droplets, PaintBucket, Settings, Bug,
};

export default function CategoriesPage() {
  const { data: categories, isLoading } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 overflow-hidden">
      <div className="mb-10" data-aos="fade-down">
        <h1 className="text-3xl font-bold text-foreground">All Service Categories</h1>
        <p className="text-muted-foreground mt-2">
          Browse our wide range of home services. All professionals are verified and trained.
        </p>
      </div>

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
          : categories?.map((cat, i) => {
              const Icon = iconMap[cat.icon] ?? Settings;
              return (
                <Link
                  key={cat.id}
                  href={`/services?categoryId=${cat.id}`}
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
  );
}
