import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import type { ServicoExigencia } from '@/hooks/useServicoExigencias';

// ============================================================================
// TYPES
// ============================================================================

interface ServicoFormProps {
  exigencias: ServicoExigencia[];
  onSubmit: (dados: Record<string, any>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ServicoForm({ exigencias, onSubmit, onCancel, isSubmitting = false }: ServicoFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [arquivos, setArquivos] = useState<Record<string, File>>({});

  // Criar schema de validação dinâmico
  const createValidationSchema = () => {
    const schemaFields: Record<string, any> = {};

    exigencias.forEach((exig) => {
      if (exig.obrigatorio) {
        switch (exig.tipo) {
          case 'campo_numero':
            schemaFields[exig.id] = z.number({ required_error: `${exig.nome} é obrigatório` });
            break;
          case 'campo_data':
            schemaFields[exig.id] = z.string({ required_error: `${exig.nome} é obrigatório` });
            break;
          case 'documento':
            schemaFields[exig.id] = z.any().refine((val) => val !== undefined, {
              message: `${exig.nome} é obrigatório`,
            });
            break;
          default:
            schemaFields[exig.id] = z.string({ required_error: `${exig.nome} é obrigatório` }).min(1);
        }
      } else {
        schemaFields[exig.id] = z.any().optional();
      }
    });

    return z.object(schemaFields);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(createValidationSchema()),
  });

  const handleFileChange = (exigenciaId: string, file: File | null) => {
    if (file) {
      setArquivos((prev) => ({ ...prev, [exigenciaId]: file }));
      setValue(exigenciaId, file);
    } else {
      const newArquivos = { ...arquivos };
      delete newArquivos[exigenciaId];
      setArquivos(newArquivos);
      setValue(exigenciaId, undefined);
    }
  };

  const handleFormSubmit = (data: Record<string, any>) => {
    // Combinar dados do formulário com arquivos
    const dadosCompletos = {
      ...data,
      arquivos: arquivos,
    };

    onSubmit(dadosCompletos);
  };

  const renderField = (exigencia: ServicoExigencia) => {
    const fieldId = exigencia.id;

    switch (exigencia.tipo) {
      case 'campo_texto':
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {exigencia.nome}
              {exigencia.obrigatorio && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {exigencia.descricao && (
              <p className="text-sm text-muted-foreground">{exigencia.descricao}</p>
            )}
            <Input
              id={fieldId}
              {...register(fieldId)}
              placeholder={`Digite ${exigencia.nome.toLowerCase()}`}
            />
            {errors[fieldId] && (
              <p className="text-sm text-red-500">{errors[fieldId]?.message as string}</p>
            )}
          </div>
        );

      case 'campo_numero':
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {exigencia.nome}
              {exigencia.obrigatorio && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {exigencia.descricao && (
              <p className="text-sm text-muted-foreground">{exigencia.descricao}</p>
            )}
            <Input
              id={fieldId}
              type="number"
              {...register(fieldId, { valueAsNumber: true })}
              placeholder={`Digite ${exigencia.nome.toLowerCase()}`}
            />
            {errors[fieldId] && (
              <p className="text-sm text-red-500">{errors[fieldId]?.message as string}</p>
            )}
          </div>
        );

      case 'campo_data':
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {exigencia.nome}
              {exigencia.obrigatorio && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {exigencia.descricao && (
              <p className="text-sm text-muted-foreground">{exigencia.descricao}</p>
            )}
            <Input id={fieldId} type="date" {...register(fieldId)} />
            {errors[fieldId] && (
              <p className="text-sm text-red-500">{errors[fieldId]?.message as string}</p>
            )}
          </div>
        );

      case 'selecao':
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {exigencia.nome}
              {exigencia.obrigatorio && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {exigencia.descricao && (
              <p className="text-sm text-muted-foreground">{exigencia.descricao}</p>
            )}
            <Select onValueChange={(value) => setValue(fieldId, value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                {exigencia.opcoes?.map((opcao) => (
                  <SelectItem key={opcao} value={opcao}>
                    {opcao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors[fieldId] && (
              <p className="text-sm text-red-500">{errors[fieldId]?.message as string}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={fieldId} className="flex items-center space-x-2">
            <Checkbox
              id={fieldId}
              onCheckedChange={(checked) => setValue(fieldId, checked)}
            />
            <Label htmlFor={fieldId} className="cursor-pointer">
              {exigencia.nome}
              {exigencia.obrigatorio && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {exigencia.descricao && (
              <p className="text-sm text-muted-foreground ml-6">{exigencia.descricao}</p>
            )}
          </div>
        );

      case 'documento':
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {exigencia.nome}
              {exigencia.obrigatorio && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {exigencia.descricao && (
              <p className="text-sm text-muted-foreground">{exigencia.descricao}</p>
            )}
            <div className="border-2 border-dashed rounded-lg p-4">
              {arquivos[fieldId] ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">{arquivos[fieldId].name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFileChange(fieldId, null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label htmlFor={`file-${fieldId}`} className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <span className="text-sm">Clique para fazer upload</span>
                    <span className="text-xs">PDF, JPG, PNG (máx. 5MB)</span>
                  </div>
                  <input
                    id={`file-${fieldId}`}
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('Arquivo muito grande. Máximo 5MB.');
                          return;
                        }
                        handleFileChange(fieldId, file);
                      }
                    }}
                  />
                </label>
              )}
            </div>
            {errors[fieldId] && (
              <p className="text-sm text-red-500">{errors[fieldId]?.message as string}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preencha os dados necessários</CardTitle>
        <CardDescription>
          Campos marcados com * são obrigatórios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {exigencias.map((exigencia) => renderField(exigencia))}

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Enviando...' : 'Continuar para Pagamento'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
