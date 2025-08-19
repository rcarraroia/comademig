
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, DollarSign, Award, QrCode, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CertificateGenerator } from './CertificateGenerator';
import { PresenceScanner } from './PresenceScanner';

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
  certificado_disponivel?: boolean;
  requer_presenca?: boolean;
  carga_horaria?: number;
  tipo_evento?: string;
}

interface EventDetailModalProps {
  evento: Evento | null;
  isOpen: boolean;
  onClose: () => void;
  isInscrito?: boolean;
  onInscrever?: () => void;
  onCancelar?: () => void;
}

export const EventDetailModal = ({
  evento,
  isOpen,
  onClose,
  isInscrito = false,
  onInscrever,
  onCancelar
}: EventDetailModalProps) => {
  if (!evento) return null;

  const isEventoPago = evento.preco && evento.preco > 0;
  const dataInicio = new Date(evento.data_inicio);
  const dataFim = new Date(evento.data_fim);
  const eventoJaPassou = new Date() > dataFim;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Detalhes do Evento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {evento.imagem_url && (
            <div className="aspect-video overflow-hidden rounded-lg">
              <img
                src={evento.imagem_url}
                alt={evento.titulo}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-semibold">{evento.titulo}</h3>
              <div className="flex flex-col gap-1">
                <Badge variant={isEventoPago ? "default" : "secondary"}>
                  {isEventoPago ? `R$ ${evento.preco?.toFixed(2)}` : 'Gratuito'}
                </Badge>
                {evento.tipo_evento && (
                  <Badge variant="outline">
                    {evento.tipo_evento}
                  </Badge>
                )}
                {isInscrito && (
                  <Badge variant="success">
                    Inscrito
                  </Badge>
                )}
              </div>
            </div>

            <Tabs defaultValue="info" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="certificado">Certificado</TabsTrigger>
                <TabsTrigger value="presenca" disabled={!isInscrito || !evento.requer_presenca}>
                  Presença
                </TabsTrigger>
                <TabsTrigger value="inscricao">Inscrição</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                {evento.descricao && (
                  <div>
                    <h4 className="font-medium mb-2">Descrição</h4>
                    <p className="text-gray-600">{evento.descricao}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {format(dataInicio, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      {dataInicio.toDateString() !== dataFim.toDateString() && 
                        ` - ${format(dataFim, "dd 'de' MMMM", { locale: ptBR })}`
                      }
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {format(dataInicio, "HH:mm")} - {format(dataFim, "HH:mm")}
                    </span>
                  </div>

                  {evento.local && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{evento.local}</span>
                    </div>
                  )}

                  {evento.vagas && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{evento.vagas} vagas disponíveis</span>
                    </div>
                  )}

                  {evento.carga_horaria && (
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{evento.carga_horaria}h de carga horária</span>
                    </div>
                  )}
                </div>

                {evento.endereco && (
                  <div>
                    <h4 className="font-medium mb-2">Endereço Completo</h4>
                    <p className="text-gray-600">
                      {evento.endereco}
                      {evento.cidade && `, ${evento.cidade}`}
                      {evento.estado && ` - ${evento.estado}`}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="certificado">
                <CertificateGenerator
                  evento={{
                    id: evento.id,
                    titulo: evento.titulo,
                    data_inicio: evento.data_inicio,
                    data_fim: evento.data_fim,
                    carga_horaria: evento.carga_horaria,
                    certificado_disponivel: evento.certificado_disponivel
                  }}
                  isInscrito={isInscrito}
                  eventoJaPassou={eventoJaPassou}
                />
              </TabsContent>

              <TabsContent value="presenca">
                {isInscrito && evento.requer_presenca ? (
                  <PresenceScanner
                    eventoId={evento.id}
                    eventoTitulo={evento.titulo}
                  />
                ) : (
                  <div className="text-center p-8 text-gray-500">
                    <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Registro de presença não disponível</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="inscricao" className="space-y-4">
                {!isInscrito ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="font-medium mb-2">Fazer Inscrição</h4>
                      <p className="text-gray-600 mb-4">
                        Você ainda não está inscrito neste evento.
                      </p>
                      {isEventoPago && (
                        <div className="text-center mb-4">
                          <span className="text-2xl font-bold text-green-600">
                            R$ {evento.preco?.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button onClick={onInscrever} className="w-full">
                      Inscrever-se
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Badge variant="success" className="mb-2">
                        Inscrito
                      </Badge>
                      <p className="text-sm text-green-700">
                        Você está inscrito neste evento!
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={onCancelar}
                      className="w-full"
                    >
                      Cancelar Inscrição
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
