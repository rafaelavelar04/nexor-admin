import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { SessionProvider } from "./contexts/SessionContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminLayout from "./components/layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import LeadsPage from "./pages/admin/Leads";
import LeadFormPage from "./pages/admin/leads/LeadFormPage";
import Opportunities from "./pages/admin/Opportunities";
import OpportunityDetailPage from "./pages/admin/opportunities/OpportunityDetailPage";
import SettingsPage from "./pages/admin/Settings";
import GoalsPage from "./pages/admin/GoalsPage";
import CompaniesPage from "./pages/admin/CompaniesPage";
import CompanyFormPage from "./pages/admin/companies/CompanyFormPage";
import ActivitiesPage from "./pages/admin/ActivitiesPage";
import ReportsPage from "./pages/admin/ReportsPage";
import FinancePage from "./pages/admin/FinancePage";
import OnboardingPage from "./pages/admin/OnboardingPage";
import OnboardingDetailPage from "./pages/admin/onboarding/OnboardingDetailPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SessionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="leads/novo" element={<LeadFormPage />} />
                <Route path="leads/:id" element={<LeadFormPage />} />
                <Route path="opportunities" element={<Opportunities />} />
                <Route path="opportunities/:id" element={<OpportunityDetailPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="metas" element={<GoalsPage />} />
                <Route path="companies" element={<CompaniesPage />} />
                <Route path="companies/novo" element={<CompanyFormPage />} />
                <Route path="companies/:id" element={<CompanyFormPage />} />
                <Route path="activities" element={<ActivitiesPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="financeiro" element={<FinancePage />} />
                <Route path="onboarding" element={<OnboardingPage />} />
                <Route path="onboarding/:id" element={<OnboardingDetailPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SessionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;