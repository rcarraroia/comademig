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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface MemberType {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  recurrence: 'monthly' | 'semestral' | 'annual';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UnifiedMemberTypeForm {
  memberType: {
    name: string;
    description: string;
    sort_order: number;
    is_active: boolean;
  };
  subscriptionPlan: {
    name: string;
    description: string;
    price: number;
    recurrence: 'monthly' | 'semestral' | 'annual';
    is_active: boolean;
  };
}

const MemberTypeManagement: React.FC = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [formData, setFormData] = useState<UnifiedMemberTypeForm>({
    memberType: {
      name: '',
      description: '',
      sort_order: 0,
      is_active: true,
    },
    subscriptionPlan: {
      name: '',
      description: '',
      price: 0,
      recurrence: 'monthly',
      is_active: true,
    },
  });

  // Query para buscar tipos de membro com planos associados
  const { data: memberTypesWithPlans, isLoading, error } = useQuery({
    queryKey: ['memberTypesWithPlans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_types')
        .select(`
          *,
          member_type_subscriptions(
            subscription_plans(*)
          )
        `)
        .order('sort_order');

      if (error) throw error;
      return data;
    },
    enabled: isAdmin(),
  });

  // Mutation para criar tipo unificado usando a função RPC
  const createUnifiedMutation = useMutation({
    mutationFn: async (data: UnifiedMemberTypeForm) => {
      const { data: result, error } = await supabase.rpc('create_unified_member_type_and_plan', {
        member_type_data: data.memberType,
        subscription_plan_data: data.subscriptionPlan,
      });

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('Tipo de membro e plano criados com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['memberTypesWithPlans'] });
      setShowCreateForm(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      memberType: {
        name: '',
        description: '',
        sort_order: 0,
        is_active: true,
      },
      subscriptionPlan: {
        name: '',
        description: '',
        price: 0,
        recurrence: 'monthly',
        is_active: true,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.memberType.name.trim()) {
      toast.error('Nome do tipo de membro é obrigatório');
      return;
    }
    
    if (!formData.subscriptionPlan.name.trim()) {
      toast.error('Nome do plano é obrigatório');
      return;
    }
    
    if (formData.subscriptionPlan.price < 0) {
      toast.error('Preço deve ser maior ou igual a zero');
      return;
    }

    createUnifiedMutation.mutate(formData);
  };

  const getRecurrenceLabel = (recurrence: string) => {
    switch (recurrence) {
      case 'monthly': return 'Mensal';
      case 'semestral': return 'Semestral';
      case 'annual': return 'Anual';
      default: return recurrence;
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

              {/* Dados do Plano de Assinatura */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Dados do Plano de Assinatura
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="planName">Nome do Plano *</Label>
                    <Input
                      id="planName"
                      value={formData.subscriptionPlan.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        subscriptionPlan: { ...prev.subscriptionPlan, name: e.target.value }
                      }))}
                      placeholder="Ex: Anuidade Pastor 2025"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="price">Preço (R$) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.subscriptionPlan.price}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        subscriptionPlan: { ...prev.subscriptionPlan, price: parseFloat(e.target.value) || 0 }
                      }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="recurrence">Recorrência *</Label>
                    <Select
                      value={formData.subscriptionPlan.recurrence}
                      onValueChange={(value: 'monthly' | 'semestral' | 'annual') => 
                        setFormData(prev => ({
                          ...prev,
                          subscriptionPlan: { ...prev.subscriptionPlan, recurrence: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="semestral">Semestral</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="planDescription">Descrição do Plano</Label>
                  <Textarea
                    id="planDescription"
                    value={formData.subscriptionPlan.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      subscriptionPlan: { ...prev.subscriptionPlan, description: e.target.value }
                    }))}
                    placeholder="Descreva os benefícios e características deste plano"
                    rows={3}
                  />
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
                  Criar Tipo + Plano
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
            {memberTypesWithPlans.map((memberType: any) => {
              const associatedPlans = memberType.member_type_subscriptions?.map((mts: any) => mts.subscription_plans).filter(Boolean) || [];
              
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
                        </CardTitle>
                        <CardDescription>
                          {memberType.description || 'Sem descrição'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
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
                        {associatedPlans.map((plan: any) => (
                          <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{plan.name}</p>
                              <p className="text-sm text-gray-600">{plan.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-comademig-blue">R$ {plan.price.toFixed(2)}</p>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Calendar className="h-3 w-3" />
                                {getRecurrenceLabel(plan.recurrence)}
                              </div>
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