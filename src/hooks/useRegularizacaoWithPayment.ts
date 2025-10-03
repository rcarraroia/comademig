import { useState } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAsaasCustomers } from '@/hooks/useAsaasCustomers';
import { useAsaasPixPayments } from '@/hooks/useAsaasPixPayments';
import { useAsaasCardPayments } from '@/hooks/useAsaasCardPayments';
import { useAsaasBoletoPayments } from '@/hooks/useAsaasBoletoPayments';
import { toast } from 'sonner';

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
  const { createCustomer } = useAsaasCustomers();
  const { createPixPayment } = useAsaasPixPayments();
  const { processCardPayment } = useAsaasCardPayments();
  const { createBoletoPayment } = useAsaasBoletoPayments();
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
    customerData: any,
    paymentMethod: 'pix' | 'credit_card' | 'boleto',
    cardData?: any,
    dueDate?: string
  ) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    setIsProcessingPayment(true);
    
    try {
      const valorBruto = calcularValorRegularizacao(regularizacaoData.servicos_selecionados);
      const descontoCombo = calcularDescontoCombo(regularizacaoData.servicos_selecionados);
      const valorAposCombo = valorBruto - descontoCombo;
      
      // Aplicar desconto adicional de 5% para PIX
      const isPixPayment = paymentMethod === 'pix';
      const descontoPix = isPixPayment ? valorAposCombo * 0.05 : 0;
      const valorFinal = valorAposCombo - descontoPix;
      
      // 1. Criar/verificar cliente no Asaas
      const customer = await createCustomer.mutateAsync(customerData);
      
      // 2. Preparar descrição dos serviços
      const servicosNomes = regularizacaoData.servicos_selecionados.map(s => s.nome).join(', ');
      let descricaoCompleta = `Regularização COMADEMIG - ${servicosNomes}`;
      
      if (descontoCombo > 0) {
        descricaoCompleta += ' (Combo Completo - 15% desconto)';
      }
      
      // 3. Preparar dados base do pagamento
      const basePaymentData = {
        customer: customer.id,
        value: valorFinal,
        description: descricaoCompleta,
        externalReference: `regularizacao_${user.id}_${Date.now()}`,
        serviceType: 'regularizacao',
        serviceData: {
          servicos_selecionados: regularizacaoData.servicos_selecionados,
          observacoes: regularizacaoData.observacoes,
          valor_bruto: valorBruto,
          desconto_combo: descontoCombo,
          desconto_pix: descontoPix,
          valor_final: valorFinal
        }
      };

      let paymentResult;

      // 4. Processar pagamento baseado no método escolhido
      switch (paymentMethod) {
        case 'pix':
          paymentResult = await createPixPayment.mutateAsync({
            ...basePaymentData,
            billingType: 'PIX',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 24h
            discount: {
              value: descontoPix,
              dueDateLimitDays: 0
            }
          });
          break;

        case 'credit_card':
          if (!cardData) {
            throw new Error('Dados do cartão são obrigatórios');
          }
          paymentResult = await processCardPayment.mutateAsync({
            ...basePaymentData,
            billingType: 'CREDIT_CARD',
            dueDate: new Date().toISOString().split('T')[0],
            creditCard: {
              holderName: cardData.holderName,
              number: cardData.number,
              expiryMonth: cardData.expiryMonth,
              expiryYear: cardData.expiryYear,
              ccv: cardData.ccv
            },
            creditCardHolderInfo: {
              name: customerData.name,
              email: customerData.email,
              cpfCnpj: customerData.cpfCnpj,
              postalCode: customerData.postalCode,
              addressNumber: customerData.addressNumber,
              phone: customerData.phone
            },
            installmentCount: cardData.installmentCount || 1
          });
          break;

        case 'boleto':
          const boletoDate = dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          paymentResult = await createBoletoPayment.mutateAsync({
            ...basePaymentData,
            billingType: 'BOLETO',
            dueDate: boletoDate,
            fine: {
              value: 2.0 // 2% de multa
            },
            interest: {
              value: 1.0 // 1% de juros ao mês
            }
          });
          break;

        default:
          throw new Error('Método de pagamento não suportado');
      }

      // 5. Salvar dados localmente na tabela asaas_cobrancas
      const { error: saveError } = await supabase
        .from('asaas_cobrancas')
        .insert({
          asaas_id: paymentResult.id,
          user_id: user.id,
          customer_id: customer.id,
          service_type: 'regularizacao',
          service_data: {
            servicos_selecionados: regularizacaoData.servicos_selecionados,
            observacoes: regularizacaoData.observacoes,
            valor_bruto: valorBruto,
            desconto_combo: descontoCombo,
            desconto_pix: descontoPix,
            valor_final: valorFinal
          },
          billing_type: paymentMethod.toUpperCase(),
          status: paymentResult.status,
          value: valorFinal,
          original_value: valorBruto,
          due_date: paymentResult.dueDate,
          description: paymentResult.description,
          external_reference: paymentResult.externalReference,
          created_at: new Date().toISOString()
        });

      if (saveError) {
        console.error('Erro ao salvar cobrança localmente:', saveError);
        // Não falha o processo, apenas loga o erro
      }

      // 6. Preparar mensagem de sucesso
      let mensagemDesconto = '';
      if (descontoCombo > 0 && descontoPix > 0) {
        mensagemDesconto = ` (Combo: -${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(descontoCombo)} + PIX: -${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(descontoPix)})`;
      } else if (descontoCombo > 0) {
        mensagemDesconto = ` (Combo: -${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(descontoCombo)})`;
      } else if (descontoPix > 0) {
        mensagemDesconto = ` (PIX: -${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(descontoPix)})`;
      }

      toast.success(
        'Cobrança gerada com sucesso!',
        {
          description: `Regularização - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorFinal)}${mensagemDesconto}`,
        }
      );
      
      return {
        ...paymentResult,
        valorBruto,
        descontoCombo,
        descontoPix,
        valorFinal,
        paymentMethod,
        customer,
        servicosCount: regularizacaoData.servicos_selecionados.length,
        isComboCompleto: descontoCombo > 0
      };
      
    } catch (error: any) {
      console.error('Erro ao processar pagamento da regularização:', error);
      toast.error(
        'Erro ao gerar cobrança',
        {
          description: error.message || 'Ocorreu um erro inesperado',
        }
      );
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