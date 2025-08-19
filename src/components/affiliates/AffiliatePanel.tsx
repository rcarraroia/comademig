
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AffiliateConfiguration } from './AffiliateConfiguration';
import { AffiliateReferralLink } from './AffiliateReferralLink';
import { AffiliateReferralsList } from './AffiliateReferralsList';
import { AffiliateEarnings } from './AffiliateEarnings';
import { AffiliateStats } from './AffiliateStats';
import { type Affiliate } from '@/hooks/useAffiliate';
import { Settings, Share2, Users, DollarSign, Trophy, MessageSquare, HelpCircle } from 'lucide-react';

interface AffiliatePanelProps {
  affiliate: Affiliate;
}

export const AffiliatePanel = ({ affiliate }: AffiliatePanelProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-comademig-blue">Painel de Afiliado</h1>
        <p className="text-muted-foreground">
          Gerencie suas indicações, acompanhe ganhos e maximize seus resultados
        </p>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configuração</span>
          </TabsTrigger>
          <TabsTrigger value="link" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Meu Link</span>
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Indicações</span>
          </TabsTrigger>
          <TabsTrigger value="earnings" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Ganhos</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Estatísticas</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Suporte</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <AffiliateConfiguration affiliate={affiliate} />
        </TabsContent>

        <TabsContent value="link" className="space-y-4">
          <AffiliateReferralLink referralCode={affiliate.referral_code} />
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <AffiliateReferralsList />
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          <AffiliateEarnings />
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <AffiliateStats />
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <div className="grid gap-6">
            {/* FAQ Rápido */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">FAQ - Programa de Afiliados</h3>
              
              <div className="space-y-3">
                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-muted p-4 font-medium">
                    Como funciona o Programa de Afiliados?
                  </summary>
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    Você ganha 20% de comissão sobre cada pessoa que se filiar usando seu link de indicação. 
                    O pagamento é automático via Asaas quando a pessoa efetua o pagamento da filiação.
                  </div>
                </details>

                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-muted p-4 font-medium">
                    Como configurar minha conta Asaas?
                  </summary>
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    Acesse o painel do Asaas, vá em Configurações → Split de Pagamentos → Carteiras e copie seu Wallet ID. 
                    Cole este ID na aba "Configuração" do seu painel de afiliado.
                  </div>
                </details>

                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-muted p-4 font-medium">
                    Quando recebo as comissões?
                  </summary>
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    As comissões são pagas automaticamente via Asaas no momento em que o indicado efetua o pagamento da filiação. 
                    O valor é creditado diretamente na sua conta Asaas.
                  </div>
                </details>

                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-muted p-4 font-medium">
                    Posso compartilhar meu link em redes sociais?
                  </summary>
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    Sim! Use os botões de compartilhamento direto para WhatsApp, Facebook e LinkedIn. 
                    Também pode usar o QR Code em eventos presenciais.
                  </div>
                </details>
              </div>
            </div>

            {/* Canal de Suporte */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Suporte Especializado</h3>
              </div>
              <p className="text-blue-800 mb-4">
                Precisa de ajuda com o Programa de Afiliados? Nossa equipe está pronta para te auxiliar!
              </p>
              <div className="space-y-2">
                <p className="text-sm text-blue-700">
                  <strong>WhatsApp:</strong> (31) 99999-9999
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Email:</strong> afiliados@comademig.org.br
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Horário:</strong> Segunda a Sexta, 8h às 18h
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
