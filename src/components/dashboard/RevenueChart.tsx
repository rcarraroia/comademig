import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useFinancialDashboard } from '@/hooks/useFinancialDashboard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, BarChart3 } from 'lucide-react'

interface RevenueChartProps {
  months?: number
  type?: 'bar' | 'line'
}

export default function RevenueChart({ months = 6, type = 'bar' }: RevenueChartProps) {
  const { getMonthlyRevenue } = useFinancialDashboard()
  const monthlyRevenueQuery = getMonthlyRevenue(months)

  const data = monthlyRevenueQuery.data || []

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Receita: <span className="font-medium text-foreground">
              {formatCurrency(payload[0].value)}
            </span>
          </p>
        </div>
      )
    }
    return null
  }

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)
  const averageRevenue = data.length > 0 ? totalRevenue / data.length : 0
  const currentMonth = data[data.length - 1]?.revenue || 0
  const previousMonth = data[data.length - 2]?.revenue || 0
  const growth = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {type === 'bar' ? <BarChart3 className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
          Receita Mensal
        </CardTitle>
        <CardDescription>
          Evolução da receita nos últimos {months} meses
        </CardDescription>
      </CardHeader>
      <CardContent>
        {monthlyRevenueQuery.isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        ) : data.length > 0 ? (
          <div className="space-y-4">
            {/* Estatísticas Resumidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total do Período</p>
                <p className="text-lg font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Média Mensal</p>
                <p className="text-lg font-bold">{formatCurrency(averageRevenue)}</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Crescimento</p>
                <p className={`text-lg font-bold ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Gráfico */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {type === 'bar' ? (
                  <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="revenue" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                      className="opacity-80 hover:opacity-100 transition-opacity"
                    />
                  </BarChart>
                ) : (
                  <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Detalhes por Mês */}
            <div className="mt-6">
              <h4 className="font-medium mb-3">Detalhes por Mês</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {data.map((item, index) => (
                  <div key={item.month} className="text-center p-2 border rounded">
                    <p className="text-xs text-muted-foreground">{item.month}</p>
                    <p className="text-sm font-medium">{formatCurrency(item.revenue)}</p>
                    {index > 0 && (
                      <p className={`text-xs ${
                        item.revenue >= data[index - 1].revenue 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {item.revenue >= data[index - 1].revenue ? '↗' : '↘'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Nenhum dado disponível</p>
              <p className="text-sm text-muted-foreground">
                Os dados aparecerão quando houver receita registrada
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}