
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Download, Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRCodeDisplayProps {
  qrCodeUrl: string;
  numeroCarteira: string;
  onClose: () => void;
}

const QRCodeDisplay = ({ qrCodeUrl, numeroCarteira, onClose }: QRCodeDisplayProps) => {
  const { toast } = useToast();

  const copyUrl = async () => {
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

  const shareCard = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Carteira Digital COMADEMIG - ${numeroCarteira}`,
          text: `Validar carteira digital da COMADEMIG`,
          url: qrCodeUrl,
        });
      } catch (error) {
        console.log('Erro ao compartilhar:', error);
      }
    } else {
      copyUrl();
    }
  };

  const downloadQRCode = () => {
    // Esta funcionalidade geraria e baixaria uma imagem do QR Code
    toast({
      title: "Download em desenvolvimento",
      description: "Funcionalidade de download será implementada em breve",
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">QR Code da Carteira</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* QR Code Placeholder - Em produção seria gerado dinamicamente */}
          <div className="flex justify-center">
            <div className="w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg">
              <div className="text-center text-gray-500">
                <div className="w-32 h-32 bg-gray-200 mx-auto mb-2 flex items-center justify-center text-xs">
                  QR Code
                </div>
                <p className="text-xs">Escaneie para validar</p>
              </div>
            </div>
          </div>

          {/* Informações */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Número da Carteira: <span className="font-mono font-bold">{numeroCarteira}</span>
            </p>
            <p className="text-xs text-gray-500">
              Use este QR Code para validar sua identidade eclesiástica
            </p>
          </div>

          {/* URL de Validação */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">Link de validação:</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={qrCodeUrl}
                readOnly
                className="flex-1 text-xs bg-white border rounded px-2 py-1 text-gray-700"
              />
              <Button size="sm" variant="outline" onClick={copyUrl}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Ações */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={shareCard} className="flex-1">
              <Share className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
            <Button variant="outline" onClick={downloadQRCode} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeDisplay;
