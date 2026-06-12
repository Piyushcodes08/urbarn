import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  useListCategories,
  useCreateCategory,
  useListServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useListProfessionals,
  useCreateProfessional,
  useUpdateProfessional,
  useListBookings,
  useUpdateBookingStatus,
  useGetDashboardStats,
  getListCategoriesQueryKey,
  getListServicesQueryKey,
  getListProfessionalsQueryKey,
  getListBookingsQueryKey,
  getGetDashboardStatsQueryKey,
  Category,
  Service,
  Professional,
  BookingStatus,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  IndianRupee,
  Briefcase,
  Star,
  CheckCircle,
  XCircle,
  Users,
  TrendingUp,
  Trash2,
  ShieldCheck,
  Search,
  Filter,
  PlusCircle,
  Layers,
  Wrench
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PIE_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30" },
  confirmed: { label: "Confirmed", className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30" },
  in_progress: { label: "In Progress", className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30" },
  completed: { label: "Completed", className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-500 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" },
};

export default function AdminPanelPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Form states for creating resources
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("");
  const [newServiceCatId, setNewServiceCatId] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");

  const [isAddProOpen, setIsAddProOpen] = useState(false);
  const [newProName, setNewProName] = useState("");
  const [newProBio, setNewProBio] = useState("");
  const [newProExp, setNewProExp] = useState("");
  const [newProCatIds, setNewProCatIds] = useState("");

  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("Settings");

  // Bookings list query states
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>("all");

  // All hooks must be declared before early return
  // Data Queries — declared at top level before any conditional returns
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey() },
  });

  const { data: categories } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() },
  });

  const { data: services } = useListServices(undefined, {
    query: { queryKey: getListServicesQueryKey() },
  });

  const { data: professionals } = useListProfessionals(undefined, {
    query: { queryKey: getListProfessionalsQueryKey() },
  });

  const { data: bookings, isLoading: bookingsLoading } = useListBookings(
    bookingStatusFilter !== "all" ? { status: bookingStatusFilter as any } : undefined,
    { query: { queryKey: getListBookingsQueryKey(bookingStatusFilter !== "all" ? { status: bookingStatusFilter as any } : undefined) } }
  );

  const updateBookingStatus = useUpdateBookingStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        toast({ title: "Booking status updated", description: "The change has been saved." });
      },
    },
  });

  const createService = useCreateService({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
        setIsAddServiceOpen(false);
        setNewServiceName("");
        setNewServicePrice("");
        setNewServiceDuration("");
        setNewServiceDesc("");
        toast({ title: "Service Created", description: "New service successfully added." });
      },
    },
  });

  const deleteService = useDeleteService({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
        toast({ title: "Service Deleted", description: "Service removed from system." });
      },
    },
  });

  const createPro = useCreateProfessional({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProfessionalsQueryKey() });
        setIsAddProOpen(false);
        setNewProName("");
        setNewProBio("");
        setNewProExp("");
        setNewProCatIds("");
        toast({ title: "Professional Added", description: "New vendor registered successfully." });
      },
    },
  });

  const updatePro = useUpdateProfessional({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProfessionalsQueryKey() });
        toast({ title: "Professional Updated" });
      },
    },
  });

  const createCat = useCreateCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
        setIsAddCatOpen(false);
        setNewCatName("");
        setNewCatDesc("");
        toast({ title: "Category Created", description: "New category successfully added." });
      },
    },
  });

  // Redirect if not admin (after hooks)
  if (!user || user.role !== "admin") {
    setLocation("/");
    return null;
  }

  // (All hooks moved above the early return)

  // Submit forms handlers
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice || !newServiceDuration || !newServiceCatId) return;
    createService.mutate({
      data: {
        name: newServiceName,
        categoryId: parseInt(newServiceCatId),
        basePrice: parseFloat(newServicePrice),
        durationMinutes: parseInt(newServiceDuration),
        description: newServiceDesc,
        imageUrl: null,
      },
    });
  };

  const handleAddPro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProName || !newProBio || !newProExp || !newProCatIds) return;
    createPro.mutate({
      data: {
        name: newProName,
        bio: newProBio,
        yearsExperience: parseInt(newProExp),
        categoryIds: newProCatIds,
        isVerified: true,
        isAvailable: true,
      },
    });
  };

  const handleAddCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    const slug = newCatName.toLowerCase().replace(/\s+/g, "-");
    createCat.mutate({
      data: {
        name: newCatName,
        slug,
        icon: newCatIcon,
        description: newCatDesc,
      },
    });
  };

  // Recharts Data Mapping
  const revenueChartData = [
    { name: "Jan", revenue: 35000 },
    { name: "Feb", revenue: 42000 },
    { name: "Mar", revenue: 58000 },
    { name: "Apr", revenue: 49000 },
    { name: "May", revenue: 68000 },
    { name: "Jun", revenue: stats?.totalRevenue ?? 72000 },
  ];

  const pieChartData = [
    { name: "Completed", value: stats?.completedBookings ?? 0 },
    { name: "Pending", value: stats?.pendingBookings ?? 0 },
    { name: "Cancelled", value: stats?.cancelledBookings ?? 0 },
  ];

  const barChartData = categories?.map((cat) => ({
    name: cat.name.split(" ")[0], // Short name
    count: cat.serviceCount + (cat.id * 3), // Seed with mock weight
  })) ?? [];

  // Filter Bookings by Search Query
  const filteredBookings = bookings?.filter((b) => {
    const term = bookingSearch.toLowerCase();
    return (
      b.customerName.toLowerCase().includes(term) ||
      b.serviceName.toLowerCase().includes(term) ||
      (b.professionalName && b.professionalName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 overflow-hidden">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8" data-aos="fade-down">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Wrench className="w-8 h-8 text-primary" /> Admin Control Center
          </h1>
          <p className="text-muted-foreground mt-1">Platform metrics, service registry, user lists, and scheduler management.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" data-aos="fade-up" data-aos-delay={100}>
        <TabsList className="grid grid-cols-5 w-full lg:w-[650px] mb-8 bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg text-xs font-semibold">Overview</TabsTrigger>
          <TabsTrigger value="bookings" className="rounded-lg text-xs font-semibold">Bookings</TabsTrigger>
          <TabsTrigger value="services" className="rounded-lg text-xs font-semibold">Services</TabsTrigger>
          <TabsTrigger value="professionals" className="rounded-lg text-xs font-semibold">Vendors</TabsTrigger>
          <TabsTrigger value="categories" className="rounded-lg text-xs font-semibold">Categories</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview Dashboard */}
        <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
            </div>
          ) : (
            <>
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-2xl border border-border shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Revenue</span>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <IndianRupee className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">₹{stats?.totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">From completed bookings</p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-border shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Bookings</span>
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                        <Briefcase className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats?.totalBookings}</p>
                    <p className="text-xs text-muted-foreground mt-1">Pending, completed, cancelled</p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-border shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Partners</span>
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 dark:bg-purple-950 dark:text-purple-400">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats?.totalProfessionals}</p>
                    <p className="text-xs text-muted-foreground mt-1">Verified service vendors</p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-border shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Avg Rating</span>
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400">
                        <Star className="w-4 h-4 fill-yellow-600 dark:fill-yellow-400" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats?.averageRating ? stats.averageRating.toFixed(1) : "5.0"}</p>
                    <p className="text-xs text-muted-foreground mt-1">Across all services</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trend Chart */}
                <Card className="lg:col-span-2 rounded-2xl border border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-primary" /> Revenue Growth</CardTitle>
                    <CardDescription className="text-xs">Trend of simulated sales over the last 6 months.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[260px] pb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Booking Status Pie */}
                <Card className="rounded-2xl border border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Bookings Breakdown</CardTitle>
                    <CardDescription className="text-xs">Distribution of booking statuses.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[260px] pb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="45%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab 2: Bookings Management */}
        <TabsContent value="bookings" className="space-y-4 focus-visible:outline-none">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/40 p-4 rounded-xl border border-border">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customer, service..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-card"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="flex h-9 w-full sm:w-40 rounded-md border border-input bg-card px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <Card className="rounded-xl border border-border overflow-hidden">
            {bookingsLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !filteredBookings || filteredBookings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No bookings found matching query.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Professional</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((b) => {
                    const status = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.pending;
                    return (
                      <TableRow key={b.id} className="hover:bg-muted/20">
                        <TableCell className="font-semibold text-xs text-muted-foreground">#{b.id}</TableCell>
                        <TableCell className="font-medium text-xs text-foreground">{b.serviceName}</TableCell>
                        <TableCell className="text-xs text-foreground">{b.customerName}</TableCell>
                        <TableCell className="text-xs text-foreground">{b.professionalName ?? "Unassigned"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(b.scheduledAt), "dd MMM, h:mm a")}</TableCell>
                        <TableCell className="font-semibold text-xs text-foreground">₹{b.totalPrice}</TableCell>
                        <TableCell>
                          <Badge className={`${status.className} text-[10px] px-2 py-0.5`}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            {b.status !== "completed" && b.status !== "cancelled" && (
                              <>
                                {b.status === "pending" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 h-7 px-2 py-0"
                                    onClick={() => updateBookingStatus.mutate({ id: b.id, status: "confirmed" })}
                                    disabled={updateBookingStatus.isPending}
                                  >
                                    Confirm
                                  </Button>
                                )}
                                {b.status === "confirmed" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 h-7 px-2 py-0"
                                    onClick={() => updateBookingStatus.mutate({ id: b.id, status: "in_progress" })}
                                    disabled={updateBookingStatus.isPending}
                                  >
                                    Start
                                  </Button>
                                )}
                                {b.status === "in_progress" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs bg-green-50 text-green-700 hover:bg-green-100 border-green-200 h-7 px-2 py-0"
                                    onClick={() => updateBookingStatus.mutate({ id: b.id, status: "completed" })}
                                    disabled={updateBookingStatus.isPending}
                                  >
                                    Complete
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                  onClick={() => updateBookingStatus.mutate({ id: b.id, status: "cancelled" })}
                                  disabled={updateBookingStatus.isPending}
                                  title="Cancel Booking"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Tab 3: Services Registry */}
        <TabsContent value="services" className="space-y-4 focus-visible:outline-none">
          <div className="flex justify-between items-center bg-muted/40 p-4 rounded-xl border border-border">
            <p className="text-xs font-semibold text-muted-foreground">{services?.length ?? 0} Services Registered</p>
            
            <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-1">
                  <PlusCircle className="w-4 h-4" /> Add New Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-card border border-border rounded-xl">
                <DialogHeader>
                  <DialogTitle>Add New Service</DialogTitle>
                  <DialogDescription>Create a service offered to platform clients.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddService} className="space-y-4 mt-2">
                  <div className="space-y-1">
                    <Label htmlFor="service-name">Service Name</Label>
                    <Input id="service-name" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="service-price">Base Price (₹)</Label>
                      <Input id="service-price" type="number" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="service-duration">Duration (mins)</Label>
                      <Input id="service-duration" type="number" value={newServiceDuration} onChange={(e) => setNewServiceDuration(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="service-cat">Service Category</Label>
                    <select
                      id="service-cat"
                      value={newServiceCatId}
                      onChange={(e) => setNewServiceCatId(e.target.value)}
                      required
                      className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Select Category...</option>
                      {categories?.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="service-desc">Description</Label>
                    <Textarea id="service-desc" rows={3} value={newServiceDesc} onChange={(e) => setNewServiceDesc(e.target.value)} required />
                  </div>
                  <DialogFooter className="mt-4">
                    <Button type="submit" disabled={createService.isPending}>
                      {createService.isPending ? "Creating..." : "Add Service"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services?.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/20">
                    <TableCell className="font-semibold text-xs text-muted-foreground">#{s.id}</TableCell>
                    <TableCell className="text-xs font-semibold text-foreground">
                      <div>
                        {s.name}
                        {s.isFeatured && <Badge className="ml-1.5 bg-amber-100 text-amber-800 text-[9px] py-0 px-1 border-amber-200">Featured</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.categoryName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.durationMinutes} mins</TableCell>
                    <TableCell className="font-semibold text-xs text-foreground">₹{s.basePrice}</TableCell>
                    <TableCell className="text-xs text-yellow-600 font-semibold">{s.rating.toFixed(1)} ★</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm(`Delete service "${s.name}"?`)) {
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
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tab 4: Professionals Management */}
        <TabsContent value="professionals" className="space-y-4 focus-visible:outline-none">
          <div className="flex justify-between items-center bg-muted/40 p-4 rounded-xl border border-border">
            <p className="text-xs font-semibold text-muted-foreground">{professionals?.length ?? 0} Vendors Active</p>
            
            <Dialog open={isAddProOpen} onOpenChange={setIsAddProOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-1">
                  <PlusCircle className="w-4 h-4" /> Add New Professional
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-card border border-border rounded-xl">
                <DialogHeader>
                  <DialogTitle>Add Professional profile</DialogTitle>
                  <DialogDescription>Register a new service professional on the platform.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddPro} className="space-y-4 mt-2">
                  <div className="space-y-1">
                    <Label htmlFor="pro-name">Full Name</Label>
                    <Input id="pro-name" value={newProName} onChange={(e) => setNewProName(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pro-exp">Years of Experience</Label>
                    <Input id="pro-exp" type="number" value={newProExp} onChange={(e) => setNewProExp(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pro-cats">Assigned Category IDs (comma-separated, e.g. 1,2)</Label>
                    <Input id="pro-cats" placeholder="1,2" value={newProCatIds} onChange={(e) => setNewProCatIds(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pro-bio">Professional Bio</Label>
                    <Textarea id="pro-bio" rows={3} value={newProBio} onChange={(e) => setNewProBio(e.target.value)} required />
                  </div>
                  <DialogFooter className="mt-4">
                    <Button type="submit" disabled={createPro.isPending}>
                      {createPro.isPending ? "Adding..." : "Add Vendor"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Completed Jobs</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Verification Status</TableHead>
                  <TableHead>Availability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professionals?.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/20">
                    <TableCell className="font-semibold text-xs text-muted-foreground">#{p.id}</TableCell>
                    <TableCell className="text-xs font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        {p.name}
                        {p.isVerified && <ShieldCheck className="w-4 h-4 text-emerald-500 fill-emerald-100" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.yearsExperience} years</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.completedJobs} jobs</TableCell>
                    <TableCell className="text-xs text-yellow-600 font-semibold">{p.rating.toFixed(1)} ★</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{p.isVerified ? "Verified" : "Unverified"}</span>
                        <Switch
                          checked={p.isVerified}
                          onCheckedChange={(checked) => updatePro.mutate({ id: p.id, data: { isVerified: checked } })}
                          disabled={updatePro.isPending}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={p.isAvailable ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                        {p.isAvailable ? "Available" : "Busy"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tab 5: Categories Management */}
        <TabsContent value="categories" className="space-y-4 focus-visible:outline-none">
          <div className="flex justify-between items-center bg-muted/40 p-4 rounded-xl border border-border">
            <p className="text-xs font-semibold text-muted-foreground">{categories?.length ?? 0} Categories Available</p>
            
            <Dialog open={isAddCatOpen} onOpenChange={setIsAddCatOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-1">
                  <PlusCircle className="w-4 h-4" /> Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-card border border-border rounded-xl">
                <DialogHeader>
                  <DialogTitle>Add Category</DialogTitle>
                  <DialogDescription>Create a new category of home services.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddCat} className="space-y-4 mt-2">
                  <div className="space-y-1">
                    <Label htmlFor="cat-name">Category Name</Label>
                    <Input id="cat-name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cat-icon">Icon Name (Lucide Icon, e.g. Sparkles, Wind, Scissors)</Label>
                    <Input id="cat-icon" value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cat-desc">Description</Label>
                    <Textarea id="cat-desc" rows={3} value={newCatDesc} onChange={(e) => setNewCatDesc(e.target.value)} required />
                  </div>
                  <DialogFooter className="mt-4">
                    <Button type="submit" disabled={createCat.isPending}>
                      {createCat.isPending ? "Creating..." : "Add Category"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories?.map((cat) => (
              <Card key={cat.id} className="border border-border shadow-sm rounded-xl">
                <CardHeader className="pb-3 flex flex-row items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">{cat.name}</CardTitle>
                    <CardDescription className="text-xs">ID #{cat.id}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{cat.description ?? "No description provided."}</p>
                  <Separator className="my-3" />
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Slug: <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{cat.slug}</code></span>
                    <Badge variant="secondary">{cat.serviceCount} services</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
