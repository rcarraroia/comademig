import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Copy, Check, QrCode, Share2, Mail } from "lucide-react";
import { toast } from "sonner";
import { generateReferralUrl } from "@/hooks/useAffiliate";
import type { Affiliate } from "@/hooks/useAffiliate";
import QRCode from "qrcode";

interface AffiliatesToolsProps {
  affiliate: Affiliate;
}

export function AffiliatesTools({ affiliate }: AffiliatesToolsProps) {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [showQrCode, setShowQrCode] = useState(false);

  const referralUrl = generateReferralUrl(affiliate.referral_code);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success("Link copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar link");
    }
  };

  const handleGenerateQrCode = async () => {
    try {
      const url = await QRCode.toDataURL(referralUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#24324F', // comademig-blue
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(url);
      setShowQrCode(true);
    } catch (error) {
      toast.error("Erro ao gerar QR Code");
    }
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá! Convido você a se filiar ao COMADEMIG. Use meu link de indicação: ${referralUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent('Convite para filiação COMADEMIG');
    const body = encodeURIComponent(
      `Olá!\n\nConvido você a se filiar ao COMADEMIG.\n\nUse meu link de indicação:\n${referralUrl}\n\nAté breve!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleDownloadQrCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `qrcode-afiliado-${affiliate.referral_code}.png`;
    link.href = qrCodeUrl;
    link.click();
    toast.success("QR Code baixado com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Link de Indicação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-comademig-blue" />
            Seu Link de Indicação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={referralUrl}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="flex-shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </>
              )}
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Dica:</strong> Compartilhe este link com pessoas interessadas em se filiar ao COMADEMIG. 
              Quando alguém se cadastrar usando seu link, você receberá comissão automaticamente!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-comademig-blue" />
            QR Code de Indicação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showQrCode ? (
            <Button
              onClick={handleGenerateQrCode}
              className="w-full bg-comademig-blue hover:bg-comademig-blue/90"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Gerar QR Code
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white border-2 border-comademig-blue rounded-lg">
                <img src={qrCodeUrl} alt="QR Code de Indicação" className="w-64 h-64" />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleDownloadQrCode}
                  variant="outline"
                  className="flex-1"
                >
                  Baixar QR Code
                </Button>
                <Button
                  onClick={() => setShowQrCode(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Ocultar
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Compartilhe este QR Code em materiais impressos ou digitais
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botões de Compartilhamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-comademig-blue" />
            Compartilhar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleShareWhatsApp}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Compartilhar no WhatsApp
          </Button>

          <Button
            onClick={handleShareEmail}
            variant="outline"
            className="w-full"
          >
            <Mail className="h-5 w-5 mr-2" />
            Compartilhar por E-mail
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
