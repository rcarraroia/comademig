import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  CreditCard, 
  QrCode, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  LogOut,
  Mail,
  Phone
} from 'lucide-react';
import { useProfileStatus } from '@/hooks/useProfileStatus';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

export default function PagamentoPendente() {
  const { profile, loading, revalidateProfile, isPending } = useProfileStatus();
  const { signOut, user } = useAuth();
  const [revalidating, setRevalidating] = useState(false);

  // Se não está pendente, redirecionar para dashboard
  if (!loading && !isPending) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleRevalidate = async () => {
    setRevalidating(true);
    try {
      await revalidateProfile();
      
      // Aguardar um pouco para o estado atualizar
      setTimeout(() => {
        if (!isPending) {
          toast.success('Pagamento confirmado! Redirecionando...');
        } else {
          toast.info('Pagamento ainda não foi confirmado. Tente novamente em alguns minutos.');
        }
      }, 1000);
    } catch (error) {
      toast.error('Erro ao verificar pagamento. Tente novamente.');
    } finally {
      setRevalidating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.info('Você foi desconectado.');
    } catch (error) {
      toast.error('Erro ao sair. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-comademig-blue to-comademig-gold">
        <div className="text-white text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-comademig-blue to-comademig-gold p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <Card className="shadow-2xl">
          <CardHeader className="text-center bg-orange-500 text-white rounded-t-lg">
            <div className="flex items-center justify-center mb-4">
              <Clock className="h-12 w-12" />
            </div>
            <CardTitle className="text-2xl font-bold font-montserrat">
              Pagamento Pendente
            </CardTitle>
            <p className="text-lg opacity-90 font-inter">
              Sua filiação está aguardando confirmação do pagamento
            </p>
          </CardHeader>
          
          <CardContent className="p-8 space-y-6">
            {/* Status do Usuário */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Olá, {profile?.nome_completo || 'Usuário'}!</strong><br />
                Sua conta foi criada com sucesso, mas o pagamento ainda não foi confirmado.
              </AlertDescription>
            </Alert>

            <Separator />

            {/* Informações sobre o Pagamento */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-comademig-blue font-montserrat">
                O que acontece agora?
              </h3>
              
              <div className="grid gap-4">
                <div className="flex items-start space-x-3">
                  <QrCode className="h-5 w-5 text-comademig-blue mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">PIX</p>
                    <p className="text-sm text-gray-600">
                      Se você pagou via PIX, a confirmação pode levar até alguns minutos.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CreditCard className="h-5 w-5 text-comademig-blue mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Cartão de Crédito</p>
                    <p className="text-sm text-gray-600">
                      Pagamentos com cartão são confirmados instantaneamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Instruções */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-comademig-blue font-montserrat">
                Próximos Passos
              </h3>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Verifique seu email para instruções de pagamento</li>
                  <li>Complete o pagamento conforme as instruções</li>
                  <li>Aguarde alguns minutos para a confirmação</li>
                  <li>Clique em "Já paguei" para verificar o status</li>
                </ol>
              </div>
            </div>

            <Separator />

            {/* Ações */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-comademig-blue font-montserrat">
                Já efetuou o pagamento?
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleRevalidate}
                  disabled={revalidating}
                  className="bg-comademig-blue hover:bg-comademig-blue/90 text-white font-montserrat flex-1"
                >
                  {revalidating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Já paguei - Verificar Status
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  className="flex-1"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>

            <Separator />

            {/* Suporte */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Precisa de ajuda?
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Se você já efetuou o pagamento e ele ainda não foi confirmado após alguns minutos, entre em contato conosco:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-comademig-blue" />
                  <a href="mailto:contato@comademig.org.br" className="text-comademig-blue hover:underline">
                    contato@comademig.org.br
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-comademig-blue" />
                  <a href="tel:+5531999999999" className="text-comademig-blue hover:underline">
                    (31) 99999-9999
                  </a>
                </div>
              </div>
            </div>

            {/* Informação do Email */}
            <Alert className="border-blue-200 bg-blue-50">
              <Mail className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Verifique seu email:</strong> {user?.email}
                <br />
                Enviamos as instruções de pagamento e você receberá uma confirmação assim que o pagamento for processado.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
