
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Plus, Clock, CheckCircle, AlertCircle, Shield, ArrowLeft } from "lucide-react";
import { useCertidoesWithPayment } from "@/hooks/useCertidoesWithPayment";
import { useAuth } from "@/contexts/AuthContext";
import { FormSolicitacaoCertidao } from "@/components/certidoes/FormSolicitacaoCertidao";
import { TabelaSolicitacoes } from "@/components/certidoes/TabelaSolicitacoes";
import { AdminCertidoes } from "@/components/certidoes/AdminCertidoes";
import { PaymentCheckout } from "@/components/payments/PaymentCheckout";
import { PaymentResult } from "@/components/payments/PaymentResult";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const certidaoTypes = [
  { 
    value: "ministerio", 
    label: "Certidão de Ministério",
    description: "Documento que comprova seu ministério na COMADEMIG"
  },
  { 
    value: "vinculo", 
    label: "Certidão de Vínculo",
    description: "Certifica seu vínculo com uma igreja local"
  },
  { 
    value: "atuacao", 
    label: "Certidão de Atuação",
    description: "Comprova sua atuação ministerial em campo específico"
  },
  { 
    value: "historico", 
    label: "Histórico Ministerial",
    description: "Histórico completo de sua trajetória ministerial"
  },
  { 
    value: "ordenacao", 
    label: "Certidão de Ordenação",
    description: "Certifica sua ordenação ministerial"
  }
];

type ViewState = 'list' | 'form' | 'checkout' | 'payment-result';

const Certidoes = () => {
  const [currentView, setCurrentView] = useState<ViewState>('list');
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  
  const { minhasSolicitacoes, isLoading } = useCertidoesWithPayment();
  const { hasPermission } = useAuth();

  const isAdmin = hasPermission('manage_users');

  // Handlers para navegação entre views
  const handleNewSolicitacao = () => {
    setCurrentView('form');
  };

  const handleProceedToPayment = (certidaoData: any, valor: number) => {
    setCheckoutData({
      serviceType: 'certidao',
      serviceData: certidaoData.serviceData,
      calculatedValue: valor,
      title: `Certidão de ${getCertidaoDisplayName(certidaoData.serviceData.tipo_certidao)}`,
      description: certidaoData.serviceData.justificativa
    });
    setCurrentView('checkout');
  };

  const handlePaymentSuccess = (cobranca: any) => {
    // Redirecionar para página de checkout
    window.location.href = `/checkout/${cobranca.id}`;
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setCheckoutData(null);
    setPaymentResult(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
        onCancel={handleBackToList}
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
            onClick={handleBackToList}
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
          onClose={handleBackToList}
        />
      </div>
    );
  }

  const getSummaryStats = () => {
    const total = minhasSolicitacoes.length;
    const emAnalise = minhasSolicitacoes.filter(s => s.status === 'em_analise' || s.status === 'pendente').length;
    const aprovadas = minhasSolicitacoes.filter(s => s.status === 'aprovada').length;
    const entregues = minhasSolicitacoes.filter(s => s.status === 'entregue').length;

    return { total, emAnalise, aprovadas, entregues };
  };

  const stats = getSummaryStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-comademig-blue">Certidões</h1>
          <p className="text-gray-600">Solicite documentos oficiais da COMADEMIG</p>
        </div>
        <Button 
          onClick={handleNewSolicitacao}
          className="bg-comademig-gold hover:bg-comademig-gold/90"
        >
          <Plus size={16} className="mr-2" />
          Nova Solicitação
        </Button>
      </div>

      {currentView === 'form' && (
        <FormSolicitacaoCertidao 
          onClose={handleBackToList}
          onProceedToPayment={handleProceedToPayment}
        />
      )}

      <Tabs defaultValue="minhas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="minhas">Minhas Solicitações</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="admin" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Administração</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="minhas" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Solicitadas</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Desde o cadastro</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.emAnalise}</div>
                <p className="text-xs text-muted-foreground">Aguardando processamento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.aprovadas}</div>
                <p className="text-xs text-muted-foreground">Prontas para download</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entregues</CardTitle>
                <Download className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.entregues}</div>
                <p className="text-xs text-muted-foreground">Já baixadas</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tipos de Certidões Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certidaoTypes.map((type) => (
                  <div key={type.value} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <FileText className="h-5 w-5 text-comademig-blue mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-comademig-blue">{type.label}</h3>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                        <div className="mt-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Prazo: 3-5 dias úteis
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Solicitações</CardTitle>
            </CardHeader>
            <CardContent>
              {minhasSolicitacoes.length > 0 ? (
                <TabelaSolicitacoes solicitacoes={minhasSolicitacoes} />
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhuma solicitação encontrada.</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Clique em "Nova Solicitação" para solicitar sua primeira certidão.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="admin">
            <AdminCertidoes />
          </TabsContent>
        )}
      </Tabs>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800">Informações Importantes</h3>
              <div className="text-sm text-blue-700 mt-2 space-y-1">
                <p>• As certidões são processadas em até 5 dias úteis</p>
                <p>• Mantenha seus dados sempre atualizados para agilizar o processo</p>
                <p>• Certidões têm validade de 90 dias para fins externos</p>
                <p>• Em caso de urgência, entre em contato com o suporte</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Função auxiliar para nomes de certidão
function getCertidaoDisplayName(tipo: string): string {
  const nomes: Record<string, string> = {
    'ministerio': 'Ministério',
    'vinculo': 'Vínculo',
    'atuacao': 'Atuação',
    'historico': 'Histórico Ministerial',
    'ordenacao': 'Ordenação'
  };
  
  return nomes[tipo] || tipo;
}

export default Certidoes;
