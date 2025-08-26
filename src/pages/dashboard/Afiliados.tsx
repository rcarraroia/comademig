
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AffiliateRegistration } from '@/components/affiliates/AffiliateRegistration';
import { AffiliatePanel } from '@/components/affiliates/AffiliatePanel';
import { useAffiliate, type Affiliate } from '@/hooks/useAffiliate';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Users, DollarSign, TrendingUp, Share2, Gift, Target, Award } from 'lucide-react';

export default function Afiliados() {
  const { user, profile } = useAuth();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalCommission: 0,
    pendingCommission: 0,
    conversionRate: 0
  });
  const { getAffiliate } = useAffiliate();

  useEffect(() => {
    loadAffiliate();
    loadStats();
  }, []);

  const loadAffiliate = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const affiliateData = await getAffiliate();
      setAffiliate(affiliateData);
    } catch (error) {
      console.error('Erro ao carregar afiliado:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    // Simular dados de estatísticas (implementar com Supabase depois)
    setStats({
      totalReferrals: 12,
      activeReferrals: 8,
      totalCommission: 2450.00,
      pendingCommission: 380.00,
      conversionRate: 66.7
    });
  };

  const handleRegistrationSuccess = () => {
    loadAffiliate();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  // Verificar se usuário está ativo e adimplente
  const canParticipate = profile?.status === 'ativo';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Programa de Afiliados</h1>
          <p className="text-muted-foreground">Ganhe comissões indicando novos membros</p>
        </div>
        {affiliate && (
          <Badge variant="secondary" className="text-sm">
            <Award className="w-4 h-4 mr-1" />
            Afiliado Ativo
          </Badge>
        )}
      </div>

      {!canParticipate && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Para participar do Programa de Afiliados, você precisa estar com a filiação ativa e em dia com suas obrigações.
          </AlertDescription>
        </Alert>
      )}

      {canParticipate && (
        <>
          {affiliate ? (
            <Tabs defaultValue="dashboard" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="referrals">Indicações</TabsTrigger>
                <TabsTrigger value="commissions">Comissões</TabsTrigger>
                <TabsTrigger value="tools">Ferramentas</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6">
                {/* Estatísticas Principais */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Indicações</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalReferrals}</div>
                      <p className="text-xs text-muted-foreground">
                        +2 desde o mês passado
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Indicações Ativas</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.activeReferrals}</div>
                      <p className="text-xs text-muted-foreground">
                        {((stats.activeReferrals / stats.totalReferrals) * 100).toFixed(1)}% de conversão
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Comissões Totais</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">R$ {stats.totalCommission.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">
                        +R$ 450,00 este mês
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pendente</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">R$ {stats.pendingCommission.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">
                        Próximo pagamento em 15 dias
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Link de Indicação */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="h-5 w-5" />
                      Seu Link de Indicação
                    </CardTitle>
                    <CardDescription>
                      Compartilhe este link para ganhar comissões
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm">
                        https://comademig.org.br/cadastro?ref={affiliate.code}
                      </div>
                      <Button onClick={() => navigator.clipboard.writeText(`https://comademig.org.br/cadastro?ref=${affiliate.code}`)}>
                        Copiar
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4 mr-2" />
                        Redes Sociais
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Programa de Benefícios */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5" />
                      Programa de Benefícios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">15%</div>
                        <div className="text-sm text-muted-foreground">Comissão por indicação</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">5%</div>
                        <div className="text-sm text-muted-foreground">Comissão recorrente</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">Bônus</div>
                        <div className="text-sm text-muted-foreground">Por metas atingidas</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="referrals">
                <Card>
                  <CardHeader>
                    <CardTitle>Suas Indicações</CardTitle>
                    <CardDescription>
                      Acompanhe o status de todas as suas indicações
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      Lista de indicações será implementada aqui
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="commissions">
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Comissões</CardTitle>
                    <CardDescription>
                      Acompanhe seus ganhos e pagamentos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      Histórico de comissões será implementado aqui
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tools">
                <Card>
                  <CardHeader>
                    <CardTitle>Ferramentas de Marketing</CardTitle>
                    <CardDescription>
                      Materiais para ajudar nas suas indicações
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      Ferramentas de marketing serão implementadas aqui
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <AffiliateRegistration onSuccess={handleRegistrationSuccess} />
          )}
        </>
      )}
    </div>
  );
}
