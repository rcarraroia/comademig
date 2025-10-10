import { SplitRecipient } from '@/hooks/useSplitConfiguration';

/**
 * Tipos de serviço/receita suportados
 */
export type ServiceType = 'filiacao' | 'servicos' | 'publicidade' | 'eventos' | 'outros';

/**
 * Tipos de beneficiários
 */
export type RecipientIdentifier = 'comademig' | 'renum' | 'affiliate';

/**
 * Resultado do cálculo de split
 */
export interface SplitCalculationResult {
  recipientIdentifier: RecipientIdentifier;
  recipientName: string;
  recipientType: 'fixed' | 'dynamic';
  walletId: string | null;
  percentage: number;
  amount: number;
  needsAsaasSplit: boolean; // Se precisa criar split no Asaas (false para COMADEMIG)
}

/**
 * Configurações padrão de split por tipo de serviço
 * Estas são as regras de negócio definidas:
 * - Filiação: 40% COMADEMIG, 40% RENUM, 20% Afiliado
 * - Serviços: 60% COMADEMIG, 40% RENUM
 * - Publicidade: 100% COMADEMIG
 */
export const DEFAULT_SPLIT_CONFIGS: Record<ServiceType, Array<{
  identifier: RecipientIdentifier;
  name: string;
  percentage: number;
}>> = {
  filiacao: [
    { identifier: 'comademig', name: 'COMADEMIG', percentage: 40 },
    { identifier: 'renum', name: 'RENUM', percentage: 40 },
    { identifier: 'affiliate', name: 'Afiliado', percentage: 20 },
  ],
  servicos: [
    { identifier: 'comademig', name: 'COMADEMIG', percentage: 60 },
    { identifier: 'renum', name: 'RENUM', percentage: 40 },
  ],
  publicidade: [
    { identifier: 'comademig', name: 'COMADEMIG', percentage: 100 },
  ],
  eventos: [
    { identifier: 'comademig', name: 'COMADEMIG', percentage: 70 },
    { identifier: 'renum', name: 'RENUM', percentage: 30 },
  ],
  outros: [
    { identifier: 'comademig', name: 'COMADEMIG', percentage: 100 },
  ],
};

/**
 * Calcula os valores de split baseado no tipo de serviço e valor total
 * 
 * @param totalValue - Valor total do pagamento
 * @param serviceType - Tipo de serviço (filiacao, servicos, publicidade, etc)
 * @param affiliateWalletId - Wallet ID do afiliado (opcional, apenas para filiação)
 * @param renumWalletId - Wallet ID da RENUM (obrigatório quando RENUM recebe)
 * @returns Array com os splits calculados
 */
export function calculateSplits(
  totalValue: number,
  serviceType: ServiceType,
  affiliateWalletId?: string,
  renumWalletId?: string
): SplitCalculationResult[] {
  const config = DEFAULT_SPLIT_CONFIGS[serviceType];
  
  if (!config) {
    throw new Error(`Tipo de serviço inválido: ${serviceType}`);
  }

  const results: SplitCalculationResult[] = [];

  for (const recipient of config) {
    // Pular afiliado se não houver wallet ID
    if (recipient.identifier === 'affiliate' && !affiliateWalletId) {
      continue;
    }

    // Pular RENUM se não houver wallet ID
    if (recipient.identifier === 'renum' && !renumWalletId) {
      console.warn('RENUM wallet ID não fornecido, pulando split da RENUM');
      continue;
    }

    const amount = (totalValue * recipient.percentage) / 100;

    results.push({
      recipientIdentifier: recipient.identifier,
      recipientName: recipient.name,
      recipientType: recipient.identifier === 'affiliate' ? 'dynamic' : 'fixed',
      walletId: recipient.identifier === 'comademig' 
        ? null 
        : recipient.identifier === 'renum'
        ? renumWalletId || null
        : affiliateWalletId || null,
      percentage: recipient.percentage,
      amount: Math.round(amount * 100) / 100, // Arredondar para 2 casas decimais
      needsAsaasSplit: recipient.identifier !== 'comademig', // COMADEMIG recebe direto
    });
  }

  return results;
}

/**
 * Calcula splits baseado em configuração customizada
 * 
 * @param totalValue - Valor total do pagamento
 * @param recipients - Lista de beneficiários com percentuais
 * @param affiliateWalletId - Wallet ID do afiliado (opcional)
 * @param renumWalletId - Wallet ID da RENUM (opcional)
 * @returns Array com os splits calculados
 */
export function calculateCustomSplits(
  totalValue: number,
  recipients: SplitRecipient[],
  affiliateWalletId?: string,
  renumWalletId?: string
): SplitCalculationResult[] {
  // Validar que a soma dos percentuais é 100%
  const totalPercentage = recipients.reduce((sum, r) => sum + r.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(`Soma dos percentuais deve ser 100%, atual: ${totalPercentage}%`);
  }

  const results: SplitCalculationResult[] = [];

  for (const recipient of recipients) {
    // Determinar wallet ID baseado no identificador
    let walletId: string | null = null;
    if (recipient.recipient_identifier === 'comademig') {
      walletId = null; // COMADEMIG recebe direto
    } else if (recipient.recipient_identifier === 'renum') {
      walletId = renumWalletId || recipient.wallet_id || null;
    } else if (recipient.recipient_identifier === 'affiliate') {
      walletId = affiliateWalletId || null;
    } else {
      walletId = recipient.wallet_id || null;
    }

    // Pular se for afiliado dinâmico sem wallet ID
    if (recipient.recipient_type === 'dynamic' && !walletId) {
      continue;
    }

    const amount = (totalValue * recipient.percentage) / 100;

    results.push({
      recipientIdentifier: recipient.recipient_identifier as RecipientIdentifier,
      recipientName: recipient.recipient_name,
      recipientType: recipient.recipient_type,
      walletId,
      percentage: recipient.percentage,
      amount: Math.round(amount * 100) / 100,
      needsAsaasSplit: recipient.recipient_identifier !== 'comademig',
    });
  }

  return results;
}

/**
 * Valida se os splits estão corretos
 * 
 * @param splits - Array de splits calculados
 * @param totalValue - Valor total esperado
 * @returns true se válido, false caso contrário
 */
export function validateSplits(
  splits: SplitCalculationResult[],
  totalValue: number
): { valid: boolean; error?: string } {
  // Verificar se há splits
  if (splits.length === 0) {
    return { valid: false, error: 'Nenhum split calculado' };
  }

  // Verificar soma dos valores
  const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);
  const difference = Math.abs(totalSplitAmount - totalValue);
  
  // Tolerância de 1 centavo para erros de arredondamento
  if (difference > 0.01) {
    return {
      valid: false,
      error: `Soma dos splits (R$ ${totalSplitAmount.toFixed(2)}) difere do total (R$ ${totalValue.toFixed(2)})`,
    };
  }

  // Verificar soma dos percentuais
  const totalPercentage = splits.reduce((sum, split) => sum + split.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    return {
      valid: false,
      error: `Soma dos percentuais deve ser 100%, atual: ${totalPercentage}%`,
    };
  }

  // Verificar se splits que precisam de Asaas têm wallet ID
  for (const split of splits) {
    if (split.needsAsaasSplit && !split.walletId) {
      return {
        valid: false,
        error: `Split para ${split.recipientName} precisa de Wallet ID`,
      };
    }
  }

  return { valid: true };
}

/**
 * Formata valor monetário para exibição
 * 
 * @param value - Valor numérico
 * @returns String formatada (ex: "R$ 1.234,56")
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata percentual para exibição
 * 
 * @param value - Valor do percentual (ex: 40 para 40%)
 * @returns String formatada (ex: "40,00%")
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2).replace('.', ',')}%`;
}

/**
 * Obtém a descrição amigável do tipo de serviço
 * 
 * @param serviceType - Tipo de serviço
 * @returns Descrição amigável
 */
export function getServiceTypeLabel(serviceType: ServiceType): string {
  const labels: Record<ServiceType, string> = {
    filiacao: 'Filiação e Anuidades',
    servicos: 'Serviços e Certidões',
    publicidade: 'Publicidade e Patrocínios',
    eventos: 'Eventos e Cursos',
    outros: 'Outros',
  };

  return labels[serviceType] || serviceType;
}

/**
 * Obtém a cor do badge baseado no tipo de beneficiário
 * 
 * @param identifier - Identificador do beneficiário
 * @returns Classe CSS do badge
 */
export function getRecipientBadgeColor(identifier: RecipientIdentifier): string {
  const colors: Record<RecipientIdentifier, string> = {
    comademig: 'bg-blue-100 text-blue-800',
    renum: 'bg-green-100 text-green-800',
    affiliate: 'bg-purple-100 text-purple-800',
  };

  return colors[identifier] || 'bg-gray-100 text-gray-800';
}
