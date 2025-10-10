import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Calendar, 
  TrendingUp,
  Users,
  DollarSign,
  ArrowLeft
} from "lucide-react";

interface AffiliateDetailProps {
  affiliateId: string;
  onBack: () => void;
}

export function AffiliateDetail({ affiliateId, onBack }: AffiliateDetailProps) {
  // Buscar dados do afiliado
  const { data: affiliate, isLoading } = useQuery({
    queryKey: ['affiliate-detail', affiliateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliates')
        .select(`
          *,
          user:profiles!affiliates_user_id_fkey(
            id,
            nome_completo
          )
        `)
        .eq('id', affiliateId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ['affiliate-stats', affiliateId],
    queryFn: async () => {
      // Buscar indicações
      const { data: referrals } = await supabase
        .from('affiliate_referrals')
        .select('status, conversion_value')
        .eq('affiliate_id', affiliateId);

      // Buscar comissões
      const { data: commissions } = await supabase
        .from('affiliate_commissions')
        .select('amount, status')
        .eq('affiliate_id', affiliateId);

      return {
        totalReferrals: referrals?.length || 0,
        convertedReferrals: referrals?.filter(r => r.status === 'converted').length || 0,
        totalCommissions: commissions?.reduce((sum, c) => sum + c.amount, 0) || 0,
        pendingCommissions: commissions?.filter(c => c.status === 'pending')
          .reduce((sum, c) => sum + c.amount, 0) || 0,
        paidCommissions: commissions?.filter(c => c.status === 'paid')
          .reduce((sum, c) => sum + c.amount, 0) || 0,
      };
    },
    enabled: !!affiliateId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-comademig-blue"></div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Afiliado não encontrado</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      active: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
      suspended: { label: 'Suspenso', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const maskWalletId = (walletId: string) => {
    if (!walletId) return '-';
    // Mostrar apenas os últimos 4 caracteres
    return `****${walletId.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header com botão voltar */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{affiliate.display_name}</h2>
          <p className="text-muted-foreground">Detalhes do afiliado</p>
        </div>
        {getStatusBadge(affiliate.status)}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Indicações</p>
                <p className="text-2xl font-bold">{stats?.totalReferrals || 0}</p>
              </div>
              <Users className="h-8 w-8 text-comademig-blue opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Convertidas</p>
                <p className="text-2xl font-bold text-green-600">{stats?.convertedReferrals || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Comissões</p>
                <p className="text-xl font-bold text-comademig-blue">
                  {formatCurrency(stats?.totalCommissions || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-comademig-blue opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-xl font-bold text-yellow-600">
                  {formatCurrency(stats?.pendingCommissions || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dados Cadastrais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Cadastrais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                  <p className="text-base">{affiliate.user?.nome_completo || affiliate.display_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{affiliate.contact_email || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                  <p className="text-base">{affiliate.phone || '-'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CPF/CNPJ</p>
                  <p className="text-base font-mono">{affiliate.cpf_cnpj || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Wallet ID (Asaas)</p>
                  <p className="text-base font-mono">{maskWalletId(affiliate.asaas_wallet_id)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
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
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Código de Indicação</p>
            <div className="flex items-center gap-2">
              <code className="px-3 py-2 bg-muted rounded-md font-mono text-lg">
                {affiliate.referral_code}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(affiliate.referral_code);
                }}
              >
                Copiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Atividades */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Atividades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground">
                Cadastro criado em {new Date(affiliate.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
            {affiliate.updated_at !== affiliate.created_at && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-muted-foreground">
                  Última atualização em {new Date(affiliate.updated_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
