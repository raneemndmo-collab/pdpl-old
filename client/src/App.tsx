import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import TelegramMonitor from "./pages/TelegramMonitor";
import DarkWebMonitor from "./pages/DarkWebMonitor";
import PasteSites from "./pages/PasteSites";
import PIIClassifier from "./pages/PIIClassifier";
import Leaks from "./pages/Leaks";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/telegram" component={TelegramMonitor} />
        <Route path="/darkweb" component={DarkWebMonitor} />
        <Route path="/paste-sites" component={PasteSites} />
        <Route path="/pii-classifier" component={PIIClassifier} />
        <Route path="/leaks" component={Leaks} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
