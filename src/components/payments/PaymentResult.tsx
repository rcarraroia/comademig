import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/compone
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, QrCode, CreditCard, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentResultProps {
  cobranca: any;
  onClose?: () => void;
}

export const PaymentResult = ({ cobranca, onClose }: PaymentResultProps) => {
  const [showQRCode, setShowQRCode] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: message,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      'PENDING': { label: 'Pendente', variant: 'outline' },
      'CONFIRMED': { label: 'Confirmado', variant: 'default' },
      'RECEIVED': { label: 'Pago', variant: 'success' },
      'OVERDUE': { label: 'Vencido', variant: 'destructive' }
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getBillingTypeIcon = (type: string) => {
    switch (type) {
      case 'PIX': return <QrCode className="h-4 w-4" />;
      case 'CREDIT_CARD': return <CreditCard className="h-4 w-4" />;
      case 'BOLETO': return <FileText className="h-4 w-4" />;
      default: return null;
    }
  };

  const getBillingTypeName = (type: string) => {
    switch (type) {
      case 'PIX': return 'PIX';
      case 'CREDIT_CARD': return 'Cartão de Crédito';
      case 'BOLETO': return 'Boleto Bancário';
      default: return type;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Cobrança Gerada</span>
          {getStatusBadge(cobranca.status)}
        </CardTitle>
        <CardDescription>
          Sua cobrança foi gerada com sucesso. Use as opções abaixo para realizar o pagamento.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumo da Cobrança */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Descrição:</span>
            <span>{cobranca.descricao}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Valor:</span>
            <span className="text-lg font-bold text-green-600">
              R$ {parseFloat(cobranca.valor).toFixed(2).replace('.', ',')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Vencimento:</span>
            <span>{new Date(cobranca.data_vencimento).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Forma de Pagamento:</span>
            <div className="flex items-center gap-2">
              {getBillingTypeIcon(cobranca.forma_pagamento)}
              <span>{getBillingTypeName(cobranca.forma_pagamento)}</span>
            </div>
          </div>
        </div>

        {/* PIX */}
        {cobranca.forma_pagamento === 'PIX' && cobranca.qr_code_pix && (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              PIX - Pagamento Instantâneo
            </h3>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700 mb-3">
                Escaneie o QR Code com o app do seu banco ou copie o código PIX
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={() => setShowQRCode(!showQRCode)}
                  variant="outline"
                  className="w-full"
                >
                  {showQRCode ? 'Ocultar' : 'Mostrar'} QR Code
                </Button>
                
                {showQRCode && (
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img 
                      src={`data:image/svg+xml;base64,${btoa(cobranca.qr_code_pix)}`}
                      alt="QR Code PIX"
                      className="w-48 h-48"
                    />
                  </div>
                )}
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cobranca.qr_code_pix}
                    readOnly
                    className="flex-1 p-2 border rounded text-xs bg-gray-50"
                  />
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(cobranca.qr_code_pix, 'Código PIX copiado!')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Boleto */}
        {cobranca.forma_pagamento === 'BOLETO' && cobranca.linha_digitavel && (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Boleto Bancário
            </h3>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-700 mb-3">
                Pague em qualquer banco, lotérica ou internet banking
              </p>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cobranca.linha_digitavel}
                    readOnly
                    className="flex-1 p-2 border rounded text-xs bg-gray-50"
                  />
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(cobranca.linha_digitavel, 'Linha digitável copiada!')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                {cobranca.url_pagamento && (
                  <Button
                    onClick={() => window.open(cobranca.url_pagamento, '_blank')}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Boleto PDF
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cartão de Crédito */}
        {cobranca.forma_pagamento === 'CREDIT_CARD' && cobranca.url_pagamento && (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Cartão de Crédito
            </h3>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700 mb-3">
                Clique no botão abaixo para pagar com cartão de crédito
              </p>
              
              <Button
                onClick={() => window.open(cobranca.url_pagamento, '_blank')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pagar com Cartão
              </Button>
            </div>
          </div>
        )}

        {/* Informações Adicionais */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">Informações Importantes</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Após o pagamento, a confirmação pode levar alguns minutos</li>
            <li>• Guarde este comprovante para seus controles</li>
            <li>• Em caso de dúvidas, entre em contato conosco</li>
          </ul>
        </div>

        {onClose && (
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Fechar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
