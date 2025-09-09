import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Download, Share2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SimpleQRCode from "./SimpleQRCode";
import { generateQRCode } from "@/utils/qrCodeUtils";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeUrl: string;
  numeroCarteira: string;
}

export const QRCodeModal = ({ isOpen, onClose, qrCodeUrl, numeroCarteira }: QRCodeModalProps) => {
  const { toast } = useToast();

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeUrl);
      toast({
        title: "URL copiada",
        description: "Link de validação copiado para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar a URL",
        variant: "destructive",
      });
    }
  };

  const handleDownloadQR = async () => {
    try {
      const qrCodeDataUrl = await generateQRCode(qrCodeUrl);
      
      // Criar link para download
      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      link.download = `qrcode-carteira-${numeroCarteira}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "QR Code baixado",
        description: "QR Code salvo com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível baixar o QR Code",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Validação de Carteira Digital COMADEMIG',
          text: `Carteira ${numeroCarteira} - Validação`,
          url: qrCodeUrl,
        });
      } catch (error) {
        console.log('Compartilhamento cancelado ou erro:', error);
      }
    } else {
      // Fallback para copiar URL
      handleCopyUrl();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>QR Code da Carteira</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* QR Code ampliado */}
          <div className="flex justify-center">
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <SimpleQRCode 
                value={qrCodeUrl} 
                size={200}
                className="rounded"
              />
            </div>
          </div>

          {/* Informações */}
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-gray-900">
              Carteira Nº {numeroCarteira}
            </p>
            <p className="text-xs text-gray-600">
              Escaneie este QR Code para validar a autenticidade da carteira
            </p>
          </div>

          {/* URL de validação */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              URL de Validação:
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={qrCodeUrl}
                readOnly
                className="flex-1 text-xs bg-gray-50 border rounded px-3 py-2 font-mono"
              />
              <Button size="sm" variant="outline" onClick={handleCopyUrl}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Ações */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleDownloadQR} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Baixar QR Code
            </Button>
            <Button onClick={handleShare} variant="outline" className="w-full">
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>

          {/* Instruções */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Como usar este QR Code:
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Abra a câmera do seu celular ou um leitor de QR Code</li>
              <li>• Aponte para o código acima</li>
              <li>• Toque no link que aparecer na tela</li>
              <li>• A página de validação será aberta automaticamente</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};