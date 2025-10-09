
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet, Navigate } from 'react-router-dom';
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
import EsqueciSenha from '@/pages/EsqueciSenha';
import ResetPassword from '@/pages/ResetPassword';
import Checkout from '@/pages/Checkout';
import PagamentoSucessoFiliacao from '@/pages/PagamentoSucesso';
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
import Financeiro from '@/pages/dashboard/Financeiro';
import Suporte from '@/pages/dashboard/Suporte';
import Afiliados from '@/pages/dashboard/Afiliados';
import SolicitacaoServicos from '@/pages/dashboard/SolicitacaoServicos';
import CheckoutServico from '@/pages/dashboard/CheckoutServico';
import PagamentoSucessoServico from '@/pages/dashboard/PagamentoSucesso';

// Admin Pages - NOVOS COMPONENTES
import UsersAdmin from '@/pages/admin/UsersAdmin';
import FinancialAdmin from '@/pages/admin/FinancialAdmin';
import AuditLogs from '@/pages/admin/AuditLogs';
import SupportManagement from '@/pages/admin/SupportManagement';
import AdminCertidoesPage from '@/pages/admin/AdminCertidoesPage';
import NotificationManagementPage from '@/pages/admin/NotificationManagementPage';
import ServicosAdmin from '@/pages/admin/ServicosAdmin';
import SolicitacoesAdmin from '@/pages/admin/SolicitacoesAdmin';
import WebhookErrors from '@/pages/admin/WebhookErrors';

// Admin Pages - COMPONENTES ANTIGOS (manter alguns)
import MemberTypeManagement from '@/pages/dashboard/MemberTypeManagement';
import AdminNotificationsPage from '@/pages/dashboard/admin/AdminNotifications';
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
import AdminLayout from '@/components/layout/AdminLayout';

// Contexts
import { AuthProvider } from '@/contexts/AuthContext';

// Components
import ProtectedRoute from '@/components/ProtectedRoute';
import { AsaasInitializer } from '@/components/AsaasInitializer';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AsaasInitializer>
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
            <Route path="/filiacao" element={<Filiacao />} />
            <Route path="/privacidade" element={<Layout><Privacidade /></Layout>} />
            <Route path="/termos" element={<Layout><Termos /></Layout>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/esqueci-senha" element={<EsqueciSenha />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/checkout/:cobrancaId" element={<Checkout />} />
            <Route path="/pagamento-sucesso" element={<PagamentoSucessoFiliacao />} />
            <Route path="/validar-carteira/:numeroCarteira" element={<ValidarCarteira />} />
            <Route path="/validar-certificado/:numeroCertificado" element={<ValidarCertificado />} />
            <Route path="/validar-certidao/:numeroProtocolo" element={<ValidarCertidao />} />

            {/* Public profile route */}
            <Route path="/perfil-publico/:userId" element={<PerfilPublico />} />

            {/* Protected routes - APENAS USUÁRIO */}
            <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/meus-dados" element={<MeusDados />} />
              <Route path="/dashboard/carteira-digital" element={<CarteiraDigital />} />
              <Route path="/dashboard/comunicacao" element={<Comunicacao />} />
              <Route path="/dashboard/comunicacao-dashboard" element={<ComunicacaoDashboard />} />
              <Route path="/dashboard/eventos" element={<EventosDashboard />} />
              <Route path="/dashboard/solicitacao-servicos" element={<SolicitacaoServicos />} />
              <Route path="/dashboard/checkout-servico" element={<CheckoutServico />} />
              <Route path="/dashboard/pagamento-sucesso" element={<PagamentoSucessoServico />} />
              <Route path="/dashboard/financeiro" element={<Financeiro />} />
              <Route path="/dashboard/suporte" element={<Suporte />} />
              <Route path="/dashboard/afiliados" element={<Afiliados />} />
              <Route path="/dashboard/notifications" element={<Notifications />} />
              <Route path="/dashboard/perfil-completo" element={<PerfilCompleto />} />
              {/* Redirecionamentos das URLs antigas */}
              <Route path="/dashboard/certidoes" element={<Navigate to="/dashboard/solicitacao-servicos?tab=certidao" replace />} />
              <Route path="/dashboard/regularizacao" element={<Navigate to="/dashboard/solicitacao-servicos?tab=regularizacao" replace />} />
              <Route path="/dashboard/checkout-regularizacao" element={<Navigate to="/dashboard/solicitacao-servicos" replace />} />
            </Route>

            {/* Admin routes - FORA de ProtectedRoute */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="users" element={<UsersAdmin />} />
              <Route path="financial" element={<FinancialAdmin />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="support" element={<SupportManagement />} />
              <Route path="member-management" element={<MemberTypeManagement />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="diagnostics" element={<SystemDiagnosticsPage />} />
              <Route path="content" element={<ContentManagement />} />
              <Route path="certidoes" element={<AdminCertidoesPage />} />
              <Route path="notification-management" element={<NotificationManagementPage />} />
              <Route path="servicos" element={<ServicosAdmin />} />
              <Route path="solicitacoes" element={<SolicitacoesAdmin />} />
              <Route path="webhook-errors" element={<WebhookErrors />} />
            </Route>

            <Route path="/dashboard/admin" element={<AdminLayout />}>
              <Route path="usuarios" element={<UsersAdmin />} />
              <Route path="member-management" element={<MemberTypeManagement />} />
              <Route path="financial" element={<FinancialAdmin />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="diagnostics" element={<SystemDiagnosticsPage />} />
              <Route path="suporte" element={<SupportManagement />} />
              <Route path="content" element={<ContentManagement />} />
              <Route path="content/:pageName/edit" element={<ContentEdit />} />
              <Route path="content/home-editor" element={<HomeContentEdit />} />
              <Route path="content/sobre-editor" element={<AboutContentEdit />} />
              <Route path="content/lideranca-editor" element={<LeadershipContentEdit />} />
              <Route path="content/eventos-editor" element={<EventosContentEdit />} />
              <Route path="content/multimidia-editor" element={<MultimidiaContentEdit />} />
              <Route path="content/contato-editor" element={<ContatoContentEdit />} />
              <Route path="content/noticias-editor" element={<NoticiasContentEdit />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Router>
          <Toaster />
        </AsaasInitializer>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
