/**
 * @workspace/api-client-react — Firebase Client Implementation
 *
 * This file replaces the local storage backed API hooks with Cloud Firestore
 * client calls, maintaining the identical query and mutation hook shapes.
 */

import { useQuery, useMutation, type UseQueryOptions, type UseMutationOptions } from "@tanstack/react-query";
import { db, isConfigured } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where
} from "firebase/firestore";

// ─────────────────────────────────────────────────────────────────────────────
// Types
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
  serviceIds?: string | null;
  servicePrices?: Record<string, number> | null;
  serviceDurations?: Record<string, number> | null;
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
// Seed data defaults for fallback and initial populating
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
  { id: 1, categoryId: 1, categoryName: "Salon at Home", name: "Women's Haircut & Styling", description: "Professional cut, blow-dry, and styling by certified beauticians. Includes head massage.", basePrice: 499, durationMinutes: 60, rating: 4.8, reviewCount: 1243, imageUrl: null, tags: "haircut,styling,women", isFeatured: true },
  { id: 2, categoryId: 1, categoryName: "Salon at Home", name: "Facial & Cleanup", description: "Deep pore cleansing, exfoliation, and moisturizing facial. Leaves skin glowing.", basePrice: 699, durationMinutes: 75, rating: 4.7, reviewCount: 987, imageUrl: null, tags: "facial,cleanup,skincare", isFeatured: true },
  { id: 3, categoryId: 1, categoryName: "Salon at Home", name: "Manicure & Pedicure", description: "Complete nail care including filing, cuticle work, scrub, massage, and polish.", basePrice: 599, durationMinutes: 90, rating: 4.6, reviewCount: 756, imageUrl: null, tags: "nails,manicure,pedicure", isFeatured: false },
  { id: 4, categoryId: 1, categoryName: "Salon at Home", name: "Full Body Waxing", description: "Smooth and precise waxing using premium wax strips. Minimises skin irritation.", basePrice: 899, durationMinutes: 120, rating: 4.5, reviewCount: 634, imageUrl: null, tags: "waxing,body,hair removal", isFeatured: false },
  { id: 5, categoryId: 2, categoryName: "AC Repair", name: "AC Service & Cleaning", description: "Complete AC servicing with filter cleaning, coil wash, gas level check, and performance tuning.", basePrice: 599, durationMinutes: 60, rating: 4.9, reviewCount: 2145, imageUrl: null, tags: "ac,service,cleaning", isFeatured: true },
  { id: 6, categoryId: 2, categoryName: "AC Repair", name: "AC Installation", description: "Professional AC installation with copper piping, drilling, and commissioning. Any brand.", basePrice: 1299, durationMinutes: 120, rating: 4.7, reviewCount: 876, imageUrl: null, tags: "ac,installation,split", isFeatured: false },
  { id: 7, categoryId: 2, categoryName: "AC Repair", name: "AC Gas Refilling", description: "Refrigerant top-up for optimal cooling. Includes leak detection and pressure testing.", basePrice: 799, durationMinutes: 45, rating: 4.6, reviewCount: 543, imageUrl: null, tags: "ac,gas,refrigerant", isFeatured: false },
  { id: 8, categoryId: 3, categoryName: "Cleaning", name: "Home Deep Cleaning", description: "Comprehensive 2-5BHK deep cleaning covering kitchen, bathrooms, bedrooms, and living areas.", basePrice: 1999, durationMinutes: 240, rating: 4.8, reviewCount: 1876, imageUrl: null, tags: "cleaning,deep,home", isFeatured: true },
  { id: 9, categoryId: 3, categoryName: "Cleaning", name: "Kitchen Deep Cleaning", description: "Degreasing exhaust, chimney, countertops, cabinets, appliances, and tiles.", basePrice: 999, durationMinutes: 120, rating: 4.7, reviewCount: 1234, imageUrl: null, tags: "kitchen,cleaning,degreasing", isFeatured: true },
  { id: 10, categoryId: 3, categoryName: "Cleaning", name: "Bathroom Cleaning", description: "Scrubbing tiles, disinfecting surfaces, descaling taps, and sanitizing toilets.", basePrice: 499, durationMinutes: 60, rating: 4.6, reviewCount: 987, imageUrl: null, tags: "bathroom,sanitize,descale", isFeatured: false },
  { id: 11, categoryId: 4, categoryName: "Electrician", name: "Electrical Repair & Wiring", description: "Switch, socket, and wiring repairs. Fault diagnosis and safe rectification.", basePrice: 299, durationMinutes: 60, rating: 4.8, reviewCount: 2341, imageUrl: null, tags: "electrical,wiring,repair", isFeatured: false },
  { id: 12, categoryId: 4, categoryName: "Electrician", name: "Ceiling Fan Installation", description: "Safe installation of ceiling fans with proper earthing and load balancing.", basePrice: 399, durationMinutes: 45, rating: 4.7, reviewCount: 1543, imageUrl: null, tags: "fan,installation,electrical", isFeatured: false },
  { id: 13, categoryId: 5, categoryName: "Plumbing", name: "Tap & Pipe Repair", description: "Fix leaking taps, broken pipes, and drainage blockages quickly and cleanly.", basePrice: 349, durationMinutes: 60, rating: 4.7, reviewCount: 1876, imageUrl: null, tags: "plumbing,tap,pipe,leak", isFeatured: false },
  { id: 14, categoryId: 5, categoryName: "Plumbing", name: "Water Heater Installation", description: "Install and commission water heaters (geyser) of any brand safely.", basePrice: 599, durationMinutes: 90, rating: 4.6, reviewCount: 876, imageUrl: null, tags: "geyser,water heater,installation", isFeatured: false },
  { id: 15, categoryId: 6, categoryName: "Painting", name: "Interior Wall Painting", description: "Premium interior painting using Asian Paints / Berger. Includes putty, primer, and two coats.", basePrice: 2499, durationMinutes: 480, rating: 4.8, reviewCount: 654, imageUrl: null, tags: "painting,interior,walls", isFeatured: true },
  { id: 16, categoryId: 7, categoryName: "Appliance Repair", name: "Washing Machine Repair", description: "Diagnose and fix washing machine faults. Drum, motor, pump, and board repairs.", basePrice: 499, durationMinutes: 90, rating: 4.7, reviewCount: 1123, imageUrl: null, tags: "washing machine,repair,appliance", isFeatured: false },
  { id: 17, categoryId: 7, categoryName: "Appliance Repair", name: "Refrigerator Repair", description: "Cooling issues, compressor checks, gas refill, thermostat, and door seal repairs.", basePrice: 599, durationMinutes: 60, rating: 4.6, reviewCount: 987, imageUrl: null, tags: "refrigerator,fridge,repair", isFeatured: false },
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
// Offline / Unconfigured fallback variables (No localStorage!)
// ─────────────────────────────────────────────────────────────────────────────

