import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Schema de validação para cartão
const cardSchema = z.object({
  card_number: z.string()
    .min(13, 'Número do cartão deve ter pelo menos 13 dígitos')
    .max(19, 'Número do cartão deve ter no máximo 19 dígitos')
    .regex(/^\d+$/, 'Apenas números são permitidos'),
  card_holder: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  expiry_month: z.string()
    .regex(/^(0[1-9]|1[0-2])$/, 'Mês inválido (01-12)'),
  expiry_year: z.string()
    .regex(/^\d{4}$/, 'Ano deve ter 4 dígitos')
    .refine((year) => {
      const currentYear = new Date().getFullYear();
      const inputYear = parseInt(year);
      return inputYear >= currentYear && inputYear <= currentYear + 20;
    }, 'Ano inválido'),
  cvv: z.string()
    .regex(/^\d{3,4}$/, 'CVV deve ter 3 ou 4 dígitos')
});

type CardFormData = z.infer<typeof cardSchema>;

interface CheckoutCardProps {
  paymentData: {
    payment_id: string;
    amount: number;
    checkout_url?: string;
    subscription_id?: string;
  };
  onPaymentSuccess?: (paymentId: string, token?: string) => void;
  onPaymentError?: (error: string) => void;
  saveCard?: boolean;
}

