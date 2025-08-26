
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Construction } from "lucide-react";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Navigate } from "react-router-dom";

const ContentEdit = () => {
  const { pageName } = useParams();
  const { isAdmin, loading } = useUserRoles();

  if (loading) {
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
    home: "Início",
    sobre: "Sobre",
    lideranca: "Liderança",
    noticias: "Notícias",
    eventos: "Eventos",
    multimidia: "Multimídia",
    contato: "Contato",
  };

  const displayName = pageNames[pageName || ""] || pageName;

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
            Editar Página: {displayName}
          </h1>
          <p className="text-gray-600">
            Editor de conteúdo para a página {displayName}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Construction className="h-5 w-5" />
            <span>Em Desenvolvimento</span>
          </CardTitle>
          <CardDescription>
            Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            O editor de conteúdo para a página <strong>{displayName}</strong> será implementado
            na próxima fase do projeto. Esta página servirá como base para futuras
            implementações do sistema de gerenciamento de conteúdo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentEdit;
