import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";
import CategoriesPage from "@/pages/CategoriesPage";
import ServicesPage from "@/pages/ServicesPage";
import ServiceDetailPage from "@/pages/ServiceDetailPage";
import ProfessionalsPage from "@/pages/ProfessionalsPage";
import ProfessionalDetailPage from "@/pages/ProfessionalDetailPage";
import BookingsPage from "@/pages/BookingsPage";
import BookingNewPage from "@/pages/BookingNewPage";
import VendorDashboardPage from "@/pages/VendorDashboardPage";
import AdminPanelPage from "@/pages/AdminPanelPage";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const queryClient = new QueryClient();

function AOSInitializer() {
  const [location] = useLocation();

  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-out-cubic",
      once: true,
      offset: 50,
      delay: 50,
    });
  }, []);

  useEffect(() => {
    // Wait a brief moment for the route components to render, then refresh animations
    const timer = setTimeout(() => {
      AOS.refresh();
    }, 100);
    return () => clearTimeout(timer);
  }, [location]);

  return null;
}

// Dynamic dashboard routing redirector
function DashboardRedirect() {
  const { user, setShowLoginModal, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      setLocation("/");
      setShowLoginModal(true);
    } else if (user.role === "admin") {
      setLocation("/admin");
    } else if (user.role === "vendor") {
      setLocation("/vendor-dashboard");
    } else {
      setLocation("/bookings");
    }
  }, [user, isLoading, setLocation, setShowLoginModal]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/categories" component={CategoriesPage} />
      <Route path="/services" component={ServicesPage} />
      <Route path="/services/:id" component={ServiceDetailPage} />
      <Route path="/professionals" component={ProfessionalsPage} />
      <Route path="/professionals/:id" component={ProfessionalDetailPage} />
      <Route path="/bookings" component={BookingsPage} />
      <Route path="/bookings/new" component={BookingNewPage} />
      <Route path="/vendor-dashboard" component={VendorDashboardPage} />
      <Route path="/admin" component={AdminPanelPage} />
      <Route path="/dashboard" component={DashboardRedirect} />
      <Route component={NotFoundRedirect} />
    </Switch>
  );
}

// Redirect all undefined pages gracefully or show wouter not found
function NotFoundRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    // Redirect unknown routes to home page
    const timer = setTimeout(() => {
      setLocation("/");
    }, 2000);
    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 className="text-2xl font-bold text-foreground">404 - Page Not Found</h2>
      <p className="text-muted-foreground mt-2 text-sm">Redirecting you back to safety...</p>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AOSInitializer />
            <div className="min-h-screen flex flex-col bg-background">
              <Navbar />
              <main className="flex-grow">
                <Router />
              </main>
              <Footer />
            </div>
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
