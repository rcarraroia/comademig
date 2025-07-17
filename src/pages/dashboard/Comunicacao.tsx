
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Bell, 
  Mail, 
  MessageSquare, 
  AlertCircle, 
  Info, 
  CheckCircle,
  Archive,
  Star
} from "lucide-react";

const Comunicacao = () => {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

  const notifications = [
    {
      id: "N001",
      type: "urgent",
      title: "Prazo para Taxa Anual se Encerrando",
      message: "Lembrete: O prazo para pagamento da taxa anual 2024 vence em 5 dias. Mantenha sua situação regularizada.",
      date: "2024-01-20",
      time: "14:30",
      read: false,
      category: "Financeiro"
    },
    {
      id: "N002",
      type: "info",
      title: "Novo Evento: Congresso Regional",
      message: "Inscrições abertas para o Congresso Regional de Belo Horizonte. Palestras com grandes nomes do ministério.",
      date: "2024-01-19",
      time: "09:15",
      read: true,
      category: "Eventos"
    },
    {
      id: "N003",
      type: "success",
      title: "Carteira Digital Renovada",
      message: "Sua carteira ministerial foi renovada com sucesso e já está disponível para download.",
      date: "2024-01-18",
      time: "16:45",
      read: true,
      category: "Documentos"
    }
  ];

  const messages = [
    {
      id: "M001",
      from: "Secretaria COMADEMIG",
      subject: "Atualização de Dados Ministeriais",
      preview: "Solicitamos a atualização dos seus dados ministeriais para manter nossos registros...",
      date: "2024-01-20",
      time: "11:20",
      read: false,
      important: true,
      category: "Administrativo"
    },
    {
      id: "M002",
      from: "Campo Regional BH",
      subject: "Convite: Reunião Mensal de Pastores",
      preview: "Você está convidado para a reunião mensal de pastores que acontecerá no próximo...",
      date: "2024-01-19",
      time: "15:30",
      read: true,
      important: false,
      category: "Convites"
    },
    {
      id: "M003",
      from: "Tesouraria COMADEMIG",
      subject: "Comprovante de Pagamento",
      preview: "Confirmamos o recebimento do seu pagamento referente à contribuição de janeiro...",
      date: "2024-01-18",
      time: "08:45",
      read: true,
      important: false,
      category: "Financeiro"
    }
  ];

  const communications = [
    {
      id: "C001",
      type: "circular",
      title: "Circular 001/2024 - Novas Diretrizes Ministeriais",
      content: "A COMADEMIG informa sobre as novas diretrizes para o exercício ministerial...",
      date: "2024-01-15",
      author: "Mesa Diretora"
    },
    {
      id: "C002",
      type: "comunicado",
      title: "Alterações no Estatuto da Convenção",
      content: "Comunicamos as alterações aprovadas em assembleia geral extraordinária...",
      date: "2024-01-10",
      author: "Presidência"
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "urgent":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-600" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "urgent":
        return <Badge className="bg-red-100 text-red-800">Urgente</Badge>;
      case "info":
        return <Badge className="bg-blue-100 text-blue-800">Informativo</Badge>;
      case "success":
        return <Badge className="bg-green-100 text-green-800">Confirmação</Badge>;
      default:
        return <Badge>Geral</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-comademig-blue">Comunicação</h1>
        <p className="text-gray-600">Central de mensagens e comunicados oficiais</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Lidas</CardTitle>
            <Mail className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">3</div>
            <p className="text-xs text-muted-foreground">Requerem atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Mensagens recebidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Importantes</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">1</div>
            <p className="text-xs text-muted-foreground">Marcada como importante</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arquivadas</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Total arquivadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Pesquisar mensagens, comunicados..." className="pl-9" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="messages">Mensagens</TabsTrigger>
          <TabsTrigger value="communications">Comunicados</TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notificações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 border rounded-lg ${!notification.read ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-start space-x-3">
                      {getTypeIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className={`font-semibold ${!notification.read ? 'text-comademig-blue' : 'text-gray-900'}`}>
                              {notification.title}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              {getTypeBadge(notification.type)}
                              <Badge variant="outline">{notification.category}</Badge>
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <div>{new Date(notification.date).toLocaleDateString('pt-BR')}</div>
                            <div>{notification.time}</div>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm">{notification.message}</p>
                        {!notification.read && (
                          <Button size="sm" variant="outline" className="mt-2">
                            Marcar como Lida
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Mensagens Recebidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      !message.read ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedMessage(message.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src="/placeholder-avatar.jpg" />
                        <AvatarFallback className="bg-comademig-blue text-white">
                          {message.from.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <h3 className={`font-semibold ${!message.read ? 'text-comademig-blue' : 'text-gray-900'}`}>
                              {message.from}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              {message.important && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                              <Badge variant="outline">{message.category}</Badge>
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <div>{new Date(message.date).toLocaleDateString('pt-BR')}</div>
                            <div>{message.time}</div>
                          </div>
                        </div>
                        <h4 className={`font-medium ${!message.read ? 'text-comademig-blue' : 'text-gray-800'}`}>
                          {message.subject}
                        </h4>
                        <p className="text-gray-600 text-sm mt-1">{message.preview}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications">
          <Card>
            <CardHeader>
              <CardTitle>Comunicados Oficiais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {communications.map((comm) => (
                  <div key={comm.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-comademig-blue">{comm.title}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className="bg-comademig-gold text-white">{comm.type}</Badge>
                          <span className="text-sm text-gray-600">Por: {comm.author}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(comm.date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{comm.content}</p>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">Ler Completo</Button>
                      <Button size="sm" variant="outline">Baixar PDF</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Comunicacao;
