
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  DollarSign, 
  Share2, 
  Copy, 
  TrendingUp, 
  Calendar, 
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { useAffiliate, type Affiliate, type Referral, type Transaction } from '@/hooks/useAffiliate';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

export const AffiliateDashboard = ({ affiliate: initialAffiliate }: { affiliate: Affiliate }) => {
  const [affiliate, setAffiliate] = useState<Affiliate>(initialAffiliate);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { getReferrals, getTransactions, generateReferralUrl, loading } = useAffiliate();
  const { toast } = useToast();

  const referralUrl = generateReferralUrl(affiliate.referral_code);

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

  const copyReferralUrl = () => {
    navigator.clipboard.writeText(referralUrl);
    toast({
      title: "Link copiado!",
      description: "O link de indicação foi copiado para a área de transferência.",
    });
  };

  const totalEarnings = transactions
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + t.affiliate_amount, 0);

  const pendingEarnings = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.affiliate_amount, 0);

  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800'
  };

  const statusLabel = {
    pending: 'Pendente',
    active: 'Ativo',
    suspended: 'Suspenso'
  };

  return (
    <div className="space-y-6">
      {/* Header com Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Programa de Afiliados</CardTitle>
              <CardDescription>
                Código: <span className="font-mono font-medium">{affiliate.referral_code}</span>
              </CardDescription>
            </div>
            <div className="text-right">
              <Badge className={statusColor[affiliate.status]}>
                {statusLabel[affiliate.status]}
              </Badge>
              {affiliate.is_adimplent ? (
                <p className="text-sm text-green-600 mt-1">✓ Adimplente</p>
              ) : (
                <p className="text-sm text-red-600 mt-1">⚠️ Inadimplente</p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Indicações</p>
                <p className="text-2xl font-bold">{referrals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Conversões</p>
                <p className="text-2xl font-bold">
                  {referrals.filter(r => r.status === 'paid').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Ganhos Totais</p>
                <p className="text-2xl font-bold">{formatCurrency(totalEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pendente</p>
                <p className="text-2xl font-bold">{formatCurrency(pendingEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="referral" className="space-y-4">
        <TabsList>
          <TabsTrigger value="referral">Link de Indicação</TabsTrigger>
          <TabsTrigger value="referrals">Indicações</TabsTrigger>
          <TabsTrigger value="earnings">Ganhos</TabsTrigger>
        </TabsList>

        <TabsContent value="referral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Seu Link de Indicação
              </CardTitle>
              <CardDescription>
                Compartilhe este link para indicar novos membros e ganhar comissão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={referralUrl}
                  readOnly
                  className="flex-1"
                />
                <Button onClick={copyReferralUrl} size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Quando alguém se filiar usando este link, você receberá automaticamente 20% do valor pago.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Indicações</CardTitle>
            </CardHeader>
            <CardContent>
              {referrals.length > 0 ? (
                <div className="space-y-4">
                  {referrals.map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{referral.referred_name}</p>
                        <p className="text-sm text-muted-foreground">{referral.referred_email}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(referral.amount)}</p>
                        <Badge variant={referral.status === 'paid' ? 'default' : 'secondary'}>
                          {referral.status === 'paid' ? 'Pago' : referral.status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma indicação ainda. Comece compartilhando seu link!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Ganhos</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          Comissão - {formatCurrency(transaction.total_amount)} (total)
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ID: {transaction.asaas_payment_id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          +{formatCurrency(transaction.affiliate_amount)}
                        </p>
                        <Badge variant={transaction.status === 'paid' ? 'default' : 'secondary'}>
                          {transaction.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma comissão ainda. Suas indicações pagas aparecerão aqui.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
