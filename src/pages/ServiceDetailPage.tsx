import { useParams, Link } from "wouter";
import { Clock, ArrowLeft, Settings, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import StarRating from "@/components/StarRating";
import {
  useGetService,
  useListReviews,
  useListProfessionals,
  getGetServiceQueryKey,
  getListReviewsQueryKey,
  getListProfessionalsQueryKey,
} from "@workspace/api-client-react";

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const serviceId = Number(id);

  const { data: service, isLoading } = useGetService(serviceId, {
    query: { enabled: !!serviceId, queryKey: getGetServiceQueryKey(serviceId) },
  });
  const { data: reviews } = useListReviews(
    { serviceId },
    { query: { enabled: !!serviceId, queryKey: getListReviewsQueryKey({ serviceId }) } }
  );
  const { data: professionals } = useListProfessionals(undefined, {
    query: { queryKey: getListProfessionalsQueryKey() },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Service not found.</p>
        <Link href="/services"><Button variant="outline" className="mt-4">Back to Services</Button></Link>
      </div>
    );
  }

  const highlights = [
    "Professional grade equipment included",
    "Trained and background-verified specialist",
    "Satisfaction guarantee or free redo",
    "Transparent pricing, no hidden charges",
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 overflow-hidden">
      <Link href="/services">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2" data-testid="button-back" data-aos="fade-right">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Services
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center" data-aos="zoom-in">
            <Settings className="w-20 h-20 text-primary/30" />
          </div>

          <div data-aos="fade-up">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{service.name}</h1>
              {service.isFeatured && (
                <Badge className="bg-accent/20 text-accent border-accent/30">Popular</Badge>
              )}
            </div>
            {service.categoryName && (
              <Badge variant="secondary" className="mb-3">{service.categoryName}</Badge>
            )}
            <p className="text-muted-foreground leading-relaxed">{service.description}</p>
          </div>

          {/* Highlights */}
          <div className="rounded-xl border border-border bg-card p-5" data-aos="fade-up" data-aos-delay="100">
            <h3 className="font-semibold text-foreground mb-3">What's Included</h3>
            <ul className="space-y-2">
              {highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          {/* Reviews */}
          {reviews && reviews.length > 0 && (
            <div data-aos="fade-up" data-aos-delay="200">
              <h3 className="font-semibold text-foreground mb-4">Customer Reviews</h3>
              <div className="space-y-3">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="rounded-xl border border-border bg-card p-4" data-testid={`card-review-${review.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{review.customerName.charAt(0)}</span>
                        </div>
                        <span className="font-medium text-sm text-foreground">{review.customerName}</span>
                      </div>
                      <StarRating rating={review.rating} showValue={false} />
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Booking Card */}
          <div className="rounded-2xl border border-border bg-card p-6 sticky top-20" data-aos="fade-left" data-aos-delay="100">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-3xl font-bold text-foreground">₹{service.basePrice}</p>
                <p className="text-xs text-muted-foreground">per session</p>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {service.durationMinutes} min
              </div>
            </div>
            <StarRating rating={service.rating} count={service.reviewCount} size="md" />
            <Link href={`/bookings/new?serviceId=${service.id}`}>
              <Button className="w-full mt-4" size="lg" data-testid="button-book-service">
                Book This Service
              </Button>
            </Link>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Free cancellation up to 2 hours before
            </p>
          </div>

          {/* Available Pros */}
          {professionals && professionals.filter(p => p.isAvailable).length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5" data-aos="fade-left" data-aos-delay="200">
              <h3 className="font-semibold text-foreground mb-3 text-sm">Available Professionals</h3>
              <div className="space-y-3">
                {professionals.filter(p => p.isAvailable).slice(0, 3).map((pro) => (
                  <Link key={pro.id} href={`/professionals/${pro.id}`} data-testid={`link-professional-${pro.id}`}>
                    <div className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 transition-colors cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">{pro.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{pro.name}</p>
                        <StarRating rating={pro.rating} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
