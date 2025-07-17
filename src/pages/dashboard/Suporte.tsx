
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  MessageSquare, 
  Phone, 
  Mail, 
  Clock,
  CheckCircle,
  Search,
  FileText,
  User,
  CreditCard,
  Calendar,
  Send
} from "lucide-react";

const Suporte = () => {
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "",
    priority: "",
    description: ""
  });

  const faqs = [
    {
      id: "faq1",
      category: "Carteira Digital",
      question: "Como renovar minha carteira ministerial?",
      answer: "A renovação da carteira ministerial é automática desde que suas contribuições estejam em dia. Caso precise de uma nova emissão, acesse a seção 'Carteira Digital' e clique em 'Solicitar Renovação'.",
      icon: CreditCard
    },
    {
      id: "faq2",
      category: "Pagamentos",
      question: "Como consultar meu histórico de pagamentos?",
      answer: "Acesse a seção 'Financeiro' no menu lateral. Lá você encontrará todo o histórico de pagamentos, boletos em aberto e poderá gerar novos boletos.",
      icon: CreditCard
    },
    {
      id: "faq3",
      category: "Eventos",
      question: "Como me inscrever em um evento?",
      answer: "Na seção 'Eventos', você pode visualizar todos os eventos disponíveis. Clique em 'Inscrever-se' no evento desejado e siga as instruções. Alguns eventos podem ter taxa de inscrição.",
      icon: Calendar
    },
    {
      id: "faq4",
      category: "Dados Pessoais",
      question: "Como atualizar meus dados pessoais?",
      answer: "Vá para 'Meus Dados' no menu lateral, clique em 'Editar' e atualize as informações necessárias. Lembre-se de salvar as alterações ao final.",
      icon: User
    },
    {
      id: "faq5",
      category: "Certidões",
      question: "Quanto tempo demora para emitir uma certidão?",
      answer: "O prazo para emissão de certidões é de 3 a 5 dias úteis. Você receberá uma notificação quando o documento estiver pronto para download.",
      icon: FileText
    },
    {
      id: "faq6",
      category: "Acesso",
      question: "Esqueci minha senha, como recuperar?",
      answer: "Na tela de login, clique em 'Esqueci minha senha' e siga as instruções enviadas para seu e-mail cadastrado.",
      icon: User
    }
  ];

  const tickets = [
    {
      id: "T001",
      subject: "Problema na emissão da carteira digital",
      category: "Técnico",
      status: "Em Andamento",
      priority: "Alta",
      date: "2024-01-20",
      response: "Nossa equipe está analisando o problema..."
    },
    {
      id: "T002",
      subject: "Dúvida sobre pagamento de taxa",
      category: "Financeiro",
      status: "Resolvido",
      priority: "Média",
      date: "2024-01-18",
      response: "Questão esclarecida via e-mail"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Resolvido":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" />Resolvido</Badge>;
      case "Em Andamento":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock size={12} className="mr-1" />Em Andamento</Badge>;
      case "Aberto":
        return <Badge className="bg-blue-100 text-blue-800">Aberto</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Alta":
        return <Badge className="bg-red-100 text-red-800">Alta</Badge>;
      case "Média":
        return <Badge className="bg-yellow-100 text-yellow-800">Média</Badge>;
      case "Baixa":
        return <Badge className="bg-green-100 text-green-800">Baixa</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const handleSubmitTicket = () => {
    console.log("Ticket enviado:", ticketForm);
    // Reset form
    setTicketForm({ subject: "", category: "", priority: "", description: "" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-comademig-blue">Suporte</h1>
        <p className="text-gray-600">Encontre respostas rápidas ou entre em contato conosco</p>
      </div>

      {/* Quick Contact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Phone className="h-8 w-8 text-comademig-blue mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Telefone</h3>
            <p className="text-sm text-gray-600 mb-3">(31) 3333-4444</p>
            <p className="text-xs text-gray-500">Seg-Sex: 8h às 18h</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Mail className="h-8 w-8 text-comademig-blue mx-auto mb-3" />
            <h3 className="font-semibold mb-2">E-mail</h3>
            <p className="text-sm text-gray-600 mb-3">suporte@comademig.org.br</p>
            <p className="text-xs text-gray-500">Resposta em até 24h</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-8 w-8 text-comademig-blue mx-auto mb-3" />
            <h3 className="font-semibold mb-2">WhatsApp</h3>
            <p className="text-sm text-gray-600 mb-3">(31) 99999-9999</p>
            <p className="text-xs text-gray-500">Seg-Sex: 8h às 17h</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HelpCircle className="h-5 w-5" />
              <span>Perguntas Frequentes</span>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar nas perguntas..." className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center space-x-2">
                      <faq.icon size={16} className="text-comademig-blue" />
                      <span>{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-2">
                      <Badge variant="outline" className="mb-2">{faq.category}</Badge>
                      <p className="text-gray-700">{faq.answer}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* New Ticket Form */}
        <Card>
          <CardHeader>
            <CardTitle>Abrir Chamado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                placeholder="Descreva brevemente o problema"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={ticketForm.category} onValueChange={(value) => setTicketForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="documentos">Documentos</SelectItem>
                    <SelectItem value="eventos">Eventos</SelectItem>
                    <SelectItem value="geral">Geral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={ticketForm.priority} onValueChange={(value) => setTicketForm(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o problema em detalhes..."
                rows={4}
                value={ticketForm.description}
                onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <Button 
              onClick={handleSubmitTicket}
              className="w-full bg-comademig-blue hover:bg-comademig-blue/90"
              disabled={!ticketForm.subject || !ticketForm.category || !ticketForm.description}
            >
              <Send size={16} className="mr-2" />
              Enviar Chamado
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* My Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Meus Chamados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-comademig-blue">{ticket.subject}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">#{ticket.id}</Badge>
                      <Badge variant="outline">{ticket.category}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(ticket.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{ticket.response}</p>
                <Button size="sm" variant="outline">Ver Detalhes</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800">Dicas para um Atendimento Mais Rápido</h3>
              <div className="text-sm text-blue-700 mt-2 space-y-1">
                <p>• Consulte primeiro as perguntas frequentes</p>
                <p>• Seja específico na descrição do problema</p>
                <p>• Inclua capturas de tela quando relevante</p>
                <p>• Mantenha seus dados de contato atualizados</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Suporte;
