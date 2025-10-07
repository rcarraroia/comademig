import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Send, 
  ArrowLeft, 
  User, 
  Clock, 
  MessageSquare,
  AlertCircle,
  Loader2,
  CheckCircle2,
  UserCheck,
  Calendar
} from 'lucide-react';
import { useTicket } from '@/hooks/useSupport';
import { useTicketMessages, useCreateMessage, formatMessageTime } from '@/hooks/useSupportMessages';
import { getStatusColor, getStatusLabel, getPriorityColor, getPriorityLabel } from '@/hooks/useSupportMessages';
import type { SupportTicket, SupportMessage } from '@/hooks/useSupport';

interface TicketChatProps {
  ticketId: string;
  onBack?: () => void;
  className?: string;
}

const TicketChat: React.FC<TicketChatProps> = ({ 
  ticketId, 
  onBack, 
  className = '' 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: ticket, isLoading: loadingTicket } = useTicket(ticketId);
  const { data: messages, isLoading: loadingMessages } = useTicketMessages(ticketId);
  const createMessageMutation = useCreateMessage();

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      return;
    }

    createMessageMutation.mutate({
      ticket_id: ticketId,
      message: newMessage.trim(),
      is_staff_reply: false,
    }, {
      onSuccess: () => {
        setNewMessage('');
      }
    });
  };

  const formatTicketDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loadingTicket) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando ticket...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!ticket) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ticket não encontrado ou você não tem permissão para visualizá-lo.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <CardTitle className="text-lg">{ticket.subject}</CardTitle>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <Badge className={getStatusColor(ticket.status)}>
                {getStatusLabel(ticket.status)}
              </Badge>
              <Badge className={getPriorityColor(ticket.priority)}>
                {getPriorityLabel(ticket.priority)}
              </Badge>
              {ticket.category && (
                <Badge variant="outline">
                  {ticket.category.name}
                </Badge>
              )}
            </div>

            <CardDescription className="text-sm">
              {ticket.description}
            </CardDescription>

            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Criado em {formatTicketDate(ticket.created_at)}
              </div>
              
              {ticket.assigned_user && (
                <div className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  Atribuído a {ticket.assigned_user.nome_completo}
                </div>
              )}

              {ticket.resolved_at && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Resolvido em {formatTicketDate(ticket.resolved_at)}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Área de mensagens */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {loadingMessages ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Carregando mensagens...</span>
            </div>
          ) : messages && messages.length > 0 ? (
            <>
              {messages.map((message: SupportMessage) => (
                <div
                  key={message.id}
                  className={`flex ${message.is_staff_reply ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.is_staff_reply
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-comademig-blue text-white'
                    }`}
                  >
                    {/* Header da mensagem */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="text-xs font-medium">
                          {message.user?.nome_completo || 'Usuário'}
                        </span>
                      </div>
                      
                      {message.is_staff_reply && (
                        <Badge variant="secondary" className="text-xs">
                          Suporte
                        </Badge>
                      )}
                      
                      {message.is_internal_note && (
                        <Badge variant="outline" className="text-xs">
                          Nota Interna
                        </Badge>
                      )}
                    </div>

                    {/* Conteúdo da mensagem */}
                    <div className="text-sm whitespace-pre-wrap">
                      {message.message}
                    </div>

                    {/* Timestamp */}
                    <div className={`text-xs mt-2 ${
                      message.is_staff_reply ? 'text-gray-500' : 'text-blue-100'
                    }`}>
                      {formatMessageTime(message.created_at)}
                    </div>

                    {/* Anexos (futuro) */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 text-xs">
                        📎 {message.attachments.length} anexo(s)
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma mensagem ainda</p>
              <p className="text-xs">Envie uma mensagem para iniciar a conversa</p>
            </div>
          )}
        </div>

        {/* Formulário de nova mensagem */}
        {ticket.status !== 'closed' && (
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="space-y-3">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                rows={3}
                maxLength={1000}
                disabled={createMessageMutation.isPending}
              />
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {newMessage.length}/1000 caracteres
                </div>
                
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || createMessageMutation.isPending}
                  className="bg-comademig-blue hover:bg-comademig-blue/90"
                >
                  {createMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Aviso se ticket fechado */}
        {ticket.status === 'closed' && (
          <div className="border-t p-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este ticket foi fechado. Para continuar a conversa, crie um novo ticket.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TicketChat;