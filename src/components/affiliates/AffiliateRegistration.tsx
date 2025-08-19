
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Wallet, Info, ExternalLink } from 'lucide-react';
import { useAffiliate } from '@/hooks/useAffiliate';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

export const AffiliateRegistration = ({ onSuccess }: { onSuccess: () => void }) => {
  const [walletId, setWalletId] = useState('');
  const { createAffiliate, loading } = useAffiliate();
  const { user, profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletId.trim()) {
      return;
    }

    try {
      await createAffiliate({
        display_name: profile?.nome_completo || '',
        cpf_cnpj: profile?.cpf || '',
        asaas_wallet_id: walletId,
        contact_email: user?.email || '',
        phone: profile?.telefone || ''
      });
      onSuccess();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Programa de Afiliados - COMADEMIG
        </CardTitle>
        <CardDescription>
          Ganhe 20% de comissão sobre cada indicação de novo membro
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Como funciona:</strong> Você receberá 20% do valor de cada filiação indicada por você. 
            O pagamento é automático via Asaas assim que o pagamento for confirmado.
          </AlertDescription>
        </Alert>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-3">💰 Seus Ganhos por Indicação</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-green-700">Filiação Comum (R$ 80,00)</span>
              <span className="font-bold text-green-900">R$ 16,00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-700">Filiação Especial (R$ 120,00)</span>
              <span className="font-bold text-green-900">R$ 24,00</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="walletId" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Wallet ID do Asaas *
              </Label>
              <Input
                id="walletId"
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                placeholder="f9c7d1dd-9e52-4e81-8194-8b666f276405"
                required
              />
              <p className="text-sm text-muted-foreground">
                ID da sua carteira no Asaas. Encontre em: Conta {'>'} Configurações {'>'} API/Integrações {'>'} Wallet ID
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">Não tem conta no Asaas?</h4>
                  <p className="text-sm text-blue-700">Crie sua conta gratuita agora</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://www.asaas.com/r/51a27e42-08b8-495b-acfd-5f1369c2e104', '_blank')}
                  className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Criar Conta
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !walletId.trim()}
          >
            {loading ? 'Cadastrando...' : '🎯 Quero Participar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
