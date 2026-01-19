import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CreditCard, 
  QrCode, 
  FileText, 
  Loader2, 
  Calendar,
  User,
  DollarSign,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format, addMonths, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RenewalCheckoutProps {
  subscriptionId: string | null;
  planId: string | null;
  memberTypeId: string | null;
  currentStatus: string | null;
}

interface SubscriptionData {
  id: string;
  user_id: string;
  subscription_plan_id: string;
  member_type_id: string;
  status: string;
  value: number;
  cycle: string;
  expires_at: string;
  asaas_subscription_id: string;
  subscription_plan: {
    id: string;
    name: string;
    price: number;
    recurrence: string;
  };
  member_type: {
    id: string;
    name: string;
  };
}

export default function RenewalCheckout({ 
  subscriptionId, 
  planId, 
  memberTypeId, 
  currentStatus 
}: RenewalCheckoutProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD' | 'BOLETO'>('PIX');

  useEffect(() => {
    if (subscriptionId && user?.id) {
      loadSubscriptionData();
    } else {
      toast({
        title: "Erro",
        description: "Dados de renovação inválidos",
        variant: "destructive"
      });
      navigate('/dashboard/financeiro');
    }
  }, [subscriptionId, user?.id]);

  const loadSubscriptionData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plan:subscription_plans(*),
          member_type:member_types(*)
        `)
        .eq('id', subscriptionId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      
      setSubscription(data);
    } catch (error) {
      console.error('Erro ao carregar dados da assinatura:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da assinatura",
        variant: "destructive"
      });
      navigate('/dashboard/financeiro');
    } finally {
      setLoading(false);
    }
  };

  const calculateNewExpirationDate = () => {
    if (!subscription) return null;
    
    const now = new Date();
    
    // Se a assinatura ainda está ativa, calcular a partir da data de expiração atual
    // Se está vencida, calcular a partir de hoje
    const baseDate = subscription.status === 'active' && new Date(subscription.expires_at) > now
      ? new Date(subscription.expires_at)
      : now;

    switch (subscription.cycle) {
      case 'MONTHLY':
        return addMonths(baseDate, 1);
      case 'QUARTERLY':
        return addMonths(baseDate, 3);
      case 'SEMIANNUALLY':
        return addMonths(baseDate, 6);
      case 'YEARLY':
        return addMonths(baseDate, 12);
      default:
        return addMonths(baseDate, 1);
    }
  };

  const getDiscountedValue = (originalValue: number, method: string) => {
    if (method === 'PIX') {
      const discount = originalValue * 0.05; // 5% desconto PIX
      return {
        discountedValue: originalValue - discount,
        discount: discount,
        discountPercentage: 5
      };
    }
    return {
      discountedValue: originalValue,
      discount: 0,
      discountPercentage: 0
    };
  };

  const processRenewal = async () => {
    if (!subscription || !user) return;

    setProcessing(true);
    try {
      const originalValue = subscription.subscription_plan.price;
      const { discountedValue } = getDiscountedValue(originalValue, paymentMethod);
      
      // Criar nova cobrança para renovação
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        paymentMethod === 'PIX' ? 'asaas-create-pix-payment' : 'asaas-process-card',
        {
          body: {
            customer_id: user.id, // Assumindo que user.id é o customer_id do Asaas
            service_type: 'filiacao',
            service_data: {
              type: 'renewal',
              subscription_id: subscription.id,
              member_type_id: subscription.member_type_id,
              plan_id: subscription.subscription_plan_id
            },
            payment_data: {
              value: discountedValue,
              dueDate: new Date().toISOString().split('T')[0], // Hoje
              description: `Renovação ${subscription.member_type.name} - ${subscription.subscription_plan.recurrence}`,
              externalReference: `renewal-${subscription.id}`
            },
            user_id: user.id
          }
        }
      );

      if (paymentError) throw paymentError;

      if (paymentMethod === 'PIX') {
        toast({
          title: "PIX Gerado!",
          description: "Use o QR Code ou código copia-e-cola para renovar sua assinatura",
        });
        
        // Redirecionar para página de pagamento PIX com os dados
        navigate(`/pagamento-pix/${paymentData.payment_id}`);
      } else {
        toast({
          title: "Renovação Processada!",
          description: "Sua assinatura foi renovada com sucesso",
        });
        navigate('/dashboard/financeiro');
      }

    } catch (error: any) {
      console.error('Erro ao processar renovação:', error);
      toast({
        title: "Erro na Renovação",
        description: error.message || "Erro ao processar renovação",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      active: { label: 'Ativa', variant: 'default' as const, icon: CheckCircle },
      pending: { label: 'Pendente', variant: 'secondary' as const, icon: AlertCircle },
      overdue: { label: 'Vencida', variant: 'destructive' as const, icon: AlertCircle },
      expired: { label: 'Expirada', variant: 'destructive' as const, icon: AlertCircle },
      cancelled: { label: 'Cancelada', variant: 'outline' as const, icon: AlertCircle }
    };

    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Carregando dados da renovação...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Assinatura não encontrada</p>
            <Button onClick={() => navigate('/dashboard/financeiro')} className="mt-4">
              Voltar ao Financeiro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const newExpirationDate = calculateNewExpirationDate();
  const originalValue = subscription.subscription_plan.price;
  const { discountedValue, discount, discountPercentage } = getDiscountedValue(originalValue, paymentMethod);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Renovar Assinatura</h1>
          <p className="text-gray-600 mt-2">Renove sua assinatura COMADEMIG</p>
        </div>

        <div className="space-y-6">
          {/* Informações da Assinatura Atual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Assinatura Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Tipo de Membro</Label>
                  <p className="font-medium">{subscription.member_type.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(subscription.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Plano</Label>
                  <p className="font-medium">{subscription.subscription_plan.recurrence}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Expira em</Label>
                  <p className="font-medium">
                    {format(new Date(subscription.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhes da Renovação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Detalhes da Renovação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Novo Período</Label>
                  <p className="font-medium">
                    {newExpirationDate && format(newExpirationDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Duração</Label>
                  <p className="font-medium">{subscription.subscription_plan.recurrence}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Valor do plano:</span>
                  <span>R$ {originalValue.toFixed(2).replace('.', ',')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto PIX ({discountPercentage}%):</span>
                    <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total a pagar:</span>
                  <span className="text-green-600">
                    R$ {discountedValue.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Forma de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Forma de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="PIX" id="pix" />
                    <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer flex-1">
                      <QrCode className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">PIX</p>
                        <p className="text-sm text-green-600">5% de desconto • Aprovação imediata</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="CREDIT_CARD" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Cartão de Crédito</p>
                        <p className="text-sm text-gray-600">Aprovação imediata</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="BOLETO" id="boleto" />
                    <Label htmlFor="boleto" className="flex items-center gap-2 cursor-pointer flex-1">
                      <FileText className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium">Boleto Bancário</p>
                        <p className="text-sm text-gray-600">Aprovação em até 2 dias úteis</p>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/financeiro')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={processRenewal}
              disabled={processing}
              className="flex-1"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                `Renovar por R$ ${discountedValue.toFixed(2).replace('.', ',')}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}