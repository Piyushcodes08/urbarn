/**
 * @workspace/api-client-react — Client-side Mock
 *
 * This file replaces the generated React-Query + Express API hooks with
 * pure localStorage-backed equivalents so the app runs completely in the
 * browser with zero backend.
 *
 * When you're ready to connect Firebase (or any real backend), simply:
 *  1. Swap each hook implementation to call your Firebase service.
 *  2. Keep the exported function signatures identical.
 *  3. Remove the seed-data block — Firebase will supply real data.
 */

import { useQuery, useMutation, type UseQueryOptions, type UseMutationOptions } from "@tanstack/react-query";

// ─────────────────────────────────────────────────────────────────────────────
// Types  (mirrors the OpenAPI schema from lib/api-client-react/src/generated)
// ─────────────────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description?: string | null;
  imageUrl?: string | null;
  serviceCount: number;
}

export interface Service {
  id: number;
  categoryId: number;
  categoryName?: string | null;
  name: string;
  description: string;
  basePrice: number;
  durationMinutes: number;
  rating: number;
  reviewCount: number;
  imageUrl: string | null;
  tags?: string | null;
  isFeatured?: boolean;
}

export interface Professional {
  id: number;
  name: string;
  bio: string;
  avatarUrl?: string | null;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  yearsExperience: number;
  isVerified: boolean;
  isAvailable: boolean;
  categoryIds?: string | null;
}

export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";

export const BookingStatus = {
  pending: "pending" as BookingStatus,
  confirmed: "confirmed" as BookingStatus,
  in_progress: "in_progress" as BookingStatus,
  completed: "completed" as BookingStatus,
  cancelled: "cancelled" as BookingStatus,
};

export type ListBookingsStatus = BookingStatus;
export const ListBookingsStatus = BookingStatus;

