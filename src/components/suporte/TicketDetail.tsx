
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Send, 
  User, 
  HeadphonesIcon,
  Clock
} from "lucide-react";
import { SuporteTicket, SuporteMensagem, useSuporteTickets } from "@/hooks/useSuporteTickets";
import { useAuth } from "@/contexts/AuthContext";

interface TicketDetailProps {
  ticket: SuporteTicket;
  onBack: () => void;
}

export const TicketDetail = ({ ticket, onBack }: TicketDetailProps) => {
  const [novaMensagem, setNovaMensagem] = useState("");
  const [mensagens, setMensagens] = useState<SuporteMensagem[]>([]);
  const [loadingMensagens, setLoadingMensagens] = useState(true);
  
  const { getMensagens, enviarMensagem } = useSuporteTickets();
  const { user } = useAuth();

  useEffect(() => {
    carregarMensagens();
  }, [ticket.id]);

  const carregarMensagens = async () => {
    try {
      setLoadingMensagens(true);
      const data = await getMensagens(ticket.id);
      setMensagens(data);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoadingMensagens(false);
    }
  };

  const handleEnviarMensagem = async () => {
    if (!novaMensagem.trim()) return;
    
    try {
      await enviarMensagem.mutateAsync({
        ticketId: ticket.id,
        mensagem: novaMensagem.trim()
      });
      
      setNovaMensagem("");
      carregarMensagens(); // Recarregar mensagens após enviar
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto': return 'bg-red-100 text-red-800';
      case 'em_andamento': return 'bg-blue-100 text-blue-800';
      case 'resolvido': return 'bg-green-100 text-green-800';
      case 'fechado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{ticket.assunto}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={getStatusColor(ticket.status)}>
              {ticket.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge variant="outline">
              Prioridade: {ticket.prioridade.toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Criado em {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* Descrição inicial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Descrição do Problema</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{ticket.descricao}</p>
        </CardContent>
      </Card>

      {/* Conversação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeadphonesIcon className="h-5 w-5" />
            Conversação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingMensagens ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-comademig-blue mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Carregando mensagens...</p>
            </div>
          ) : mensagens.length > 0 ? (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {mensagens.map((mensagem) => (
                <div key={mensagem.id} className="flex gap-3">
                  <div className="flex-shrink-0">
                    {mensagem.user_id === user?.id ? (
                      <div className="w-8 h-8 bg-comademig-blue rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-comademig-gold rounded-full flex items-center justify-center">
                        <HeadphonesIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {mensagem.user_id === user?.id ? 'Você' : 'Suporte'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(mensagem.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm whitespace-pre-wrap">{mensagem.mensagem}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <HeadphonesIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma mensagem ainda. Envie uma mensagem para iniciar a conversa.</p>
            </div>
          )}
          
          <Separator />
          
          {/* Input para nova mensagem */}
          <div className="space-y-3">
            <Textarea
              placeholder="Digite sua mensagem..."
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleEnviarMensagem}
                disabled={!novaMensagem.trim() || enviarMensagem.isPending}
                className="bg-comademig-blue hover:bg-comademig-blue/90"
              >
                {enviarMensagem.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Mensagem
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
