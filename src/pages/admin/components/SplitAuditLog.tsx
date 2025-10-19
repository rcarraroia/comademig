import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Filter } from 'lucide-react';
import { useSplitManagement } from '@/hooks/useSplitManagement';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Componente para exibir log de auditoria de alterações de configuração
 */
export default function SplitAuditLog() {
  const [filters, setFilters] = useState({
    limit: 100,
  });

  const { useConfigurationAuditLog } = useSplitManagement();
  const { data: auditLog, isLoading } = useConfigurationAuditLog(filters);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!auditLog || auditLog.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum registro de auditoria encontrado
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex justify-end">
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Timeline de Auditoria */}
      <div className="space-y-4">
        {auditLog.map((log: any) => (
          <AuditLogItem key={log.id} log={log} />
        ))}
      </div>
    </div>
  );
}

function AuditLogItem({ log }: { log: any }) {
  const [showDetails, setShowDetails] = useState(false);

  const actionLabels: Record<string, string> = {
    insert: 'Criação',
    update: 'Atualização',
    delete: 'Exclusão',
    INSERT: 'Criação',
    UPDATE: 'Atualização',
    DELETE: 'Exclusão',
  };

  const actionColors: Record<string, string> = {
    insert: 'bg-green-100 text-green-800',
    update: 'bg-blue-100 text-blue-800',
    delete: 'bg-red-100 text-red-800',
    INSERT: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge className={actionColors[log.action] || 'bg-gray-100 text-gray-800'}>
              {actionLabels[log.action] || log.action || 'Ação desconhecida'}
            </Badge>
            <span className="text-sm font-medium">
              {log.entity_type || log.table_name || 'Entidade desconhecida'}
            </span>
            <span className="text-xs text-gray-500">
              {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>

          {log.user_id && (
            <div className="text-sm text-gray-600 mb-2">
              Usuário: {log.user_id.substring(0, 8)}...
            </div>
          )}

          {log.entity_id && (
            <div className="text-xs text-gray-500 mb-2">
              ID: {log.entity_id.substring(0, 8)}...
            </div>
          )}

          {showDetails && (
            <div className="mt-4 space-y-3">
              {log.old_values && Object.keys(log.old_values).length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Valores Anteriores:</div>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(log.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {log.new_values && Object.keys(log.new_values).length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Novos Valores:</div>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(log.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Ocultar' : 'Detalhes'}
        </Button>
      </div>
    </div>
  );
}
