import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Plus, Trash2, Target, Eye, History } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAboutContent, AboutContentData } from "@/hooks/useContent";
import { useUpdateContent } from "@/hooks/useContentMutation";

const AboutContentEdit = () => {
  const { isAdmin, loading } = useAuth();
  const { content, isLoading, error } = useAboutContent();
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

  const { register, handleSubmit, control, reset, formState: { errors, isDirty } } = useForm<AboutContentData>({
    defaultValues: content
  });

  const { fields: paragrafosFields, append: appendParagrafo, remove: removeParagrafo } = useFieldArray({
    control,
    name: "historia.paragrafos"
  });

  // Atualizar formulário quando o conteúdo carregar
  useEffect(() => {
    if (content) {
      reset(content);
    }
  }, [content, reset]);

  const onSubmit = async (data: AboutContentData) => {
    setIsSaving(true);
    try {
      await updateContent.mutateAsync({
        pageName: 'sobre',
        content: data
      });
      
      toast.success('Conteúdo da página Sobre salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar conteúdo:', error);
      toast.error('Erro ao salvar conteúdo. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

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
          <p className="text-gray-600 mb-4">Não foi possível carregar o conteúdo da página Sobre.</p>
          <Button asChild>
            <Link to="/dashboard/content">Voltar</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
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
            <h1 className="text-3xl font-bold text-comademig-blue">Editar Página Sobre</h1>
            <p className="text-gray-600">Gerencie o conteúdo da página institucional</p>
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
                placeholder="Ex: Sobre a COMADEMIG"
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

        {/* Missão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-8 h-8 bg-comademig-gold rounded-full flex items-center justify-center mr-3">
                <Target className="w-4 h-4 text-white" />
              </div>
              Missão
            </CardTitle>
            <CardDescription>
              Defina a missão da COMADEMIG
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="missao.titulo">Título da Seção</Label>
              <Input
                id="missao.titulo"
                {...register("missao.titulo", { required: "Título da missão é obrigatório" })}
                placeholder="Ex: Nossa Missão"
              />
              {errors.missao?.titulo && (
                <p className="text-sm text-red-600 mt-1">{errors.missao.titulo.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="missao.texto">Texto da Missão</Label>
              <Textarea
                id="missao.texto"
                {...register("missao.texto", { required: "Texto da missão é obrigatório" })}
                placeholder="Descreva a missão da COMADEMIG..."
                rows={4}
              />
              {errors.missao?.texto && (
                <p className="text-sm text-red-600 mt-1">{errors.missao.texto.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Visão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-8 h-8 bg-comademig-gold rounded-full flex items-center justify-center mr-3">
                <Eye className="w-4 h-4 text-white" />
              </div>
              Visão
            </CardTitle>
            <CardDescription>
              Defina a visão da COMADEMIG
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="visao.titulo">Título da Seção</Label>
              <Input
                id="visao.titulo"
                {...register("visao.titulo", { required: "Título da visão é obrigatório" })}
                placeholder="Ex: Nossa Visão"
              />
              {errors.visao?.titulo && (
                <p className="text-sm text-red-600 mt-1">{errors.visao.titulo.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="visao.texto">Texto da Visão</Label>
              <Textarea
                id="visao.texto"
                {...register("visao.texto", { required: "Texto da visão é obrigatório" })}
                placeholder="Descreva a visão da COMADEMIG..."
                rows={4}
              />
              {errors.visao?.texto && (
                <p className="text-sm text-red-600 mt-1">{errors.visao.texto.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* História */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-8 h-8 bg-comademig-gold rounded-full flex items-center justify-center mr-3">
                <History className="w-4 h-4 text-white" />
              </div>
              História
            </CardTitle>
            <CardDescription>
              Conte a história da COMADEMIG em parágrafos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="historia.titulo">Título da Seção</Label>
              <Input
                id="historia.titulo"
                {...register("historia.titulo", { required: "Título da história é obrigatório" })}
                placeholder="Ex: Nossa História"
              />
              {errors.historia?.titulo && (
                <p className="text-sm text-red-600 mt-1">{errors.historia.titulo.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Parágrafos da História</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendParagrafo("")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Parágrafo
                </Button>
              </div>

              <div className="space-y-3">
                {paragrafosFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <div className="flex-1">
                      <Textarea
                        {...register(`historia.paragrafos.${index}` as const, {
                          required: "Parágrafo não pode estar vazio"
                        })}
                        placeholder={`Parágrafo ${index + 1}...`}
                        rows={3}
                      />
                      {errors.historia?.paragrafos?.[index] && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.historia.paragrafos[index]?.message}
                        </p>
                      )}
                    </div>
                    {paragrafosFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeParagrafo(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {paragrafosFields.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum parágrafo adicionado ainda.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendParagrafo("")}
                    className="mt-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Parágrafo
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button variant="outline" asChild>
            <Link to="/dashboard/content">Cancelar</Link>
          </Button>
          
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open('/sobre', '_blank')}
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

export default AboutContentEdit;