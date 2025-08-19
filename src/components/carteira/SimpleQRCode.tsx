
import { generateQRCode } from "@/utils/qrCodeUtils";
import { useState, useEffect } from "react";

interface SimpleQRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

const SimpleQRCode = ({ value, size = 120, className = "" }: SimpleQRCodeProps) => {
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateQRImage = async () => {
      try {
        const qrImage = await generateQRCode(value);
        setQrCodeImage(qrImage);
      } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateQRImage();
  }, [value]);

  if (isLoading) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!qrCodeImage) {
    return (
      <div 
        className={`flex items-center justify-center bg-red-50 border border-red-200 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-red-500 text-xs">Erro</span>
      </div>
    );
  }

  return (
    <img 
      src={qrCodeImage} 
      alt="QR Code"
      className={className}
      style={{ width: size, height: size }}
    />
  );
};

export default SimpleQRCode;
