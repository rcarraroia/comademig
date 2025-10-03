/**
 * Exemplo de uso do sistema de pagamentos PIX
 * Demonstra como integrar o hook useAsaasPixPayments
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAsaasPixPayments, type ServiceType } from '@/hooks/useAsaasPixPayments';
import { PixDiscountBanner } from '@/components/checkout/PixDiscountBanner';
import CheckoutPIX from '@/components/checkout/CheckoutPIX';

export const PixPaymentExample: React.FC = () => {
  const [formData, setFormData] = useState({
    value: 100,
    description: 'Pagamento de teste',
    service_type: 'filiacao' as ServiceType,
    service_data: { test: true }
  });
  
  const [pixResult, setPixResult] = useState<any>(null);
  const { createPixPayment, calculatePixDiscount, isLoading } = useAsaasPixPayments();

  const handleCreatePixPayment = async () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1); // Vencimento amanhã

    const result = await createPixPayment({
      value: formData.value,
      dueDate: dueDate.toISOString().split('T')[0],
      description: formData.description,
      service_type: formData.service_type,
      service_data: formData.service_data,
      externalReference: `test_${Date.now()}`
    });

    if (result) {
      setPixResult(result);
    }
  };

  const discount = calculatePixDiscount(formData.value);

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Teste de Pagamento PIX - Asaas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição do pagamento"
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

          {/* Banner de desconto PIX */}
          <PixDiscountBanner
            originalValue={discount.originalValue}
            discountedValue={discount.discountedValue}
            discountPercentage={discount.discountPercentage}
          />

          <Button 
            onClick={handleCreatePixPayment} 
            disabled={isLoading || formData.value <= 0}
            className="w-full"
          >
            {isLoading ? 'Gerando PIX...' : 'Criar Pagamento PIX'}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado do PIX */}
      {pixResult && (
        <CheckoutPIX
          paymentData={{
            payment_id: pixResult.payment_id,
            amount: pixResult.discounted_value,
            pix_qr_code: pixResult.qr_code,
            pix_payload: pixResult.copy_paste_code,
            due_date: pixResult.expiration_date,
            original_value: pixResult.original_value,
            discounted_value: pixResult.discounted_value,
            discount_percentage: pixResult.discount_percentage
          }}
          onPaymentConfirmed={(paymentId) => {
            console.log('Pagamento confirmado:', paymentId);
            alert('Pagamento PIX confirmado com sucesso!');
          }}
          onPaymentFailed={(paymentId) => {
            console.log('Pagamento falhou:', paymentId);
            alert('Pagamento PIX não foi confirmado.');
          }}
        />
      )}

      {/* Informações de debug */}
      {pixResult && (
        <Card>
          <CardHeader>
            <CardTitle>Debug - Dados do PIX</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
              {JSON.stringify(pixResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};