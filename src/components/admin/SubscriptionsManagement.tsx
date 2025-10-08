import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, MoreHorizontal, DollarSign, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useSubscriptionPlans, 
  useToggleSubscriptionPlanStatus, 
  useDeleteSubscriptionPlan,
  useSubscriptionPlansStats,
  type SubscriptionPlan 
} from '@/hooks/useSubscriptionPlans';
import SubscriptionPlanFormModal from './SubscriptionPlanFormModal';
import SubscriptionPlanDeleteModal from './SubscriptionPlanDeleteModal';
import SubscriptionPlanStats from './SubscriptionPlanStats';

export default function SubscriptionsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlan | null>(null);

  // Hooks
  const { data: subscriptionPlans, isLoading, error } = useSubscriptionPlans({ 
    includeInactive: showInactive 
  });
  const { data: stats } = useSubscriptionPlansStats();
  const toggleStatusMutation = useToggleSubscriptionPlanStatus();
  const deleteMutation = useDeleteSubscriptionPlan();

  // Filtrar planos por busca
  const filteredPlans = subscriptionPlans?.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleToggleStatus = (plan: SubscriptionPlan) => {
    toggleStatusMutation.mutate({
      id: plan.id!,
      is_active: !plan.is_active
    });
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
  };

  const handleDelete = (plan: SubscriptionPlan) => {
    setDeletingPlan(plan);
  };

  const handleCloseModals = () => {
    setIsCreateModalOpen(false);
    setEditingPlan(null);
    setDeletingPlan(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatRecurrence = (recurrence: string) => {
    // Valores já estão em português no banco
    return recurrence;
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar planos de assinatura: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Planos de Assinatura</h1>
          <p className="text-muted-foreground">
            Gerencie os planos de assinatura e suas permissões
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {/* Estatísticas */}
      <SubscriptionPlanStats stats={stats} />

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar planos específicos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              variant={showInactive ? "default" : "outline"}
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Mostrando Inativos
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Apenas Ativos
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Planos */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lista de Planos ({filteredPlans.length})
          </CardTitle>
          <CardDescription>
            {searchTerm && `Resultados para "${searchTerm}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              ))}
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Nenhum plano encontrado com os filtros aplicados'
                  : 'Nenhum plano de assinatura cadastrado'
                }
              </p>
              {!searchTerm && (
                <Button 
                  className="mt-4" 
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Plano
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Recorrência</TableHead>
                    <TableHead>Tipos Associados</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[70px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{plan.name}</div>
                          {plan.description && (
                            <div className="text-sm text-muted-foreground">
                              {plan.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                          <span className="font-medium">
                            {formatPrice(plan.price)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center w-fit">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatRecurrence(plan.recurrence)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-blue-600" />
                          <span className="text-sm">
                            {(plan as any).associated_member_types?.length || 0} tipos
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(plan.permissions || {})
                            .filter(([_, value]) => value === true)
                            .slice(0, 2)
                            .map(([key]) => (
                              <Badge key={key} variant="secondary" className="text-xs">
                                {key.replace('_', ' ')}
                              </Badge>
                            ))}
                          {Object.values(plan.permissions || {}).filter(Boolean).length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{Object.values(plan.permissions || {}).filter(Boolean).length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={plan.is_active ? "default" : "secondary"}
                        >
                          {plan.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {plan.created_at 
                          ? new Date(plan.created_at).toLocaleDateString('pt-BR')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(plan)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(plan)}
                              disabled={toggleStatusMutation.isPending}
                            >
                              {plan.is_active ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(plan)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <SubscriptionPlanFormModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModals}
        plan={null}
        mode="create"
      />

      <SubscriptionPlanFormModal
        isOpen={!!editingPlan}
        onClose={handleCloseModals}
        plan={editingPlan}
        mode="edit"
      />

      <SubscriptionPlanDeleteModal
        isOpen={!!deletingPlan}
        onClose={handleCloseModals}
        plan={deletingPlan}
      />
    </div>
  );
}