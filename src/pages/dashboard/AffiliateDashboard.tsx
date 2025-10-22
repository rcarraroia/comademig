import React, { useState, useEffect } from 'react';
import { Users, DollarSign, TrendingUp, Wallet, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuthState } from '@/hooks/useAuthState';

interface AffiliateStatus {
  is_affiliate: boolean;
  status: string;
  referral_code?: string;
  wallet_validated: boolean;
  wallet_id?: string;
  is_adimplent: boolean;
  created_at?: string;
  validated_at?: string;
}

interface Commission {
  id: string;
  payment_id: string;
  referred_user_id: string;
  commission_rate: number;
  commission_amount: number;
  status: string;
  created_at: string;
  paid_at?: string;
}

interface CommissionSummary {
  total_commissions: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
}

export default function AffiliateDashboard() {
  const { user } = useAuthState();
  const [affiliateStatus, setAffiliateStatus] = useState<AffiliateStatus | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commissionSummary, setCommissionSummary] = useState<CommissionSummary | null>(null);
  const [walletId, setWalletId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingWallet, setIsUpdatingWallet] = useState(false);
  const [isEditingWallet, setIsEditingWallet] = useState(false);

  useEffect(() => {
    fetchAffiliateStatus();
    fetchCommissions();
  }, []);

  const fetchAffiliateStatus = async () => {
    try {
      const response = await fetch('/api/affiliate/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAffiliateStatus(data);
        if (data.wallet_id) {
          setWalletId(data.wallet_id);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar status:', error);
      toast.error('Erro ao carregar status do afiliado');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCommissions = async () => {
    try {
      const response = await fetch('/api/affiliate/commissions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCommissions(data.commissions || []);
        setCommissionSummary(data.summary);
      }
    } catch (error) {
      console.error('Erro ao buscar comissões:', error);
    }
  };

  const updateWallet = async () => {
    if (!walletId.trim()) {
      toast.error('Digite o ID da carteira');
      return;
    }

    setIsUpdatingWallet(true);

    try {
      const response = await fetch('/api/affiliate/wallet', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ wallet_id: walletId })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Carteira atualizada com sucesso!');
        setIsEditingWallet(false);
        await fetchAffiliateStatus();
      } else {
        toast.error(data.message || 'Erro ao atualizar carteira');
      }
    } catch (error) {
      console.error('Erro ao atualizar carteira:', error);
      toast.error('Erro ao atualizar carteira');
    } finally {
      setIsUpdatingWallet(false);
    }
  };

  const copyReferralCode = async () => {
    if (!affiliateStatus?.referral_code) return;

    try {
      await navigator.clipboard.writeText(affiliateStatus.referral_code);
      toast.success('Código copiado!');
    } catch (error) {
      toast.error('Erro ao copiar código');
    }
  };

  const copyReferralLink = async () => {
    if (!affiliateStatus?.referral_code) return;

    const link = `${window.location.origin}/filiacao?ref=${affiliateStatus.referral_code}`;

    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copiado!');
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="w-4 h-4 mr-1" />Ativo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inativo</Badge>;
      case 'pending':
        return <Badge variant="outline"><AlertCircle className="w-4 h-4 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCommissionStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Pago</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500">Aprovado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se não é afiliado, mostrar formulário de cadastro
  if (!affiliateStatus?.is_affiliate) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6" />
              Programa de Afiliados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Torne-se um Afiliado</h2>
              <p className="text-gray-600 mb-6">
                Ganhe comissões indicando novos membros para o COMADEMIG
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="wallet_id">ID da Carteira Asaas *</Label>
                <Input
                  id="wallet_id"
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  placeholder="Digite o ID da sua carteira no Asaas"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Você precisa ter uma carteira no Asaas para receber as comissões
                </p>
              </div>

              <Button
                onClick={updateWallet}
                disabled={isUpdatingWallet || !walletId.trim()}
                className="w-full"
              >
                {isUpdatingWallet ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Validando...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Cadastrar Carteira
                  </>
                )}
              </Button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Como funciona:</h3>
              <ul className="text-sm space-y-1">
                <li>• Ganhe 20% de comissão em cada indicação</li>
                <li>• Receba diretamente na sua carteira Asaas</li>
                <li>• Acompanhe suas comissões em tempo real</li>
                <li>• Sem limite de indicações</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard do Afiliado</h1>
          <p className="text-gray-600">Acompanhe suas indicações e comissões</p>
        </div>
        {getStatusBadge(affiliateStatus.status)}
      </div>

      {/* Status da Carteira */}
      {!affiliateStatus.wallet_validated && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800">Carteira Pendente</h3>
                <p className="text-yellow-700">
                  Sua carteira ainda não foi validada. Cadastre uma carteira válida para receber comissões.
                </p>
              </div>
              <Button variant="outline" onClick={() => setWalletId('')}>
                Atualizar Carteira
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Comissões</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {commissionSummary?.total_amount.toFixed(2) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {commissionSummary?.total_commissions || 0} indicações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Pagas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {commissionSummary?.paid_amount.toFixed(2) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Recebidas na carteira
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              R$ {commissionSummary?.pending_amount.toFixed(2) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Comissão</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">20%</div>
            <p className="text-xs text-muted-foreground">
              Por indicação convertida
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Código de Referência */}
      <Card>
        <CardHeader>
          <CardTitle>Seu Código de Referência</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Código</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={affiliateStatus.referral_code || ''}
                  readOnly
                  className="font-mono"
                />
                <Button variant="outline" size="sm" onClick={copyReferralCode}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label>Link de Indicação</Label>
            <div className="flex items-center gap-2">
              <Input
                value={`${window.location.origin}/filiacao?ref=${affiliateStatus.referral_code}`}
                readOnly
                className="text-sm"
              />
              <Button variant="outline" size="sm" onClick={copyReferralLink}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Como usar:</h4>
            <ul className="text-sm space-y-1">
              <li>• Compartilhe seu código ou link com veterinários e zootecnistas</li>
              <li>• Quando eles se filiarem usando seu código, você ganha 20% de comissão</li>
              <li>• As comissões são pagas automaticamente na sua carteira Asaas</li>
            </ul>
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
                    onClick={updateWallet}
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
                      setWalletId(affiliateStatus.wallet_id || '');
                      setIsEditingWallet(false);
                    }}
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Esta é a carteira onde você receberá suas comissões
            </p>
          </div>

          <div className="flex items-center gap-2">
            {affiliateStatus.wallet_validated ? (
              <Badge className="bg-green-500">
                <CheckCircle className="w-4 h-4 mr-1" />
                Carteira Validada
              </Badge>
            ) : (
              <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                <AlertCircle className="w-4 h-4 mr-1" />
                Aguardando Validação
              </Badge>
            )}
          </div>

          {!affiliateStatus.wallet_validated && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">Atenção:</h4>
              <p className="text-sm text-yellow-700">
                Sua carteira ainda não foi validada. Certifique-se de que o Wallet ID está correto para receber suas comissões.
              </p>
            </div>
          )}

          {affiliateStatus.wallet_validated && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">✓ Tudo pronto!</h4>
              <p className="text-sm text-green-700">
                Sua carteira está validada e você já pode receber comissões das suas indicações.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Comissões */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Nenhuma comissão ainda
              </h3>
              <p className="text-gray-500">
                Compartilhe seu código de referência para começar a ganhar comissões
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {commissions.map((commission) => (
                <div
                  key={commission.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">
                        R$ {commission.commission_amount.toFixed(2)}
                      </span>
                      {getCommissionStatusBadge(commission.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Comissão de {commission.commission_rate}% • Pagamento {commission.payment_id}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(commission.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {commission.paid_at && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">Pago</p>
                      <p className="text-xs text-gray-500">
                        {new Date(commission.paid_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}