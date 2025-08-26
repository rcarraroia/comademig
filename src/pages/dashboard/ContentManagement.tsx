
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface ContentPage {
  id: string;
  page_name: string;
  last_updated_at: string;
  content_json: any;
}

const ContentManagement = () => {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const pageDisplayNames = {
    home: 'Início',
    sobre: 'Sobre',
    lideranca: 'Liderança',
    noticias: 'Notícias',
    eventos: 'Eventos',
    multimidia: 'Multimídia',
    contato: 'Contato'
  };

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const { data, error } = await supabase
          .from('content_management')
          .select('*')
          .order('page_name');

        if (error) {
          console.error('Erro ao buscar páginas:', error);
          toast({
            title: 'Erro',
            description: 'Erro ao carregar as páginas',
            variant: 'destructive'
          });
          return;
        }

        setPages(data || []);
      } catch (error) {
        console.error('Erro ao buscar páginas:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar as páginas',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, [toast]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-comademig-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando páginas...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-comademig-blue">
            Gerenciar Conteúdo do Site
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie o conteúdo das páginas públicas do site
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Card key={page.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-comademig-blue" />
                  <span className="text-lg">
                    {pageDisplayNames[page.page_name as keyof typeof pageDisplayNames] || page.page_name}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>Última atualização:</p>
                  <p className="font-medium">
                    {new Date(page.last_updated_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                <Link 
                  to={`/dashboard/admin/content/${page.page_name}/edit`}
                  className="w-full"
                >
                  <Button 
                    className="w-full bg-comademig-blue hover:bg-blue-700"
                    size="sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Conteúdo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {pages.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma página encontrada
              </h3>
              <p className="text-gray-600">
                Não foram encontradas páginas para gerenciar.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ContentManagement;
