import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, TrendingUp, Clock, Wallet, CheckCircle, AlertCircle } from "lucide-react";
import { useAffiliateStats } from "@/hooks/useAffiliate";
import type { Affiliate } from "@/hooks/useAffiliate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AffiliatesDashboardProps {
  affiliate: Affiliate;
}

export function AffiliatesDashboard({ affiliate }: AffiliatesDashboardProps) {
  const { data: stats, isLoading } = useAffiliateStats(affiliate.id);
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [walletId, setWalletId] = useState(affiliate.asaas_wallet_id || '');
  const [isUpdatingWallet, setIsUpdatingWallet] = useState(false);

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

  const handleUpdateWallet = async () => {
    if (!walletId.trim()) {
      toast.error('Digite o ID da carteira');
      return;
    }

    setIsUpdatingWallet(true);

    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ 
          asaas_wallet_id: walletId
        })
        .eq('id', affiliate.id);

      if (error) throw error;

      toast.success('Carteira atualizada com sucesso!');
      setIsEditingWallet(false);
      
      // Recarregar página para atualizar dados
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar carteira:', error);
      toast.error('Erro ao atualizar carteira');
    } finally {
      setIsUpdatingWallet(false);
    }
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

      {/* Carteira Asaas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Carteira Asaas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="wallet_display">Wallet ID Cadastrado</Label>
            <div className="flex items-center gap-2">
              <Input
                id="wallet_display"
                value={walletId || 'Não cadastrado'}
                onChange={(e) => setWalletId(e.target.value)}
                readOnly={!isEditingWallet}
                className={`font-mono ${!isEditingWallet ? 'bg-gray-50' : ''}`}
                placeholder="Digite o ID da sua carteira Asaas"
              />
              {!isEditingWallet ? (
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditingWallet(true)}
                >
                  Editar
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleUpdateWallet}
                    disabled={isUpdatingWallet || !walletId.trim()}
                  >
                    {isUpdatingWallet ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      'Salvar'
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setWalletId(affiliate.asaas_wallet_id || '');
                      setIsEditingWallet(false);
                    }}
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Esta é a carteira onde você receberá suas comissões
            </p>
          </div>

          <div className="flex items-center gap-2">
            {affiliate.asaas_wallet_id ? (
              <Badge className="bg-green-500">
                <CheckCircle className="w-4 h-4 mr-1" />
                Carteira Cadastrada
              </Badge>
            ) : (
              <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                <AlertCircle className="w-4 h-4 mr-1" />
                Carteira Não Cadastrada
              </Badge>
            )}
          </div>

          {!affiliate.asaas_wallet_id && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">Atenção:</h4>
              <p className="text-sm text-yellow-700">
                Você precisa cadastrar uma carteira Asaas para receber suas comissões.
              </p>
            </div>
          )}

          {affiliate.asaas_wallet_id && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">✓ Tudo pronto!</h4>
              <p className="text-sm text-green-700">
                Sua carteira está cadastrada e você já pode receber comissões das suas indicações.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
