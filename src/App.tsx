
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthRedirect from "./components/AuthRedirect";

// Import pages
import Index from "./pages/Index";
import Home from "./pages/Home";
import Sobre from "./pages/Sobre";
import Lideranca from "./pages/Lideranca";
import Noticias from "./pages/Noticias";
import Eventos from "./pages/Eventos";
import Multimidia from "./pages/Multimidia";
import Filiacao from "./pages/Filiacao";
import Contato from "./pages/Contato";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Dashboard pages
import Dashboard from "./pages/dashboard/Dashboard";
import Perfil from "./pages/dashboard/Perfil";
import MeusDados from "./pages/dashboard/MeusDados";
import CarteiraDigital from "./pages/dashboard/CarteiraDigital";
import Certidoes from "./pages/dashboard/Certidoes";
import Financeiro from "./pages/dashboard/Financeiro";
import EventosDashboard from "./pages/dashboard/EventosDashboard";
import Comunicacao from "./pages/dashboard/Comunicacao";
import Suporte from "./pages/dashboard/Suporte";
import Regularizacao from "./pages/dashboard/Regularizacao";
import CheckoutRegularizacao from "./pages/dashboard/CheckoutRegularizacao";
import Checkout from "./pages/Checkout";
import PagamentoSucesso from "./pages/PagamentoSucesso";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/home" element={<Layout><Home /></Layout>} />
            <Route path="/sobre" element={<Layout><Sobre /></Layout>} />
            <Route path="/lideranca" element={<Layout><Lideranca /></Layout>} />
            <Route path="/noticias" element={<Layout><Noticias /></Layout>} />
            <Route path="/eventos" element={<Layout><Eventos /></Layout>} />
            <Route path="/multimidia" element={<Layout><Multimidia /></Layout>} />
            <Route path="/filiacao" element={<Layout><Filiacao /></Layout>} />
            <Route path="/contato" element={<Layout><Contato /></Layout>} />
            <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
            <Route path="/pagamento-sucesso" element={<Layout><PagamentoSucesso /></Layout>} />
            
            {/* Auth Routes */}
            <Route path="/auth" element={
              <AuthRedirect>
                <Auth />
              </AuthRedirect>
            } />
            
            {/* Protected Dashboard Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout><Dashboard /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/perfil" element={
              <ProtectedRoute>
                <DashboardLayout><Perfil /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/meus-dados" element={
              <ProtectedRoute>
                <DashboardLayout><MeusDados /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/carteira-digital" element={
              <ProtectedRoute>
                <DashboardLayout><CarteiraDigital /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/certidoes" element={
              <ProtectedRoute>
                <DashboardLayout><Certidoes /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/financeiro" element={
              <ProtectedRoute>
                <DashboardLayout><Financeiro /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/regularizacao" element={
              <ProtectedRoute>
                <DashboardLayout><Regularizacao /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/checkout-regularizacao" element={
              <ProtectedRoute>
                <DashboardLayout><CheckoutRegularizacao /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/eventos" element={
              <ProtectedRoute>
                <DashboardLayout><EventosDashboard /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/comunicacao" element={
              <ProtectedRoute>
                <DashboardLayout><Comunicacao /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/suporte" element={
              <ProtectedRoute>
                <DashboardLayout><Suporte /></DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
