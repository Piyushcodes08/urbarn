import { useState } from "react";
import { useSearch, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, CheckCircle, Calendar, MapPin, User, Phone, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import StarRating from "@/components/StarRating";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListServices,
  useCreateBooking,
  getListServicesQueryKey,
  getListBookingsQueryKey,
} from "@workspace/api-client-react";

const STEPS = ["Select Service", "Date & Time", "Your Details", "Confirm"];

export default function BookingNewPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedServiceId = params.get("serviceId") ? Number(params.get("serviceId")) : undefined;

  const [step, setStep] = useState(preselectedServiceId ? 1 : 0);
  const [selectedServiceId, setSelectedServiceId] = useState<number | undefined>(preselectedServiceId);
  const [scheduledAt, setScheduledAt] = useState("");
  const [address, setAddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useListServices(undefined, {
    query: { queryKey: getListServicesQueryKey() },
  });

  const createBooking = useCreateBooking({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        toast({ title: "Booking confirmed!", description: "Your service has been booked successfully." });
        navigate("/bookings");
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create booking. Please try again.", variant: "destructive" });
      },
    },
  });

  const selectedService = services?.find((s) => s.id === selectedServiceId);

  function handleSubmit() {
    if (!selectedServiceId || !scheduledAt || !address || !customerName) return;
    createBooking.mutate({
      data: {
        serviceId: selectedServiceId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        address,
        customerName,
        customerPhone: customerPhone || undefined,
        notes: notes || undefined,
        totalPrice: selectedService?.basePrice ?? 0,
      },
    });
  }

  function canProceed(): boolean {
    if (step === 0) return !!selectedServiceId;
    if (step === 1) return !!scheduledAt;
    if (step === 2) return !!address && !!customerName;
    return true;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Book a Service</h1>
        <p className="text-muted-foreground mt-1">Complete the steps below to schedule your appointment</p>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-1 mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 transition-all ${
              i < step ? "bg-primary border-primary text-primary-foreground" :
              i === step ? "border-primary text-primary bg-primary/10" :
              "border-border text-muted-foreground bg-muted/40"
            }`}>
              {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 ${i < step ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Select Service */}
      {step === 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-5">Select a Service</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services?.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => setSelectedServiceId(svc.id)}
                  data-testid={`select-service-${svc.id}`}
                  className={`text-left rounded-xl border p-4 transition-all ${
                    selectedServiceId === svc.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm text-foreground">{svc.name}</p>
                      {svc.categoryName && <Badge variant="secondary" className="text-xs mt-1">{svc.categoryName}</Badge>}
                    </div>
                    <span className="font-bold text-foreground text-sm flex-shrink-0">₹{svc.basePrice}</span>
                  </div>
                  <StarRating rating={svc.rating} count={svc.reviewCount} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 1: Date & Time */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Choose Date & Time</h2>
          {selectedService && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{selectedService.name}</p>
                <p className="text-sm text-muted-foreground">{selectedService.durationMinutes} minutes</p>
              </div>
              <span className="font-bold text-foreground text-lg">₹{selectedService.basePrice}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="scheduled-at" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Preferred Date & Time
            </Label>
            <Input
              id="scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16)}
              data-testid="input-scheduled-at"
            />
            <p className="text-xs text-muted-foreground">Bookings must be at least 2 hours in advance</p>
          </div>
        </div>
      )}

      {/* Step 2: Your Details */}
      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-foreground mb-2">Your Details</h2>
          <div className="space-y-2">
            <Label htmlFor="customer-name" className="flex items-center gap-2">
              <User className="w-4 h-4" /> Full Name *
            </Label>
            <Input
              id="customer-name"
              placeholder="Your full name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              data-testid="input-customer-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" /> Phone Number
            </Label>
            <Input
              id="customer-phone"
              placeholder="+91 XXXXX XXXXX"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              data-testid="input-customer-phone"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Full Address *
            </Label>
            <Textarea
              id="address"
              placeholder="Flat/House no., Building, Street, City, Pincode"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              data-testid="input-address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> Special Instructions (optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Any specific requirements or instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              data-testid="input-notes"
            />
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && selectedService && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-foreground mb-2">Confirm Your Booking</h2>
          <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
            {[
              { label: "Service", value: selectedService.name, icon: <CheckCircle className="w-4 h-4" /> },
              { label: "Date & Time", value: scheduledAt ? new Date(scheduledAt).toLocaleString() : "", icon: <Calendar className="w-4 h-4" /> },
              { label: "Address", value: address, icon: <MapPin className="w-4 h-4" /> },
              { label: "Name", value: customerName, icon: <User className="w-4 h-4" /> },
              { label: "Phone", value: customerPhone || "Not provided", icon: <Phone className="w-4 h-4" /> },
              ...(notes ? [{ label: "Notes", value: notes, icon: <FileText className="w-4 h-4" /> }] : []),
            ].map((row) => (
              <div key={row.label} className="flex items-start gap-3 p-4">
                <div className="text-muted-foreground mt-0.5">{row.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="text-sm font-medium text-foreground">{row.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center justify-between">
            <span className="font-semibold text-foreground">Total Amount</span>
            <span className="text-2xl font-bold text-foreground">₹{selectedService.basePrice}</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            By booking, you agree to our terms. Free cancellation up to 2 hours before the appointment.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
        {step > 0 ? (
          <Button variant="outline" onClick={() => setStep(step - 1)} data-testid="button-prev-step">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        ) : (
          <div />
        )}

        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} data-testid="button-next-step">
            Next <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={createBooking.isPending} data-testid="button-confirm-booking">
            {createBooking.isPending ? "Booking..." : "Confirm Booking"}
          </Button>
        )}
      </div>
    </div>
  );
}
