import { useState } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAsaasPayments } from '@/hooks/useAsaasPayments';
import { useToast } from '@/hooks/use-toast';

interface ServicoRegularizacao {
  id: string;
  nome: string;
  descricao: string;
  valor: number;
  sort_order: number;
  is_active: boolean;
}

interface RegularizacaoRequest {
  servicos_selecionados: Array<{
    id: string;
    nome: string;
    valor: number;
  }>;
  observacoes?: string;
}

interface RegularizacaoWithPayment extends RegularizacaoRequest {
  valor_total: number;
  requiresPayment: boolean;
  serviceData: {
    servicos_selecionados: Array<{
      id: string;
      nome: string;
      valor: number;
    }>;
    observacoes?: string;
  };
}

interface SolicitacaoRegularizacao {
  id: string;
  user_id: string;
  servicos_selecionados: any;
  valor_total: number;
  status: 'pendente' | 'em_analise' | 'aprovada' | 'rejeitada' | 'entregue' | 'pago';
  observacoes?: string;
  observacoes_admin?: string;
  numero_protocolo: string;
  data_solicitacao: string;
  data_aprovacao?: string;
  data_entrega?: string;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    nome_completo: string;
    cpf: string;
    cargo: string;
    igreja: string;
  } | null;
}

export const useRegularizacaoWithPayment = () => {
  const { user } = useAuth();
  const { createPayment } = useAsaasPayments();
  const { toast } = useToast();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Buscar serviços de regularização disponíveis
  const { data: servicosDisponiveis } = useSupabaseQuery(
    ['servicos-regularizacao'],
    async (): Promise<ServicoRegularizacao[]> => {
      const { data, error } = await supabase
        .from('servicos_regularizacao')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data || [];
    }
  );

  // Buscar solicitações do usuário (apenas pagas)
  const { data: minhasSolicitacoes, isLoading, refetch } = useSupabaseQuery(
    ['regularizacao-pagas', user?.id],
    async (): Promise<SolicitacaoRegularizacao[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('solicitacoes_regularizacao')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pago', 'em_analise', 'aprovada', 'rejeitada', 'entregue'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as SolicitacaoRegularizacao[];
    },
    { enabled: !!user }
  );

  // Buscar todas as solicitações para admin (apenas pagas)
  const { data: todasSolicitacoes } = useSupabaseQuery(
    ['regularizacao-admin-pagas'],
    async (): Promise<SolicitacaoRegularizacao[]> => {
      const { data, error } = await supabase
        .from('solicitacoes_regularizacao')
        .select('*')
        .in('status', ['pago', 'em_analise', 'aprovada', 'rejeitada', 'entregue'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []) as SolicitacaoRegularizacao[];
    },
    { enabled: !!user }
  );

  // Função para calcular valor total da regularização
  const calcularValorRegularizacao = (servicosSelecionados: Array<{ id: string; nome: string; valor: number }>): number => {
    return servicosSelecionados.reduce((total, servico) => total + servico.valor, 0);
  };

  // Função para aplicar desconto combo (15% se todos os serviços forem selecionados)
  const calcularDescontoCombo = (servicosSelecionados: Array<{ id: string; nome: string; valor: number }>): number => {
    if (!servicosDisponiveis) return 0;
    
    const todosServicos = servicosDisponiveis.length;
    const servicosSelecionadosCount = servicosSelecionados.length;
    
    // Se selecionou todos os serviços, aplicar 15% de desconto
    if (servicosSelecionadosCount === todosServicos && todosServicos > 0) {
      const valorTotal = calcularValorRegularizacao(servicosSelecionados);
      return valorTotal * 0.15;
    }
    
    return 0;
  };

  // Função principal para solicitar regularização com pagamento
  const solicitarRegularizacaoComPagamento = useSupabaseMutation(
    async (data: RegularizacaoRequest): Promise<RegularizacaoWithPayment> => {
      if (!user) throw new Error('Usuário não autenticado');
      
      if (!data.servicos_selecionados || data.servicos_selecionados.length === 0) {
        throw new Error('Selecione pelo menos um serviço');
      }
      
      // Calcular valor total
      const valorBruto = calcularValorRegularizacao(data.servicos_selecionados);
      const desconto = calcularDescontoCombo(data.servicos_selecionados);
      const valorTotal = valorBruto - desconto;
      
      // Retornar dados para checkout
      return {
        ...data,
        valor_total: valorTotal,
        requiresPayment: true,
        serviceData: {
          servicos_selecionados: data.servicos_selecionados,
          observacoes: data.observacoes,
          valor_bruto: valorBruto,
          desconto: desconto,
          valor_total: valorTotal
        }
      };
    },
    {
      successMessage: 'Dados da regularização preparados para pagamento',
      errorMessage: 'Erro ao preparar solicitação de regularização'
    }
  );

  // Função para processar pagamento da regularização
  const processarPagamentoRegularizacao = async (
    regularizacaoData: RegularizacaoRequest,
    customerData: any
  ) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    setIsProcessingPayment(true);
    
    try {
      const valorBruto = calcularValorRegularizacao(regularizacaoData.servicos_selecionados);
      const desconto = calcularDescontoCombo(regularizacaoData.servicos_selecionados);
      const valorTotal = valorBruto - desconto;
      
      // Preparar descrição dos serviços
      const servicosNomes = regularizacaoData.servicos_selecionados.map(s => s.nome).join(', ');
      const descricaoCompleta = desconto > 0 
        ? `Regularização Completa (Combo com 15% desconto) - ${servicosNomes}`
        : `Regularização - ${servicosNomes}`;
      
      // Preparar dados para pagamento
      const paymentData = {
        customer: customerData,
        billingType: 'PIX' as const,
        value: valorTotal,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: descricaoCompleta,
        tipoCobranca: 'regularizacao',
        serviceType: 'regularizacao',
        serviceData: {
          servicos_selecionados: regularizacaoData.servicos_selecionados,
          observacoes: regularizacaoData.observacoes,
          valor_bruto: valorBruto,
          desconto: desconto,
          valor_total: valorTotal
        }
      };
      
      // Criar cobrança
      const cobranca = await createPayment(paymentData);
      
      toast({
        title: "Cobrança gerada com sucesso!",
        description: `Regularização - R$ ${valorTotal.toFixed(2)}${desconto > 0 ? ` (Desconto: R$ ${desconto.toFixed(2)})` : ''}`,
      });
      
      return cobranca;
      
    } catch (error: any) {
      console.error('Erro ao processar pagamento da regularização:', error);
      toast({
        title: "Erro ao gerar cobrança",
        description: error.message || 'Ocorreu um erro inesperado',
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Função para confirmar solicitação após pagamento (chamada pelo webhook)
  const confirmarSolicitacaoAposPagamento = useSupabaseMutation(
    async ({
      serviceData,
      paymentReference,
      valorTotal
    }: {
      serviceData: any;
      paymentReference: string;
      valorTotal: number;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const numeroProtocolo = `REG-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from('solicitacoes_regularizacao')
        .insert({
          user_id: user.id,
          servicos_selecionados: serviceData.servicos_selecionados,
          valor_total: valorTotal,
          numero_protocolo: numeroProtocolo,
          status: 'pago', // Status inicial após pagamento
          payment_reference: paymentReference,
          observacoes: serviceData.observacoes,
          data_solicitacao: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      successMessage: 'Solicitação de regularização criada após pagamento!',
      errorMessage: 'Erro ao criar solicitação após pagamento',
      onSuccess: () => {
        refetch();
      }
    }
  );

  // Função para atualizar status (para admin)
  const atualizarStatusRegularizacao = useSupabaseMutation(
    async ({ 
      id, 
      status, 
      observacoes 
    }: { 
      id: string; 
      status: string; 
      observacoes?: string; 
    }) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (observacoes) {
        updateData.observacoes_admin = observacoes;
      }

      if (status === 'aprovada') {
        updateData.data_aprovacao = new Date().toISOString();
      }

      if (status === 'entregue') {
        updateData.data_entrega = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('solicitacoes_regularizacao')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      successMessage: 'Status atualizado com sucesso!',
      errorMessage: 'Erro ao atualizar status',
      onSuccess: () => {
        refetch();
      }
    }
  );

  return {
    // Dados
    minhasSolicitacoes: (minhasSolicitacoes || []) as SolicitacaoRegularizacao[],
    todasSolicitacoes: (todasSolicitacoes || []) as SolicitacaoRegularizacao[],
    servicosDisponiveis: servicosDisponiveis || [],
    
    // Estados
    isLoading,
    isProcessingPayment,
    
    // Funções
    calcularValorRegularizacao,
    calcularDescontoCombo,
    solicitarRegularizacaoComPagamento,
    processarPagamentoRegularizacao,
    confirmarSolicitacaoAposPagamento,
    atualizarStatusRegularizacao,
    refetch
  };
};

// Função auxiliar para obter nome amigável do serviço
export function getServicoDisplayName(id: string): string {
  const nomes: Record<string, string> = {
    'estatuto': 'Estatuto Social',
    'ata-fundacao': 'Ata de Fundação',
    'ata-eleicao': 'Ata de Eleição',
    'cnpj': 'Solicitação de CNPJ',
    'consultoria': 'Consultoria Jurídica'
  };
  
  return nomes[id] || id;
}