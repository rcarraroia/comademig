
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download, QrCode } from 'lucide-react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CertificadoCardProps {
  certificado: {
    id: string;
    numero_certificado: string;
    data_emissao: string;
    qr_code: string;
    status: string;
    eventos: {
      titulo: string;
      data_inicio: string;
      data_fim: string;
      local?: string;
      carga_horaria?: number;
    };
  };
}

export const CertificadoCard = ({ certificado }: CertificadoCardProps) => {
  const dataEmissao = new Date(certificado.data_emissao);
  
  const handleDownload = () => {
    // Implementar download do certificado em PDF
    console.log('Download certificado:', certificado.numero_certificado);
  };

  const handleValidar = () => {
    window.open(`/validar-certificado/${certificado.numero_certificado}`, '_blank');
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            {certificado.eventos.titulo}
          </CardTitle>
          <Badge variant="success">
            Emitido
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div>
            <strong>Número:</strong> {certificado.numero_certificado}
          </div>
          <div>
            <strong>Data de Emissão:</strong> {format(dataEmissao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </div>
          {certificado.eventos.local && (
            <div>
              <strong>Local:</strong> {certificado.eventos.local}
            </div>
          )}
          {certificado.eventos.carga_horaria && (
            <div>
              <strong>Carga Horária:</strong> {certificado.eventos.carga_horaria}h
            </div>
          )}
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button 
            onClick={handleValidar}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <QrCode className="h-4 w-4 mr-2" />
            Validar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
