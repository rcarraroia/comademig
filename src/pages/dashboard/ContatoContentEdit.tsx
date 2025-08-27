import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ContatoContentData {
  titulo: string;
  descricao: string;
  endereco: string;
  telefone: string;
  email: string;
}

const ContatoContentEdit = () => {
  const { isAdmin, loading } = useUserRoles();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [contentData, setContentData] = useState<ContatoContentData>({
    titulo: '',
    descricao: '',
    endereco: '',
    telefone: '',
    email: ''
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
        .eq('page_name', 'contact')
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
          page_name: 'contact',
          content_json: contentData as any
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Conteúdo da página Contato salvo com sucesso!",
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
            Editar Página: Contato
          </h1>
          <p className="text-gray-600 mt-2">
            Configure o conteúdo da página de Contato
          </p>
        </div>
      </div>  
    <Card>
        <CardHeader>
          <CardTitle>Conteúdo da Página Contato</CardTitle>
          <CardDescription>
            Configure o conteúdo básico da página contato
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

          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={contentData.endereco}
              onChange={(e) => setContentData(prev => ({
                ...prev,
                endereco: e.target.value
              }))}
              placeholder="Endereço completo"
            />
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={contentData.telefone}
              onChange={(e) => setContentData(prev => ({
                ...prev,
                telefone: e.target.value
              }))}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={contentData.email}
              onChange={(e) => setContentData(prev => ({
                ...prev,
                email: e.target.value
              }))}
              placeholder="contato@exemplo.com"
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

export default ContatoContentEdit;