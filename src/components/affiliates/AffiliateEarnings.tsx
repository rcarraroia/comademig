
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import { useAffiliate, type Transaction } from '@/hooks/useAffiliate';
import { formatCurrency } from '@/lib/utils';

export const AffiliateEarnings = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { getTransactions, loading } = useAffiliate();

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const data = await getTransactions();
    setTransactions(data);
  };

  const totalEarnings = transactions
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + (t.affiliate_amount || 0), 0);

  const pendingEarnings = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + (t.affiliate_amount || 0), 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyEarnings = transactions
    .filter(t => {
      const transactionDate = new Date(t.created_at);
      return t.status === 'paid' && 
             transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + (t.affiliate_amount || 0), 0);

  // Simulação de meta mensal (pode vir de configuração)
  const monthlyGoal = 1000;
  const progressPercentage = Math.min((monthlyEarnings / monthlyGoal) * 100, 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Meus Ganhos
        </CardTitle>
        <CardDescription>
          Dashboard financeiro com histórico completo de comissões
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Recebido</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(totalEarnings)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Este Mês</p>
                  <p className="text-2xl font-bold text-blue-700">{formatCurrency(monthlyEarnings)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendente</p>
                  <p className="text-2xl font-bold text-yellow-700">{formatCurrency(pendingEarnings)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progresso da Meta Mensal */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Meta Mensal</h4>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(monthlyEarnings)} / {formatCurrency(monthlyGoal)}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {progressPercentage >= 100 
                  ? '🎉 Parabéns! Meta mensal alcançada!' 
                  : `Faltam ${formatCurrency(monthlyGoal - monthlyEarnings)} para a meta`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Transações */}
        <div>
          <h4 className="font-medium mb-3">Histórico de Transações</h4>
          {transactions.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">
                        Comissão - {formatCurrency(transaction.total_amount || 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ID: {transaction.asaas_payment_id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      +{formatCurrency(transaction.affiliate_amount || 0)}
                    </p>
                    <Badge variant={transaction.status === 'paid' ? 'default' : 'secondary'}>
                      {transaction.status === 'paid' ? 'Pago via Asaas' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma comissão ainda. Suas indicações pagas aparecerão aqui.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
