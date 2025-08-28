
import { useAuth } from "@/contexts/AuthContext";
import { useProfileValidation } from "@/hooks/useProfileValidation";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAdminData } from "@/hooks/useAdminData";
import { ProfileCompletion } from "@/components/auth/ProfileCompletion";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CreditCard, FileText, MessageSquare, Users, TrendingUp, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { profile, user, isAdmin } = useAuth();
  const { getProfileCompletionPercentage, profileStatus, canAccessFeature } = useProfileValidation();
  const { stats, isLoading: adminLoading } = useAdminData();

  const completionPercentage = getProfileCompletionPercentage();

  const quickActions = [
    {
      title: "Carteira Digital",
      description: "Acesse sua identificação eclesiástica",
      icon: CreditCard,
      href: "/dashboard/carteira-digital",
      feature: "carteira-digital"
    },
    {
      title: "Eventos",
      description: "Veja eventos disponíveis",
      icon: Calendar,
      href: "/dashboard/eventos",
      feature: "eventos"
    },
    {
      title: "Financeiro", 
      description: "Consulte sua situação financeira",
      icon: FileText,
      href: "/dashboard/financeiro",
      feature: "financeiro"
    },
    {
      title: "Mensagens",
      description: "Comunicação interna",
      icon: MessageSquare,
      href: "/dashboard/comunicacao",
      feature: "comunicacao"
    }
  ];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'default';
      case 'pendente':
        return 'secondary';
      case 'suspenso':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">

      {/* Cabeçalho de boas-vindas */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-comademig-blue">
              Olá, {profile?.nome_completo || user?.email}!
            </h1>
            <p className="text-gray-600 mt-1">
              Bem-vindo ao Portal COMADEMIG
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Badge variant={getStatusBadgeVariant(profileStatus)}>
              Status: {profileStatus === 'ativo' ? 'Ativo' : 
                      profileStatus === 'pendente' ? 'Pendente' : 
                      profileStatus === 'suspenso' ? 'Suspenso' : profileStatus}
            </Badge>
            <Badge variant="outline">
              {profile?.cargo || 'Cargo não informado'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Componente de conclusão do perfil */}
      <ProfileCompletion />

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-comademig-blue">
              {completionPercentage}%
            </div>
            <p className="text-xs text-gray-600">
              Completude
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Igreja</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-comademig-blue truncate">
              {profile?.igreja || 'Não informado'}
            </div>
            <p className="text-xs text-gray-600">
              Congregação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Localização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-comademig-blue">
              {profile?.cidade ? `${profile.cidade}/${profile.estado}` : 'Não informado'}
            </div>
            <p className="text-xs text-gray-600">
              Cidade/Estado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Membro desde</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-comademig-blue">
              {profile?.data_ordenacao ? 
                new Date(profile.data_ordenacao).getFullYear() : 
                'N/A'
              }
            </div>
            <p className="text-xs text-gray-600">
              Ano de ordenação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Administrativas - Apenas para Admins */}
      {isAdmin() && !adminLoading && stats && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-comademig-blue">Métricas Administrativas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Total de Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-comademig-blue">
                  {stats.totalUsers || 0}
                </div>
                <p className="text-xs text-gray-600">
                  Membros registrados
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  Tickets Abertos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.openTickets || 0}
                </div>
                <p className="text-xs text-gray-600">
                  Aguardando atendimento
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  Eventos Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.activeEvents || 0}
                </div>
                <p className="text-xs text-gray-600">
                  Em andamento
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Taxa de Resolução
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.resolutionRate || '0%'}
                </div>
                <p className="text-xs text-gray-600">
                  Tickets resolvidos
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Ações rápidas */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const hasAccess = canAccessFeature(action.feature);
            const Icon = action.icon;
            
            return (
              <Card key={action.href} className={`hover:shadow-md transition-shadow ${!hasAccess ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Icon className={`h-5 w-5 ${hasAccess ? 'text-comademig-blue' : 'text-gray-400'}`} />
                    {!hasAccess && (
                      <Badge variant="secondary" className="text-xs">
                        Restrito
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-sm">{action.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    asChild={hasAccess} 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    disabled={!hasAccess}
                  >
                    {hasAccess ? (
                      <Link to={action.href}>Acessar</Link>
                    ) : (
                      <span>Indisponível</span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Avisos importantes */}
      {profileStatus === 'pendente' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">Análise em Andamento</CardTitle>
            <CardDescription className="text-amber-700">
              Sua documentação está sendo analisada pela nossa equipe. 
              Este processo pode levar até 5 dias úteis. Você receberá um email quando for aprovado.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {canAccessFeature('regularizacao') && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Serviço de Regularização
            </CardTitle>
            <CardDescription className="text-green-700">
              Como pastor filiado, você tem acesso ao nosso serviço completo 
              de regularização e legalização de igrejas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link to="/dashboard/regularizacao">
                Acessar Serviços de Regularização
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
