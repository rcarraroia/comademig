import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  MessageSquare, 
  HelpCircle, 
  Phone, 
  Mail,
  Clock,
  CheckCircle2
} from 'lucide-react';
import TicketForm from '@/components/support/TicketForm';
import TicketList from '@/components/support/TicketList';
import TicketChat from '@/components/support/TicketChat';
import { useMyTickets } from '@/hooks/useSupport';
import { useSupportNotifications } from '@/hooks/useSupportMessages';
import type { SupportTicket } from '@/hooks/useSupport';

const Support: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tickets');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: tickets } = useMyTickets();
  
  // Configurar notificações real-time
  useSupportNotifications();

  const handleTicketClick = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setActiveTab('chat');
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    setActiveTab('tickets');
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
    setActiveTab('tickets');
  };

  // Estatísticas rápidas
  const stats = {
    total: tickets?.length || 0,
    open: tickets?.filter(t => t.status === 'open').length || 0,
    inProgress: tickets?.filter(t => t.status === 'in_progress').length || 0,
    resolved: tickets?.filter(t => t.status === 'resolved').length || 0,
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Central de Suporte</h1>
          <p className="text-muted-foreground">
            Tire suas dúvidas e receba ajuda da nossa equipe
          </p>
        </div>
        
        {!showCreateForm && activeTab !== 'chat' && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-comademig-blue hover:bg-comademig-blue/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Ticket
          </Button>
        )}
      </div>

      {/* Estatísticas rápidas */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
              <div className="text-sm text-gray-600">Abertos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
              <div className="text-sm text-gray-600">Em Andamento</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              <div className="text-sm text-gray-600">Resolvidos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conteúdo principal */}
      {showCreateForm ? (
        <TicketForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Meus Tickets
            </TabsTrigger>
            <TabsTrigger value="chat" disabled={!selectedTicket} className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversa
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Ajuda
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-4">
            <TicketList onTicketClick={handleTicketClick} />
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            {selectedTicket ? (
              <TicketChat
                ticketId={selectedTicket.id}
                onBack={handleBackToList}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Selecione um ticket para ver a conversa</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="help" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* FAQ */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Perguntas Frequentes
                  </CardTitle>
                  <CardDescription>
                    Respostas para as dúvidas mais comuns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium">Como faço minha filiação?</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Acesse "Meu Perfil" e preencha todos os dados necessários. 
                        Depois escolha seu cargo e plano de pagamento.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium">Como emitir minha carteira digital?</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Após completar sua filiação e efetuar o pagamento, 
                        acesse "Carteira Digital" para gerar seu documento.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium">Como solicitar certidões?</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Vá em "Certidões" e escolha o tipo de documento que precisa. 
                        Preencha os dados e aguarde a aprovação.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contatos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Outros Canais de Atendimento
                  </CardTitle>
                  <CardDescription>
                    Outras formas de entrar em contato
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">Telefone</div>
                        <div className="text-sm text-gray-600">(31) 3333-4444</div>
                        <div className="text-xs text-gray-500">Seg-Sex: 8h às 18h</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">E-mail</div>
                        <div className="text-sm text-gray-600">suporte@comademig.org.br</div>
                        <div className="text-xs text-gray-500">Resposta em até 24h</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">Horário de Atendimento</div>
                        <div className="text-sm text-gray-600">Segunda a Sexta</div>
                        <div className="text-xs text-gray-500">8:00 às 18:00</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dicas */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Dicas para um Atendimento Mais Rápido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Ao criar um ticket:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Escolha a categoria correta</li>
                        <li>• Seja específico no assunto</li>
                        <li>• Descreva o problema detalhadamente</li>
                        <li>• Inclua capturas de tela se necessário</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Informações úteis:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Quando o problema começou</li>
                        <li>• Passos que você já tentou</li>
                        <li>• Mensagens de erro exatas</li>
                        <li>• Navegador e dispositivo usado</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Support;