import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { 
  Users, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useFinancialMetrics, formatCurrency } from '@/hooks/useFinancial';

interface MemberTypeRevenueProps {
  viewType?: 'pie' | 'bar' | 'table';
  className?: string;
}

const MemberTypeRevenue: React.FC<MemberTypeRevenueProps> = ({ 
  viewType = 'pie',
  className = '' 
}) => {
  const { data: metrics, isLoading, error } = useFinancialMetrics();

  // Cores para o gráfico
  const COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
  ];

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando dados por cargo...</span>
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
              Erro ao carregar dados: {(error as Error).message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!metrics || metrics.revenue_by_member_type.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Receita por Cargo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma receita por cargo encontrada</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = metrics.revenue_by_member_type.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
    percentage: metrics.total_revenue > 0 ? (item.revenue / metrics.total_revenue) * 100 : 0
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.member_type}</p>
          <p className="text-blue-600">Receita: {formatCurrency(data.revenue)}</p>
          <p className="text-gray-600 text-sm">{data.count} membros</p>
          <p className="text-gray-600 text-sm">{data.percentage.toFixed(1)}% do total</p>
        </div>
      );
    }
    return null;
  };

  const renderPieChart = () => (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ member_type, percentage }) => 
              percentage > 5 ? `${member_type} (${percentage.toFixed(0)}%)` : ''
            }
            outerRadius={100}
            fill="#8884d8"
            dataKey="revenue"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  const renderBarChart = () => (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="member_type" 
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderTable = () => (
    <div className="space-y-3">
      {chartData.map((item, index) => (
        <div key={item.member_type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium">{item.member_type}</span>
            </div>
            <Badge variant="outline">
              {item.count} membros
            </Badge>
          </div>
          
          <div className="text-right">
            <div className="font-bold text-lg">{formatCurrency(item.revenue)}</div>
            <div className="text-sm text-gray-600">{item.percentage.toFixed(1)}% do total</div>
          </div>
        </div>
      ))}
    </div>
  );

  const topMemberType = chartData[0];
  const averageRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0) / chartData.length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Receita por Cargo Eclesiástico
        </CardTitle>
        <CardDescription>
          Distribuição da receita por tipo de membro
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Estatísticas resumidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {chartData.length}
            </div>
            <div className="text-sm text-gray-600">Tipos de Cargo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(averageRevenue)}
            </div>
            <div className="text-sm text-gray-600">Receita Média</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {topMemberType?.member_type || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Maior Receita</div>
          </div>
        </div>

        {/* Visualização */}
        {viewType === 'pie' && renderPieChart()}
        {viewType === 'bar' && renderBarChart()}
        {viewType === 'table' && renderTable()}

        {/* Insights */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Cargo Mais Rentável</span>
            </div>
            <div className="text-blue-700">
              <div className="font-bold">{topMemberType?.member_type}</div>
              <div className="text-sm">
                {formatCurrency(topMemberType?.revenue || 0)} ({topMemberType?.percentage.toFixed(1)}%)
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Receita por Membro</span>
            </div>
            <div className="text-green-700">
              <div className="font-bold">
                {formatCurrency(
                  topMemberType?.count > 0 
                    ? topMemberType.revenue / topMemberType.count 
                    : 0
                )}
              </div>
              <div className="text-sm">Média do cargo principal</div>
            </div>
          </div>
        </div>

        {/* Recomendações */}
        {chartData.length > 0 && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="font-medium text-yellow-800 mb-2">💡 Insights</div>
            <div className="text-sm text-yellow-700 space-y-1">
              {topMemberType && topMemberType.percentage > 50 && (
                <div>• O cargo "{topMemberType.member_type}" representa mais de 50% da receita</div>
              )}
              {chartData.filter(item => item.count === 0).length > 0 && (
                <div>• Alguns cargos não possuem membros ativos</div>
              )}
              {chartData.length > 5 && (
                <div>• Considere agrupar cargos com baixa receita para simplificar análises</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberTypeRevenue;