
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ExternalLink, DollarSign, Users, TrendingUp, Shield } from 'lucide-react';
import { useAffiliate } from '@/hooks/useAffiliate';
import { useAuth } from '@/contexts/AuthContext';

interface AffiliateRegistrationProps {
  onSuccess: () => void;
}

export const AffiliateRegistration = ({ onSuccess }: AffiliateRegistrationProps) => {
  const [walletId, setWalletId] = useState('');
  const { createAffiliate, loading } = useAffiliate();
  const { profile, user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletId.trim()) {
      return;
    }

    // Validar dados obrigatórios do perfil
    if (!profile?.nome_completo || profile.nome_completo.trim() === '') {
      alert('Seu perfil precisa ter o nome completo preenchido. Por favor, complete seu perfil primeiro.');
      return;
    }

    if (!profile?.cpf || profile.cpf.trim() === '') {
      alert('Seu perfil precisa ter o CPF preenchido. Por favor, complete seu perfil primeiro.');
      return;
    }

    try {
      await createAffiliate({
        display_name: profile.nome_completo.trim(),
        cpf_cnpj: profile.cpf.trim(),
        asaas_wallet_id: walletId.trim(),
        contact_email: user?.email || '',
        phone: profile.telefone?.trim() || ''
      });
      
      // Aguardar um pouco e então chamar onSuccess para recarregar os dados
      setTimeout(() => {
        onSuccess();
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao criar afiliado:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-comademig-blue mb-2">
          Programa de Afiliados COMADEMIG
        </h1>
        <p className="text-muted-foreground">
          Indique novos membros e ganhe 20% de comissão sobre cada filiação
        </p>
      </div>

      {/* Benefícios do Programa */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="text-center">
          <CardContent className="p-4">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <h3 className="font-semibold mb-1">20% de Comissão</h3>
            <p className="text-sm text-muted-foreground">
              Ganhe R$ 20 por cada indicação de filiação aprovada
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-4">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-semibold mb-1">Pagamento Automático</h3>
            <p className="text-sm text-muted-foreground">
              Receba via Asaas no momento da aprovação
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-4">
            <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <h3 className="font-semibold mb-1">Indicações Ilimitadas</h3>
            <p className="text-sm text-muted-foreground">
              Sem limite de indicações ou ganhos mensais
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Como Funciona */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Como Funciona o Programa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-comademig-blue text-white rounded-full flex items-center justify-center text-sm font-semibold">
              1
            </div>
            <p className="text-sm">Cadastre-se no programa com sua Wallet ID do Asaas</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-comademig-blue text-white rounded-full flex items-center justify-center text-sm font-semibold">
              2
            </div>
            <p className="text-sm">Receba seu link personalizado de indicação</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-comademig-blue text-white rounded-full flex items-center justify-center text-sm font-semibold">
              3
            </div>
            <p className="text-sm">Compartilhe com pastores e líderes interessados</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-comademig-blue text-white rounded-full flex items-center justify-center text-sm font-semibold">
              4
            </div>
            <p className="text-sm">Ganhe R$ 20 automaticamente a cada filiação aprovada</p>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Cadastro */}
      <Card>
        <CardHeader>
          <CardTitle>Participar do Programa</CardTitle>
          <CardDescription>
            Para participar, você precisa ter uma conta no Asaas para receber as comissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Verificação de Dados do Perfil */}
            {(!profile?.nome_completo || !profile?.cpf) && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Perfil Incompleto</h4>
                <p className="text-yellow-700 text-sm mb-2">
                  Para se tornar um afiliado, você precisa completar seu perfil com:
                </p>
                <ul className="text-yellow-700 text-sm space-y-1">
                  {!profile?.nome_completo && <li>• Nome completo</li>}
                  {!profile?.cpf && <li>• CPF</li>}
                </ul>
                <p className="text-yellow-700 text-sm mt-2">
                  <strong>Complete seu perfil primeiro em "Meus Dados"</strong>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="walletId">Wallet ID do Asaas *</Label>
              <Input
                id="walletId"
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                placeholder="Digite seu Wallet ID (ex: wal_123456789)"
                required
                minLength={10}
              />
              <p className="text-xs text-muted-foreground">
                ID da sua carteira no Asaas. Encontre em: Conta → Configurações → API/Integrações → Wallet ID
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={
                  loading || 
                  !walletId.trim() || 
                  walletId.trim().length < 10 ||
                  !profile?.nome_completo || 
                  !profile?.cpf
                }
              >
                {loading ? 'Processando...' : 'Quero Participar'}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => window.open('https://www.asaas.com/r/51a27e42-08b8-495b-acfd-5f1369c2e104', '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Criar Conta Asaas
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Termos e Condições */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground text-center">
            Ao participar do programa, você concorda em seguir as diretrizes da COMADEMIG. 
            As comissões são pagas automaticamente via Asaas mediante confirmação do pagamento da filiação.
            Indicações de membros já filiados não geram comissão.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