export interface Booking {
  id: number;
  serviceId: number;
  serviceName: string;
  professionalId: number | null;
  professionalName: string | null;
  scheduledAt: string;
  status: BookingStatus;
  totalPrice: number;
  address: string;
  customerName: string;
  customerPhone?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface BookingInput {
  serviceId: number;
  professionalId?: number;
  scheduledAt: string;
  address: string;
  customerName: string;
  customerPhone?: string;
  notes?: string;
  totalPrice: number;
}

export interface Review {
  id: number;
  serviceId: number;
  serviceName?: string | null;
  professionalId: number;
  professionalName?: string | null;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface DashboardStats {
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalProfessionals: number;
  totalServices: number;
  averageRating: number;
  totalRevenue: number;
}

export interface ServiceStats {
  serviceId: number;
  serviceName: string;
  categoryName?: string | null;
  bookingCount: number;
  revenue: number;
  rating: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────────────────────────────────────

const SEED_CATEGORIES: Category[] = [
  { id: 1, name: "Salon at Home", slug: "salon-at-home", icon: "Scissors", description: "Professional beauty and grooming services at your doorstep.", imageUrl: null, serviceCount: 8 },
  { id: 2, name: "AC Repair", slug: "ac-repair", icon: "Wind", description: "Expert air conditioner installation, service, and repair.", imageUrl: null, serviceCount: 6 },
  { id: 3, name: "Cleaning", slug: "cleaning", icon: "Sparkles", description: "Deep cleaning and sanitization for homes and offices.", imageUrl: null, serviceCount: 7 },
  { id: 4, name: "Electrician", slug: "electrician", icon: "Zap", description: "Licensed electricians for wiring, repairs, and installations.", imageUrl: null, serviceCount: 5 },
  { id: 5, name: "Plumbing", slug: "plumbing", icon: "Droplets", description: "Fast, reliable plumbing services for any issue.", imageUrl: null, serviceCount: 6 },
  { id: 6, name: "Painting", slug: "painting", icon: "PaintBucket", description: "Interior and exterior painting with premium materials.", imageUrl: null, serviceCount: 4 },
  { id: 7, name: "Appliance Repair", slug: "appliance-repair", icon: "Settings", description: "All major home appliance servicing and repair.", imageUrl: null, serviceCount: 9 },
  { id: 8, name: "Pest Control", slug: "pest-control", icon: "Bug", description: "Eco-friendly pest and termite control solutions.", imageUrl: null, serviceCount: 5 },
];

const SEED_SERVICES: Service[] = [
  // Salon at Home
  { id: 1, categoryId: 1, categoryName: "Salon at Home", name: "Women's Haircut & Styling", description: "Professional cut, blow-dry, and styling by certified beauticians. Includes head massage.", basePrice: 499, durationMinutes: 60, rating: 4.8, reviewCount: 1243, imageUrl: null, tags: "haircut,styling,women", isFeatured: true },
  { id: 2, categoryId: 1, categoryName: "Salon at Home", name: "Facial & Cleanup", description: "Deep pore cleansing, exfoliation, and moisturizing facial. Leaves skin glowing.", basePrice: 699, durationMinutes: 75, rating: 4.7, reviewCount: 987, imageUrl: null, tags: "facial,cleanup,skincare", isFeatured: true },
  { id: 3, categoryId: 1, categoryName: "Salon at Home", name: "Manicure & Pedicure", description: "Complete nail care including filing, cuticle work, scrub, massage, and polish.", basePrice: 599, durationMinutes: 90, rating: 4.6, reviewCount: 756, imageUrl: null, tags: "nails,manicure,pedicure", isFeatured: false },
  { id: 4, categoryId: 1, categoryName: "Salon at Home", name: "Full Body Waxing", description: "Smooth and precise waxing using premium wax strips. Minimises skin irritation.", basePrice: 899, durationMinutes: 120, rating: 4.5, reviewCount: 634, imageUrl: null, tags: "waxing,body,hair removal", isFeatured: false },
  // AC Repair
  { id: 5, categoryId: 2, categoryName: "AC Repair", name: "AC Service & Cleaning", description: "Complete AC servicing with filter cleaning, coil wash, gas level check, and performance tuning.", basePrice: 599, durationMinutes: 60, rating: 4.9, reviewCount: 2145, imageUrl: null, tags: "ac,service,cleaning", isFeatured: true },
  { id: 6, categoryId: 2, categoryName: "AC Repair", name: "AC Installation", description: "Professional AC installation with copper piping, drilling, and commissioning. Any brand.", basePrice: 1299, durationMinutes: 120, rating: 4.7, reviewCount: 876, imageUrl: null, tags: "ac,installation,split", isFeatured: false },
  { id: 7, categoryId: 2, categoryName: "AC Repair", name: "AC Gas Refilling", description: "Refrigerant top-up for optimal cooling. Includes leak detection and pressure testing.", basePrice: 799, durationMinutes: 45, rating: 4.6, reviewCount: 543, imageUrl: null, tags: "ac,gas,refrigerant", isFeatured: false },
  // Cleaning
  { id: 8, categoryId: 3, categoryName: "Cleaning", name: "Home Deep Cleaning", description: "Comprehensive 2-5BHK deep cleaning covering kitchen, bathrooms, bedrooms, and living areas.", basePrice: 1999, durationMinutes: 240, rating: 4.8, reviewCount: 1876, imageUrl: null, tags: "cleaning,deep,home", isFeatured: true },
  { id: 9, categoryId: 3, categoryName: "Cleaning", name: "Kitchen Deep Cleaning", description: "Degreasing exhaust, chimney, countertops, cabinets, appliances, and tiles.", basePrice: 999, durationMinutes: 120, rating: 4.7, reviewCount: 1234, imageUrl: null, tags: "kitchen,cleaning,degreasing", isFeatured: true },
  { id: 10, categoryId: 3, categoryName: "Cleaning", name: "Bathroom Cleaning", description: "Scrubbing tiles, disinfecting surfaces, descaling taps, and sanitizing toilets.", basePrice: 499, durationMinutes: 60, rating: 4.6, reviewCount: 987, imageUrl: null, tags: "bathroom,sanitize,descale", isFeatured: false },
  // Electrician
  { id: 11, categoryId: 4, categoryName: "Electrician", name: "Electrical Repair & Wiring", description: "Switch, socket, and wiring repairs. Fault diagnosis and safe rectification.", basePrice: 299, durationMinutes: 60, rating: 4.8, reviewCount: 2341, imageUrl: null, tags: "electrical,wiring,repair", isFeatured: false },
  { id: 12, categoryId: 4, categoryName: "Electrician", name: "Ceiling Fan Installation", description: "Safe installation of ceiling fans with proper earthing and load balancing.", basePrice: 399, durationMinutes: 45, rating: 4.7, reviewCount: 1543, imageUrl: null, tags: "fan,installation,electrical", isFeatured: false },
  // Plumbing
  { id: 13, categoryId: 5, categoryName: "Plumbing", name: "Tap & Pipe Repair", description: "Fix leaking taps, broken pipes, and drainage blockages quickly and cleanly.", basePrice: 349, durationMinutes: 60, rating: 4.7, reviewCount: 1876, imageUrl: null, tags: "plumbing,tap,pipe,leak", isFeatured: false },
  { id: 14, categoryId: 5, categoryName: "Plumbing", name: "Water Heater Installation", description: "Install and commission water heaters (geyser) of any brand safely.", basePrice: 599, durationMinutes: 90, rating: 4.6, reviewCount: 876, imageUrl: null, tags: "geyser,water heater,installation", isFeatured: false },
  // Painting
  { id: 15, categoryId: 6, categoryName: "Painting", name: "Interior Wall Painting", description: "Premium interior painting using Asian Paints / Berger. Includes putty, primer, and two coats.", basePrice: 2499, durationMinutes: 480, rating: 4.8, reviewCount: 654, imageUrl: null, tags: "painting,interior,walls", isFeatured: true },
  // Appliance Repair
  { id: 16, categoryId: 7, categoryName: "Appliance Repair", name: "Washing Machine Repair", description: "Diagnose and fix washing machine faults. Drum, motor, pump, and board repairs.", basePrice: 499, durationMinutes: 90, rating: 4.7, reviewCount: 1123, imageUrl: null, tags: "washing machine,repair,appliance", isFeatured: false },
  { id: 17, categoryId: 7, categoryName: "Appliance Repair", name: "Refrigerator Repair", description: "Cooling issues, compressor checks, gas refill, thermostat, and door seal repairs.", basePrice: 599, durationMinutes: 60, rating: 4.6, reviewCount: 987, imageUrl: null, tags: "refrigerator,fridge,repair", isFeatured: false },
  // Pest Control
  { id: 18, categoryId: 8, categoryName: "Pest Control", name: "General Pest Control", description: "Cockroach, ant, and silverfish treatment using safe, odorless chemicals.", basePrice: 999, durationMinutes: 60, rating: 4.5, reviewCount: 765, imageUrl: null, tags: "pest,cockroach,ant", isFeatured: false },
];

const SEED_PROFESSIONALS: Professional[] = [
  { id: 1, name: "Priya Sharma", bio: "Certified beautician with 8 years of experience in hair styling, facials, and skincare. Trained at VLCC and L'Oreal Academy.", rating: 4.9, reviewCount: 543, completedJobs: 1240, yearsExperience: 8, isVerified: true, isAvailable: true, categoryIds: "1" },
  { id: 2, name: "Rajesh Kumar", bio: "Expert AC technician and appliance repair specialist. Authorized service partner for Samsung, LG, and Daikin.", rating: 4.8, reviewCount: 876, completedJobs: 2341, yearsExperience: 12, isVerified: true, isAvailable: true, categoryIds: "2,7" },
  { id: 3, name: "Sunita Devi", bio: "Professional home cleaner and sanitization specialist. Trained in eco-friendly deep cleaning protocols.", rating: 4.7, reviewCount: 432, completedJobs: 987, yearsExperience: 6, isVerified: true, isAvailable: false, categoryIds: "3" },
  { id: 4, name: "Anil Gupta", bio: "Licensed electrician with expertise in home wiring, panel upgrades, and smart home installations.", rating: 4.8, reviewCount: 765, completedJobs: 1876, yearsExperience: 10, isVerified: true, isAvailable: true, categoryIds: "4" },
  { id: 5, name: "Meena Patel", bio: "Skilled beautician specializing in bridal makeup, mehendi, and skincare treatments. Serving Mumbai for 7 years.", rating: 4.9, reviewCount: 654, completedJobs: 1543, yearsExperience: 7, isVerified: true, isAvailable: true, categoryIds: "1" },
  { id: 6, name: "Vikram Singh", bio: "Master plumber and bathroom renovation expert. Quick turnaround, clean work, and quality materials guaranteed.", rating: 4.7, reviewCount: 543, completedJobs: 1234, yearsExperience: 9, isVerified: true, isAvailable: false, categoryIds: "5" },
  { id: 7, name: "Deepak Nair", bio: "Experienced painter specialized in texture painting, wood polish, and waterproofing. 400+ happy clients.", rating: 4.8, reviewCount: 321, completedJobs: 456, yearsExperience: 11, isVerified: true, isAvailable: true, categoryIds: "6" },
  { id: 8, name: "Kavita Rao", bio: "Certified pest control technician using government-approved, child-safe chemicals. Termite control specialist.", rating: 4.6, reviewCount: 234, completedJobs: 678, yearsExperience: 5, isVerified: true, isAvailable: true, categoryIds: "8" },
];

const SEED_REVIEWS: Review[] = [
  { id: 1, serviceId: 1, serviceName: "Women's Haircut & Styling", professionalId: 1, professionalName: "Priya Sharma", customerName: "Anjali Mehta", rating: 5, comment: "Priya is absolutely amazing! My hair looks gorgeous and she was very professional.", createdAt: "2026-05-15T10:00:00Z" },
  { id: 2, serviceId: 1, serviceName: "Women's Haircut & Styling", professionalId: 5, professionalName: "Meena Patel", customerName: "Ritu Kapoor", rating: 5, comment: "Meena understood exactly what I wanted. Will definitely book again!", createdAt: "2026-05-20T14:00:00Z" },
  { id: 3, serviceId: 5, serviceName: "AC Service & Cleaning", professionalId: 2, professionalName: "Rajesh Kumar", customerName: "Suresh Iyer", rating: 5, comment: "Rajesh serviced my AC thoroughly. Works like new now. Very punctual and professional.", createdAt: "2026-05-22T11:00:00Z" },
  { id: 4, serviceId: 8, serviceName: "Home Deep Cleaning", professionalId: 3, professionalName: "Sunita Devi", customerName: "Pooja Agarwal", rating: 4, comment: "Excellent deep cleaning service. The team was thorough and left the house spotless.", createdAt: "2026-05-18T09:00:00Z" },
  { id: 5, serviceId: 11, serviceName: "Electrical Repair & Wiring", professionalId: 4, professionalName: "Anil Gupta", customerName: "Ramesh Nair", rating: 5, comment: "Fixed a tricky wiring issue quickly and safely. Very knowledgeable.", createdAt: "2026-05-25T16:00:00Z" },
  { id: 6, serviceId: 2, serviceName: "Facial & Cleanup", professionalId: 1, professionalName: "Priya Sharma", customerName: "Neha Singh", rating: 5, comment: "Best facial I've had at home! Priya's technique is fantastic. Skin feels so fresh.", createdAt: "2026-06-01T11:00:00Z" },
  { id: 7, serviceId: 9, serviceName: "Kitchen Deep Cleaning", professionalId: 3, professionalName: "Sunita Devi", customerName: "Archana Pandey", rating: 4, comment: "Kitchen is gleaming! Grease buildup on chimney and stove is completely gone.", createdAt: "2026-06-03T10:00:00Z" },
  { id: 8, serviceId: 15, serviceName: "Interior Wall Painting", professionalId: 7, professionalName: "Deepak Nair", customerName: "Sanjay Malhotra", rating: 5, comment: "Deepak transformed our living room. Clean work, no mess, and finished on time.", createdAt: "2026-06-05T08:00:00Z" },
];

// ─────────────────────────────────────────────────────────────────────────────
// localStorage helpers
// ─────────────────────────────────────────────────────────────────────────────

function getBookings(): Booking[] {
  try {
    return JSON.parse(localStorage.getItem("uc_bookings") || "[]");
  } catch {
    return [];
  }
}

function saveBookings(bookings: Booking[]) {
  localStorage.setItem("uc_bookings", JSON.stringify(bookings));
}

function nextBookingId(): number {
  const bookings = getBookings();
  return bookings.length === 0 ? 1 : Math.max(...bookings.map((b) => b.id)) + 1;
}

function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// Query key generators
// ─────────────────────────────────────────────────────────────────────────────

export const getListCategoriesQueryKey = () => ["categories"] as const;
export const getListServicesQueryKey = (params?: { categoryId?: number; search?: string }) =>
  ["services", params] as const;
export const getListFeaturedServicesQueryKey = () => ["services", "featured"] as const;
export const getGetServiceQueryKey = (id: number) => ["services", id] as const;
export const getListProfessionalsQueryKey = (params?: object) => ["professionals", params] as const;
export const getGetProfessionalQueryKey = (id: number) => ["professionals", id] as const;
export const getListBookingsQueryKey = (params?: object) => ["bookings", params] as const;
export const getListReviewsQueryKey = (params?: { serviceId?: number; professionalId?: number }) =>
  ["reviews", params] as const;
export const getGetDashboardStatsQueryKey = () => ["dashboard", "stats"] as const;
export const getGetRecentBookingsQueryKey = () => ["dashboard", "recent"] as const;
export const getGetTopServicesQueryKey = () => ["dashboard", "top"] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Param types
// ─────────────────────────────────────────────────────────────────────────────

export type ListServicesParams = { categoryId?: number; search?: string };
export type ListProfessionalsParams = { categoryId?: number; serviceId?: number };
export type ListBookingsParams = { status?: ListBookingsStatus };
export type ListReviewsParams = { serviceId?: number; professionalId?: number };

// ─────────────────────────────────────────────────────────────────────────────
// Hook type helpers
// ─────────────────────────────────────────────────────────────────────────────

type QueryOpts<T> = { query?: Partial<UseQueryOptions<T>> };
type MutationOpts<TData, TVariables> = { mutation?: Partial<UseMutationOptions<TData, Error, TVariables>> };

// ─────────────────────────────────────────────────────────────────────────────
// Query hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useListCategories(opts?: QueryOpts<Category[]>) {
  return useQuery<Category[]>({
    queryKey: getListCategoriesQueryKey(),
    queryFn: async () => {
      await delay();
      return SEED_CATEGORIES;
    },
    staleTime: Infinity,
    ...opts?.query,
  });
}

export function useListServices(
  params?: ListServicesParams,
  opts?: QueryOpts<Service[]>
) {
  return useQuery<Service[]>({
    queryKey: getListServicesQueryKey(params),
    queryFn: async () => {
      await delay();
      let results = SEED_SERVICES;
      if (params?.categoryId) {
        results = results.filter((s) => s.categoryId === params.categoryId);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        results = results.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q)
        );
      }
      return results;
    },
    staleTime: Infinity,
    ...opts?.query,
  });
}

export function useListFeaturedServices(opts?: QueryOpts<Service[]>) {
  return useQuery<Service[]>({
    queryKey: getListFeaturedServicesQueryKey(),
    queryFn: async () => {
      await delay();
      return SEED_SERVICES.filter((s) => s.isFeatured).sort((a, b) => b.rating - a.rating);
    },
    staleTime: Infinity,
    ...opts?.query,
  });
}

export function useGetService(id: number, opts?: QueryOpts<Service>) {
  return useQuery<Service>({
    queryKey: getGetServiceQueryKey(id),
    queryFn: async () => {
      await delay();
      const svc = SEED_SERVICES.find((s) => s.id === id);
      if (!svc) throw new Error("Service not found");
      return svc;
    },
    enabled: !!id,
    staleTime: Infinity,
    ...opts?.query,
  });
}

export function useListProfessionals(
  params?: ListProfessionalsParams,
  opts?: QueryOpts<Professional[]>
) {
  return useQuery<Professional[]>({
    queryKey: getListProfessionalsQueryKey(params),
    queryFn: async () => {
      await delay();
      return SEED_PROFESSIONALS;
    },
    staleTime: Infinity,
    ...opts?.query,
  });
}

export function useGetProfessional(id: number, opts?: QueryOpts<Professional>) {
  return useQuery<Professional>({
    queryKey: getGetProfessionalQueryKey(id),
    queryFn: async () => {
      await delay();
      const pro = SEED_PROFESSIONALS.find((p) => p.id === id);
      if (!pro) throw new Error("Professional not found");
      return pro;
    },
    enabled: !!id,
    staleTime: Infinity,
    ...opts?.query,
  });
}

