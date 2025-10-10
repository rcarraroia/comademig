import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Edit, Plus } from 'lucide-react';
import { useSplitConfiguration } from '@/hooks/useSplitConfiguration';
import { formatCurrency, formatPercentage, getRecipientBadgeColor } from '@/utils/splitCalculations';

/**
 * Componente para gerenciar configurações de split
 * Permite visualizar e editar percentuais por categoria de receita
 */
export default function SplitConfigurations() {
  const { configurations, isLoadingConfigurations } = useSplitConfiguration();
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);

  if (isLoadingConfigurations) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!configurations || configurations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Nenhuma configuração encontrada</p>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Configuração
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {configurations.map((config) => (
        <ConfigurationCard
          key={config.id}
          config={config}
          isSelected={selectedConfig === config.id}
          onSelect={() => setSelectedConfig(config.id)}
        />
      ))}
    </div>
  );
}

function ConfigurationCard({ config, isSelected, onSelect }: any) {
  const { getRecipientsByConfiguration } = useSplitConfiguration();
  const { data: recipients, isLoading } = getRecipientsByConfiguration(config.id);

  return (
    <div className={`border rounded-lg p-4 ${isSelected ? 'border-primary' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{config.category_label}</h3>
          <p className="text-sm text-gray-500">{config.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={config.is_active ? 'default' : 'secondary'}>
            {config.is_active ? 'Ativa' : 'Inativa'}
          </Badge>
          <Button variant="outline" size="sm" onClick={onSelect}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {recipients?.map((recipient: any) => (
            <div key={recipient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <Badge className={getRecipientBadgeColor(recipient.recipient_identifier)}>
                  {recipient.recipient_name}
                </Badge>
                <span className="text-sm text-gray-600">
                  {recipient.recipient_type === 'fixed' ? 'Fixo' : 'Dinâmico'}
                </span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatPercentage(recipient.percentage)}</div>
                {recipient.wallet_id && (
                  <div className="text-xs text-gray-500">
                    Wallet: {recipient.wallet_id.substring(0, 8)}...
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {recipients && recipients.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded font-semibold">
              <span>Total</span>
              <span>{formatPercentage(recipients.reduce((sum: number, r: any) => sum + r.percentage, 0))}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
