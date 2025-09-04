import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ContentData {
  title: string;
  description: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
}

const ContentEdit = () => {
  const { pageName } = useParams();
  const { user } = useAuth();
  const { isAdmin, loading } = useUserRoles(user);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [contentData, setContentData] = useState<ContentData>({
    title: '',
    description: '',
    content: '',
    meta_title: '',
    meta_description: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (pageName && isAdmin()) {
      loadContent();
    }
  }, [pageName, isAdmin]);

  const loadContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content_management')
        .select('content_json')
        .eq('page_name', pageName)
        .single();

      if (error) {
        console.error('Erro ao carregar conteúdo:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o conteúdo da página",
          variant: "destructive"
        });
        return;
      }

      if (data?.content_json) {
        setContentData({
          title: data.content_json.title || '',
          description: data.content_json.description || '',
          content: data.content_json.content || '',
          meta_title: data.content_json.meta_title || '',
          meta_description: data.content_json.meta_description || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar conteúdo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!pageName) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('content_management')
        .upsert({
          page_name: pageName,
          content_json: contentData
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Conteúdo salvo com sucesso!",
      });
      
      navigate('/dashboard/admin/content');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o conteúdo",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-comademig-blue"></div>
      </div>
    );
  }

  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  const pageNames: Record<string, string> = {
    'home': 'Início',
    'sobre': 'Sobre',
    'lideranca': 'Liderança',
    'noticias': 'Notícias',
    'eventos': 'Eventos',
    'multimidia': 'Multimídia',
    'contato': 'Contato'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/dashboard/admin/content">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-comademig-blue">
            Editar Página: {pageNames[pageName || ''] || pageName}
          </h1>
          <p className="text-gray-600 mt-2">
            Edite o conteúdo da página {pageNames[pageName || ''] || pageName}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conteúdo da Página</CardTitle>
          <CardDescription>
            Edite as informações principais da página
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Título da Página</Label>
            <Input
              id="title"
              value={contentData.title}
              onChange={(e) => setContentData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Digite o título da página"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={contentData.description}
              onChange={(e) => setContentData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Digite uma breve descrição"
            />
          </div>

          <div>
            <Label htmlFor="content">Conteúdo Principal</Label>
            <Textarea
              id="content"
              value={contentData.content}
              onChange={(e) => setContentData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Digite o conteúdo principal da página"
              rows={10}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO e Meta Tags</CardTitle>
          <CardDescription>
            Configure as meta tags para otimização de busca
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="meta_title">Meta Título</Label>
            <Input
              id="meta_title"
              value={contentData.meta_title}
              onChange={(e) => setContentData(prev => ({ ...prev, meta_title: e.target.value }))}
              placeholder="Título para SEO (opcional)"
            />
          </div>

          <div>
            <Label htmlFor="meta_description">Meta Descrição</Label>
            <Textarea
              id="meta_description"
              value={contentData.meta_description}
              onChange={(e) => setContentData(prev => ({ ...prev, meta_description: e.target.value }))}
              placeholder="Descrição para SEO (opcional)"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Link to="/dashboard/admin/content">
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  );
};

export default ContentEdit;