export function useListBookings(
  params?: ListBookingsParams,
  opts?: QueryOpts<Booking[]>
) {
  return useQuery<Booking[]>({
    queryKey: getListBookingsQueryKey(params),
    queryFn: async () => {
      await delay();
      let bookings = getBookings();
      if (params?.status) {
        bookings = bookings.filter((b) => b.status === params.status);
      }
      return bookings.sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
    },
    ...opts?.query,
  });
}

export function useListReviews(
  params?: ListReviewsParams,
  opts?: QueryOpts<Review[]>
) {
  return useQuery<Review[]>({
    queryKey: getListReviewsQueryKey(params),
    queryFn: async () => {
      await delay();
      let reviews = SEED_REVIEWS;
      if (params?.serviceId) {
        reviews = reviews.filter((r) => r.serviceId === params.serviceId);
      }
      if (params?.professionalId) {
        reviews = reviews.filter((r) => r.professionalId === params.professionalId);
      }
      return reviews;
    },
    staleTime: Infinity,
    ...opts?.query,
  });
}

export function useGetDashboardStats(opts?: QueryOpts<DashboardStats>) {
  return useQuery<DashboardStats>({
    queryKey: getGetDashboardStatsQueryKey(),
    queryFn: async () => {
      await delay();
      const bookings = getBookings();
      const completed = bookings.filter((b) => b.status === "completed");
      const pending = bookings.filter((b) => b.status === "pending");
      const cancelled = bookings.filter((b) => b.status === "cancelled");
      const revenue = completed.reduce((sum, b) => sum + b.totalPrice, 0);
      const avgRating =
        SEED_PROFESSIONALS.reduce((sum, p) => sum + p.rating, 0) /
        SEED_PROFESSIONALS.length;
      return {
        totalBookings: bookings.length,
        completedBookings: completed.length,
        pendingBookings: pending.length,
        cancelledBookings: cancelled.length,
        totalProfessionals: SEED_PROFESSIONALS.length,
        totalServices: SEED_SERVICES.length,
        averageRating: parseFloat(avgRating.toFixed(2)),
        totalRevenue: revenue,
      };
    },
    ...opts?.query,
  });
}

