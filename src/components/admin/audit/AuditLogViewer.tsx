import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Download, Eye, Activity, AlertTriangle, User, Calendar, Database } from 'lucide-react';
import { useAuditLog, type AuditLog } from '@/hooks/useAuditLog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AuditLogViewer = () => {
  const { useAuditLogs, userLogs, loadingUserLogs } = useAuditLog();
  
  const [filters, setFilters] = useState({
    table_name: '',
    operation: '',
    user_id: '',
    date_from: '',
    date_to: '',
    limit: 100
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Buscar logs com filtros
  const { data: allLogs = [], isLoading, refetch } = useAuditLogs(filters);
  
  // Filtrar logs por termo de busca
  const filteredLogs = allLogs.filter(log => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      log.operation_description?.toLowerCase().includes(searchLower) ||
      log.user_email?.toLowerCase().includes(searchLower) ||
      log.table_name.toLowerCase().includes(searchLower) ||
      log.changes_summary?.toLowerCase().includes(searchLower)
    );
  });
  
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };
  
  const clearFilters = () => {
    setFilters({
      table_name: '',
      operation: '',
      user_id: '',
      date_from: '',
      date_to: '',
      limit: 100
    });
    setSearchTerm('');
  };
  
  const exportLogs = () => {
    const csvContent = [
      ['Data/Hora', 'Usuário', 'Operação', 'Tabela', 'Descrição', 'IP', 'User Agent'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }),
        log.user_email || 'Sistema',
        log.operation,
        log.table_name,
        log.operation_description || '',
        log.ip_address || '',
        log.user_agent || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };
  
  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'INSERT': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'LOGIN': return 'bg-purple-100 text-purple-800';
      case 'LOGOUT': return 'bg-gray-100 text-gray-800';
      case 'VIEW': return 'bg-yellow-100 text-yellow-800';
      case 'DOWNLOAD': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'INSERT': return <Database className="h-3 w-3" />;
      case 'UPDATE': return <Activity className="h-3 w-3" />;
      case 'DELETE': return <AlertTriangle className="h-3 w-3" />;
      case 'LOGIN': case 'LOGOUT': return <User className="h-3 w-3" />;
      case 'VIEW': return <Eye className="h-3 w-3" />;
      case 'DOWNLOAD': return <Download className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };
  
  const LogCard = ({ log }: { log: AuditLog }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge className={getOperationColor(log.operation)}>
              {getOperationIcon(log.operation)}
              {log.operation}
            </Badge>
            <span className="text-sm font-medium">{log.operation_description}</span>
          </div>
          <span className="text-xs text-gray-500">
            {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Usuário:</span>
            <span className="ml-2">{log.user_email || 'Sistema'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Tabela:</span>
            <span className="ml-2">{log.table_name}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">ID do Registro:</span>
            <span className="ml-2 font-mono text-xs">{log.record_id}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">IP:</span>
            <span className="ml-2">{log.ip_address || 'N/A'}</span>
          </div>
        </div>
        
        {log.changes_summary && (
          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
            <span className="font-medium text-gray-700">Alterações:</span>
            <span className="ml-2">{log.changes_summary}</span>
          </div>
        )}
        
        {(log.old_values || log.new_values) && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
              Ver detalhes técnicos
            </summary>
            <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
              {log.old_values && (
                <div className="mb-2">
                  <strong>Valores Anteriores:</strong>
                  <pre className="mt-1 overflow-x-auto">{JSON.stringify(log.old_values, null, 2)}</pre>
                </div>
              )}
              {log.new_values && (
                <div>
                  <strong>Novos Valores:</strong>
                  <pre className="mt-1 overflow-x-auto">{JSON.stringify(log.new_values, null, 2)}</pre>
                </div>
              )}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logs de Auditoria</h1>
          <p className="text-gray-600">Visualize e monitore todas as atividades do sistema</p>
        </div>
        <Button onClick={exportLogs} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>
      
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="table_name">Tabela</Label>
              <Select value={filters.table_name} onValueChange={(value) => handleFilterChange('table_name', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as tabelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as tabelas</SelectItem>
                  <SelectItem value="member_types">Tipos de Membro</SelectItem>
                  <SelectItem value="subscription_plans">Planos de Assinatura</SelectItem>
                  <SelectItem value="user_subscriptions">Assinaturas de Usuário</SelectItem>
                  <SelectItem value="profiles">Perfis de Usuário</SelectItem>
                  <SelectItem value="carteira_digital">Carteira Digital</SelectItem>
                  <SelectItem value="auth_sessions">Sessões de Auth</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="operation">Operação</Label>
              <Select value={filters.operation} onValueChange={(value) => handleFilterChange('operation', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as operações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as operações</SelectItem>
                  <SelectItem value="INSERT">Criação</SelectItem>
                  <SelectItem value="UPDATE">Atualização</SelectItem>
                  <SelectItem value="DELETE">Exclusão</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="VIEW">Visualização</SelectItem>
                  <SelectItem value="DOWNLOAD">Download</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="date_from">Data Inicial</Label>
              <Input
                id="date_from"
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="date_to">Data Final</Label>
              <Input
                id="date_to"
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por usuário, operação, tabela..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
            <Button onClick={() => refetch()}>
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todos os Logs ({filteredLogs.length})</TabsTrigger>
          <TabsTrigger value="user">Meus Logs ({userLogs.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredLogs.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Nenhum log encontrado com os filtros aplicados.
              </AlertDescription>
            </Alert>
          ) : (
            <div>
              {filteredLogs.map((log) => (
                <LogCard key={log.id} log={log} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="user" className="space-y-4">
          {loadingUserLogs ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : userLogs.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Você ainda não possui atividades registradas.
              </AlertDescription>
            </Alert>
          ) : (
            <div>
              {userLogs.map((log) => (
                <LogCard key={log.id} log={log} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuditLogViewer;