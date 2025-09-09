import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export const useSecurityValidations = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Validar integridade de dados de pagamento
  const validatePaymentData = async (paymentData: any): Promise<ValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validar campos obrigatórios
      if (!paymentData.customer?.name?.trim()) {
        errors.push('Nome do cliente é obrigatório');
      }

      if (!paymentData.customer?.email?.trim()) {
        errors.push('Email do cliente é obrigatório');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentData.customer.email)) {
        errors.push('Email do cliente é inválido');
      }

      if (!paymentData.customer?.cpfCnpj?.trim()) {
        errors.push('CPF/CNPJ é obrigatório');
      } else {
        // Validação básica de CPF/CNPJ
        const cpfCnpj = paymentData.customer.cpfCnpj.replace(/\D/g, '');
        if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
          errors.push('CPF/CNPJ deve ter 11 ou 14 dígitos');
        }
      }

      // Validar valor
      if (!paymentData.value || paymentData.value <= 0) {
        errors.push('Valor deve ser maior que zero');
      } else if (paymentData.value > 10000) {
        warnings.push('Valor alto detectado - verificar se está correto');
      }

      // Validar data de vencimento
      if (!paymentData.dueDate) {
        errors.push('Data de vencimento é obrigatória');
      } else {
        const dueDate = new Date(paymentData.dueDate);
        const today = new Date();
        const maxDate = new Date();
        maxDate.setFullYear(today.getFullYear() + 1);

        if (dueDate < today) {
          errors.push('Data de vencimento não pode ser no passado');
        } else if (dueDate > maxDate) {
          warnings.push('Data de vencimento muito distante');
        }
      }

      // Validar tipo de cobrança
      const validTypes = ['filiacao', 'certidao', 'regularizacao', 'taxa_anual'];
      if (!paymentData.tipoCobranca || !validTypes.includes(paymentData.tipoCobranca)) {
        errors.push('Tipo de cobrança inválido');
      }

      // Validar descrição
      if (!paymentData.description?.trim()) {
        errors.push('Descrição é obrigatória');
      } else if (paymentData.description.length > 500) {
        errors.push('Descrição muito longa (máximo 500 caracteres)');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      console.error('Erro na validação de dados de pagamento:', error);
      return {
        isValid: false,
        errors: ['Erro interno na validação'],
        warnings: []
      };
    }
  };

  // Validar dados de filiação
  const validateFiliacaoData = async (memberTypeId: string, planId: string): Promise<ValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Verificar se o tipo de membro existe e está ativo
      const { data: memberType, error: memberTypeError } = await supabase
        .from('member_types')
        .select('id, name, is_active')
        .eq('id', memberTypeId)
        .eq('is_active', true)
        .single();

      if (memberTypeError || !memberType) {
        errors.push('Tipo de membro inválido ou inativo');
      }

      // Verificar se o plano existe e está ativo
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('id, name, price, is_active')
        .eq('id', planId)
        .eq('is_active', true)
        .single();

      if (planError || !plan) {
        errors.push('Plano de assinatura inválido ou inativo');
      }

      // Verificar se o usuário já tem assinatura ativa
      if (user) {
        const { data: existingSubscription } = await supabase
          .from('user_subscriptions')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (existingSubscription) {
          errors.push('Usuário já possui uma assinatura ativa');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      console.error('Erro na validação de dados de filiação:', error);
      return {
        isValid: false,
        errors: ['Erro interno na validação de filiação'],
        warnings: []
      };
    }
  };

  // Validar manipulação de valores
  const validateValueIntegrity = async (
    serviceType: string, 
    calculatedValue: number, 
    submittedValue: number
  ): Promise<ValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Verificar se os valores coincidem (com tolerância para arredondamento)
      const tolerance = 0.01;
      const difference = Math.abs(calculatedValue - submittedValue);

      if (difference > tolerance) {
        errors.push(`Valor manipulado detectado. Esperado: R$ ${calculatedValue.toFixed(2)}, Recebido: R$ ${submittedValue.toFixed(2)}`);
      }

      // Verificar valores mínimos por tipo de serviço
      const minimumValues = {
        'filiacao': 10.00,
        'certidao': 5.00,
        'regularizacao': 15.00,
        'taxa_anual': 20.00
      };

      const minValue = minimumValues[serviceType as keyof typeof minimumValues] || 1.00;
      if (submittedValue < minValue) {
        errors.push(`Valor abaixo do mínimo para ${serviceType}: R$ ${minValue.toFixed(2)}`);
      }

      // Verificar valores máximos suspeitos
      const maxValue = 5000.00;
      if (submittedValue > maxValue) {
        warnings.push(`Valor muito alto para ${serviceType}: R$ ${submittedValue.toFixed(2)}`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      console.error('Erro na validação de integridade de valor:', error);
      return {
        isValid: false,
        errors: ['Erro interno na validação de valor'],
        warnings: []
      };
    }
  };

  // Criar log de auditoria
  const createAuditLog = async (
    action: string,
    resourceType: string,
    resourceId: string,
    oldValues?: any,
    newValues?: any
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const auditData = {
        user_id: user.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        old_values: oldValues,
        new_values: newValues,
        ip_address: null, // Seria obtido do servidor
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(auditData);

      if (error) {
        console.error('Erro ao criar log de auditoria:', error);
        return false;
      }

      return true;

    } catch (error) {
      console.error('Erro ao processar log de auditoria:', error);
      return false;
    }
  };

  // Verificar tentativas de acesso suspeitas
  const checkSuspiciousActivity = async (): Promise<ValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!user) {
      errors.push('Usuário não autenticado');
      return { isValid: false, errors, warnings };
    }

    try {
      // Verificar múltiplas tentativas de pagamento em pouco tempo
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const { data: recentPayments, error } = await supabase
        .from('asaas_cobrancas')
        .select('id, created_at')
        .eq('user_id', user.id)
        .gte('created_at', oneHourAgo.toISOString());

      if (error) {
        console.error('Erro ao verificar atividade suspeita:', error);
        warnings.push('Não foi possível verificar atividade recente');
      } else if (recentPayments && recentPayments.length > 5) {
        warnings.push('Múltiplas tentativas de pagamento detectadas');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      console.error('Erro na verificação de atividade suspeita:', error);
      return {
        isValid: false,
        errors: ['Erro interno na verificação de segurança'],
        warnings: []
      };
    }
  };

  // Validação completa de segurança
  const performSecurityValidation = async (
    paymentData: any,
    memberTypeId?: string,
    planId?: string
  ): Promise<ValidationResult> => {
    setLoading(true);

    try {
      const results: ValidationResult[] = [];

      // Validar dados de pagamento
      results.push(await validatePaymentData(paymentData));

      // Validar dados de filiação se fornecidos
      if (memberTypeId && planId) {
        results.push(await validateFiliacaoData(memberTypeId, planId));
      }

      // Verificar atividade suspeita
      results.push(await checkSuspiciousActivity());

      // Consolidar resultados
      const allErrors = results.flatMap(r => r.errors);
      const allWarnings = results.flatMap(r => r.warnings);

      const finalResult = {
        isValid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings
      };

      // Criar log de auditoria da validação
      await createAuditLog(
        'security_validation',
        'payment_data',
        paymentData.tipoCobranca || 'unknown',
        null,
        {
          validation_result: finalResult,
          payment_data_summary: {
            tipo_cobranca: paymentData.tipoCobranca,
            valor: paymentData.value,
            billing_type: paymentData.billingType
          }
        }
      );

      return finalResult;

    } catch (error) {
      console.error('Erro na validação de segurança:', error);
      return {
        isValid: false,
        errors: ['Erro crítico na validação de segurança'],
        warnings: []
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    validatePaymentData,
    validateFiliacaoData,
    validateValueIntegrity,
    createAuditLog,
    checkSuspiciousActivity,
    performSecurityValidation,
    loading
  };
};