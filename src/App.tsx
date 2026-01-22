import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { SessionProvider } from "./contexts/SessionContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ActionManagerProvider } from "./contexts/ActionManagerContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminLayout from "./components/layouts/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import LeadsPage from "./pages/admin/Leads";
import LeadFormPage from "./pages/admin/leads/LeadFormPage";
import Opportunities from "./pages/admin/Opportunities";
import OpportunityDetailPage from "./pages/admin/opportunities/OpportunityDetailPage";
import SettingsPage from "./pages/admin/Settings";
import WebhookLogsPage from "./pages/admin/WebhookLogsPage";
import GoalsPage from "./pages/admin/GoalsPage";
import CompaniesPage from "./pages/admin/CompaniesPage";
import CompanyFormPage from "./pages/admin/companies/CompanyFormPage";
import ActivitiesPage from "./pages/admin/ActivitiesPage";
import ReportsPage from "./pages/admin/ReportsPage";
import InsightsPage from "./pages/admin/InsightsPage";
import ForecastPage from "./pages/admin/ForecastPage";
import FinancePage from "./pages/admin/FinancePage";
import ContractDetailPage from "./pages/admin/finance/ContractDetailPage";
import OnboardingPage from "./pages/admin/OnboardingPage";
import OnboardingDetailPage from "./pages/admin/onboarding/OnboardingDetailPage";
import SupportPage from "./pages/admin/SupportPage";
import TicketFormPage from "./pages/admin/support/TicketFormPage";
import AlertsPage from "./pages/admin/AlertsPage";
import PartnersPage from "./pages/admin/PartnersPage";
import PartnerFormPage from "./pages/admin/partners/PartnerFormPage";
import AssignmentsPage from "./pages/admin/AssignmentsPage";
import { config } from "./config";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: config.queryClientConfig.staleTime,
      cacheTime: config.queryClientConfig.cacheTime,
      refetchOnWindowFocus: false, // Evita refetchs desnecessários
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="bottom-right" richColors />
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <SessionProvider>
          <ActionManagerProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                
                <Route element={<ProtectedRoute />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="leads" element={<LeadsPage />} />
                    <Route path="leads/novo" element={<LeadFormPage />} />
                    <Route path="leads/:id" element={<LeadFormPage />} />
                    <Route path="opportunities" element={<Opportunities />} />
                    <Route path="opportunities/:id" element={<OpportunityDetailPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="webhooks/:id/logs" element={<WebhookLogsPage />} />
                    <Route path="metas" element={<GoalsPage />} />
                    <Route path="companies" element={<CompaniesPage />} />
                    <Route path="companies/novo" element={<CompanyFormPage />} />
                    <Route path="companies/:id" element={<CompanyFormPage />} />
                    <Route path="activities" element={<ActivitiesPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="insights" element={<InsightsPage />} />
                    <Route path="forecast" element={<ForecastPage />} />
                    <Route path="financeiro" element={<FinancePage />} />
                    <Route path="financeiro/:id" element={<ContractDetailPage />} />
                    <Route path="onboarding" element={<OnboardingPage />} />
                    <Route path="onboarding/:id" element={<OnboardingDetailPage />} />
                    <Route path="suporte" element={<SupportPage />} />
                    <Route path="suporte/novo" element={<TicketFormPage />} />
                    <Route path="suporte/:id" element={<TicketFormPage />} />
                    <Route path="alertas" element={<AlertsPage />} />
                    <Route path="parceiros" element={<PartnersPage />} />
                    <Route path="parceiros/novo" element={<PartnerFormPage />} />
                    <Route path="parceiros/:id" element={<PartnerFormPage />} />
                    <Route path="alocacoes" element={<AssignmentsPage />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ActionManagerProvider>
        </SessionProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;