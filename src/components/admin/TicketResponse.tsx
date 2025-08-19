
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AdminTicket } from "@/hooks/useAdminData";
import { useSupabaseMutation } from "@/hooks/useSupabaseQuery";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface TicketResponseProps {
  ticket: AdminTicket;
  onClose: () => void;
  onUpdate: () => void;
}

const TicketResponse = ({ ticket, onClose, onUpdate }: TicketResponseProps) => {
  const [response, setResponse] = useState("");
  const [newStatus, setNewStatus] = useState(ticket.status);
  const [newPriority, setNewPriority] = useState(ticket.prioridade);

  const updateTicketMutation = useSupabaseMutation(
    async ({ ticketId, status, prioridade }: { ticketId: string; status: string; prioridade: string }) => {
      const { error } = await supabase
        .from('suporte')
        .update({ 
          status, 
          prioridade,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;
    },
    {
      successMessage: "Ticket atualizado com sucesso",
      onSuccess: () => {
        onUpdate();
      }
    }
  );

  const sendResponseMutation = useSupabaseMutation(
    async ({ ticketId, mensagem }: { ticketId: string; mensagem: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('suporte_mensagens')
        .insert({
          suporte_id: ticketId,
          user_id: user.id,
          mensagem
        });

      if (error) throw error;
    },
    {
      successMessage: "Resposta enviada com sucesso",
      onSuccess: () => {
        setResponse("");
        onUpdate();
      }
    }
  );

  const handleUpdateTicket = async () => {
    if (newStatus !== ticket.status || newPriority !== ticket.prioridade) {
      await updateTicketMutation.mutateAsync({
        ticketId: ticket.id,
        status: newStatus,
        prioridade: newPriority
      });
    }
  };

  const handleSendResponse = async () => {
    if (!response.trim()) return;

    await sendResponseMutation.mutateAsync({
      ticketId: ticket.id,
      mensagem: response
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto': return 'bg-red-100 text-red-800';
      case 'em_andamento': return 'bg-yellow-100 text-yellow-800';
      case 'resolvido': return 'bg-green-100 text-green-800';
      case 'fechado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'baixa': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aberto': return <AlertCircle className="h-4 w-4" />;
      case 'em_andamento': return <Clock className="h-4 w-4" />;
      case 'resolvido': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Gerenciar Ticket</CardTitle>
              <Button variant="ghost" onClick={onClose}>×</Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            {/* Informações do Ticket */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Detalhes do Ticket</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(ticket.status)}
                    <span className="font-medium">{ticket.assunto}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Por: {ticket.profiles?.nome_completo || 'Usuário'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Criado em: {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Status Atual</h3>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(ticket.prioridade)}>
                    {ticket.prioridade}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Descrição</h3>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">{ticket.descricao}</p>
              </div>
            </div>

            {/* Atualizar Status e Prioridade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aberto">Aberto</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="resolvido">Resolvido</SelectItem>
                    <SelectItem value="fechado">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridade
                </label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resposta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resposta do Administrador
              </label>
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Digite sua resposta aqui..."
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              
              {(newStatus !== ticket.status || newPriority !== ticket.prioridade) && (
                <Button 
                  onClick={handleUpdateTicket}
                  disabled={updateTicketMutation.isPending}
                  variant="secondary"
                >
                  {updateTicketMutation.isPending ? "Atualizando..." : "Atualizar Status"}
                </Button>
              )}
              
              {response.trim() && (
                <Button 
                  onClick={handleSendResponse}
                  disabled={sendResponseMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendResponseMutation.isPending ? "Enviando..." : "Enviar Resposta"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TicketResponse;
