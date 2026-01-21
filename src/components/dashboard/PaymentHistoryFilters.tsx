import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Filter, 
  X, 
  Search, 
  Calendar,
  TrendingUp,
  DollarSign,
  FileText,
  RotateCcw
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PaymentHistoryFiltersProps {
  filters: {
    period: string;
    status: string;
    paymentMethod: string;
    searchTerm?: string;
  };
  stats: {
    totalValue: number;
    confirmedValue: number;
    pendingValue: number;
    totalCount: number;
    byMethod: Record<string, number>;
    byStatus: Record<string, number>;
  };
  onFiltersChange: (filters: any) => void;
  onReset: () => void;
}

export default function PaymentHistoryFilters({ 
  filters, 
  stats, 
  onFiltersChange, 
  onReset 
}: PaymentHistoryFiltersProps) {
  
  const periodOptions = [
    { value: 'all', label: 'Todos os períodos' },
    { value: 'last_month', label: 'Último mês' },
    { value: 'last_3_months', label: 'Últimos 3 meses' },
    { value: 'last_year', label: 'Último ano' },
    { value: 'custom', label: 'Período customizado' },
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'CONFIRMED', label: 'Confirmado' },
    { value: 'RECEIVED', label: 'Recebido' },
    { value: 'PENDING', label: 'Pendente' },
    { value: 'OVERDUE', label: 'Vencido' },
    { value: 'CANCELLED', label: 'Cancelado' },
  ];

  const methodOptions = [
    { value: 'all', label: 'Todos os métodos' },
    { value: 'PIX', label: 'PIX' },
    { value: 'CREDIT_CARD', label: 'Cartão de Crédito' },
    { value: 'BOLETO', label: 'Boleto' },
  ];

  const getStatusBadge = (status: string, count: number) => {
    const configs = {
      CONFIRMED: { variant: 'default' as const, label: 'Confirmado' },
      RECEIVED: { variant: 'default' as const, label: 'Recebido' },
      PENDING: { variant: 'secondary' as const, label: 'Pendente' },
      OVERDUE: { variant: 'destructive' as const, label: 'Vencido' },
      CANCELLED: { variant: 'outline' as const, label: 'Cancelado' },
    };

    const config = configs[status as keyof typeof configs];
    if (!config || count === 0) return null;

    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}: {count}
      </Badge>
    );
  };

  const hasActiveFilters = 
    filters.period !== 'last_3_months' || 
    filters.status !== 'all' || 
    filters.paymentMethod !== 'all' || 
    (filters.searchTerm && filters.searchTerm.trim());

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Estatísticas
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Limpar Filtros
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Período */}
          <div className="space-y-2">
            <Label htmlFor="period">Período</Label>
            <Select
              value={filters.period}
              onValueChange={(value) => onFiltersChange({ period: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => onFiltersChange({ status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Método de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="method">Método</Label>
            <Select
              value={filters.paymentMethod}
              onValueChange={(value) => onFiltersChange({ paymentMethod: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar método" />
              </SelectTrigger>
              <SelectContent>
                {methodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Busca */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Descrição ou ID..."
                value={filters.searchTerm || ''}
                onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Estatísticas Resumidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Total de Pagamentos</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{stats.totalCount}</p>
            <p className="text-sm text-blue-600">{formatCurrency(stats.totalValue)}</p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Confirmados</span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {(stats.byStatus.CONFIRMED || 0) + (stats.byStatus.RECEIVED || 0)}
            </p>
            <p className="text-sm text-green-600">{formatCurrency(stats.confirmedValue)}</p>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Pendentes</span>
            </div>
            <p className="text-2xl font-bold text-orange-900">
              {(stats.byStatus.PENDING || 0) + (stats.byStatus.OVERDUE || 0)}
            </p>
            <p className="text-sm text-orange-600">{formatCurrency(stats.pendingValue)}</p>
          </div>
        </div>

        {/* Badges de Status */}
        {Object.keys(stats.byStatus).length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Distribuição por Status:</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byStatus).map(([status, count]) => 
                getStatusBadge(status, count)
              ).filter(Boolean)}
            </div>
          </div>
        )}

        {/* Distribuição por Método */}
        {Object.keys(stats.byMethod).length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Receita por Método:</Label>
            <div className="space-y-2">
              {Object.entries(stats.byMethod).map(([method, value]) => (
                <div key={method} className="flex justify-between items-center text-sm">
                  <span className="font-medium">
                    {method === 'PIX' ? 'PIX' : 
                     method === 'CREDIT_CARD' ? 'Cartão de Crédito' : 
                     method === 'BOLETO' ? 'Boleto' : method}
                  </span>
                  <span className="text-green-600 font-medium">
                    {formatCurrency(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}