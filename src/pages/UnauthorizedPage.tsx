import { Link } from "wouter";
import { ShieldOff, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown when a logged-in user tries to access a route
 * their role is not permitted to view.
 */
export default function UnauthorizedPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <ShieldOff className="w-10 h-10 text-destructive" />
        </div>

        {/* Status code */}
        <p className="text-6xl font-black text-muted/60 mb-2 select-none">403</p>

        {/* Message */}
        <h1 className="text-2xl font-bold text-foreground mb-3">Access Denied</h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto mb-8">
          You don't have the required permissions to view this page.
          If you believe this is a mistake, please contact support.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="w-full sm:w-auto gap-2">
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
