/**
 * Página de configurações do sistema para administradores
 * 
 * Inclui controles de feature flags e configurações avançadas
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Zap, 
  Shield, 
  Database,
  Bell,
  Palette
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PaymentFirstFlowControl from '@/components/admin/PaymentFirstFlowControl';

export default function SystemSettings() {
  const { user, isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Acesso Restrito
              </h2>
              <p className="text-gray-600">
                Você não tem permissão para acessar as configurações do sistema.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Configurações do Sistema
        </h1>
        <p className="text-gray-600">
          Gerencie configurações avançadas, feature flags e parâmetros do sistema.
        </p>
      </div>

      {/* Informações do Usuário Admin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sessão Administrativa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{user?.email}</p>
              <p className="text-sm text-gray-600">Administrador do Sistema</p>
            </div>
            <Badge className="bg-green-100 text-green-800">
              Admin Ativo
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Seções de Configuração */}
      <div className="grid gap-6">
        {/* Feature Flags */}
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="h-6 w-6" />
              Feature Flags
            </h2>
            <p className="text-gray-600">
              Controle de funcionalidades experimentais e rollouts graduais.
            </p>
          </div>

          <PaymentFirstFlowControl />
        </section>

        <Separator />

        {/* Configurações Futuras */}
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Outras Configurações
            </h2>
            <p className="text-gray-600">
              Configurações adicionais do sistema (em desenvolvimento).
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Placeholder para futuras configurações */}
            <Card className="opacity-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-500">
                  <Database className="h-5 w-5" />
                  Banco de Dados
                </CardTitle>
                <CardDescription>
                  Configurações de conexão e performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Em Breve</Badge>
              </CardContent>
            </Card>

            <Card className="opacity-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-500">
                  <Bell className="h-5 w-5" />
                  Notificações
                </CardTitle>
                <CardDescription>
                  Configurações de email e alertas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Em Breve</Badge>
              </CardContent>
            </Card>

            <Card className="opacity-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-500">
                  <Palette className="h-5 w-5" />
                  Personalização
                </CardTitle>
                <CardDescription>
                  Temas e customizações visuais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Em Breve</Badge>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}