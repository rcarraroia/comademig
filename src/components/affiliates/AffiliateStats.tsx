
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Users, TrendingUp, Award, Star } from 'lucide-react';
import { useAffiliate, type Referral, type Transaction } from '@/hooks/useAffiliate';

export const AffiliateStats = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { getReferrals, getTransactions } = useAffiliate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [referralsData, transactionsData] = await Promise.all([
      getReferrals(),
      getTransactions()
    ]);
    setReferrals(referralsData);
    setTransactions(transactionsData);
  };

  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter(r => r.status === 'paid').length;
  const pendingReferrals = referrals.filter(r => r.status === 'pending').length;
  const totalEarnings = transactions
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + (t.affiliate_amount || 0), 0);

  // Gamificação - Níveis baseados no total de indicações ativas
  const getBadgeInfo = (activeCount: number) => {
    if (activeCount >= 50) return { level: 'Diamante', color: 'from-purple-500 to-pink-500', icon: Star };
    if (activeCount >= 25) return { level: 'Ouro', color: 'from-yellow-400 to-yellow-600', icon: Trophy };
    if (activeCount >= 10) return { level: 'Prata', color: 'from-gray-400 to-gray-600', icon: Award };
    if (activeCount >= 5) return { level: 'Bronze', color: 'from-amber-600 to-amber-800', icon: Target };
    return { level: 'Iniciante', color: 'from-blue-500 to-blue-600', icon: Users };
  };

  const badge = getBadgeInfo(activeReferrals);
  const BadgeIcon = badge.icon;

  // Ranking simulado (pode ser implementado com dados reais do backend)
  const getRankingMessage = (earnings: number) => {
    if (earnings >= 5000) return "🏆 Você está no Top 1% dos afiliados!";
    if (earnings >= 2000) return "🥈 Você está no Top 5% dos afiliados!";
    if (earnings >= 1000) return "🥉 Você está no Top 10% dos afiliados!";
    if (earnings >= 500) return "📈 Você está no Top 25% dos afiliados!";
    return "💪 Continue crescendo! Você tem potencial!";
  };

  // Progress para próximo nível
  const getNextLevelProgress = (activeCount: number) => {
    if (activeCount >= 50) return { current: 50, target: 50, percentage: 100 };
    if (activeCount >= 25) return { current: activeCount, target: 50, percentage: (activeCount / 50) * 100 };
    if (activeCount >= 10) return { current: activeCount, target: 25, percentage: (activeCount / 25) * 100 };
    if (activeCount >= 5) return { current: activeCount, target: 10, percentage: (activeCount / 10) * 100 };
    return { current: activeCount, target: 5, percentage: (activeCount / 5) * 100 };
  };

  const nextLevel = getNextLevelProgress(activeReferrals);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Estatísticas Pessoais
        </CardTitle>
        <CardDescription>
          Acompanhe seu desempenho e conquiste novos níveis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Badge Atual */}
        <Card className={`bg-gradient-to-r ${badge.color} text-white`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-full">
                <BadgeIcon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Nível {badge.level}</h3>
                <p className="text-white/90">
                  {activeReferrals} indicações ativas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progresso para próximo nível */}
        {nextLevel.percentage < 100 && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Progresso para próximo nível</h4>
                  <span className="text-sm text-muted-foreground">
                    {nextLevel.current} / {nextLevel.target}
                  </span>
                </div>
                <Progress value={nextLevel.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Faltam {nextLevel.target - nextLevel.current} indicações ativas
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{totalReferrals}</p>
              <p className="text-sm text-muted-foreground">Total de Indicações</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{activeReferrals}</p>
              <p className="text-sm text-muted-foreground">Indicações Ativas</p>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown de Status */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Breakdown por Status</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Ativas</span>
                <Badge variant="default">{activeReferrals}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Pendentes</span>
                <Badge variant="secondary">{pendingReferrals}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Taxa de Conversão</span>
                <Badge variant="outline">
                  {totalReferrals > 0 ? Math.round((activeReferrals / totalReferrals) * 100) : 0}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ranking */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-4">
            <div className="text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-amber-600" />
              <p className="font-medium text-amber-800">
                {getRankingMessage(totalEarnings)}
              </p>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};
