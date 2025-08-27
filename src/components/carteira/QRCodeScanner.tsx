import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRCodeScannerProps {
  onScanSuccess: (url: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const QRCodeScanner = ({ onScanSuccess, onClose, isOpen }: QRCodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Função para iniciar a câmera
  const startCamera = async () => {
    try {
      setError('');
      setIsScanning(true);

      // Solicitar permissão para câmera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Câmera traseira preferencialmente
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Iniciar detecção de QR Code
      startQRDetection();

    } catch (err: any) {
      console.error('Erro ao acessar câmera:', err);
      setHasPermission(false);
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
      setIsScanning(false);
    }
  };

  // Função para parar a câmera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Função para detectar QR Code (implementação simplificada)
  const startQRDetection = () => {
    // Nota: Para uma implementação completa, seria necessário usar uma biblioteca
    // como jsQR ou qr-scanner. Por enquanto, vamos simular a detecção.
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    const detectQR = () => {
      if (!videoRef.current || !context || !isScanning) return;
      
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Aqui seria implementada a detecção real do QR Code
      // Por enquanto, vamos usar um timeout para simular
      
      setTimeout(detectQR, 100);
    };
    
    // Iniciar detecção após um pequeno delay
    setTimeout(detectQR, 500);
  };

  // Função para processar URL escaneada
  const processScannedUrl = (url: string) => {
    try {
      // Verificar se é uma URL válida de validação de carteira
      if (url.includes('/validar-carteira/') || url.includes('comademig')) {
        onScanSuccess(url);
        stopCamera();
        onClose();
        toast({
          title: "QR Code detectado",
          description: "Redirecionando para validação...",
        });
      } else {
        setError('QR Code não é de uma carteira COMADEMIG válida');
      }
    } catch (err) {
      setError('Erro ao processar QR Code escaneado');
    }
  };

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Iniciar câmera quando modal abrir
  useEffect(() => {
    if (isOpen && !isScanning) {
      startCamera();
    } else if (!isOpen && isScanning) {
      stopCamera();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Escanear QR Code</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Área de vídeo */}
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-64 bg-gray-900 rounded-lg object-cover"
              playsInline
              muted
            />
            
            {/* Overlay de mira */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg opacity-75">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
              </div>
            </div>
          </div>

          {/* Status e instruções */}
          <div className="text-center space-y-2">
            {isScanning ? (
              <p className="text-sm text-gray-600">
                Posicione o QR Code dentro da área marcada
              </p>
            ) : hasPermission === false ? (
              <div className="flex items-center justify-center space-x-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Permissão de câmera negada</span>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Iniciando câmera...
              </p>
            )}
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex space-x-3">
            {!isScanning && hasPermission !== true && (
              <Button onClick={startCamera} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Iniciar Câmera
              </Button>
            )}
            
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
          </div>

          {/* Instruções */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Instruções:
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Permita o acesso à câmera quando solicitado</li>
              <li>• Posicione o QR Code dentro da área marcada</li>
              <li>• Mantenha o dispositivo estável</li>
              <li>• Aguarde a detecção automática</li>
            </ul>
          </div>

          {/* Botão de teste (para desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => processScannedUrl(`${window.location.origin}/validar-carteira/COMADEMIG-TEST-123`)}
              className="w-full"
            >
              Simular QR Code (Desenvolvimento)
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};