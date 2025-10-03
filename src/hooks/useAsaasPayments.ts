import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAsaasCustomers } from '@/hooks/useAsaasCustomers';
import { useAsaasPixPayments } from '@/hooks/useAsaasPixPayments';
import { useAsaasCardPayments } from '@/hooks/useAsaasCardPayments';
import { useAsaasBoletoPayments } from '@/hooks/useAsaasBoletoPayments';

export interface PaymentData {
  customer: string;
  billingType: string;
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
}

export interface PaymentResponse {
  id: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCode?: string;
  pixCopyAndPaste?: string;
}

export const useAsaasPayments = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { ensureCustomer } = useAsaasCustomers();
  const { createPixPayment, calculatePixDiscount } = useAsaasPixPayments();
  const { processCardPayment, calculateInstallments } = useAsaasCardPayments();
  const { createBoletoPayment, calculateDueDate } = useAsaasBoletoPayments();

  const createPayment = async (paymentData: Omit<PaymentData, 'customer'>): Promise<PaymentResponse | null> => {
    setIsLoading(true);
    
    try {
      // 1. Garantir que o usuário tem um customer_id no Asaas
      console.log('Garantindo que cliente existe no Asaas...');
      const customerId = await ensureCustomer();
      
      if (!customerId) {
        throw new Error('Não foi possível configurar cliente no sistema de pagamentos');
      }

      console.log('Cliente Asaas confirmado:', customerId);

      // 2. Criar pagamento com customer_id real
      const fullPaymentData: PaymentData = {
        ...paymentData,
        customer: customerId
      };

      // TODO: Implementar Edge Function para criar pagamento real
      console.log('Dados do pagamento com cliente:', fullPaymentData);
      
      // Por enquanto, simulação melhorada com customer_id real
      const mockResponse: PaymentResponse = {
        id: `asaas_${Date.now()}`,
        invoiceUrl: 'https://example.com/invoice',
        bankSlipUrl: 'https://example.com/boleto',
        pixQrCode: 'mock_qr_code',
        pixCopyAndPaste: 'mock_pix_code'
      };

      toast({
        title: "Pagamento criado",
        description: "Cliente configurado e pagamento criado com sucesso",
      });

      return mockResponse;
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "Erro",
        description: `Erro ao criar pagamento: ${errorMessage}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cria pagamento PIX com desconto automático
   */
  const createPixPaymentWithDiscount = async (paymentData: Omit<PaymentData, 'customer' | 'billingType'> & {
    service_type: 'filiacao' | 'certidao' | 'regularizacao' | 'evento' | 'taxa_anual';
    service_data: Record<string, any>;
  }) => {
    return await createPixPayment({
      value: paymentData.value,
      dueDate: paymentData.dueDate,
      description: paymentData.description || 'Pagamento via PIX',
      service_type: paymentData.service_type,
      service_data: paymentData.service_data,
      externalReference: paymentData.externalReference
    });
  };

  /**
   * Processa pagamento com cartão de crédito
   */
  const processCardPaymentWithData = async (paymentData: Omit<PaymentData, 'customer' | 'billingType'> & {
    service_type: 'filiacao' | 'certidao' | 'regularizacao' | 'evento' | 'taxa_anual';
    service_data: Record<string, any>;
    creditCard: any;
    creditCardHolderInfo: any;
    installmentCount?: number;
  }) => {
    return await processCardPayment({
      value: paymentData.value,
      dueDate: paymentData.dueDate,
      description: paymentData.description || 'Pagamento com cartão',
      service_type: paymentData.service_type,
      service_data: paymentData.service_data,
      installmentCount: paymentData.installmentCount,
      creditCard: paymentData.creditCard,
      creditCardHolderInfo: paymentData.creditCardHolderInfo,
      externalReference: paymentData.externalReference
    });
  };

  /**
   * Cria boleto bancário
   */
  const createBoletoPaymentWithData = async (paymentData: Omit<PaymentData, 'customer' | 'billingType'> & {
    service_type: 'filiacao' | 'certidao' | 'regularizacao' | 'evento' | 'taxa_anual';
    service_data: Record<string, any>;
    fine?: { value: number; type: 'FIXED' | 'PERCENTAGE' };
    interest?: { value: number; type: 'PERCENTAGE' };
  }) => {
    return await createBoletoPayment({
      value: paymentData.value,
      dueDate: paymentData.dueDate,
      description: paymentData.description || 'Boleto bancário',
      service_type: paymentData.service_type,
      service_data: paymentData.service_data,
      externalReference: paymentData.externalReference,
      fine: paymentData.fine,
      interest: paymentData.interest
    });
  };

  return {
    createPayment,
    createPixPaymentWithDiscount,
    processCardPaymentWithData,
    createBoletoPaymentWithData,
    calculatePixDiscount,
    calculateInstallments,
    calculateDueDate,
    isLoading
  };
};