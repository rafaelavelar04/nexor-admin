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
import Settings from "./pages/admin/Settings";

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
                <Route path="settings" element={<Settings />} />
                <Route path="companies" element={<div><h1 className="text-3xl font-bold text-white">Empresas</h1></div>} />
                <Route path="activities" element={<div><h1 className="text-3xl font-bold text-white">Atividades</h1></div>} />
                <Route path="reports" element={<div><h1 className="text-3xl font-bold text-white">Relatórios</h1></div>} />
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