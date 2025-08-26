
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Suspense, lazy } from "react";

// Lazy load components for better performance
const Index = lazy(() => import("./pages/Index"));
const Home = lazy(() => import("./pages/Home"));
const Sobre = lazy(() => import("./pages/Sobre"));
const Lideranca = lazy(() => import("./pages/Lideranca"));
const Noticias = lazy(() => import("./pages/Noticias"));
const Eventos = lazy(() => import("./pages/Eventos"));
const Multimidia = lazy(() => import("./pages/Multimidia"));
const Contato = lazy(() => import("./pages/Contato"));
const Filiacao = lazy(() => import("./pages/Filiacao"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const MeusDados = lazy(() => import("./pages/dashboard/MeusDados"));
const CarteiraDigital = lazy(() => import("./pages/dashboard/CarteiraDigital"));
const Financeiro = lazy(() => import("./pages/dashboard/Financeiro"));
const Certidoes = lazy(() => import("./pages/dashboard/Certidoes"));
const Regularizacao = lazy(() => import("./pages/dashboard/Regularizacao"));
const EventosDashboard = lazy(() => import("./pages/dashboard/EventosDashboard"));
const Afiliados = lazy(() => import("./pages/dashboard/Afiliados"));
const Comunicacao = lazy(() => import("./pages/dashboard/Comunicacao"));
const ComunicacaoDashboard = lazy(() => import("./pages/dashboard/ComunicacaoDashboard"));
const Suporte = lazy(() => import("./pages/dashboard/Suporte"));
const Perfil = lazy(() => import("./pages/dashboard/Perfil"));
const AdminDashboard = lazy(() => import("./pages/dashboard/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/dashboard/AdminUsers"));
const ContentManagement = lazy(() => import("./pages/dashboard/ContentManagement"));
const ContentEdit = lazy(() => import("./pages/dashboard/ContentEdit"));
const AdminSupportPage = lazy(() => import("./pages/dashboard/AdminSupportPage"));
const CheckoutRegularizacao = lazy(() => import("./pages/dashboard/CheckoutRegularizacao"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PagamentoSucesso = lazy(() => import("./pages/PagamentoSucesso"));
const ValidarCarteira = lazy(() => import("./pages/ValidarCarteira"));
const ValidarCertidao = lazy(() => import("./pages/ValidarCertidao"));
const ValidarCertificado = lazy(() => import("./pages/ValidarCertificado"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/home" element={<Home />} />
                <Route path="/sobre" element={<Sobre />} />
                <Route path="/lideranca" element={<Lideranca />} />
                <Route path="/noticias" element={<Noticias />} />
                <Route path="/eventos" element={<Eventos />} />
                <Route path="/multimidia" element={<Multimidia />} />
                <Route path="/contato" element={<Contato />} />
                <Route path="/filiacao" element={<Filiacao />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/pagamento-sucesso" element={<PagamentoSucesso />} />
                <Route path="/validar-carteira" element={<ValidarCarteira />} />
                <Route path="/validar-certidao" element={<ValidarCertidao />} />
                <Route path="/validar-certificado" element={<ValidarCertificado />} />
                
                {/* Protected Dashboard Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/dashboard/meus-dados" element={<ProtectedRoute><MeusDados /></ProtectedRoute>} />
                <Route path="/dashboard/carteira-digital" element={<ProtectedRoute><CarteiraDigital /></ProtectedRoute>} />
                <Route path="/dashboard/financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
                <Route path="/dashboard/certidoes" element={<ProtectedRoute><Certidoes /></ProtectedRoute>} />
                <Route path="/dashboard/regularizacao" element={<ProtectedRoute><Regularizacao /></ProtectedRoute>} />
                <Route path="/dashboard/regularizacao/checkout" element={<ProtectedRoute><CheckoutRegularizacao /></ProtectedRoute>} />
                <Route path="/dashboard/eventos" element={<ProtectedRoute><EventosDashboard /></ProtectedRoute>} />
                <Route path="/dashboard/afiliados" element={<ProtectedRoute><Afiliados /></ProtectedRoute>} />
                <Route path="/dashboard/comunicacao" element={<ProtectedRoute><ComunicacaoDashboard /></ProtectedRoute>} />
                <Route path="/dashboard/suporte" element={<ProtectedRoute><Suporte /></ProtectedRoute>} />
                <Route path="/dashboard/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                
                {/* Admin Routes */}
                <Route path="/dashboard/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/dashboard/admin/usuarios" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
                <Route path="/dashboard/admin/content" element={<ProtectedRoute><ContentManagement /></ProtectedRoute>} />
                <Route path="/dashboard/admin/content/:pageName/edit" element={<ProtectedRoute><ContentEdit /></ProtectedRoute>} />
                <Route path="/dashboard/admin/suporte" element={<ProtectedRoute><AdminSupportPage /></ProtectedRoute>} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
