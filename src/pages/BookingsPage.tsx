import { Link } from "wouter";
import { Calendar, MapPin, User, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { format } from "date-fns";
import {
  useListBookings,
  useCancelBooking,
  getListBookingsQueryKey,
  ListBookingsStatus,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  confirmed: { label: "Confirmed", className: "bg-blue-50 text-blue-700 border-blue-200" },
  in_progress: { label: "In Progress", className: "bg-purple-50 text-purple-700 border-purple-200" },
  completed: { label: "Completed", className: "bg-green-50 text-green-700 border-green-200" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-500 border-red-200" },
};

const FILTER_OPTIONS: Array<{ value: typeof ListBookingsStatus[keyof typeof ListBookingsStatus] | undefined; label: string }> = [
  { value: undefined, label: "All" },
  { value: ListBookingsStatus.pending, label: "Pending" },
  { value: ListBookingsStatus.confirmed, label: "Confirmed" },
  { value: ListBookingsStatus.in_progress, label: "In Progress" },
  { value: ListBookingsStatus.completed, label: "Completed" },
  { value: ListBookingsStatus.cancelled, label: "Cancelled" },
];

export default function BookingsPage() {
  const [statusFilter, setStatusFilter] = useState<typeof ListBookingsStatus[keyof typeof ListBookingsStatus] | undefined>(undefined);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: bookings, isLoading } = useListBookings(
    statusFilter ? { status: statusFilter } : undefined,
    { query: { queryKey: getListBookingsQueryKey(statusFilter ? { status: statusFilter } : undefined) } }
  );

  const cancelBooking = useCancelBooking({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        toast({ title: "Booking cancelled", description: "Your booking has been cancelled." });
      },
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Bookings</h1>
          <p className="text-muted-foreground mt-1">Manage your service appointments</p>
        </div>
        <Link href="/bookings/new">
          <Button data-testid="button-new-booking">
            <Plus className="w-4 h-4 mr-2" /> New Booking
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.label}
            variant={statusFilter === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(opt.value)}
            data-testid={`filter-${opt.label.toLowerCase()}`}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="flex justify-between mb-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </div>
          ))}
        </div>
      ) : bookings?.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-border">
          <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-1">No bookings yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Book your first home service today</p>
          <Link href="/bookings/new">
            <Button data-testid="button-first-booking">Book a Service</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings?.map((booking) => {
            const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
            return (
              <div
                key={booking.id}
                className="rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-shadow"
                data-testid={`card-booking-${booking.id}`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{booking.serviceName}</h3>
                    {booking.professionalName && (
                      <p className="text-sm text-muted-foreground mt-0.5">with {booking.professionalName}</p>
                    )}
                  </div>
                  <Badge className={`${status.className} flex-shrink-0`}>{status.label}</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {format(new Date(booking.scheduledAt), "dd MMM yyyy, h:mm a")}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{booking.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {booking.customerName}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <span className="font-bold text-foreground">₹{booking.totalPrice}</span>
                  {(booking.status === "pending" || booking.status === "confirmed") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/5"
                      onClick={() => cancelBooking.mutate({ id: booking.id })}
                      disabled={cancelBooking.isPending}
                      data-testid={`button-cancel-booking-${booking.id}`}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
