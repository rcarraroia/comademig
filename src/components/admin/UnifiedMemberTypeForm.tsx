import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  processEdgeFunctionError, 
  processValidationError, 
  getUserFriendlyErrorMessage,
  isRecoverableError,
  type UnifiedMemberTypeError 
} from '@/utils/unifiedMemberTypeErrors';

// Schema de validação baseado nos requirements
const unifiedMemberTypeSchema = z.object({
  // Seção do Cargo
  memberName: z
    .string()
    .min(1, 'Nome do tipo de membro é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  memberDescription: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  sortOrder: z
    .number()
    .min(0, 'Ordem deve ser um número positivo')
    .default(0),
  
  // Seção Financeira
  planTitle: z
    .string()
    .min(1, 'Título do plano é obrigatório')
    .max(255, 'Título deve ter no máximo 255 caracteres')
    .trim(),
  planDescription: z
    .string()
    .max(500, 'Descrição do plano deve ter no máximo 500 caracteres')
    .optional(),
  contributionValue: z
    .number()
    .min(25, 'Valor mínimo é R$ 25,00')
    .max(99999.99, 'Valor máximo é R$ 99.999,99'),
  billingFrequency: z
    .enum(['Mensal', 'Anual'], {
      required_error: 'Frequência de cobrança é obrigatória',
    }),
});

type FormData = z.infer<typeof unifiedMemberTypeSchema>;

interface UnifiedMemberTypeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const UnifiedMemberTypeForm: React.FC<UnifiedMemberTypeFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<UnifiedMemberTypeError | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(unifiedMemberTypeSchema),
    defaultValues: {
      sortOrder: 0,
      contributionValue: 25.00,
      billingFrequency: 'Anual',
    },
    mode: 'onChange',
  });

  const billingFrequency = watch('billingFrequency');

  const validateField = (field: string, value: any) => {
    const error = processValidationError(field, value);
    if (error) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: getUserFriendlyErrorMessage(error)
      }));
      return false;
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      return true;
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    setFieldErrors({});

    try {
      // Validação adicional no cliente
      const validations = [
        validateField('memberName', data.memberName),
        validateField('planTitle', data.planTitle),
        validateField('contributionValue', data.contributionValue),
        validateField('billingFrequency', data.billingFrequency),
      ];

      if (validations.some(v => !v)) {
        throw new Error('Por favor, corrija os erros de validação');
      }

      // Chamar a Edge Function para criar o tipo de membro unificado
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const response = await supabase.functions.invoke('create-unified-member-type', {
        body: {
          memberType: {
            name: data.memberName,
            description: data.memberDescription || '',
            sort_order: data.sortOrder,
            is_active: true,
          },
          subscriptionPlan: {
            plan_title: data.planTitle,
            description: data.planDescription || '',
            price: data.contributionValue,
            recurrence: data.billingFrequency,
          },
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        const processedError = processEdgeFunctionError(response.error);
        throw processedError;
      }

      const result = response.data;

      if (!result.success) {
        const processedError = processEdgeFunctionError(result.error || { message: 'Erro desconhecido' });
        throw processedError;
      }

      setSubmitSuccess(true);
      toast.success('Tipo de membro criado com sucesso!');
      
      // Reset form
      reset();
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Error creating unified member type:', error);
      
      let processedError: UnifiedMemberTypeError;
      
      if (error.code && error.message) {
        // Já é um erro processado
        processedError = error;
      } else {
        // Processar erro não estruturado
        processedError = processEdgeFunctionError(error);
      }
      
      setSubmitError(processedError);
      
      // Mostrar erro específico do campo se disponível
      if (processedError.field) {
        setFieldErrors({
          [processedError.field]: getUserFriendlyErrorMessage(processedError)
        });
      }
      
      const userMessage = getUserFriendlyErrorMessage(processedError);
      toast.error(`Erro ao criar tipo de membro: ${userMessage}`);
      
      // Sugerir ação se o erro for recuperável
      if (isRecoverableError(processedError)) {
        toast.info('Por favor, corrija os dados e tente novamente');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: string) => {
    // Remove caracteres não numéricos
    const numericValue = value.replace(/[^\d]/g, '');
    
    // Converte para número com duas casas decimais
    const numberValue = parseInt(numericValue) / 100;
    
    // Atualiza o valor no formulário
    setValue('contributionValue', numberValue);
    
    // Retorna valor formatado para exibição
    return numberValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Criar Novo Tipo de Membro
        </h1>
        <p className="text-gray-600 mt-2">
          Configure o cargo e seu plano financeiro associado em um único formulário
        </p>
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div>
              <p className="font-medium">{getUserFriendlyErrorMessage(submitError)}</p>
              {submitError.details && (
                <p className="text-sm mt-1 opacity-75">
                  Código: {submitError.code}
                </p>
              )}
              {isRecoverableError(submitError) && (
                <p className="text-sm mt-2">
                  💡 Corrija os dados destacados e tente novamente.
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {submitSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Tipo de membro criado com sucesso!
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Seção: Dados do Cargo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                1
              </span>
              Dados do Cargo
            </CardTitle>
            <CardDescription>
              Informações básicas sobre o tipo de membro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="memberName">
                  Nome do Tipo de Membro *
                </Label>
                <Input
                  id="memberName"
                  {...register('memberName')}
                  placeholder="Ex: Pastor, Diácono, Membro"
                  className={errors.memberName || fieldErrors.memberName ? 'border-red-500' : ''}
                  onBlur={(e) => validateField('memberName', e.target.value)}
                />
                {(errors.memberName || fieldErrors.memberName) && (
                  <p className="text-sm text-red-600">
                    {fieldErrors.memberName || errors.memberName?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">Ordem de Exibição</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min="0"
                  {...register('sortOrder', { valueAsNumber: true })}
                  placeholder="0"
                  className={errors.sortOrder ? 'border-red-500' : ''}
                />
                {errors.sortOrder && (
                  <p className="text-sm text-red-600">{errors.sortOrder.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberDescription">Descrição</Label>
              <Textarea
                id="memberDescription"
                {...register('memberDescription')}
                placeholder="Descrição opcional do tipo de membro"
                rows={3}
                className={errors.memberDescription ? 'border-red-500' : ''}
              />
              {errors.memberDescription && (
                <p className="text-sm text-red-600">{errors.memberDescription.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Seção: Configuração Financeira */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                2
              </span>
              Configuração Financeira
            </CardTitle>
            <CardDescription>
              Defina o plano de contribuição associado a este tipo de membro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="planTitle">
                Título do Plano *
              </Label>
              <Input
                id="planTitle"
                {...register('planTitle')}
                placeholder="Ex: Anuidade Pastor 2025, Contribuição Mensal Diácono"
                className={errors.planTitle || fieldErrors.planTitle ? 'border-red-500' : ''}
                onBlur={(e) => validateField('planTitle', e.target.value)}
              />
              {(errors.planTitle || fieldErrors.planTitle) && (
                <p className="text-sm text-red-600">
                  {fieldErrors.planTitle || errors.planTitle?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="planDescription">Descrição do Plano</Label>
              <Textarea
                id="planDescription"
                {...register('planDescription')}
                placeholder="Descrição opcional do plano financeiro"
                rows={2}
                className={errors.planDescription ? 'border-red-500' : ''}
              />
              {errors.planDescription && (
                <p className="text-sm text-red-600">{errors.planDescription.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contributionValue">
                  Valor da Contribuição * (mín. R$ 25,00)
                </Label>
                <Input
                  id="contributionValue"
                  type="number"
                  step="0.01"
                  min="25"
                  max="99999.99"
                  {...register('contributionValue', { valueAsNumber: true })}
                  placeholder="25.00"
                  className={errors.contributionValue || fieldErrors.contributionValue ? 'border-red-500' : ''}
                  onBlur={(e) => validateField('contributionValue', parseFloat(e.target.value))}
                />
                {(errors.contributionValue || fieldErrors.contributionValue) && (
                  <p className="text-sm text-red-600">
                    {fieldErrors.contributionValue || errors.contributionValue?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingFrequency">
                  Frequência de Cobrança *
                </Label>
                <Select
                  value={billingFrequency}
                  onValueChange={(value) => setValue('billingFrequency', value as 'Mensal' | 'Anual')}
                >
                  <SelectTrigger className={errors.billingFrequency ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mensal">Mensal</SelectItem>
                    <SelectItem value="Anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
                {errors.billingFrequency && (
                  <p className="text-sm text-red-600">{errors.billingFrequency.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4 pt-6">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}
          
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Tipo de Membro'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};