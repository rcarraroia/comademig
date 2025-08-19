
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Evento {
  id: string;
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim: string;
  local?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  preco?: number;
  vagas?: number;
  imagem_url?: string;
  status: string;
}

interface EventCardProps {
  evento: Evento;
  isInscrito?: boolean;
  onInscrever?: (eventoId: string) => void;
  onCancelar?: (eventoId: string) => void;
  loading?: boolean;
}

export const EventCard = ({ 
  evento, 
  isInscrito = false, 
  onInscrever, 
  onCancelar,
  loading = false 
}: EventCardProps) => {
  const dataInicio = new Date(evento.data_inicio);
  const dataFim = new Date(evento.data_fim);
  const isEventoPago = evento.preco && evento.preco > 0;
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {evento.imagem_url && (
        <div className="aspect-video overflow-hidden">
          <img
            src={evento.imagem_url}
            alt={evento.titulo}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{evento.titulo}</CardTitle>
          <Badge variant={isEventoPago ? "default" : "secondary"}>
            {isEventoPago ? `R$ ${evento.preco?.toFixed(2)}` : 'Gratuito'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {evento.descricao && (
          <p className="text-gray-600 text-sm line-clamp-3">
            {evento.descricao}
          </p>
        )}
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>
              {format(dataInicio, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              {dataInicio.toDateString() !== dataFim.toDateString() && 
                ` - ${format(dataFim, "dd 'de' MMMM", { locale: ptBR })}`
              }
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>
              {format(dataInicio, "HH:mm")} - {format(dataFim, "HH:mm")}
            </span>
          </div>
          
          {evento.local && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>{evento.local}</span>
            </div>
          )}
          
          {evento.vagas && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span>{evento.vagas} vagas disponíveis</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 pt-2">
          {!isInscrito ? (
            <Button 
              onClick={() => onInscrever?.(evento.id)}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Inscrevendo...' : 'Inscrever-se'}
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Badge variant="success" className="flex-1 justify-center py-2">
                Inscrito
              </Badge>
              <Button 
                variant="outline"
                onClick={() => onCancelar?.(evento.id)}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
