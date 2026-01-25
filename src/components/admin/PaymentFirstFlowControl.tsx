/**
 * Componente para controle da feature flag do Payment First Flow
 * 
 * Permite aos administradores gerenciar o rollout gradual
 * Requirements: 8.2, 8.3, 8.5
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2,
  Info,
  Users,
  TrendingUp,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { usePaymentFirstFlowFeature } from '@/hooks/usePaymentFirstFlowFeature';

export default function PaymentFirstFlowControl() {
  const { 
    config, 
    shouldUsePaymentFirstFlow,
    enableForDevelopment,
    disableForDevelopment,
    resetDevelopmentOverride
  } = usePaymentFirstFlowFeature();

  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<boolean | null>(null);

  // Simular teste com email
  const handleTestEmail = () => {
    if (!testEmail.trim()) {
      toast.error('Digite um email para testar');
      return;
    }

    const result = shouldUsePaymentFirstFlow(testEmail);
    setTestResult(result);
    
    toast.info(
      result 
        ? `Email "${testEmail}" USARIA o Payment First Flow`
        : `Email "${testEmail}" usaria o fluxo tradicional`,
      { duration: 5000 }
    );
  };

  // Calcular estatísticas
  const getStatusInfo = () => {
    if (config.forceDisabled) {
      return {
        status: 'disabled',
        label: 'Desabilitado',
        description: 'Feature flag forçada a desabilitar',
        color: 'bg-red-100 text-red-800',
        icon: Pause
      };
    }

    if (config.forceEnabled) {
      return {
        status: 'forced',
        label: 'Forçado (100%)',
        description: 'Feature flag forçada a habilitar para todos',
        color: 'bg-purple-100 text-purple-800',
        icon: Shield
      };
    }

    if (!config.enabled) {
      return {
        status: 'off',
        label: 'Desligado',
        description: 'Feature flag não habilitada',
        color: 'bg-gray-100 text-gray-800',
        icon: Pause
      };
    }

    if (config.rolloutPercentage === 0) {
      return {
        status: 'ready',
        label: 'Pronto (0%)',
        description: 'Habilitado mas sem rollout',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Settings
      };
    }

    if (config.rolloutPercentage >= 100) {
      return {
        status: 'full',
        label: 'Completo (100%)',
        description: 'Rollout completo para todos os usuários',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle2
      };
    }

    return {
      status: 'partial',
      label: `Parcial (${config.rolloutPercentage}%)`,
      description: `Rollout gradual para ${config.rolloutPercentage}% dos usuários`,
      color: 'bg-blue-100 text-blue-800',
      icon: TrendingUp
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Status Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Payment First Flow - Status
          </CardTitle>
          <CardDescription>
            Controle do novo fluxo de pagamento (Pagamento → Conta)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className="h-5 w-5 text-gray-600" />
              <div>
                <Badge className={statusInfo.color}>
                  {statusInfo.label}
                </Badge>
                <p className="text-sm text-gray-600 mt-1">
                  {statusInfo.description}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {config.rolloutPercentage}%
              </p>
              <p className="text-xs text-gray-500">dos usuários</p>
            </div>
          </div>

          {/* Configuração Atual */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs font-medium text-gray-500">HABILITADO</p>
              <p className="text-sm font-semibold">
                {config.enabled ? '✅ Sim' : '❌ Não'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">ROLLOUT</p>
              <p className="text-sm font-semibold">{config.rolloutPercentage}%</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">FORÇADO</p>
              <p className="text-sm font-semibold">
                {config.forceEnabled ? '🟢 Habilitado' : 
                 config.forceDisabled ? '🔴 Desabilitado' : 
                 '⚪ Normal'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">ORIGEM</p>
              <p className="text-sm font-semibold">
                {config.forceEnabled || config.forceDisabled ? 'Override' : 'Ambiente'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controles de Desenvolvimento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Controles de Desenvolvimento
          </CardTitle>
          <CardDescription>
            Overrides locais para teste e desenvolvimento (não afeta produção)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Estes controles são apenas para desenvolvimento e teste. 
              Eles criam overrides locais que não afetam outros usuários.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              onClick={enableForDevelopment}
              variant="outline"
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Play className="h-4 w-4 mr-2" />
              Forçar Habilitar
            </Button>
            
            <Button
              onClick={disableForDevelopment}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Pause className="h-4 w-4 mr-2" />
              Forçar Desabilitar
            </Button>
            
            <Button
              onClick={resetDevelopmentOverride}
              variant="outline"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Teste de Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Teste de Distribuição
          </CardTitle>
          <CardDescription>
            Teste se um email específico usaria o Payment First Flow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="test-email">Email para teste</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="usuario@exemplo.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTestEmail()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleTestEmail}>
                Testar
              </Button>
            </div>
          </div>

          {testResult !== null && (
            <Alert className={testResult ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Resultado:</strong> Este email{' '}
                {testResult ? (
                  <span className="text-blue-700 font-semibold">USARIA o Payment First Flow</span>
                ) : (
                  <span className="text-gray-700 font-semibold">usaria o fluxo tradicional</span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Informações de Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Como Configurar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium">Variáveis de Ambiente (.env)</h4>
              <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm mt-2">
                <div>VITE_PAYMENT_FIRST_FLOW_ENABLED=false</div>
                <div>VITE_PAYMENT_FIRST_FLOW_PERCENTAGE=0</div>
                <div>VITE_PAYMENT_FIRST_FLOW_FORCE_ENABLED=false</div>
                <div>VITE_PAYMENT_FIRST_FLOW_FORCE_DISABLED=false</div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium">Console do Navegador</h4>
              <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm mt-2">
                <div>paymentFirstFlowDev.enable()   // Forçar habilitar</div>
                <div>paymentFirstFlowDev.disable()  // Forçar desabilitar</div>
                <div>paymentFirstFlowDev.reset()    // Resetar</div>
                <div>paymentFirstFlowDev.status()   // Ver status</div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium">Estratégia de Rollout Recomendada</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 mt-2">
                <li>Testar com FORCE_ENABLED=true em desenvolvimento</li>
                <li>Deploy com ENABLED=true, PERCENTAGE=5 (5% dos usuários)</li>
                <li>Monitorar métricas e erros por 24-48h</li>
                <li>Aumentar gradualmente: 10% → 25% → 50% → 100%</li>
                <li>Rollback com FORCE_DISABLED=true se necessário</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avisos Importantes */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> O Payment First Flow é uma mudança significativa no fluxo de registro. 
          Teste extensivamente antes de aumentar o percentual de rollout. 
          Mantenha sempre a possibilidade de rollback rápido.
        </AlertDescription>
      </Alert>
    </div>
  );
}

/*
EXEMPLO DE USO:

// Em uma página de admin
import PaymentFirstFlowControl from '@/components/admin/PaymentFirstFlowControl';

function AdminSystemSettings() {
  return (
    <div className="space-y-6">
      <h1>Configurações do Sistema</h1>
      
      <PaymentFirstFlowControl />
    </div>
  );
}
*/