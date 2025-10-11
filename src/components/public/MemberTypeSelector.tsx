import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DollarSign, Calendar, Info, CheckCircle2, Filter } from 'lucide-react';
import { useMemberTypeWithPlan, type UnifiedMemberType } from '@/hooks/useMemberTypeWithPlan';
import { useSubscriptionsByMemberType } from '@/hooks/useSubscriptionsByMemberType';

interface MemberTypeSelectorProps {
  selectedMemberType?: UnifiedMemberType | null;
  onMemberTypeSelect: (memberType: UnifiedMemberType | null) => void;
  disabled?: boolean;
  className?: string;
}

export const MemberTypeSelector: React.FC<MemberTypeSelectorProps> = ({
  selectedMemberType,
  onMemberTypeSelect,
  disabled = false,
  className = '',
}) => {
  const { memberTypes, isLoading, error } = useMemberTypeWithPlan();
  const [internalSelected, setInternalSelected] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  
  // Hook para buscar planos filtrados pelo tipo selecionado
  const { data: filteredSubscriptions, isLoading: subscriptionsLoading } = useSubscriptionsByMemberType(
    internalSelected || undefined
  );

  // Sincronizar com prop externa
  useEffect(() => {
    if (selectedMemberType) {
      setInternalSelected(selectedMemberType.id);
    } else {
      setInternalSelected('');
    }
  }, [selectedMemberType]);

  const handleSelectionChange = (value: string) => {
    setInternalSelected(value);
    setSelectedPlanId(''); // Reset plano ao mudar tipo
    
    const selectedType = memberTypes.find(type => type.id === value);
    if (selectedType) {
      onMemberTypeSelect(selectedType);
    } else {
      onMemberTypeSelect(null);
    }
  };

  const handlePlanSelection = (planId: string) => {
    setSelectedPlanId(planId);
    
    // Atualizar o memberType com o plano selecionado
    const selectedType = memberTypes.find(type => type.id === internalSelected);
    const selectedPlan = filteredSubscriptions?.find(p => p.id === planId);
    
    if (selectedType && selectedPlan) {
      const updatedType: UnifiedMemberType = {
        ...selectedType,
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.name,
        plan_value: selectedPlan.price,
        plan_recurrence: selectedPlan.recurrence as 'monthly' | 'semestral' | 'annual',
        plan_id_gateway: selectedPlan.plan_id_gateway,
        plan_description: selectedPlan.description
      };
      onMemberTypeSelect(updatedType);
    }
  };

  const selectedTypeData = memberTypes.find(type => type.id === internalSelected);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando tipos de membro...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              Erro ao carregar tipos de membro: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (memberTypes.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Nenhum tipo de membro disponível no momento.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Seletor Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selecione seu Tipo de Membro</CardTitle>
          <CardDescription>
            Escolha o tipo de membro que melhor representa sua função ministerial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={internalSelected || undefined}
            onValueChange={handleSelectionChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um tipo de membro..." />
            </SelectTrigger>
            <SelectContent>
              {memberTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{type.name}</span>
                    {type.plan_name && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        R$ {type.plan_value?.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Resumo de Cobrança */}
      {selectedTypeData && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg text-green-800">
                Tipo Selecionado: {selectedTypeData.name}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Descrição do Tipo */}
            {selectedTypeData.description && (
              <div>
                <p className="text-sm text-green-700">
                  {selectedTypeData.description}
                </p>
              </div>
            )}

            {/* Planos Disponíveis */}
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Planos Disponíveis para este Tipo
              </h4>
              
              {subscriptionsLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">Carregando planos...</span>
                </div>
              ) : filteredSubscriptions && filteredSubscriptions.length > 0 ? (
                <div className="space-y-3">
                  {filteredSubscriptions.map((plan) => (
                    <div 
                      key={plan.id} 
                      className={`p-3 rounded border cursor-pointer transition-all ${
                        selectedPlanId === plan.id 
                          ? 'bg-green-100 border-green-500 shadow-md' 
                          : 'bg-gray-50 border-gray-200 hover:border-green-300'
                      }`}
                      onClick={() => handlePlanSelection(plan.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <input 
                            type="radio" 
                            checked={selectedPlanId === plan.id}
                            onChange={() => handlePlanSelection(plan.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{plan.name}</h5>
                            {plan.description && (
                              <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                            )}
                            
                            {/* Permissões do plano */}
                            {Object.entries(plan.permissions || {}).filter(([_, value]) => value).length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-700 mb-1">Permissões incluídas:</p>
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(plan.permissions || {})
                                    .filter(([_, value]) => value === true)
                                    .slice(0, 3)
                                    .map(([key]) => (
                                      <Badge key={key} variant="outline" className="text-xs">
                                        {key.replace('_', ' ')}
                                      </Badge>
                                    ))}
                                  {Object.values(plan.permissions || {}).filter(Boolean).length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{Object.values(plan.permissions || {}).filter(Boolean).length - 3} mais
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        
                          <div className="text-right ml-4">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="text-lg font-bold text-green-800">
                                R$ {plan.price.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3 text-gray-500" />
                              <span className="text-xs text-gray-600">
                                {plan.recurrence === 'monthly' ? 'Mensal' : 
                                 plan.recurrence === 'semestral' ? 'Semestral' : 
                                 plan.recurrence === 'annual' ? 'Anual' : plan.recurrence}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-3 p-3 bg-blue-100 rounded border border-blue-200">
                    <p className="text-sm text-blue-800 flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {selectedPlanId 
                          ? 'Plano selecionado! Clique em "Prosseguir com a Filiação" para continuar.'
                          : 'Selecione um plano acima para prosseguir com a filiação.'
                        }
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <Info className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">
                      Nenhum plano específico configurado para este tipo.
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Planos universais ou configuração manual podem estar disponíveis.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Informação sobre o plano principal (se existir) */}
            {selectedTypeData.plan_name && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Plano Principal Associado
                </h4>
                <p className="text-sm text-blue-700">
                  <strong>{selectedTypeData.plan_name}</strong> - R$ {selectedTypeData.plan_value?.toFixed(2)} 
                  ({selectedTypeData.plan_recurrence === 'monthly' ? 'Mensal' : 
                    selectedTypeData.plan_recurrence === 'semestral' ? 'Semestral' : 
                    selectedTypeData.plan_recurrence === 'annual' ? 'Anual' : selectedTypeData.plan_recurrence})
                </p>
                {selectedTypeData.plan_description && (
                  <p className="text-sm text-blue-600 mt-1">{selectedTypeData.plan_description}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MemberTypeSelector;