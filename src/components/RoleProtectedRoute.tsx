import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, type UserRole, type VendorData } from "@/hooks/use-auth";
import { Clock, XCircle, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  /** Roles allowed to access this route */
  allowedRoles: UserRole[];
}

/**
 * Guards a route by role.
 * - If not logged in → redirect to /login
 * - If logged in but wrong role → redirect to /unauthorized
 * - If vendor with status "pending" → show pending message
 * - If vendor with status "rejected" → show rejected message
 * - Otherwise → render children
 */
export default function RoleProtectedRoute({
  children,
  allowedRoles,
}: RoleProtectedRouteProps) {
  const { user, userData, isLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      setLocation("/login");
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      setLocation("/unauthorized");
    }
  }, [user, userData, isLoading, allowedRoles, setLocation]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground font-medium">Verifying access…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Vendor status checks
  if (user.role === "vendor" && allowedRoles.includes("vendor")) {
    const vendorData = userData as VendorData | null;
    const status = vendorData?.status;

    if (status === "pending") {
      return (
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="max-w-md w-full text-center bg-card border border-border rounded-2xl p-8 shadow-sm">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Approval Pending</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Your account is pending admin approval. We'll review your application and
              notify you once it's been approved. This usually takes 24–48 hours.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                logout();
                setLocation("/");
              }}
              className="w-full"
            >
              Go Back Home
            </Button>
          </div>
        </div>
      );
    }

    if (status === "rejected") {
      return (
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="max-w-md w-full text-center bg-card border border-border rounded-2xl p-8 shadow-sm">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Application Rejected</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Your vendor account has been rejected. Please contact support at{" "}
              <a
                href="mailto:support@urbanservices.com"
                className="text-primary underline underline-offset-2"
              >
                support@urbanservices.com
              </a>{" "}
              for more information.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                logout();
                setLocation("/");
              }}
              className="w-full"
            >
              Go Back Home
            </Button>
          </div>
        </div>
      );
    }
  }

  // Role mismatch — redirect handled by useEffect above
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="max-w-md w-full text-center bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldOff className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground text-sm mb-6">
            You don't have permission to view this page.
          </p>
          <Button onClick={() => setLocation("/")} className="w-full">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
