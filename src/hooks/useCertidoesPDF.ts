
import { useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import { generateQRCode } from '@/utils/qrCodeUtils';

interface GerarCertidaoParams {
  solicitacaoId: string;
  dadosUsuario: {
    nome: string;
    cpf: string;
    cargo: string;
    igreja: string;
  };
  tipoCertidao: string;
  numeroProtocolo: string;
}

export const useCertidoesPDF = () => {
  const gerarCertidaoPDF = useSupabaseMutation(
    async ({ solicitacaoId, dadosUsuario, tipoCertidao, numeroProtocolo }: GerarCertidaoParams) => {
      try {
        // Criar PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        // Configurar fonte
        pdf.setFont('helvetica');

        // Cabeçalho
        pdf.setFontSize(20);
        pdf.setTextColor(0, 51, 102); // Cor azul COMADEMIG
        pdf.text('COMADEMIG', 105, 30, { align: 'center' });
        pdf.setFontSize(12);
        pdf.text('Convenção de Ministros das Assembleias de Deus em Minas Gerais', 105, 38, { align: 'center' });

        // Título da certidão
        pdf.setFontSize(18);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`CERTIDÃO DE ${tipoCertidao.toUpperCase()}`, 105, 60, { align: 'center' });

        // Conteúdo da certidão
        pdf.setFontSize(12);
        const texto = `
Certificamos que ${dadosUsuario.nome}, portador(a) do CPF ${dadosUsuario.cpf}, 
exerce o cargo de ${dadosUsuario.cargo} na ${dadosUsuario.igreja}, 
encontra-se em pleno gozo de seus direitos junto à COMADEMIG.

Esta certidão é válida por 90 (noventa) dias a partir da data de emissão 
e serve para os fins que se fizerem necessários.
        `;
        
        const linhas = pdf.splitTextToSize(texto.trim(), 160);
        pdf.text(linhas, 25, 90);

        // Protocolo
        pdf.setFontSize(10);
        pdf.text(`Protocolo: ${numeroProtocolo}`, 25, 160);
        pdf.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, 25, 170);

        // Gerar QR Code para validação
        const urlValidacao = `${window.location.origin}/validar-certidao/${numeroProtocolo}`;
        const qrCodeDataURL = await generateQRCode(urlValidacao);
        
        // Adicionar QR Code ao PDF
        pdf.addImage(qrCodeDataURL, 'PNG', 150, 150, 30, 30);
        pdf.text('Validar autenticidade:', 150, 185);
        pdf.setFontSize(8);
        pdf.text(urlValidacao, 150, 190);

        // Assinatura
        pdf.setFontSize(12);
        pdf.text('COMADEMIG', 105, 220, { align: 'center' });
        pdf.setFontSize(10);
        pdf.text('Convenção de Ministros das Assembleias de Deus em MG', 105, 225, { align: 'center' });

        // Converter para blob
        const pdfBlob = pdf.output('blob');
        
        // Upload para Supabase Storage
        const nomeArquivo = `certidao-${numeroProtocolo}.pdf`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documentos')
          .upload(`certidoes/${nomeArquivo}`, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (uploadError) throw uploadError;

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('documentos')
          .getPublicUrl(`certidoes/${nomeArquivo}`);

        // Atualizar solicitação com PDF
        const { error: updateError } = await supabase
          .from('solicitacoes_certidoes')
          .update({
            arquivo_pdf: publicUrl,
            status: 'aprovada',
            data_aprovacao: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', solicitacaoId);

        if (updateError) throw updateError;

        return { pdfUrl: publicUrl };
      } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        throw new Error('Erro ao gerar certidão PDF');
      }
    },
    {
      successMessage: 'Certidão PDF gerada com sucesso!',
      errorMessage: 'Erro ao gerar certidão PDF'
    }
  );

  return {
    gerarCertidaoPDF
  };
};
