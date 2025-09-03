
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';

// Public Pages
import Index from '@/pages/Index';
import Home from '@/pages/Home';
import Sobre from '@/pages/Sobre';
import Lideranca from '@/pages/Lideranca';
import Noticias from '@/pages/Noticias';
import Eventos from '@/pages/Eventos';
import Multimidia from '@/pages/Multimidia';
import Contato from '@/pages/Contato';
import Filiacao from '@/pages/Filiacao';
import Auth from '@/pages/Auth';
import Checkout from '@/pages/Checkout';
import PagamentoSucesso from '@/pages/PagamentoSucesso';
import ValidarCarteira from '@/pages/ValidarCarteira';
import ValidarCertificado from '@/pages/ValidarCertificado';
import ValidarCertidao from '@/pages/ValidarCertidao';
import NotFound from '@/pages/NotFound';

// Dashboard Pages
import Dashboard from '@/pages/dashboard/Dashboard';

import MeusDados from '@/pages/dashboard/MeusDados';
import CarteiraDigital from '@/pages/dashboard/CarteiraDigital';
import Comunicacao from '@/pages/dashboard/Comunicacao';
import ComunicacaoDashboard from '@/pages/dashboard/ComunicacaoDashboard';
import EventosDashboard from '@/pages/dashboard/EventosDashboard';
import Certidoes from '@/pages/dashboard/Certidoes';
import Financeiro from '@/pages/dashboard/Financeiro';
import Regularizacao from '@/pages/dashboard/Regularizacao';
import CheckoutRegularizacao from '@/pages/dashboard/CheckoutRegularizacao';
import Suporte from '@/pages/dashboard/Suporte';
import Afiliados from '@/pages/dashboard/Afiliados';

// Admin Pages
import AdminUsersPage from '@/pages/dashboard/AdminUsers';
import AdminSupportPage from '@/pages/dashboard/AdminSupportPage';
import MemberTypes from '@/pages/dashboard/admin/MemberTypes';
import Subscriptions from '@/pages/dashboard/admin/Subscriptions';
import ContentManagement from '@/pages/dashboard/ContentManagement';
import SystemDiagnosticsPage from '@/pages/dashboard/admin/SystemDiagnostics';
import ContentEdit from '@/pages/dashboard/ContentEdit';
import UserManagement from '@/pages/dashboard/UserManagement';
import Notifications from '@/pages/dashboard/Notifications';
import PerfilPublico from '@/pages/dashboard/PerfilPublico';
import PerfilCompleto from '@/pages/dashboard/PerfilCompleto';
import HomeContentEdit from '@/pages/dashboard/HomeContentEdit';
import AboutContentEdit from '@/pages/dashboard/AboutContentEdit';
import Privacidade from '@/pages/Privacidade';
import Termos from '@/pages/Termos';
import LeadershipContentEdit from '@/pages/dashboard/LeadershipContentEdit';
import EventosContentEdit from '@/pages/dashboard/EventosContentEdit';
import MultimidiaContentEdit from '@/pages/dashboard/MultimidiaContentEdit';
import ContatoContentEdit from '@/pages/dashboard/ContatoContentEdit';
import NoticiasContentEdit from '@/pages/dashboard/NoticiasContentEdit';

// Layouts
import Layout from '@/components/Layout';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

// Contexts
import { AuthProvider } from '@/contexts/AuthContext';

// Components
import ProtectedRoute from '@/components/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
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
            <Route path="/privacidade" element={<Layout><Privacidade /></Layout>} />
            <Route path="/termos" element={<Layout><Termos /></Layout>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pagamento-sucesso" element={<PagamentoSucesso />} />
            <Route path="/validar-carteira/:numeroCarteira" element={<ValidarCarteira />} />
            <Route path="/validar-certificado/:numeroCertificado" element={<ValidarCertificado />} />
            <Route path="/validar-certidao/:numeroProtocolo" element={<ValidarCertidao />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />

              <Route path="/dashboard/meus-dados" element={<MeusDados />} />
              <Route path="/dashboard/carteira-digital" element={<CarteiraDigital />} />
              <Route path="/dashboard/comunicacao" element={<Comunicacao />} />
              <Route path="/dashboard/comunicacao-dashboard" element={<ComunicacaoDashboard />} />
              <Route path="/dashboard/eventos" element={<EventosDashboard />} />
              <Route path="/dashboard/certidoes" element={<Certidoes />} />
              <Route path="/dashboard/financeiro" element={<Financeiro />} />
              <Route path="/dashboard/regularizacao" element={<Regularizacao />} />
              <Route path="/dashboard/checkout-regularizacao" element={<CheckoutRegularizacao />} />
              <Route path="/dashboard/suporte" element={<Suporte />} />
              <Route path="/dashboard/afiliados" element={<Afiliados />} />

              {/* Admin routes */}
              <Route path="/dashboard/admin/usuarios" element={<AdminUsersPage />} />
              <Route path="/dashboard/admin/member-types" element={<MemberTypes />} />
              <Route path="/dashboard/admin/subscriptions" element={<Subscriptions />} />
              <Route path="/dashboard/admin/diagnostics" element={<SystemDiagnosticsPage />} />
              <Route path="/dashboard/admin/suporte" element={<AdminSupportPage />} />
              <Route path="/dashboard/admin/content" element={<ContentManagement />} />
              <Route path="/dashboard/notifications" element={<Notifications />} />
              <Route path="/dashboard/admin/content/:pageName/edit" element={<ContentEdit />} />
              <Route path="/dashboard/admin/content/home-editor" element={<HomeContentEdit />} />
              <Route path="/dashboard/admin/content/sobre-editor" element={<AboutContentEdit />} />
              <Route path="/dashboard/admin/content/lideranca-editor" element={<LeadershipContentEdit />} />
              <Route path="/dashboard/admin/content/eventos-editor" element={<EventosContentEdit />} />
              <Route path="/dashboard/admin/content/multimidia-editor" element={<MultimidiaContentEdit />} />
              <Route path="/dashboard/admin/content/contato-editor" element={<ContatoContentEdit />} />
              <Route path="/dashboard/admin/content/noticias-editor" element={<NoticiasContentEdit />} />
              <Route path="/dashboard/perfil-publico/:userId?" element={<PerfilPublico />} />
              <Route path="/dashboard/perfil-completo" element={<PerfilCompleto />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
