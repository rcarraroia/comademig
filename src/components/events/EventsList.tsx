
import { EventCard } from './EventCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Calendar } from 'lucide-react';

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

interface InscricaoEvento {
  id: string;
  evento_id: string;
  status: string;
  valor_pago?: number;
  data_pagamento?: string;
  created_at: string;
}

interface EventsListProps {
  eventos: Evento[] | undefined;
  inscricoes?: InscricaoEvento[];
  isLoading: boolean;
  onInscrever: (eventoId: string) => void;
  onCancelar: (eventoId: string) => void;
  loadingInscricao?: string;
}

export const EventsList = ({
  eventos,
  inscricoes = [],
  isLoading,
  onInscrever,
  onCancelar,
  loadingInscricao
}: EventsListProps) => {
  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-12" />;
  }

  if (!eventos || eventos.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="h-12 w-12 text-gray-400" />}
        title="Nenhum evento disponível"
        description="Não há eventos programados no momento. Fique atento às próximas novidades!"
      />
    );
  }

  const eventosInscritos = inscricoes?.map(i => i.evento_id) || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {eventos.map((evento) => (
        <EventCard
          key={evento.id}
          evento={evento}
          isInscrito={eventosInscritos.includes(evento.id)}
          onInscrever={onInscrever}
          onCancelar={(eventoId) => {
            const inscricao = inscricoes?.find(i => i.evento_id === eventoId);
            if (inscricao) {
              onCancelar(inscricao.id);
            }
          }}
          loading={loadingInscricao === evento.id}
        />
      ))}
    </div>
  );
};
