import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import FinancialDashboard from '@/components/dashboard/FinancialDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Shield } from "lucide-react";

const Financeiro = () => {
  const { user, isAdmin } = useAuth();

  // Se for admin, mostrar dashboard completo (todos os dados)
  if (isAdmin()) {
    return <FinancialDashboard />;
  }

  // Se for usuário comum, mostrar dashboard pessoal (apenas seus dados)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meu Financeiro</h1>
        <p className="text-gray-600">Consulte sua situação financeira e histórico de pagamentos</p>
      </div>

      {/* Dashboard Financeiro Pessoal - Filtrado por usuário */}
      <FinancialDashboard userId={user?.id} />

      {/* Informações Importantes */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Informações Importantes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ul className="space-y-2">
            <li>• Os pagamentos são processados automaticamente via gateway Asaas</li>
            <li>• Você visualiza apenas seus próprios dados financeiros</li>
            <li>• Em caso de dúvidas, entre em contato com o suporte</li>
            <li>• Mantenha seus dados de pagamento sempre atualizados</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Financeiro;