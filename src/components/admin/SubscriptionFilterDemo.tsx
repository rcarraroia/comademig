import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Filter, 
  DollarSign, 
  Calendar, 
  Users, 
  Info, 
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useMemberTypes } from '@/hooks/useMemberTypes';
import { 
  useSubscriptionsByMemberType, 
  useAllSubscriptionsWithTypes,
  useSubscriptionCompatibilityStats,
  filterSubscriptionsByMemberType,
  getCompatibleMemberTypes,
  isUniversalSubscription
} from '@/hooks/useSubscriptionsByMemberType';

export default function SubscriptionFilterDemo() {
  const [selectedMemberTypeId, setSelectedMemberTypeId] = useState<string>('');
  
  const { data: memberTypes, isLoading: memberTypesLoading } = useMemberTypes();
  const { data: allSubscriptions, isLoading: allSubscriptionsLoading } = useAllSubscriptionsWithTypes();
  const { data: filteredSubscriptions, isLoading: filteredLoading } = useSubscriptionsByMemberType(
    selectedMemberTypeId || undefined
  );
  const stats = useSubscriptionCompatibilityStats();

  const selectedMemberType = memberTypes?.find(type => type.id === selectedMemberTypeId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatRecurrence = (recurrence: string) => {
    const map = {
      'monthly': 'Mensal',
      'semestral': 'Semestral', 
      'annual': 'Anual'
    };
    return map[recurrence as keyof typeof map] || recurrence;
  };

  const handleReset = () => {
    setSelectedMemberTypeId('');
  };

  if (memberTypesLoading || allSubscriptionsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando dados...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header e Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Demonstração: Filtro de Assinaturas por Tipo de Membro
          </CardTitle>
          <CardDescription>
            Veja como os planos de assinatura são filtrados dinamicamente baseado no tipo de membro selecionado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Selecione um Tipo de Membro:</label>
              <Select value={selectedMemberTypeId} onValueChange={setSelectedMemberTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um tipo de membro..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos (sem filtro)</SelectItem>
                  {memberTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id!}>
                      {type.name}
                      {type.description && (
                        <span className="text-xs text-muted-foreground ml-2">
                          - {type.description}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Limpar Filtro
              </Button>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalPlans}</div>
              <div className="text-sm text-blue-700">Total de Planos</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.universalPlans}</div>
              <div className="text-sm text-green-700">Planos Universais</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.restrictedPlans}</div>
              <div className="text-sm text-orange-700">Planos Restritos</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {filteredSubscriptions?.length || 0}
              </div>
              <div className="text-sm text-purple-700">Planos Filtrados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tipo Selecionado */}
      {selectedMemberType && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tipo Selecionado: {selectedMemberType.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMemberType.description && (
              <p className="text-blue-700 mb-3">{selectedMemberType.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="outline" className="text-blue-700">
                Ordem: {selectedMemberType.order_of_exhibition || 0}
              </Badge>
              <Badge variant={selectedMemberType.is_active ? "default" : "secondary"}>
                {selectedMemberType.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados do Filtro */}
      <Card>
        <CardHeader>
          <CardTitle>
            Planos {selectedMemberTypeId ? 'Filtrados' : 'Disponíveis'} 
            ({filteredLoading ? '...' : filteredSubscriptions?.length || 0})
          </CardTitle>
          <CardDescription>
            {selectedMemberTypeId 
              ? `Planos disponíveis para "${selectedMemberType?.name}"`
              : 'Todos os planos de assinatura disponíveis'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Aplicando filtro...</span>
            </div>
          ) : filteredSubscriptions && filteredSubscriptions.length > 0 ? (
            <div className="space-y-4">
              {filteredSubscriptions.map((plan) => (
                <div key={plan.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{plan.name}</h4>
                        {isUniversalSubscription(plan) ? (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Universal
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <XCircle className="h-3 w-3 mr-1" />
                            Restrito
                          </Badge>
                        )}
                      </div>
                      
                      {plan.description && (
                        <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
                      )}

                      {/* Tipos Compatíveis */}
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Tipos de Membro Compatíveis:
                        </p>
                        {isUniversalSubscription(plan) ? (
                          <Badge variant="default" className="text-xs">
                            Todos os tipos
                          </Badge>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {getCompatibleMemberTypes(plan).map((typeName) => (
                              <Badge key={typeName} variant="outline" className="text-xs">
                                {typeName}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Permissões */}
                      {Object.entries(plan.permissions || {}).filter(([_, value]) => value).length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Permissões:</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(plan.permissions || {})
                              .filter(([_, value]) => value === true)
                              .map(([key]) => (
                                <Badge key={key} variant="secondary" className="text-xs">
                                  {key.replace('_', ' ')}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-6">
                      <div className="flex items-center gap-1 mb-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-xl font-bold text-green-800">
                          {formatCurrency(plan.price)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {formatRecurrence(plan.recurrence)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {selectedMemberTypeId 
                  ? `Nenhum plano disponível para o tipo "${selectedMemberType?.name}". Isso pode significar que este tipo não possui planos específicos configurados.`
                  : 'Nenhum plano de assinatura cadastrado no sistema.'
                }
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Explicação do Sistema */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-gray-800">Como Funciona o Filtro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Planos Universais:</strong> Disponíveis para todos os tipos de membro (sem restrições)
            </div>
          </div>
          <div className="flex items-start gap-2">
            <XCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Planos Restritos:</strong> Disponíveis apenas para tipos específicos configurados
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Filter className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Filtro Dinâmico:</strong> Quando um tipo é selecionado, apenas planos compatíveis são exibidos
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Configuração:</strong> Administradores podem associar planos a tipos específicos no painel de gestão
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}