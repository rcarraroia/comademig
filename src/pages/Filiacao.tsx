
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, Users, Info, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import MemberTypeSelector from '@/components/public/MemberTypeSelector';
import type { UnifiedMemberType } from '@/hooks/useMemberTypeWithPlan';

export default function Filiacao() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [affiliateInfo, setAffiliateInfo] = useState<any>(null);
  const [selectedMemberType, setSelectedMemberType] = useState<UnifiedMemberType | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    // Verificar se há código de referral na URL
    const params = new URLSearchParams(location.search);
    const referralCode = params.get('ref');

    if (referralCode) {
      loadAffiliateInfo(referralCode);
    }
  }, [location]);

  const loadAffiliateInfo = async (referralCode: string) => {
    // TODO: Implementar busca de afiliado quando sistema de pagamentos for reconstruído
    console.log('Código de referral:', referralCode);
  };

  const handleMemberTypeSelect = (memberType: UnifiedMemberType | null) => {
    setSelectedMemberType(memberType);
    setShowPaymentForm(false); // Reset payment form when changing type
  };

  const handleProceedToPayment = () => {
    if (!selectedMemberType) {
      toast.error('Por favor, selecione um tipo de membro antes de prosseguir');
      return;
    }

    if (!user) {
      toast.info('Você precisa estar logado para prosseguir com a filiação');
      navigate('/login', { 
        state: { 
          returnTo: '/filiacao',
          memberType: selectedMemberType 
        }
      });
      return;
    }

    setShowPaymentForm(true);
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
                    <strong>Sistema Unificado de Filiação!</strong><br />
                    Escolha seu cargo ministerial e veja automaticamente o plano de contribuição associado.
                    Processo simplificado em uma única etapa.
                    <br /><br />
                    <strong>Desconto PIX:</strong> 5% de desconto em todos os planos pagos via PIX.
                  </AlertDescription>
                </Alert>
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
            {selectedMemberType && (
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

          {/* Formulário de Pagamento */}
          {showPaymentForm && selectedMemberType && (
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Finalizar Filiação</CardTitle>
                  <CardDescription>
                    Complete seus dados e escolha a forma de pagamento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Sistema de pagamentos em desenvolvimento. Em breve você poderá finalizar sua filiação online.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-2">Resumo da Filiação:</h4>
                      <div className="text-left space-y-2">
                        <p><strong>Tipo de Membro:</strong> {selectedMemberType.name}</p>
                        {selectedMemberType.plan_title && (
                          <>
                            <p><strong>Plano:</strong> {selectedMemberType.plan_title}</p>
                            <p><strong>Valor:</strong> R$ {selectedMemberType.plan_value?.toFixed(2)}</p>
                            <p><strong>Frequência:</strong> {selectedMemberType.plan_recurrence}</p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <p className="text-gray-600 mb-4">
                        Para finalizar sua filiação agora, entre em contato conosco:
                      </p>
                      <div className="space-y-2">
                        <p><strong>Telefone:</strong> (31) 3333-4444</p>
                        <p><strong>Email:</strong> contato@comademig.org.br</p>
                        <p><strong>WhatsApp:</strong> (31) 99999-8888</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
