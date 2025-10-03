/**
 * Hook para pagamentos PIX via Asaas
 * Integra com Edge Function para criar cobranças PIX com desconto automático
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAsaasCustomers } from '@/hooks/useAsaasCustomers';

export type ServiceType = 'filiacao' | 'certidao' | 'regularizacao' | 'evento' | 'taxa_anual';

export interface CreatePixPaymentData {
    value: number;
    dueDate: string;
    description: string;
    service_type: ServiceType;
    service_data: Record<string, any>;
    externalReference?: string;
}

export interface PixPaymentResult {
    success: boolean;
    payment_id: string;
    asaas_id: string;
    qr_code: string;
    copy_paste_code: string;
    expiration_date: string;
    original_value: number;
    discounted_value: number;
    discount_percentage: number;
    message: string;
}

export const useAsaasPixPayments = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    const { ensureCustomer } = useAsaasCustomers();

    /**
     * Cria pagamento PIX com desconto automático de 5%
     */
    const createPixPayment = async (paymentData: CreatePixPaymentData): Promise<PixPaymentResult | null> => {
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
            console.log('Iniciando criação de pagamento PIX...');

            // 1. Garantir que o usuário tem um customer_id no Asaas
            const customerId = await ensureCustomer();
            if (!customerId) {
                throw new Error('Não foi possível configurar cliente no sistema de pagamentos');
            }

            console.log('Cliente Asaas confirmado:', customerId);
            console.log('Valor original:', paymentData.value);

            // 2. Criar pagamento PIX via Edge Function
            const { data, error } = await supabase.functions.invoke('asaas-create-pix-payment', {
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
                        externalReference: paymentData.externalReference
                    }
                }
            });

            if (error) {
                throw new Error(error.message || 'Erro ao comunicar com o servidor');
            }

            if (!data.success) {
                throw new Error(data.message || 'Erro ao criar pagamento PIX');
            }

            console.log('Pagamento PIX criado com sucesso:', data.asaas_id);
            console.log('Valor com desconto:', data.discounted_value);

            toast({
                title: "PIX Gerado!",
                description: `Pagamento criado com 5% de desconto. Valor: R$ ${data.discounted_value.toFixed(2)}`,
            });

            return data as PixPaymentResult;

        } catch (error) {
            console.error('Erro ao criar pagamento PIX:', error);

            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

            toast({
                title: "Erro",
                description: `Erro ao gerar PIX: ${errorMessage}`,
                variant: "destructive",
            });

            return null;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Calcula valor com desconto PIX (5%)
     */
    const calculatePixDiscount = (originalValue: number) => {
        const discountPercentage = 5;
        const discountAmount = originalValue * (discountPercentage / 100);
        const discountedValue = originalValue - discountAmount;

        return {
            originalValue,
            discountedValue: Math.round(discountedValue * 100) / 100,
            discountAmount: Math.round(discountAmount * 100) / 100,
            discountPercentage
        };
    };

    /**
     * Verifica status de pagamento PIX
     */
    const checkPixPaymentStatus = async (paymentId: string): Promise<string | null> => {
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
     * Busca dados de pagamento PIX por ID
     */
    const getPixPaymentData = async (paymentId: string) => {
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
          qr_code_pix,
          pix_copy_paste,
          pix_expiration_date,
          service_type,
          service_data,
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
        createPixPayment,
        calculatePixDiscount,
        checkPixPaymentStatus,
        getPixPaymentData,
        isLoading
    };
};