export function useGetRecentBookings(opts?: QueryOpts<Booking[]>) {
  return useQuery<Booking[]>({
    queryKey: getGetRecentBookingsQueryKey(),
    queryFn: async () => {
      await delay();
      return getBookings()
        .sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
        )
        .slice(0, 10);
    },
    ...opts?.query,
  });
}

export function useGetTopServices(opts?: QueryOpts<ServiceStats[]>) {
  return useQuery<ServiceStats[]>({
    queryKey: getGetTopServicesQueryKey(),
    queryFn: async () => {
      await delay();
      const bookings = getBookings();
      const countMap: Record<number, number> = {};
      bookings.forEach((b) => {
        countMap[b.serviceId] = (countMap[b.serviceId] ?? 0) + 1;
      });
      // Add some demo top-service data seeded from SEED_SERVICES
      const topSeed: ServiceStats[] = SEED_SERVICES.slice(0, 5).map((s, i) => ({
        serviceId: s.id,
        serviceName: s.name,
        categoryName: s.categoryName,
        bookingCount: (countMap[s.id] ?? 0) + (40 - i * 7),
        revenue: (s.basePrice * ((countMap[s.id] ?? 0) + (40 - i * 7))),
        rating: s.rating,
      }));
      return topSeed.sort((a, b) => b.bookingCount - a.bookingCount);
    },
    ...opts?.query,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useCreateBooking(
  opts?: MutationOpts<Booking, { data: BookingInput }>
) {
  return useMutation<Booking, Error, { data: BookingInput }>({
    mutationFn: async ({ data }) => {
      await delay(400);
      const service = SEED_SERVICES.find((s) => s.id === data.serviceId);
      const professional = data.professionalId
        ? SEED_PROFESSIONALS.find((p) => p.id === data.professionalId)
        : SEED_PROFESSIONALS.find((p) => p.isAvailable);

      const booking: Booking = {
        id: nextBookingId(),
        serviceId: data.serviceId,
        serviceName: service?.name ?? "Unknown Service",
        professionalId: professional?.id ?? null,
        professionalName: professional?.name ?? null,
        scheduledAt: data.scheduledAt,
        status: "pending",
        totalPrice: data.totalPrice,
        address: data.address,
        customerName: data.customerName,
        customerPhone: data.customerPhone ?? null,
        notes: data.notes ?? null,
        createdAt: new Date().toISOString(),
      };
      const bookings = getBookings();
      bookings.push(booking);
      saveBookings(bookings);
      return booking;
    },
    ...opts?.mutation,
  });
}

export function useCancelBooking(
  opts?: MutationOpts<Booking, { id: number }>
) {
  return useMutation<Booking, Error, { id: number }>({
    mutationFn: async ({ id }) => {
      await delay(300);
      const bookings = getBookings();
      const idx = bookings.findIndex((b) => b.id === id);
      if (idx === -1) throw new Error("Booking not found");
      bookings[idx].status = "cancelled";
      saveBookings(bookings);
      return bookings[idx];
    },
    ...opts?.mutation,
  });
}
