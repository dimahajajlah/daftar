import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAdminMe, getAdminMeQueryKey } from "@workspace/api-client-react";
import { Spinner } from "@/components/ui/spinner";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import PortalEntry from "@/pages/portal-entry";
import PortalView from "@/pages/portal-view";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminCustomers from "@/pages/admin-customers";
import AdminCustomerDetail from "@/pages/admin-customer-detail";
import AdminImport from "@/pages/admin-import";
import { AdminShell } from "@/components/AdminShell";
import { useEffect } from "react";

const queryClient = new QueryClient();

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useAdminMe({
    query: {
      queryKey: getAdminMeQueryKey(),
      retry: false
    }
  });
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !data?.authenticated) {
      setLocation("/admin/login");
    }
  }, [isLoading, data, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Spinner className="w-12 h-12 text-primary" />
      </div>
    );
  }

  if (!data?.authenticated) {
    return null; // Will redirect in useEffect
  }

  return <AdminShell>{children}</AdminShell>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/portal" component={PortalEntry} />
      <Route path="/portal/:code" component={PortalView} />
      
      <Route path="/admin/login" component={AdminLogin} />
      
      <Route path="/admin">
        <AdminGuard>
          <AdminDashboard />
        </AdminGuard>
      </Route>
      
      <Route path="/admin/customers">
        <AdminGuard>
          <AdminCustomers />
        </AdminGuard>
      </Route>
      
      <Route path="/admin/customers/:id">
        <AdminGuard>
          <AdminCustomerDetail />
        </AdminGuard>
      </Route>
      
      <Route path="/admin/import">
        <AdminGuard>
          <AdminImport />
        </AdminGuard>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
