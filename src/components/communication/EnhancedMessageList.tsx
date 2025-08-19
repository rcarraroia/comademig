
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Mail, 
  MailOpen, 
  Star, 
  Archive, 
  Trash2, 
  MoreVertical,
  User,
  Building,
  Calendar,
  Reply
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

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

interface EnhancedMessageListProps {
  mensagens: Mensagem[];
  isLoading: boolean;
  currentUserId?: string;
  selectedMessages: string[];
  onSelectMessage: (mensagem: Mensagem) => void;
  onMarkAsRead: (mensagemId: string) => void;
  onToggleSelection: (mensagemId: string) => void;
  onSelectAll: () => void;
  onReply: (destinatarioId: string, assuntoOriginal: string) => void;
}

export const EnhancedMessageList = ({
  mensagens,
  isLoading,
  currentUserId,
  selectedMessages,
  onSelectMessage,
  onMarkAsRead,
  onToggleSelection,
  onSelectAll,
  onReply
}: EnhancedMessageListProps) => {
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (mensagens.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma mensagem encontrada</p>
      </div>
    );
  }

  const allSelected = mensagens.length > 0 && selectedMessages.length === mensagens.length;
  const someSelected = selectedMessages.length > 0;

  return (
    <div className="space-y-2">
      {/* Header com seleção em massa */}
      {mensagens.length > 0 && (
        <div className="flex items-center gap-3 p-3 border-b">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
            className="data-[state=checked]:bg-comademig-blue"
          />
          <span className="text-sm text-gray-600">
            {someSelected 
              ? `${selectedMessages.length} mensagens selecionadas`
              : `${mensagens.length} mensagens`
            }
          </span>
        </div>
      )}

      {/* Lista de mensagens */}
      <div className="space-y-1">
        {mensagens.map((mensagem) => {
          const isReceived = mensagem.destinatario_id === currentUserId;
          const contact = isReceived ? mensagem.remetente : mensagem.destinatario;
          const isSelected = selectedMessages.includes(mensagem.id);
          const isHovered = hoveredMessage === mensagem.id;
          
          return (
            <Card
              key={mensagem.id}
              className={`cursor-pointer transition-all duration-200 ${
                !mensagem.lida && isReceived ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
              } ${isSelected ? 'ring-2 ring-comademig-blue' : ''}`}
              onMouseEnter={() => setHoveredMessage(mensagem.id)}
              onMouseLeave={() => setHoveredMessage(null)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Checkbox de seleção */}
                  <div className={`transition-opacity duration-200 ${
                    isHovered || isSelected ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelection(mensagem.id)}
                      className="data-[state=checked]:bg-comademig-blue"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="bg-comademig-blue text-white">
                      {contact?.nome_completo.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Conteúdo da mensagem */}
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onSelectMessage(mensagem)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <h3 className={`font-semibold truncate ${
                          !mensagem.lida && isReceived ? 'text-comademig-blue' : 'text-gray-900'
                        }`}>
                          {contact?.nome_completo || 'Usuário'}
                        </h3>
                        
                        <div className="flex items-center gap-1 text-xs">
                          <Badge variant={isReceived ? "default" : "outline"} className="text-xs">
                            {isReceived ? 'De' : 'Para'}
                          </Badge>
                          {!mensagem.lida && isReceived && (
                            <Badge variant="destructive" className="text-xs">
                              Nova
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-500">
                          {format(new Date(mensagem.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                        
                        {/* Menu de ações */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!mensagem.lida && isReceived) {
                                  onMarkAsRead(mensagem.id);
                                }
                              }}
                            >
                              {!mensagem.lida && isReceived ? (
                                <>
                                  <MailOpen className="h-4 w-4 mr-2" />
                                  Marcar como lida
                                </>
                              ) : (
                                <>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Marcar como não lida
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                const replyToId = isReceived ? mensagem.remetente_id : mensagem.destinatario_id;
                                onReply(replyToId, `Re: ${mensagem.assunto}`);
                              }}
                            >
                              <Reply className="h-4 w-4 mr-2" />
                              Responder
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Star className="h-4 w-4 mr-2" />
                              Favoritar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Archive className="h-4 w-4 mr-2" />
                              Arquivar
                            </DropdownMenuItem>
                            <Separator className="my-1" />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <h4 className={`font-medium text-sm mb-1 ${
                      !mensagem.lida && isReceived ? 'text-comademig-blue' : 'text-gray-800'
                    }`}>
                      {mensagem.assunto}
                    </h4>

                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {mensagem.conteudo}
                    </p>

                    {/* Informações do contato */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {contact?.cargo && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{contact.cargo}</span>
                        </div>
                      )}
                      {contact?.igreja && (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          <span>{contact.igreja}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
