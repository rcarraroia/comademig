/**
 * Hook para pagamentos com boleto bancário via Asaas
 * Integra com Edge Function para gerar boletos com linha digitável
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAsaasCustomers } from '@/hooks/useAsaasCustomers';

export type ServiceType = 'filiacao' | 'certidao' | 'regularizacao' | 'evento' | 'taxa_anual';

export interface CreateBoletoPaymentData {
  value: number;
  dueDate: string;
  description: string;
  service_type: ServiceType;
  service_data: Record<string, any>;
  externalReference?: string;
  fine?: {
    value: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  interest?: {
    value: number;
    type: 'PERCENTAGE';
  };
}

export interface BoletoPaymentResult {
  success: boolean;
  payment_id: string;
  asaas_id: string;
  boleto_url: string;
  linha_digitavel: string;
  nosso_numero: string;
  due_date: string;
  value: number;
  message: string;
}

export const useAsaasBoletoPayments = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { ensureCustomer } = useAsaasCustomers();

  /**
   * Cria boleto bancário
   */
  const createBoletoPayment = async (paymentData: CreateBoletoPaymentData): Promise<BoletoPaymentResult | null> => {
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
      console.log('Iniciando criação de boleto...');
      
      // 1. Garantir que o usuário tem um customer_id no Asaas
      const customerId = await ensureCustomer();
      if (!customerId) {
        throw new Error('Não foi possível configurar cliente no sistema de pagamentos');
      }

      console.log('Cliente Asaas confirmado:', customerId);
      console.log('Valor do boleto:', paymentData.value);
      console.log('Vencimento:', paymentData.dueDate);

      // 2. Criar boleto via Edge Function
      const { data, error } = await supabase.functions.invoke('asaas-create-boleto', {
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
            fine: paymentData.fine,
            interest: paymentData.interest
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao comunicar com o servidor');
      }

      if (!data.success) {
        throw new Error(data.message || 'Erro ao gerar boleto');
      }

      console.log('Boleto criado com sucesso:', data.asaas_id);

      toast({
        title: "Boleto Gerado!",
        description: `Boleto criado com vencimento em ${new Date(data.due_date).toLocaleDateString('pt-BR')}`,
      });

      return data as BoletoPaymentResult;

    } catch (error) {
      console.error('Erro ao criar boleto:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "Erro",
        description: `Erro ao gerar boleto: ${errorMessage}`,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Calcula data de vencimento sugerida (padrão: 3 dias úteis)
   */
  const calculateDueDate = (daysFromNow: number = 3): string => {
    const date = new Date();
    let addedDays = 0;
    
    while (addedDays < daysFromNow) {
      date.setDate(date.getDate() + 1);
      
      // Pular fins de semana
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        addedDays++;
      }
    }
    
    return date.toISOString().split('T')[0];
  };

  /**
   * Valida data de vencimento
   */
  const validateDueDate = (dueDate: string): boolean => {
    const date = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return date >= today;
  };

  /**
   * Verifica status de pagamento do boleto
   */
  const checkBoletoPaymentStatus = async (paymentId: string): Promise<string | null> => {
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
      console.error('Erro ao verificar status do boleto:', error);
      return null;
    }
  };

  /**
   * Busca dados de boleto por ID
   */
  const getBoletoPaymentData = async (paymentId: string) => {
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
          original_due_date,
          data_pagamento,
          linha_digitavel,
          nosso_numero,
          url_pagamento,
          invoice_url,
          service_type,
          service_data,
          created_at
        `)
        .eq('id', paymentId)
        .single();

      if (error) {
        throw new Error('Boleto não encontrado');
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar dados do boleto:', error);
      return null;
    }
  };

  /**
   * Gera segunda via do boleto
   */
  const generateSecondCopy = async (paymentId: string): Promise<BoletoPaymentResult | null> => {
    try {
      const boletoData = await getBoletoPaymentData(paymentId);
      
      if (!boletoData) {
        throw new Error('Boleto não encontrado');
      }

      // Se o boleto ainda está válido, retorna os dados existentes
      const boleto = boletoData as any;
      if (boleto.status === 'PENDING' && new Date(boleto.data_vencimento) >= new Date()) {
        return {
          success: true,
          payment_id: boleto.id,
          asaas_id: boleto.asaas_id,
          boleto_url: boleto.url_pagamento,
          linha_digitavel: boleto.linha_digitavel,
          nosso_numero: boleto.nosso_numero,
          due_date: boleto.data_vencimento,
          value: boleto.valor,
          message: 'Segunda via do boleto'
        };
      }

      throw new Error('Boleto vencido ou já pago. Gere um novo boleto.');

    } catch (error) {
      console.error('Erro ao gerar segunda via:', error);
      
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao gerar segunda via',
        variant: "destructive",
      });
      
      return null;
    }
  };

  /**
   * Formata linha digitável para exibição
   */
  const formatLinhaDigitavel = (linha: string): string => {
    if (!linha) return '';
    
    // Remove espaços e caracteres especiais
    const numbers = linha.replace(/\D/g, '');
    
    // Formata no padrão: 00000.00000 00000.000000 00000.000000 0 00000000000000
    if (numbers.length === 47) {
      return `${numbers.slice(0, 5)}.${numbers.slice(5, 10)} ${numbers.slice(10, 15)}.${numbers.slice(15, 21)} ${numbers.slice(21, 26)}.${numbers.slice(26, 32)} ${numbers.slice(32, 33)} ${numbers.slice(33)}`;
    }
    
    return linha;
  };

  return {
    createBoletoPayment,
    calculateDueDate,
    validateDueDate,
    checkBoletoPaymentStatus,
    getBoletoPaymentData,
    generateSecondCopy,
    formatLinhaDigitavel,
    isLoading
  };
};