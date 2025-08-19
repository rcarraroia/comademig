
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Download, RefreshCw, QrCode } from 'lucide-react';
import { UserAvatar } from '@/components/common/UserAvatar';
import { QRCodeDisplay } from './QRCodeDisplay';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CarteiraDigitalCardProps {
  carteira: {
    id: string;
    numero_carteira: string;
    qr_code: string;
    data_emissao: string;
    data_validade: string;
    status: string;
    foto_url?: string;
  };
  onRenovar: () => void;
  onDownload: () => void;
  renovandoCarteira: boolean;
}

export const CarteiraDigitalCard = ({ 
  carteira, 
  onRenovar, 
  onDownload,
  renovandoCarteira 
}: CarteiraDigitalCardProps) => {
  const { profile } = useAuth();

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const isExpired = () => {
    return new Date(carteira.data_validade) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Carteira Digital Visual */}
      <Card className="bg-gradient-to-br from-comademig-blue to-comademig-gold text-white overflow-hidden relative">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-white text-xl mb-1">COMADEMIG</CardTitle>
              <p className="text-blue-100 text-sm">Carteira Digital Eclesiástica</p>
            </div>
            <Badge 
              variant={carteira.status === 'ativa' ? 'default' : 'destructive'}
              className="bg-white/20 text-white border-white/30"
            >
              {carteira.status === 'ativa' ? 'Ativa' : 'Inválida'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-start gap-4 mb-6">
            <UserAvatar size="lg" className="border-2 border-white/30" />
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-white mb-1 truncate">
                {profile?.nome_completo}
              </h3>
              <p className="text-blue-100 text-sm mb-1">{profile?.cargo || 'Membro'}</p>
              <p className="text-blue-100 text-sm">{profile?.igreja}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-100 mb-1">Número da Carteira</p>
              <p className="font-mono text-white font-semibold">
                {carteira.numero_carteira}
              </p>
            </div>
            <div>
              <p className="text-blue-100 mb-1">Válida até</p>
              <p className="font-semibold text-white">
                {formatDate(carteira.data_validade)}
              </p>
            </div>
          </div>

          {/* QR Code */}
          <div className="mt-6 flex justify-center">
            <div className="bg-white p-3 rounded-lg">
              <QRCodeDisplay 
                value={carteira.qr_code} 
                size={120}
                className="rounded"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={onDownload}
          className="bg-comademig-blue hover:bg-comademig-blue/90"
        >
          <Download className="mr-2 h-4 w-4" />
          Baixar PDF
        </Button>

        <Button
          onClick={onRenovar}
          disabled={renovandoCarteira || !isExpired()}
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${renovandoCarteira ? 'animate-spin' : ''}`} />
          {renovandoCarteira ? 'Renovando...' : 'Renovar'}
        </Button>

        <Button
          onClick={() => {
            const qrWindow = window.open('', '_blank');
            if (qrWindow) {
              qrWindow.document.write(`
                <html>
                  <head><title>QR Code - Carteira Digital</title></head>
                  <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
                    <div style="text-align: center;">
                      <h2>QR Code - Carteira Digital</h2>
                      <img src="data:image/svg+xml;base64,${btoa(document.querySelector('[data-qr-code]')?.innerHTML || '')}" style="max-width: 300px;" />
                      <p>${carteira.numero_carteira}</p>
                    </div>
                  </body>
                </html>
              `);
            }
          }}
          variant="outline"
        >
          <QrCode className="mr-2 h-4 w-4" />
          Ver QR Code
        </Button>
      </div>

      {/* Info */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Informações da Carteira
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Emitida em: {formatDate(carteira.data_emissao)}
              </p>
              <p className="text-sm text-blue-700">
                Status: {carteira.status === 'ativa' ? 'Ativa e válida' : 'Inválida ou expirada'}
              </p>
              {isExpired() && (
                <p className="text-sm text-red-600 font-medium mt-1">
                  ⚠️ Carteira expirada - renove para manter a validade
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
