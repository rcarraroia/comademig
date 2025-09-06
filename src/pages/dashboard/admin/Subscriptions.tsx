import { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, DollarSign, Calendar } from 'lucide-react';
import { useMemberTypes } from '@/hooks/useMemberTypes';
import { useSubscriptionPlans, useSubscriptionStats, SubscriptionPlan } from '@/hooks/useSubscriptions';
import { SubscriptionPlanModal } from '@/components/admin/subscriptions/SubscriptionPlanModal';
import { DeletePlanModal } from '@/components/admin/subscriptions/DeletePlanModal';

const Subscriptions = () => {
  const { hasPermission, loading } = useAuth();
  const { memberTypes, isLoading: loadingTypes } = useMemberTypes();
  const { plans, isLoading: loadingPlans, refetch } = useSubscriptionPlans();
  const { stats, isLoading: loadingStats } = useSubscriptionStats();
  
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  if (loading || loadingTypes || loadingPlans) {
    return <LoadingSpinner />;
  }

  if (!hasPermission('manage_finance')) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeletePlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsDeleteModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
    refetch();
  };

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
    setSelectedPlan(null);
    refetch();
  };

  const formatPrice = (price: number, billing_cycle: string) => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);

    const cycleMap = {
      monthly: 'mensal',
      yearly: 'anual'
    };

    return `${formatted}/${cycleMap[billing_cycle as keyof typeof cycleMap]}`;
  };

  const getBillingCycleBadge = (billing_cycle: string) => {
    const variants = {
      monthly: 'default',
      yearly: 'outline'
    } as const;

    const labels = {
      monthly: 'Mensal',
      yearly: 'Anual'
    };

    return (
      <Badge variant={variants[billing_cycle as keyof typeof variants]}>
        {labels[billing_cycle as keyof typeof labels]}
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
        <Button onClick={handleCreatePlan}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
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
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? '...' : `R$ ${(stats?.monthlyRevenue || 0).toFixed(2)}`}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? '...' : stats?.activeSubscriptions || 0}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? '...' : stats?.totalPlans || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Planos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditPlan(plan)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeletePlan(plan)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Preço */}
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-900">
                  {formatPrice(plan.price, plan.billing_cycle)}
                </div>
                {getBillingCycleBadge(plan.billing_cycle)}
              </div>

              {/* Recursos */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Recursos:</p>
                <div className="space-y-1">
                  {plan.features && plan.features.length > 0 ? (
                    plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {feature}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Nenhum recurso definido</p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Status:</p>
                <Badge variant={plan.is_active ? "default" : "secondary"}>
                  {plan.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              {/* Usuários Ativos */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-gray-600">Assinantes</span>
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-sm font-medium">{plan._count?.user_subscriptions || 0}</span>
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

      {/* Modais */}
      <SubscriptionPlanModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        plan={selectedPlan}
        mode={modalMode}
      />

      <DeletePlanModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        plan={selectedPlan}
      />
    </div>
  );
};

export default Subscriptions;