
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import { PaymentForm } from '@/components/payments/PaymentForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Users, Info } from 'lucide-react';
import { useAsaasPayments } from '@/hooks/useAsaasPayments';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Filiacao() {
  const location = useLocation();
  const { user } = useAuth();
  const [affiliateInfo, setAffiliateInfo] = useState<any>(null);
  const { getAffiliateByReferralCode } = useAsaasPayments();
  const { createUserSubscription } = useUserSubscriptions();

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

  const handlePaymentSuccess = async (cobranca: any, selectedMemberType?: string, selectedPlan?: string) => {
    console.log('Pagamento criado com sucesso:', cobranca);
    console.log('Tipo de membro selecionado:', selectedMemberType);
    console.log('Plano selecionado:', selectedPlan);
    
    // Redirecionar para URL de pagamento do Asaas PRIMEIRO
    let paymentUrl = null;
    
    // Verificar diferentes possíveis campos de URL de pagamento
    if (cobranca.url_pagamento) {
      paymentUrl = cobranca.url_pagamento;
    } else if (cobranca.asaas_data?.invoiceUrl) {
      paymentUrl = cobranca.asaas_data.invoiceUrl;
    } else if (cobranca.asaas_data?.bankSlipUrl) {
      paymentUrl = cobranca.asaas_data.bankSlipUrl;
    }
    
    if (paymentUrl) {
      // Abrir URL de pagamento em nova aba
      window.open(paymentUrl, '_blank');
      toast.success('Cobrança criada com sucesso! A página de pagamento foi aberta em uma nova aba.');
    } else {
      // Fallback: mostrar dados de pagamento se não houver URL
      let message = 'Cobrança criada com sucesso!\n\n';
      
      if (cobranca.qr_code_pix) {
        message += 'Código PIX: ' + cobranca.qr_code_pix + '\n\n';
      }
      
      if (cobranca.linha_digitavel) {
        message += 'Linha digitável do boleto: ' + cobranca.linha_digitavel + '\n\n';
      }
      
      message += 'ID da cobrança: ' + (cobranca.asaas_id || cobrança.id);
      
      alert(message);
    }
    
    // Validações adicionais para criação de assinatura
    if (!user) {
      toast.error('Usuário não autenticado. Faça login e tente novamente.');
      return;
    }

    if (!selectedMemberType || !selectedPlan) {
      toast.error('Dados de filiação incompletos. Verifique se selecionou o cargo ministerial e o plano.');
      return;
    }

    if (!cobranca?.id) {
      toast.error('Erro na cobrança gerada. Tente novamente ou entre em contato com o suporte.');
      return;
    }
    
    // Criar assinatura do usuário automaticamente
    try {
      const subscriptionData = {
        user_id: user.id,
        subscription_plan_id: selectedPlan,
        member_type_id: selectedMemberType,
        status: 'pending' as const, // Será ativada quando o pagamento for confirmado
        payment_reference: cobranca.id
      };

      console.log('Criando assinatura com dados:', subscriptionData);

      await createUserSubscription.mutateAsync(subscriptionData);
      
      toast.success('Filiação processada com sucesso! Sua assinatura será ativada após a confirmação do pagamento.');
      
      // Log para auditoria
      console.log('Assinatura criada com sucesso para usuário:', user.id);
      
    } catch (error: any) {
      console.error('Erro detalhado ao criar assinatura:', error);
      
      // Tratamento específico de diferentes tipos de erro
      let errorMessage = 'Pagamento criado, mas houve erro ao processar a assinatura.';
      
      if (error?.message?.includes('duplicate')) {
        errorMessage = 'Você já possui uma assinatura ativa. Entre em contato com o suporte se precisar de ajuda.';
      } else if (error?.message?.includes('foreign key')) {
        errorMessage = 'Dados de plano ou cargo ministerial inválidos. Tente novamente.';
      } else if (error?.message?.includes('permission')) {
        errorMessage = 'Erro de permissão. Verifique se está logado corretamente.';
      }
      
      toast.error(errorMessage + ' Entre em contato com o suporte se o problema persistir.');
      
      // Tentar novamente após um delay
      setTimeout(() => {
        toast.info('Você pode tentar reprocessar a assinatura acessando seu painel de usuário.');
      }, 3000);
    }
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
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Novo Sistema de Filiação!</strong><br />
                    Agora você pode escolher seu cargo ministerial e o plano de assinatura mais adequado.
                    Os valores variam conforme o plano selecionado.
                    <br /><br />
                    <strong>Desconto PIX:</strong> 5% de desconto em todos os planos pagos via PIX.
                  </AlertDescription>
                </Alert>
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
                    value: 0, // Será definido pelo plano selecionado
                    description: "Filiação COMADEMIG",
                    tipoCobranca: "filiacao",
                    affiliateId: affiliateInfo?.id
                  }}
                  onSuccess={handlePaymentSuccess}
                  showTitle={false}
                  showMemberTypeSelection={true}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
