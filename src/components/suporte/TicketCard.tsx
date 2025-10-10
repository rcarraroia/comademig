
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle,
  Calendar
} from "lucide-react";
import { SupportTicket } from "@/hooks/useSupport";

interface TicketCardProps {
  ticket: SupportTicket;
  onClick: () => void;
}

export const TicketCard = ({ ticket, onClick }: TicketCardProps) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'open': { 
        variant: 'destructive' as const, 
        icon: AlertCircle, 
        label: 'Aberto' 
      },
      'in_progress': { 
        variant: 'default' as const, 
        icon: Clock, 
        label: 'Em Andamento' 
      },
      'waiting_user': { 
        variant: 'default' as const, 
        icon: Clock, 
        label: 'Aguardando Usuário' 
      },
      'resolved': { 
        variant: 'secondary' as const, 
        icon: CheckCircle, 
        label: 'Resolvido' 
      },
      'closed': { 
        variant: 'outline' as const, 
        icon: CheckCircle, 
        label: 'Fechado' 
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon size={12} />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      'low': { color: 'bg-green-100 text-green-800', label: 'Baixa' },
      'medium': { color: 'bg-blue-100 text-blue-800', label: 'Normal' },
      'high': { color: 'bg-yellow-100 text-yellow-800', label: 'Alta' },
      'urgent': { color: 'bg-red-100 text-red-800', label: 'Urgente' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-1">
            {ticket.subject}
          </CardTitle>
          <div className="flex gap-2 ml-2">
            {getStatusBadge(ticket.status)}
            {getPriorityBadge(ticket.priority)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {ticket.description}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>
                {new Date(ticket.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
          
          <Button size="sm" variant="ghost" className="h-auto p-1">
            <MessageSquare size={12} className="mr-1" />
            Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
