import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, QrCode, Clock } from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface PixPaymentDisplayProps {
  qrCode: string;
  qrCodeUrl?: string;
  copiaCola: string;
  valor: number;
  aguardandoConfirmacao?: boolean;
  onConfirmado?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PixPaymentDisplay({
  qrCode,
  qrCodeUrl,
  copiaCola,
  valor,
  aguardandoConfirmacao = false,
  onConfirmado,
}: PixPaymentDisplayProps) {
  const [copiado, setCopiado] = useState(false);

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(copiaCola);
      setCopiado(true);
      toast.success('Código PIX copiado!');
      
      setTimeout(() => {
        setCopiado(false);
      }, 3000);
    } catch (error) {
      toast.error('Erro ao copiar código');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Pagamento via PIX
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Valor */}
          <div className="text-center py-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Valor a pagar</p>
            <p className="text-3xl font-bold text-primary">
              R$ {valor.toFixed(2)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              ✓ Desconto de 5% já aplicado
            </p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white rounded-lg border-2 border-primary">
              {qrCodeUrl ? (
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code PIX" 
                  className="w-64 h-64"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-muted">
                  <QrCode className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>

            <p className="text-sm text-center text-muted-foreground max-w-md">
              Abra o app do seu banco, escaneie o QR Code acima ou copie o código abaixo
            </p>
          </div>

          {/* Código Copia e Cola */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Código PIX (Copia e Cola)</label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-xs break-all">
                {copiaCola}
              </div>
              <Button
                onClick={handleCopiar}
                variant={copiado ? 'default' : 'outline'}
                size="icon"
                className="shrink-0"
              >
                {copiado ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Status de Aguardando */}
          {aguardandoConfirmacao && (
            <div className="flex items-center justify-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600 animate-pulse" />
              <div>
                <p className="font-medium text-yellow-900">
                  Aguardando confirmação do pagamento
                </p>
                <p className="text-sm text-yellow-700">
                  Isso pode levar alguns segundos...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como pagar com PIX</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                1
              </span>
              <span>
                Abra o aplicativo do seu banco e escolha a opção <strong>Pagar com PIX</strong>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                2
              </span>
              <span>
                Escaneie o <strong>QR Code</strong> acima ou copie o <strong>código PIX</strong>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                3
              </span>
              <span>
                Confirme o pagamento no app do seu banco
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                4
              </span>
              <span>
                Pronto! Você receberá a confirmação em alguns segundos
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Informações Importantes */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-blue-900">
            <p className="font-medium">ℹ️ Informações importantes:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>O pagamento é processado instantaneamente</li>
              <li>Você receberá um email de confirmação</li>
              <li>O QR Code expira em 30 minutos</li>
              <li>Não feche esta página até confirmar o pagamento</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
