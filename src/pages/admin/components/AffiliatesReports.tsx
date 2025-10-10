import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, Target } from "lucide-react";

export function AffiliatesReports() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['affiliates-reports'],
    queryFn: async () => {
      const [affiliatesRes, referralsRes, commissionsRes] = await Promise.all([
        supabase.from('affiliates').select('id, status'),
        supabase.from('affiliate_referrals').select('id, status, conversion_value'),
        supabase.from('affiliate_commissions').select('id, amount, status'),
      ]);

      const affiliates = affiliatesRes.data || [];
      const referrals = referralsRes.data || [];
      const commissions = commissionsRes.data || [];

      return {
        totalAffiliates: affiliates.length,
        activeAffiliates: affiliates.filter(a => a.status === 'active').length,
        totalReferrals: referrals.length,
        convertedReferrals: referrals.filter(r => r.status === 'converted').length,
        conversionRate: referrals.length > 0 
          ? ((referrals.filter(r => r.status === 'converted').length / referrals.length) * 100).toFixed(1)
          : '0',
        totalRevenue: referrals.reduce((sum, r) => sum + (r.conversion_value || 0), 0),
        totalCommissions: commissions.reduce((sum, c) => sum + c.amount, 0),
        paidCommissions: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0),
      };
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-comademig-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Afiliados Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeAffiliates}</div>
            <p className="text-xs text-muted-foreground">de {stats?.totalAffiliates} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.convertedReferrals} de {stats?.totalReferrals} indicações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Gerada</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">por indicações convertidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Pagas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.paidCommissions || 0)}</div>
            <p className="text-xs text-muted-foreground">
              de {formatCurrency(stats?.totalCommissions || 0)} total
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visão Geral do Programa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Afiliados Mais Ativos</p>
                <p className="text-sm text-muted-foreground">Top performers do programa</p>
              </div>
              <p className="text-2xl font-bold text-comademig-blue">Em breve</p>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Volume Financeiro</p>
                <p className="text-sm text-muted-foreground">Total movimentado no período</p>
              </div>
              <p className="text-2xl font-bold text-comademig-blue">{formatCurrency(stats?.totalRevenue || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
