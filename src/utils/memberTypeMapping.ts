/**
 * Utilitário para mapeamento flexível de tipos de membros
 * 
 * Compatível com tipos padrão e tipos customizados criados pelo admin
 * Requirements: 3.2, 3.3, 8.4
 */

import type { UnifiedMemberType } from '@/hooks/useMemberTypeWithPlan';

/**
 * Enum restrito usado pelo PaymentFirstFlow
 */
export type PaymentFirstFlowMemberType = 'bispo' | 'pastor' | 'diacono' | 'membro';

/**
 * Interface para configuração de mapeamento
 */
interface MemberTypeMapping {
  // Palavras-chave que identificam o tipo
  keywords: string[];
  // Tipo correspondente no PaymentFirstFlow
  paymentFirstFlowType: PaymentFirstFlowMemberType;
  // Prioridade (maior = mais específico)
  priority: number;
}

/**
 * Configurações de mapeamento ordenadas por prioridade
 */
const MEMBER_TYPE_MAPPINGS: MemberTypeMapping[] = [
  // Bispo - Prioridade alta
  {
    keywords: ['bispo', 'bishop', 'episcopal'],
    paymentFirstFlowType: 'bispo',
    priority: 100
  },
  
  // Pastor - Prioridade alta
  {
    keywords: ['pastor', 'padre', 'reverendo', 'rev.', 'pe.', 'pastor titular', 'pastor auxiliar'],
    paymentFirstFlowType: 'pastor',
    priority: 90
  },
  
  // Diácono - Prioridade média-alta
  {
    keywords: [
      'diacono', 'diácono', 'deacon', 
      'diacono permanente', 'diácono permanente',
      'diacono transitorio', 'diácono transitório',
      'diacono transicional', 'diácono transicional'
    ],
    paymentFirstFlowType: 'diacono',
    priority: 80
  },
  
  // Membro - Prioridade baixa (catch-all)
  {
    keywords: [
      'membro', 'member', 'fiel', 'leigo', 'laico',
      'membro comum', 'membro regular', 'membro ativo',
      'congregado', 'congregante', 'cristao', 'cristão',
      'ministro extraordinario', 'ministro extraordinário',
      'coordenador', 'lider', 'líder'
    ],
    paymentFirstFlowType: 'membro',
    priority: 10
  }
];

/**
 * Classe principal para mapeamento de tipos de membros
 */
export class MemberTypeMapper {
  /**
   * Mapeia um tipo de membro para o enum do PaymentFirstFlow
   */
  static mapToPaymentFirstFlow(memberType: UnifiedMemberType): PaymentFirstFlowMemberType {
    const memberTypeName = memberType.name;
    
    console.log(`🔄 Mapeando tipo de membro: "${memberTypeName}"`);
    
    // Normalizar nome para comparação
    const normalized = this.normalizeName(memberTypeName);
    
    // Encontrar melhor correspondência
    let bestMatch: MemberTypeMapping | null = null;
    let bestScore = 0;
    
    for (const mapping of MEMBER_TYPE_MAPPINGS) {
      const score = this.calculateMatchScore(normalized, mapping);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = mapping;
      }
    }
    
    const result = bestMatch?.paymentFirstFlowType || 'membro';
    
    console.log(`✅ Tipo mapeado: "${memberTypeName}" → "${result}" (score: ${bestScore})`);
    
    return result;
  }

  /**
   * Verifica se um tipo de membro é compatível com o PaymentFirstFlow
   */
  static isCompatible(memberType: UnifiedMemberType): boolean {
    // Verificar se tem plano associado
    if (!memberType.plan_id) {
      console.warn(`⚠️ Tipo "${memberType.name}" não tem plano associado`);
      return false;
    }

    // Verificar se pode ser mapeado
    const mapped = this.mapToPaymentFirstFlow(memberType);
    return !!mapped;
  }

  /**
   * Obtém informações de compatibilidade detalhadas
   */
  static getCompatibilityInfo(memberType: UnifiedMemberType) {
    const hasPlans = !!memberType.plan_id;
    const mappedType = this.mapToPaymentFirstFlow(memberType);
    const isCompatible = hasPlans && !!mappedType;

    return {
      isCompatible,
      hasPlans,
      mappedType,
      issues: [
        ...(!hasPlans ? ['Tipo não possui plano associado'] : []),
        ...(!mappedType ? ['Tipo não pode ser mapeado para PaymentFirstFlow'] : [])
      ]
    };
  }

  /**
   * Lista todos os tipos compatíveis de uma lista
   */
  static filterCompatible(memberTypes: UnifiedMemberType[]): UnifiedMemberType[] {
    return memberTypes.filter(type => this.isCompatible(type));
  }

  /**
   * Normaliza nome para comparação
   */
  private static normalizeName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, '') // Remove pontuação
      .trim();
  }

  /**
   * Calcula score de correspondência entre nome e mapeamento
   */
  private static calculateMatchScore(normalizedName: string, mapping: MemberTypeMapping): number {
    let score = 0;

    for (const keyword of mapping.keywords) {
      const normalizedKeyword = this.normalizeName(keyword);
      
      // Correspondência exata
      if (normalizedName === normalizedKeyword) {
        score += mapping.priority * 2;
        continue;
      }
      
      // Correspondência por inclusão
      if (normalizedName.includes(normalizedKeyword)) {
        score += mapping.priority;
        continue;
      }
      
      // Correspondência por palavra
      const nameWords = normalizedName.split(/\s+/);
      const keywordWords = normalizedKeyword.split(/\s+/);
      
      for (const nameWord of nameWords) {
        for (const keywordWord of keywordWords) {
          if (nameWord === keywordWord) {
            score += mapping.priority * 0.5;
          }
        }
      }
    }

    return score;
  }
}

