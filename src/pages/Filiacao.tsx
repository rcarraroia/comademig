
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, Info, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import MemberTypeSelector from '@/components/public/MemberTypeSelector';
import PaymentFormEnhanced from '@/components/payments/PaymentFormEnhanced';
import PaymentProcessingStatus from '@/components/payments/PaymentProcessingStatus';
import PaymentErrorHandler, { type PaymentError } from '@/components/payments/PaymentErrorHandler';
import type { UnifiedMemberType } from '@/hooks/useMemberTypeWithPlan';
import { useReferralCode } from '@/hooks/useReferralCode';
import { usePaymentFirstFlowFeature } from '@/hooks/usePaymentFirstFlowFeature';

export default function Filiacao() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedMemberType, setSelectedMemberType] = useState<UnifiedMemberType | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'form' | 'processing' | 'error' | 'success'>('form');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<PaymentError | null>(null);
  
  // Captura automática e silenciosa do código de referral da URL
  const referralHook = useReferralCode();
  const { referralCode, affiliateInfo } = referralHook;

  // Feature flag para Payment First Flow
  const { shouldUsePaymentFirstFlow } = usePaymentFirstFlowFeature();
  const useNewFlow = shouldUsePaymentFirstFlow(user?.email);

  console.log('🔄 Filiacao - Feature Flag Status:', {
    userEmail: user?.email,
    useNewFlow,
    paymentStatus
  });

  const handleMemberTypeSelect = (memberType: UnifiedMemberType | null) => {
    setSelectedMemberType(memberType);
    setShowPaymentForm(false); // Reset payment form when changing type
  };

  const handleProceedToPayment = () => {
    if (!selectedMemberType) {
      toast.error('Por favor, selecione um tipo de membro antes de prosseguir');
      return;
    }

    // Permitir prosseguir sem estar logado (criará conta durante o processo)
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = (result?: { paymentId?: string; userId?: string }) => {
    console.log('✅ Pagamento bem-sucedido:', result);
    
    if (useNewFlow && result?.paymentId) {
      // Novo fluxo: mostrar tela de processamento
      setPaymentId(result.paymentId);
      setPaymentStatus('processing');
    } else {
      // Fluxo antigo: redirecionar diretamente
      toast.success('Filiação realizada com sucesso!');
      navigate('/dashboard');
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('❌ Erro no pagamento:', error);
    
    if (useNewFlow) {
      // Novo fluxo: mostrar tela de erro específica
      setPaymentError(error);
      setPaymentStatus('error');
    } else {
      // Fluxo antigo: toast de erro
      toast.error('Erro ao processar pagamento. Tente novamente.');
    }
  };

  const handleProcessingComplete = (result: { success: boolean; userId?: string }) => {
    console.log('🎯 Processamento concluído:', result);
    
    if (result.success) {
      setPaymentStatus('success');
      toast.success('Filiação concluída com sucesso!');
      
      // Redirecionar após um breve delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } else {
      setPaymentStatus('error');
      toast.error('Erro na finalização da filiação');
    }
  };

  const handleRetryPayment = () => {
    setPaymentStatus('form');
    setPaymentError(null);
    setPaymentId(null);
  };

  const handleChangePaymentMethod = () => {
    setPaymentStatus('form');
    setPaymentError(null);
    setPaymentId(null);
    // Manter formulário aberto para alterar dados
  };

  const handleContactSupport = () => {
    navigate('/suporte');
  };



  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Tela de processamento de pagamento */}
          {paymentStatus === 'processing' && paymentId && (
            <PaymentProcessingStatus
              paymentId={paymentId}
              onComplete={handleProcessingComplete}
              onError={handlePaymentError}
              allowCancel={false} // Não permitir cancelamento após pagamento processado
            />
          )}

          {/* Tela de erro de pagamento */}
          {paymentStatus === 'error' && paymentError && (
            <PaymentErrorHandler
              error={paymentError}
              onRetry={handleRetryPayment}
              onChangePaymentMethod={handleChangePaymentMethod}
              onContactSupport={handleContactSupport}
            />
          )}

          {/* Tela de sucesso */}
          {paymentStatus === 'success' && (
            <Card className="max-w-2xl mx-auto text-center">
              <CardContent className="pt-6">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-800 mb-2">
                  Filiação Concluída!
                </h2>
                <p className="text-green-600 mb-4">
                  Sua conta foi criada e a filiação foi processada com sucesso.
                  Você será redirecionado em instantes.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Formulário principal (apenas se não estiver processando/erro/sucesso) */}
          {paymentStatus === 'form' && (
            <>
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">Sistema de Registro</h1>
                <p className="text-xl text-muted-foreground">
                  Venha fazer parte da Comademig
                </p>
                
                {/* Debug info para desenvolvimento */}
                {import.meta.env.DEV && (
                  <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                    🔧 DEV: Usando {useNewFlow ? 'NOVO' : 'ANTIGO'} fluxo de pagamento
                  </div>
                )}
              </div>

          {/* Benefícios da Filiação */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2 text-center">
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
            </CardContent>
          </Card>

          {/* Seleção de Tipo de Membro */}
          <div className="max-w-4xl mx-auto">
            <MemberTypeSelector
              selectedMemberType={selectedMemberType}
              onMemberTypeSelect={handleMemberTypeSelect}
              className="mb-6"
            />

            {/* Botão para Prosseguir */}
            {selectedMemberType && selectedMemberType.plan_id && (
              <div className="text-center">
                <Button
                  onClick={handleProceedToPayment}
                  size="lg"
                  className="bg-comademig-blue hover:bg-comademig-blue/90"
                >
                  Prosseguir com a Filiação
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
            </>
          )}

          {/* Formulário de Pagamento */}
          {showPaymentForm && selectedMemberType && (
            <>
              {/* Aviso sobre conta existente */}
              {user && (
                <Alert className="mb-6 border-yellow-200 bg-yellow-50">
                  <Info className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>⚠️ ATENÇÃO: Você já está logado como:</strong> {user.email}
                    <br />
                    <br />
                    <strong>A filiação será vinculada a esta conta existente.</strong>
                    <br />
                    <br />
                    Se você deseja criar uma nova conta para esta filiação, 
                    <Button 
                      variant="link" 
                      className="text-yellow-800 underline p-0 h-auto font-semibold"
                      onClick={async () => {
                        await supabase.auth.signOut();
                        toast.info('Você foi desconectado. Agora pode criar uma nova conta.');
                        setShowPaymentForm(false);
                        window.location.reload(); // Recarregar para atualizar estado
                      }}
                    >
                      clique aqui para sair
                    </Button> antes de prosseguir.
                  </AlertDescription>
                </Alert>
              )}
              
              {!user && (
                <Alert className="mb-6 border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>✅ Criação de Nova Conta:</strong>
                    <br />
                    Uma nova conta será criada com o email que você informar no formulário.
                    <br />
                    <br />
                    <strong>Já tem uma conta?</strong> 
                    <Button 
                      variant="link" 
                      className="text-blue-800 underline p-0 h-auto font-semibold"
                      onClick={() => navigate('/auth?redirect=/filiacao')}
                    >
                      Faça login primeiro
                    </Button> para vincular a filiação à sua conta existente.
                  </AlertDescription>
                </Alert>
              )}
              
              <PaymentFormEnhanced 
                selectedMemberType={selectedMemberType}
                affiliateInfo={referralHook}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={() => setShowPaymentForm(false)}
                usePaymentFirstFlow={useNewFlow}
              />
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
