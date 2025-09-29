import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Info } from 'lucide-react';
import { 
  useCreateSubscriptionPlan, 
  useUpdateSubscriptionPlan,
  type SubscriptionPlan 
} from '@/hooks/useSubscriptionPlans';
import { useMemberTypes } from '@/hooks/useMemberTypes';

const SubscriptionPlanFormSchema = z.object({
  plan_title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo'),
  description: z.string().optional(),
  price: z.number().min(0, 'Preço deve ser positivo'),
  recurrence: z.enum(['monthly', 'semestral', 'annual'], {
    errorMap: () => ({ message: 'Selecione uma recorrência válida' })
  }),
  is_active: z.boolean().default(true),
});

type SubscriptionPlanFormData = z.infer<typeof SubscriptionPlanFormSchema>;

interface SubscriptionPlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan | null;
  mode: 'create' | 'edit';
}

// Formulário simplificado - sem permissões (campo não existe na tabela)

export default function SubscriptionPlanFormModal({
  isOpen,
  onClose,
  plan,
  mode
}: SubscriptionPlanFormModalProps) {
  const createMutation = useCreateSubscriptionPlan();
  const updateMutation = useUpdateSubscriptionPlan();
  const { data: memberTypes, isLoading: memberTypesLoading } = useMemberTypes();
  
  const [selectedMemberTypes, setSelectedMemberTypes] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<SubscriptionPlanFormData>({
    resolver: zodResolver(SubscriptionPlanFormSchema),
    defaultValues: {
      plan_title: '',
      description: '',
      price: 0,
      recurrence: 'monthly',
      is_active: true,
      sort_order: 0,
    }
  });

  const isActive = watch('is_active');

  // Reset form when modal opens/closes or plan changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && plan) {
        reset({
          plan_title: plan.plan_title,
          description: plan.description || '',
          price: plan.price,
          recurrence: plan.recurrence,
          is_active: plan.is_active,
          sort_order: plan.sort_order || 0,
        });
        
        // Carregar tipos de membro associados
        const associatedTypes = (plan as any).associated_member_types?.map((amt: any) => amt.member_type_id) || [];
        setSelectedMemberTypes(associatedTypes);
      } else {
        reset({
          plan_title: '',
          description: '',
          price: 0,
          recurrence: 'monthly',
          is_active: true,
        });
        setSelectedMemberTypes([]);
      }
    }
  }, [isOpen, mode, plan, reset]);

  const onSubmit = async (data: SubscriptionPlanFormData) => {
    try {
      const submitData = {
        ...data,
        member_type_ids: selectedMemberTypes
      };

      if (mode === 'create') {
        await createMutation.mutateAsync(submitData);
      } else if (mode === 'edit' && plan) {
        await updateMutation.mutateAsync({
          id: plan.id!,
          ...submitData
        });
      }
      onClose();
    } catch (error) {
      // Error handling is done in the hooks
      console.error('Form submission error:', error);
    }
  };

  // Função removida - permissões não existem na tabela

  const handleMemberTypeToggle = (memberTypeId: string) => {
    setSelectedMemberTypes(prev => 
      prev.includes(memberTypeId)
        ? prev.filter(id => id !== memberTypeId)
        : [...prev, memberTypeId]
    );
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Criar Novo Plano de Assinatura' : 'Editar Plano de Assinatura'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Configure um novo plano de assinatura com permissões específicas'
              : 'Atualize as informações do plano de assinatura'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plan_title">Título do Plano *</Label>
                  <Input
                    id="plan_title"
                    {...register('plan_title')}
                    placeholder="Ex: Plano Básico, Plano Premium..."
                    disabled={isPending}
                  />
                  {errors.plan_title && (
                    <p className="text-sm text-destructive">{errors.plan_title.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('price', { valueAsNumber: true })}
                    placeholder="0.00"
                    disabled={isPending}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Descrição opcional do plano..."
                  rows={3}
                  disabled={isPending}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recurrence">Recorrência *</Label>
                  <Select 
                    value={watch('recurrence')} 
                    onValueChange={(value) => setValue('recurrence', value as any)}
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.recurrence && (
                    <p className="text-sm text-destructive">{errors.recurrence.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="sort_order">Ordem de Exibição</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    min="0"
                    {...register('sort_order', { valueAsNumber: true })}
                    placeholder="0"
                    disabled={isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ordem em que aparece nas listas (0 = primeiro)
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue('is_active', checked)}
                  disabled={isPending}
                />
                <Label htmlFor="is_active">
                  Plano ativo (disponível para assinatura)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Seção de Permissões removida - campo não existe na tabela */}

          {/* Tipos de Membro Associados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tipos de Membro</CardTitle>
              <CardDescription>
                Selecione quais tipos de membro podem assinar este plano
              </CardDescription>
            </CardHeader>
            <CardContent>
              {memberTypesLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Carregando tipos...</span>
                </div>
              ) : !memberTypes || memberTypes.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum tipo de membro cadastrado. Este plano ficará disponível para todos os usuários.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {memberTypes.map((memberType) => (
                    <div key={memberType.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={`member-type-${memberType.id}`}
                        checked={selectedMemberTypes.includes(memberType.id!)}
                        onCheckedChange={() => handleMemberTypeToggle(memberType.id!)}
                        disabled={isPending}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label 
                          htmlFor={`member-type-${memberType.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {memberType.name}
                        </Label>
                        {memberType.description && (
                          <p className="text-xs text-muted-foreground">
                            {memberType.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mensagens de erro gerais */}
          {(createMutation.error || updateMutation.error) && (
            <Alert variant="destructive">
              <AlertDescription>
                {createMutation.error?.message || updateMutation.error?.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Botões */}
          <Separator />
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === 'create' ? 'Criar Plano' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}