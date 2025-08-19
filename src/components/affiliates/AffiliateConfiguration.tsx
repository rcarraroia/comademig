
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAffiliate, type Affiliate } from '@/hooks/useAffiliate';

interface AffiliateConfigurationProps {
  affiliate: Affiliate;
}

export const AffiliateConfiguration = ({ affiliate: initialAffiliate }: AffiliateConfigurationProps) => {
  const [walletId, setWalletId] = useState(initialAffiliate.asaas_wallet_id);
  const [isEditing, setIsEditing] = useState(false);
  const { updateAffiliate, loading } = useAffiliate();

  const handleSave = async () => {
    try {
      await updateAffiliate({
        display_name: initialAffiliate.display_name,
        cpf_cnpj: initialAffiliate.cpf_cnpj,
        asaas_wallet_id: walletId,
        contact_email: initialAffiliate.contact_email,
        phone: initialAffiliate.phone
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const getStatusIcon = (status: string, isAdimplent: boolean) => {
    if (status === 'active' && isAdimplent) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (status === 'active' && !isAdimplent) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusText = (status: string, isAdimplent: boolean) => {
    if (status === 'active' && isAdimplent) return 'Ativo e Adimplente';
    if (status === 'active' && !isAdimplent) return 'Ativo mas Inadimplente';
    if (status === 'pending') return 'Aguardando Aprovação';
    return 'Suspenso';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração</CardTitle>
        <CardDescription>
          Configure seus dados de afiliado e acompanhe o status da sua conta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status da Conta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status da Conta</Label>
            <div className="flex items-center gap-2">
              {getStatusIcon(initialAffiliate.status, initialAffiliate.is_adimplent)}
              <Badge 
                variant={
                  initialAffiliate.status === 'active' && initialAffiliate.is_adimplent 
                    ? 'default' 
                    : initialAffiliate.status === 'pending' 
                      ? 'secondary' 
                      : 'destructive'
                }
              >
                {getStatusText(initialAffiliate.status, initialAffiliate.is_adimplent)}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data de Adesão</Label>
            <p className="text-sm text-muted-foreground">
              {new Date(initialAffiliate.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Wallet ID do Asaas */}
        <div className="space-y-2">
          <Label htmlFor="walletId">Wallet ID do Asaas</Label>
          <div className="flex gap-2">
            <Input
              id="walletId"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              disabled={!isEditing}
              placeholder="Insira seu Wallet ID do Asaas"
            />
            {!isEditing ? (
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(true)}
              >
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave}
                  disabled={loading}
                  size="sm"
                >
                  Salvar
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setWalletId(initialAffiliate.asaas_wallet_id);
                  }}
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Necessário para receber comissões. Encontre seu Wallet ID no painel do Asaas.
          </p>
        </div>

        {/* Informações Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome de Exibição</Label>
            <p className="text-sm">{initialAffiliate.display_name}</p>
          </div>

          <div className="space-y-2">
            <Label>CPF/CNPJ</Label>
            <p className="text-sm font-mono">{initialAffiliate.cpf_cnpj}</p>
          </div>

          <div className="space-y-2">
            <Label>Email de Contato</Label>
            <p className="text-sm">{initialAffiliate.contact_email}</p>
          </div>

          <div className="space-y-2">
            <Label>Telefone</Label>
            <p className="text-sm">{initialAffiliate.phone || 'Não informado'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
