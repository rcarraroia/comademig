
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User, MapPin, Phone, Mail, Download, QrCode } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import QRCodeDisplay from "./QRCodeDisplay";
import { useState } from "react";

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
  profile: {
    nome_completo: string;
    cpf?: string;
    igreja?: string;
    cargo?: string;
    telefone?: string;
    cidade?: string;
    estado?: string;
    tipo_membro?: string;
  };
  userEmail?: string;
  onUpdatePhoto?: (file: File) => void;
}

const CarteiraDigitalCard = ({ carteira, profile, userEmail, onUpdatePhoto }: CarteiraDigitalCardProps) => {
  const [showQRCode, setShowQRCode] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa':
        return 'success';
      case 'expirada':
        return 'warning';
      case 'suspensa':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativa':
        return 'Ativa';
      case 'expirada':
        return 'Expirada';
      case 'suspensa':
        return 'Suspensa';
      default:
        return status;
    }
  };

  const getTipoMembroLabel = (tipo: string) => {
    switch (tipo) {
      case 'pastor':
        return 'Pastor';
      case 'evangelista':
        return 'Evangelista';
      case 'presbitero':
        return 'Presbítero';
      case 'diacono':
        return 'Diácono';
      case 'obreiro':
        return 'Obreiro';
      case 'membro':
        return 'Membro';
      default:
        return 'Membro';
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUpdatePhoto) {
      onUpdatePhoto(file);
    }
  };

  const downloadCard = () => {
    // Esta funcionalidade seria implementada para gerar PDF da carteira
    console.log('Download da carteira solicitado');
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="bg-gradient-to-br from-comademig-blue to-comademig-blue/90 text-white shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/3b224a34-6b1d-42ce-9831-77c118c82d27.png" 
                alt="COMADEMIG" 
                className="h-8 w-auto brightness-0 invert"
              />
              <div>
                <h3 className="font-bold text-lg">COMADEMIG</h3>
                <p className="text-xs text-gray-200">Identificação Eclesiástica</p>
              </div>
            </div>
            <Badge variant={getStatusColor(carteira.status)} className="text-xs">
              {getStatusLabel(carteira.status)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Foto e Dados Pessoais */}
          <div className="flex items-start space-x-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-white">
                <AvatarImage src={carteira.foto_url} />
                <AvatarFallback className="bg-comademig-gold text-comademig-blue text-lg font-bold">
                  {profile.nome_completo?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              {onUpdatePhoto && (
                <label className="absolute -bottom-1 -right-1 bg-comademig-gold text-comademig-blue rounded-full p-1 cursor-pointer hover:bg-comademig-gold/90 transition-colors">
                  <User className="h-3 w-3" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-lg leading-tight">{profile.nome_completo}</h4>
              <p className="text-comademig-gold font-medium">
                {getTipoMembroLabel(profile.tipo_membro || 'membro')}
              </p>
              {profile.cargo && (
                <p className="text-xs text-gray-200">{profile.cargo}</p>
              )}
            </div>
          </div>

          {/* Informações da Igreja */}
          {profile.igreja && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4" />
                <div>
                  <p className="font-medium">{profile.igreja}</p>
                  {profile.cidade && profile.estado && (
                    <p className="text-xs text-gray-200">{profile.cidade}, {profile.estado}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Contatos */}
          <div className="space-y-1">
            {userEmail && (
              <div className="flex items-center space-x-2 text-xs">
                <Mail className="h-3 w-3" />
                <span className="truncate">{userEmail}</span>
              </div>
            )}
            {profile.telefone && (
              <div className="flex items-center space-x-2 text-xs">
                <Phone className="h-3 w-3" />
                <span>{profile.telefone}</span>
              </div>
            )}
          </div>

          {/* Número da Carteira e Validade */}
          <div className="border-t border-white/20 pt-3">
            <div className="flex justify-between items-center text-xs">
              <div>
                <p className="text-gray-200">Nº da Carteira</p>
                <p className="font-mono font-bold">{carteira.numero_carteira}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-200">Válida até</p>
                <p className="font-bold">
                  {format(new Date(carteira.data_validade), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex space-x-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowQRCode(true)}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <QrCode className="h-4 w-4 mr-1" />
              QR Code
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={downloadCard}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal QR Code */}
      {showQRCode && (
        <QRCodeDisplay
          qrCodeUrl={carteira.qr_code}
          numeroCarteira={carteira.numero_carteira}
          onClose={() => setShowQRCode(false)}
        />
      )}
    </div>
  );
};

export default CarteiraDigitalCard;
