
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, MapPin, Users, DollarSign, Award, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// import { PaymentForm } from '@/components/payments/PaymentForm'; // Removido - sistema em reconstrução

interface Evento {
  id: string;
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim: string;
  local?: string;
  preco?: number;
  vagas?: number;
  imagem_url?: string;
  certificado_disponivel?: boolean;
  requer_presenca?: boolean;
  carga_horaria?: number;
  tipo_evento?: string;
}

interface EventRegistrationModalProps {
  evento: Evento | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EventRegistrationModal = ({
  evento,
  isOpen,
  onClose,
  onSuccess
}: EventRegistrationModalProps) => {
  const [showPayment, setShowPayment] = useState(false);

  if (!evento) return null;

  const isEventoPago = evento.preco && evento.preco > 0;
  const dataInicio = new Date(evento.data_inicio);
  const dataFim = new Date(evento.data_fim);

  const handleConfirmRegistration = () => {
    if (isEventoPago) {
      setShowPayment(true);
    } else {
      // Para eventos gratuitos, fazer inscrição direta
      onSuccess();
      onClose();
    }
  };

  const handlePaymentSuccess = (cobranca: any) => {
    onClose();
    // Redirecionar para página de checkout
    window.location.href = `/checkout/${cobranca.id}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inscrição no Evento</DialogTitle>
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
              <div className="flex flex-col gap-2">
                <Badge variant={isEventoPago ? "default" : "secondary"}>
                  {isEventoPago ? `R$ ${evento.preco?.toFixed(2)}` : 'Gratuito'}
                </Badge>
                {evento.tipo_evento && (
                  <Badge variant="outline">
                    {evento.tipo_evento}
                  </Badge>
                )}
              </div>
            </div>

            {evento.descricao && (
              <p className="text-gray-600 mb-6">{evento.descricao}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

            {evento.certificado_disponivel && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg mb-4">
                <Award className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  Certificado disponível após o evento
                </span>
              </div>
            )}

            {!showPayment ? (
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleConfirmRegistration} className="flex-1">
                  {isEventoPago ? 'Prosseguir com Pagamento' : 'Confirmar Inscrição'}
                </Button>
              </div>
            ) : (
              <div>
                <h4 className="text-lg font-medium mb-4">Finalizar Inscrição</h4>
                <div className="text-center py-8">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Sistema de pagamentos em manutenção. Para se inscrever neste evento, entre em contato conosco.
                    </AlertDescription>
                  </Alert>
                  <div className="mt-4 space-y-2">
                    <p><strong>Telefone:</strong> (31) 3333-4444</p>
                    <p><strong>Email:</strong> eventos@comademig.org.br</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
