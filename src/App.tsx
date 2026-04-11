import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Propostas from "./pages/Propostas";
import Protocolos from "./pages/Protocolos";
import Clientes from "./pages/Clientes";
import Veiculos from "./pages/Veiculos";
import Agenda from "./pages/Agenda";
import Financeiro from "./pages/Financeiro";
import Estoque from "./pages/Estoque";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import AdminPanel from "./pages/AdminPanel";
import Ajuda from "./pages/Ajuda";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/propostas" element={<Propostas />} />
              <Route path="/protocolos" element={<Protocolos />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/veiculos" element={<Veiculos />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/estoque" element={<Estoque />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/ajuda" element={<Ajuda />} />
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin_master"><AdminPanel /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
