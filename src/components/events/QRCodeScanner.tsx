import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, Camera, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface QRCodeScannerProps {
  onClose: () => void;
}

export const QRCodeScanner = ({ onClose }: QRCodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    return () => {
      // Cleanup: parar stream quando componente desmonta
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      setSuccess(null);
      setIsScanning(true);

      // Solicitar acesso à câmera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Câmera traseira preferencialmente
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Iniciar detecção de QR Code
        startQRDetection();
      }
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startQRDetection = () => {
    const detectQR = async () => {
      if (!isScanning || !videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(detectQR);
        return;
      }

      // Configurar canvas com as dimensões do vídeo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Desenhar frame atual do vídeo no canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        // Tentar detectar QR Code usando a API nativa (se disponível)
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['qr_code']
          });
          
          const barcodes = await barcodeDetector.detect(canvas);
          
          if (barcodes.length > 0) {
            const qrData = barcodes[0].rawValue;
            await handleQRCodeDetected(qrData);
            return;
          }
        }
      } catch (err) {
        console.log('BarcodeDetector não disponível, usando método alternativo');
      }

      // Continuar detecção se ainda estiver escaneando
      if (isScanning) {
        requestAnimationFrame(detectQR);
      }
    };

    detectQR();
  };

  const handleQRCodeDetected = async (qrData: string) => {
    try {
      setLoading(true);
      stopScanning();

      // Validar formato do QR Code (deve conter informações do evento)
      let eventData;
      try {
        eventData = JSON.parse(qrData);
      } catch {
        // Se não for JSON, assumir que é um ID simples
        eventData = { eventId: qrData, type: 'presence' };
      }

      if (!eventData.eventId) {
        throw new Error('QR Code inválido: não contém ID do evento');
      }

      // Verificar se o evento existe
      const { data: evento, error: eventoError } = await supabase
        .from('eventos')
        .select('id, titulo, data_inicio, data_fim, requer_presenca')
        .eq('id', eventData.eventId)
        .single();

      if (eventoError || !evento) {
        throw new Error('Evento não encontrado');
      }

      // Verificar se o usuário está inscrito no evento
      const { data: inscricao, error: inscricaoError } = await supabase
        .from('inscricoes_eventos')
        .select('id, status')
        .eq('evento_id', eventData.eventId)
        .eq('user_id', user?.id)
        .single();

      if (inscricaoError || !inscricao) {
        throw new Error('Você não está inscrito neste evento');
      }

      if (inscricao.status !== 'confirmada') {
        throw new Error('Sua inscrição não está confirmada');
      }

      // Registrar presença
      const { error: presencaError } = await supabase
        .from('presencas_eventos')
        .upsert({
          user_id: user?.id,
          evento_id: eventData.eventId,
          inscricao_id: inscricao.id,
          data_presenca: new Date().toISOString(),
          tipo_registro: 'qr_code'
        }, {
          onConflict: 'user_id,evento_id'
        });

      if (presencaError) {
        throw new Error('Erro ao registrar presença: ' + presencaError.message);
      }

      setSuccess(`Presença registrada com sucesso no evento: ${evento.titulo}`);
      
      toast({
        title: "Presença Registrada",
        description: `Sua presença foi registrada no evento "${evento.titulo}"`,
      });

    } catch (error: any) {
      console.error('Erro ao processar QR Code:', error);
      setError(error.message || 'Erro ao processar QR Code');
      
      toast({
        title: "Erro no Scanner",
        description: error.message || 'Erro ao processar QR Code',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scanner de Presença
          </span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {!isScanning && !success && (
          <div className="text-center py-8">
            <Camera className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Pronto para escanear</h3>
            <p className="text-gray-600 mb-4">
              Posicione o QR Code do evento na frente da câmera
            </p>
            <Button onClick={startScanning} disabled={loading}>
              <Camera className="h-4 w-4 mr-2" />
              {loading ? 'Processando...' : 'Iniciar Scanner'}
            </Button>
          </div>
        )}

        {isScanning && (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover rounded-lg bg-black"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              {/* Overlay de mira */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg opacity-75"></div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Posicione o QR Code dentro da área marcada
              </p>
              <Button variant="outline" onClick={stopScanning}>
                <X className="h-4 w-4 mr-2" />
                Parar Scanner
              </Button>
            </div>
          </div>
        )}

        {success && (
          <div className="text-center pt-4">
            <Button onClick={onClose} className="w-full">
              Fechar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};