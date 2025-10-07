import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  BarChart3, 
  User, 
  AlertCircle,
  ArrowLeft,
  Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuditDashboard from '@/components/admin/AuditDashboard';
import AuditLogTable from '@/components/admin/AuditLogTable';
import { useUserActivityTimeline } from '@/hooks/useAudit';
import type { UserActivityLog } from '@/hooks/useAudit';

const AuditLogs: React.FC = () => {
  const { isAdmin } = useAuth();
  const [selectedLog, setSelectedLog] = useState<UserActivityLog | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogClick = (log: UserActivityLog) => {
    setSelectedLog(log);
    setActiveTab('details');
  };

  const handleUserTimelineClick = (userId: string) => {
    setSelectedUserId(userId);
    setActiveTab('timeline');
  };

  const handleBackToList = () => {
    setSelectedLog(null);
    setSelectedUserId(null);
    setActiveTab('dashboard');
  };

  if (!isAdmin()) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Esta página é restrita a administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Auditoria</h1>
          <p className="text-muted-foreground">
            Monitore atividades e mantenha a segurança do sistema
          </p>
        </div>
        
        {(selectedLog || selectedUserId) && (
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        )}
      </div>

      {/* Conteúdo principal */}
      {selectedLog ? (
        <LogDetailsView log={selectedLog} onBack={handleBackToList} />
      ) : selectedUserId ? (
        <UserTimelineView userId={selectedUserId} onBack={handleBackToList} />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <AuditDashboard />
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <AuditLogTable onLogClick={handleLogClick} />
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <SecurityOverview onUserClick={handleUserTimelineClick} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

// Componente para exibir detalhes de um log específico
const LogDetailsView: React.FC<{ 
  log: UserActivityLog; 
  onBack: () => void; 
}> = ({ log, onBack }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Detalhes do Log
          </CardTitle>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações básicas */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Informações da Ação</h3>
            <div className="space-y-2 text-sm">
              <div><strong>ID:</strong> {log.id}</div>
              <div><strong>Ação:</strong> {log.action}</div>
              <div><strong>Tabela:</strong> {log.table_name}</div>
              <div><strong>Registro ID:</strong> {log.record_id}</div>
              <div><strong>Data/Hora:</strong> {new Date(log.created_at).toLocaleString('pt-BR')}</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Informações do Usuário</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Usuário:</strong> {log.user?.nome_completo || 'Sistema'}</div>
              <div><strong>Cargo:</strong> {log.user?.cargo || 'N/A'}</div>
              <div><strong>IP:</strong> {log.ip_address || 'N/A'}</div>
              <div><strong>User Agent:</strong> {log.user_agent || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Valores alterados */}
        {(log.old_values || log.new_values) && (
          <div>
            <h3 className="font-semibold mb-3">Dados Alterados</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {log.old_values && (
                <div>
                  <h4 className="text-sm font-medium text-red-700 mb-2">Valores Anteriores</h4>
                  <pre className="bg-red-50 p-3 rounded text-xs overflow-auto max-h-64">
                    {JSON.stringify(log.old_values, null, 2)}
                  </pre>
                </div>
              )}
              
              {log.new_values && (
                <div>
                  <h4 className="text-sm font-medium text-green-700 mb-2">Novos Valores</h4>
                  <pre className="bg-green-50 p-3 rounded text-xs overflow-auto max-h-64">
                    {JSON.stringify(log.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Componente para timeline de usuário
const UserTimelineView: React.FC<{ 
  userId: string; 
  onBack: () => void; 
}> = ({ userId, onBack }) => {
  const { data: timeline, isLoading } = useUserActivityTimeline(userId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Timeline do Usuário
          </CardTitle>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Carregando timeline...</div>
        ) : !timeline || timeline.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma atividade encontrada para este usuário
          </div>
        ) : (
          <div className="space-y-4">
            {timeline.map((activity) => (
              <div key={activity.id} className="border-l-2 border-blue-200 pl-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{activity.action}</span>
                  <span className="text-sm text-gray-600">em {activity.table_name}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(activity.created_at).toLocaleString('pt-BR')}
                </div>
                {activity.record_id && (
                  <div className="text-xs text-gray-600 mt-1">
                    Registro: {activity.record_id.slice(0, 8)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Componente de visão geral de segurança
const SecurityOverview: React.FC<{ 
  onUserClick: (userId: string) => void; 
}> = ({ onUserClick }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Visão Geral de Segurança
          </CardTitle>
          <CardDescription>
            Monitore atividades suspeitas e padrões de segurança
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Alertas de Segurança</h3>
              <div className="space-y-2">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Sistema funcionando normalmente. Nenhum alerta de segurança.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Recomendações</h3>
              <div className="space-y-2 text-sm">
                <div>• Monitore regularmente os logs de auditoria</div>
                <div>• Verifique atividades de exclusão em massa</div>
                <div>• Acompanhe logins de administradores</div>
                <div>• Revise alterações em dados sensíveis</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;