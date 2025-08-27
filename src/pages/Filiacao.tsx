
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import { PaymentForm } from '@/components/payments/PaymentForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Users, Info } from 'lucide-react';
import { useAsaasPayments } from '@/hooks/useAsaasPayments';

export default function Filiacao() {
  const location = useLocation();
  const [affiliateInfo, setAffiliateInfo] = useState<any>(null);
  const { getAffiliateByReferralCode } = useAsaasPayments();

  useEffect(() => {
    // Verificar se há código de referral na URL
    const params = new URLSearchParams(location.search);
    const referralCode = params.get('ref');
    
    if (referralCode) {
      loadAffiliateInfo(referralCode);
    }
  }, [location]);

  const loadAffiliateInfo = async (referralCode: string) => {
    const affiliate = await getAffiliateByReferralCode(referralCode);
    if (affiliate) {
      setAffiliateInfo({ id: affiliate.id, referralCode });
    }
  };

  const handlePaymentSuccess = (cobranca: any) => {
    console.log('Pagamento criado com sucesso:', cobranca);
    // A própria PaymentForm já mostra o resultado do pagamento
    // Aqui podemos adicionar analytics ou outras ações se necessário
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Filiação COMADEMIG</h1>
            <p className="text-xl text-muted-foreground">
              Faça parte da Convenção dos Ministros das Assembléias de Deus do Estado de Minas Gerais
            </p>
          </div>

          {/* Indicação de Afiliado */}
          {affiliateInfo && (
            <Alert className="border-green-200 bg-green-50">
              <Users className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Você foi indicado por um afiliado!</strong> 
                <br />
                Código de indicação: <Badge variant="secondary">{affiliateInfo.referralCode}</Badge>
                <br />
                <small>O afiliado receberá uma comissão pela sua filiação.</small>
              </AlertDescription>
            </Alert>
          )}

          {/* Benefícios da Filiação */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Benefícios da Filiação COMADEMIG
              </CardTitle>
              <CardDescription className="text-center">
                Vantagens exclusivas para membros da convenção
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-medium">Carteira Digital</h4>
                  <p className="text-sm text-muted-foreground">
                    Identificação oficial reconhecida nacionalmente
                  </p>
                </div>

                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium">Eventos Exclusivos</h4>
                  <p className="text-sm text-muted-foreground">
                    Congressos e capacitações para membros
                  </p>
                </div>

                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-medium">Rede Ministerial</h4>
                  <p className="text-sm text-muted-foreground">
                    Conexão com líderes de todo o estado
                  </p>
                </div>

                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <h4 className="font-medium">Suporte Jurídico</h4>
                  <p className="text-sm text-muted-foreground">
                    Orientações e documentação eclesiástica
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t">
                <div className="flex justify-center items-center gap-8">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-comademig-blue">R$ 250,00</p>
                    <p className="text-sm text-muted-foreground">Taxa única de filiação</p>
                  </div>
                  <div className="text-center">
                    <Alert className="border-green-200 bg-green-50 inline-block">
                      <Info className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>PIX: R$ 237,50</strong><br />
                        <small>5% de desconto</small>
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulário de Pagamento */}
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Dados para Filiação</CardTitle>
                <CardDescription>
                  Preencha seus dados e escolha a forma de pagamento para concluir sua filiação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentForm 
                  defaultData={{
                    value: 250,
                    description: "Taxa de Filiação - COMADEMIG",
                    tipoCobranca: "filiacao",
                    affiliateId: affiliateInfo?.id
                  }}
                  onSuccess={handlePaymentSuccess}
                  showTitle={false}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
