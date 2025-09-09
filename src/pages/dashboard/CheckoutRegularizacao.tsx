
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Star, CreditCard, Info } from "lucide-react";
import { useRegularizacaoWithPayment } from "@/hooks/useRegularizacaoWithPayment";
import { PaymentCheckout } from "@/components/payments/PaymentCheckout";
import { PaymentResult } from "@/components/payments/PaymentResult";
import { useToast } from "@/hooks/use-toast";

type ViewState = 'selection' | 'checkout' | 'payment-result';

const CheckoutRegularizacao = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { 
    servicosDisponiveis, 
    calcularValorRegularizacao, 
    calcularDescontoCombo,
    solicitarRegularizacaoComPagamento 
  } = useRegularizacaoWithPayment();

  const [currentView, setCurrentView] = useState<ViewState>('selection');
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>([]);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  // Usar serviços do banco de dados ou fallback para valores hardcoded
  const servicos = servicosDisponiveis.length > 0 ? servicosDisponiveis : [
    {
      id: "estatuto",
      nome: "Estatuto Social",
      descricao: "Elaboração completa do estatuto social personalizado para sua igreja, incluindo registro em cartório",
      valor: 450.00,
      sort_order: 1,
      is_active: true
    },
    {
      id: "ata-fundacao",
      nome: "Ata de Fundação",
      descricao: "Documento oficial de fundação da igreja com todas as formalidades legais necessárias",
      valor: 250.00,
      sort_order: 2,
      is_active: true
    },
    {
      id: "ata-eleicao",
      nome: "Ata de Eleição",
      descricao: "Documentação da eleição da diretoria com validade legal e registro em cartório",
      valor: 200.00,
      sort_order: 3,
      is_active: true
    },
    {
      id: "cnpj",
      nome: "Solicitação de CNPJ",
      descricao: "Processo completo de obtenção do CNPJ incluindo formulários, documentação e acompanhamento",
      valor: 380.00,
      sort_order: 4,
      is_active: true
    },
    {
      id: "consultoria",
      nome: "Consultoria Jurídica",
      descricao: "Consultoria especializada em direito eclesiástico para dúvidas e orientações",
      valor: 150.00,
      sort_order: 5,
      is_active: true
    }
  ];

  // Calcular valores usando as funções do hook
  const servicosSelecionadosData = servicos
    .filter(servico => servicosSelecionados.includes(servico.id))
    .map(servico => ({
      id: servico.id,
      nome: servico.nome,
      valor: servico.valor
    }));

  const valorTotal = calcularValorRegularizacao(servicosSelecionadosData);
  const descontoCombo = calcularDescontoCombo(servicosSelecionadosData);
  const valorFinal = valorTotal - descontoCombo;
  const todosServicos = servicosSelecionados.length === servicos.length;

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

    try {
      // Preparar dados para pagamento
      const regularizacaoData = await solicitarRegularizacaoComPagamento.mutateAsync({
        servicos_selecionados: servicosSelecionadosData,
        observacoes: `Serviços selecionados: ${servicosSelecionadosData.map(s => s.nome).join(', ')}`
      });

      // Preparar dados para checkout
      const servicosNomes = servicosSelecionadosData.map(s => s.nome).join(', ');
      const descricaoCompleta = descontoCombo > 0 
        ? `Regularização Completa (Combo com 15% desconto)`
        : `Regularização - ${servicosNomes}`;

      setCheckoutData({
        serviceType: 'regularizacao',
        serviceData: regularizacaoData.serviceData,
        calculatedValue: valorFinal,
        title: descricaoCompleta,
        description: `${servicosSelecionadosData.length} serviço(s) selecionado(s)`
      });

      setCurrentView('checkout');
      
    } catch (error: any) {
      console.error('Erro ao preparar regularização:', error);
      toast({
        title: "Erro ao processar pedido",
        description: error.message || 'Ocorreu um erro inesperado',
        variant: "destructive"
      });
    }
  };

  const handlePaymentSuccess = (result: any) => {
    setPaymentResult(result);
    setCurrentView('payment-result');
  };

  const handleBackToSelection = () => {
    setCurrentView('selection');
    setCheckoutData(null);
    setPaymentResult(null);
  };

  const handleBackToRegularizacao = () => {
    navigate("/dashboard/regularizacao");
  };

  // Renderizar view de checkout
  if (currentView === 'checkout' && checkoutData) {
    return (
      <PaymentCheckout
        serviceType={checkoutData.serviceType}
        serviceData={checkoutData.serviceData}
        calculatedValue={checkoutData.calculatedValue}
        title={checkoutData.title}
        description={checkoutData.description}
        onSuccess={handlePaymentSuccess}
        onCancel={handleBackToSelection}
      />
    );
  }

  // Renderizar resultado do pagamento
  if (currentView === 'payment-result' && paymentResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToRegularizacao}
            className="text-comademig-blue"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-comademig-blue">Pagamento Realizado</h1>
            <p className="text-gray-600">Sua solicitação será processada após confirmação do pagamento</p>
          </div>
        </div>
        
        <PaymentResult 
          paymentData={paymentResult}
          onClose={handleBackToRegularizacao}
        />
      </div>
    );
  }

  // View principal de seleção de serviços
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBackToRegularizacao}
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
          {todosServicos && descontoCombo > 0 && (
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

          {/* Alerta sobre pagamento obrigatório */}
          {servicosSelecionados.length > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <CreditCard className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Pagamento Obrigatório:</strong> Os serviços selecionados requerem pagamento de R$ {valorFinal.toFixed(2)} antes do processamento.
                <br />
                <small>Você será direcionado para o checkout após confirmar a seleção.</small>
              </AlertDescription>
            </Alert>
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
                          {servico.id === 'cnpj' && (
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

                  {descontoCombo > 0 && (
                    <>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span>R$ {valorTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Desconto Combo (15%)</span>
                          <span>- R$ {descontoCombo.toFixed(2)}</span>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-comademig-blue">
                      R$ {valorFinal.toFixed(2)}
                    </span>
                  </div>

                  <Button
                    onClick={handleFinalizarPedido}
                    disabled={solicitarRegularizacaoComPagamento.isPending}
                    className="w-full bg-comademig-blue hover:bg-comademig-blue/90 text-white"
                  >
                    {solicitarRegularizacaoComPagamento.isPending ? (
                      "Preparando..."
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Prosseguir para Pagamento
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Você será direcionado para o checkout seguro
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
