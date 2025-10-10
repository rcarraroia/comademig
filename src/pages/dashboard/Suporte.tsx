import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  MessageSquare, 
  Phone, 
  Mail, 
  Search,
  FileText,
  User,
  CreditCard,
  Calendar,
  Plus,
  Ticket
} from "lucide-react";
import { useMyTickets } from "@/hooks/useSupport";
import { TicketCard } from "@/components/suporte/TicketCard";
import { TicketDetail } from "@/components/suporte/TicketDetail";
import { NovoTicketModal } from "@/components/suporte/NovoTicketModal";

const Suporte = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showNovoTicket, setShowNovoTicket] = useState(false);
  
  const { data: tickets = [], isLoading } = useMyTickets();

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

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedTicket) {
    return (
      <TicketDetail 
        ticket={selectedTicket} 
        onBack={() => setSelectedTicket(null)} 
      />
    );
  }

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
              <Input 
                placeholder="Buscar nas perguntas..." 
                className="pl-9" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {filteredFaqs.map((faq) => (
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

        {/* Tickets Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Meus Tickets
              </CardTitle>
              <Button
                onClick={() => setShowNovoTicket(true)}
                className="bg-comademig-blue hover:bg-comademig-blue/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Ticket
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-comademig-blue mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Carregando tickets...</p>
              </div>
            ) : filteredTickets.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {filteredTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onClick={() => setSelectedTicket(ticket)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-3">
                  {searchTerm ? 'Nenhum ticket encontrado' : 'Nenhum ticket ainda'}
                </p>
                <Button
                  onClick={() => setShowNovoTicket(true)}
                  variant="outline"
                >
                  Criar Primeiro Ticket
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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

      <NovoTicketModal 
        open={showNovoTicket} 
        onOpenChange={setShowNovoTicket} 
      />
    </div>
  );
};

export default Suporte;
