
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { usePresencaEventos } from '@/hooks/usePresencaEventos';
import { useToast } from '@/hooks/use-toast';

interface PresenceScannerProps {
  eventoId: string;
  eventoTitulo: string;
}

export const PresenceScanner = ({ eventoId, eventoTitulo }: PresenceScannerProps) => {
  const [scanningType, setScanningType] = useState<'entrada' | 'saida' | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const { registrarPresenca } = usePresencaEventos();
  const { toast } = useToast();

  const handleScanPresence = async (type: 'entrada' | 'saida') => {
    try {
      setScanningType(type);
      setIsScanning(true);

      // Simular escaneamento de QR Code
      // Em produção, aqui seria integrado com uma biblioteca de QR Code scanner
      await new Promise(resolve => setTimeout(resolve, 2000));

      await registrarPresenca.mutateAsync({
        eventoId,
        tipoPresenca: type
      });

      toast({
        title: "Presença registrada",
        description: `${type === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`,
      });

    } catch (error) {
      console.error('Erro ao registrar presença:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar presença. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
      setScanningType(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Registro de Presença
        </CardTitle>
        <p className="text-sm text-gray-600">{eventoTitulo}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => handleScanPresence('entrada')}
            disabled={isScanning}
            className="flex flex-col items-center gap-2 h-20"
            variant={scanningType === 'entrada' ? 'default' : 'outline'}
          >
            {scanningType === 'entrada' && isScanning ? (
              <Camera className="h-6 w-6 animate-pulse" />
            ) : (
              <CheckCircle className="h-6 w-6" />
            )}
            <span>Registrar Entrada</span>
          </Button>

          <Button
            onClick={() => handleScanPresence('saida')}
            disabled={isScanning}
            className="flex flex-col items-center gap-2 h-20"
            variant={scanningType === 'saida' ? 'default' : 'outline'}
          >
            {scanningType === 'saida' && isScanning ? (
              <Camera className="h-6 w-6 animate-pulse" />
            ) : (
              <AlertCircle className="h-6 w-6" />
            )}
            <span>Registrar Saída</span>
          </Button>
        </div>

        {isScanning && (
          <div className="text-center">
            <Badge variant="outline" className="animate-pulse">
              {scanningType === 'entrada' ? 'Registrando entrada...' : 'Registrando saída...'}
            </Badge>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center">
          * Em produção, seria integrado com scanner de QR Code real
        </div>
      </CardContent>
    </Card>
  );
};
