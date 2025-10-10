
import { useState } from "react";
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
import { SupportTicket, useTicket } from "@/hooks/useSupport";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface TicketDetailProps {
  ticket: SupportTicket;
  onBack: () => void;
}

export const TicketDetail = ({ ticket: initialTicket, onBack }: TicketDetailProps) => {
  const [novaMensagem, setNovaMensagem] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Buscar ticket completo com mensagens
  const { data: ticket, isLoading: loadingMensagens } = useTicket(initialTicket.id);
  
  // Mutation para enviar mensagem
  const enviarMensagem = useMutation({
    mutationFn: async (message: string) => {
      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: initialTicket.id,
          message: message,
          is_staff_reply: false,
          is_internal_note: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', initialTicket.id] });
      toast.success('Mensagem enviada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao enviar mensagem: ' + error.message);
    },
  });

  const handleEnviarMensagem = async () => {
    if (!novaMensagem.trim()) return;
    
    await enviarMensagem.mutateAsync(novaMensagem.trim());
    setNovaMensagem("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'waiting_user': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'open': 'ABERTO',
      'in_progress': 'EM ANDAMENTO',
      'waiting_user': 'AGUARDANDO USUÁRIO',
      'resolved': 'RESOLVIDO',
      'closed': 'FECHADO'
    };
    return labels[status] || status.toUpperCase();
  };
  
  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      'low': 'BAIXA',
      'medium': 'NORMAL',
      'high': 'ALTA',
      'urgent': 'URGENTE'
    };
    return labels[priority] || priority.toUpperCase();
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
          <h1 className="text-xl font-semibold">{initialTicket.subject}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={getStatusColor(initialTicket.status)}>
              {getStatusLabel(initialTicket.status)}
            </Badge>
            <Badge variant="outline">
              Prioridade: {getPriorityLabel(initialTicket.priority)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Criado em {new Date(initialTicket.created_at).toLocaleDateString('pt-BR')}
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
          <p className="text-sm whitespace-pre-wrap">{initialTicket.description}</p>
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
          ) : ticket?.messages && ticket.messages.length > 0 ? (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {ticket.messages.map((mensagem: any) => (
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
                        {mensagem.user_id === user?.id ? 'Você' : (mensagem.user?.nome_completo || 'Suporte')}
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
                      <p className="text-sm whitespace-pre-wrap">{mensagem.message}</p>
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
