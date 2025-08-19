
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, Search, Plus, Inbox, Send as SendIcon } from "lucide-react";
import { useMensagens } from "@/hooks/useMensagens";
import { MessageList } from "@/components/communication/MessageList";
import { MessageDetail } from "@/components/communication/MessageDetail";
import { ComposeMessage } from "@/components/communication/ComposeMessage";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { supabase } from "@/integrations/supabase/client";

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

const ComunicacaoDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Mensagem | null>(null);
  const [composeMode, setComposeMode] = useState(false);
  const [replyData, setReplyData] = useState<{ destinatarioId: string; assunto: string } | null>(null);
  
  const { user } = useAuth();
  
  const {
    mensagens,
    mensagensNaoLidas,
    isLoading,
    error,
    enviarMensagem,
    marcarComoLida,
    refetch
  } = useMensagens();

  // Buscar membros para o select de destinatário
  const { data: membros } = useSupabaseQuery(
    ['membros-para-mensagens'],
    async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome_completo, cargo, igreja')
        .neq('id', user?.id)
        .eq('status', 'ativo')
        .order('nome_completo');
      
      if (error) throw error;
      return data;
    },
    { enabled: !!user }
  );

  const filteredMensagens = mensagens?.filter(mensagem => {
    const contact = mensagem.remetente_id === user?.id ? mensagem.destinatario : mensagem.remetente;
    return (
      mensagem.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mensagem.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact?.nome_completo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const mensagensRecebidas = filteredMensagens?.filter(m => m.destinatario_id === user?.id) || [];
  const mensagensEnviadas = filteredMensagens?.filter(m => m.remetente_id === user?.id) || [];

  const handleSelectMessage = (mensagem: Mensagem) => {
    setSelectedMessage(mensagem);
    setComposeMode(false);
  };

  const handleComposeNew = () => {
    setComposeMode(true);
    setSelectedMessage(null);
    setReplyData(null);
  };

  const handleReply = (destinatarioId: string, assuntoOriginal: string) => {
    setComposeMode(true);
    setSelectedMessage(null);
    setReplyData({
      destinatarioId,
      assunto: assuntoOriginal.startsWith('Re: ') ? assuntoOriginal : `Re: ${assuntoOriginal}`
    });
  };

  const handleSendMessage = async (data: { destinatarioId: string; assunto: string; conteudo: string }) => {
    try {
      await enviarMensagem.mutateAsync(data);
      setComposeMode(false);
      setReplyData(null);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleBack = () => {
    setSelectedMessage(null);
    setComposeMode(false);
    setReplyData(null);
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <ErrorMessage
          message="Erro ao carregar mensagens. Tente novamente."
          retry={refetch}
        />
      </div>
    );
  }

  // Modo de composição ou detalhes da mensagem
  if (composeMode) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <ComposeMessage
          onBack={handleBack}
          onSend={handleSendMessage}
          loading={enviarMensagem.isPending}
          destinatarioInicial={replyData?.destinatarioId}
          assuntoInicial={replyData?.assunto}
          membros={membros}
        />
      </div>
    );
  }

  if (selectedMessage) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <MessageDetail
          mensagem={selectedMessage}
          currentUserId={user?.id}
          onBack={handleBack}
          onReply={handleReply}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comunicação</h1>
          <p className="text-gray-600">
            Gerencie suas mensagens e comunicação com outros membros
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {mensagensNaoLidas > 0 && (
            <Badge variant="destructive" className="px-3 py-1">
              {mensagensNaoLidas} não lidas
            </Badge>
          )}
          
          <Button onClick={handleComposeNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Mensagem
          </Button>
        </div>
      </div>

      <Tabs defaultValue="recebidas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recebidas" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Recebidas
            {mensagensNaoLidas > 0 && (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs">
                {mensagensNaoLidas}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="enviadas" className="flex items-center gap-2">
            <SendIcon className="h-4 w-4" />
            Enviadas
          </TabsTrigger>
          <TabsTrigger value="todas" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Todas
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar mensagens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <TabsContent value="recebidas" className="mt-0">
              <MessageList
                mensagens={mensagensRecebidas}
                isLoading={isLoading}
                currentUserId={user?.id}
                onSelectMessage={handleSelectMessage}
                onMarkAsRead={(mensagemId) => marcarComoLida.mutateAsync(mensagemId)}
              />
            </TabsContent>
            
            <TabsContent value="enviadas" className="mt-0">
              <MessageList
                mensagens={mensagensEnviadas}
                isLoading={isLoading}
                currentUserId={user?.id}
                onSelectMessage={handleSelectMessage}
                onMarkAsRead={() => {}}
              />
            </TabsContent>
            
            <TabsContent value="todas" className="mt-0">
              <MessageList
                mensagens={filteredMensagens}
                isLoading={isLoading}
                currentUserId={user?.id}
                onSelectMessage={handleSelectMessage}
                onMarkAsRead={(mensagemId) => marcarComoLida.mutateAsync(mensagemId)}
              />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default ComunicacaoDashboard;
