
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
import PaymentFormEnhanced from '@/components/payments/PaymentFormEnhanced';
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
            <h1 className="text-4xl font-bold">🆕 Filiação COMADEMIG - Sistema Unificado</h1>
            <p className="text-xl text-muted-foreground">
              Novo processo simplificado: Escolha seu cargo e veja automaticamente o plano associado
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
            <PaymentFormEnhanced 
              selectedMemberType={selectedMemberType}
              affiliateInfo={affiliateInfo}
              onSuccess={() => {
                toast.success('Filiação realizada com sucesso!');
                navigate('/dashboard');
              }}
              onCancel={() => setShowPaymentForm(false)}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
