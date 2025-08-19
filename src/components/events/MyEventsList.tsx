
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Calendar, MapPin, DollarSign, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InscricaoEvento {
  id: string;
  status: string;
  valor_pago?: number;
  data_pagamento?: string;
  created_at: string;
  eventos: {
    titulo: string;
    data_inicio: string;
    data_fim: string;
    local?: string;
  };
}

interface MyEventsListProps {
  inscricoes: InscricaoEvento[] | undefined;
  isLoading: boolean;
  onCancelar: (inscricaoId: string) => void;
  loadingCancelamento?: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'confirmado':
      return <Badge variant="success">Confirmado</Badge>;
    case 'pendente':
      return <Badge variant="warning">Pendente</Badge>;
    case 'cancelado':
      return <Badge variant="destructive">Cancelado</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export const MyEventsList = ({
  inscricoes,
  isLoading,
  onCancelar,
  loadingCancelamento
}: MyEventsListProps) => {
  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-12" />;
  }

  if (!inscricoes || inscricoes.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="h-12 w-12 text-gray-400" />}
        title="Nenhuma inscrição encontrada"
        description="Você ainda não se inscreveu em nenhum evento. Explore os eventos disponíveis!"
      />
    );
  }

  return (
    <div className="space-y-4">
      {inscricoes.map((inscricao) => {
        const dataEvento = new Date(inscricao.eventos.data_inicio);
        const dataFim = new Date(inscricao.eventos.data_fim);
        const isEventoPassado = dataEvento < new Date();
        
        return (
          <Card key={inscricao.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {inscricao.eventos.titulo}
                </CardTitle>
                {getStatusBadge(inscricao.status)}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>
                      {format(dataEvento, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>
                      {format(dataEvento, "HH:mm")} - {format(dataFim, "HH:mm")}
                    </span>
                  </div>
                  
                  {inscricao.eventos.local && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{inscricao.eventos.local}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  {inscricao.valor_pago && inscricao.valor_pago > 0 && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span>R$ {inscricao.valor_pago.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>
                      Inscrito em {format(new Date(inscricao.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                {inscricao.status === 'confirmado' && !isEventoPassado && (
                  <Button
                    variant="outline"
                    onClick={() => onCancelar(inscricao.id)}
                    disabled={loadingCancelamento === inscricao.id}
                  >
                    {loadingCancelamento === inscricao.id ? 'Cancelando...' : 'Cancelar Inscrição'}
                  </Button>
                )}
                
                {inscricao.status === 'pendente' && inscricao.valor_pago && inscricao.valor_pago > 0 && (
                  <Button variant="default">
                    Finalizar Pagamento
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
