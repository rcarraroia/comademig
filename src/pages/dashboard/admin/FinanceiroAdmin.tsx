import React from 'react';
import FinancialDashboard from '@/components/dashboard/FinancialDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingUp, Users, DollarSign } from "lucide-react";

const FinanceiroAdmin = () => {
  return (
    <div className="space-y-6">
      {/* Header Administrativo */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-comademig-blue" />
            Dashboard Financeiro Administrativo
          </h1>
          <p className="text-gray-600 mt-2">
            Visão completa das receitas, pagamentos e comissões do sistema
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Administrador
        </Badge>
      </div>

      {/* Alertas Administrativos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Sistema Ativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700">
              Integração Asaas funcionando normalmente
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Dados Globais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700">
              Visualizando dados de todos os usuários
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-700">
              Dados atualizados via webhooks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Financeiro Completo */}
      <FinancialDashboard />

      {/* Informações Administrativas */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Acesso Administrativo
          </CardTitle>
        </CardHeader>
        <CardContent className="text-amber-700">
          <ul className="space-y-2">
            <li>• <strong>Dados Globais:</strong> Visualiza receitas de todos os usuários</li>
            <li>• <strong>Comissões:</strong> Monitora splits e pagamentos de afiliados</li>
            <li>• <strong>Webhooks:</strong> Acompanha processamento em tempo real</li>
            <li>• <strong>Métricas:</strong> Análise completa de performance financeira</li>
            <li>• <strong>Auditoria:</strong> Logs completos de todas as transações</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceiroAdmin;