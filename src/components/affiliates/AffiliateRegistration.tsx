
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { UserPlus, Wallet, Info } from 'lucide-react';
import { useAffiliate, type AffiliateData } from '@/hooks/useAffiliate';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const AffiliateRegistration = ({ onSuccess }: { onSuccess: () => void }) => {
  const [formData, setFormData] = useState<AffiliateData>({
    display_name: '',
    cpf_cnpj: '',
    asaas_wallet_id: '',
    contact_email: '',
    phone: ''
  });

  const { createAffiliate, loading } = useAffiliate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAffiliate(formData);
      onSuccess();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleChange = (field: keyof AffiliateData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Programa de Afiliados - COMADEMIG
        </CardTitle>
        <CardDescription>
          Cadastre-se como afiliado e ganhe 20% de comissão sobre cada indicação de novo membro
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Como funciona:</strong> Você receberá 20% do valor de cada filiação indicada por você. 
            O pagamento é automático via split no Asaas assim que o pagamento for confirmado.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Nome Completo *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => handleChange('display_name', e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf_cnpj">CPF/CNPJ *</Label>
              <Input
                id="cpf_cnpj"
                value={formData.cpf_cnpj}
                onChange={(e) => handleChange('cpf_cnpj', e.target.value)}
                placeholder="000.000.000-00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="asaas_wallet_id" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Wallet ID do Asaas *
            </Label>
            <Input
              id="asaas_wallet_id"
              value={formData.asaas_wallet_id}
              onChange={(e) => handleChange('asaas_wallet_id', e.target.value)}
              placeholder="f9c7d1dd-9e52-4e81-8194-8b666f276405"
              required
            />
            <p className="text-sm text-muted-foreground">
              ID da sua carteira no Asaas. Encontre em: Conta {'>'} Configurações {'>'} API/Integrações {'>'} Wallet ID
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Email de Contato</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Divisão das comissões:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>40%</strong> - Convenção COMADEMIG</li>
              <li>• <strong>40%</strong> - Plataforma Renum</li>
              <li>• <strong>20%</strong> - Você (Afiliado)</li>
            </ul>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar como Afiliado'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
