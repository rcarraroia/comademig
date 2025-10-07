import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  User, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  UserCheck,
  Calendar,
  BarChart3,
  Users,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useAllTickets, useSupportCategories, useAssignTicket, useResolveTicket } from '@/hooks/useSupport';
import { getStatusColor, getStatusLabel, getPriorityColor, getPriorityLabel, formatMessageTime } from '@/hooks/useSupportMessages';
import type { SupportTicket } from '@/hooks/useSupport';

interface SupportManagementProps {
  onTicketClick?: (ticket: SupportTicket) => void;
  className?: string;
}

const SupportManagement: React.FC<SupportManagementProps> = ({ 
  onTicketClick, 
  className = '' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');

  const { data: tickets, isLoading, error } = useAllTickets({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    assigned_to: assignedFilter !== 'all' ? assignedFilter : undefined,
  });

  const { data: categories } = useSupportCategories();
  const assignTicketMutation = useAssignTicket();
  const resolveTicketMutation = useResolveTicket();

  // Filtrar tickets por busca
  const filteredTickets = tickets?.filter(ticket => {
    const searchLower = searchTerm.toLowerCase();
    return ticket.subject.toLowerCase().includes(searchLower) ||
           ticket.description.toLowerCase().includes(searchLower) ||
           ticket.user?.nome_completo.toLowerCase().includes(searchLower);
  }) || [];

  // Calcular estatísticas
  const stats = {
    total: tickets?.length || 0,
    open: tickets?.filter(t => t.status === 'open').length || 0,
    inProgress: tickets?.filter(t => t.status === 'in_progress').length || 0,
    waitingUser: tickets?.filter(t => t.status === 'waiting_user').length || 0,
    resolved: tickets?.filter(t => t.status === 'resolved').length || 0,
    closed: tickets?.filter(t => t.status === 'closed').length || 0,
    unassigned: tickets?.filter(t => !t.assigned_to).length || 0,
    urgent: tickets?.filter(t => t.priority === 'urgent').length || 0,
  };

  const handleAssignToMe = (ticketId: string) => {
    // TODO: Pegar ID do usuário atual do contexto de auth
    const currentUserId = 'current-user-id'; // Placeholder
    assignTicketMutation.mutate({ ticketId, assignedTo: currentUserId });
  };

  const handleUnassign = (ticketId: string) => {
    assignTicketMutation.mutate({ ticketId, assignedTo: null });
  };

  const handleResolve = (ticketId: string) => {
    resolveTicketMutation.mutate({ ticketId, status: 'resolved' });
  };

  const handleClose = (ticketId: string) => {
    resolveTicketMutation.mutate({ ticketId, status: 'closed' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando tickets...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar tickets: {(error as Error).message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Gestão de Suporte</h2>
        <p className="text-muted-foreground">
          Gerencie tickets de suporte e atenda os membros
        </p>
      </div>

      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
                <div className="text-sm text-gray-600">Abertos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
                <div className="text-sm text-gray-600">Em Andamento</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.unassigned}</div>
                <div className="text-sm text-gray-600">Não Atribuídos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
                <div className="text-sm text-gray-600">Urgentes</div>
              </CardContent>
            </Card>
          </div>

          {/* Métricas detalhadas */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Status dos Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Abertos</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${stats.total > 0 ? (stats.open / stats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{stats.open}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Em Andamento</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-600 h-2 rounded-full" 
                          style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{stats.inProgress}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Resolvidos</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{stats.resolved}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Categorias Mais Solicitadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories?.slice(0, 5).map((category) => {
                    const categoryTickets = tickets?.filter(t => t.category_id === category.id).length || 0;
                    return (
                      <div key={category.id} className="flex items-center justify-between">
                        <span className="text-sm">{category.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-comademig-blue h-2 rounded-full" 
                              style={{ width: `${stats.total > 0 ? (categoryTickets / stats.total) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{categoryTickets}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por assunto, descrição ou usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtros em linha */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="open">Aberto</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="waiting_user">Aguardando Usuário</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                    <SelectItem value="closed">Fechado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Prioridades</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Atribuição" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="unassigned">Não Atribuídos</SelectItem>
                    <SelectItem value="me">Meus Tickets</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setPriorityFilter('all');
                  setAssignedFilter('all');
                }}>
                  <Filter className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Tickets */}
          {filteredTickets.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  {tickets?.length === 0 
                    ? 'Nenhum ticket encontrado'
                    : 'Nenhum ticket encontrado com os filtros aplicados'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <Card 
                  key={ticket.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer border-l-4"
                  style={{
                    borderLeftColor: ticket.priority === 'urgent' ? '#ef4444' :
                                    ticket.priority === 'high' ? '#f97316' :
                                    ticket.priority === 'medium' ? '#3b82f6' : '#6b7280'
                  }}
                  onClick={() => onTicketClick?.(ticket)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Header do ticket */}
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-sm truncate">
                            {ticket.subject}
                          </h3>
                          <Badge className={getStatusColor(ticket.status)}>
                            {getStatusLabel(ticket.status)}
                          </Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {getPriorityLabel(ticket.priority)}
                          </Badge>
                        </div>

                        {/* Informações do usuário e categoria */}
                        <div className="space-y-1 mb-2">
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {ticket.user?.nome_completo || 'Usuário desconhecido'}
                              {ticket.user?.cargo && (
                                <span className="text-gray-500">({ticket.user.cargo})</span>
                              )}
                            </div>
                            
                            {ticket.category && (
                              <div>📂 {ticket.category.name}</div>
                            )}
                          </div>
                        </div>

                        {/* Descrição */}
                        <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                          {ticket.description}
                        </p>

                        {/* Metadados */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(ticket.created_at)}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {(ticket.messages as any)?.length || 0} mensagens
                          </div>

                          {ticket.assigned_user && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <UserCheck className="h-3 w-3" />
                              {ticket.assigned_user.nome_completo}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ações rápidas */}
                      <div className="flex items-center gap-2 ml-4">
                        {!ticket.assigned_to && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssignToMe(ticket.id);
                            }}
                            disabled={assignTicketMutation.isPending}
                          >
                            Atribuir a mim
                          </Button>
                        )}
                        
                        {ticket.assigned_to && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolve(ticket.id);
                            }}
                            disabled={resolveTicketMutation.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupportManagement;