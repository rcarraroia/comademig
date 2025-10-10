import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Filter, RefreshCw } from 'lucide-react';
import { useSplitManagement } from '@/hooks/useSplitManagement';
import { useAsaasSplits } from '@/hooks/useAsaasSplits';
import { formatCurrency, formatPercentage } from '@/utils/splitCalculations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

/**
 * Componente para visualizar histórico de splits processados
 */
export default function SplitHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    limit: 50,
  });
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  const { useSplitHistory } = useSplitManagement();
  const { data: history, isLoading, refetch } = useSplitHistory(filters);
  const { retrySplit } = useAsaasSplits();

  const handleReprocess = async (splitId: string) => {
    setReprocessingId(splitId);
    try {
      await retrySplit.mutateAsync(splitId);
      toast.success('Split reprocessado com sucesso!');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao reprocessar split');
    } finally {
      setReprocessingId(null);
    }
  };

  const filteredHistory = history?.filter((split: any) => {
    if (!searchTerm) return true;
    return (
      split.cobranca_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      split.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por ID de cobrança ou beneficiário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cobrança</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beneficiário</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Percentual</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredHistory?.map((split: any) => (
                <tr key={split.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {format(new Date(split.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-xs">
                    {split.cobranca_id?.substring(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="outline">{split.recipient_name}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm capitalize">
                    {split.service_type || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {split.percentage ? formatPercentage(split.percentage) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">
                    {split.commission_amount ? formatCurrency(split.commission_amount) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <StatusBadge status={split.status} />
                      {split.status === 'ERROR' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReprocess(split.id)}
                          disabled={reprocessingId === split.id}
                        >
                          {reprocessingId === split.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredHistory && filteredHistory.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum split encontrado
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: any; label: string }> = {
    PENDING: { variant: 'secondary', label: 'Pendente' },
    PROCESSED: { variant: 'default', label: 'Processado' },
    ERROR: { variant: 'destructive', label: 'Erro' },
    CANCELLED: { variant: 'outline', label: 'Cancelado' },
  };

  const config = variants[status] || { variant: 'outline', label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
