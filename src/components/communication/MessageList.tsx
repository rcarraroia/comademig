
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Mail, MailOpen, User, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Mensagem {
  id: string;
  assunto: string;
  conteudo: string;
  lida: boolean;
  created_at: string;
  remetente_id: string;
  destinatario_id: string;
  remetente?: {
    nome_completo: string;
    cargo?: string;
    igreja?: string;
  };
  destinatario?: {
    nome_completo: string;
    cargo?: string;
    igreja?: string;
  };
}

interface MessageListProps {
  mensagens: Mensagem[] | undefined;
  isLoading: boolean;
  currentUserId?: string;
  onSelectMessage: (mensagem: Mensagem) => void;
  onMarkAsRead: (mensagemId: string) => void;
}

export const MessageList = ({
  mensagens,
  isLoading,
  currentUserId,
  onSelectMessage,
  onMarkAsRead
}: MessageListProps) => {
  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-12" />;
  }

  if (!mensagens || mensagens.length === 0) {
    return (
      <EmptyState
        icon={<Mail className="h-12 w-12 text-gray-400" />}
        title="Nenhuma mensagem encontrada"
        description="Você ainda não possui mensagens. Comece uma conversa com outros membros!"
      />
    );
  }

  return (
    <div className="space-y-4">
      {mensagens.map((mensagem) => {
        const isReceived = mensagem.destinatario_id === currentUserId;
        const contact = isReceived ? mensagem.remetente : mensagem.destinatario;
        const isUnread = isReceived && !mensagem.lida;
        
        return (
          <Card
            key={mensagem.id}
            className={`cursor-pointer transition-colors hover:bg-gray-50 ${
              isUnread ? 'border-blue-200 bg-blue-50' : ''
            }`}
            onClick={() => {
              onSelectMessage(mensagem);
              if (isUnread) {
                onMarkAsRead(mensagem.id);
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-comademig-blue text-white">
                    {contact?.nome_completo.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-medium ${isUnread ? 'font-semibold' : ''}`}>
                        {contact?.nome_completo || 'Usuário'}
                      </h4>
                      {contact?.cargo && (
                        <Badge variant="secondary" className="text-xs">
                          {contact.cargo}
                        </Badge>
                      )}
                      {isUnread && (
                        <Badge variant="default" className="text-xs">
                          Nova
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {format(new Date(mensagem.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                  
                  <p className={`text-sm mb-2 ${isUnread ? 'font-medium' : ''}`}>
                    {mensagem.assunto}
                  </p>
                  
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {mensagem.conteudo}
                  </p>
                  
                  {contact?.igreja && (
                    <p className="text-xs text-gray-500 mt-1">
                      {contact.igreja}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  {isUnread ? (
                    <Mail className="h-5 w-5 text-blue-600" />
                  ) : (
                    <MailOpen className="h-5 w-5 text-gray-400" />
                  )}
                  
                  <Badge variant={isReceived ? "secondary" : "outline"} className="text-xs">
                    {isReceived ? 'Recebida' : 'Enviada'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
