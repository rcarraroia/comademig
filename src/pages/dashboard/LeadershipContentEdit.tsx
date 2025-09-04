import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Plus, Trash2, Users, MoveUp, MoveDown, User } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLeadershipContent, LeadershipContentData, LeaderData } from "@/hooks/useContent";
import { useUpdateContent } from "@/hooks/useContentMutation";
import { SimpleImageUpload } from "@/components/ui/SimpleImageUpload";

const LeadershipContentEdit = () => {
  const { isAdmin, loading } = useAuth();
  const { content, isLoading, error } = useLeadershipContent();
  const updateContent = useUpdateContent();
  const [isSaving, setIsSaving] = useState(false);

  // Verificar se o usuário é admin
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors, isDirty } } = useForm<LeadershipContentData>({
    defaultValues: content
  });

  const { fields: lideresFields, append: appendLider, remove: removeLider, move: moveLider } = useFieldArray({
    control,
    name: "lideres"
  });

  // Atualizar formulário quando o conteúdo carregar (apenas uma vez)
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    if (content && !hasInitialized) {
      reset(content);
      setHasInitialized(true);
    }
  }, [content, reset, hasInitialized]);

  const onSubmit = async (data: LeadershipContentData) => {
    setIsSaving(true);
    try {
      // Garantir que todos os líderes tenham IDs únicos e ordem correta
      const lideresComOrdem = data.lideres.map((lider, index) => ({
        ...lider,
        id: lider.id || `leader-${Date.now()}-${index}`,
        ordem: index + 1
      }));

      await updateContent.mutateAsync({
        pageName: 'lideranca',
        content: {
          ...data,
          lideres: lideresComOrdem
        }
      });
      
      toast.success('Conteúdo da página Liderança salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar conteúdo:', error);
      toast.error('Erro ao salvar conteúdo. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const adicionarLider = () => {
    const novoLider: LeaderData = {
      id: `leader-${Date.now()}`,
      nome: '',
      cargo: '',
      bio: '',
      ordem: lideresFields.length + 1,
      categoria: 'diretoria'
    };
    appendLider(novoLider);
  };

  const moverLider = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      moveLider(index, index - 1);
    } else if (direction === 'down' && index < lideresFields.length - 1) {
      moveLider(index, index + 1);
    }
  };

  const categorias = [
    { value: 'presidencia', label: 'Presidência' },
    { value: 'diretoria', label: 'Diretoria Executiva' },
    { value: 'conselho', label: 'Conselho Administrativo' },
    { value: 'campos', label: 'Campos Regionais' }
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar conteúdo</h1>
          <p className="text-gray-600 mb-4">Não foi possível carregar o conteúdo da página Liderança.</p>
          <Button asChild>
            <Link to="/dashboard/content">Voltar</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/content">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-comademig-blue">Editar Página Liderança</h1>
            <p className="text-gray-600">Gerencie os líderes e estrutura organizacional</p>
          </div>
        </div>
        
        <Button 
          onClick={handleSubmit(onSubmit)}
          disabled={isSaving || !isDirty}
          className="bg-comademig-blue hover:bg-comademig-blue/90"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Informações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-8 h-8 bg-comademig-gold rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              Informações Gerais
            </CardTitle>
            <CardDescription>
              Título e descrição principal da página
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="titulo">Título Principal</Label>
              <Input
                id="titulo"
                {...register("titulo", { required: "Título é obrigatório" })}
                placeholder="Ex: Nossa Liderança"
              />
              {errors.titulo && (
                <p className="text-sm text-red-600 mt-1">{errors.titulo.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                {...register("descricao", { required: "Descrição é obrigatória" })}
                placeholder="Breve descrição que aparece no hero da página"
                rows={3}
              />
              {errors.descricao && (
                <p className="text-sm text-red-600 mt-1">{errors.descricao.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Líderes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-comademig-gold rounded-full flex items-center justify-center mr-3">
                  <Users className="w-4 h-4 text-white" />
                </div>
                Líderes ({lideresFields.length})
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarLider}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Líder
              </Button>
            </CardTitle>
            <CardDescription>
              Gerencie a lista de líderes da COMADEMIG
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lideresFields.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Nenhum líder cadastrado ainda</p>
                <p className="text-sm mb-4">Adicione líderes para começar a organizar a estrutura</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={adicionarLider}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Líder
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {lideresFields.map((field, index) => (
                  <Card key={field.id} className="border-2 border-gray-200">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-comademig-blue rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-comademig-blue">
                              Líder #{index + 1}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {watch(`lideres.${index}.nome`) || 'Nome não definido'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {/* Botões de ordenação */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => moverLider(index, 'up')}
                            disabled={index === 0}
                          >
                            <MoveUp className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => moverLider(index, 'down')}
                            disabled={index === lideresFields.length - 1}
                          >
                            <MoveDown className="w-4 h-4" />
                          </Button>
                          
                          {/* Botão de remover */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeLider(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`lideres.${index}.nome`}>Nome Completo *</Label>
                          <Input
                            id={`lideres.${index}.nome`}
                            {...register(`lideres.${index}.nome` as const, {
                              required: "Nome é obrigatório"
                            })}
                            placeholder="Ex: Pastor João Silva Santos"
                          />
                          {errors.lideres?.[index]?.nome && (
                            <p className="text-sm text-red-600 mt-1">
                              {errors.lideres[index]?.nome?.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor={`lideres.${index}.cargo`}>Cargo *</Label>
                          <Input
                            id={`lideres.${index}.cargo`}
                            {...register(`lideres.${index}.cargo` as const, {
                              required: "Cargo é obrigatório"
                            })}
                            placeholder="Ex: Presidente da COMADEMIG"
                          />
                          {errors.lideres?.[index]?.cargo && (
                            <p className="text-sm text-red-600 mt-1">
                              {errors.lideres[index]?.cargo?.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`lideres.${index}.categoria`}>Categoria *</Label>
                        <Select
                          value={watch(`lideres.${index}.categoria`)}
                          onValueChange={(value) => setValue(`lideres.${index}.categoria` as const, value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categorias.map((categoria) => (
                              <SelectItem key={categoria.value} value={categoria.value}>
                                {categoria.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor={`lideres.${index}.bio`}>Biografia *</Label>
                        <Textarea
                          id={`lideres.${index}.bio`}
                          {...register(`lideres.${index}.bio` as const, {
                            required: "Biografia é obrigatória"
                          })}
                          placeholder="Descreva a trajetória e experiência do líder..."
                          rows={3}
                        />
                        {errors.lideres?.[index]?.bio && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.lideres[index]?.bio?.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`lideres.${index}.email`}>Email</Label>
                          <Input
                            id={`lideres.${index}.email`}
                            type="email"
                            {...register(`lideres.${index}.email` as const)}
                            placeholder="email@comademig.org.br"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`lideres.${index}.telefone`}>Telefone</Label>
                          <Input
                            id={`lideres.${index}.telefone`}
                            {...register(`lideres.${index}.telefone` as const)}
                            placeholder="(31) 3333-4444"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Foto do Líder</Label>
                        <div className="space-y-2">
                          <SimpleImageUpload
                            onImageChange={(url) => {
                              console.log('✅ Upload funcionou:', url);
                              if (url) {
                                setValue(`lideres.${index}.imagem` as const, url, { shouldDirty: true });
                                console.log('🖼️ Imagem salva, isDirty deve ser true agora');
                              }
                            }}
                          />
                          {watch(`lideres.${index}.imagem`) && (
                            <div className="mt-2">
                              <p className="text-sm text-green-600">✅ Imagem carregada com sucesso!</p>
                              <img 
                                src={watch(`lideres.${index}.imagem`)} 
                                alt="Preview" 
                                className="w-20 h-20 object-cover rounded border mt-1"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* DEBUG: Informações do formulário */}
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">🔍 DEBUG - Estado do Formulário</h3>
          <div className="text-sm space-y-1">
            <p><strong>isDirty:</strong> {isDirty ? '✅ Sim' : '❌ Não'}</p>
            <p><strong>isSaving:</strong> {isSaving ? '⏳ Salvando' : '✅ Pronto'}</p>
            <p><strong>Erros:</strong> {Object.keys(errors).length > 0 ? `❌ ${Object.keys(errors).length} erros` : '✅ Sem erros'}</p>
            <p><strong>Total Líderes:</strong> {lideresFields.length}</p>
            {Object.keys(errors).length > 0 && (
              <div className="mt-2">
                <strong>Detalhes dos erros:</strong>
                <pre className="text-xs bg-red-50 p-2 rounded mt-1">
                  {JSON.stringify(errors, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button variant="outline" asChild>
            <Link to="/dashboard/content">Cancelar</Link>
          </Button>
          
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                console.log('🔍 DEBUG - Dados atuais do formulário:', watch());
                console.log('🔍 DEBUG - Líderes:', lideresFields);
                window.open('/lideranca', '_blank');
              }}
            >
              Visualizar Página
            </Button>
            <Button 
              type="submit"
              disabled={isSaving || !isDirty}
              className="bg-comademig-blue hover:bg-comademig-blue/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LeadershipContentEdit;