/**
 * Função de conveniência para mapeamento rápido
 */
export function mapMemberTypeToPaymentFirstFlow(memberType: UnifiedMemberType): PaymentFirstFlowMemberType {
  return MemberTypeMapper.mapToPaymentFirstFlow(memberType);
}

/**
 * Função de conveniência para verificação de compatibilidade
 */
export function isMemberTypeCompatible(memberType: UnifiedMemberType): boolean {
  return MemberTypeMapper.isCompatible(memberType);
}

/**
 * Validador para tipos customizados do admin
 */
export class AdminMemberTypeValidator {
  /**
   * Valida se um tipo criado pelo admin é válido para PaymentFirstFlow
   */
  static validateForPaymentFirstFlow(memberTypeData: {
    name: string;
    description?: string;
    plans: Array<{ name: string; price: number; duration_months: number }>;
  }): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Verificar se nome pode ser mapeado
    const mockMemberType = {
      id: 'temp',
      name: memberTypeData.name,
      plan_id: 'temp'
    } as UnifiedMemberType;

    const mappedType = MemberTypeMapper.mapToPaymentFirstFlow(mockMemberType);
    
    if (mappedType === 'membro' && !memberTypeData.name.toLowerCase().includes('membro')) {
      warnings.push(
        `Tipo "${memberTypeData.name}" será mapeado como "membro" no PaymentFirstFlow. ` +
        'Considere usar um nome mais específico se necessário.'
      );
      
      suggestions.push(
        'Para tipos específicos, use palavras-chave como: "pastor", "diácono", "bispo" no nome.'
      );
    }

    // Verificar se tem planos
    if (!memberTypeData.plans || memberTypeData.plans.length === 0) {
      warnings.push('Tipo não possui planos associados. PaymentFirstFlow requer pelo menos um plano.');
      suggestions.push('Adicione pelo menos um plano com preço e duração definidos.');
    }

    // Verificar preços dos planos
    const invalidPlans = memberTypeData.plans.filter(plan => plan.price <= 0);
    if (invalidPlans.length > 0) {
      warnings.push(`${invalidPlans.length} plano(s) com preço inválido (≤ 0).`);
      suggestions.push('Todos os planos devem ter preço maior que zero.');
    }

    const isValid = warnings.length === 0;

    return {
      isValid,
      warnings,
      suggestions
    };
  }

  /**
   * Sugere melhorias para um tipo de membro
   */
  static suggestImprovements(memberType: UnifiedMemberType): string[] {
    const suggestions: string[] = [];
    const compatibilityInfo = MemberTypeMapper.getCompatibilityInfo(memberType);

    if (!compatibilityInfo.isCompatible) {
      suggestions.push(...compatibilityInfo.issues);
    }

    // Sugerir nomes mais específicos se mapeado como "membro"
    if (compatibilityInfo.mappedType === 'membro' && 
        !memberType.name.toLowerCase().includes('membro')) {
      suggestions.push(
        'Considere usar um nome mais específico (ex: "Pastor Auxiliar", "Diácono Permanente") ' +
        'para melhor categorização no sistema.'
      );
    }

    return suggestions;
  }
}

/*
EXEMPLO DE USO:

// Em um componente de filiação
import { MemberTypeMapper, isMemberTypeCompatible } from '@/utils/memberTypeMapping';

const memberType = { id: '1', name: 'Pastor Titular', plan_id: 'plan_1' };

// Verificar compatibilidade
if (isMemberTypeCompatible(memberType)) {
  // Mapear para PaymentFirstFlow
  const mappedType = MemberTypeMapper.mapToPaymentFirstFlow(memberType);
  console.log('Tipo mapeado:', mappedType); // 'pastor'
}

// No admin, ao criar tipo customizado
import { AdminMemberTypeValidator } from '@/utils/memberTypeMapping';

const validation = AdminMemberTypeValidator.validateForPaymentFirstFlow({
  name: 'Ministro Extraordinário',
  plans: [{ name: 'Mensal', price: 50, duration_months: 1 }]
});

if (!validation.isValid) {
  console.warn('Avisos:', validation.warnings);
  console.log('Sugestões:', validation.suggestions);
}
*/