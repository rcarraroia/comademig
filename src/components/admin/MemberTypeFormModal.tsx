import { useEffect } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useCreateMemberType, useUpdateMemberType } from '@/hooks/useMemberTypes';
import type { MemberType } from '@/hooks/useMemberTypes';

const MemberTypeFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  description: z.string().optional(),
  order_of_exhibition: z.number().int().min(0, 'Ordem deve ser positiva').optional(),
  is_active: z.boolean().default(true),
});

type MemberTypeFormData = z.infer<typeof MemberTypeFormSchema>;

interface MemberTypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberType: MemberType | null;
  mode: 'create' | 'edit';
}

export default function MemberTypeFormModal({
  isOpen,
  onClose,
  memberType,
  mode
}: MemberTypeFormModalProps) {
  const createMutation = useCreateMemberType();
  const updateMutation = useUpdateMemberType();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<MemberTypeFormData>({
    resolver: zodResolver(MemberTypeFormSchema),
    defaultValues: {
      name: '',
      description: '',
      order_of_exhibition: 0,
      is_active: true,
    }
  });

  const isActive = watch('is_active');

  // Reset form when modal opens/closes or memberType changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && memberType) {
        reset({
          name: memberType.name,
          description: memberType.description || '',
          order_of_exhibition: memberType.order_of_exhibition || 0,
          is_active: memberType.is_active,
        });
      } else {
        reset({
          name: '',
          description: '',
          order_of_exhibition: 0,
          is_active: true,
        });
      }
    }
  }, [isOpen, mode, memberType, reset]);

  const onSubmit = async (data: MemberTypeFormData) => {
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(data);
      } else if (mode === 'edit' && memberType) {
        await updateMutation.mutateAsync({
          id: memberType.id!,
          ...data
        });
      }
      onClose();
    } catch (error) {
      // Error handling is done in the hooks
      console.error('Form submission error:', error);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Criar Novo Tipo de Membro' : 'Editar Tipo de Membro'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Preencha os dados para criar um novo tipo de membro'
              : 'Atualize as informações do tipo de membro'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Tipo *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Pastor, Diácono, Membro..."
              disabled={isPending}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descrição opcional do tipo de membro..."
              rows={3}
              disabled={isPending}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Ordem de Exibição */}
          <div className="space-y-2">
            <Label htmlFor="order_of_exhibition">Ordem de Exibição</Label>
            <Input
              id="order_of_exhibition"
              type="number"
              min="0"
              {...register('order_of_exhibition', { valueAsNumber: true })}
              placeholder="0"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Ordem em que aparece nas listas (0 = primeiro)
            </p>
            {errors.order_of_exhibition && (
              <p className="text-sm text-destructive">{errors.order_of_exhibition.message}</p>
            )}
          </div>

          {/* Status Ativo */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(checked) => setValue('is_active', checked)}
              disabled={isPending}
            />
            <Label htmlFor="is_active">
              Tipo ativo (visível para usuários)
            </Label>
          </div>

          {/* Mensagens de erro gerais */}
          {(createMutation.error || updateMutation.error) && (
            <Alert variant="destructive">
              <AlertDescription>
                {createMutation.error?.message || updateMutation.error?.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Botões */}
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
              {mode === 'create' ? 'Criar Tipo' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}