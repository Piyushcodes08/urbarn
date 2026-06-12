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
import DashboardPage from "@/pages/DashboardPage";
import NotFound from "@/pages/not-found";
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
      <Route path="/dashboard" component={DashboardPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
