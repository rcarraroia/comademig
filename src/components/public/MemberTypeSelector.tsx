import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DollarSign, Calendar, Info, CheckCircle2 } from 'lucide-react';
import { useMemberTypeWithPlan, type UnifiedMemberType } from '@/hooks/useMemberTypeWithPlan';

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
    
    if (value === '') {
      onMemberTypeSelect(null);
      return;
    }

    const selectedType = memberTypes.find(type => type.id === value);
    if (selectedType) {
      onMemberTypeSelect(selectedType);
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
            value={internalSelected}
            onValueChange={handleSelectionChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um tipo de membro..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Selecione...</SelectItem>
              {memberTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{type.name}</span>
                    {type.plan_title && (
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

            {/* Informações Financeiras */}
            {selectedTypeData.plan_title ? (
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Plano Financeiro Associado
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Plano</p>
                    <p className="text-lg font-semibold text-green-800">
                      {selectedTypeData.plan_title}
                    </p>
                    {selectedTypeData.plan_description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedTypeData.plan_description}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Valor:</span>
                      <span className="text-xl font-bold text-green-800">
                        R$ {selectedTypeData.plan_value?.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Frequência:</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-500" />
                        <span className="text-sm font-medium text-green-800">
                          {selectedTypeData.plan_recurrence}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-green-100 rounded border border-green-200">
                  <p className="text-sm text-green-800 flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Este valor será cobrado automaticamente de acordo com a frequência selecionada. 
                      Você receberá todas as informações de pagamento após confirmar sua filiação.
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 text-amber-600">
                  <Info className="h-4 w-4" />
                  <p className="text-sm font-medium">
                    Este tipo de membro não possui plano financeiro associado.
                  </p>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  As informações sobre contribuições serão definidas posteriormente pela administração.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MemberTypeSelector;