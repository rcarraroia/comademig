
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageDetail } from "@/components/communication/MessageDetail";
import { ComposeMessage } from "@/components/communication/ComposeMessage";
import { EnhancedMessageList } from "@/components/communication/EnhancedMessageList";
import { NotificationSystem } from "@/components/communication/NotificationSystem";
import { BulkMessageModal } from "@/components/communication/BulkMessageModal";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useMensagens } from "@/hooks/useMensagens";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, MailOpen, Send, Search, Users, Archive, Trash2 } from "lucide-react";

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

interface Profile {
  id: string;
  nome_completo: string;
  cargo?: string;
  igreja?: string;
}

export default function ComunicacaoDashboard() {
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'detail' | 'compose'>('list');
  const [selectedMessage, setSelectedMessage] = useState<Mensagem | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'received' | 'sent'>('all');
  const [composeData, setComposeData] = useState<{
    destinatarioId?: string;
    assunto?: string;
  }>({});

  const {
    mensagens: mensagensData,
    mensagensNaoLidas,
    isLoading,
    error,
    enviarMensagem,
    marcarComoLida,
    refetch
  } = useMensagens();

  // Fetch all members for compose message
  const { data: membrosData, isLoading: membrosLoading } = useSupabaseQuery(
    ['membros'],
    async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome_completo, cargo, igreja')
        .neq('id', user?.id)
        .order('nome_completo');
      
      if (error) throw error;
      return data;
    },
    { enabled: !!user }
  );

  // Type guard and safe casting for messages
  const mensagens = Array.isArray(mensagensData) ? mensagensData as Mensagem[] : [];
  
  // Filter messages based on search and filter type
  const filteredMessages = mensagens.filter((mensagem) => {
    const matchesSearch = mensagem.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mensagem.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (mensagem.remetente?.nome_completo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (mensagem.destinatario?.nome_completo || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === 'all' || 
                         (filterType === 'received' && mensagem.destinatario_id === user?.id) ||
                         (filterType === 'sent' && mensagem.remetente_id === user?.id);

    return matchesSearch && matchesFilter;
  });

  const handleSelectMessage = (mensagem: Mensagem) => {
    setSelectedMessage(mensagem);
    setView('detail');
  };

  const handleMarkAsRead = (mensagemId: string) => {
    marcarComoLida.mutate(mensagemId);
  };

  const handleCompose = (destinatarioId?: string, assunto?: string) => {
    setComposeData({ destinatarioId, assunto });
    setView('compose');
  };

  const handleSendMessage = (data: { destinatarioId: string; assunto: string; conteudo: string }) => {
    enviarMensagem.mutate(data, {
      onSuccess: () => {
        setView('list');
        setComposeData({});
      }
    });
  };

  const handleBack = () => {
    setView('list');
    setSelectedMessage(null);
    setComposeData({});
  };

  const handleReply = (destinatarioId: string, assuntoOriginal: string) => {
    const assunto = assuntoOriginal.startsWith('Re:') ? assuntoOriginal : `Re: ${assuntoOriginal}`;
    handleCompose(destinatarioId, assunto);
  };

  const handleToggleSelection = (mensagemId: string) => {
    setSelectedMessages(prev => 
      prev.includes(mensagemId)
        ? prev.filter(id => id !== mensagemId)
        : [...prev, mensagemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMessages.length === filteredMessages.length) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(filteredMessages.map(m => m.id));
    }
  };

  // Type guard and safe casting for members
  const membros = Array.isArray(membrosData) ? membrosData as Profile[] : [];

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-12" />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Erro ao carregar mensagens"
        message={error.message}
        retry={refetch}
      />
    );
  }

  // Render compose message view
  if (view === 'compose') {
    return (
      <ComposeMessage
        onBack={handleBack}
        onSend={handleSendMessage}
        loading={enviarMensagem.isPending}
        destinatarioInicial={composeData.destinatarioId}
        assuntoInicial={composeData.assunto}
        membros={membros}
      />
    );
  }

  // Render message detail view
  if (view === 'detail' && selectedMessage) {
    return (
      <MessageDetail
        mensagem={selectedMessage}
        currentUserId={user?.id}
        onBack={handleBack}
        onReply={handleReply}
      />
    );
  }

  // Render main messages list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Comunicação</h1>
          <p className="text-gray-600">Gerencie suas mensagens e comunicações</p>
        </div>
        
        <div className="flex items-center gap-4">
          <NotificationSystem />
          
          {typeof mensagensNaoLidas === 'number' && mensagensNaoLidas > 0 && (
            <Badge variant="destructive">
              {mensagensNaoLidas} não lidas
            </Badge>
          )}
          
          <BulkMessageModal />
          
          <Button onClick={() => handleCompose()}>
            <Send className="h-4 w-4 mr-2" />
            Nova Mensagem
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Mensagens</p>
                <p className="text-2xl font-bold">{mensagens.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <MailOpen className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Não Lidas</p>
                <p className="text-2xl font-bold">{mensagensNaoLidas || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Contatos</p>
                <p className="text-2xl font-bold">{membros.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Archive className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Selecionadas</p>
                <p className="text-2xl font-bold">{selectedMessages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar mensagens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Tabs value={filterType} onValueChange={(value) => setFilterType(value as typeof filterType)}>
                <TabsList>
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="received">Recebidas</TabsTrigger>
                  <TabsTrigger value="sent">Enviadas</TabsTrigger>
                </TabsList>
              </Tabs>

              {selectedMessages.length > 0 && (
                <div className="flex items-center gap-2 border-l pl-2">
                  <Button variant="outline" size="sm">
                    <Archive className="h-4 w-4 mr-1" />
                    Arquivar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filterType === 'all' && 'Todas as Mensagens'}
            {filterType === 'received' && 'Mensagens Recebidas'}
            {filterType === 'sent' && 'Mensagens Enviadas'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedMessageList
            mensagens={filteredMessages}
            isLoading={isLoading}
            currentUserId={user?.id}
            selectedMessages={selectedMessages}
            onSelectMessage={handleSelectMessage}
            onMarkAsRead={handleMarkAsRead}
            onToggleSelection={handleToggleSelection}
            onSelectAll={handleSelectAll}
            onReply={handleReply}
          />
        </CardContent>
      </Card>
    </div>
  );
}
