
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';

// Lazy loading for better performance
const Index = lazy(() => import('@/pages/Index'));
const Home = lazy(() => import('@/pages/Home'));
const Sobre = lazy(() => import('@/pages/Sobre'));
const Lideranca = lazy(() => import('@/pages/Lideranca'));
const Noticias = lazy(() => import('@/pages/Noticias'));
const Eventos = lazy(() => import('@/pages/Eventos'));
const Multimidia = lazy(() => import('@/pages/Multimidia'));
const Contato = lazy(() => import('@/pages/Contato'));
const Filiacao = lazy(() => import('@/pages/Filiacao'));
const Auth = lazy(() => import('@/pages/Auth'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const PagamentoSucesso = lazy(() => import('@/pages/PagamentoSucesso'));
const ValidarCarteira = lazy(() => import('@/pages/ValidarCarteira'));
const ValidarCertificado = lazy(() => import('@/pages/ValidarCertificado'));
const ValidarCertidao = lazy(() => import('@/pages/ValidarCertidao'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Dashboard Pages
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));
const Perfil = lazy(() => import('@/pages/dashboard/Perfil'));
const MeusDados = lazy(() => import('@/pages/dashboard/MeusDados'));
const CarteiraDigital = lazy(() => import('@/pages/dashboard/CarteiraDigital'));
const Comunicacao = lazy(() => import('@/pages/dashboard/Comunicacao'));
const ComunicacaoDashboard = lazy(() => import('@/pages/dashboard/ComunicacaoDashboard'));
const EventosDashboard = lazy(() => import('@/pages/dashboard/EventosDashboard'));
const Certidoes = lazy(() => import('@/pages/dashboard/Certidoes'));
const Financeiro = lazy(() => import('@/pages/dashboard/Financeiro'));
const Regularizacao = lazy(() => import('@/pages/dashboard/Regularizacao'));
const CheckoutRegularizacao = lazy(() => import('@/pages/dashboard/CheckoutRegularizacao'));
const Suporte = lazy(() => import('@/pages/dashboard/Suporte'));
const Afiliados = lazy(() => import('@/pages/dashboard/Afiliados'));

// Layouts
const Layout = lazy(() => import('@/components/Layout'));
const DashboardLayout = lazy(() => import('@/components/dashboard/DashboardLayout'));

// Contexts
import { AuthProvider } from '@/contexts/AuthContext';

// Components
const ProtectedRoute = lazy(() => import('@/components/ProtectedRoute'));

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-comademig-blue"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Layout><Index /></Layout>} />
              <Route path="/home" element={<Layout><Home /></Layout>} />
              <Route path="/sobre" element={<Layout><Sobre /></Layout>} />
              <Route path="/lideranca" element={<Layout><Lideranca /></Layout>} />
              <Route path="/noticias" element={<Layout><Noticias /></Layout>} />
              <Route path="/eventos" element={<Layout><Eventos /></Layout>} />
              <Route path="/multimidia" element={<Layout><Multimidia /></Layout>} />
              <Route path="/contato" element={<Layout><Contato /></Layout>} />
              <Route path="/filiacao" element={<Layout><Filiacao /></Layout>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/pagamento-sucesso" element={<PagamentoSucesso />} />
              <Route path="/validar-carteira/:numeroCarteira" element={<ValidarCarteira />} />
              <Route path="/validar-certificado/:numeroCertificado" element={<ValidarCertificado />} />
              <Route path="/validar-certidao/:numeroProtocolo" element={<ValidarCertidao />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute><DashboardLayout><Outlet /></DashboardLayout></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/perfil" element={<Perfil />} />
                <Route path="/dashboard/meus-dados" element={<MeusDados />} />
                <Route path="/dashboard/carteira" element={<CarteiraDigital />} />
                <Route path="/dashboard/comunicacao" element={<Comunicacao />} />
                <Route path="/dashboard/comunicacao-dashboard" element={<ComunicacaoDashboard />} />
                <Route path="/dashboard/eventos" element={<EventosDashboard />} />
                <Route path="/dashboard/certidoes" element={<Certidoes />} />
                <Route path="/dashboard/financeiro" element={<Financeiro />} />
                <Route path="/dashboard/regularizacao" element={<Regularizacao />} />
                <Route path="/dashboard/checkout-regularizacao" element={<CheckoutRegularizacao />} />
                <Route path="/dashboard/suporte" element={<Suporte />} />
                <Route path="/dashboard/afiliados" element={<Afiliados />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
