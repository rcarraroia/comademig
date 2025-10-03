/**
 * Hook para pagamentos com cartão de crédito via Asaas
 * Integra com Edge Function para tokenização e processamento seguro
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAsaasCustomers } from '@/hooks/useAsaasCustomers';

export type ServiceType = 'filiacao' | 'certidao' | 'regularizacao' | 'evento' | 'taxa_anual';

export interface CreditCardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface CreditCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  addressComplement?: string;
  phone: string;
  mobilePhone?: string;
}

export interface CreateCardPaymentData {
  value: number;
  dueDate: string;
  description: string;
  service_type: ServiceType;
  service_data: Record<string, any>;
  externalReference?: string;
  installmentCount?: number;
  creditCard: CreditCardData;
  creditCardHolderInfo: CreditCardHolderInfo;
  saveCard?: boolean;
}

export interface CardPaymentResult {
  success: boolean;
  payment_id: string;
  asaas_id: string;
  status: string;
  invoice_url?: string;
  credit_card_token?: string;
  installment_count?: number;
  installment_value?: number;
  message: string;
}

export const useAsaasCardPayments = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { ensureCustomer } = useAsaasCustomers();

  /**
   * Processa pagamento com cartão de crédito
   */
  const processCardPayment = async (paymentData: CreateCardPaymentData): Promise<CardPaymentResult | null> => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    
    try {
      console.log('Iniciando processamento de cartão...');
      
      // 1. Garantir que o usuário tem um customer_id no Asaas
      const customerId = await ensureCustomer();
      if (!customerId) {
        throw new Error('Não foi possível configurar cliente no sistema de pagamentos');
      }

      console.log('Cliente Asaas confirmado:', customerId);
      console.log('Valor:', paymentData.value);
      console.log('Parcelas:', paymentData.installmentCount || 1);

      // 2. Processar pagamento com cartão via Edge Function
      const { data, error } = await supabase.functions.invoke('asaas-process-card', {
        body: {
          customer_id: customerId,
          user_id: user.id,
          service_type: paymentData.service_type,
          service_data: {
            type: paymentData.service_type,
            details: paymentData.service_data
          },
          payment_data: {
            value: paymentData.value,
            dueDate: paymentData.dueDate,
            description: paymentData.description,
            externalReference: paymentData.externalReference,
            installmentCount: paymentData.installmentCount
          },
          credit_card: paymentData.creditCard,
          credit_card_holder_info: paymentData.creditCardHolderInfo,
          save_card: paymentData.saveCard
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao comunicar com o servidor');
      }

      if (!data.success) {
        throw new Error(data.message || 'Erro ao processar pagamento com cartão');
      }

      console.log('Pagamento com cartão processado:', data.asaas_id);
      console.log('Status:', data.status);

      // Mensagem de sucesso baseada no status
      const successMessage = data.status === 'CONFIRMED' 
        ? 'Pagamento aprovado com sucesso!'
        : 'Pagamento processado, aguardando confirmação.';

      toast({
        title: "Cartão Processado!",
        description: successMessage,
      });

      return data as CardPaymentResult;

    } catch (error) {
      console.error('Erro ao processar cartão:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "Erro no Cartão",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Calcula valor das parcelas
   */
  const calculateInstallments = (totalValue: number, installmentCount: number = 1) => {
    const installmentValue = totalValue / installmentCount;
    
    return {
      totalValue,
      installmentCount,
      installmentValue: Math.round(installmentValue * 100) / 100,
      totalWithInterest: totalValue // Asaas não cobra juros por padrão
    };
  };

  /**
   * Valida dados do cartão
   */
  const validateCreditCard = (cardData: CreditCardData): string[] => {
    const errors: string[] = [];

    if (!cardData.holderName || cardData.holderName.trim().length < 2) {
      errors.push('Nome do portador é obrigatório');
    }

    if (!cardData.number || cardData.number.replace(/\D/g, '').length < 13) {
      errors.push('Número do cartão inválido');
    }

    if (!cardData.expiryMonth || !cardData.expiryYear) {
      errors.push('Data de expiração é obrigatória');
    } else {
      const month = parseInt(cardData.expiryMonth);
      const year = parseInt(cardData.expiryYear);
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      if (month < 1 || month > 12) {
        errors.push('Mês de expiração inválido');
      }
      
      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        errors.push('Cartão expirado');
      }
    }

    if (!cardData.ccv || cardData.ccv.length < 3) {
      errors.push('CCV inválido');
    }

    return errors;
  };

  /**
   * Valida dados do portador
   */
  const validateCardHolder = (holderInfo: CreditCardHolderInfo): string[] => {
    const errors: string[] = [];

    if (!holderInfo.name || holderInfo.name.trim().length < 2) {
      errors.push('Nome do portador é obrigatório');
    }

    if (!holderInfo.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(holderInfo.email)) {
      errors.push('Email válido é obrigatório');
    }

    if (!holderInfo.cpfCnpj) {
      errors.push('CPF/CNPJ é obrigatório');
    }

    if (!holderInfo.postalCode || holderInfo.postalCode.replace(/\D/g, '').length !== 8) {
      errors.push('CEP deve ter 8 dígitos');
    }

    if (!holderInfo.addressNumber) {
      errors.push('Número do endereço é obrigatório');
    }

    if (!holderInfo.phone) {
      errors.push('Telefone é obrigatório');
    }

    return errors;
  };

  /**
   * Verifica status de pagamento com cartão
   */
  const checkCardPaymentStatus = async (paymentId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('asaas_cobrancas' as any)
        .select('status')
        .eq('id', paymentId)
        .single();

      if (error) {
        console.error('Erro ao verificar status:', error);
        return null;
      }

      return (data as any)?.status || null;
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      return null;
    }
  };

  /**
   * Busca dados de pagamento com cartão por ID
   */
  const getCardPaymentData = async (paymentId: string) => {
    try {
      const { data, error } = await supabase
        .from('asaas_cobrancas' as any)
        .select(`
          id,
          asaas_id,
          valor,
          net_value,
          descricao,
          status,
          data_vencimento,
          data_pagamento,
          installment_number,
          credit_card_number,
          credit_card_brand,
          credit_card_token,
          service_type,
          service_data,
          url_pagamento,
          created_at
        `)
        .eq('id', paymentId)
        .single();

      if (error) {
        throw new Error('Pagamento não encontrado');
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar dados do pagamento:', error);
      return null;
    }
  };

  return {
    processCardPayment,
    calculateInstallments,
    validateCreditCard,
    validateCardHolder,
    checkCardPaymentStatus,
    getCardPaymentData,
    isLoading
  };
};