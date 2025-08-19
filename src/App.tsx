import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient } from '@tanstack/react-query';

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
import Perfil from '@/pages/dashboard/Perfil';
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

// Layouts
import Layout from '@/layouts/Layout';
import DashboardLayout from '@/layouts/DashboardLayout';

// Contexts
import { AuthProvider } from '@/contexts/AuthContext';

// Components
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function App() {
  return (
    <QueryClient>
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
            <Route path="/auth" element={<Auth />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pagamento-sucesso" element={<PagamentoSucesso />} />
            <Route path="/validar-carteira/:numeroCarteira" element={<ValidarCarteira />} />
            <Route path="/validar-certificado/:numeroCertificado" element={<ValidarCertificado />} />
            <Route path="/validar-certidao/:numeroProtocolo" element={<ValidarCertidao />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
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
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClient>
  );
}

export default App;
