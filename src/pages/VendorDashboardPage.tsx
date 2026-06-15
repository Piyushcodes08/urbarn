import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth, type VendorData } from "@/hooks/use-auth";
import {
  useListBookings,
  useUpdateBookingStatus,
  useGetProfessional,
  useUpdateProfessional,
  useListReviews,
  useListServices,
  useCreateService,
  useDeleteService,
  getListBookingsQueryKey,
  getGetProfessionalQueryKey,
  getListReviewsQueryKey,
  getListServicesQueryKey,
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
  AlertCircle,
  PlusCircle,
  Trash2,
  Layers,
  TrendingUp,
  Settings,
  Edit3,
  Award,
  BarChart3,
  Target,
  Zap,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  Save,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CATEGORY_DETAILS } from "@/data/categoryServicesData";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30" },
  confirmed: { label: "Confirmed", className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30" },
  in_progress: { label: "In Progress", className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30" },
  completed: { label: "Completed", className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-500 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" },
};

// Mini bar chart for earnings visualization
function MiniBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full rounded-t-sm bg-primary/70 transition-all duration-500"
            style={{ height: `${(d.value / max) * 64}px`, minHeight: d.value > 0 ? "4px" : "0" }}
          />
          <span className="text-[9px] text-muted-foreground font-medium truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Progress ring
function ProgressRing({ value, max, size = 72, color = "hsl(160 50% 25%)" }: { value: number; max: number; size?: number; color?: string }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? value / max : 0;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={6} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  );
}

export default function VendorDashboardPage() {
  const [, setLocation] = useLocation();
  const { user, userData } = useAuth();
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

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedBio, setEditedBio] = useState("");
  const [editedPhone, setEditedPhone] = useState("");
  const [editedCity, setEditedCity] = useState("");

  // Add service form states
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");

  // Selected sub-category for filtering
  const [selectedSubCat, setSelectedSubCat] = useState<string>("all");

  // Custom service offerings states
  const [editedPrices, setEditedPrices] = useState<Record<number, string>>({});
  const [editedDurations, setEditedDurations] = useState<Record<number, string>>({});

  const handleToggleService = (serviceId: number, currentStatus: boolean) => {
    if (!profile) return;
    let currentIds = profile.serviceIds ? profile.serviceIds.split(",") : [];

    if (!profile.serviceIds) {
      currentIds = services?.map((s) => String(s.id)) ?? [];
    }

    let newIds: string[];
    if (currentStatus) {
      newIds = currentIds.filter((id) => id !== String(serviceId));
    } else {
      newIds = [...currentIds.filter((id) => id !== String(serviceId)), String(serviceId)];
    }

    updateProfile.mutate(
      {
        id: proId,
        data: { serviceIds: newIds.join(",") },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProfessionalQueryKey(proId) });
          toast({ title: "Offerings Updated", description: "Your service offerings have been updated." });
        },
      }
    );
  };

  const handleSaveCustomization = (serviceId: number) => {
    if (!profile) return;
    const priceInput = editedPrices[serviceId];
    const durationInput = editedDurations[serviceId];
    const currentPrices = profile.servicePrices ? { ...profile.servicePrices } : {};
    if (priceInput !== undefined) currentPrices[serviceId] = parseFloat(priceInput);
    const currentDurations = profile.serviceDurations ? { ...profile.serviceDurations } : {};
    if (durationInput !== undefined) currentDurations[serviceId] = parseInt(durationInput);

    updateProfile.mutate(
      { id: proId, data: { servicePrices: currentPrices, serviceDurations: currentDurations } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProfessionalQueryKey(proId) });
          setEditedPrices((prev) => { const next = { ...prev }; delete next[serviceId]; return next; });
          setEditedDurations((prev) => { const next = { ...prev }; delete next[serviceId]; return next; });
          toast({ title: "Customization Saved", description: "Your custom rate and duration have been saved." });
        },
      }
    );
  };

  const firstCatId = profile?.categoryIds ? parseInt(profile.categoryIds.split(",")[0]) : 1;

  const { data: services, isLoading: servicesLoading } = useListServices(
    { categoryId: firstCatId },
    { query: { enabled: !!firstCatId, queryKey: getListServicesQueryKey({ categoryId: firstCatId }) } }
  );

  const createService = useCreateService({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
        setIsAddServiceOpen(false);
        setNewServiceName("");
        setNewServicePrice("");
        setNewServiceDuration("");
        setNewServiceDesc("");
        toast({ title: "Service Added", description: "Successfully added to the platform registry." });
      },
      onError: (err) => {
        toast({ title: "Error Adding Service", description: err.message, variant: "destructive" });
      }
    },
  });

  const deleteService = useDeleteService({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
        toast({ title: "Service Removed", description: "Service removed from system." });
      },
      onError: (err) => {
        toast({ title: "Error Removing Service", description: err.message, variant: "destructive" });
      }
    },
  });

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice || !newServiceDuration) return;
    createService.mutate({
      data: {
        name: newServiceName,
        categoryId: firstCatId,
        basePrice: parseFloat(newServicePrice),
        durationMinutes: parseInt(newServiceDuration),
        description: newServiceDesc,
        imageUrl: null,
      },
    });
  };

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
        toast({ title: "Update Failed", description: err.message, variant: "destructive" });
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

  const handleSaveProfile = () => {
    updateProfile.mutate(
      {
        id: proId,
        data: {
          ...(editedBio && { bio: editedBio }),
        },
      },
      {
        onSuccess: () => {
          setIsEditingProfile(false);
          toast({ title: "Profile Saved", description: "Your profile has been updated successfully." });
        },
      }
    );
  };

  // Derive Statistics
  const totalBookings = bookings?.length ?? 0;
  const completedBookings = bookings?.filter((b) => b.status === "completed") ?? [];
  const completedCount = completedBookings.length;
  const totalEarnings = completedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const pendingJobs = bookings?.filter((b) => b.status === "pending" || b.status === "confirmed" || b.status === "in_progress") ?? [];
  const activeCount = pendingJobs.length;
  const cancelledCount = bookings?.filter((b) => b.status === "cancelled").length ?? 0;

  // Earnings by week (last 6 bookings grouped)
  const earningsData = useMemo(() => {
    if (!completedBookings.length) {
      return [
        { label: "Mon", value: 0 }, { label: "Tue", value: 0 }, { label: "Wed", value: 0 },
        { label: "Thu", value: 0 }, { label: "Fri", value: 0 }, { label: "Sat", value: 0 }, { label: "Sun", value: 0 },
      ];
    }
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const data = days.map((label) => ({ label, value: 0 }));
    completedBookings.forEach((b) => {
      const dayIdx = new Date(b.scheduledAt).getDay();
      const mappedIdx = dayIdx === 0 ? 6 : dayIdx - 1;
      data[mappedIdx].value += b.totalPrice;
    });
    return data;
  }, [completedBookings]);

  // Static UC-style local category data for the vendor's service category
  const vendorCategoryData = useMemo(() => {
    const catName = ((userData as VendorData | null)?.serviceCategory ?? "").toLowerCase();
    return CATEGORY_DETAILS.find(
      (c) =>
        catName.includes(c.id.replace(/-/g, " ")) ||
        c.name.toLowerCase().includes(catName.split(" ")[0]) ||
        catName.includes(c.name.toLowerCase().split(" ")[0])
    );
  }, [userData]);

  // Filtered local services based on selected sub-category
  const localSubCategories = vendorCategoryData?.subCategories ?? [];
  const filteredLocalServices = useMemo(() => {
    if (selectedSubCat === "all") return localSubCategories.flatMap((s) => s.services.map((sv) => ({ ...sv, subCatName: s.name, subCatId: s.id })));
    const sub = localSubCategories.find((s) => s.id === selectedSubCat);
    return (sub?.services ?? []).map((sv) => ({ ...sv, subCatName: sub!.name, subCatId: sub!.id }));
  }, [localSubCategories, selectedSubCat]);

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
            <div className="flex items-center gap-3 mt-1.5">
              {vendorCategoryData && (
                <span className="inline-flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 px-2.5 py-1 rounded-full">
                  {vendorCategoryData.icon} {vendorCategoryData.name}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
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
        <div className="flex items-center justify-between border-b border-border mb-6 overflow-x-auto">
          <TabsList className="bg-transparent h-auto p-0 flex gap-4 flex-shrink-0">
            {[
              { value: "bookings", label: "Job Queue", count: totalBookings },
              { value: "services", label: "My Services", count: filteredLocalServices.length },
              { value: "analytics", label: "Analytics", count: null },
              { value: "reviews", label: "Reviews", count: reviews?.length ?? 0 },
              { value: "profile", label: "Profile & Settings", count: null },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="bg-transparent border-b-2 border-transparent px-1 py-3 text-sm font-medium text-muted-foreground rounded-none shadow-none data-[state=active]:border-primary data-[state=active]:text-primary whitespace-nowrap"
              >
                {tab.label}{tab.count !== null ? ` (${tab.count})` : ""}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ─── Bookings Tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="bookings" className="focus-visible:outline-none">
          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {["All", "Pending", "Confirmed", "In Progress", "Completed", "Cancelled"].map((label) => {
              const key = label.toLowerCase().replace(" ", "_");
              const count = label === "All"
                ? totalBookings
                : bookings?.filter((b) => b.status === key).length ?? 0;
              return (
                <button
                  key={label}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  {label} {count > 0 && <span className="ml-1 text-[10px] font-bold">{count}</span>}
                </button>
              );
            })}
          </div>

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

        {/* ─── Services Tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="services" className="space-y-4 focus-visible:outline-none">
          {/* Info Banner */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Your Service Catalogue</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                These are all services available under <strong>{vendorCategoryData?.name ?? "your"}</strong> category. Toggle services on/off to control what you offer, and set custom pricing for each service.
              </p>
            </div>
          </div>

          {/* Sub-category filter tabs */}
          {localSubCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSubCat("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedSubCat === "all" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"}`}
              >
                All Services ({localSubCategories.reduce((sum, s) => sum + s.services.length, 0)})
              </button>
              {localSubCategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubCat(sub.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${selectedSubCat === sub.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"}`}
                >
                  <span>{sub.icon}</span>
                  {sub.name} ({sub.services.length})
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center bg-muted/40 p-4 rounded-xl border border-border">
            <p className="text-xs font-semibold text-muted-foreground">
              {filteredLocalServices.length} services {selectedSubCat !== "all" ? `in selected subcategory` : `in ${vendorCategoryData?.name ?? "your category"}`}
            </p>
            <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-1">
                  <PlusCircle className="w-4 h-4" /> Add Custom Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-card border border-border rounded-xl">
                <DialogHeader>
                  <DialogTitle>Add New Service</DialogTitle>
                  <DialogDescription>Create a custom service offering under your category.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddService} className="space-y-4 mt-2">
                  <div className="space-y-1">
                    <Label htmlFor="v-service-name">Service Name</Label>
                    <Input
                      id="v-service-name"
                      placeholder="e.g. Hair Cut, Body Massage, Hydrafacial"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="v-service-price">Base Price (₹)</Label>
                      <Input
                        id="v-service-price"
                        type="number"
                        placeholder="e.g. 499"
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="v-service-duration">Duration (mins)</Label>
                      <Input
                        id="v-service-duration"
                        type="number"
                        placeholder="e.g. 45"
                        value={newServiceDuration}
                        onChange={(e) => setNewServiceDuration(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="v-service-desc">Description</Label>
                    <Textarea
                      id="v-service-desc"
                      placeholder="Describe what is included in this service..."
                      rows={3}
                      value={newServiceDesc}
                      onChange={(e) => setNewServiceDesc(e.target.value)}
                      required
                    />
                  </div>
                  <DialogFooter className="mt-4">
                    <Button type="submit" disabled={createService.isPending}>
                      {createService.isPending ? "Adding..." : "Add Service"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Local services from category data */}
          {localSubCategories.length > 0 ? (
            <div className="space-y-4">
              {(selectedSubCat === "all" ? localSubCategories : localSubCategories.filter((s) => s.id === selectedSubCat)).map((sub) => (
                <Card key={sub.id} className="border border-border rounded-xl overflow-hidden">
                  <div className="p-4 bg-muted/30 border-b border-border flex items-center gap-2.5">
                    <span className="text-xl">{sub.icon}</span>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{sub.name}</h3>
                      <p className="text-xs text-muted-foreground">{sub.description}</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto text-xs">{sub.services.length} services</Badge>
                  </div>
                  <div className="divide-y divide-border">
                    {sub.services.map((svc) => (
                      <div key={svc.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm text-foreground">{svc.name}</p>
                            {svc.tag && (
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                                svc.tag === "Bestseller" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                svc.tag === "New" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                "bg-rose-50 text-rose-700 border-rose-200"
                              }`}>{svc.tag}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{svc.rating}</span>
                            <span>({svc.reviewCount.toLocaleString()} reviews)</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{svc.duration}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{svc.description}</p>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">₹{svc.price.toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground">base price</p>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <Switch
                              defaultChecked={true}
                              data-testid={`toggle-svc-${svc.id}`}
                            />
                            <span className="text-[9px] text-muted-foreground">Offered</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            /* Fallback: Firestore services */
            <Card className="rounded-xl border border-border overflow-hidden">
              {servicesLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : !services || services.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No services listed under your category.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Offered</TableHead>
                      <TableHead>Service Details</TableHead>
                      <TableHead className="w-[150px]">Duration</TableHead>
                      <TableHead className="w-[160px]">Price (₹)</TableHead>
                      <TableHead>Avg Rating</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((s) => {
                      const isOffered = !profile?.serviceIds ? true : profile.serviceIds.split(",").includes(String(s.id));
                      const currentPrice = editedPrices[s.id] !== undefined ? editedPrices[s.id] : String(profile?.servicePrices?.[s.id] ?? s.basePrice);
                      const currentDuration = editedDurations[s.id] !== undefined ? editedDurations[s.id] : String(profile?.serviceDurations?.[s.id] ?? s.durationMinutes);
                      const isPriceDirty = editedPrices[s.id] !== undefined && parseFloat(editedPrices[s.id]) !== (profile?.servicePrices?.[s.id] ?? s.basePrice);
                      const isDurationDirty = editedDurations[s.id] !== undefined && parseInt(editedDurations[s.id]) !== (profile?.serviceDurations?.[s.id] ?? s.durationMinutes);
                      const isDirty = isPriceDirty || isDurationDirty;

                      return (
                        <TableRow key={s.id} className="hover:bg-muted/20">
                          <TableCell>
                            <Switch
                              checked={isOffered}
                              onCheckedChange={() => handleToggleService(s.id, isOffered)}
                              disabled={updateProfile.isPending}
                            />
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-foreground">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 font-bold">
                                {s.name}
                                {s.isFeatured && <Badge className="bg-amber-100 text-amber-800 text-[9px] py-0 px-1 border-amber-200">Featured</Badge>}
                              </div>
                              <span className="text-[10px] text-muted-foreground font-normal line-clamp-1">{s.description}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {isOffered ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  className="w-16 h-8 text-xs px-2"
                                  value={currentDuration}
                                  onChange={(e) => setEditedDurations(prev => ({ ...prev, [s.id]: e.target.value }))}
                                />
                                <span className="text-[10px] text-muted-foreground">mins</span>
                              </div>
                            ) : (
                              <span>{s.durationMinutes} mins</span>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold text-xs text-foreground">
                            {isOffered ? (
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground text-xs">₹</span>
                                <Input
                                  type="number"
                                  className="w-24 h-8 text-xs px-2"
                                  value={currentPrice}
                                  onChange={(e) => setEditedPrices(prev => ({ ...prev, [s.id]: e.target.value }))}
                                />
                              </div>
                            ) : (
                              <span>₹{s.basePrice}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-yellow-600 font-semibold">{s.rating.toFixed(1)} ★</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isDirty && (
                                <Button
                                  size="sm"
                                  className="h-7 px-2.5 text-xs bg-primary text-white"
                                  onClick={() => handleSaveCustomization(s.id)}
                                  disabled={updateProfile.isPending}
                                >
                                  Save
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  if (confirm(`Remove service "${s.name}"?`)) {
                                    deleteService.mutate({ id: s.id });
                                  }
                                }}
                                disabled={deleteService.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Card>
          )}
        </TabsContent>

        {/* ─── Analytics Tab ────────────────────────────────────────────────────── */}
        <TabsContent value="analytics" className="focus-visible:outline-none space-y-6">
          {/* Earnings Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border border-border rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold text-foreground">Weekly Earnings</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">Earnings from completed jobs this week</CardDescription>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Active
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-3xl font-bold text-foreground">₹{totalEarnings.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total lifetime earnings</p>
                </div>
                <MiniBarChart data={earningsData} />
              </CardContent>
            </Card>

            <Card className="border border-border rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">Completion Rate</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Based on all bookings</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 pt-2">
                <div className="relative">
                  <ProgressRing value={completedCount} max={totalBookings} size={96} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-foreground">
                      {totalBookings > 0 ? Math.round((completedCount / totalBookings) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Completed</span>
                    <span className="font-semibold text-foreground">{completedCount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Active</span>
                    <span className="font-semibold text-foreground">{activeCount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Cancelled</span>
                    <span className="font-semibold text-foreground">{cancelledCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Avg Booking Value", value: completedCount > 0 ? `₹${Math.round(totalEarnings / completedCount).toLocaleString()}` : "₹0", icon: <IndianRupee className="w-4 h-4" />, color: "text-primary bg-primary/10" },
              { label: "Response Rate", value: totalBookings > 0 ? `${Math.round(((totalBookings - cancelledCount) / totalBookings) * 100)}%` : "—", icon: <Zap className="w-4 h-4" />, color: "text-amber-600 bg-amber-100" },
              { label: "Avg Rating", value: profile?.rating ? profile.rating.toFixed(1) + " ★" : "5.0 ★", icon: <Star className="w-4 h-4" />, color: "text-yellow-600 bg-yellow-100" },
              { label: "Total Reviews", value: String(profile?.reviewCount ?? 0), icon: <MessageSquare className="w-4 h-4" />, color: "text-purple-600 bg-purple-100" },
            ].map((m, i) => (
              <Card key={i} className="border border-border rounded-xl" data-aos="fade-up" data-aos-delay={i * 50}>
                <CardContent className="pt-4 pb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2.5 ${m.color}`}>{m.icon}</div>
                  <p className="text-xl font-bold text-foreground">{m.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tips & Insights */}
          <Card className="border border-border rounded-2xl bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Growth Tips for You
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { tip: "Complete your profile bio and add a professional photo to get 40% more bookings.", icon: "👤" },
                { tip: "Vendors who respond within 1 hour get 2x more confirmed bookings.", icon: "⚡" },
                { tip: "Adding more sub-category services increases your discoverability by 60%.", icon: "📈" },
                { tip: "Customers who get called before service arrival have 30% higher satisfaction.", icon: "📞" },
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-3 text-xs text-muted-foreground p-3 bg-card rounded-xl border border-border">
                  <span className="text-base flex-shrink-0">{t.icon}</span>
                  <p>{t.tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Reviews Tab ──────────────────────────────────────────────────────── */}
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
            <>
              {/* Rating Summary */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl p-5 mb-5 flex items-center gap-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-foreground">{profile?.rating ? profile.rating.toFixed(1) : "5.0"}</p>
                  <div className="flex items-center gap-0.5 justify-center mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round(profile?.rating ?? 5) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{profile?.reviewCount ?? 0} reviews</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews?.filter((r) => Math.round(r.rating) === star).length ?? 0;
                    const pct = reviews?.length ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-3 text-right font-medium">{star}</span>
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-muted-foreground w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

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
            </>
          )}
        </TabsContent>

        {/* ─── Profile & Settings Tab ───────────────────────────────────────────── */}
        <TabsContent value="profile" className="focus-visible:outline-none space-y-6">
          {/* Profile Card */}
          <Card className="border border-border rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Profile Information</CardTitle>
                <CardDescription className="text-xs">Update your professional profile visible to customers</CardDescription>
              </div>
              {!isEditingProfile ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1.5"
                  onClick={() => {
                    setEditedBio(profile?.bio ?? "");
                    setIsEditingProfile(true);
                  }}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                  <Button size="sm" className="flex items-center gap-1.5" onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                    <Save className="w-3.5 h-3.5" /> Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
              {profileLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <>
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center border-2 border-primary/20">
                      <span className="text-3xl font-bold text-primary">{profile?.name ? profile.name.charAt(0) : "V"}</span>
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-lg">{profile?.name ?? user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {profile?.isVerified && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                            <Shield className="w-3 h-3 mr-1" /> Verified
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {vendorCategoryData?.icon} {vendorCategoryData?.name ?? "General"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</Label>
                      <Input value={profile?.name ?? user.name} disabled className="text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                      <Input value={user.email} disabled className="text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Service Category</Label>
                      <Input value={vendorCategoryData?.name ?? ((userData as VendorData | null)?.serviceCategory ?? "—")} disabled className="text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Experience (Years)</Label>
                      <Input value={profile?.yearsExperience ? `${profile.yearsExperience} years` : "—"} disabled className="text-sm" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Professional Bio</Label>
                    {isEditingProfile ? (
                      <Textarea
                        rows={4}
                        placeholder="Tell customers about your expertise, experience and what makes you stand out..."
                        value={editedBio}
                        onChange={(e) => setEditedBio(e.target.value)}
                        className="text-sm"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground p-3 bg-muted/40 rounded-lg border border-border min-h-[80px]">
                        {profile?.bio ?? "No bio added yet. Click 'Edit Profile' to add a professional bio."}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Availability & Preferences */}
          <Card className="border border-border rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Availability & Preferences</CardTitle>
              <CardDescription className="text-xs">Control your work availability and job preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border">
                <div>
                  <p className="font-semibold text-sm text-foreground">Accept New Jobs</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {profile?.isAvailable ? "You are currently visible to customers" : "You are currently offline — no new bookings"}
                  </p>
                </div>
                <Switch
                  checked={profile?.isAvailable ?? false}
                  onCheckedChange={handleToggleAvailability}
                  disabled={updateProfile.isPending}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/40 rounded-xl border border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Jobs Completed</p>
                  <p className="text-2xl font-bold text-foreground">{profile?.completedJobs?.toLocaleString() ?? completedCount}</p>
                </div>
                <div className="p-4 bg-muted/40 rounded-xl border border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Avg Rating</p>
                  <p className="text-2xl font-bold text-foreground">{profile?.rating?.toFixed(1) ?? "5.0"} <span className="text-sm text-amber-500">★</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Info (from registration) */}
          {userData && userData.role === "vendor" && (
            <Card className="border border-border rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Business Details</CardTitle>
                <CardDescription className="text-xs">Your registration details (contact support to update)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "Business Name", value: (userData as VendorData).businessName || "—" },
                    { label: "Phone", value: (userData as VendorData).phone || "—" },
                    { label: "City", value: (userData as VendorData).city || "—" },
                    { label: "Experience", value: (userData as VendorData).experience || "—" },
                    { label: "Account Status", value: (userData as VendorData).status || "—" },
                  ].map((field) => (
                    <div key={field.label} className="p-3 bg-muted/40 rounded-lg border border-border">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{field.label}</p>
                      <p className="font-medium text-foreground">{field.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Danger Zone */}
          <Card className="border border-destructive/20 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-destructive">Danger Zone</CardTitle>
              <CardDescription className="text-xs">These actions are irreversible. Proceed with caution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                <div>
                  <p className="font-medium text-sm text-foreground">Deactivate Account</p>
                  <p className="text-xs text-muted-foreground">Your profile will be hidden from customers</p>
                </div>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                  Deactivate
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
