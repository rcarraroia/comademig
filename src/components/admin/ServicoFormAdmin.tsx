import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useServicos } from '@/hooks/useServicos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import type { Servico } from '@/hooks/useServicos';

// Schema de validação
const servicoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  descricao: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  categoria: z.enum(['certidao', 'regularizacao']),
  prazo: z.string().min(3, 'Prazo é obrigatório'),
  valor: z.number().min(0.01, 'Valor deve ser maior que zero'),
  aceita_pix: z.boolean(),
  aceita_cartao: z.boolean(),
  max_parcelas: z.number().min(1).max(12),
  sort_order: z.number().min(0),
});

type ServicoFormData = z.infer<typeof servicoSchema>;

interface ServicoFormAdminProps {
  servico?: Servico | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ServicoFormAdmin({ servico, onSuccess, onCancel }: ServicoFormAdminProps) {
  const { criarServico, atualizarServico, isCriando, isAtualizando } = useServicos();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ServicoFormData>({
    resolver: zodResolver(servicoSchema),
    defaultValues: servico ? {
      nome: servico.nome,
      descricao: servico.descricao,
      categoria: servico.categoria as any,
      prazo: servico.prazo,
      valor: servico.valor,
      aceita_pix: servico.aceita_pix,
      aceita_cartao: servico.aceita_cartao,
      max_parcelas: servico.max_parcelas,
      sort_order: servico.sort_order,
    } : {
      aceita_pix: true,
      aceita_cartao: true,
      max_parcelas: 1,
      sort_order: 0,
    },
  });

  const aceitaPix = watch('aceita_pix');
  const aceitaCartao = watch('aceita_cartao');

  const onSubmit = async (data: ServicoFormData) => {
    if (servico) {
      // Atualizar
      const updateData: any = {
        id: servico.id,
        nome: data.nome,
        descricao: data.descricao,
        categoria: data.categoria,
        prazo: data.prazo,
        valor: data.valor,
        aceita_pix: data.aceita_pix,
        aceita_cartao: data.aceita_cartao,
        max_parcelas: data.max_parcelas,
        sort_order: data.sort_order,
      };
      await atualizarServico(updateData);
    } else {
      // Criar
      await criarServico(data);
    }
    onSuccess();
  };

  const isSubmitting = isCriando || isAtualizando;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="nome">Nome do Serviço *</Label>
        <Input
          id="nome"
          {...register('nome')}
          placeholder="Ex: Certidão de Ministério"
        />
        {errors.nome && (
          <p className="text-sm text-red-500">{errors.nome.message}</p>
        )}
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição *</Label>
        <Textarea
          id="descricao"
          {...register('descricao')}
          placeholder="Descreva o serviço..."
          rows={3}
        />
        {errors.descricao && (
          <p className="text-sm text-red-500">{errors.descricao.message}</p>
        )}
      </div>

      {/* Categoria e Prazo */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoria *</Label>
          <Select
            defaultValue={servico?.categoria}
            onValueChange={(value) => setValue('categoria', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="certidao">📜 Certidão</SelectItem>
              <SelectItem value="regularizacao">⚖️ Regularização</SelectItem>
            </SelectContent>
          </Select>
          {errors.categoria && (
            <p className="text-sm text-red-500">{errors.categoria.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="prazo">Prazo de Entrega *</Label>
          <Input
            id="prazo"
            {...register('prazo')}
            placeholder="Ex: 3-5 dias úteis"
          />
          {errors.prazo && (
            <p className="text-sm text-red-500">{errors.prazo.message}</p>
          )}
        </div>
      </div>

      {/* Valor e Ordem */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="valor">Valor (R$) *</Label>
          <Input
            id="valor"
            type="number"
            step="0.01"
            {...register('valor', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {errors.valor && (
            <p className="text-sm text-red-500">{errors.valor.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sort_order">Ordem de Exibição</Label>
          <Input
            id="sort_order"
            type="number"
            {...register('sort_order', { valueAsNumber: true })}
            placeholder="0"
          />
          {errors.sort_order && (
            <p className="text-sm text-red-500">{errors.sort_order.message}</p>
          )}
        </div>
      </div>

      {/* Formas de Pagamento */}
      <div className="space-y-4">
        <Label>Formas de Pagamento Aceitas</Label>
        
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium">PIX</p>
            <p className="text-sm text-muted-foreground">
              Pagamento instantâneo com 5% de desconto
            </p>
          </div>
          <Switch
            checked={aceitaPix}
            onCheckedChange={(checked) => setValue('aceita_pix', checked)}
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium">Cartão de Crédito</p>
            <p className="text-sm text-muted-foreground">
              Parcelamento disponível
            </p>
          </div>
          <Switch
            checked={aceitaCartao}
            onCheckedChange={(checked) => setValue('aceita_cartao', checked)}
          />
        </div>

        {aceitaCartao && (
          <div className="space-y-2 ml-4">
            <Label htmlFor="max_parcelas">Máximo de Parcelas</Label>
            <Select
              defaultValue={servico?.max_parcelas.toString() || '1'}
              onValueChange={(value) => setValue('max_parcelas', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}x
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            servico ? 'Atualizar' : 'Criar Serviço'
          )}
        </Button>
      </div>
    </form>
  );
}
