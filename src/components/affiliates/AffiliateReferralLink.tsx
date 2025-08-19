
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Share2, MessageCircle, QrCode, Facebook, Linkedin, Instagram } from 'lucide-react';
import { useAffiliate } from '@/hooks/useAffiliate';
import { useToast } from '@/hooks/use-toast';
import { generateQRCode } from '@/utils/qrCodeUtils';
import { useState, useEffect } from 'react';

interface AffiliateReferralLinkProps {
  referralCode: string;
}

export const AffiliateReferralLink = ({ referralCode }: AffiliateReferralLinkProps) => {
  const { generateReferralUrl } = useAffiliate();
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQR, setShowQR] = useState(false);

  const referralUrl = generateReferralUrl(referralCode);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrUrl = await generateQRCode(referralUrl);
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
      }
    };

    if (showQR) {
      generateQR();
    }
  }, [referralUrl, showQR]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralUrl);
    toast({
      title: "Link copiado!",
      description: "O link de indicação foi copiado para a área de transferência.",
    });
  };

  const shareWhatsApp = () => {
    const message = `Olá! Convido você a fazer parte da COMADEMIG, uma convenção que fortalece ministérios e pastores. Use meu link de indicação: ${referralUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`;
    window.open(facebookUrl, '_blank');
  };

  const shareLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`;
    window.open(linkedinUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Meu Link de Indicação
        </CardTitle>
        <CardDescription>
          Compartilhe este link para indicar novos membros e ganhar comissão
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Link */}
        <div className="flex gap-2">
          <Input
            value={referralUrl}
            readOnly
            className="flex-1 font-mono text-sm"
          />
          <Button onClick={copyToClipboard} size="icon" variant="outline">
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        {/* Botões de Compartilhamento */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button onClick={shareWhatsApp} variant="outline" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-green-600" />
            WhatsApp
          </Button>
          
          <Button onClick={shareFacebook} variant="outline" className="flex items-center gap-2">
            <Facebook className="h-4 w-4 text-blue-600" />
            Facebook
          </Button>
          
          <Button onClick={shareLinkedIn} variant="outline" className="flex items-center gap-2">
            <Linkedin className="h-4 w-4 text-blue-700" />
            LinkedIn
          </Button>
          
          <Button 
            onClick={() => setShowQR(!showQR)} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <QrCode className="h-4 w-4" />
            QR Code
          </Button>
        </div>

        {/* QR Code */}
        {showQR && qrCodeUrl && (
          <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg bg-muted/50">
            <img 
              src={qrCodeUrl} 
              alt="QR Code do Link de Indicação" 
              className="w-48 h-48"
            />
            <p className="text-sm text-muted-foreground text-center">
              Mostre este QR Code em eventos presenciais
            </p>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          Quando alguém se filiar usando este link, você receberá automaticamente 20% do valor pago.
        </p>
      </CardContent>
    </Card>
  );
};
