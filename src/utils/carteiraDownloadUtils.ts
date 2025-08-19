
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const downloadCarteiraAsPDF = async (elementId: string, numeroCarteira: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Elemento da carteira não encontrado');
    }

    // Capturar o elemento como canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Criar PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Calcular dimensões para manter proporção
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download do PDF
    pdf.save(`carteira-digital-${numeroCarteira}.pdf`);
  } catch (error) {
    console.error('Erro ao gerar PDF da carteira:', error);
    throw new Error('Erro ao gerar PDF da carteira');
  }
};
