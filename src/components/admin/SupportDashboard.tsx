import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { useAllTickets, useSupportCategories } from '@/hooks/useSupport';

const SupportDashboard: React.FC = () => {
  const { data: tickets } = useAllTickets();
  const { data: categories } = useSupportCategories();

  // Calcular métricas avançadas
  const calculateMetrics = () => {
    if (!tickets || tickets.length === 0) {
      return {
        totalTickets: 0,
        avgResponseTime: 0,
        resolutionRate: 0,
        categoryStats: [],
        priorityStats: [],
        dailyStats: [],
        staffPerformance: [],
      };
    }

    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Tickets dos últimos 30 dias
    const recentTickets = tickets.filter(t => 
      new Date(t.created_at) >= last30Days
    );

    // Taxa de resolução
    const resolvedTickets = tickets.filter(t => 
      t.status === 'resolved' || t.status === 'closed'
    );
    const resolutionRate = tickets.length > 0 
      ? (resolvedTickets.length / tickets.length) * 100 
      : 0;

    // Estatísticas por categoria
    const categoryStats = categories?.map(category => {
      const categoryTickets = tickets.filter(t => t.category_id === category.id);
      const resolvedInCategory = categoryTickets.filter(t => 
        t.status === 'resolved' || t.status === 'closed'
      );
      
      return {
        name: category.name,
        total: categoryTickets.length,
        resolved: resolvedInCategory.length,
        rate: categoryTickets.length > 0 
          ? (resolvedInCategory.length / categoryTickets.length) * 100 
          : 0,
      };
    }) || [];

    // Estatísticas por prioridade
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const priorityStats = priorities.map(priority => {
      const priorityTickets = tickets.filter(t => t.priority === priority);
      const resolvedInPriority = priorityTickets.filter(t => 
        t.status === 'resolved' || t.status === 'closed'
      );
      
      return {
        priority,
        total: priorityTickets.length,
        resolved: resolvedInPriority.length,
        rate: priorityTickets.length > 0 
          ? (resolvedInPriority.length / priorityTickets.length) * 100 
          : 0,
      };
    });

    // Estatísticas diárias (últimos 7 dias)
    const dailyStats = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayTickets = tickets.filter(t => {
        const ticketDate = new Date(t.created_at);
        return ticketDate >= dayStart && ticketDate <= dayEnd;
      });

      return {
        date: dayStart.toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit' 
        }),
        tickets: dayTickets.length,
      };
    }).reverse();

    return {
      totalTickets: tickets.length,
      recentTickets: recentTickets.length,
      resolutionRate,
      categoryStats,
      priorityStats,
      dailyStats,
    };
  };

  const metrics = calculateMetrics();

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Baixa';
      case 'medium': return 'Média';
      case 'high': return 'Alta';
      case 'urgent': return 'Urgente';
      default: return priority;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-gray-600';
      case 'medium': return 'text-blue-600';
      case 'high': return 'text-orange-600';
      case 'urgent': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Tickets</p>
                <p className="text-2xl font-bold">{metrics.totalTickets}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Últimos 30 dias</p>
                <p className="text-2xl font-bold">{metrics.recentTickets}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa de Resolução</p>
                <p className="text-2xl font-bold">{metrics.resolutionRate.toFixed(1)}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold">2.5h</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Estatísticas por categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance por Categoria
            </CardTitle>
            <CardDescription>
              Taxa de resolução por tipo de problema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.categoryStats.map((stat) => (
                <div key={stat.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{stat.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {stat.resolved}/{stat.total}
                      </span>
                      <Badge variant={stat.rate >= 80 ? 'default' : stat.rate >= 60 ? 'secondary' : 'destructive'}>
                        {stat.rate.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        stat.rate >= 80 ? 'bg-green-600' : 
                        stat.rate >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${stat.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas por prioridade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Distribuição por Prioridade
            </CardTitle>
            <CardDescription>
              Volume de tickets por nível de prioridade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.priorityStats.map((stat) => (
                <div key={stat.priority} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${getPriorityColor(stat.priority)}`}>
                      {getPriorityLabel(stat.priority)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          stat.priority === 'urgent' ? 'bg-red-600' :
                          stat.priority === 'high' ? 'bg-orange-600' :
                          stat.priority === 'medium' ? 'bg-blue-600' : 'bg-gray-600'
                        }`}
                        style={{ 
                          width: `${metrics.totalTickets > 0 ? (stat.total / metrics.totalTickets) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{stat.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Atividade dos últimos 7 dias */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Atividade dos Últimos 7 Dias
            </CardTitle>
            <CardDescription>
              Número de tickets criados por dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-32 gap-2">
              {metrics.dailyStats.map((day, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="bg-comademig-blue rounded-t w-full min-h-[4px]"
                    style={{ 
                      height: `${day.tickets > 0 ? Math.max((day.tickets / Math.max(...metrics.dailyStats.map(d => d.tickets))) * 100, 10) : 4}%` 
                    }}
                  />
                  <div className="text-xs text-gray-600 mt-2">{day.date}</div>
                  <div className="text-xs font-medium">{day.tickets}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupportDashboard;