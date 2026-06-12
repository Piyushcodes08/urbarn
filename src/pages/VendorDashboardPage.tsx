import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  useListBookings,
  useUpdateBookingStatus,
  useGetProfessional,
  useUpdateProfessional,
  useListReviews,
  getListBookingsQueryKey,
  getGetProfessionalQueryKey,
  getListReviewsQueryKey,
  BookingStatus,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  IndianRupee,
  Briefcase,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Phone,
  MapPin,
  Shield,
  Activity,
  Smile,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30" },
  confirmed: { label: "Confirmed", className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30" },
  in_progress: { label: "In Progress", className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30" },
  completed: { label: "Completed", className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-500 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" },
};

export default function VendorDashboardPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("bookings");

  // If not logged in as vendor, redirect to home
  if (!user || user.role !== "vendor") {
    setLocation("/");
    return null;
  }

  const proId = user.professionalId ?? 1; // Default fallback to Priya Sharma

  // Fetch Vendor Profile
  const { data: profile, isLoading: profileLoading } = useGetProfessional(proId, {
    query: { queryKey: getGetProfessionalQueryKey(proId) },
  });

  // Fetch Vendor Bookings
  const { data: bookings, isLoading: bookingsLoading } = useListBookings(
    { professionalId: proId },
    { query: { queryKey: getListBookingsQueryKey({ professionalId: proId }) } }
  );

  // Fetch Vendor Reviews
  const { data: reviews, isLoading: reviewsLoading } = useListReviews(
    { professionalId: proId },
    { query: { queryKey: getListReviewsQueryKey({ professionalId: proId }) } }
  );

  // Update Booking Status Mutation
  const updateStatus = useUpdateBookingStatus({
    mutation: {
      onSuccess: (updatedBooking) => {
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        toast({
          title: "Status Updated",
          description: `Booking #${updatedBooking.id} is now ${updatedBooking.status.replace("_", " ")}.`,
        });
      },
      onError: (err) => {
        toast({
          title: "Update Failed",
          description: err.message,
          variant: "destructive",
        });
      },
    },
  });

  // Toggle Availability Mutation
  const updateProfile = useUpdateProfessional({
    mutation: {
      onSuccess: (updatedPro) => {
        queryClient.invalidateQueries({ queryKey: getGetProfessionalQueryKey(proId) });
        toast({
          title: "Profile Updated",
          description: `Availability set to: ${updatedPro.isAvailable ? "Available" : "Busy"}.`,
        });
      },
    },
  });

  const handleToggleAvailability = (checked: boolean) => {
    updateProfile.mutate({ id: proId, data: { isAvailable: checked } });
  };

  // Derive Statistics
  const totalBookings = bookings?.length ?? 0;
  const completedBookings = bookings?.filter((b) => b.status === "completed") ?? [];
  const completedCount = completedBookings.length;
  const totalEarnings = completedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  
  const pendingJobs = bookings?.filter((b) => b.status === "pending" || b.status === "confirmed" || b.status === "in_progress") ?? [];
  const activeCount = pendingJobs.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 overflow-hidden">
      {/* Vendor Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-card border border-border p-6 rounded-2xl shadow-sm" data-aos="fade-down">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center border border-primary/20 flex-shrink-0">
            <span className="text-2xl font-bold text-primary">{profile?.name ? profile.name.charAt(0) : "V"}</span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-foreground">{profile?.name ?? user.name}</h1>
              {profile?.isVerified && (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <Shield className="w-3 h-3 mr-1 fill-emerald-800 dark:fill-emerald-400" /> Verified Partner
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl line-clamp-1">{profile?.bio ?? "Partnering to deliver high-quality home services."}</p>
          </div>
        </div>

        {/* Availability Switch */}
        <div className="flex items-center gap-3 bg-muted/50 px-4 py-3 rounded-xl border border-border">
          <div className="text-right">
            <p className="text-xs font-semibold text-foreground">Duty Status</p>
            <p className="text-xs text-muted-foreground mt-0.5">{profile?.isAvailable ? "Accepting Jobs" : "Offline / Busy"}</p>
          </div>
          <Switch
            checked={profile?.isAvailable ?? false}
            onCheckedChange={handleToggleAvailability}
            disabled={updateProfile.isPending}
            data-testid="availability-toggle"
          />
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {profileLoading || bookingsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <Card className="rounded-2xl shadow-sm border border-border" data-aos="fade-up" data-aos-delay={50}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Earnings</span>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">₹{totalEarnings.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">From {completedCount} completed jobs</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm border border-border" data-aos="fade-up" data-aos-delay={100}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed Jobs</span>
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 dark:bg-green-950 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{completedCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalBookings ? Math.round((completedCount / totalBookings) * 100) : 0}% completion rate
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm border border-border" data-aos="fade-up" data-aos-delay={150}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Jobs</span>
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{activeCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Pending and confirmed</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm border border-border" data-aos="fade-up" data-aos-delay={200}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rating</span>
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400">
                    <Star className="w-4 h-4 fill-yellow-600 dark:fill-yellow-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{profile?.rating ? profile.rating.toFixed(1) : "5.0"}</p>
                <p className="text-xs text-muted-foreground mt-1">Based on {profile?.reviewCount ?? 0} reviews</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Dynamic Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" data-aos="fade-up" data-aos-delay={250}>
        <div className="flex items-center justify-between border-b border-border mb-6">
          <TabsList className="bg-transparent h-auto p-0 flex gap-6">
            <TabsTrigger
              value="bookings"
              className="bg-transparent border-b-2 border-transparent px-1 py-3 text-sm font-medium text-muted-foreground rounded-none shadow-none data-[state=active]:border-primary data-[state=active]:text-primary"
            >
              Job Queue ({activeCount + (totalBookings - activeCount)})
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="bg-transparent border-b-2 border-transparent px-1 py-3 text-sm font-medium text-muted-foreground rounded-none shadow-none data-[state=active]:border-primary data-[state=active]:text-primary"
            >
              Reviews ({reviews?.length ?? 0})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Bookings Tab Content */}
        <TabsContent value="bookings" className="focus-visible:outline-none">
          {bookingsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : !bookings || bookings.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border bg-card rounded-2xl">
              <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground">No Jobs Assigned</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">When customers book services in your category, they will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
                return (
                  <Card key={booking.id} className="border border-border overflow-hidden hover:shadow-sm transition-shadow rounded-xl">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-primary/10 text-primary border-primary/20">Booking #{booking.id}</Badge>
                            <Badge className={status.className}>{status.label}</Badge>
                          </div>
                          <CardTitle className="text-lg font-bold text-foreground mt-2">{booking.serviceName}</CardTitle>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Service Price</p>
                          <p className="text-lg font-bold text-foreground">₹{booking.totalPrice}</p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-5 pt-0">
                      <Separator className="my-3" />
                      
                      {/* Customer Details & Schedule */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground flex-shrink-0">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-semibold tracking-wider">Scheduled At</p>
                            <p className="font-medium text-foreground text-xs">{format(new Date(booking.scheduledAt), "dd MMM yyyy, h:mm a")}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground flex-shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-semibold tracking-wider">Customer</p>
                            <p className="font-medium text-foreground text-xs">{booking.customerName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground flex-shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase font-semibold tracking-wider">Service Location</p>
                            <p className="font-medium text-foreground text-xs truncate" title={booking.address}>{booking.address}</p>
                          </div>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mt-4 p-3 bg-muted/40 rounded-lg text-xs flex gap-2">
                          <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-foreground">Customer Notes:</span> {booking.notes}
                          </div>
                        </div>
                      )}

                      {/* Action Triggers */}
                      <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-border flex-wrap">
                        {booking.customerPhone && (
                          <a href={`tel:${booking.customerPhone}`} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                            <Phone className="w-3.5 h-3.5" />
                            Call Customer
                          </a>
                        )}

                        <div className="flex items-center gap-2 ml-auto">
                          {booking.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive/20 hover:bg-destructive/10"
                                onClick={() => updateStatus.mutate({ id: booking.id, status: BookingStatus.cancelled })}
                                disabled={updateStatus.isPending}
                              >
                                Cancel Job
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateStatus.mutate({ id: booking.id, status: BookingStatus.confirmed })}
                                disabled={updateStatus.isPending}
                              >
                                Confirm Appointment
                              </Button>
                            </>
                          )}

                          {booking.status === "confirmed" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive/20 hover:bg-destructive/10"
                                onClick={() => updateStatus.mutate({ id: booking.id, status: BookingStatus.cancelled })}
                                disabled={updateStatus.isPending}
                              >
                                Cancel Job
                              </Button>
                              <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={() => updateStatus.mutate({ id: booking.id, status: BookingStatus.in_progress })}
                                disabled={updateStatus.isPending}
                              >
                                Start Work
                              </Button>
                            </>
                          )}

                          {booking.status === "in_progress" && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => updateStatus.mutate({ id: booking.id, status: BookingStatus.completed })}
                              disabled={updateStatus.isPending}
                            >
                              Mark Completed
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Reviews Tab Content */}
        <TabsContent value="reviews" className="focus-visible:outline-none">
          {reviewsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : !reviews || reviews.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border bg-card rounded-2xl">
              <Smile className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground">No Reviews Yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">Reviews left by customers after completed services will show up here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <Card key={rev.id} className="border border-border shadow-none rounded-xl">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-foreground">{rev.customerName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{rev.serviceName}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded text-xs font-semibold text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400">
                        {rev.rating} ★
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Separator className="my-2" />
                    <p className="text-xs italic text-muted-foreground leading-relaxed mt-2">&ldquo;{rev.comment}&rdquo;</p>
                    <p className="text-[10px] text-muted-foreground/60 text-right mt-3">{format(new Date(rev.createdAt), "dd MMM yyyy")}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
