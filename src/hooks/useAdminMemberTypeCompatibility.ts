/**
 * Hook para verificar compatibilidade de tipos de membros com PaymentFirstFlow
 * 
 * Usado no painel administrativo para validar tipos customizados
 * Requirements: 3.2, 3.3, 8.4
 */

import { useMemo } from 'react';
import type { UnifiedMemberType } from './useMemberTypeWithPlan';
import { 
  MemberTypeMapper, 
  AdminMemberTypeValidator,
  isMemberTypeCompatible 
} from '@/utils/memberTypeMapping';

/**
 * Interface para informações de compatibilidade
 */
export interface MemberTypeCompatibilityInfo {
  isCompatible: boolean;
  mappedType: 'bispo' | 'pastor' | 'diacono' | 'membro';
  hasPlans: boolean;
  issues: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Hook para verificar compatibilidade de um tipo de membro
 */
export function useMemberTypeCompatibility(memberType: UnifiedMemberType | null): MemberTypeCompatibilityInfo | null {
  return useMemo(() => {
    if (!memberType) return null;

    // Obter informações básicas de compatibilidade
    const compatibilityInfo = MemberTypeMapper.getCompatibilityInfo(memberType);
    
    // Obter sugestões de melhoria
    const suggestions = AdminMemberTypeValidator.suggestImprovements(memberType);
    
    // Gerar avisos baseados na compatibilidade
    const warnings: string[] = [];
    
    if (compatibilityInfo.mappedType === 'membro' && 
        !memberType.name.toLowerCase().includes('membro')) {
      warnings.push(
        `Tipo "${memberType.name}" será tratado como "membro" no sistema de pagamentos. ` +
        'Considere usar um nome mais específico se necessário.'
      );
    }

    if (!compatibilityInfo.hasPlans) {
      warnings.push('Este tipo não possui planos associados e não funcionará com o sistema de pagamentos.');
    }

    return {
      isCompatible: compatibilityInfo.isCompatible,
      mappedType: compatibilityInfo.mappedType,
      hasPlans: compatibilityInfo.hasPlans,
      issues: compatibilityInfo.issues,
      warnings,
      suggestions
    };
  }, [memberType]);
}

/**
 * Hook para verificar compatibilidade de múltiplos tipos
 */
export function useMemberTypesCompatibility(memberTypes: UnifiedMemberType[]): {
  compatible: UnifiedMemberType[];
  incompatible: UnifiedMemberType[];
  compatibilityMap: Map<string, MemberTypeCompatibilityInfo>;
} {
  return useMemo(() => {
    const compatible: UnifiedMemberType[] = [];
    const incompatible: UnifiedMemberType[] = [];
    const compatibilityMap = new Map<string, MemberTypeCompatibilityInfo>();

    for (const memberType of memberTypes) {
      const info = MemberTypeMapper.getCompatibilityInfo(memberType);
      const suggestions = AdminMemberTypeValidator.suggestImprovements(memberType);
      
      const warnings: string[] = [];
      if (info.mappedType === 'membro' && !memberType.name.toLowerCase().includes('membro')) {
        warnings.push(`Será tratado como "membro" no sistema de pagamentos`);
      }

      const compatibilityInfo: MemberTypeCompatibilityInfo = {
        isCompatible: info.isCompatible,
        mappedType: info.mappedType,
        hasPlans: info.hasPlans,
        issues: info.issues,
        warnings,
        suggestions
      };

      compatibilityMap.set(memberType.id, compatibilityInfo);

      if (info.isCompatible) {
        compatible.push(memberType);
      } else {
        incompatible.push(memberType);
      }
    }

    return {
      compatible,
      incompatible,
      compatibilityMap
    };
  }, [memberTypes]);
}

/**
 * Hook para validar dados de criação de tipo de membro
 */
export function useValidateMemberTypeCreation() {
  const validateMemberType = useMemo(() => {
    return (memberTypeData: {
      name: string;
      description?: string;
      plans: Array<{ name: string; price: number; duration_months: number }>;
    }) => {
      return AdminMemberTypeValidator.validateForPaymentFirstFlow(memberTypeData);
    };
  }, []);

  return { validateMemberType };
}

/**
 * Hook para filtrar tipos compatíveis
 */
export function useCompatibleMemberTypes(memberTypes: UnifiedMemberType[]): UnifiedMemberType[] {
  return useMemo(() => {
    return MemberTypeMapper.filterCompatible(memberTypes);
  }, [memberTypes]);
}

/**
 * Hook para estatísticas de compatibilidade
 */
export function useMemberTypeCompatibilityStats(memberTypes: UnifiedMemberType[]) {
  return useMemo(() => {
    const total = memberTypes.length;
    const compatible = memberTypes.filter(type => isMemberTypeCompatible(type)).length;
    const incompatible = total - compatible;
    
    const byMappedType = memberTypes.reduce((acc, type) => {
      if (isMemberTypeCompatible(type)) {
        const mapped = MemberTypeMapper.mapToPaymentFirstFlow(type);
        acc[mapped] = (acc[mapped] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      compatible,
      incompatible,
      compatibilityRate: total > 0 ? (compatible / total) * 100 : 0,
      byMappedType
    };
  }, [memberTypes]);
}

/*
EXEMPLO DE USO:

// Em um componente de administração
import { useMemberTypeCompatibility } from '@/hooks/useAdminMemberTypeCompatibility';

function MemberTypeCard({ memberType }: { memberType: UnifiedMemberType }) {
  const compatibility = useMemberTypeCompatibility(memberType);

  if (!compatibility) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{memberType.name}</CardTitle>
        <Badge variant={compatibility.isCompatible ? 'success' : 'destructive'}>
          {compatibility.isCompatible ? 'Compatível' : 'Incompatível'}
        </Badge>
      </CardHeader>
      <CardContent>
        <p>Mapeado como: <strong>{compatibility.mappedType}</strong></p>
        
        {compatibility.warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {compatibility.warnings.join('. ')}
            </AlertDescription>
          </Alert>
        )}
        
        {compatibility.suggestions.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium">Sugestões:</p>
            <ul className="text-sm text-muted-foreground">
              {compatibility.suggestions.map((suggestion, index) => (
                <li key={index}>• {suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Para validar criação de novos tipos
import { useValidateMemberTypeCreation } from '@/hooks/useAdminMemberTypeCompatibility';

function CreateMemberTypeForm() {
  const { validateMemberType } = useValidateMemberTypeCreation();
  
  const handleSubmit = (data) => {
    const validation = validateMemberType(data);
    
    if (!validation.isValid) {
      // Mostrar avisos ao usuário
      validation.warnings.forEach(warning => toast.warning(warning));
      validation.suggestions.forEach(suggestion => toast.info(suggestion));
    }
    
    // Prosseguir com criação...
  };
}
*/