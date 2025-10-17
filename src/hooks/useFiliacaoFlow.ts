import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { UnifiedMemberType } from '@/hooks/useMemberTypeWithPlan';

export interface FiliacaoData {
  // Dados pessoais
  nome_completo: string;
  cpf: string;
  telefone: string;
  email: string;
  
  // Endereço
  cep: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  
  // Pagamento (apenas cartão de crédito)
  payment_method: 'credit_card';
}

interface UseFiliacaoFlowProps {
  selectedMemberType: UnifiedMemberType;
  affiliateInfo?: any;
}

export function useFiliacaoFlow({ selectedMemberType, affiliateInfo }: UseFiliacaoFlowProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const calculateExpirationDate = (recurrence: string): string => {
    const now = new Date();
    
    switch (recurrence.toLowerCase()) {
      case 'mensal':
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'semestral':
        now.setMonth(now.getMonth() + 6);
        break;
      case 'anual':
      case 'annual':
        now.setFullYear(now.getFullYear() + 1);
        break;
      default:
        now.setMonth(now.getMonth() + 1);
    }
    
    return now.toISOString();
  };

  const processFiliacaoMutation = useMutation({
    mutationFn: async (data: FiliacaoData) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      if (!selectedMemberType.plan_id) {
        throw new Error('Tipo de membro selecionado não possui plano associado');
      }

      // 1. Atualizar perfil do usuário
      const profileUpdateData = {
        nome_completo: data.nome_completo,
        cpf: data.cpf,
        telefone: data.telefone,
        cep: data.cep,
        endereco: data.endereco,
        numero: data.numero,
        complemento: data.complemento || null,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        igreja: data.igreja,
        cargo: selectedMemberType.name,
        member_type_id: selectedMemberType.id,
        subscription_source: 'filiacao',
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', user.id);

      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError);
        throw new Error(`Erro ao atualizar perfil: ${profileError.message}`);
      }

      // 2. Criar assinatura do usuário
      const expirationDate = calculateExpirationDate(selectedMemberType.plan_recurrence || 'Mensal');
      
      const subscriptionData = {
        user_id: user.id,
        subscription_plan_id: selectedMemberType.plan_id,
        member_type_id: selectedMemberType.id,
        status: 'active' as const,
        payment_id: `filiacao_${Date.now()}_${user.id.slice(-8)}`,
        started_at: new Date().toISOString(),
        expires_at: expirationDate,
      };

      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert([subscriptionData])
        .select(`
          *,
          subscription_plans(
            id,
            name,
            price,
            recurrence,
            permissions
          ),
          member_types(
            id,
            name
          )
        `)
        .single();

      if (subscriptionError) {
        console.error('Erro ao criar assinatura:', subscriptionError);
        throw new Error(`Erro ao criar assinatura: ${subscriptionError.message}`);
      }

      // 3. Registrar dados ministeriais adicionais se fornecidos
      if (data.cargo_igreja || data.tempo_ministerio) {
        const ministerialData = {
          user_id: user.id,
          cargo_igreja: data.cargo_igreja,
          tempo_ministerio: data.tempo_ministerio,
          created_at: new Date().toISOString()
        };

        // Tentar salvar em tabela de dados ministeriais (se existir)
        try {
          await supabase
            .from('ministerial_data')
            .insert([ministerialData]);
        } catch (error) {
          // Se a tabela não existir, apenas logar
          console.log('Dados ministeriais salvos em log:', ministerialData);
        }
      }

      // 4. Registrar afiliado se houver
      if (affiliateInfo?.referralCode) {
        try {
          const affiliateData = {
            user_id: user.id,
            referral_code: affiliateInfo.referralCode,
            subscription_id: subscription.id,
            created_at: new Date().toISOString()
          };

          await supabase
            .from('affiliate_referrals')
            .insert([affiliateData]);
        } catch (error) {
          console.log('Erro ao registrar afiliado, mas filiação continua:', error);
        }
      }

      return {
        profile: profileUpdateData,
        subscription,
        memberType: selectedMemberType,
        paymentMethod: data.payment_method
      };
    },
    onSuccess: (result) => {
      // Invalidar caches relevantes
      queryClient.invalidateQueries({ queryKey: ['user-permissions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-subscriptions'] });
      
      toast.success('Filiação realizada com sucesso! Bem-vindo à COMADEMIG!');
      
      return result;
    },
    onError: (error: Error) => {
      console.error('Erro no processo de filiação:', error);
      toast.error(error.message || 'Erro ao processar filiação');
    },
  });

  const processarFiliacao = async (data: FiliacaoData) => {
    setIsProcessing(true);
    try {
      const result = await processFiliacaoMutation.mutateAsync(data);
      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processarFiliacao,
    isProcessing: isProcessing || processFiliacaoMutation.isPending,
    error: processFiliacaoMutation.error,
    isSuccess: processFiliacaoMutation.isSuccess,
    data: processFiliacaoMutation.data,
  };
}

/**
 * Hook para verificar se o usuário já possui filiação ativa
 */
export function useFiliacaoStatus() {
  const { user } = useAuth();

  return {
    queryKey: ['filiacao-status', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Verificar se já possui assinatura ativa
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans(name, price, recurrence),
          member_types(name)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return subscription;
    },
    enabled: !!user?.id,
  };
}

/**
 * Utilitário para calcular desconto PIX
 */
export function calculatePixDiscount(originalPrice: number): {
  discount: number;
  finalPrice: number;
  discountPercentage: number;
} {
  const discountPercentage = 0.05; // 5%
  const discount = originalPrice * discountPercentage;
  const finalPrice = originalPrice - discount;

  return {
    discount,
    finalPrice,
    discountPercentage
  };
}

/**
 * Utilitário para formatar valores monetários
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}