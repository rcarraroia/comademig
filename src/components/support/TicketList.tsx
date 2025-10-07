import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  Calendar
} from 'lucide-react';
import { useMyTickets, useSupportCategories } from '@/hooks/useSupport';
import { getStatusColor, getStatusLabel, getPriorityColor, getPriorityLabel } from '@/hooks/useSupportMessages';
import type { SupportTicket } from '@/hooks/useSupport';

interface TicketListProps {
  onTicketClick?: (ticket: SupportTicket) => void;
  className?: string;
}

const TicketList: React.FC<TicketListProps> = ({ 
  onTicketClick, 
  className = '' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const { data: tickets, isLoading, error } = useMyTickets();
  const { data: categories } = useSupportCategories();

  // Filtrar tickets
  const filteredTickets = tickets?.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category_id === categoryFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  }) || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Há poucos minutos';
    } else if (diffInHours < 24) {
      return `Há ${Math.floor(diffInHours)} horas`;
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  };

  const getMessageCount = (ticket: SupportTicket) => {
    return ticket.messages?.length || 0;
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
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Meus Tickets de Suporte
        </CardTitle>
        <CardDescription>
          Acompanhe o status dos seus tickets de suporte
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Filtros */}
        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por assunto ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros em linha */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Tickets */}
        {filteredTickets.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">
              {tickets?.length === 0 
                ? 'Você ainda não criou nenhum ticket de suporte'
                : 'Nenhum ticket encontrado com os filtros aplicados'
              }
            </p>
            {tickets?.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Clique em "Criar Novo Ticket" para começar
              </p>
            )}
          </div>
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

                      {/* Categoria e descrição */}
                      <div className="space-y-1">
                        {ticket.category && (
                          <p className="text-xs text-gray-600">
                            📂 {ticket.category.name}
                          </p>
                        )}
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {ticket.description}
                        </p>
                      </div>

                      {/* Metadados */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(ticket.created_at)}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {getMessageCount(ticket)} mensagens
                        </div>

                        {ticket.assigned_user && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Atribuído
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 ml-4">
                      {ticket.status === 'waiting_user' && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <Clock className="h-4 w-4" />
                          <span className="text-xs">Aguardando</span>
                        </div>
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

        {/* Resumo */}
        {tickets && tickets.length > 0 && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {tickets.filter(t => t.status === 'open').length}
                </div>
                <div className="text-xs text-gray-600">Abertos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {tickets.filter(t => t.status === 'in_progress').length}
                </div>
                <div className="text-xs text-gray-600">Em Andamento</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {tickets.filter(t => t.status === 'resolved').length}
                </div>
                <div className="text-xs text-gray-600">Resolvidos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {tickets.length}
                </div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TicketList;