import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAsaasCustomers } from '@/hooks/useAsaasCustomers';
import { useAsaasPixPayments } from '@/hooks/useAsaasPixPayments';
import { useAsaasCardPayments } from '@/hooks/useAsaasCardPayments';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface CheckoutData {
  servico_id: string;
  servico_nome: string;
  servico_valor: number;
  servico_categoria: string;
  dados_formulario: Record<string, any>;
  forma_pagamento: 'pix' | 'cartao';
  
  // Dados do cliente
  cliente: {
    nome: string;
    cpf: string;
    email: string;
    telefone: string;
    cep?: string;
    numero?: string;
  };
  
  // Dados do cartão (se forma_pagamento === 'cartao')
  cartao?: {
    numero: string;
    nome_titular: string;
    mes_validade: string;
    ano_validade: string;
    cvv: string;
    parcelas: number;
  };
}

export interface CheckoutResult {
  success: boolean;
  cobranca_id?: string;
  qr_code?: string;
  qr_code_url?: string;
  payment_url?: string;
  protocolo?: string;
  error?: string;
}

// ============================================================================
// HOOK: useCheckoutTransparente
// ============================================================================

export function useCheckoutTransparente() {
  const { user } = useAuth();
  const { createCustomer, ensureCustomer } = useAsaasCustomers();
  const { createPixPayment } = useAsaasPixPayments();
  const { processCardPayment } = useAsaasCardPayments();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    'idle' | 'validating' | 'creating_customer' | 'processing_payment' | 'saving_charge' | 'saving_data' | 'completed'
  >('idle');

  /**
   * Calcular desconto PIX (5%)
   */
  const calcularDescontoPix = (valor: number): number => {
    return valor * 0.95; // 5% de desconto
  };

  /**
   * Processar checkout completo
   */
  const processarCheckout = async (data: CheckoutData): Promise<CheckoutResult> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return { success: false, error: 'Usuário não autenticado' };
    }

    setIsProcessing(true);
    setCurrentStep('validating');

    try {
      // 1. Validar dados
      console.log('📋 Validando dados do checkout...');
      
      if (!data.servico_id || !data.servico_valor) {
        throw new Error('Dados do serviço inválidos');
      }

      if (!data.cliente.nome || !data.cliente.cpf || !data.cliente.email) {
        throw new Error('Dados do cliente incompletos');
      }

      if (data.forma_pagamento === 'cartao' && !data.cartao) {
        throw new Error('Dados do cartão não fornecidos');
      }

      // 2. Garantir que cliente existe no Asaas
      setCurrentStep('creating_customer');
      console.log('👤 Garantindo cliente no Asaas...');
      
      const customerId = await ensureCustomer();

      if (!customerId) {
        throw new Error('Falha ao criar/buscar cliente no Asaas');
      }

      console.log('✅ Cliente Asaas:', customerId);

      // 3. Calcular valor final
      const valorFinal = data.forma_pagamento === 'pix' 
        ? calcularDescontoPix(data.servico_valor)
        : data.servico_valor;

      console.log(`💰 Valor: R$ ${data.servico_valor} → R$ ${valorFinal} (${data.forma_pagamento})`);

      // 4. Processar pagamento
      setCurrentStep('processing_payment');
      let paymentResult: any;

      if (data.forma_pagamento === 'pix') {
        console.log('💳 Processando pagamento PIX...');
        
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1); // Vencimento em 1 dia
        
        paymentResult = await createPixPayment({
          value: valorFinal,
          dueDate: dueDate.toISOString().split('T')[0],
          description: `Solicitação de ${data.servico_nome}`,
          service_type: 'certidao' as any, // Usar tipo existente temporariamente
          service_data: {
            servico_id: data.servico_id,
            servico_nome: data.servico_nome,
            dados_formulario: data.dados_formulario,
            user_id: user.id,
            customer_id: customerId,
          },
        });

        if (!paymentResult.success) {
          throw new Error(paymentResult.message || 'Falha ao criar pagamento PIX');
        }

      } else {
        // Cartão
        console.log('💳 Processando pagamento com cartão...');
        
        if (!data.cartao) {
          throw new Error('Dados do cartão não fornecidos');
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1);
        
        paymentResult = await processCardPayment({
          value: valorFinal,
          dueDate: dueDate.toISOString().split('T')[0],
          description: `Solicitação de ${data.servico_nome}`,
          installmentCount: data.cartao.parcelas,
          creditCard: {
            holderName: data.cartao.nome_titular,
            number: data.cartao.numero.replace(/\s/g, ''),
            expiryMonth: data.cartao.mes_validade,
            expiryYear: data.cartao.ano_validade,
            ccv: data.cartao.cvv,
          },
          creditCardHolderInfo: {
            name: data.cliente.nome,
            email: data.cliente.email,
            cpfCnpj: data.cliente.cpf,
            postalCode: data.cliente.cep || '30130100',
            addressNumber: data.cliente.numero || '100',
            phone: data.cliente.telefone,
          },
          service_type: 'certidao' as any,
          service_data: {
            servico_id: data.servico_id,
            servico_nome: data.servico_nome,
            dados_formulario: data.dados_formulario,
            user_id: user.id,
            customer_id: customerId,
          },
        });

        if (!paymentResult.success) {
          throw new Error(paymentResult.message || 'Falha ao processar pagamento com cartão');
        }
      }

      const chargeId = paymentResult.charge_id || paymentResult.asaas_id;
      console.log('✅ Pagamento processado:', chargeId);

      // 5. Salvar cobrança no banco local
      setCurrentStep('saving_data');
      console.log('💾 Salvando cobrança no banco local...');
      
      try {
        const { data: cobrancaData, error: cobrancaError } = await supabase
          .from('asaas_cobrancas')
          .insert({
            user_id: user.id,
            asaas_id: chargeId,
            customer_id: customerId,
            status: paymentResult.status || 'PENDING',
            valor: valorFinal,
            descricao: `Solicitação de ${data.servico_nome}`,
            forma_pagamento: data.forma_pagamento === 'pix' ? 'PIX' : 'CREDIT_CARD',
            data_vencimento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            billing_type: data.forma_pagamento === 'pix' ? 'PIX' : 'CREDIT_CARD',
            service_type: data.servico_categoria,
            service_data: {
              servico_id: data.servico_id,
              servico_nome: data.servico_nome,
              dados_formulario: data.dados_formulario,
              user_id: user.id,
              customer_id: customerId,
            },
          })
          .select()
          .single();

        if (cobrancaError) {
          console.error('⚠️ Erro ao salvar cobrança:', cobrancaError);
          // Não falhar o checkout por isso, webhook pode criar depois
        } else {
          console.log('✅ Cobrança salva:', cobrancaData.id);
        }
      } catch (saveError) {
        console.error('⚠️ Erro ao salvar cobrança:', saveError);
        // Continuar mesmo com erro
      }

      // 6. Criar solicitação de serviço
      console.log('📝 Criando solicitação de serviço...');
      
      try {
        // Gerar protocolo único
        const protocolo = `SOL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        const { data: solicitacaoData, error: solicitacaoError } = await supabase
          .from('solicitacoes_servicos')
          .insert({
            protocolo,
            user_id: user.id,
            servico_id: data.servico_id,
            dados_enviados: data.dados_formulario || {},
            status: paymentResult.status === 'CONFIRMED' ? 'pago' : 'em_analise',
            payment_reference: chargeId,
            valor_pago: valorFinal,
            forma_pagamento: data.forma_pagamento,
            data_pagamento: paymentResult.status === 'CONFIRMED' ? new Date().toISOString() : null,
          })
          .select()
          .single();

        if (solicitacaoError) {
          console.error('⚠️ Erro ao criar solicitação:', solicitacaoError);
        } else {
          console.log('✅ Solicitação criada:', solicitacaoData.id, 'Protocolo:', protocolo);
        }
      } catch (solicitacaoSaveError) {
        console.error('⚠️ Erro ao criar solicitação:', solicitacaoSaveError);
      }

      // 7. Retornar resultado
      setCurrentStep('completed');
      
      const result: CheckoutResult = {
        success: true,
        cobranca_id: chargeId,
      };

      if (data.forma_pagamento === 'pix') {
        result.qr_code = paymentResult.qr_code;
        result.qr_code_url = paymentResult.qr_code_url;
        result.payment_url = paymentResult.payment_url;
      }

      console.log('✅ Checkout concluído com sucesso!');
      toast.success('Pagamento processado com sucesso!');

      return result;

    } catch (error: any) {
      console.error('❌ Erro no checkout:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
      
      return {
        success: false,
        error: error.message || 'Erro desconhecido',
      };
    } finally {
      setIsProcessing(false);
      setCurrentStep('idle');
    }
  };

  /**
   * Calcular valor com desconto PIX
   */
  const calcularValorComDesconto = (valor: number, formaPagamento: 'pix' | 'cartao'): number => {
    return formaPagamento === 'pix' ? calcularDescontoPix(valor) : valor;
  };

  /**
   * Calcular valor da parcela
   */
  const calcularValorParcela = (valorTotal: number, numeroParcelas: number): number => {
    return valorTotal / numeroParcelas;
  };

  return {
    // State
    isProcessing,
    currentStep,

    // Actions
    processarCheckout,
    calcularValorComDesconto,
    calcularValorParcela,
    calcularDescontoPix,

    // Constants
    DESCONTO_PIX_PERCENTUAL: 5,
  };
}

// ============================================================================
// HELPER: Validar número de cartão (Luhn Algorithm)
// ============================================================================

export function validarNumeroCartao(numero: string): boolean {
  const numeroLimpo = numero.replace(/\D/g, '');
  
  if (numeroLimpo.length < 13 || numeroLimpo.length > 19) {
    return false;
  }

  let soma = 0;
  let alternar = false;

  for (let i = numeroLimpo.length - 1; i >= 0; i--) {
    let digito = parseInt(numeroLimpo.charAt(i), 10);

    if (alternar) {
      digito *= 2;
      if (digito > 9) {
        digito -= 9;
      }
    }

    soma += digito;
    alternar = !alternar;
  }

  return soma % 10 === 0;
}

// ============================================================================
// HELPER: Formatar número de cartão
// ============================================================================

export function formatarNumeroCartao(numero: string): string {
  const numeroLimpo = numero.replace(/\D/g, '');
  const grupos = numeroLimpo.match(/.{1,4}/g);
  return grupos ? grupos.join(' ') : numeroLimpo;
}

// ============================================================================
// HELPER: Detectar bandeira do cartão
// ============================================================================

export function detectarBandeiraCartao(numero: string): string {
  const numeroLimpo = numero.replace(/\D/g, '');

  if (/^4/.test(numeroLimpo)) return 'Visa';
  if (/^5[1-5]/.test(numeroLimpo)) return 'Mastercard';
  if (/^3[47]/.test(numeroLimpo)) return 'American Express';
  if (/^6(?:011|5)/.test(numeroLimpo)) return 'Discover';
  if (/^35/.test(numeroLimpo)) return 'JCB';
  if (/^(?:2131|1800|30[0-5])/.test(numeroLimpo)) return 'Diners Club';
  if (/^(?:5[06-8]|6)/.test(numeroLimpo)) return 'Maestro';
  if (/^60/.test(numeroLimpo)) return 'Hipercard';
  if (/^63/.test(numeroLimpo)) return 'Elo';

  return 'Desconhecida';
}
