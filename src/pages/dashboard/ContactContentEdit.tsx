import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Plus, Trash2, MapPin, Phone, Mail, Clock, MoveUp, MoveDown, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useContactContent, ContactContentData, ContactPhone, ContactEmail } from "@/hooks/useContent";
import { useUpdateContent } from "@/hooks/useContentMutation";

const ContactContentEdit = () => {
  const { content, isLoading, error } = useContactContent();
  const updateContent = useUpdateContent();
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors, isDirty } } = useForm<ContactContentData>({
    defaultValues: content
  });

  const { fields: telefonesFields, append: appendTelefone, remove: removeTelefone, move: moveTelefone } = useFieldArray({
    control,
    name: "telefones"
  });

  const { fields: emailsFields, append: appendEmail, remove: removeEmail, move: moveEmail } = useFieldArray({
    control,
    name: "emails"
  });

  // Atualizar formulário quando o conteúdo carregar
  useEffect(() => {
    if (content) {
      reset(content);
    }
  }, [content, reset]);

  const onSubmit = async (data: ContactContentData) => {
    setIsSaving(true);
    try {
      // Garantir que todos os telefones e emails tenham IDs únicos e ordem correta
      const telefonesComOrdem = data.telefones.map((telefone, index) => ({
        ...telefone,
        id: telefone.id || `phone-${Date.now()}-${index}`,
        ordem: index + 1
      }));

      const emailsComOrdem = data.emails.map((email, index) => ({
        ...email,
        id: email.id || `email-${Date.now()}-${index}`,
        ordem: index + 1
      }));

      await updateContent.mutateAsync({
        pageName: 'contato',
        content: {
          ...data,
          telefones: telefonesComOrdem,
          emails: emailsComOrdem
        }
      });
      
      toast.success('Conteúdo da página Contato salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar conteúdo:', error);
      toast.error('Erro ao salvar conteúdo. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const adicionarTelefone = () => {
    const novoTelefone: ContactPhone = {
      id: `phone-${Date.now()}`,
      tipo: '',
      numero: '',
      ordem: telefonesFields.length + 1
    };
    appendTelefone(novoTelefone);
  };

  const adicionarEmail = () => {
    const novoEmail: ContactEmail = {
      id: `email-${Date.now()}`,
      tipo: '',
      email: '',
      ordem: emailsFields.length + 1
    };
    appendEmail(novoEmail);
  };

  const moverTelefone = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      moveTelefone(index, index - 1);
    } else if (direction === 'down' && index < telefonesFields.length - 1) {
      moveTelefone(index, index + 1);
    }
  };

  const moverEmail = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      moveEmail(index, index - 1);
    } else if (direction === 'down' && index < emailsFields.length - 1) {
      moveEmail(index, index + 1);
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
          <p className="text-gray-600 mb-4">Não foi possível carregar o conteúdo da página Contato.</p>
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
            <h1 className="text-3xl font-bold text-comademig-blue">Editar Página Contato</h1>
            <p className="text-gray-600">Gerencie informações de contato e localização</p>
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
                placeholder="Ex: Entre em Contato"
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

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-8 h-8 bg-comademig-gold rounded-full flex items-center justify-center mr-3">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              Endereço
            </CardTitle>
            <CardDescription>
              Informações de localização da sede
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="endereco.rua">Rua/Avenida *</Label>
              <Input
                id="endereco.rua"
                {...register("endereco.rua", { required: "Rua é obrigatória" })}
                placeholder="Ex: Rua das Assembleias, 123"
              />
              {errors.endereco?.rua && (
                <p className="text-sm text-red-600 mt-1">{errors.endereco.rua.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="endereco.complemento">Complemento</Label>
              <Input
                id="endereco.complemento"
                {...register("endereco.complemento")}
                placeholder="Ex: Sala 101, 2º andar"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="endereco.cidade">Cidade *</Label>
                <Input
                  id="endereco.cidade"
                  {...register("endereco.cidade", { required: "Cidade é obrigatória" })}
                  placeholder="Ex: Belo Horizonte"
                />
                {errors.endereco?.cidade && (
                  <p className="text-sm text-red-600 mt-1">{errors.endereco.cidade.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="endereco.estado">Estado *</Label>
                <Input
                  id="endereco.estado"
                  {...register("endereco.estado", { required: "Estado é obrigatório" })}
                  placeholder="Ex: MG"
                />
                {errors.endereco?.estado && (
                  <p className="text-sm text-red-600 mt-1">{errors.endereco.estado.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="endereco.cep">CEP *</Label>
                <Input
                  id="endereco.cep"
                  {...register("endereco.cep", { required: "CEP é obrigatório" })}
                  placeholder="Ex: 30000-000"
                />
                {errors.endereco?.cep && (
                  <p className="text-sm text-red-600 mt-1">{errors.endereco.cep.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Telefones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-comademig-gold rounded-full flex items-center justify-center mr-3">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                Telefones ({telefonesFields.length})
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarTelefone}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Telefone
              </Button>
            </CardTitle>
            <CardDescription>
              Gerencie os telefones de contato
            </CardDescription>
          </CardHeader>
          <CardContent>
            {telefonesFields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum telefone cadastrado ainda.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={adicionarTelefone}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Telefone
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {telefonesFields.map((field, index) => (
                  <div key={field.id} className="flex gap-4 items-end p-4 border rounded-lg">
                    <div className="flex-1">
                      <Label htmlFor={`telefones.${index}.tipo`}>Tipo *</Label>
                      <Input
                        id={`telefones.${index}.tipo`}
                        {...register(`telefones.${index}.tipo` as const, {
                          required: "Tipo é obrigatório"
                        })}
                        placeholder="Ex: Principal, WhatsApp, Secretaria"
                      />
                      {errors.telefones?.[index]?.tipo && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.telefones[index]?.tipo?.message}
                        </p>
                      )}
                    </div>

                    <div className="flex-1">
                      <Label htmlFor={`telefones.${index}.numero`}>Número *</Label>
                      <Input
                        id={`telefones.${index}.numero`}
                        {...register(`telefones.${index}.numero` as const, {
                          required: "Número é obrigatório"
                        })}
                        placeholder="Ex: (31) 3333-4444"
                      />
                      {errors.telefones?.[index]?.numero && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.telefones[index]?.numero?.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => moverTelefone(index, 'up')}
                        disabled={index === 0}
                      >
                        <MoveUp className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => moverTelefone(index, 'down')}
                        disabled={index === telefonesFields.length - 1}
                      >
                        <MoveDown className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTelefone(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* E-mails */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-comademig-gold rounded-full flex items-center justify-center mr-3">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                E-mails ({emailsFields.length})
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarEmail}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar E-mail
              </Button>
            </CardTitle>
            <CardDescription>
              Gerencie os e-mails de contato
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailsFields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum e-mail cadastrado ainda.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={adicionarEmail}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro E-mail
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {emailsFields.map((field, index) => (
                  <div key={field.id} className="flex gap-4 items-end p-4 border rounded-lg">
                    <div className="flex-1">
                      <Label htmlFor={`emails.${index}.tipo`}>Tipo *</Label>
                      <Input
                        id={`emails.${index}.tipo`}
                        {...register(`emails.${index}.tipo` as const, {
                          required: "Tipo é obrigatório"
                        })}
                        placeholder="Ex: Geral, Secretaria, Financeiro"
                      />
                      {errors.emails?.[index]?.tipo && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.emails[index]?.tipo?.message}
                        </p>
                      )}
                    </div>

                    <div className="flex-1">
                      <Label htmlFor={`emails.${index}.email`}>E-mail *</Label>
                      <Input
                        id={`emails.${index}.email`}
                        type="email"
                        {...register(`emails.${index}.email` as const, {
                          required: "E-mail é obrigatório"
                        })}
                        placeholder="Ex: contato@comademig.org.br"
                      />
                      {errors.emails?.[index]?.email && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.emails[index]?.email?.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => moverEmail(index, 'up')}
                        disabled={index === 0}
                      >
                        <MoveUp className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => moverEmail(index, 'down')}
                        disabled={index === emailsFields.length - 1}
                      >
                        <MoveDown className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeEmail(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Horário de Funcionamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-8 h-8 bg-comademig-gold rounded-full flex items-center justify-center mr-3">
                <Clock className="w-4 h-4 text-white" />
              </div>
              Horário de Funcionamento
            </CardTitle>
            <CardDescription>
              Defina os horários de atendimento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="horario_funcionamento.dias">Dias *</Label>
                <Input
                  id="horario_funcionamento.dias"
                  {...register("horario_funcionamento.dias", { required: "Dias são obrigatórios" })}
                  placeholder="Ex: Segunda a Sexta"
                />
                {errors.horario_funcionamento?.dias && (
                  <p className="text-sm text-red-600 mt-1">{errors.horario_funcionamento.dias.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="horario_funcionamento.horario">Horário *</Label>
                <Input
                  id="horario_funcionamento.horario"
                  {...register("horario_funcionamento.horario", { required: "Horário é obrigatório" })}
                  placeholder="Ex: 8h às 17h"
                />
                {errors.horario_funcionamento?.horario && (
                  <p className="text-sm text-red-600 mt-1">{errors.horario_funcionamento.horario.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="horario_funcionamento.observacoes">Observações</Label>
              <Textarea
                id="horario_funcionamento.observacoes"
                {...register("horario_funcionamento.observacoes")}
                placeholder="Ex: Sábados: 8h às 12h"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Redes Sociais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-8 h-8 bg-comademig-gold rounded-full flex items-center justify-center mr-3">
                <Globe className="w-4 h-4 text-white" />
              </div>
              Redes Sociais
            </CardTitle>
            <CardDescription>
              Links para as redes sociais (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="redes_sociais.facebook">Facebook</Label>
                <Input
                  id="redes_sociais.facebook"
                  {...register("redes_sociais.facebook")}
                  placeholder="https://facebook.com/comademig"
                />
              </div>

              <div>
                <Label htmlFor="redes_sociais.instagram">Instagram</Label>
                <Input
                  id="redes_sociais.instagram"
                  {...register("redes_sociais.instagram")}
                  placeholder="https://instagram.com/comademig"
                />
              </div>

              <div>
                <Label htmlFor="redes_sociais.youtube">YouTube</Label>
                <Input
                  id="redes_sociais.youtube"
                  {...register("redes_sociais.youtube")}
                  placeholder="https://youtube.com/comademig"
                />
              </div>

              <div>
                <Label htmlFor="redes_sociais.whatsapp">WhatsApp</Label>
                <Input
                  id="redes_sociais.whatsapp"
                  {...register("redes_sociais.whatsapp")}
                  placeholder="https://wa.me/5531999998888"
                />
              </div>
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
              onClick={() => window.open('/contato', '_blank')}
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

export default ContactContentEdit;