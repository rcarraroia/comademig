
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
import { SuporteTicket } from "@/hooks/useSuporteTickets";

interface TicketCardProps {
  ticket: SuporteTicket;
  onClick: () => void;
}

export const TicketCard = ({ ticket, onClick }: TicketCardProps) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'aberto': { 
        variant: 'destructive' as const, 
        icon: AlertCircle, 
        label: 'Aberto' 
      },
      'em_andamento': { 
        variant: 'default' as const, 
        icon: Clock, 
        label: 'Em Andamento' 
      },
      'resolvido': { 
        variant: 'secondary' as const, 
        icon: CheckCircle, 
        label: 'Resolvido' 
      },
      'fechado': { 
        variant: 'outline' as const, 
        icon: CheckCircle, 
        label: 'Fechado' 
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.aberto;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon size={12} />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (prioridade: string) => {
    const priorityConfig = {
      'baixa': { color: 'bg-green-100 text-green-800', label: 'Baixa' },
      'normal': { color: 'bg-blue-100 text-blue-800', label: 'Normal' },
      'alta': { color: 'bg-yellow-100 text-yellow-800', label: 'Alta' },
      'urgente': { color: 'bg-red-100 text-red-800', label: 'Urgente' }
    };
    
    const config = priorityConfig[prioridade as keyof typeof priorityConfig] || priorityConfig.normal;
    
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
            {ticket.assunto}
          </CardTitle>
          <div className="flex gap-2 ml-2">
            {getStatusBadge(ticket.status)}
            {getPriorityBadge(ticket.prioridade)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {ticket.descricao}
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
