/**
 * Exemplo de uso do sistema de webhooks Asaas
 * Demonstra monitoramento em tempo real de status de pagamentos
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Webhook, Activity, CheckCircle } from 'lucide-react';
import { PaymentStatusMonitor } from '@/components/payments/PaymentStatusMonitor';
import { useAsaasWebhooks, type PaymentStatusUpdate } from '@/hooks/useAsaasWebhooks';

export const WebhookExample: React.FC = () => {
  const [statusUpdates, setStatusUpdates] = useState<PaymentStatusUpdate[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [testPaymentIds] = useState<string[]>([
    // IDs de exemplo - em uso real, estes viriam de pagamentos reais
    'test-payment-1',
    'test-payment-2'
  ]);

  const {
    isListening,
    checkUnprocessedWebhooks,
    getPendingPayments
  } = useAsaasWebhooks();

  // Handler para mudanças de status
  const handleStatusChange = (update: PaymentStatusUpdate) => {
    console.log('Status atualizado:', update);
    setStatusUpdates(prev => [update, ...prev.slice(0, 9)]); // Manter últimas 10
  };

  // Verificar webhooks não processados
  const checkWebhooks = async () => {
    const unprocessed = await checkUnprocessedWebhooks();
    console.log('Webhooks não processados:', unprocessed);
  };

  // Verificar pagamentos pendentes
  const checkPending = async () => {
    const pending = await getPendingPayments();
    console.log('Pagamentos pendentes:', pending);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="w-6 h-6" />
            Sistema de Webhooks Asaas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Como Funciona</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <div>• O Asaas envia webhooks automáticos quando o status de pagamentos muda</div>
                <div>• Nossa Edge Function processa esses webhooks e atualiza o banco de dados</div>
                <div>• O frontend monitora mudanças em tempo real via Supabase Realtime</div>
                <div>• Ações automáticas são executadas (ativar filiação, processar certidão, etc.)</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant={isListening ? "default" : "secondary"}>
                <Bell className="w-3 h-3 mr-1" />
                {isListening ? 'Monitorando' : 'Pausado'}
              </Badge>
              
              <Button onClick={checkWebhooks} variant="outline" size="sm">
                <Activity className="w-4 h-4 mr-2" />
                Verificar Webhooks
              </Button>
              
              <Button onClick={checkPending} variant="outline" size="sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                Pagamentos Pendentes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monitor de Status */}
      <PaymentStatusMonitor
        paymentIds={testPaymentIds}
        autoStart={true}
        showHistory={true}
        onStatusChange={handleStatusChange}
      />

      {/* Histórico de Atualizações */}
      {statusUpdates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Últimas Atualizações de Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusUpdates.map((update, index) => (
                <div
                  key={`${update.payment_id}-${index}`}
                  className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200"
                >
                  <div>
                    <div className="font-medium">
                      Pagamento {update.asaas_id}
                    </div>
                    <div className="text-sm text-gray-600">
                      {update.old_status} → {update.new_status}
                    </div>
                    <div className="text-xs text-gray-500">
                      Serviço: {update.service_type}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Atualizado
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(update.updated_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações Técnicas */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Webhooks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">URL do Webhook:</h4>
              <code className="bg-gray-100 p-2 rounded block">
                https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-process-webhook
              </code>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Eventos Monitorados:</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-2 rounded">PAYMENT_CONFIRMED</div>
                <div className="bg-gray-50 p-2 rounded">PAYMENT_RECEIVED</div>
                <div className="bg-gray-50 p-2 rounded">PAYMENT_OVERDUE</div>
                <div className="bg-gray-50 p-2 rounded">PAYMENT_REFUNDED</div>
                <div className="bg-gray-50 p-2 rounded">PAYMENT_CHARGEBACK_REQUESTED</div>
                <div className="bg-gray-50 p-2 rounded">PAYMENT_AWAITING_RISK_ANALYSIS</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Ações Automáticas:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li><strong>Filiação:</strong> Ativa assinatura do usuário</li>
                <li><strong>Certidão:</strong> Marca como paga e inicia processamento</li>
                <li><strong>Regularização:</strong> Atualiza status da solicitação</li>
                <li><strong>Evento:</strong> Confirma inscrição no evento</li>
                <li><strong>Taxa Anual:</strong> Atualiza situação de adimplência</li>
                <li><strong>Splits:</strong> Processa comissões de afiliados</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Segurança:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Validação de token de autenticação</li>
                <li>Verificação de estrutura do payload</li>
                <li>Log de auditoria de todos os webhooks</li>
                <li>Retry automático pelo Asaas em caso de falha</li>
                <li>Prevenção de processamento duplicado</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};