
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
    // Redirecionar para página de sucesso ou mostrar confirmação
    console.log('Pagamento criado com sucesso:', cobranca);
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

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Informações da Filiação */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Benefícios da Filiação
                </CardTitle>
                <CardDescription>
                  Vantagens exclusivas para membros da COMADEMIG
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Carteira Digital</h4>
                      <p className="text-sm text-muted-foreground">
                        Identificação oficial reconhecida em todo território nacional
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Eventos e Congressos</h4>
                      <p className="text-sm text-muted-foreground">
                        Acesso a eventos, congressos e capacitações exclusivas
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Rede de Contatos</h4>
                      <p className="text-sm text-muted-foreground">
                        Conexão com ministros e líderes de todo o estado
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Suporte Jurídico</h4>
                      <p className="text-sm text-muted-foreground">
                        Orientações jurídicas e documentação eclesiástica
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">R$ 250,00</p>
                    <p className="text-sm text-muted-foreground">Taxa única de filiação</p>
                  </div>
                </div>

                {/* Informação sobre PIX com desconto */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Desconto de 5% no PIX!</strong>
                    <br />
                    Pagando via PIX você paga apenas <strong>R$ 237,50</strong>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Formulário de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle>Dados para Filiação</CardTitle>
                <CardDescription>
                  Preencha seus dados e escolha a forma de pagamento
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
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
