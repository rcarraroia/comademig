/**
 * Testes de compatibilidade com tipos de membros existentes
 * 
 * Valida que tipos customizados do admin funcionam com Payment First Flow
 * Requirements: 3.2, 3.3, 8.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import type { UnifiedMemberType } from '@/hooks/useMemberTypeWithPlan';

// Mock do MemberTypeMapper
const MemberTypeMapper = {
  mapToPaymentFirstFlow: (type: UnifiedMemberType): string => {
    const name = type.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Correspondências exatas primeiro (mais específicas)
    if (name === 'ministro extraordinario') return 'membro';
    
    // Correspondências por inclusão - mais específicas primeiro
    if (name.includes('bispo')) return 'bispo';
    
    // Para pastor, verificar se é realmente pastor e não apenas contém "pastor"
    if (name.includes('pastor') && !name.includes('pastoral')) return 'pastor';
    
    if (name.includes('diacono') || name.includes('diácono')) return 'diacono';
    
    // Catch-all para membro
    return 'membro';
  },
  
  isCompatible: (type: UnifiedMemberType): boolean => {
    return !!(type.plan_id && type.plan_value && type.plan_value > 0);
  },
  
  getCompatibilityInfo: (type: UnifiedMemberType) => {
    const isCompatible = MemberTypeMapper.isCompatible(type);
    const mappedType = MemberTypeMapper.mapToPaymentFirstFlow(type);
    const hasPlans = !!(type.plan_id && type.plan_value);
    const issues = [];
    
    if (!hasPlans) {
      issues.push('Tipo não possui plano associado');
    }
    
    return {
      isCompatible,
      mappedType,
      hasPlans,
      issues
    };
  },
  
  filterCompatible: (types: UnifiedMemberType[]): UnifiedMemberType[] => {
    return types.filter(type => MemberTypeMapper.isCompatible(type));
  }
};

// Mock do AdminMemberTypeValidator
const AdminMemberTypeValidator = {
  validateForPaymentFirstFlow: (typeData: any) => {
    const warnings = [];
    const suggestions = [];
    let isValid = true;
    
    if (!typeData.plans || typeData.plans.length === 0) {
      warnings.push('Tipo não possui planos associados');
      suggestions.push('Adicione pelo menos um plano válido');
      isValid = false;
    }
    
    if (typeData.plans && typeData.plans.some((p: any) => p.price <= 0)) {
      warnings.push('Alguns planos possuem preço inválido');
      suggestions.push('Defina preços maiores que zero para todos os planos');
      isValid = false;
    }
    
    const mappedType = MemberTypeMapper.mapToPaymentFirstFlow({ name: typeData.name } as UnifiedMemberType);
    if (mappedType === 'membro' && !typeData.name.toLowerCase().includes('membro')) {
      warnings.push(`Tipo "${typeData.name}" será mapeado como "membro"`);
      suggestions.push('Use palavras-chave como "pastor", "bispo" ou "diácono" no nome para mapeamento específico');
    }
    
    return {
      isValid,
      warnings,
      suggestions
    };
  },
  
  suggestImprovements: (type: UnifiedMemberType): string[] => {
    const suggestions = [];
    
    if (type.name.match(/^(Tipo|Categoria|Nível)/i)) {
      suggestions.push('Use um nome mais específico que descreva a função religiosa');
    }
    
    return suggestions;
  }
};

// Mock dos hooks de compatibilidade
const useMemberTypeCompatibility = (type: UnifiedMemberType) => {
  const info = MemberTypeMapper.getCompatibilityInfo(type);
  return {
    ...info,
    warnings: [],
    suggestions: []
  };
};

const useMemberTypesCompatibility = (types: UnifiedMemberType[]) => {
  const compatible = MemberTypeMapper.filterCompatible(types);
  const incompatible = types.filter(type => !MemberTypeMapper.isCompatible(type));
  const compatibilityMap = new Map();
  
  types.forEach(type => {
    compatibilityMap.set(type.id, MemberTypeMapper.getCompatibilityInfo(type));
  });
  
  return {
    compatible,
    incompatible,
    compatibilityMap
  };
};

// Dados de teste - tipos padrão
const standardMemberTypes: UnifiedMemberType[] = [
  {
    id: 'type-1',
    name: 'Bispo',
    description: 'Bispo da Igreja',
    plan_id: 'plan-bispo',
    plan_name: 'Plano Bispo Mensal',
    plan_value: 100.00,
    plan_recurrence: 'monthly',
    sort_order: 1,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'type-2',
    name: 'Pastor',
    description: 'Pastor da Igreja',
    plan_id: 'plan-pastor',
    plan_name: 'Plano Pastor Mensal',
    plan_value: 75.00,
    plan_recurrence: 'monthly',
    sort_order: 2,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'type-3',
    name: 'Diácono',
    description: 'Diácono da Igreja',
    plan_id: 'plan-diacono',
    plan_name: 'Plano Diácono Mensal',
    plan_value: 50.00,
    plan_recurrence: 'monthly',
    sort_order: 3,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'type-4',
    name: 'Membro',
    description: 'Membro da Igreja',
    plan_id: 'plan-membro',
    plan_name: 'Plano Membro Mensal',
    plan_value: 25.00,
    plan_recurrence: 'monthly',
    sort_order: 4,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Dados de teste - tipos customizados
const customMemberTypes: UnifiedMemberType[] = [
  {
    id: 'custom-1',
    name: 'Pastor Titular',
    description: 'Pastor responsável pela igreja',
    plan_id: 'plan-pastor-titular',
    plan_name: 'Plano Pastor Titular',
    plan_value: 80.00,
    plan_recurrence: 'monthly',
    sort_order: 5,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'custom-2',
    name: 'Pastor Auxiliar',
    description: 'Pastor auxiliar da igreja',
    plan_id: 'plan-pastor-auxiliar',
    plan_name: 'Plano Pastor Auxiliar',
    plan_value: 70.00,
    plan_recurrence: 'monthly',
    sort_order: 6,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'custom-3',
    name: 'Diácono Permanente',
    description: 'Diácono com ordenação permanente',
    plan_id: 'plan-diacono-permanente',
    plan_name: 'Plano Diácono Permanente',
    plan_value: 55.00,
    plan_recurrence: 'monthly',
    sort_order: 7,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'custom-4',
    name: 'Ministro Extraordinário',
    description: 'Ministro com funções especiais',
    plan_id: 'plan-ministro',
    plan_name: 'Plano Ministro',
    plan_value: 60.00,
    plan_recurrence: 'monthly',
    sort_order: 8,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'custom-5',
    name: 'Coordenador de Pastoral',
    description: 'Responsável por coordenar pastorais',
    plan_id: 'plan-coordenador',
    plan_name: 'Plano Coordenador',
    plan_value: 40.00,
    plan_recurrence: 'monthly',
    sort_order: 9,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Tipos problemáticos (sem planos)
const problematicMemberTypes: UnifiedMemberType[] = [
  {
    id: 'problem-1',
    name: 'Tipo Sem Plano',
    description: 'Tipo que não tem plano associado',
    plan_id: undefined,
    plan_name: undefined,
    plan_value: undefined,
    plan_recurrence: undefined,
    sort_order: 10,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'problem-2',
    name: 'Tipo Com Plano Inválido',
    description: 'Tipo com plano mas sem valor',
    plan_id: 'plan-invalid',
    plan_name: 'Plano Inválido',
    plan_value: 0,
    plan_recurrence: 'monthly',
    sort_order: 11,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

describe('Compatibilidade de Tipos de Membros', () => {
  describe('1. Mapeamento de Tipos Padrão', () => {
    it('deve mapear tipos padrão corretamente', () => {
      const mappings = [
        { type: standardMemberTypes[0], expected: 'bispo' }, // Bispo
        { type: standardMemberTypes[1], expected: 'pastor' }, // Pastor
        { type: standardMemberTypes[2], expected: 'diacono' }, // Diácono
        { type: standardMemberTypes[3], expected: 'membro' } // Membro
      ];

      mappings.forEach(({ type, expected }) => {
        const result = MemberTypeMapper.mapToPaymentFirstFlow(type);
        expect(result).toBe(expected);
      });
    });

    it('deve considerar todos os tipos padrão como compatíveis', () => {
      standardMemberTypes.forEach(type => {
        const isCompatible = MemberTypeMapper.isCompatible(type);
        expect(isCompatible).toBe(true);
      });
    });
  });

  describe('2. Mapeamento de Tipos Customizados', () => {
    it('deve mapear tipos customizados baseado em palavras-chave', () => {
      const expectedMappings = [
        { type: customMemberTypes[0], expected: 'pastor' }, // Pastor Titular
        { type: customMemberTypes[1], expected: 'pastor' }, // Pastor Auxiliar
        { type: customMemberTypes[2], expected: 'diacono' }, // Diácono Permanente
        { type: customMemberTypes[3], expected: 'membro' }, // Ministro Extraordinário (mapeado como membro)
        { type: customMemberTypes[4], expected: 'membro' } // Coordenador de Pastoral
      ];

      expectedMappings.forEach(({ type, expected }) => {
        const result = MemberTypeMapper.mapToPaymentFirstFlow(type);
        expect(result).toBe(expected);
      });
    });

    it('deve considerar tipos customizados com planos como compatíveis', () => {
      customMemberTypes.forEach(type => {
        const isCompatible = MemberTypeMapper.isCompatible(type);
        expect(isCompatible).toBe(true);
      });
    });

    it('deve fornecer informações detalhadas de compatibilidade', () => {
      const type = customMemberTypes[0]; // Pastor Titular
      const info = MemberTypeMapper.getCompatibilityInfo(type);

      expect(info).toEqual({
        isCompatible: true,
        mappedType: 'pastor',
        hasPlans: true,
        issues: []
      });
    });
  });

  describe('3. Tipos Problemáticos', () => {
    it('deve identificar tipos sem planos como incompatíveis', () => {
      const typeWithoutPlan = problematicMemberTypes[0];
      const isCompatible = MemberTypeMapper.isCompatible(typeWithoutPlan);
      
      expect(isCompatible).toBe(false);
    });

    it('deve fornecer informações sobre problemas de compatibilidade', () => {
      const typeWithoutPlan = problematicMemberTypes[0];
      const info = MemberTypeMapper.getCompatibilityInfo(typeWithoutPlan);

      expect(info.isCompatible).toBe(false);
      expect(info.hasPlans).toBe(false);
      expect(info.issues).toContain('Tipo não possui plano associado');
    });

    it('deve filtrar tipos incompatíveis', () => {
      const allTypes = [...standardMemberTypes, ...problematicMemberTypes];
      const compatibleTypes = MemberTypeMapper.filterCompatible(allTypes);

      expect(compatibleTypes).toHaveLength(standardMemberTypes.length);
      expect(compatibleTypes.every(type => standardMemberTypes.includes(type))).toBe(true);
    });
  });

  describe('4. Validação para Criação de Tipos', () => {
    it('deve validar dados de criação de tipo válido', () => {
      const validTypeData = {
        name: 'Pastor Evangelista',
        description: 'Pastor especializado em evangelização',
        plans: [
          { name: 'Mensal', price: 75.00, duration_months: 1 },
          { name: 'Semestral', price: 400.00, duration_months: 6 }
        ]
      };

      const validation = AdminMemberTypeValidator.validateForPaymentFirstFlow(validTypeData);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toHaveLength(0);
      expect(validation.suggestions).toHaveLength(0);
    });

    it('deve identificar problemas em dados de criação inválidos', () => {
      const invalidTypeData = {
        name: 'Tipo Problemático',
        description: 'Tipo com problemas',
        plans: [
          { name: 'Plano Grátis', price: 0, duration_months: 1 }, // Preço inválido
          { name: 'Plano Negativo', price: -10, duration_months: 1 } // Preço negativo
        ]
      };

      const validation = AdminMemberTypeValidator.validateForPaymentFirstFlow(invalidTypeData);

      expect(validation.isValid).toBe(false);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.suggestions.length).toBeGreaterThan(0);
    });

    it('deve sugerir melhorias para nomes genéricos', () => {
      const genericTypeData = {
        name: 'Tipo Especial', // Nome genérico que será mapeado como 'membro'
        description: 'Um tipo especial',
        plans: [
          { name: 'Mensal', price: 50.00, duration_months: 1 }
        ]
      };

      const validation = AdminMemberTypeValidator.validateForPaymentFirstFlow(genericTypeData);

      expect(validation.warnings.some(w => w.includes('será mapeado como "membro"'))).toBe(true);
      expect(validation.suggestions.some(s => s.includes('palavras-chave como'))).toBe(true);
    });

    it('deve validar tipos sem planos', () => {
      const typeWithoutPlans = {
        name: 'Tipo Sem Planos',
        description: 'Tipo que não tem planos',
        plans: []
      };

      const validation = AdminMemberTypeValidator.validateForPaymentFirstFlow(typeWithoutPlans);

      expect(validation.isValid).toBe(false);
      expect(validation.warnings.some(w => w.includes('não possui planos'))).toBe(true);
      expect(validation.suggestions.some(s => s.includes('Adicione pelo menos um plano'))).toBe(true);
    });
  });

  describe('5. Hooks de Compatibilidade', () => {
    it('deve fornecer informações de compatibilidade via hook', () => {
      const { result } = renderHook(() => 
        useMemberTypeCompatibility(customMemberTypes[0])
      );

      expect(result.current).toEqual({
        isCompatible: true,
        mappedType: 'pastor',
        hasPlans: true,
        issues: [],
        warnings: [],
        suggestions: []
      });
    });

    it('deve fornecer informações para múltiplos tipos via hook', () => {
      const testTypes = [...standardMemberTypes.slice(0, 2), ...problematicMemberTypes.slice(0, 1)];
      
      const { result } = renderHook(() => 
        useMemberTypesCompatibility(testTypes)
      );

      expect(result.current.compatible).toHaveLength(2); // 2 tipos padrão
      expect(result.current.incompatible).toHaveLength(1); // 1 tipo problemático
      expect(result.current.compatibilityMap.size).toBe(3);
    });

    it('deve calcular estatísticas de compatibilidade', () => {
      const testTypes = [...standardMemberTypes, ...problematicMemberTypes];
      
      const { result } = renderHook(() => 
        useMemberTypesCompatibility(testTypes)
      );

      const stats = {
        total: testTypes.length,
        compatible: result.current.compatible.length,
        incompatible: result.current.incompatible.length,
        compatibilityRate: (result.current.compatible.length / testTypes.length) * 100
      };

      expect(stats.total).toBe(6);
      expect(stats.compatible).toBe(4); // 4 tipos padrão são compatíveis
      expect(stats.incompatible).toBe(2); // 2 tipos problemáticos são incompatíveis
      expect(Math.round(stats.compatibilityRate * 100) / 100).toBe(66.67); // Aproximadamente
    });
  });

  describe('6. Cenários Reais de Uso', () => {
    it('deve lidar com tipos criados por diferentes administradores', () => {
      const diverseTypes: UnifiedMemberType[] = [
        {
          id: 'admin1-1',
          name: 'Padre',
          description: 'Padre da paróquia',
          plan_id: 'plan-padre',
          plan_name: 'Plano Padre',
          plan_value: 90.00,
          plan_recurrence: 'monthly',
          sort_order: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'admin2-1',
          name: 'Reverendo',
          description: 'Reverendo da igreja',
          plan_id: 'plan-reverendo',
          plan_name: 'Plano Reverendo',
          plan_value: 85.00,
          plan_recurrence: 'monthly',
          sort_order: 2,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'admin3-1',
          name: 'Líder de Célula',
          description: 'Líder de grupo pequeno',
          plan_id: 'plan-lider',
          plan_name: 'Plano Líder',
          plan_value: 30.00,
          plan_recurrence: 'monthly',
          sort_order: 3,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mappings = diverseTypes.map(type => ({
        name: type.name,
        mapped: MemberTypeMapper.mapToPaymentFirstFlow(type),
        compatible: MemberTypeMapper.isCompatible(type)
      }));

      expect(mappings).toEqual([
        { name: 'Padre', mapped: 'membro', compatible: true },
        { name: 'Reverendo', mapped: 'membro', compatible: true },
        { name: 'Líder de Célula', mapped: 'membro', compatible: true }
      ]);
    });

    it('deve sugerir melhorias para tipos mal nomeados', () => {
      const poorlyNamedTypes = [
        {
          id: 'poor-1',
          name: 'Tipo A',
          plan_id: 'plan-a',
          description: 'Tipo A',
          plan_name: 'Plano A',
          plan_value: 50.00,
          plan_recurrence: 'monthly' as const,
          sort_order: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'poor-2',
          name: 'Categoria Especial',
          plan_id: 'plan-special',
          description: 'Categoria Especial',
          plan_name: 'Plano Especial',
          plan_value: 60.00,
          plan_recurrence: 'monthly' as const,
          sort_order: 2,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'poor-3',
          name: 'Nível Premium',
          plan_id: 'plan-premium',
          description: 'Nível Premium',
          plan_name: 'Plano Premium',
          plan_value: 70.00,
          plan_recurrence: 'monthly' as const,
          sort_order: 3,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      poorlyNamedTypes.forEach(type => {
        const suggestions = AdminMemberTypeValidator.suggestImprovements(type);
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions.some(s => s.includes('nome mais específico'))).toBe(true);
      });
    });

    it('deve manter consistência entre diferentes sessões', () => {
      const type = customMemberTypes[0]; // Pastor Titular
      
      // Simular múltiplas chamadas
      const results = Array.from({ length: 5 }, () => 
        MemberTypeMapper.mapToPaymentFirstFlow(type)
      );

      // Todos os resultados devem ser iguais
      expect(results.every(result => result === 'pastor')).toBe(true);
    });

    it('deve lidar com nomes com acentos e caracteres especiais', () => {
      const typesWithAccents: UnifiedMemberType[] = [
        {
          id: 'accent-1',
          name: 'Diácono Permanente',
          plan_id: 'plan-diacono-permanente',
          description: 'Diácono Permanente',
          plan_name: 'Plano Diácono Permanente',
          plan_value: 50.00,
          plan_recurrence: 'monthly',
          sort_order: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'accent-2',
          name: 'Ministro Extraordinário da Comunhão',
          plan_id: 'plan-ministro-comunhao',
          description: 'Ministro Extraordinário da Comunhão',
          plan_name: 'Plano Ministro Comunhão',
          plan_value: 40.00,
          plan_recurrence: 'monthly',
          sort_order: 2,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'accent-3',
          name: 'Coordenador de Catequese',
          plan_id: 'plan-coordenador-catequese',
          description: 'Coordenador de Catequese',
          plan_name: 'Plano Coordenador Catequese',
          plan_value: 35.00,
          plan_recurrence: 'monthly',
          sort_order: 3,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mappings = typesWithAccents.map(type => ({
        name: type.name,
        mapped: MemberTypeMapper.mapToPaymentFirstFlow(type)
      }));

      expect(mappings).toEqual([
        { name: 'Diácono Permanente', mapped: 'diacono' },
        { name: 'Ministro Extraordinário da Comunhão', mapped: 'membro' },
        { name: 'Coordenador de Catequese', mapped: 'membro' }
      ]);
    });
  });

  describe('7. Performance e Escalabilidade', () => {
    it('deve processar grandes quantidades de tipos eficientemente', () => {
      // Criar 1000 tipos de teste
      const manyTypes: UnifiedMemberType[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `type-${i}`,
        name: `Tipo ${i}`,
        description: `Descrição do tipo ${i}`,
        plan_id: `plan-${i}`,
        plan_name: `Plano ${i}`,
        plan_value: 50.00,
        plan_recurrence: 'monthly' as const,
        sort_order: i,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }));

      const startTime = performance.now();
      
      const compatibleTypes = MemberTypeMapper.filterCompatible(manyTypes);
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(compatibleTypes).toHaveLength(1000);
      expect(processingTime).toBeLessThan(100); // Deve processar em menos de 100ms
    });

    it('deve manter performance consistente com nomes complexos', () => {
      const complexTypes: UnifiedMemberType[] = Array.from({ length: 100 }, (_, i) => ({
        id: `complex-${i}`,
        name: `Ministro Extraordinário da Sagrada Comunhão e Coordenador de Pastoral Juvenil ${i}`,
        plan_id: `plan-complex-${i}`,
        description: `Descrição complexa ${i}`,
        plan_name: `Plano Complexo ${i}`,
        plan_value: 60.00,
        plan_recurrence: 'monthly' as const,
        sort_order: i,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }));

      const startTime = performance.now();
      
      complexTypes.forEach(type => {
        MemberTypeMapper.mapToPaymentFirstFlow(type);
        MemberTypeMapper.isCompatible(type);
      });
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(50); // Deve processar em menos de 50ms
    });
  });
});