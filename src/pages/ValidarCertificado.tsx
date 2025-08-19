
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, AlertCircle, User, MapPin, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface CertificadoData {
  id: string;
  numero_certificado: string;
  qr_code: string;
  data_emissao: string;
  status: string;
  eventos: {
    titulo: string;
    data_inicio: string;
    data_fim: string;
    local?: string;
    carga_horaria?: number;
  };
}

interface ProfileData {
  nome_completo: string;
}

interface CertificadoValidacao {
  certificado: CertificadoData | null;
  profile: ProfileData | null;
  isValid: boolean;
  error?: string;
}

const ValidarCertificado = () => {
  const { numeroCertificado } = useParams<{ numeroCertificado: string }>();
  const [validacao, setValidacao] = useState<CertificadoValidacao | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validarCertificado = async () => {
      if (!numeroCertificado) {
        setValidacao({
          certificado: null,
          profile: null,
          isValid: false,
          error: "Número do certificado não fornecido"
        });
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('certificados_eventos')
          .select(`
            *,
            eventos (
              titulo,
              data_inicio,
              data_fim,
              local,
              carga_horaria
            ),
            profiles (
              nome_completo
            )
          `)
          .eq('numero_certificado', numeroCertificado)
          .eq('status', 'emitido')
          .single();

        if (error || !data) {
          setValidacao({
            certificado: null,
            profile: null,
            isValid: false,
            error: "Certificado não encontrado ou inválido"
          });
          setIsLoading(false);
          return;
        }

        // Type assertion with validation
        const certificadoData = data as any;
        
        if (!certificadoData.profiles?.nome_completo || !certificadoData.eventos?.titulo) {
          setValidacao({
            certificado: null,
            profile: null,
            isValid: false,
            error: "Dados do certificado incompletos"
          });
          setIsLoading(false);
          return;
        }

        setValidacao({
          certificado: {
            id: certificadoData.id,
            numero_certificado: certificadoData.numero_certificado,
            qr_code: certificadoData.qr_code,
            data_emissao: certificadoData.data_emissao,
            status: certificadoData.status,
            eventos: certificadoData.eventos
          },
          profile: {
            nome_completo: certificadoData.profiles.nome_completo
          },
          isValid: true
        });

      } catch (error) {
        console.error('Erro ao validar certificado:', error);
        setValidacao({
          certificado: null,
          profile: null,
          isValid: false,
          error: "Erro interno ao validar certificado"
        });
      } finally {
        setIsLoading(false);
      }
    };

    validarCertificado();
  }, [numeroCertificado]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!validacao) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-8">
            <XCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Erro na Validação
            </h2>
            <p className="text-gray-600 text-center">
              Não foi possível validar o certificado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (validacao.isValid) {
      return <CheckCircle className="h-16 w-16 text-green-500" />;
    } else {
      return <XCircle className="h-16 w-16 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    return validacao.isValid ? "success" : "destructive";
  };

  const getStatusLabel = () => {
    return validacao.isValid ? "Certificado Válido" : "Certificado Inválido";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <img 
              src="/lovable-uploads/3b224a34-6b1d-42ce-9831-77c118c82d27.png" 
              alt="COMADEMIG" 
              className="h-12 w-auto mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-comademig-blue">
              Validação de Certificado Digital
            </h1>
            <p className="text-gray-600">
              Verificação de autenticidade do certificado de evento
            </p>
          </div>

          {/* Status Card */}
          <Card className="mb-6">
            <CardContent className="flex flex-col items-center py-8">
              {getStatusIcon()}
              <h2 className="text-xl font-semibold text-gray-900 mb-2 mt-4">
                {getStatusLabel()}
              </h2>
              <Badge variant={getStatusColor() as any} className="mb-4">
                {validacao.error || "Verificação concluída"}
              </Badge>
              
              {validacao.certificado && (
                <div className="text-center">
                  <p className="text-sm text-gray-600">Número do Certificado</p>
                  <p className="font-mono font-bold text-lg">
                    {validacao.certificado.numero_certificado}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Certificate Information */}
          {validacao.isValid && validacao.profile && validacao.certificado && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Informações do Certificado</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-xl font-semibold">{validacao.profile.nome_completo}</h3>
                  <p className="text-gray-600 mt-1">{validacao.certificado.eventos.titulo}</p>
                </div>

                {/* Event Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {validacao.certificado.eventos.local && (
                    <div>
                      <p className="text-sm text-gray-600">Local</p>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{validacao.certificado.eventos.local}</span>
                      </div>
                    </div>
                  )}
                  
                  {validacao.certificado.eventos.carga_horaria && (
                    <div>
                      <p className="text-sm text-gray-600">Carga Horária</p>
                      <p className="font-medium">{validacao.certificado.eventos.carga_horaria}h</p>
                    </div>
                  )}
                </div>

                {/* Date Information */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Data de Emissão</p>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {format(new Date(validacao.certificado.data_emissao), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Período do Evento</p>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {format(new Date(validacao.certificado.eventos.data_inicio), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(validacao.certificado.eventos.data_fim), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-600">
            <p>
              Esta validação foi realizada em {format(new Date(), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
            </p>
            <p className="mt-1">
              Sistema oficial de verificação da COMADEMIG
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidarCertificado;
