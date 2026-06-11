import { TrendingUp, Users, Briefcase, Star, Clock, CheckCircle, XCircle, IndianRupee } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  useGetDashboardStats,
  useGetRecentBookings,
  useGetTopServices,
  getGetDashboardStatsQueryKey,
  getGetRecentBookingsQueryKey,
  getGetTopServicesQueryKey,
} from "@workspace/api-client-react";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  confirmed: { label: "Confirmed", className: "bg-blue-50 text-blue-700 border-blue-200" },
  in_progress: { label: "In Progress", className: "bg-purple-50 text-purple-700 border-purple-200" },
  completed: { label: "Completed", className: "bg-green-50 text-green-700 border-green-200" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-500 border-red-200" },
};

function StatCard({
  title,
  value,
  sub,
  icon,
  accent,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>
      <div className={`flex items-center justify-between mb-3 ${accent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
        <span className="text-sm font-medium">{title}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${accent ? "bg-white/20" : "bg-primary/10"}`}>
          <div className={accent ? "text-primary-foreground" : "text-primary"}>{icon}</div>
        </div>
      </div>
      <p className={`text-3xl font-bold ${accent ? "text-primary-foreground" : "text-foreground"}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey() },
  });
  const { data: recentBookings, isLoading: bookingsLoading } = useGetRecentBookings({
    query: { queryKey: getGetRecentBookingsQueryKey() },
  });
  const { data: topServices, isLoading: topLoading } = useGetTopServices({
    query: { queryKey: getGetTopServicesQueryKey() },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-foreground">Platform Dashboard</h1>
        <p className="text-muted-foreground mt-1">Live overview of service activity and metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statsLoading ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatCard
              title="Total Bookings"
              value={stats?.totalBookings ?? 0}
              sub="All time"
              icon={<Briefcase className="w-4 h-4" />}
              accent
            />
            <StatCard
              title="Completed"
              value={stats?.completedBookings ?? 0}
              sub={`${stats?.totalBookings ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0}% completion rate`}
              icon={<CheckCircle className="w-4 h-4" />}
            />
            <StatCard
              title="Pending"
              value={stats?.pendingBookings ?? 0}
              sub="Awaiting service"
              icon={<Clock className="w-4 h-4" />}
            />
            <StatCard
              title="Cancelled"
              value={stats?.cancelledBookings ?? 0}
              sub="Cancelled bookings"
              icon={<XCircle className="w-4 h-4" />}
            />
            <StatCard
              title="Revenue"
              value={`₹${((stats?.totalRevenue ?? 0) / 1000).toFixed(1)}K`}
              sub="From completed jobs"
              icon={<IndianRupee className="w-4 h-4" />}
              accent
            />
            <StatCard
              title="Professionals"
              value={stats?.totalProfessionals ?? 0}
              sub="Active on platform"
              icon={<Users className="w-4 h-4" />}
            />
            <StatCard
              title="Services"
              value={stats?.totalServices ?? 0}
              sub="Available services"
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <StatCard
              title="Avg Rating"
              value={(stats?.averageRating ?? 0).toFixed(1)}
              sub="Customer satisfaction"
              icon={<Star className="w-4 h-4" />}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-3">
          <h2 className="text-lg font-bold text-foreground mb-5">Recent Bookings</h2>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {bookingsLoading ? (
              <div className="p-5 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : recentBookings?.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-sm">No bookings yet</div>
            ) : (
              <div className="divide-y divide-border">
                {recentBookings?.map((booking) => {
                  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
                  return (
                    <div key={booking.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors" data-testid={`row-booking-${booking.id}`}>
                      <div>
                        <p className="font-medium text-sm text-foreground">{booking.serviceName}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          <span>{booking.customerName}</span>
                          <Separator orientation="vertical" className="h-3" />
                          <span>{format(new Date(booking.scheduledAt), "dd MMM, h:mm a")}</span>
                          <Separator orientation="vertical" className="h-3" />
                          <span className="font-semibold text-foreground">₹{booking.totalPrice}</span>
                        </div>
                      </div>
                      <Badge className={status.className}>{status.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top Services */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-foreground mb-5">Top Services</h2>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {topLoading ? (
              <div className="p-5 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : topServices?.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-sm">No data</div>
            ) : (
              <div className="divide-y divide-border">
                {topServices?.map((svc, i) => (
                  <div key={svc.serviceId} className="flex items-center gap-3 p-4" data-testid={`row-top-service-${svc.serviceId}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i === 0 ? "bg-amber-100 text-amber-700" :
                      i === 1 ? "bg-gray-100 text-gray-600" :
                      i === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{svc.serviceName}</p>
                      {svc.categoryName && (
                        <p className="text-xs text-muted-foreground">{svc.categoryName}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-foreground">{svc.bookingCount} bookings</p>
                      <p className="text-xs text-primary">{svc.rating.toFixed(1)} ★</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
