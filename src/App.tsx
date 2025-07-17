
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Home from "./pages/Home";
import Sobre from "./pages/Sobre";
import Lideranca from "./pages/Lideranca";
import Eventos from "./pages/Eventos";
import Noticias from "./pages/Noticias";
import Multimidia from "./pages/Multimidia";
import Contato from "./pages/Contato";
import NotFound from "./pages/NotFound";

// Dashboard Pages
import Dashboard from "./pages/dashboard/Dashboard";
import MeusDados from "./pages/dashboard/MeusDados";
import CarteiraDigital from "./pages/dashboard/CarteiraDigital";
import Financeiro from "./pages/dashboard/Financeiro";
import Certidoes from "./pages/dashboard/Certidoes";
import EventosDashboard from "./pages/dashboard/EventosDashboard";
import Comunicacao from "./pages/dashboard/Comunicacao";
import Suporte from "./pages/dashboard/Suporte";
import Perfil from "./pages/dashboard/Perfil";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/sobre" element={<Layout><Sobre /></Layout>} />
          <Route path="/lideranca" element={<Layout><Lideranca /></Layout>} />
          <Route path="/eventos" element={<Layout><Eventos /></Layout>} />
          <Route path="/noticias" element={<Layout><Noticias /></Layout>} />
          <Route path="/multimidia" element={<Layout><Multimidia /></Layout>} />
          <Route path="/contato" element={<Layout><Contato /></Layout>} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path="/dashboard/meus-dados" element={<DashboardLayout><MeusDados /></DashboardLayout>} />
          <Route path="/dashboard/carteira-digital" element={<DashboardLayout><CarteiraDigital /></DashboardLayout>} />
          <Route path="/dashboard/financeiro" element={<DashboardLayout><Financeiro /></DashboardLayout>} />
          <Route path="/dashboard/certidoes" element={<DashboardLayout><Certidoes /></DashboardLayout>} />
          <Route path="/dashboard/eventos" element={<DashboardLayout><EventosDashboard /></DashboardLayout>} />
          <Route path="/dashboard/comunicacao" element={<DashboardLayout><Comunicacao /></DashboardLayout>} />
          <Route path="/dashboard/suporte" element={<DashboardLayout><Suporte /></DashboardLayout>} />
          <Route path="/dashboard/perfil" element={<DashboardLayout><Perfil /></DashboardLayout>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
