import { useState } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAsaasPayments } from '@/hooks/useAsaasPayments';
import { useToast } from '@/hooks/use-toast';

interface CertidaoRequest {
  tipo_certidao: string;
  justificativa: string;
}

interface CertidaoWithPayment extends CertidaoRequest {
  valor: number;
  requiresPayment: boolean;
  serviceData: {
    tipo_certidao: string;
    justificativa: string;
  };
}

interface SolicitacaoCertidao {
  id: string;
  user_id: string;
  tipo_certidao: string;
  justificativa: string;
  status: 'pendente' | 'em_analise' | 'aprovada' | 'rejeitada' | 'entregue' | 'pago';
  observacoes_admin?: string;
  numero_protocolo: string;
  data_solicitacao: string;
  data_aprovacao?: string;
  data_entrega?: string;
  arquivo_pdf?: string;
  payment_reference?: string;
  valor?: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    nome_completo: string;
    cpf: string;
    cargo: string;
    igreja: string;
  } | null;
}

export const useCertidoesWithPayment = () => {
  const { user } = useAuth();
  const { createPayment } = useAsaasPayments();
  const { toast } = useToast();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Buscar valores das certidões
  const { data: valoresCertidoes } = useSupabaseQuery(
    ['valores-certidoes'],
    async () => {
      const { data, error } = await supabase
        .from('valores_certidoes')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    }
  );

  // Buscar solicitações do usuário (apenas pagas)
  const { data: minhasSolicitacoes, isLoading, refetch } = useSupabaseQuery(
    ['certidoes-pagas', user?.id],
    async (): Promise<SolicitacaoCertidao[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('solicitacoes_certidoes')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pago', 'em_analise', 'aprovada', 'rejeitada', 'entregue'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as SolicitacaoCertidao[];
    },
    { enabled: !!user }
  );

  // Buscar todas as solicitações para admin (apenas pagas)
  const { data: todasSolicitacoes } = useSupabaseQuery(
    ['certidoes-admin-pagas'],
    async (): Promise<SolicitacaoCertidao[]> => {
      const { data, error } = await supabase
        .from('solicitacoes_certidoes')
        .select(`
          *,
          profiles (
            nome_completo,
            cpf,
            cargo,
            igreja
          )
        `)
        .in('status', ['pago', 'em_analise', 'aprovada', 'rejeitada', 'entregue'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const transformedData = (data || []).map(item => ({
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      }));
      
      return transformedData as SolicitacaoCertidao[];
    },
    { enabled: !!user }
  );

  // Função para calcular valor da certidão
  const calcularValorCertidao = async (tipoCertidao: string): Promise<number> => {
    if (!valoresCertidoes) {
      // Valores padrão se não conseguir buscar da tabela
      const valoresPadrao: Record<string, number> = {
        'ministerio': 45.00,
        'vinculo': 35.00,
        'atuacao': 40.00,
        'historico': 55.00,
        'ordenacao': 50.00
      };
      
      return valoresPadrao[tipoCertidao] || 45.00;
    }
    
    const valorCertidao = valoresCertidoes.find(v => v.tipo === tipoCertidao);
    return valorCertidao?.valor || 45.00;
  };

  // Função principal para solicitar certidão com pagamento
  const solicitarCertidaoComPagamento = useSupabaseMutation(
    async (data: CertidaoRequest): Promise<CertidaoWithPayment> => {
      if (!user) throw new Error('Usuário não autenticado');
      
      // Calcular valor baseado no tipo
      const valor = await calcularValorCertidao(data.tipo_certidao);
      
      // Retornar dados para checkout
      return {
        ...data,
        valor,
        requiresPayment: true,
        serviceData: {
          tipo_certidao: data.tipo_certidao,
          justificativa: data.justificativa
        }
      };
    },
    {
      successMessage: 'Dados da certidão preparados para pagamento',
      errorMessage: 'Erro ao preparar solicitação de certidão'
    }
  );

  // Função para processar pagamento da certidão
  const processarPagamentoCertidao = async (
    certidaoData: CertidaoRequest,
    customerData: any
  ) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    setIsProcessingPayment(true);
    
    try {
      const valor = await calcularValorCertidao(certidaoData.tipo_certidao);
      
      // Preparar dados para pagamento
      const paymentData = {
        customer: customerData,
        billingType: 'PIX' as const,
        value: valor,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Certidão de ${getCertidaoDisplayName(certidaoData.tipo_certidao)}`,
        tipoCobranca: 'certidao',
        serviceType: 'certidao',
        serviceData: {
          tipo_certidao: certidaoData.tipo_certidao,
          justificativa: certidaoData.justificativa
        }
      };
      
      // Criar cobrança
      const cobranca = await createPayment(paymentData);
      
      toast({
        title: "Cobrança gerada com sucesso!",
        description: `Certidão de ${getCertidaoDisplayName(certidaoData.tipo_certidao)} - R$ ${valor.toFixed(2)}`,
      });
      
      return cobranca;
      
    } catch (error: any) {
      console.error('Erro ao processar pagamento da certidão:', error);
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
      valor
    }: {
      serviceData: { tipo_certidao: string; justificativa: string };
      paymentReference: string;
      valor: number;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const numeroProtocolo = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from('solicitacoes_certidoes')
        .insert({
          user_id: user.id,
          tipo_certidao: serviceData.tipo_certidao,
          justificativa: serviceData.justificativa,
          numero_protocolo: numeroProtocolo,
          status: 'pago', // Status inicial após pagamento
          payment_reference: paymentReference,
          valor: valor
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      successMessage: 'Solicitação de certidão criada após pagamento!',
      errorMessage: 'Erro ao criar solicitação após pagamento',
      onSuccess: () => {
        refetch();
      }
    }
  );

  // Função para atualizar status (para admin)
  const atualizarStatusCertidao = useSupabaseMutation(
    async ({ 
      id, 
      status, 
      observacoes, 
      arquivoPdf 
    }: { 
      id: string; 
      status: string; 
      observacoes?: string; 
      arquivoPdf?: string; 
    }) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (observacoes) {
        updateData.observacoes_admin = observacoes;
      }

      if (arquivoPdf) {
        updateData.arquivo_pdf = arquivoPdf;
      }

      if (status === 'aprovada') {
        updateData.data_aprovacao = new Date().toISOString();
      }

      if (status === 'entregue') {
        updateData.data_entrega = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('solicitacoes_certidoes')
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
    minhasSolicitacoes: (minhasSolicitacoes || []) as SolicitacaoCertidao[],
    todasSolicitacoes: (todasSolicitacoes || []) as SolicitacaoCertidao[],
    valoresCertidoes: valoresCertidoes || [],
    
    // Estados
    isLoading,
    isProcessingPayment,
    
    // Funções
    calcularValorCertidao,
    solicitarCertidaoComPagamento,
    processarPagamentoCertidao,
    confirmarSolicitacaoAposPagamento,
    atualizarStatusCertidao,
    refetch
  };
};

// Função auxiliar para nomes amigáveis
function getCertidaoDisplayName(tipo: string): string {
  const nomes: Record<string, string> = {
    'ministerio': 'Ministério',
    'vinculo': 'Vínculo',
    'atuacao': 'Atuação',
    'historico': 'Histórico Ministerial',
    'ordenacao': 'Ordenação'
  };
  
  return nomes[tipo] || tipo;
}