import jsPDF from 'jspdf';
import { generateQRCode } from './qrCodeUtils';

interface CarteiraData {
  numero_carteira: string;
  qr_code: string;
  data_emissao: string;
  data_validade: string;
  status: string;
  foto_url?: string;
}

interface ProfileData {
  nome_completo: string;
  igreja?: string;
  cargo?: string;
  cidade?: string;
  estado?: string;
  tipo_membro?: string;
}

export const generateCarteiraPDF = async (
  carteira: CarteiraData,
  profile: ProfileData
): Promise<void> => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [85.6, 53.98] // Tamanho padrão de cartão de crédito
    });

    // Configurações de cores
    const primaryColor = [41, 98, 255]; // Azul COMADEMIG
    const goldColor = [255, 215, 0]; // Dourado COMADEMIG
    const textColor = [255, 255, 255]; // Branco

    // Fundo gradiente (simulado com retângulos)
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(0, 0, 85.6, 53.98, 'F');

    // Adicionar gradiente dourado na parte inferior
    pdf.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
    pdf.rect(0, 40, 85.6, 13.98, 'F');

    // Header - Logo e título
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMADEMIG', 5, 6);
    
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Carteira Digital Eclesiástica', 5, 10);

    // Status badge
    pdf.setFontSize(5);
    pdf.setFont('helvetica', 'bold');
    const statusText = carteira.status === 'ativa' ? 'ATIVA' : 'INVÁLIDA';
    const statusWidth = pdf.getTextWidth(statusText);
    pdf.setFillColor(carteira.status === 'ativa' ? [34, 197, 94] : [239, 68, 68]);
    pdf.roundedRect(85.6 - statusWidth - 8, 3, statusWidth + 4, 4, 1, 1, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.text(statusText, 85.6 - statusWidth - 6, 6);

    // Foto do usuário (placeholder se não houver foto)
    let fotoDataUrl = '';
    if (carteira.foto_url) {
      try {
        // Converter imagem para base64
        const response = await fetch(carteira.foto_url);
        const blob = await response.blob();
        fotoDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        
        pdf.addImage(fotoDataUrl, 'JPEG', 5, 14, 15, 15);
      } catch (error) {
        console.error('Erro ao carregar foto:', error);
        // Desenhar placeholder para foto
        pdf.setFillColor(200, 200, 200);
        pdf.rect(5, 14, 15, 15, 'F');
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(4);
        pdf.text('FOTO', 10, 22);
      }
    } else {
      // Desenhar placeholder para foto
      pdf.setFillColor(200, 200, 200);
      pdf.rect(5, 14, 15, 15, 'F');
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(4);
      pdf.text('FOTO', 10, 22);
    }

    // Informações do usuário
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    
    // Nome (truncar se muito longo)
    let nome = profile.nome_completo;
    if (pdf.getTextWidth(nome) > 40) {
      nome = nome.substring(0, 25) + '...';
    }
    pdf.text(nome, 22, 18);

    // Cargo e Igreja
    pdf.setFontSize(5);
    pdf.setFont('helvetica', 'normal');
    if (profile.cargo) {
      pdf.text(profile.cargo, 22, 22);
    }
    if (profile.igreja) {
      let igreja = profile.igreja;
      if (pdf.getTextWidth(igreja) > 40) {
        igreja = igreja.substring(0, 30) + '...';
      }
      pdf.text(igreja, 22, 26);
    }

    // Número da carteira
    pdf.setTextColor(0, 0, 0); // Preto para contraste no fundo dourado
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Nº da Carteira:', 5, 44);
    pdf.setFont('helvetica', 'normal');
    pdf.text(carteira.numero_carteira, 5, 48);

    // Data de validade
    pdf.setFont('helvetica', 'bold');
    pdf.text('Válida até:', 5, 52);
    pdf.setFont('helvetica', 'normal');
    const dataValidade = new Date(carteira.data_validade).toLocaleDateString('pt-BR');
    pdf.text(dataValidade, 20, 52);

    // QR Code
    try {
      const qrCodeDataUrl = await generateQRCode(carteira.qr_code);
      pdf.addImage(qrCodeDataUrl, 'PNG', 65, 35, 18, 18);
    } catch (error) {
      console.error('Erro ao gerar QR Code para PDF:', error);
      // Desenhar placeholder para QR Code
      pdf.setFillColor(200, 200, 200);
      pdf.rect(65, 35, 18, 18, 'F');
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(3);
      pdf.text('QR CODE', 70, 45);
    }

    // Salvar o PDF
    const fileName = `carteira-${carteira.numero_carteira}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw new Error('Erro ao gerar PDF da carteira');
  }
};

export const generateCarteiraVersoPDF = async (
  carteira: CarteiraData,
  profile: ProfileData
): Promise<void> => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [85.6, 53.98]
    });

    // Fundo branco
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, 85.6, 53.98, 'F');

    // Borda
    pdf.setDrawColor(41, 98, 255);
    pdf.setLineWidth(0.5);
    pdf.rect(2, 2, 81.6, 49.98);

    // Título
    pdf.setTextColor(41, 98, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('IDENTIFICAÇÃO ECLESIÁSTICA', 5, 8);

    // Informações detalhadas
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');

    let yPos = 15;
    const lineHeight = 4;

    if (profile.tipo_membro) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Tipo de Membro:', 5, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(profile.tipo_membro, 30, yPos);
      yPos += lineHeight;
    }

    if (profile.cidade && profile.estado) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Localização:', 5, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${profile.cidade}, ${profile.estado}`, 25, yPos);
      yPos += lineHeight;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.text('Data de Emissão:', 5, yPos);
    pdf.setFont('helvetica', 'normal');
    const dataEmissao = new Date(carteira.data_emissao).toLocaleDateString('pt-BR');
    pdf.text(dataEmissao, 30, yPos);
    yPos += lineHeight;

    // Instruções de validação
    yPos += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5);
    pdf.text('VALIDAÇÃO:', 5, yPos);
    yPos += 3;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(4);
    pdf.text('Para validar esta carteira, escaneie o QR Code', 5, yPos);
    yPos += 3;
    pdf.text('ou acesse: ' + window.location.origin + '/validar-carteira/', 5, yPos);
    yPos += 3;
    pdf.text(carteira.numero_carteira, 5, yPos);

    // Rodapé
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(4);
    pdf.text('Este documento é válido apenas com foto e assinatura', 5, 48);
    pdf.text('COMADEMIG - Convenção de Ministros das Assembleias de Deus de MG', 5, 51);

    // Salvar o PDF (verso)
    const fileName = `carteira-verso-${carteira.numero_carteira}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Erro ao gerar PDF do verso:', error);
    throw new Error('Erro ao gerar PDF do verso da carteira');
  }
};