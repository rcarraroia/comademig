
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const ContentEdit = () => {
  const { pageName } = useParams<{ pageName: string }>();

  const pageDisplayNames = {
    home: 'Início',
    sobre: 'Sobre',
    lideranca: 'Liderança',
    noticias: 'Notícias',
    eventos: 'Eventos',
    multimidia: 'Multimídia',
    contato: 'Contato'
  };

  const displayName = pageDisplayNames[pageName as keyof typeof pageDisplayNames] || pageName;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/admin/content">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-comademig-blue">
              Editar Conteúdo - {displayName}
            </h1>
            <p className="text-gray-600 mt-2">
              Editor de conteúdo para a página {displayName}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Edit className="h-5 w-5 text-comademig-blue" />
              <span>Editor de Conteúdo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <div className="max-w-md mx-auto">
              <Edit className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Editor em Desenvolvimento
              </h3>
              <p className="text-gray-600 mb-6">
                O editor de conteúdo para a página "{displayName}" será implementado em breve. 
                Esta é uma página placeholder que serve como base para as próximas implementações.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Página:</strong> {pageName} <br />
                  <strong>Rota:</strong> /dashboard/admin/content/{pageName}/edit
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ContentEdit;
