
import { ReactNode } from 'react';
import { useProfileValidation } from '@/hooks/useProfileValidation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeatureGuardProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const FeatureGuard = ({ feature, children, fallback }: FeatureGuardProps) => {
  const { canAccessFeature, profileStatus, isProfileComplete } = useProfileValidation();

  const hasAccess = canAccessFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Fallback padrão baseado no motivo da restrição
  const getRestrictionReason = () => {
    if (profileStatus === 'suspenso') {
      return {
        icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
        title: "Acesso Suspenso",
        description: "Seu acesso a este recurso foi temporariamente suspenso. Entre em contato com o suporte para mais informações.",
        actionText: "Entrar em Contato",
        actionLink: "/dashboard/suporte"
      };
    }

    if (!isProfileComplete()) {
      return {
        icon: <AlertTriangle className="h-8 w-8 text-amber-500" />,
        title: "Perfil Incompleto",
        description: "Complete seu perfil para ter acesso a este recurso.",
        actionText: "Completar Perfil",
        actionLink: "/dashboard/meus-dados"
      };
    }

    if (profileStatus !== 'ativo') {
      return {
        icon: <Lock className="h-8 w-8 text-blue-500" />,
        title: "Aguardando Aprovação",
        description: "Seu perfil está sendo analisado. Este recurso será liberado após a aprovação.",
        actionText: "Ver Status",
        actionLink: "/dashboard/perfil"
      };
    }

    if (feature === 'regularizacao') {
      return {
        icon: <Lock className="h-8 w-8 text-blue-500" />,
        title: "Acesso Restrito",
        description: "Este serviço está disponível apenas para pastores filiados ativos.",
        actionText: "Verificar Requisitos",
        actionLink: "/dashboard/perfil"
      };
    }

    return {
      icon: <Lock className="h-8 w-8 text-gray-500" />,
      title: "Acesso Negado",
      description: "Você não tem permissão para acessar este recurso.",
      actionText: "Voltar ao Dashboard",
      actionLink: "/dashboard"
    };
  };

  const restriction = getRestrictionReason();

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            {restriction.icon}
          </div>
          <CardTitle>{restriction.title}</CardTitle>
          <CardDescription>{restriction.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link to={restriction.actionLink}>
              {restriction.actionText}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
