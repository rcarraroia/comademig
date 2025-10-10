import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, Info } from "lucide-react";

export function AffiliatesSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do Programa
          </CardTitle>
          <CardDescription>
            Configure percentuais, regras e bonificações do programa de afiliados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Configurações Atuais</p>
                <p className="text-sm text-blue-800 mt-1">
                  As configurações de split de pagamentos são gerenciadas na página de Split Management (apenas super admin).
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Percentual de Comissão Padrão</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Percentual aplicado para indicações de filiação
              </p>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold text-comademig-blue">20%</div>
                <span className="text-sm text-muted-foreground">do valor da filiação</span>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Regras de Elegibilidade</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Afiliado deve estar com status "Ativo"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Afiliado deve ter Wallet ID do Asaas configurado</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Indicado deve completar o primeiro pagamento</span>
                </li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Bonificações Extras</h3>
              <p className="text-sm text-muted-foreground">
                Bonificações por metas atingidas podem ser configuradas futuramente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
