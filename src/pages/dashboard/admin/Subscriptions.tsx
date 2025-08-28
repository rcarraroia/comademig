import { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, DollarSign, Calendar } from 'lucide-react';
import { useMemberTypes } from '@/hooks/useMemberTypes';

const Subscriptions = () => {
  const { hasPermission, loading } = useAuth();
  const { memberTypes, isLoading: loadingTypes } = useMemberTypes();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  if (loading || loadingTypes) {
    return <LoadingSpinner />;
  }

  if (!hasPermission('manage_finance')) {
    return <Navigate to="/dashboard" replace />;
  }

  // Dados mockados para demonstração do sistema de assinaturas
  const mockSubscriptionPlans = [
    {
      id: '1',
      name: 'Plano Básico',
      description: 'Acesso básico aos recursos do sistema',
      price: 29.90,
      recurrence: 'monthly',
      memberTypes: ['membro'],
      permissions: {
        manage_events: false,
        manage_news: false,
        manage_media: false
      },
      activeUsers: 45,
      isActive: true
    },
    {
      id: '2', 
      name: 'Plano Premium',
      description: 'Acesso completo com permissões de moderação',
      price: 59.90,
      recurrence: 'monthly',
      memberTypes: ['membro', 'moderador'],
      permissions: {
        manage_events: true,
        manage_news: true,
        manage_media: false
      },
      activeUsers: 12,
      isActive: true
    },
    {
      id: '3',
      name: 'Plano Anual Premium',
      description: 'Plano premium com desconto anual',
      price: 599.90,
      recurrence: 'annual',
      memberTypes: ['membro', 'moderador'],
      permissions: {
        manage_events: true,
        manage_news: true,
        manage_media: true
      },
      activeUsers: 8,
      isActive: true
    }
  ];

  const formatPrice = (price: number, recurrence: string) => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);

    const recurrenceMap = {
      monthly: 'mensal',
      semestral: 'semestral', 
      annual: 'anual'
    };

    return `${formatted}/${recurrenceMap[recurrence as keyof typeof recurrenceMap]}`;
  };

  const getRecurrenceBadge = (recurrence: string) => {
    const variants = {
      monthly: 'default',
      semestral: 'secondary',
      annual: 'outline'
    } as const;

    const labels = {
      monthly: 'Mensal',
      semestral: 'Semestral',
      annual: 'Anual'
    };

    return (
      <Badge variant={variants[recurrence as keyof typeof variants]}>
        {labels[recurrence as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planos de Assinatura</h1>
          <p className="text-gray-600">Gerencie os planos de assinatura e suas permissões</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {/* Aviso de Desenvolvimento */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Calendar className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Sistema em Desenvolvimento
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Esta é uma prévia do sistema de assinaturas. Os dados mostrados são exemplos.
                O sistema completo será implementado na próxima fase do projeto.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Receita Mensal</p>
                <p className="text-2xl font-bold text-gray-900">R$ 2.847,30</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Assinantes Ativos</p>
                <p className="text-2xl font-bold text-gray-900">65</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Planos Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{mockSubscriptionPlans.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Planos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockSubscriptionPlans.map((plan) => (
          <Card key={plan.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Preço */}
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-900">
                  {formatPrice(plan.price, plan.recurrence)}
                </div>
                {getRecurrenceBadge(plan.recurrence)}
              </div>

              {/* Tipos de Membro */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Tipos de Membro:</p>
                <div className="flex flex-wrap gap-1">
                  {plan.memberTypes.map((type) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Permissões */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Permissões:</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Gerenciar Eventos</span>
                    <Badge variant={plan.permissions.manage_events ? "default" : "secondary"}>
                      {plan.permissions.manage_events ? "Sim" : "Não"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Gerenciar Notícias</span>
                    <Badge variant={plan.permissions.manage_news ? "default" : "secondary"}>
                      {plan.permissions.manage_news ? "Sim" : "Não"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Gerenciar Mídia</span>
                    <Badge variant={plan.permissions.manage_media ? "default" : "secondary"}>
                      {plan.permissions.manage_media ? "Sim" : "Não"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Usuários Ativos */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-gray-600">Usuários Ativos</span>
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-sm font-medium">{plan.activeUsers}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tipos de Membro Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Membro Disponíveis</CardTitle>
          <p className="text-sm text-gray-600">
            Tipos de membro que podem ser associados aos planos de assinatura
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memberTypes.map((type) => (
              <div key={type.id} className="p-4 border rounded-lg">
                <h4 className="font-medium">{type.name}</h4>
                {type.description && (
                  <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                )}
                <div className="mt-2">
                  <Badge variant="outline">
                    {type.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Subscriptions;