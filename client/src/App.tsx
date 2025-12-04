import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AnalyticsPortal from "@/pages/AnalyticsPortal";
import SnowflakeConnect from "@/pages/SnowflakeConnect";
import TableSelect from "@/pages/TableSelect";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component, requireTables = false }: { component: () => JSX.Element; requireTables?: boolean }) {
  const [, setLocation] = useLocation();
  
  const { data: sessionData, isLoading } = useQuery<{
    connected: boolean;
    session: any;
    selectedTables: string[];
    hasSelectedTables: boolean;
  }>({
    queryKey: ["/api/snowflake/session"],
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sessionData?.connected) {
    setLocation("/");
    return <></>;
  }

  if (requireTables && !sessionData?.hasSelectedTables) {
    setLocation("/tables");
    return <></>;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={SnowflakeConnect} />
      <Route path="/tables">
        <ProtectedRoute component={TableSelect} />
      </Route>
      <Route path="/chat">
        <ProtectedRoute component={AnalyticsPortal} requireTables />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
