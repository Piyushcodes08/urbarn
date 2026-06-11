import { useParams, Link } from "wouter";
import { ArrowLeft, Shield, Briefcase, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import StarRating from "@/components/StarRating";
import {
  useGetProfessional,
  useListReviews,
  getGetProfessionalQueryKey,
  getListReviewsQueryKey,
} from "@workspace/api-client-react";

export default function ProfessionalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const profId = Number(id);

  const { data: professional, isLoading } = useGetProfessional(profId, {
    query: { enabled: !!profId, queryKey: getGetProfessionalQueryKey(profId) },
  });
  const { data: reviews } = useListReviews(
    { professionalId: profId },
    { query: { enabled: !!profId, queryKey: getListReviewsQueryKey({ professionalId: profId }) } }
  );

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-6">
          <Skeleton className="w-28 h-28 rounded-full" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Professional not found.</p>
        <Link href="/professionals"><Button variant="outline" className="mt-4">Back</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link href="/professionals">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2" data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-1" /> All Professionals
        </Button>
      </Link>

      {/* Profile Card */}
      <div className="rounded-2xl border border-border bg-card p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/25 to-accent/25 flex items-center justify-center flex-shrink-0 text-4xl font-bold text-primary">
            {professional.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{professional.name}</h1>
              <div className="flex gap-2">
                {professional.isVerified && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    <Shield className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                )}
                <Badge className={professional.isAvailable ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500"}>
                  {professional.isAvailable ? "Available Today" : "Currently Busy"}
                </Badge>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">{professional.bio}</p>
            <StarRating rating={professional.rating} count={professional.reviewCount} size="md" />

            <Separator className="my-4" />

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/40">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Briefcase className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xl font-bold text-foreground">{professional.completedJobs.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Jobs Completed</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/40">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xl font-bold text-foreground">{professional.yearsExperience}</p>
                <p className="text-xs text-muted-foreground">Years Experience</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/40">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-xl font-bold text-foreground">{professional.rating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Book CTA */}
      <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-foreground">Book {professional.name}</h3>
          <p className="text-muted-foreground text-sm mt-1">Available for home services across all categories</p>
        </div>
        <Link href={`/bookings/new?professionalId=${professional.id}`}>
          <Button size="lg" data-testid="button-book-professional">
            Book Now
          </Button>
        </Link>
      </div>

      {/* Reviews */}
      {reviews && reviews.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-foreground mb-5">Customer Reviews</h2>
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-border bg-card p-5" data-testid={`card-review-${review.id}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{review.customerName.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{review.customerName}</p>
                      {review.serviceName && (
                        <p className="text-xs text-muted-foreground">{review.serviceName}</p>
                      )}
                    </div>
                  </div>
                  <StarRating rating={review.rating} showValue={false} />
                </div>
                <p className="text-sm text-muted-foreground pl-11">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
