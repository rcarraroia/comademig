import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AguardandoConfirmacao() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [checkCount, setCheckCount] = useState(0);

  // Verificar status a cada 10 segundos
  useEffect(() => {
    if (!user || !profile) return;

    // Se já está ativo, redirecionar
    if (profile.status === 'ativo') {
      navigate('/dashboard');
      return;
    }

    const interval = setInterval(async () => {
      setIsChecking(true);
      await refreshProfile();
      setCheckCount(prev => prev + 1);
      setIsChecking(false);
    }, 10000); // 10 segundos

    return () => clearInterval(interval);
  }, [user, profile, refreshProfile, navigate]);

  // Verificar status após refresh
  useEffect(() => {
    if (profile?.status === 'ativo') {
      toast.success('Pagamento confirmado! Redirecionando...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  }, [profile?.status, navigate]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    await refreshProfile();
    setCheckCount(prev => prev + 1);
    setIsChecking(false);
    
    if (profile?.status !== 'ativo') {
      toast.info('Ainda aguardando confirmação do pagamento...');
    }
  };

  const handleContactSupport = () => {
    navigate('/dashboard/suporte');
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-yellow-100 rounded-full w-fit">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-xl">Aguardando Confirmação</CardTitle>
          <CardDescription>
            Seu pagamento está sendo processado
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Olá, <strong>{profile.nome_completo}</strong>
            </p>
            <p className="text-sm text-gray-600">
              Seu cadastro foi realizado com sucesso! Estamos aguardando a confirmação do seu pagamento.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Conta criada</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Pagamento enviado</span>
            </div>
            <div className="flex items-center gap-2">
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <Clock className="h-4 w-4 text-yellow-600" />
              )}
              <span className="text-sm font-medium">
                Aguardando confirmação
              </span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-xs text-gray-500">
              Verificações realizadas: {checkCount}
            </p>
            <p className="text-xs text-gray-500">
              A confirmação pode levar até 5 minutos para cartão de crédito
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleManualCheck}
              disabled={isChecking}
              className="w-full"
              variant="outline"
            >
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Verificar Novamente'
              )}
            </Button>

            <Button 
              onClick={handleContactSupport}
              variant="ghost"
              className="w-full"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Entrar em Contato
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Esta página será atualizada automaticamente quando o pagamento for confirmado.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}