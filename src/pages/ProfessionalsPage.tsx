import { Link } from "wouter";
import { Shield, Briefcase, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import StarRating from "@/components/StarRating";
import {
  useListProfessionals,
  getListProfessionalsQueryKey,
} from "@workspace/api-client-react";

export default function ProfessionalsPage() {
  const { data: professionals, isLoading } = useListProfessionals(undefined, {
    query: { queryKey: getListProfessionalsQueryKey() },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 overflow-hidden">
      <div className="mb-10" data-aos="fade-down">
        <h1 className="text-3xl font-bold text-foreground">Our Professionals</h1>
        <p className="text-muted-foreground mt-2">
          Every professional is background-checked, trained, and rated by real customers.
        </p>
      </div>

      {/* Stats banner */}
      <div className="grid grid-cols-3 gap-4 mb-10 bg-primary/5 rounded-2xl p-6 border border-primary/10" data-aos="fade-up">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">500+</p>
          <p className="text-xs text-muted-foreground mt-1">Professionals</p>
        </div>
        <div className="text-center border-x border-primary/10">
          <p className="text-2xl font-bold text-primary">4.7</p>
          <p className="text-xs text-muted-foreground mt-1">Avg Rating</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">50k+</p>
          <p className="text-xs text-muted-foreground mt-1">Jobs Done</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))
          : professionals?.map((pro, i) => (
              <Link key={pro.id} href={`/professionals/${pro.id}`} data-testid={`card-professional-${pro.id}`}>
                <div 
                  className="rounded-2xl border border-border bg-card p-6 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group h-full flex flex-col"
                  data-aos="fade-up"
                  data-aos-delay={(i % 3) * 100}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 text-2xl font-bold text-primary">
                      {pro.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{pro.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {pro.isVerified && (
                          <Badge className="text-xs px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                            <Shield className="w-2.5 h-2.5 mr-1" />Verified
                          </Badge>
                        )}
                        <Badge
                          className={`text-xs px-1.5 py-0 ${pro.isAvailable ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}
                        >
                          {pro.isAvailable ? "Available" : "Busy"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{pro.bio}</p>

                  <div className="space-y-2">
                    <StarRating rating={pro.rating} count={pro.reviewCount} size="md" />
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span><strong className="text-foreground">{pro.completedJobs.toLocaleString()}</strong> jobs</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Star className="w-3.5 h-3.5" />
                        <span><strong className="text-foreground">{pro.yearsExperience}yr</strong> exp.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}
