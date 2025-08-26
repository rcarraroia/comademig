
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Navigate } from "react-router-dom";

const ContentManagement = () => {
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

  const pages = [
    { name: "Início", key: "home", description: "Página inicial do site" },
    { name: "Sobre", key: "sobre", description: "Informações sobre a COMADEMIG" },
    { name: "Liderança", key: "lideranca", description: "Liderança da organização" },
    { name: "Notícias", key: "noticias", description: "Notícias e comunicados" },
    { name: "Eventos", key: "eventos", description: "Eventos da COMADEMIG" },
    { name: "Multimídia", key: "multimidia", description: "Galeria de fotos e vídeos" },
    { name: "Contato", key: "contato", description: "Informações de contato" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-comademig-blue">Gerenciar Conteúdo do Site</h1>
          <p className="text-gray-600 mt-2">
            Gerencie o conteúdo das páginas públicas do site COMADEMIG
          </p>
        </div>

        <div className="grid gap-4">
          {pages.map((page) => (
            <Card key={page.key} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-comademig-blue" />
                    <div>
                      <CardTitle className="text-lg">{page.name}</CardTitle>
                      <CardDescription>{page.description}</CardDescription>
                    </div>
                  </div>
                  <Link to={`/dashboard/admin/content/${page.key}/edit`}>
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <Edit className="h-4 w-4" />
                      <span>Editar</span>
                    </Button>
                  </Link>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ContentManagement;
