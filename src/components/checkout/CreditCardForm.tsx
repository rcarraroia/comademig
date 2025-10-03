/**
 * Formulário de cartão de crédito com validação e formatação
 * Integra com useAsaasCardPayments para processamento seguro
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, Lock, User, MapPin, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAsaasCardPayments, type CreditCardData, type CreditCardHolderInfo } from '@/hooks/useAsaasCardPayments';

interface CreditCardFormProps {
  amount: number;
  description: string;
  serviceType: 'filiacao' | 'certidao' | 'regularizacao' | 'evento' | 'taxa_anual';
  serviceData: Record<string, any>;
  onPaymentSuccess?: (result: any) => void;
  onPaymentError?: (error: string) => void;
  maxInstallments?: number;
}

export const CreditCardForm: React.FC<CreditCardFormProps> = ({
  amount,
  description,
  serviceType,
  serviceData,
  onPaymentSuccess,
  onPaymentError,
  maxInstallments = 12
}) => {
  const [cardData, setCardData] = useState<CreditCardData>({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: ''
  });

  const [holderInfo, setHolderInfo] = useState<CreditCardHolderInfo>({
    name: '',
    email: '',
    cpfCnpj: '',
    postalCode: '',
    addressNumber: '',
    addressComplement: '',
    phone: '',
    mobilePhone: ''
  });

  const [installments, setInstallments] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);

  const { 
    processCardPayment, 
    calculateInstallments, 
    validateCreditCard, 
    validateCardHolder, 
    isLoading 
  } = useAsaasCardPayments();

  // Formatação do número do cartão
  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  // Formatação do CPF/CNPJ
  const formatCpfCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  // Formatação do CEP
  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  // Formatação do telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  // Calcular parcelas
  const installmentData = calculateInstallments(amount, installments);

  // Validar formulário
  const validateForm = () => {
    const cardErrors = validateCreditCard(cardData);
    const holderErrors = validateCardHolder(holderInfo);
    const allErrors = [...cardErrors, ...holderErrors];
    
    setErrors(allErrors);
    return allErrors.length === 0;
  };

  // Processar pagamento
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1); // Vencimento amanhã

      const result = await processCardPayment({
        value: amount,
        dueDate: dueDate.toISOString().split('T')[0],
        description,
        service_type: serviceType,
        service_data: serviceData,
        installmentCount: installments,
        creditCard: cardData,
        creditCardHolderInfo: holderInfo,
        externalReference: `card_${Date.now()}`
      });

      if (result) {
        onPaymentSuccess?.(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar pagamento';
      onPaymentError?.(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Resumo do Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Pagamento com Cartão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold">
                R$ {amount.toFixed(2).replace('.', ',')}
              </div>
              <div className="text-sm text-gray-600">{description}</div>
            </div>
            <Badge variant="secondary">
              <Lock className="w-3 h-3 mr-1" />
              Seguro
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Dados do Cartão */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados do Cartão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="holderName">Nome no Cartão *</Label>
            <Input
              id="holderName"
              value={cardData.holderName}
              onChange={(e) => setCardData(prev => ({ ...prev, holderName: e.target.value.toUpperCase() }))}
              placeholder="NOME COMO ESTÁ NO CARTÃO"
              maxLength={50}
              required
            />
          </div>

          <div>
            <Label htmlFor="cardNumber">Número do Cartão *</Label>
            <Input
              id="cardNumber"
              value={formatCardNumber(cardData.number)}
              onChange={(e) => setCardData(prev => ({ ...prev, number: e.target.value.replace(/\D/g, '') }))}
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="expiryMonth">Mês *</Label>
              <Select value={cardData.expiryMonth} onValueChange={(value) => setCardData(prev => ({ ...prev, expiryMonth: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                      {month.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expiryYear">Ano *</Label>
              <Select value={cardData.expiryYear} onValueChange={(value) => setCardData(prev => ({ ...prev, expiryYear: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="ccv">CCV *</Label>
              <Input
                id="ccv"
                type="password"
                value={cardData.ccv}
                onChange={(e) => setCardData(prev => ({ ...prev, ccv: e.target.value.replace(/\D/g, '') }))}
                placeholder="000"
                maxLength={4}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados do Portador */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Dados do Portador
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="holderFullName">Nome Completo *</Label>
              <Input
                id="holderFullName"
                value={holderInfo.name}
                onChange={(e) => setHolderInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo do portador"
                required
              />
            </div>

            <div>
              <Label htmlFor="holderEmail">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="holderEmail"
                  type="email"
                  value={holderInfo.email}
                  onChange={(e) => setHolderInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="holderCpfCnpj">CPF/CNPJ *</Label>
              <Input
                id="holderCpfCnpj"
                value={formatCpfCnpj(holderInfo.cpfCnpj)}
                onChange={(e) => setHolderInfo(prev => ({ ...prev, cpfCnpj: e.target.value.replace(/\D/g, '') }))}
                placeholder="000.000.000-00"
                required
              />
            </div>

            <div>
              <Label htmlFor="holderPhone">Telefone *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="holderPhone"
                  value={formatPhone(holderInfo.phone)}
                  onChange={(e) => setHolderInfo(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                  placeholder="(11) 99999-9999"
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="holderCep">CEP *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="holderCep"
                  value={formatCep(holderInfo.postalCode)}
                  onChange={(e) => setHolderInfo(prev => ({ ...prev, postalCode: e.target.value.replace(/\D/g, '') }))}
                  placeholder="00000-000"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="holderAddressNumber">Número *</Label>
              <Input
                id="holderAddressNumber"
                value={holderInfo.addressNumber}
                onChange={(e) => setHolderInfo(prev => ({ ...prev, addressNumber: e.target.value }))}
                placeholder="123"
                required
              />
            </div>

            <div>
              <Label htmlFor="holderComplement">Complemento</Label>
              <Input
                id="holderComplement"
                value={holderInfo.addressComplement || ''}
                onChange={(e) => setHolderInfo(prev => ({ ...prev, addressComplement: e.target.value }))}
                placeholder="Apto 45"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parcelamento */}
      {maxInstallments > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Parcelamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="installments">Número de Parcelas</Label>
                <Select value={installments.toString()} onValueChange={(value) => setInstallments(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: Math.min(maxInstallments, 12) }, (_, i) => i + 1).map(count => {
                      const installmentCalc = calculateInstallments(amount, count);
                      return (
                        <SelectItem key={count} value={count.toString()}>
                          {count}x de R$ {installmentCalc.installmentValue.toFixed(2).replace('.', ',')}
                          {count === 1 ? ' à vista' : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm">
                  <div>Parcelas: {installmentData.installmentCount}x</div>
                  <div>Valor da parcela: R$ {installmentData.installmentValue.toFixed(2).replace('.', ',')}</div>
                  <div className="font-semibold">Total: R$ {installmentData.totalValue.toFixed(2).replace('.', ',')}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Erros de Validação */}
      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-800">
              <div className="font-semibold mb-2">Corrija os seguintes erros:</div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão de Pagamento */}
      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full h-12 text-lg"
      >
        {isLoading ? (
          'Processando...'
        ) : (
          `Pagar R$ ${installmentData.installmentValue.toFixed(2).replace('.', ',')} ${installments > 1 ? `(${installments}x)` : ''}`
        )}
      </Button>

      <div className="text-xs text-gray-500 text-center">
        <Lock className="w-3 h-3 inline mr-1" />
        Seus dados estão protegidos com criptografia SSL
      </div>
    </form>
  );
};