let fallbackCategories: Category[] = [...SEED_CATEGORIES];
let fallbackServices: Service[] = [...SEED_SERVICES];
let fallbackProfessionals: Professional[] = [...SEED_PROFESSIONALS];
let fallbackReviews: Review[] = [...SEED_REVIEWS];
let fallbackBookings: Booking[] = [];

// ─────────────────────────────────────────────────────────────────────────────
// Firestore Auto-Seeding Singleton Promise
// ─────────────────────────────────────────────────────────────────────────────

let seedingPromise: Promise<void> | null = null;

async function ensureSeeded(): Promise<void> {
  if (!isConfigured) return;

  try {
    const categoriesCollection = collection(db, "categories");
    const snap = await getDocs(categoriesCollection);

    if (snap.empty) {
      console.log("[Firebase Seeding] Firestore is empty. Initializing with default seed data...");
      const batch = writeBatch(db);

      // Seed categories
      SEED_CATEGORIES.forEach((cat) => {
        batch.set(doc(db, "categories", String(cat.id)), cat);
      });

      // Seed services
      SEED_SERVICES.forEach((svc) => {
        batch.set(doc(db, "services", String(svc.id)), svc);
      });

      // Seed professionals
      SEED_PROFESSIONALS.forEach((pro) => {
        batch.set(doc(db, "professionals", String(pro.id)), pro);
      });

      // Seed reviews
      SEED_REVIEWS.forEach((rev) => {
        batch.set(doc(db, "reviews", String(rev.id)), rev);
      });

      await batch.commit();
      console.log("[Firebase Seeding] Database successfully seeded.");
    }
  } catch (error) {
    console.error("[Firebase Seeding] Error seeding default data:", error);
  }
}

