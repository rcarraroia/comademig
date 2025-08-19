
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Reply, ArrowLeft, User, Building, Calendar } from "lucide-react";
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

interface MessageDetailProps {
  mensagem: Mensagem;
  currentUserId?: string;
  onBack: () => void;
  onReply: (destinatarioId: string, assuntoOriginal: string) => void;
}

export const MessageDetail = ({
  mensagem,
  currentUserId,
  onBack,
  onReply
}: MessageDetailProps) => {
  const isReceived = mensagem.destinatario_id === currentUserId;
  const contact = isReceived ? mensagem.remetente : mensagem.destinatario;
  const replyToId = isReceived ? mensagem.remetente_id : mensagem.destinatario_id;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{mensagem.assunto}</h2>
        </div>
        
        <Button
          variant="default"
          size="sm"
          onClick={() => onReply(replyToId, `Re: ${mensagem.assunto}`)}
        >
          <Reply className="h-4 w-4 mr-2" />
          Responder
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-comademig-blue text-white text-lg">
                {contact?.nome_completo.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg">
                  {contact?.nome_completo || 'Usuário'}
                </CardTitle>
                {contact?.cargo && (
                  <Badge variant="secondary">
                    {contact.cargo}
                  </Badge>
                )}
                <Badge variant={isReceived ? "default" : "outline"}>
                  {isReceived ? 'De' : 'Para'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {contact?.igreja && (
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    <span>{contact.igreja}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(mensagem.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="pt-6">
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {mensagem.conteudo}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
