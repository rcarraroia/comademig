/**
 * Exemplo de uso do sistema de pagamentos com boleto
 * Demonstra como integrar o useAsaasBoletoPayments e CheckoutBoleto
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAsaasBoletoPayments, type ServiceType } from '@/hooks/useAsaasBoletoPayments';
import { CheckoutBoleto } from '@/components/checkout/CheckoutBoleto';

export const BoletoPaymentExample: React.FC = () => {
  const [formData, setFormData] = useState({
    value: 200,
    description: 'Boleto de teste',
    service_type: 'filiacao' as ServiceType,
    service_data: { test: true },
    daysUntilDue: 3,
    addFine: false,
    fineValue: 2,
    fineType: 'PERCENTAGE' as 'FIXED' | 'PERCENTAGE',
    addInterest: false,
    interestValue: 1
  });
  
  const [boletoResult, setBoletoResult] = useState<any>(null);
  const { createBoletoPayment, calculateDueDate, isLoading } = useAsaasBoletoPayments();

  const handleCreateBoleto = async () => {
    const dueDate = calculateDueDate(formData.daysUntilDue);

    const result = await createBoletoPayment({
      value: formData.value,
      dueDate,
      description: formData.description,
      service_type: formData.service_type,
      service_data: formData.service_data,
      externalReference: `boleto_test_${Date.now()}`,
      fine: formData.addFine ? {
        value: formData.fineValue,
        type: formData.fineType
      } : undefined,
      interest: formData.addInterest ? {
        value: formData.interestValue,
        type: 'PERCENTAGE'
      } : undefined
    });

    if (result) {
      setBoletoResult(result);
    }
  };

  const suggestedDueDate = calculateDueDate(formData.daysUntilDue);

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Teste de Boleto Bancário - Asaas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="value">Valor (R$)</Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                min="1"
                step="0.01"
              />
            </div>

            <div>
              <Label htmlFor="daysUntilDue">Dias até Vencimento</Label>
              <Select 
                value={formData.daysUntilDue.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, daysUntilDue: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 dia</SelectItem>
                  <SelectItem value="2">2 dias</SelectItem>
                  <SelectItem value="3">3 dias (padrão)</SelectItem>
                  <SelectItem value="5">5 dias</SelectItem>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="15">15 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Vencimento: {new Date(suggestedDueDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição do boleto"
            />
          </div>

          <div>
            <Label htmlFor="service_type">Tipo de Serviço</Label>
            <Select 
              value={formData.service_type} 
              onValueChange={(value: ServiceType) => setFormData(prev => ({ ...prev, service_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="filiacao">Filiação</SelectItem>
                <SelectItem value="certidao">Certidão</SelectItem>
                <SelectItem value="regularizacao">Regularização</SelectItem>
                <SelectItem value="evento">Evento</SelectItem>
                <SelectItem value="taxa_anual">Taxa Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Configurações de Multa */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="addFine"
                checked={formData.addFine}
                onChange={(e) => setFormData(prev => ({ ...prev, addFine: e.target.checked }))}
              />
              <Label htmlFor="addFine">Adicionar multa por atraso</Label>
            </div>

            {formData.addFine && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div>
                  <Label htmlFor="fineValue">Valor da Multa</Label>
                  <Input
                    id="fineValue"
                    type="number"
                    value={formData.fineValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, fineValue: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="fineType">Tipo</Label>
                  <Select 
                    value={formData.fineType} 
                    onValueChange={(value: 'FIXED' | 'PERCENTAGE') => setFormData(prev => ({ ...prev, fineType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
                      <SelectItem value="FIXED">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Configurações de Juros */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="addInterest"
                checked={formData.addInterest}
                onChange={(e) => setFormData(prev => ({ ...prev, addInterest: e.target.checked }))}
              />
              <Label htmlFor="addInterest">Adicionar juros por atraso</Label>
            </div>

            {formData.addInterest && (
              <div className="ml-6">
                <Label htmlFor="interestValue">Juros ao Mês (%)</Label>
                <Input
                  id="interestValue"
                  type="number"
                  value={formData.interestValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, interestValue: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="20"
                  step="0.1"
                />
              </div>
            )}
          </div>

          <Button 
            onClick={handleCreateBoleto} 
            disabled={isLoading || formData.value <= 0}
            className="w-full"
          >
            {isLoading ? 'Gerando Boleto...' : 'Criar Boleto Bancário'}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado do Boleto */}
      {boletoResult && (
        <CheckoutBoleto
          boletoData={{
            payment_id: boletoResult.payment_id,
            asaas_id: boletoResult.asaas_id,
            boleto_url: boletoResult.boleto_url,
            linha_digitavel: boletoResult.linha_digitavel,
            nosso_numero: boletoResult.nosso_numero,
            due_date: boletoResult.due_date,
            value: boletoResult.value
          }}
          onPaymentConfirmed={(paymentId) => {
            console.log('Boleto pago:', paymentId);
            alert('Boleto pago com sucesso!');
          }}
          onPaymentOverdue={(paymentId) => {
            console.log('Boleto vencido:', paymentId);
            alert('Boleto venceu. Gere um novo boleto.');
          }}
        />
      )}

      {/* Informações de Debug */}
      {boletoResult && (
        <Card>
          <CardHeader>
            <CardTitle>Debug - Dados do Boleto</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
              {JSON.stringify(boletoResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Informações sobre Boleto */}
      <Card>
        <CardHeader>
          <CardTitle>Informações sobre Boleto Bancário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Características do Boleto:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Prazo de pagamento configurável (1 a 30 dias)</li>
                <li>Multa e juros opcionais por atraso</li>
                <li>Linha digitável para pagamento online</li>
                <li>PDF para impressão e pagamento presencial</li>
                <li>Confirmação automática em até 2 dias úteis</li>
                <li>Segunda via disponível até o vencimento</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Como testar:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Configure o valor e vencimento desejados</li>
                <li>Adicione multa/juros se necessário</li>
                <li>Gere o boleto e copie a linha digitável</li>
                <li>Em ambiente sandbox, o pagamento deve ser simulado</li>
                <li>Use o polling para verificar mudanças de status</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};