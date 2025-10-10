import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthState } from '@/hooks/useAuthState';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Loader2, Settings, History, BarChart3, FileText } from 'lucide-react';

// Componentes
import SplitConfigurations from './components/SplitConfigurations';
import SplitHistory from './components/SplitHistory';
import SplitReports from './components/SplitReports';
import SplitAuditLog from './components/SplitAuditLog';

/**
 * Página de gerenciamento de splits - Exclusiva para Super Admin
 * Permite configurar divisão de pagamentos entre COMADEMIG, RENUM e Afiliados
 */
export default function SplitManagement() {
  const navigate = useNavigate();
  const { user, loading } = useAuthState();
  const { roles, loading: loadingRoles, hasRole } = useUserRoles();

  const isLoading = loading || loadingRoles;
  const isSuperAdmin = hasRole('super_admin' as any); // Super admin role

  // Verificar acesso - apenas super_admin
  useEffect(() => {
    if (!isLoading && (!user || !isSuperAdmin)) {
      console.warn('Acesso negado: usuário não é super_admin');
      navigate('/dashboard');
    }
  }, [user, isSuperAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isSuperAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Gerenciamento de Splits
        </h1>
        <p className="text-gray-600 mt-2">
          Configure a divisão de pagamentos entre COMADEMIG, RENUM e Afiliados
        </p>
      </div>

      <Tabs defaultValue="configurations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="configurations" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configurações</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Relatórios</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Auditoria</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Split</CardTitle>
              <CardDescription>
                Gerencie os percentuais de divisão por tipo de receita
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SplitConfigurations />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Splits</CardTitle>
              <CardDescription>
                Visualize todos os splits processados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SplitHistory />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de Splits</CardTitle>
              <CardDescription>
                Análise detalhada da distribuição de valores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SplitReports />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Log de Auditoria</CardTitle>
              <CardDescription>
                Histórico de alterações nas configurações de split
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SplitAuditLog />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
