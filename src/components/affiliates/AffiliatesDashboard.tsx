import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, TrendingUp, Clock } from "lucide-react";
import { useAffiliateStats } from "@/hooks/useAffiliate";
import type { Affiliate } from "@/hooks/useAffiliate";

interface AffiliatesDashboardProps {
  affiliate: Affiliate;
}

export function AffiliatesDashboard({ affiliate }: AffiliatesDashboardProps) {
  const { data: stats, isLoading } = useAffiliateStats(affiliate.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-comademig-blue"></div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Acumulado */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo Acumulado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-comademig-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-comademig-blue">
              {formatCurrency(stats?.totalCommissions || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de comissões geradas
            </p>
          </CardContent>
        </Card>

        {/* Indicações Ativas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Indicações Ativas
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeReferrals || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              De {stats?.totalReferrals || 0} indicações totais
            </p>
          </CardContent>
        </Card>

        {/* Comissões Pendentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendentes
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(stats?.pendingCommissions || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando processamento
            </p>
          </CardContent>
        </Card>

        {/* Comissões Pagas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pagas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats?.paidCommissions || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Já recebidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Informações do Afiliado */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Afiliado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome</p>
              <p className="text-base">{affiliate.display_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="flex items-center gap-2">
                {affiliate.status === 'active' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Ativo
                  </span>
                )}
                {affiliate.status === 'pending' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pendente
                  </span>
                )}
                {affiliate.status === 'suspended' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Suspenso
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Código de Indicação</p>
              <p className="text-base font-mono">{affiliate.referral_code}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Membro desde</p>
              <p className="text-base">
                {new Date(affiliate.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
