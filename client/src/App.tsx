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
import MonitoringJobs from "./pages/MonitoringJobs";
import AuditLog from "./pages/AuditLog";
import AlertChannels from "./pages/AlertChannels";
import DataRetention from "./pages/DataRetention";
import ThreatMap from "./pages/ThreatMap";
import ScheduledReports from "./pages/ScheduledReports";
import ApiKeys from "./pages/ApiKeys";
import ThreatRules from "./pages/ThreatRules";
import EvidenceChain from "./pages/EvidenceChain";
import SellerProfiles from "./pages/SellerProfiles";
import OsintTools from "./pages/OsintTools";
import FeedbackAccuracy from "./pages/FeedbackAccuracy";
import KnowledgeGraph from "./pages/KnowledgeGraph";

function Router() {
  // make sure to consider if you need authentication for certain routes
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
        <Route path="/monitoring-jobs" component={MonitoringJobs} />
        <Route path="/threat-map" component={ThreatMap} />
        <Route path="/alert-channels" component={AlertChannels} />
        <Route path="/scheduled-reports" component={ScheduledReports} />
        <Route path="/api-keys" component={ApiKeys} />
        <Route path="/data-retention" component={DataRetention} />
        <Route path="/audit-log" component={AuditLog} />
        <Route path="/threat-rules" component={ThreatRules} />
        <Route path="/evidence-chain" component={EvidenceChain} />
        <Route path="/seller-profiles" component={SellerProfiles} />
        <Route path="/osint-tools" component={OsintTools} />
        <Route path="/feedback-accuracy" component={FeedbackAccuracy} />
        <Route path="/knowledge-graph" component={KnowledgeGraph} />
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
