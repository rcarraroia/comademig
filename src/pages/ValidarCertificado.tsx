
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Award, Search, CheckCircle, XCircle } from 'lucide-react';
import { useCertificadosEventos } from '@/hooks/useCertificadosEventos';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ValidarCertificado = () => {
  const { numeroCertificado: urlNumero } = useParams();
  const [numeroBusca, setNumeroBusca] = useState(urlNumero || '');
  const { validarCertificado } = useCertificadosEventos();

  const handleValidar = () => {
    if (numeroBusca.trim()) {
      validarCertificado.refetch();
    }
  };

  const certificado = validarCertificado.data;
  const isLoading = validarCertificado.isLoading;
  const error = validarCertificado.error;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Validação de Certificado
          </h1>
          <p className="text-gray-600">
            Verifique a autenticidade de certificados emitidos pela COMADEMIG
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Certificado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Digite o número do certificado..."
                value={numeroBusca}
                onChange={(e) => setNumeroBusca(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleValidar} disabled={!numeroBusca.trim()}>
                <Search className="h-4 w-4 mr-2" />
                Validar
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="text-center py-12">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Validando certificado...</p>
          </div>
        )}

        {error && (
          <Card>
            <CardContent className="py-12 text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Certificado não encontrado
              </h3>
              <p className="text-gray-600">
                O número do certificado informado não foi encontrado ou não é válido.
              </p>
            </CardContent>
          </Card>
        )}

        {certificado && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center mb-6">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Certificado Válido
                </h3>
                <Badge variant="success" className="text-sm">
                  Autêntico
                </Badge>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Participante
                    </label>
                    <p className="text-lg font-semibold">
                      {certificado.profiles?.nome_completo}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Número do Certificado
                    </label>
                    <p className="text-lg font-mono">
                      {certificado.numero_certificado}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Evento
                    </label>
                    <p className="text-lg font-semibold">
                      {certificado.eventos.titulo}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Data do Evento
                    </label>
                    <p className="text-lg">
                      {format(new Date(certificado.eventos.data_inicio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  {certificado.eventos.local && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Local
                      </label>
                      <p className="text-lg">
                        {certificado.eventos.local}
                      </p>
                    </div>
                  )}
                  {certificado.eventos.carga_horaria && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Carga Horária
                      </label>
                      <p className="text-lg">
                        {certificado.eventos.carga_horaria} horas
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Data de Emissão
                    </label>
                    <p className="text-lg">
                      {format(new Date(certificado.data_emissao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ValidarCertificado;
