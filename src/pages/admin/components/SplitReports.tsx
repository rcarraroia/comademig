import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, TrendingUp, DollarSign, Users } from 'lucide-react';
import { useSplitManagement } from '@/hooks/useSplitManagement';
import { formatCurrency } from '@/utils/splitCalculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

/**
 * Componente para exibir relatórios e análises de splits
 */
export default function SplitReports() {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const { useSplitReports, useSplitStats } = useSplitManagement();
  const { data: reports, isLoading: isLoadingReports } = useSplitReports(dateRange);
  const { data: stats, isLoading: isLoadingStats } = useSplitStats();

  if (isLoadingReports || isLoadingStats) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Distribuído</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reports?.summary.totalAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {reports?.summary.totalCount || 0} splits processados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reports?.summary.totalProcessed || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((reports?.summary.totalProcessed || 0) / (reports?.summary.totalAmount || 1) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reports?.summary.totalPending || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando processamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Distribuição por Beneficiário */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Distribuição por Beneficiário</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reports?.byRecipient || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="recipientName" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="totalAmount" fill="#8884d8" name="Total" />
              <Bar dataKey="totalProcessed" fill="#82ca9d" name="Processado" />
              <Bar dataKey="totalPending" fill="#ffc658" name="Pendente" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Beneficiário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beneficiário</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Processado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pendente</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Erro</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports?.byRecipient.map((recipient: any) => (
                  <tr key={recipient.recipientType} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{recipient.recipientName}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">
                      {formatCurrency(recipient.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">
                      {formatCurrency(recipient.totalProcessed)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-yellow-600">
                      {formatCurrency(recipient.totalPending)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">
                      {formatCurrency(recipient.totalError)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">{recipient.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
