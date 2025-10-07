import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Filter, 
  Activity, 
  User, 
  Calendar,
  Database,
  AlertCircle,
  Loader2,
  Eye,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  useAuditLogs, 
  formatAction, 
  getActionColor, 
  formatTableName, 
  formatDateTime, 
  getRelativeTime,
  type AuditFilters 
} from '@/hooks/useAudit';

interface AuditLogTableProps {
  onLogClick?: (log: any) => void;
  className?: string;
}

const AuditLogTable: React.FC<AuditLogTableProps> = ({ 
  onLogClick, 
  className = '' 
}) => {
  const [filters, setFilters] = useState<AuditFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  
  const pageSize = 20;
  const offset = currentPage * pageSize;

  const { data: logs, isLoading, error, refetch } = useAuditLogs(
    { ...filters, search: searchTerm },
    { limit: pageSize, offset }
  );

  // Tabelas disponíveis para filtro
  const availableTables = [
    'profiles',
    'member_types', 
    'subscription_plans',
    'user_subscriptions',
    'support_tickets',
    'support_messages',
    'financial_transactions',
    'certidoes',
    'asaas_cobrancas'
  ];

  const handleFilterChange = (key: keyof AuditFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }));
    setCurrentPage(0); // Reset para primeira página
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(0);
  };

  const exportLogs = () => {
    // TODO: Implementar exportação
    console.log('Exportar logs:', { filters, searchTerm });
  };

  const toggleDetails = (logId: string) => {
    setShowDetails(showDetails === logId ? null : logId);
  };

  const renderValueDiff = (oldValues: any, newValues: any) => {
    if (!oldValues && !newValues) return null;

    return (
      <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs">
        {oldValues && (
          <div className="mb-2">
            <span className="font-medium text-red-700">Valores Anteriores:</span>
            <pre className="mt-1 text-red-600 whitespace-pre-wrap">
              {JSON.stringify(oldValues, null, 2)}
            </pre>
          </div>
        )}
        {newValues && (
          <div>
            <span className="font-medium text-green-700">Novos Valores:</span>
            <pre className="mt-1 text-green-600 whitespace-pre-wrap">
              {JSON.stringify(newValues, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando logs de auditoria...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar logs: {(error as Error).message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Logs de Auditoria
            </CardTitle>
            <CardDescription>
              Histórico completo de atividades do sistema
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Filtros */}
        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por ID do registro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros em linha */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select 
              value={filters.action || 'all'} 
              onValueChange={(value) => handleFilterChange('action', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ações</SelectItem>
                <SelectItem value="INSERT">Criação</SelectItem>
                <SelectItem value="UPDATE">Atualização</SelectItem>
                <SelectItem value="DELETE">Exclusão</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.table_name || 'all'} 
              onValueChange={(value) => handleFilterChange('table_name', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tabela" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Tabelas</SelectItem>
                {availableTables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {formatTableName(table)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Data inicial"
              value={filters.date_from || ''}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
            />

            <Input
              type="date"
              placeholder="Data final"
              value={filters.date_to || ''}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
            />
          </div>

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={clearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
            
            <div className="text-sm text-gray-600">
              {logs?.length || 0} registros encontrados
            </div>
          </div>
        </div>

        {/* Lista de Logs */}
        {!logs || logs.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">
              Nenhum log de auditoria encontrado
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <Card 
                key={log.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onLogClick?.(log)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Header do log */}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getActionColor(log.action)}>
                          {formatAction(log.action)}
                        </Badge>
                        <Badge variant="outline">
                          {formatTableName(log.table_name)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          ID: {log.record_id?.slice(0, 8)}...
                        </span>
                      </div>

                      {/* Informações do usuário */}
                      <div className="flex items-center gap-4 mb-2 text-sm">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>
                            {log.user?.nome_completo || 'Sistema'}
                            {log.user?.cargo && (
                              <span className="text-gray-500 ml-1">({log.user.cargo})</span>
                            )}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{getRelativeTime(log.created_at)}</span>
                        </div>
                      </div>

                      {/* Timestamp detalhado */}
                      <div className="text-xs text-gray-500">
                        {formatDateTime(log.created_at)}
                        {log.ip_address && (
                          <span className="ml-2">IP: {log.ip_address}</span>
                        )}
                      </div>

                      {/* Detalhes expandidos */}
                      {showDetails === log.id && (
                        <div className="mt-3">
                          {log.user_agent && (
                            <div className="text-xs text-gray-600 mb-2">
                              <strong>User Agent:</strong> {log.user_agent}
                            </div>
                          )}
                          
                          {renderValueDiff(log.old_values, log.new_values)}
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDetails(log.id);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Paginação */}
        {logs && logs.length === pageSize && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            
            <span className="text-sm text-gray-600">
              Página {currentPage + 1}
            </span>
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={logs.length < pageSize}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditLogTable;