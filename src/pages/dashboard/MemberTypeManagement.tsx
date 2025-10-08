import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Users, 
  DollarSign, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useMemberTypes, 
  useCreateMemberTypeWithPlans, 
  useUpdateMemberType,
  useToggleMemberTypeStatus,
  useDeleteMemberType,
  type MemberTypeWithPlans 
} from '@/hooks/useMemberTypes';

// Interfaces movidas para o hook useMemberTypes

interface UnifiedMemberTypeForm {
  memberType: {
    name: string;
    description: string;
    sort_order: number;
    is_active: boolean;
  };
  plans: Array<{
    name: string;
    price: number;
    duration_months: number;
    features?: Record<string, any>;
  }>;
}

const MemberTypeManagement: React.FC = () => {
  const { isAdmin } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [formData, setFormData] = useState<UnifiedMemberTypeForm>({
    memberType: {
      name: '',
      description: '',
      sort_order: 0,
      is_active: true,
    },
    plans: [
      { name: '', price: 0, duration_months: 1 }, // Mensal
      { name: '', price: 0, duration_months: 6 }, // Semestral
      { name: '', price: 0, duration_months: 12 }, // Anual
    ],
  });

  // Query para buscar tipos de membro com planos associados
  const { data: memberTypesWithPlans, isLoading, error } = useMemberTypes({
    includeInactive: true,
    includePlans: true,
  });

  // Mutations usando os hooks corrigidos
  const createUnifiedMutation = useCreateMemberTypeWithPlans();
  const toggleStatusMutation = useToggleMemberTypeStatus();
  const deleteMutation = useDeleteMemberType();

  const resetForm = () => {
    setFormData({
      memberType: {
        name: '',
        description: '',
        sort_order: 0,
        is_active: true,
      },
      plans: [
        { name: '', price: 0, duration_months: 1 }, // Mensal
        { name: '', price: 0, duration_months: 6 }, // Semestral
        { name: '', price: 0, duration_months: 12 }, // Anual
      ],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.memberType.name.trim()) {
      toast.error('Nome do tipo de membro é obrigatório');
      return;
    }
    
    // Validar se pelo menos um plano tem nome e preço
    const validPlans = formData.plans.filter(plan => 
      plan.name.trim() && plan.price >= 0
    );
    
    if (validPlans.length === 0) {
      toast.error('Pelo menos um plano deve ser preenchido');
      return;
    }

    // Gerar nomes automáticos se não preenchidos
    const plansToCreate = formData.plans.map((plan, index) => {
      const durationLabels = ['Mensal', 'Semestral', 'Anual'];
      return {
        ...plan,
        name: plan.name.trim() || `${formData.memberType.name} - ${durationLabels[index]}`,
      };
    }).filter(plan => plan.price >= 0);

    createUnifiedMutation.mutate({
      memberType: formData.memberType,
      plans: plansToCreate,
    }, {
      onSuccess: () => {
        setShowCreateForm(false);
        resetForm();
      }
    });
  };

  const getDurationLabel = (duration_months: number) => {
    switch (duration_months) {
      case 1: return 'Mensal';
      case 6: return 'Semestral';
      case 12: return 'Anual';
      default: return `${duration_months} meses`;
    }
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ id, is_active: !currentStatus });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja remover o cargo "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Esta página é restrita a administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Carregando dados...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados: {(error as Error).message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Cargos e Planos</h1>
          <p className="text-muted-foreground">
            Gerencie tipos de membro e seus planos de assinatura associados
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-comademig-blue hover:bg-comademig-blue/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Criar Novo Tipo + Plano
        </Button>
      </div>

      {/* Formulário de Criação */}
      {showCreateForm && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Criar Tipo de Membro e Plano Unificado
            </CardTitle>
            <CardDescription>
              Crie um novo tipo de membro junto com seu plano de assinatura em uma única operação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados do Tipo de Membro */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Dados do Tipo de Membro
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="memberTypeName">Nome do Tipo *</Label>
                    <Input
                      id="memberTypeName"
                      value={formData.memberType.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        memberType: { ...prev.memberType, name: e.target.value }
                      }))}
                      placeholder="Ex: Pastor, Diácono, Membro"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sortOrder">Ordem de Exibição</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={formData.memberType.sort_order}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        memberType: { ...prev.memberType, sort_order: parseInt(e.target.value) || 0 }
                      }))}
                      min="0"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="memberTypeDescription">Descrição</Label>
                  <Textarea
                    id="memberTypeDescription"
                    value={formData.memberType.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      memberType: { ...prev.memberType, description: e.target.value }
                    }))}
                    placeholder="Descreva as responsabilidades e características deste tipo de membro"
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* Dados dos Planos de Assinatura */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Planos de Assinatura (Mensal, Semestral, Anual)
                </h3>
                
                {formData.plans.map((plan, index) => {
                  const labels = ['Mensal (1 mês)', 'Semestral (6 meses)', 'Anual (12 meses)'];
                  return (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <h4 className="font-medium text-sm text-gray-700">{labels[index]}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`planName${index}`}>Nome do Plano</Label>
                          <Input
                            id={`planName${index}`}
                            value={plan.name}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              plans: prev.plans.map((p, i) => 
                                i === index ? { ...p, name: e.target.value } : p
                              )
                            }))}
                            placeholder={`${formData.memberType.name} - ${labels[index].split(' ')[0]}`}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`price${index}`}>Preço (R$)</Label>
                          <Input
                            id={`price${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={plan.price}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              plans: prev.plans.map((p, i) => 
                                i === index ? { ...p, price: parseFloat(e.target.value) || 0 } : p
                              )
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <strong>Dica:</strong> Você pode deixar alguns planos com preço 0 se não quiser oferecê-los. 
                  Os nomes serão gerados automaticamente se não preenchidos.
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createUnifiedMutation.isPending}
                  className="bg-comademig-blue hover:bg-comademig-blue/90"
                >
                  {createUnifiedMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Criar Tipo + Planos
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Tipos Existentes */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Tipos de Membro Existentes</h2>
        
        {memberTypesWithPlans && memberTypesWithPlans.length > 0 ? (
          <div className="grid gap-4">
            {(memberTypesWithPlans as MemberTypeWithPlans[]).map((memberType) => {
              const associatedPlans = memberType.subscription_plans || [];
              
              return (
                <Card key={memberType.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {memberType.name}
                          {memberType.is_active ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                          <Badge variant="outline">
                            Ordem: {memberType.sort_order}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {memberType.description || 'Sem descrição'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleToggleStatus(memberType.id, memberType.is_active)}
                          disabled={toggleStatusMutation.isPending}
                        >
                          {memberType.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(memberType.id, memberType.name)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {associatedPlans.length > 0 && (
                    <CardContent>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Planos Associados ({associatedPlans.length})
                      </h4>
                      <div className="space-y-2">
                        {associatedPlans.map((plan) => (
                          <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{plan.name}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="h-3 w-3" />
                                {getDurationLabel(plan.duration_months)}
                                {plan.features && Object.keys(plan.features).length > 0 && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {Object.keys(plan.features).length} recursos
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-comademig-blue">R$ {plan.price.toFixed(2)}</p>
                              <p className="text-xs text-gray-500">
                                {plan.duration_months === 1 ? '/mês' : 
                                 plan.duration_months === 6 ? '/semestre' : 
                                 plan.duration_months === 12 ? '/ano' : 
                                 `/${plan.duration_months} meses`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Nenhum tipo de membro encontrado</p>
              <p className="text-sm text-gray-500 mt-2">
                Clique em "Criar Novo Tipo + Plano" para começar
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MemberTypeManagement;