export default function CheckoutCard({ 
  paymentData, 
  onPaymentSuccess, 
  onPaymentError,
  saveCard = false
}: CheckoutCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [cardToken, setCardToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema)
  });

  // Detectar bandeira do cartão
  const detectCardBrand = (number: string) => {
    const cleanNumber = number.replace(/\D/g, '');
    
    if (cleanNumber.startsWith('4')) return 'visa';
    if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) return 'mastercard';
    if (cleanNumber.startsWith('3')) return 'amex';
    if (cleanNumber.startsWith('6')) return 'discover';
    
    return 'unknown';
  };

  // Formatar número do cartão
  const formatCardNumber = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    const formatted = cleanValue.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted;
  };

  // Validar data de expiração em tempo real
  const validateExpiry = (month: string, year: string) => {
    if (!month || !year) return true;
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const inputYear = parseInt(year);
    const inputMonth = parseInt(month);
    
    if (inputYear < currentYear) return false;
    if (inputYear === currentYear && inputMonth < currentMonth) return false;
    
    return true;
  };

  // Tokenizar cartão
  const tokenizeCard = async (cardData: CardFormData) => {
    try {
      const response = await fetch('/api/cards/tokenize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          card_number: cardData.card_number.replace(/\s/g, ''),
          card_holder: cardData.card_holder.toUpperCase(),
          expiry_month: cardData.expiry_month,
          expiry_year: cardData.expiry_year,
          cvv: cardData.cvv
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro na tokenização');
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Erro na tokenização:', error);
      throw error;
    }
  };

  // Processar pagamento
  const processPayment = async (token: string) => {
    // Se há checkout_url, redirecionar para o Asaas
    if (paymentData.checkout_url) {
      const checkoutUrl = new URL(paymentData.checkout_url);
      checkoutUrl.searchParams.set('creditCardToken', token);
      window.open(checkoutUrl.toString(), '_blank');
      return;
    }

    // Caso contrário, processar internamente (implementar conforme necessário)
    throw new Error('Processamento de cartão não implementado para este tipo de pagamento');
  };

  // Salvar token do cartão (para assinaturas)
  const saveCardToken = async (token: string) => {
    if (!saveCard || !paymentData.subscription_id) return;

    try {
      const response = await fetch('/api/cards/save-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          subscription_id: paymentData.subscription_id,
          card_token: token
        })
      });

      if (response.ok) {
        toast.success('Cartão salvo para renovações automáticas');
      }
    } catch (error) {
      console.error('Erro ao salvar cartão:', error);
      // Não bloquear o fluxo se falhar ao salvar
    }
  };

  // Submit do formulário
  const onSubmit = async (data: CardFormData) => {
    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // 1. Tokenizar cartão
      const token = await tokenizeCard(data);
      setCardToken(token);

      // 2. Processar pagamento
      await processPayment(token);

      // 3. Salvar token se necessário
      if (saveCard) {
        await saveCardToken(token);
      }

      setPaymentStatus('success');
      onPaymentSuccess?.(paymentData.payment_id, token);
      toast.success('Pagamento processado com sucesso!');

    } catch (error) {
      setPaymentStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Erro no processamento';
      onPaymentError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardNumber = watch('card_number') || '';
  const expiryMonth = watch('expiry_month') || '';
  const expiryYear = watch('expiry_year') || '';
  const cardBrand = detectCardBrand(cardNumber);
  const isExpiryValid = validateExpiry(expiryMonth, expiryYear);

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Pagamento com Cartão
            <Badge variant="secondary" className="ml-auto">
              <Lock className="w-3 h-3 mr-1" />
              Seguro
            </Badge>
          </CardTitle>
          <div className="text-2xl font-bold text-blue-600">
            R$ {paymentData.amount.toFixed(2).replace('.', ',')}
          </div>
        </CardHeader>

        <CardContent>
          {paymentStatus === 'success' ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Pagamento Processado!
              </h3>
              <p className="text-green-600">
                Seu cartão foi processado com sucesso.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Número do Cartão */}
              <div className="space-y-2">
                <Label htmlFor="card_number">Número do Cartão</Label>
                <div className="relative">
                  <Input
                    id="card_number"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    {...register('card_number')}
                    onChange={(e) => {
                      const formatted = formatCardNumber(e.target.value);
                      setValue('card_number', formatted);
                    }}
                    className={errors.card_number ? 'border-red-500' : ''}
                  />
                  {cardBrand !== 'unknown' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Badge variant="outline" className="text-xs">
                        {cardBrand.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                </div>
                {errors.card_number && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.card_number.message}
                  </p>
                )}
              </div>

              {/* Nome no Cartão */}
              <div className="space-y-2">
                <Label htmlFor="card_holder">Nome no Cartão</Label>
                <Input
                  id="card_holder"
                  placeholder="JOÃO SILVA"
                  {...register('card_holder')}
                  onChange={(e) => {
                    setValue('card_holder', e.target.value.toUpperCase());
                  }}
                  className={errors.card_holder ? 'border-red-500' : ''}
                />
                {errors.card_holder && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.card_holder.message}
                  </p>
                )}
              </div>

              {/* Data de Expiração e CVV */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry_month">Mês</Label>
                  <Input
                    id="expiry_month"
                    placeholder="12"
                    maxLength={2}
                    {...register('expiry_month')}
                    className={errors.expiry_month || !isExpiryValid ? 'border-red-500' : ''}
                  />
                  {errors.expiry_month && (
                    <p className="text-xs text-red-500">
                      {errors.expiry_month.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry_year">Ano</Label>
                  <Input
                    id="expiry_year"
                    placeholder="2028"
                    maxLength={4}
                    {...register('expiry_year')}
                    className={errors.expiry_year || !isExpiryValid ? 'border-red-500' : ''}
                  />
                  {errors.expiry_year && (
                    <p className="text-xs text-red-500">
                      {errors.expiry_year.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    maxLength={4}
                    type="password"
                    {...register('cvv')}
                    className={errors.cvv ? 'border-red-500' : ''}
                  />
                  {errors.cvv && (
                    <p className="text-xs text-red-500">
                      {errors.cvv.message}
                    </p>
                  )}
                </div>
              </div>

              {!isExpiryValid && expiryMonth && expiryYear && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Cartão expirado
                </p>
              )}

              {/* Checkbox para salvar cartão */}
              {saveCard && paymentData.subscription_id && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="save_card"
                    defaultChecked
                    className="rounded"
                  />
                  <Label htmlFor="save_card" className="text-sm">
                    Salvar cartão para renovações automáticas
                  </Label>
                </div>
              )}

              {/* Informações de Segurança */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Lock className="w-4 h-4" />
                  <span>Seus dados são protegidos com criptografia SSL</span>
                </div>
              </div>

              {/* Botão de Pagamento */}
              <Button
                type="submit"
                className="w-full"
                disabled={isProcessing || paymentStatus === 'processing'}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pagar R$ {paymentData.amount.toFixed(2).replace('.', ',')}
                  </>
                )}
              </Button>

              {paymentStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Erro no processamento. Tente novamente.
                  </p>
                </div>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}