
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Servico {
  id: string;
  nome: string;
  descricao: string;
  valor: number;
  popular?: boolean;
}

const CheckoutRegularizacao = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const servicos: Servico[] = [
    {
      id: "estatuto",
      nome: "Estatuto Social",
      descricao: "Elaboração completa do estatuto social personalizado para sua igreja, incluindo registro em cartório",
      valor: 450.00
    },
    {
      id: "ata-fundacao",
      nome: "Ata de Fundação",
      descricao: "Documento oficial de fundação da igreja com todas as formalidades legais necessárias",
      valor: 250.00
    },
    {
      id: "ata-eleicao",
      nome: "Ata de Eleição",
      descricao: "Documentação da eleição da diretoria com validade legal e registro em cartório",
      valor: 200.00
    },
    {
      id: "cnpj",
      nome: "Solicitação de CNPJ",
      descricao: "Processo completo de obtenção do CNPJ incluindo formulários, documentação e acompanhamento",
      valor: 380.00,
      popular: true
    },
    {
      id: "alvara",
      nome: "Alvará de Funcionamento",
      descricao: "Obtenção do alvará de funcionamento junto aos órgãos competentes",
      valor: 320.00
    },
    {
      id: "inscricao-municipal",
      nome: "Inscrição Municipal",
      descricao: "Registro da igreja junto à prefeitura municipal para regularização fiscal",
      valor: 180.00
    },
    {
      id: "consultoria",
      nome: "Consultoria Jurídica",
      descricao: "Consultoria especializada em direito eclesiástico para dúvidas e orientações",
      valor: 150.00
    }
  ];

  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>([]);
  const [processandoPedido, setProcessandoPedido] = useState(false);

  const valorTotal = servicos
    .filter(servico => servicosSelecionados.includes(servico.id))
    .reduce((total, servico) => total + servico.valor, 0);

  const valorCombo = servicos.reduce((total, servico) => total + servico.valor, 0);
  const descontoCombo = valorCombo * 0.15; // 15% de desconto
  const valorComboComDesconto = valorCombo - descontoCombo;

  const handleServicoChange = (servicoId: string, checked: boolean) => {
    if (checked) {
      setServicosSelecionados([...servicosSelecionados, servicoId]);
    } else {
      setServicosSelecionados(servicosSelecionados.filter(id => id !== servicoId));
    }
  };

  const handleSelecionarTodos = () => {
    if (servicosSelecionados.length === servicos.length) {
      setServicosSelecionados([]);
    } else {
      setServicosSelecionados(servicos.map(s => s.id));
    }
  };

  const handleFinalizarPedido = async () => {
    if (servicosSelecionados.length === 0) {
      toast({
        title: "Selecione pelo menos um serviço",
        description: "Você precisa selecionar pelo menos um serviço para continuar.",
        variant: "destructive"
      });
      return;
    }

    setProcessandoPedido(true);
    
    try {
      // Simular processamento do pedido
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Pedido realizado com sucesso!",
        description: "Entraremos em contato em breve para dar início aos serviços solicitados.",
      });
      
      navigate("/dashboard/regularizacao");
      
    } catch (error) {
      toast({
        title: "Erro ao processar pedido",
        description: "Ocorreu um erro ao processar seu pedido. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setProcessandoPedido(false);
    }
  };

  const todosServicos = servicosSelecionados.length === servicos.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard/regularizacao")}
          className="text-comademig-blue"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-comademig-blue">
            Serviços de Regularização
          </h1>
          <p className="text-gray-600">
            Selecione os serviços que sua igreja precisa
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Serviços */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-comademig-blue">
              Selecione os Serviços
            </h2>
            <Button
              variant="outline"
              onClick={handleSelecionarTodos}
              className="border-comademig-blue text-comademig-blue hover:bg-comademig-blue hover:text-white"
            >
              {todosServicos ? "Desmarcar Todos" : "Selecionar Todos"}
            </Button>
          </div>

          {/* Combo Promocional */}
          {todosServicos && (
            <Card className="border-comademig-gold border-2 bg-gradient-to-r from-comademig-gold/10 to-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Star className="h-6 w-6 text-comademig-gold" />
                    <div>
                      <h3 className="font-semibold text-comademig-blue">Combo Completo - 15% OFF</h3>
                      <p className="text-sm text-gray-600">Todos os serviços inclusos com desconto especial</p>
                    </div>
                  </div>
                  <Badge className="bg-comademig-gold text-comademig-blue">
                    Economize R$ {descontoCombo.toFixed(2)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {servicos.map((servico) => (
              <Card key={servico.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <Checkbox
                      id={servico.id}
                      checked={servicosSelecionados.includes(servico.id)}
                      onCheckedChange={(checked) => handleServicoChange(servico.id, checked as boolean)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-comademig-blue">
                            {servico.nome}
                          </h3>
                          {servico.popular && (
                            <Badge variant="secondary" className="bg-comademig-gold text-comademig-blue text-xs">
                              Mais Popular
                            </Badge>
                          )}
                        </div>
                        <span className="font-bold text-comademig-blue">
                          R$ {servico.valor.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {servico.descricao}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Resumo do Pedido */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-comademig-blue">Resumo do Pedido</CardTitle>
              <CardDescription>
                {servicosSelecionados.length} serviço(s) selecionado(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {servicosSelecionados.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {servicos
                      .filter(servico => servicosSelecionados.includes(servico.id))
                      .map((servico) => (
                        <div key={servico.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">{servico.nome}</span>
                          <span className="font-medium">R$ {servico.valor.toFixed(2)}</span>
                        </div>
                      ))}
                  </div>

                  <Separator />

                  {todosServicos && (
                    <>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span>R$ {valorCombo.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Desconto (15%)</span>
                          <span>- R$ {descontoCombo.toFixed(2)}</span>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-comademig-blue">
                      R$ {todosServicos ? valorComboComDesconto.toFixed(2) : valorTotal.toFixed(2)}
                    </span>
                  </div>

                  <Button
                    onClick={handleFinalizarPedido}
                    disabled={processandoPedido}
                    className="w-full bg-comademig-blue hover:bg-comademig-blue/90 text-white"
                  >
                    {processandoPedido ? (
                      "Processando..."
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Finalizar Pedido
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Após a confirmação, nossa equipe entrará em contato para dar início aos serviços
                  </p>
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum serviço selecionado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutRegularizacao;
