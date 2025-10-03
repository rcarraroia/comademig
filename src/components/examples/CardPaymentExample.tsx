/**
 * Exemplo de uso do sistema de pagamentos com cartão
 * Demonstra como integrar o CreditCardForm e CardPaymentResult
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCardForm } from '@/components/checkout/CreditCardForm';
import { CardPaymentResult } from '@/components/checkout/CardPaymentResult';

export const CardPaymentExample: React.FC = () => {
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [showForm, setShowForm] = useState(true);

  // Dados de exemplo para o pagamento
  const examplePayment = {
    amount: 150.00,
    description: 'Filiação COMADEMIG - Teste',
    serviceType: 'filiacao' as const,
    serviceData: {
      memberType: 'veterinario',
      plan: 'anual',
      test: true
    }
  };

  const handlePaymentSuccess = (result: any) => {
    console.log('Pagamento com cartão bem-sucedido:', result);
    setPaymentResult(result);
    setShowForm(false);
  };

  const handlePaymentError = (error: string) => {
    console.error('Erro no pagamento com cartão:', error);
    alert(`Erro: ${error}`);
  };

  const handleStatusChange = (status: string) => {
    console.log('Status do pagamento alterado:', status);
    if (paymentResult) {
      setPaymentResult(prev => ({ ...prev, status }));
    }
  };

  const resetExample = () => {
    setPaymentResult(null);
    setShowForm(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Teste de Pagamento com Cartão - Asaas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Dados do Pagamento de Teste</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <div>Valor: R$ {examplePayment.amount.toFixed(2).replace('.', ',')}</div>
                <div>Descrição: {examplePayment.description}</div>
                <div>Tipo: {examplePayment.serviceType}</div>
              </div>
            </div>

            {paymentResult && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Resultado do Pagamento</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <div>ID: {paymentResult.asaas_id}</div>
                  <div>Status: {paymentResult.status}</div>
                  {paymentResult.installment_count > 1 && (
                    <div>Parcelas: {paymentResult.installment_count}x de R$ {paymentResult.installment_value?.toFixed(2).replace('.', ',')}</div>
                  )}
                </div>
              </div>
            )}

            {paymentResult && (
              <Button onClick={resetExample} variant="outline">
                Fazer Novo Teste
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <CreditCardForm
          amount={examplePayment.amount}
          description={examplePayment.description}
          serviceType={examplePayment.serviceType}
          serviceData={examplePayment.serviceData}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
          maxInstallments={12}
        />
      )}

      {paymentResult && (
        <CardPaymentResult
          paymentResult={paymentResult}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Informações de Teste */}
      <Card>
        <CardHeader>
          <CardTitle>Cartões de Teste (Sandbox)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Cartões para Teste (use estes dados):</h4>
              <div className="space-y-2">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium">Visa - Aprovado</div>
                  <div>Número: 4000 0000 0000 0010</div>
                  <div>Validade: 12/2030 | CCV: 123</div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium">Mastercard - Aprovado</div>
                  <div>Número: 5555 5555 5555 4444</div>
                  <div>Validade: 12/2030 | CCV: 123</div>
                </div>
                
                <div className="bg-red-50 p-3 rounded">
                  <div className="font-medium">Visa - Recusado</div>
                  <div>Número: 4000 0000 0000 0002</div>
                  <div>Validade: 12/2030 | CCV: 123</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Dados do Portador (use qualquer):</h4>
              <div className="bg-gray-50 p-3 rounded">
                <div>Nome: João da Silva</div>
                <div>CPF: 123.456.789-09</div>
                <div>Email: teste@exemplo.com</div>
                <div>Telefone: (11) 99999-9999</div>
                <div>CEP: 01310-100</div>
                <div>Número: 123</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};