function checkAndSeed(): Promise<void> {
  if (!seedingPromise) {
    seedingPromise = ensureSeeded();
  }
  return seedingPromise;
}

// Helper delay to mimic latency in fallback mode
function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// Query Keys
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
export type ListBookingsParams = { 
  status?: ListBookingsStatus; 
  professionalId?: number; 
  customerName?: string;
};
export type ListReviewsParams = { serviceId?: number; professionalId?: number };

// ─────────────────────────────────────────────────────────────────────────────
// Hook type helpers
// ─────────────────────────────────────────────────────────────────────────────

type QueryOpts<T> = { query?: Partial<UseQueryOptions<T>> };
type MutationOpts<TData, TVariables> = { mutation?: Partial<UseMutationOptions<TData, Error, TVariables>> };

// ─────────────────────────────────────────────────────────────────────────────
// Query Hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useListCategories(opts?: QueryOpts<Category[]>) {
  return useQuery<Category[]>({
    queryKey: getListCategoriesQueryKey(),
    queryFn: async () => {
      if (!isConfigured) {
        await delay();
        return fallbackCategories;
      }
      await checkAndSeed();
      const snap = await getDocs(collection(db, "categories"));
      return snap.docs.map((d) => d.data() as Category);
    },
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
      let results: Service[] = [];
      if (!isConfigured) {
        await delay();
        results = fallbackServices;
      } else {
        await checkAndSeed();
        const snap = await getDocs(collection(db, "services"));
        results = snap.docs.map((d) => d.data() as Service);
      }

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
    ...opts?.query,
  });
}

export function useListFeaturedServices(opts?: QueryOpts<Service[]>) {
  return useQuery<Service[]>({
    queryKey: getListFeaturedServicesQueryKey(),
    queryFn: async () => {
      let results: Service[] = [];
      if (!isConfigured) {
        await delay();
        results = fallbackServices;
      } else {
        await checkAndSeed();
        const snap = await getDocs(collection(db, "services"));
        results = snap.docs.map((d) => d.data() as Service);
      }
      return results.filter((s) => s.isFeatured).sort((a, b) => b.rating - a.rating);
    },
    ...opts?.query,
  });
}

export function useGetService(id: number, opts?: QueryOpts<Service>) {
  return useQuery<Service>({
    queryKey: getGetServiceQueryKey(id),
    queryFn: async () => {
      if (!isConfigured) {
        await delay();
        const svc = fallbackServices.find((s) => s.id === id);
        if (!svc) throw new Error("Service not found");
        return svc;
      }
      await checkAndSeed();
      const docSnap = await getDoc(doc(db, "services", String(id)));
      if (!docSnap.exists()) throw new Error("Service not found");
      return docSnap.data() as Service;
    },
    enabled: !!id,
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
      let pros: Professional[] = [];
      if (!isConfigured) {
        await delay();
        pros = fallbackProfessionals;
      } else {
        await checkAndSeed();
        const snap = await getDocs(collection(db, "professionals"));
        pros = snap.docs.map((d) => d.data() as Professional);
      }

      if (params?.categoryId) {
        const catIdStr = String(params.categoryId);
        pros = pros.filter((p) => p.categoryIds?.split(",").includes(catIdStr));
      }
      if (params?.serviceId) {
        const serviceIdStr = String(params.serviceId);
        pros = pros.filter((p) => !p.serviceIds || p.serviceIds.split(",").includes(serviceIdStr));
      }
      return pros;
    },
    ...opts?.query,
  });
}

