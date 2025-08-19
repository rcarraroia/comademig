
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, CheckCircle } from 'lucide-react';
import { usePresencaEventos } from '@/hooks/usePresencaEventos';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface PresencaQRCodeProps {
  eventoId: string;
  eventoTitulo: string;
}

export const PresencaQRCode = ({ eventoId, eventoTitulo }: PresencaQRCodeProps) => {
  const [tipoPresenca, setTipoPresenca] = useState<'entrada' | 'saida'>('entrada');
  const { registrarPresenca } = usePresencaEventos();

  const handleRegistrarPresenca = async () => {
    try {
      await registrarPresenca.mutateAsync({
        eventoId,
        tipoPresenca
      });
    } catch (error) {
      console.error('Erro ao registrar presença:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Registrar Presença
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Registre sua presença no evento: <strong>{eventoTitulo}</strong>
        </p>
        
        <div className="flex gap-2">
          <Button
            variant={tipoPresenca === 'entrada' ? 'default' : 'outline'}
            onClick={() => setTipoPresenca('entrada')}
            size="sm"
          >
            Entrada
          </Button>
          <Button
            variant={tipoPresenca === 'saida' ? 'default' : 'outline'}
            onClick={() => setTipoPresenca('saida')}
            size="sm"
          >
            Saída
          </Button>
        </div>

        <Button
          onClick={handleRegistrarPresenca}
          disabled={registrarPresenca.isPending}
          className="w-full"
        >
          {registrarPresenca.isPending ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          Registrar {tipoPresenca === 'entrada' ? 'Entrada' : 'Saída'}
        </Button>
      </CardContent>
    </Card>
  );
};
