import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SobreContentData {
  titulo: string;
  descricao: string;
}

const SobreContentEdit = () => {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [contentData, setContentData] = useState<SobreContentData>({
    titulo: '',
    descricao: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isAdmin()) {
      loadContent();
    }
  }, [isAdmin]);

  const loadContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content_management')
        .select('content_json')
        .eq('page_name', 'about')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar conteúdo:', error);
        return;
      }

      if (data?.content_json) {
        const jsonData = data.content_json as any;
        setContentData(prev => ({
          ...prev,
          ...jsonData
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar conteúdo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('content_management')
        .upsert({
          page_name: 'about',
          content_json: contentData as any
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Conteúdo da página Sobre salvo com sucesso!",
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
            Editar Página: Sobre
          </h1>
          <p className="text-gray-600 mt-2">
            Configure o conteúdo da página "Sobre a COMADEMIG"
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conteúdo da Página Sobre</CardTitle>
          <CardDescription>
            Configure o conteúdo básico da página sobre
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={contentData.titulo}
              onChange={(e) => setContentData(prev => ({
                ...prev,
                titulo: e.target.value
              }))}
              placeholder="Título da página"
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={contentData.descricao}
              onChange={(e) => setContentData(prev => ({
                ...prev,
                descricao: e.target.value
              }))}
              placeholder="Descrição da página"
              rows={6}
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

export default SobreContentEdit;