export function useGetProfessional(id: number, opts?: QueryOpts<Professional>) {
  return useQuery<Professional>({
    queryKey: getGetProfessionalQueryKey(id),
    queryFn: async () => {
      if (!isConfigured) {
        await delay();
        const pro = fallbackProfessionals.find((p) => p.id === id);
        if (!pro) throw new Error("Professional not found");
        return pro;
      }
      await checkAndSeed();
      const docSnap = await getDoc(doc(db, "professionals", String(id)));
      if (!docSnap.exists()) throw new Error("Professional not found");
      return docSnap.data() as Professional;
    },
    enabled: !!id,
    ...opts?.query,
  });
}

export function useListBookings(
  params?: ListBookingsParams,
  opts?: QueryOpts<Booking[]>
) {
  return useQuery<Booking[]>({
    queryKey: getListBookingsQueryKey(params || {}),
    queryFn: async () => {
      let bookings: Booking[] = [];
      if (!isConfigured) {
        await delay();
        bookings = fallbackBookings;
      } else {
        await checkAndSeed();
        const snap = await getDocs(collection(db, "bookings"));
        bookings = snap.docs.map((d) => d.data() as Booking);
      }

      if (params?.status) {
        bookings = bookings.filter((b) => b.status === params.status);
      }
      if (params?.professionalId !== undefined) {
        bookings = bookings.filter((b) => b.professionalId === params.professionalId);
      }
      if (params?.customerName) {
        const q = params.customerName.toLowerCase();
        bookings = bookings.filter((b) => b.customerName.toLowerCase().includes(q));
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
      let reviews: Review[] = [];
      if (!isConfigured) {
        await delay();
        reviews = fallbackReviews;
      } else {
        await checkAndSeed();
        const snap = await getDocs(collection(db, "reviews"));
        reviews = snap.docs.map((d) => d.data() as Review);
      }

      if (params?.serviceId) {
        reviews = reviews.filter((r) => r.serviceId === params.serviceId);
      }
      if (params?.professionalId) {
        reviews = reviews.filter((r) => r.professionalId === params.professionalId);
      }
      return reviews;
    },
    ...opts?.query,
  });
}

export function useGetDashboardStats(opts?: QueryOpts<DashboardStats>) {
  return useQuery<DashboardStats>({
    queryKey: getGetDashboardStatsQueryKey(),
    queryFn: async () => {
      let bookings: Booking[] = [];
      let pros: Professional[] = [];
      let svcs: Service[] = [];

      if (!isConfigured) {
        await delay();
        bookings = fallbackBookings;
        pros = fallbackProfessionals;
        svcs = fallbackServices;
      } else {
        await checkAndSeed();
        const bookingsSnap = await getDocs(collection(db, "bookings"));
        bookings = bookingsSnap.docs.map((d) => d.data() as Booking);
        const prosSnap = await getDocs(collection(db, "professionals"));
        pros = prosSnap.docs.map((d) => d.data() as Professional);
        const svcsSnap = await getDocs(collection(db, "services"));
        svcs = svcsSnap.docs.map((d) => d.data() as Service);
      }

      const completed = bookings.filter((b) => b.status === "completed");
      const pending = bookings.filter((b) => b.status === "pending");
      const cancelled = bookings.filter((b) => b.status === "cancelled");
      const revenue = completed.reduce((sum, b) => sum + b.totalPrice, 0);
      const avgRating =
        pros.reduce((sum, p) => sum + p.rating, 0) /
        (pros.length || 1);
      return {
        totalBookings: bookings.length,
        completedBookings: completed.length,
        pendingBookings: pending.length,
        cancelledBookings: cancelled.length,
        totalProfessionals: pros.length,
        totalServices: svcs.length,
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
      let bookings: Booking[] = [];
      if (!isConfigured) {
        await delay();
        bookings = fallbackBookings;
      } else {
        await checkAndSeed();
        const snap = await getDocs(collection(db, "bookings"));
        bookings = snap.docs.map((d) => d.data() as Booking);
      }
      return bookings
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
      let bookings: Booking[] = [];
      let svcs: Service[] = [];

      if (!isConfigured) {
        await delay();
        bookings = fallbackBookings;
        svcs = fallbackServices;
      } else {
        await checkAndSeed();
        const bookingsSnap = await getDocs(collection(db, "bookings"));
        bookings = bookingsSnap.docs.map((d) => d.data() as Booking);
        const svcsSnap = await getDocs(collection(db, "services"));
        svcs = svcsSnap.docs.map((d) => d.data() as Service);
      }

      const countMap: Record<number, number> = {};
      bookings.forEach((b) => {
        countMap[b.serviceId] = (countMap[b.serviceId] ?? 0) + 1;
      });
      const topSeed: ServiceStats[] = svcs.slice(0, 5).map((s, i) => ({
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
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useCreateBooking(
  opts?: MutationOpts<Booking, { data: BookingInput }>
) {
  return useMutation<Booking, Error, { data: BookingInput }>({
    mutationFn: async ({ data }) => {
      let services: Service[] = [];
      let professionals: Professional[] = [];
      let bookings: Booking[] = [];

      if (!isConfigured) {
        await delay(300);
        services = fallbackServices;
        professionals = fallbackProfessionals;
        bookings = fallbackBookings;
      } else {
        await checkAndSeed();
        const svcsSnap = await getDocs(collection(db, "services"));
        services = svcsSnap.docs.map((d) => d.data() as Service);
        const prosSnap = await getDocs(collection(db, "professionals"));
        professionals = prosSnap.docs.map((d) => d.data() as Professional);
        const bookingsSnap = await getDocs(collection(db, "bookings"));
        bookings = bookingsSnap.docs.map((d) => d.data() as Booking);
      }

      const service = services.find((s) => s.id === data.serviceId);
      const professional = data.professionalId
        ? professionals.find((p) => p.id === data.professionalId)
        : professionals.find(
            (p) =>
              p.isAvailable &&
              (!p.serviceIds || p.serviceIds.split(",").includes(String(data.serviceId)))
          );

      const nextId = bookings.length === 0 ? 1 : Math.max(...bookings.map((b) => b.id)) + 1;

      const booking: Booking = {
        id: nextId,
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

      if (!isConfigured) {
        fallbackBookings.push(booking);
      } else {
        await setDoc(doc(db, "bookings", String(nextId)), booking);
      }
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
      if (!isConfigured) {
        await delay(200);
        const idx = fallbackBookings.findIndex((b) => b.id === id);
        if (idx === -1) throw new Error("Booking not found");
        fallbackBookings[idx].status = "cancelled";
        return fallbackBookings[idx];
      }
      await checkAndSeed();
      const docRef = doc(db, "bookings", String(id));
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error("Booking not found");
      const booking = docSnap.data() as Booking;
      booking.status = "cancelled";
      await updateDoc(docRef, { status: "cancelled" });
      return booking;
    },
    ...opts?.mutation,
  });
}

export function useUpdateBookingStatus(
  opts?: MutationOpts<Booking, { id: number; status: BookingStatus }>
) {
  return useMutation<Booking, Error, { id: number; status: BookingStatus }>({
    mutationFn: async ({ id, status }) => {
      if (!isConfigured) {
        await delay(200);
        const idx = fallbackBookings.findIndex((b) => b.id === id);
        if (idx === -1) throw new Error("Booking not found");
        fallbackBookings[idx].status = status;
        return fallbackBookings[idx];
      }
      await checkAndSeed();
      const docRef = doc(db, "bookings", String(id));
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error("Booking not found");
      const booking = docSnap.data() as Booking;
      booking.status = status;
      await updateDoc(docRef, { status });
      return booking;
    },
    ...opts?.mutation,
  });
}

// Service Admin Mutations
export function useCreateService(
  opts?: MutationOpts<Service, { data: Omit<Service, "id" | "reviewCount" | "rating"> }>
) {
  return useMutation<Service, Error, { data: Omit<Service, "id" | "reviewCount" | "rating"> }>({
    mutationFn: async ({ data }) => {
      let nextId = 1;
      let catName = "Unknown";

      if (!isConfigured) {
        await delay(200);
        nextId = fallbackServices.length === 0 ? 1 : Math.max(...fallbackServices.map((s) => s.id)) + 1;
        const cat = fallbackCategories.find((c) => c.id === data.categoryId);
        catName = cat?.name ?? "Unknown";
      } else {
        await checkAndSeed();
        const svcsSnap = await getDocs(collection(db, "services"));
        const svcs = svcsSnap.docs.map((d) => d.data() as Service);
        nextId = svcs.length === 0 ? 1 : Math.max(...svcs.map((s) => s.id)) + 1;

        const catSnap = await getDoc(doc(db, "categories", String(data.categoryId)));
        if (catSnap.exists()) {
          catName = (catSnap.data() as Category).name;
        }
      }

      const newService: Service = {
        ...data,
        id: nextId,
        categoryName: catName,
        rating: 5.0,
        reviewCount: 0,
        imageUrl: data.imageUrl ?? null,
      };

      if (!isConfigured) {
        fallbackServices.push(newService);
      } else {
        await setDoc(doc(db, "services", String(nextId)), newService);
      }
      return newService;
    },
    ...opts?.mutation,
  });
}

export function useUpdateService(
  opts?: MutationOpts<Service, { id: number; data: Partial<Service> }>
) {
  return useMutation<Service, Error, { id: number; data: Partial<Service> }>({
    mutationFn: async ({ id, data }) => {
      if (!isConfigured) {
        await delay(200);
        const idx = fallbackServices.findIndex((s) => s.id === id);
        if (idx === -1) throw new Error("Service not found");
        fallbackServices[idx] = { ...fallbackServices[idx], ...data };
        return fallbackServices[idx];
      }
      await checkAndSeed();
      const docRef = doc(db, "services", String(id));
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error("Service not found");
      const service = docSnap.data() as Service;
      const updated = { ...service, ...data };
      await updateDoc(docRef, data);
      return updated;
    },
    ...opts?.mutation,
  });
}

export function useDeleteService(
  opts?: MutationOpts<boolean, { id: number }>
) {
  return useMutation<boolean, Error, { id: number }>({
    mutationFn: async ({ id }) => {
      if (!isConfigured) {
        await delay(200);
        fallbackServices = fallbackServices.filter((s) => s.id !== id);
        return true;
      }
      await checkAndSeed();
      await deleteDoc(doc(db, "services", String(id)));
      return true;
    },
    ...opts?.mutation,
  });
}

// Professional Admin / Vendor Mutations
export function useCreateProfessional(
  opts?: MutationOpts<Professional, { data: Omit<Professional, "id" | "completedJobs" | "rating" | "reviewCount"> }>
) {
  return useMutation<Professional, Error, { data: Omit<Professional, "id" | "completedJobs" | "rating" | "reviewCount"> }>({
    mutationFn: async ({ data }) => {
      let nextId = 1;
      if (!isConfigured) {
        await delay(200);
        nextId = fallbackProfessionals.length === 0 ? 1 : Math.max(...fallbackProfessionals.map((p) => p.id)) + 1;
      } else {
        await checkAndSeed();
        const snap = await getDocs(collection(db, "professionals"));
        const pros = snap.docs.map((d) => d.data() as Professional);
        nextId = pros.length === 0 ? 1 : Math.max(...pros.map((p) => p.id)) + 1;
      }

      const newPro: Professional = {
        ...data,
        id: nextId,
        rating: 5.0,
        reviewCount: 0,
        completedJobs: 0,
        avatarUrl: data.avatarUrl ?? null,
      };

      if (!isConfigured) {
        fallbackProfessionals.push(newPro);
      } else {
        await setDoc(doc(db, "professionals", String(nextId)), newPro);
      }
      return newPro;
    },
    ...opts?.mutation,
  });
}

export function useUpdateProfessional(
  opts?: MutationOpts<Professional, { id: number; data: Partial<Professional> }>
) {
  return useMutation<Professional, Error, { id: number; data: Partial<Professional> }>({
    mutationFn: async ({ id, data }) => {
      if (!isConfigured) {
        await delay(200);
        const idx = fallbackProfessionals.findIndex((p) => p.id === id);
        if (idx === -1) throw new Error("Professional not found");
        fallbackProfessionals[idx] = { ...fallbackProfessionals[idx], ...data };
        return fallbackProfessionals[idx];
      }
      await checkAndSeed();
      const docRef = doc(db, "professionals", String(id));
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error("Professional not found");
      const pro = docSnap.data() as Professional;
      const updated = { ...pro, ...data };
      await updateDoc(docRef, data);
      return updated;
    },
    ...opts?.mutation,
  });
}

// Category Admin Mutations
export function useCreateCategory(
  opts?: MutationOpts<Category, { data: Omit<Category, "id" | "serviceCount"> }>
) {
  return useMutation<Category, Error, { data: Omit<Category, "id" | "serviceCount"> }>({
    mutationFn: async ({ data }) => {
      let nextId = 1;
      if (!isConfigured) {
        await delay(200);
        nextId = fallbackCategories.length === 0 ? 1 : Math.max(...fallbackCategories.map((c) => c.id)) + 1;
      } else {
        await checkAndSeed();
        const catsSnap = await getDocs(collection(db, "categories"));
        const cats = catsSnap.docs.map((d) => d.data() as Category);
        nextId = cats.length === 0 ? 1 : Math.max(...cats.map((c) => c.id)) + 1;
      }

      const newCat: Category = {
        ...data,
        id: nextId,
        serviceCount: 0,
        imageUrl: data.imageUrl ?? null,
      };

      if (!isConfigured) {
        fallbackCategories.push(newCat);
      } else {
        await setDoc(doc(db, "categories", String(nextId)), newCat);
      }
      return newCat;
    },
    ...opts?.mutation,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Real Vendor Management Hooks (Admin Board approvals)
// ─────────────────────────────────────────────────────────────────────────────

export interface UserDoc {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "vendor" | "admin";
  status?: "pending" | "approved" | "rejected";
  serviceCategory?: string;
  experience?: string;
  city?: string;
  address?: string;
  businessName?: string;
  idProof?: string;
  professionalId?: number;
  createdAt?: any;
}

export function useListVendors(opts?: QueryOpts<UserDoc[]>) {
  return useQuery<UserDoc[]>({
    queryKey: ["vendors-list"],
    queryFn: async () => {
      if (!isConfigured) return [];
      const q = query(collection(db, "users"), where("role", "==", "vendor"));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as UserDoc);
    },
    ...opts?.query,
  });
}

const CATEGORY_MAP: Record<string, string> = {
  "Salon at Home": "1",
  "AC Repair": "2",
  "Cleaning": "3",
  "Electrician": "4",
  "Plumbing": "5",
  "Painting": "6",
  "Appliance Repair": "7",
  "Pest Control": "8",
  "Beauty Services": "1",
  "Carpenter": "7",
};

export function useApproveVendor(
  opts?: MutationOpts<boolean, { vendor: UserDoc }>
) {
  return useMutation<boolean, Error, { vendor: UserDoc }>({
    mutationFn: async ({ vendor }) => {
      if (!isConfigured) return false;

      // 1. Get next numeric ID for professional record
      const prosSnap = await getDocs(collection(db, "professionals"));
      const pros = prosSnap.docs.map((d) => d.data() as Professional);
      const nextId = pros.length === 0 ? 1 : Math.max(...pros.map((p) => p.id)) + 1;

      // 2. Create the professional profile
      const newPro: Professional = {
        id: nextId,
        name: vendor.name,
        bio: `${vendor.businessName || vendor.name} - Professional ${vendor.serviceCategory || "home"} services in ${vendor.city || "Mumbai"}.`,
        rating: 5.0,
        reviewCount: 0,
        completedJobs: 0,
        yearsExperience: parseInt(vendor.experience || "0"),
        isVerified: true,
        isAvailable: true,
        categoryIds: CATEGORY_MAP[vendor.serviceCategory || ""] || "1",
        avatarUrl: null,
      };
      
      await setDoc(doc(db, "professionals", String(nextId)), newPro);

      // 3. Update status in users collection
      const userRef = doc(db, "users", vendor.uid);
      await updateDoc(userRef, {
        status: "approved",
        professionalId: nextId,
      });

      return true;
    },
    ...opts?.mutation,
  });
}

export function useRejectVendor(
  opts?: MutationOpts<boolean, { uid: string }>
) {
  return useMutation<boolean, Error, { uid: string }>({
    mutationFn: async ({ uid }) => {
      if (!isConfigured) return false;
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        status: "rejected",
      });
      return true;
    },
    ...opts?.mutation,
  });
}

