import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useNoticiasMutations, useNoticiaById } from "@/hooks/useNoticias";
import { SimpleImageUpload } from "@/components/ui/SimpleImageUpload";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Schema de validação
const noticiaSchema = z.object({
  titulo: z.string().min(10, "Título deve ter no mínimo 10 caracteres"),
  slug: z.string().min(5, "Slug deve ter no mínimo 5 caracteres"),
  resumo: z.string().min(20, "Resumo deve ter no mínimo 20 caracteres").optional().nullable(),
  conteudo_completo: z.string().min(50, "Conteúdo deve ter no mínimo 50 caracteres").optional().nullable(),
  categoria: z.string().optional().nullable(),
  imagem_url: z.string().url("URL da imagem inválida").optional().nullable(),
  data_publicacao: z.string().optional().nullable(),
});

type NoticiaFormData = z.infer<typeof noticiaSchema>;

const NoticiaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!id;

  // Queries e Mutations
  const { data: noticiaExistente, isLoading: isLoadingNoticia } = useNoticiaById(id || '');
  const { createNoticia, updateNoticia } = useNoticiasMutations();

  // Form
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<NoticiaFormData>({
    resolver: zodResolver(noticiaSchema),
    defaultValues: {
      titulo: '',
      slug: '',
      resumo: '',
      conteudo_completo: '',
      categoria: '',
      imagem_url: '',
      data_publicacao: new Date().toISOString().split('T')[0],
    }
  });

  // Carregar dados se estiver editando
  useEffect(() => {
    if (noticiaExistente && isEditing) {
      setValue('titulo', noticiaExistente.titulo);
      setValue('slug', noticiaExistente.slug);
      setValue('resumo', noticiaExistente.resumo || '');
      setValue('conteudo_completo', noticiaExistente.conteudo_completo || '');
      setValue('categoria', noticiaExistente.categoria || '');
      setValue('imagem_url', noticiaExistente.imagem_url || '');
      setValue('data_publicacao', noticiaExistente.data_publicacao?.split('T')[0] || '');
    }
  }, [noticiaExistente, isEditing, setValue]);

  // Gerar slug automaticamente do título
  const titulo = watch('titulo');
  useEffect(() => {
    if (titulo && !isEditing) {
      const slug = titulo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setValue('slug', slug);
    }
  }, [titulo, isEditing, setValue]);

  const onSubmit = async (data: NoticiaFormData) => {
    setIsSaving(true);
    try {
      const noticiaData: any = {
        ...data,
        autor: profile?.nome_completo || user?.email || 'Usuário',
        autor_id: user?.id,
        ativo: true,
        destaque: false,
        exibir_na_home: false,
        visualizacoes: 0,
      };

      if (isEditing && id) {
        await updateNoticia.mutateAsync({ id, ...noticiaData });
        toast.success('Notícia atualizada com sucesso! Aguarde a moderação.');
      } else {
        await createNoticia.mutateAsync(noticiaData);
        toast.success('Notícia criada com sucesso! Aguarde a moderação.');
      }

      navigate('/dashboard/minhas-noticias');
    } catch (error) {
      console.error('Erro ao salvar notícia:', error);
      toast.error('Erro ao salvar notícia. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingNoticia && isEditing) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-comademig-blue" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/minhas-noticias">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-comademig-blue">
              {isEditing ? 'Editar Notícia' : 'Nova Notícia'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Atualize sua notícia' : 'Crie uma nova notícia para o site'}
            </p>
          </div>
        </div>

        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={isSaving}
          className="bg-comademig-blue hover:bg-comademig-blue/90"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? 'Atualizar' : 'Criar'} Notícia
            </>
          )}
        </Button>
      </div>

      {/* Aviso de Moderação */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Sua notícia será analisada</p>
            <p className="text-sm text-blue-700 mt-1">
              Após {isEditing ? 'atualizar' : 'criar'} sua notícia, ela será enviada para moderação. 
              Você será notificado quando for aprovada ou se houver alguma observação.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Preencha os dados principais da notícia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Título */}
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                {...register("titulo")}
                placeholder="Digite o título da notícia"
              />
              {errors.titulo && (
                <p className="text-sm text-red-600 mt-1">{errors.titulo.message}</p>
              )}
            </div>

            {/* Slug */}
            <div>
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                {...register("slug")}
                placeholder="slug-da-noticia"
                disabled={isEditing}
              />
              <p className="text-xs text-gray-500 mt-1">
                Gerado automaticamente do título. Será usado na URL da notícia.
              </p>
              {errors.slug && (
                <p className="text-sm text-red-600 mt-1">{errors.slug.message}</p>
              )}
            </div>

            {/* Categoria */}
            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={watch('categoria') || ''}
                onValueChange={(value) => setValue('categoria', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eventos">Eventos</SelectItem>
                  <SelectItem value="comunicados">Comunicados</SelectItem>
                  <SelectItem value="noticias">Notícias</SelectItem>
                  <SelectItem value="ministerio">Ministério</SelectItem>
                  <SelectItem value="convencao">Convenção</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data de Publicação */}
            <div>
              <Label htmlFor="data_publicacao">Data de Publicação</Label>
              <Input
                id="data_publicacao"
                type="date"
                {...register("data_publicacao")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo */}
        <Card>
          <CardHeader>
            <CardTitle>Conteúdo</CardTitle>
            <CardDescription>
              Escreva o conteúdo da notícia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resumo */}
            <div>
              <Label htmlFor="resumo">Resumo *</Label>
              <Textarea
                id="resumo"
                {...register("resumo")}
                placeholder="Escreva um resumo breve da notícia (será exibido nos cards)"
                rows={3}
              />
              {errors.resumo && (
                <p className="text-sm text-red-600 mt-1">{errors.resumo.message}</p>
              )}
            </div>

            {/* Conteúdo Completo */}
            <div>
              <Label htmlFor="conteudo_completo">Conteúdo Completo *</Label>
              <Textarea
                id="conteudo_completo"
                {...register("conteudo_completo")}
                placeholder="Escreva o conteúdo completo da notícia"
                rows={12}
              />
              {errors.conteudo_completo && (
                <p className="text-sm text-red-600 mt-1">{errors.conteudo_completo.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Imagem */}
        <Card>
          <CardHeader>
            <CardTitle>Imagem de Capa</CardTitle>
            <CardDescription>
              Adicione uma imagem para ilustrar a notícia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleImageUpload
              onImageChange={(url) => {
                if (url) {
                  setValue('imagem_url', url);
                }
              }}
            />
            {watch('imagem_url') && (
              <div className="mt-4">
                <p className="text-sm text-green-600 mb-2">✅ Imagem carregada com sucesso!</p>
                <img
                  src={watch('imagem_url') || ''}
                  alt="Preview"
                  className="w-full max-w-md h-48 object-cover rounded border"
                />
              </div>
            )}
            {errors.imagem_url && (
              <p className="text-sm text-red-600 mt-1">{errors.imagem_url.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard/minhas-noticias')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-comademig-blue hover:bg-comademig-blue/90"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Atualizar' : 'Criar'} Notícia
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NoticiaForm;
