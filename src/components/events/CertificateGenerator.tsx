
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Download, FileText, CheckCircle } from 'lucide-react';
import { useCertificadosEventos } from '@/hooks/useCertificadosEventos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CertificateGeneratorProps {
  evento: {
    id: string;
    titulo: string;
    data_inicio: string;
    data_fim: string;
    carga_horaria?: number;
    certificado_disponivel?: boolean;
  };
  isInscrito: boolean;
  eventoJaPassou: boolean;
}

export const CertificateGenerator = ({
  evento,
  isInscrito,
  eventoJaPassou
}: CertificateGeneratorProps) => {
  const { meusCertificados, gerarCertificado } = useCertificadosEventos();
  
  const certificadoExistente = meusCertificados.find(
    cert => cert.eventos && cert.id === evento.id
  );

  const podeGerarCertificado = 
    isInscrito && 
    eventoJaPassou && 
    evento.certificado_disponivel && 
    !certificadoExistente;

  const handleGerarCertificado = async () => {
    try {
      await gerarCertificado.mutateAsync(evento.id);
    } catch (error) {
      console.error('Erro ao gerar certificado:', error);
    }
  };

  const handleDownloadCertificado = () => {
    // Simular download do certificado
    // Em produção, seria gerado um PDF real
    const link = document.createElement('a');
    link.href = '#';
    link.download = `certificado-${evento.titulo.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    link.click();
  };

  if (!evento.certificado_disponivel) {
    return (
      <Card className="opacity-60">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              Este evento não oferece certificado
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Certificado de Participação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium">{evento.titulo}</h4>
          <p className="text-sm text-gray-600">
            {format(new Date(evento.data_inicio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          {evento.carga_horaria && (
            <Badge variant="outline">
              {evento.carga_horaria}h de carga horária
            </Badge>
          )}
        </div>

        {certificadoExistente ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">Certificado disponível</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="text-sm">
                <strong>Número:</strong> {certificadoExistente.numero_certificado}
              </div>
              <div className="text-sm">
                <strong>Emitido em:</strong> {' '}
                {format(new Date(certificadoExistente.data_emissao), "dd/MM/yyyy", { locale: ptBR })}
              </div>
            </div>
            <Button 
              onClick={handleDownloadCertificado}
              className="w-full"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Certificado
            </Button>
          </div>
        ) : podeGerarCertificado ? (
          <Button
            onClick={handleGerarCertificado}
            disabled={gerarCertificado.isPending}
            className="w-full"
          >
            <Award className="h-4 w-4 mr-2" />
            {gerarCertificado.isPending ? 'Gerando...' : 'Gerar Certificado'}
          </Button>
        ) : (
          <div className="text-sm text-gray-500 text-center p-3 bg-gray-50 rounded-lg">
            {!isInscrito && 'Você precisa estar inscrito no evento'}
            {isInscrito && !eventoJaPassou && 'Disponível após o término do evento'}
            {isInscrito && eventoJaPassou && !evento.certificado_disponivel && 'Certificado não disponível'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
