import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminRegisterPage from "./pages/Adminpage/AdminRegisterPage";
import PoliceAuthPage from "./pages/Police/PoliceAuthPage";
import AdminAuthPage from "./pages/Adminpage/AdminAuthPage";
import CitizenDashboard from "./pages/Citizen/CitizenDashboard";
import PoliceDashboard from "./pages/Police/PoliceDashboard";
import AdminDashboard from "./pages/Adminpage/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/admin" element={<AdminRegisterPage />} />
            <Route path="/police" element={<PoliceAuthPage />} />
            <Route path="/admin" element={<AdminAuthPage />} />
            <Route path="/citizen/*" element={<ProtectedRoute allowedRoles={["citizen"]}><CitizenDashboard /></ProtectedRoute>} />
            <Route path="/police/dashboard/*" element={<ProtectedRoute allowedRoles={["police"]}><PoliceDashboard /></ProtectedRoute>} />
            <Route path="/admin/dashboard/*" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
