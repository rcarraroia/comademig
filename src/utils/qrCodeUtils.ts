
import QRCode from 'qrcode';

export const generateQRCode = async (text: string): Promise<string> => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(text, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    throw new Error('Erro ao gerar QR Code');
  }
};

export const generateQRCodeSVG = async (text: string): Promise<string> => {
  try {
    const qrCodeSVG = await QRCode.toString(text, {
      type: 'svg',
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeSVG;
  } catch (error) {
    console.error('Erro ao gerar QR Code SVG:', error);
    throw new Error('Erro ao gerar QR Code SVG');
  }
};
