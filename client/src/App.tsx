import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import Overview from "@/pages/overview";
import NFTsPage from "@/pages/nfts";
import MatrixPage from "@/pages/matrix";
import KilledPage from "@/pages/killed";
import NotFound from "@/pages/not-found";

const PAGE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/nfts": "NFTs",
  "/matrix": "Matrix",
  "/killed": "Kill Gate",
};

function PageHeader() {
  const [location] = useHashLocation();
  const title = PAGE_TITLES[location] || "Social Token Liquid Overview";
  return (
    <header className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
      <SidebarTrigger data-testid="sidebar-trigger" />
      <h1 className="text-sm font-semibold tracking-wide uppercase">{title}</h1>
    </header>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Overview} />
      <Route path="/nfts" component={NFTsPage} />
      <Route path="/matrix" component={MatrixPage} />
      <Route path="/killed" component={KilledPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router hook={useHashLocation}>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <PageHeader />
              <main className="flex-1 overflow-auto p-4 md:p-6" style={{ minWidth: 0 }}>
                <AppRouter />
              </main>
              <PerplexityAttribution />
            </SidebarInset>
          </SidebarProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
