
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Search, Plus, Award, QrCode } from "lucide-react";
import { useEventos } from "@/hooks/useEventos";
import { EventsList } from "@/components/events/EventsList";
import { MyEventsList } from "@/components/events/MyEventsList";
import { MeusCertificados } from "@/components/events/MeusCertificados";
import { QRCodeScanner } from "@/components/events/QRCodeScanner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { useToast } from "@/hooks/use-toast";

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

interface InscricaoEvento {
  id: string;
  status: string;
  valor_pago?: number;
  data_pagamento?: string;
  created_at: string;
  evento_id: string;
  eventos: {
    titulo: string;
    data_inicio: string;
    data_fim: string;
    local?: string;
    certificado_disponivel?: boolean;
  };
}

const EventosDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingInscricao, setLoadingInscricao] = useState<string | undefined>();
  const [loadingCancelamento, setLoadingCancelamento] = useState<string | undefined>();
  const [showScanner, setShowScanner] = useState(false);
  const { toast } = useToast();

  const {
    eventos,
    minhasInscricoes,
    isLoading,
    error,
    inscreverEvento,
    cancelarInscricao,
    refetch
  } = useEventos();

  const filteredEventos = (eventos as Evento[] || []).filter(evento =>
    evento.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    evento.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInscrever = async (eventoId: string) => {
    try {
      setLoadingInscricao(eventoId);
      const evento = (eventos as Evento[] || []).find(e => e.id === eventoId);
      
      await inscreverEvento.mutateAsync({
        eventoId,
        valor: evento?.preco || 0
      });
      
      refetch();
    } catch (error: any) {
      console.error('Erro ao se inscrever:', error);
    } finally {
      setLoadingInscricao(undefined);
    }
  };

  const handleCancelar = async (inscricaoId: string) => {
    try {
      setLoadingCancelamento(inscricaoId);
      await cancelarInscricao.mutateAsync(inscricaoId);
      refetch();
    } catch (error: any) {
      console.error('Erro ao cancelar:', error);
    } finally {
      setLoadingCancelamento(undefined);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <ErrorMessage
          message="Erro ao carregar eventos. Tente novamente."
          retry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Eventos</h1>
          <p className="text-gray-600">
            Participe dos eventos da COMADEMIG e obtenha certificados
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Sugerir Evento
        </Button>
      </div>

      <Tabs defaultValue="todos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todos">Todos os Eventos</TabsTrigger>
          <TabsTrigger value="minhas">Minhas Inscrições</TabsTrigger>
          <TabsTrigger value="certificados">Meus Certificados</TabsTrigger>
          <TabsTrigger value="presenca">Presença</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Eventos Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar eventos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <EventsList
                eventos={filteredEventos}
                inscricoes={minhasInscricoes as InscricaoEvento[] || []}
                isLoading={isLoading}
                onInscrever={handleInscrever}
                onCancelar={handleCancelar}
                loadingInscricao={loadingInscricao}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="minhas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Minhas Inscrições
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MyEventsList
                inscricoes={minhasInscricoes as InscricaoEvento[] || []}
                isLoading={isLoading}
                onCancelar={handleCancelar}
                loadingCancelamento={loadingCancelamento}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificados" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Meus Certificados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MeusCertificados />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presenca" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Registro de Presença
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showScanner ? (
                <div className="text-center py-12">
                  <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Scanner de Presença
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Registre sua presença nos eventos escaneando o QR Code disponibilizado no local.
                  </p>
                  <Button onClick={() => setShowScanner(true)}>
                    <QrCode className="h-4 w-4 mr-2" />
                    Abrir Scanner
                  </Button>
                </div>
              ) : (
                <QRCodeScanner onClose={() => setShowScanner(false)} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventosDashboard;
