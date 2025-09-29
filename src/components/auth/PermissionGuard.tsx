import { ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useHasPermission, useHasPermissions, useUserSubscriptions } from '@/hooks/useUserPermissions';
import { Lock, Shield, CreditCard, AlertTriangle } from 'lucide-react';

interface PermissionGuardProps {
  /** Permissão única necessária */
  permission?: string;
  /** Lista de permissões necessárias */
  permissions?: string[];
  /** Se true, usuário precisa ter TODAS as permissões. Se false, precisa ter PELO MENOS UMA */
  requireAll?: boolean;
  /** Conteúdo a ser renderizado se o usuário tiver permissão */
  children: ReactNode;
  /** Componente customizado para exibir quando não tem permissão */
  fallback?: ReactNode;
  /** Se true, não exibe nada quando não tem permissão (ao invés do fallback padrão) */
  hideWhenDenied?: boolean;
  /** Título customizado para a mensagem de acesso negado */
  deniedTitle?: string;
  /** Descrição customizada para a mensagem de acesso negado */
  deniedDescription?: string;
  /** Se true, exibe sugestões de upgrade de plano */
  showUpgradeOptions?: boolean;
}

export default function PermissionGuard({
  permission,
  permissions,
  requireAll = true,
  children,
  fallback,
  hideWhenDenied = false,
  deniedTitle,
  deniedDescription,
  showUpgradeOptions = false
}: PermissionGuardProps) {
  // Determinar quais permissões verificar
  const requiredPermissions = permission ? [permission] : (permissions || []);
  
  // Hooks para verificar permissões
  const singlePermissionCheck = useHasPermission(permission || '');
  const multiplePermissionsCheck = useHasPermissions(requiredPermissions);
  
  // Usar o hook apropriado baseado no input
  const permissionCheck = permission ? singlePermissionCheck : multiplePermissionsCheck;
  
  const { data: userSubscriptions } = useUserSubscriptions();

  // Estados de loading
  if (permissionCheck.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <span className="ml-2 text-muted-foreground">Verificando permissões...</span>
      </div>
    );
  }

  // Verificar se tem permissão
  const hasPermission = permission 
    ? singlePermissionCheck.hasPermission
    : (requireAll ? multiplePermissionsCheck.hasAllPermissions : multiplePermissionsCheck.hasAnyPermission);

  // Se tem permissão, renderizar conteúdo
  if (hasPermission) {
    return <>{children}</>;
  }

  // Se não tem permissão e deve esconder, não renderizar nada
  if (hideWhenDenied) {
    return null;
  }

  // Se tem fallback customizado, usar ele
  if (fallback) {
    return <>{fallback}</>;
  }

  // Renderizar mensagem padrão de acesso negado
  return <PermissionDeniedMessage 
    requiredPermissions={requiredPermissions}
    missingPermissions={multiplePermissionsCheck.missingPermissions}
    userSubscriptions={userSubscriptions}
    title={deniedTitle}
    description={deniedDescription}
    showUpgradeOptions={showUpgradeOptions}
  />;
}

interface PermissionDeniedMessageProps {
  requiredPermissions: string[];
  missingPermissions: string[];
  userSubscriptions?: any[];
  title?: string;
  description?: string;
  showUpgradeOptions: boolean;
}

function PermissionDeniedMessage({
  requiredPermissions,
  missingPermissions,
  userSubscriptions,
  title,
  description,
  showUpgradeOptions
}: PermissionDeniedMessageProps) {
  const hasActiveSubscriptions = userSubscriptions?.some(sub => sub.status === 'active');

  const formatPermissionName = (permission: string) => {
    return permission
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <Lock className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-xl">
          {title || 'Acesso Restrito'}
        </CardTitle>
        <CardDescription>
          {description || 'Você não possui as permissões necessárias para acessar este conteúdo.'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Permissões necessárias */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Permissões Necessárias:
          </h4>
          <div className="flex flex-wrap gap-2">
            {requiredPermissions.map(permission => (
              <Badge 
                key={permission} 
                variant={missingPermissions.includes(permission) ? "destructive" : "default"}
                className="text-xs"
              >
                {formatPermissionName(permission)}
                {missingPermissions.includes(permission) && (
                  <AlertTriangle className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Status da assinatura */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Status da Assinatura:
          </h4>
          {!userSubscriptions || userSubscriptions.length === 0 ? (
            <Alert>
              <AlertDescription>
                Você não possui nenhuma assinatura ativa. Para acessar este conteúdo, 
                é necessário ter um plano que inclua as permissões necessárias.
              </AlertDescription>
            </Alert>
          ) : hasActiveSubscriptions ? (
            <Alert>
              <AlertDescription>
                Você possui assinaturas ativas, mas elas não incluem as permissões 
                necessárias para acessar este conteúdo.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertDescription>
                Suas assinaturas expiraram ou foram canceladas. Para continuar acessando 
                este conteúdo, renove sua assinatura.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Opções de upgrade */}
        {showUpgradeOptions && (
          <div className="pt-4 border-t">
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Para acessar este conteúdo, você precisa de um plano que inclua as permissões necessárias.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="default" size="sm">
                  Ver Planos Disponíveis
                </Button>
                <Button variant="outline" size="sm">
                  Falar com Suporte
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Informações de contato */}
        <div className="pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Se você acredita que deveria ter acesso a este conteúdo, 
            entre em contato com o suporte técnico.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Hook para usar o PermissionGuard de forma programática
 */
export function usePermissionGuard(
  permission?: string, 
  permissions?: string[], 
  requireAll: boolean = true
) {
  const requiredPermissions = permission ? [permission] : (permissions || []);
  const { hasPermission } = useHasPermission(permission || '');
  const { hasAllPermissions, hasAnyPermission, isLoading } = useHasPermissions(requiredPermissions);

  const hasAccess = permission 
    ? hasPermission
    : (requireAll ? hasAllPermissions : hasAnyPermission);

  return {
    hasAccess,
    isLoading,
    canRender: hasAccess
  };
}