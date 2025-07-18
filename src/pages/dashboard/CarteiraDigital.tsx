import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, QrCode, User, MapPin, Calendar } from "lucide-react";
const CarteiraDigital = () => {
  return <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-comademig-blue">Identificação Eclesiástica</h1>
        <p className="text-gray-600">Identificação ministerial oficial da COMADEMIG</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Digital Card */}
        <Card className="bg-gradient-to-br from-comademig-blue to-comademig-gold text-white">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <img src="/lovable-uploads/efd9af7f-fef5-4cd0-b54d-d9f55a002a3b.png" alt="COMADEMIG" className="h-8 w-auto" />
              <span className="text-sm opacity-90">2024</span>
            </div>

            {/* Photo and Basic Info */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center">
                <User size={32} className="text-comademig-blue" />
              </div>
              <div>
                <h3 className="text-xl font-bold">João Silva Santos</h3>
                <p className="text-blue-100">Pastor Presidente</p>
                <p className="text-xs text-blue-100">Nº 123456</p>
              </div>
            </div>

            {/* Church Info */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center space-x-2 text-sm">
                <MapPin size={14} />
                <span>Assembleia de Deus - Central</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <MapPin size={14} />
                <span>Campo Regional de Belo Horizonte</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar size={14} />
                <span>Válida até: Dezembro/2024</span>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-lg">
                <QrCode size={80} className="text-comademig-blue" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions and Info */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-comademig-blue hover:bg-comademig-blue/90">
                <Download size={16} className="mr-2" />
                Baixar PDF
              </Button>
              <Button variant="outline" className="w-full">
                <QrCode size={16} className="mr-2" />
                Ampliar QR Code
              </Button>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status da Identificação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Situação:</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Ativa
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Emissão:</span>
                  <span className="text-sm text-gray-600">01/01/2024</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Validade:</span>
                  <span className="text-sm text-gray-600">31/12/2024</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Renovação:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    Automática
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Como Usar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <p>• Apresente esta carteira para identificação ministerial</p>
                <p>• O QR Code pode ser escaneado para verificação</p>
                <p>• Mantenha sempre seus dados atualizados</p>
                <p>• Em caso de dúvidas, entre em contato com o suporte</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export default CarteiraDigital;