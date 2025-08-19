
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Award, Search, Calendar, MapPin, Clock } from 'lucide-react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCertificadosEventos } from '@/hooks/useCertificadosEventos';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

interface CertificadoValidado {
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
  profiles: {
    nome_completo: string;
  };
}

export default function ValidarCertificado() {
  const { numero } = useParams();
  const [numeroCertificado, setNumeroCertificado] = useState(numero || '');
  const [certificado, setCertificado] = useState<CertificadoValidado | null>(null);
  const [loading, setLoading] = useState(false);
  const { validarCertificado } = useCertificadosEventos();
  const { toast } = useToast();

  const handleValidar = async () => {
    if (!numeroCertificado.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira o número do certificado",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await validarCertificado(numeroCertificado);
      setCertificado(data);
      toast({
        title: "Certificado válido!",
        description: "Certificado encontrado e validado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao validar certificado:', error);
      setCertificado(null);
      toast({
        title: "Certificado não encontrado",
        description: "O número do certificado não foi encontrado ou está inválido.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-validar se veio da URL
  useState(() => {
    if (numero) {
      handleValidar();
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="mb-8">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Award className="h-8 w-8 text-yellow-500" />
                Validar Certificado
              </CardTitle>
              <p className="text-gray-600">
                Digite o número do certificado para verificar sua autenticidade
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: CERT-1234567890-ABCDEF"
                  value={numeroCertificado}
                  onChange={(e) => setNumeroCertificado(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleValidar()}
                />
                <Button onClick={handleValidar} disabled={loading}>
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {certificado && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl text-green-800">
                    Certificado Válido
                  </CardTitle>
                  <Badge variant="default" className="bg-green-600">
                    ✓ Autêntico
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Participante</h4>
                    <p className="text-lg">{certificado.profiles?.nome_completo}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Número do Certificado</h4>
                    <p className="font-mono text-sm">{certificado.numero_certificado}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Evento</h4>
                  <p className="text-lg font-medium">{certificado.eventos?.titulo}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Período do evento</p>
                      <p className="font-medium">
                        {format(new Date(certificado.eventos.data_inicio), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(certificado.eventos.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  {certificado.eventos?.local && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Local</p>
                        <p className="font-medium">{certificado.eventos.local}</p>
                      </div>
                    </div>
                  )}
                </div>

                {certificado.eventos?.carga_horaria && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Carga Horária</p>
                      <p className="font-medium">{certificado.eventos.carga_horaria}h</p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600">Data de Emissão</p>
                  <p className="font-medium">
                    {format(new Date(certificado.data_emissao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
