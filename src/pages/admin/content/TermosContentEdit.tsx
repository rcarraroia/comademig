import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2, Loader2, Save, GripVertical } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTermosContent } from "@/hooks/useLegalPages";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface SectionForm {
  title: string;
  content: string;
  items: { value: string }[];
}

interface TermosForm {
  title: string;
  sections: SectionForm[];
}

const TermosContentEdit = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const { data: pageData, isLoading } = useTermosContent();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { register, control, handleSubmit, reset } = useForm<TermosForm>({
    defaultValues: {
      title: pageData?.content_json.title || "Termos de Uso",
      sections: pageData?.content_json.sections.map(section => ({
        title: section.title,
        content: section.content,
        items: section.items.map(item => ({ value: item }))
      })) || []
    }
  });

  const { fields: sections, append: appendSection, remove: removeSection, move: moveSection } = useFieldArray({
    control,
    name: "sections"
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-comademig-blue" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: TermosForm) => {
    setIsSaving(true);
    try {
      const contentJson = {
        title: data.title,
        sections: data.sections.map(section => ({
          title: section.title,
          content: section.content,
          items: section.items.map(item => item.value).filter(v => v.trim() !== '')
        }))
      };

      const { error } = await supabase
        .from('content_management')
        .update({
          content_json: contentJson,
          last_updated_at: new Date().toISOString()
        })
        .eq('page_name', 'termos');

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['content', 'termos'] });
      toast.success('Termos de Uso atualizados com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const addSection = () => {
    appendSection({
      title: "",
      content: "",
      items: []
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/dashboard/admin/content">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Gerenciamento de Conteúdo
          </Link>
        </Button>
        
        <h1 className="text-3xl font-montserrat font-bold text-comademig-blue mb-2">
          Editor de Termos de Uso
        </h1>
        <p className="text-gray-600 font-inter">
          Edite o conteúdo dos Termos de Uso do site
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título da Página *</Label>
              <Input
                id="title"
                {...register('title', { required: true })}
                placeholder="Termos de Uso"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Seções do Documento</CardTitle>
              <Button type="button" onClick={addSection} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Seção
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {sections.map((section, sectionIndex) => (
              <SectionEditor
                key={section.id}
                sectionIndex={sectionIndex}
                register={register}
                control={control}
                onRemove={() => removeSection(sectionIndex)}
                onMoveUp={sectionIndex > 0 ? () => moveSection(sectionIndex, sectionIndex - 1) : undefined}
                onMoveDown={sectionIndex < sections.length - 1 ? () => moveSection(sectionIndex, sectionIndex + 1) : undefined}
              />
            ))}

            {sections.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma seção adicionada. Clique em "Adicionar Seção" para começar.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-comademig-blue"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

interface SectionEditorProps {
  sectionIndex: number;
  register: any;
  control: any;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const SectionEditor = ({ sectionIndex, register, control, onRemove, onMoveUp, onMoveDown }: SectionEditorProps) => {
  const { fields: items, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: `sections.${sectionIndex}.items` as const
  });

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold">Seção {sectionIndex + 1}</h3>
        </div>
        <div className="flex gap-2">
          {onMoveUp && (
            <Button type="button" variant="ghost" size="sm" onClick={onMoveUp}>
              ↑
            </Button>
          )}
          {onMoveDown && (
            <Button type="button" variant="ghost" size="sm" onClick={onMoveDown}>
              ↓
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>

      <div>
        <Label>Título da Seção *</Label>
        <Input
          {...register(`sections.${sectionIndex}.title`, { required: true })}
          placeholder="Ex: 1. Aceitação dos Termos"
        />
      </div>

      <div>
        <Label>Conteúdo *</Label>
        <Textarea
          {...register(`sections.${sectionIndex}.content`, { required: true })}
          placeholder="Texto principal da seção..."
          rows={4}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Itens da Lista (opcional)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendItem({ value: "" })}
          >
            <Plus className="w-3 h-3 mr-1" />
            Adicionar Item
          </Button>
        </div>

        {items.map((item, itemIndex) => (
          <div key={item.id} className="flex gap-2 mb-2">
            <Input
              {...register(`sections.${sectionIndex}.items.${itemIndex}.value`)}
              placeholder="Item da lista..."
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(itemIndex)}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TermosContentEdit;
