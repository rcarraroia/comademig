
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, FileText, Calendar, User, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface CertidaoData {
  id: string;
  tipo_certidao: string;
  numero_protocolo: string;
  status: string;
  data_solicitacao: string;
  data_aprovacao?: string;
  arquivo_pdf?: string;
  profiles?: {
    nome_completo: string;
    cpf: string;
    cargo: string;
    igreja: string;
  } | null;
}

const ValidarCertidao = () => {
  const { numeroProtocolo } = useParams<{ numeroProtocolo: string }>();
  const [certidao, setCertidao] = useState<CertidaoData | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validarCertidao = async () => {
      if (!numeroProtocolo) {
        setIsValid(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('solicitacoes_certidoes')
          .select(`
            *,
            profiles (
              nome_completo,
              cpf,
              cargo,
              igreja
            )
          `)
          .eq('numero_protocolo', numeroProtocolo)
          .eq('status', 'aprovada')
          .single();

        if (error || !data) {
          setIsValid(false);
          setCertidao(null);
        } else {
          setIsValid(true);
          // Transform the data to handle the profiles relation properly
          const transformedData: CertidaoData = {
            ...data,
            profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
          };
          setCertidao(transformedData);
        }
      } catch (error) {
        console.error('Erro ao validar certidão:', error);
        setIsValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    validarCertidao();
  }, [numeroProtocolo]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getStatusIcon = () => {
    if (isValid) {
      return <CheckCircle className="h-16 w-16 text-green-500" />;
    }
    return <XCircle className="h-16 w-16 text-red-500" />;
  };

  const getStatusLabel = () => {
    return isValid ? "Certidão Válida" : "Certidão Inválida";
  };

  const getStatusDescription = () => {
    if (isValid) {
      return "Esta certidão é autêntica e foi emitida pela COMADEMIG";
    }
    return "Certidão não encontrada ou inválida";
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
              Validação de Certidão
            </h1>
            <p className="text-gray-600">
              Verificação de autenticidade de certidão emitida pela COMADEMIG
            </p>
          </div>

          {/* Status Card */}
          <Card className="mb-6">
            <CardContent className="flex flex-col items-center py-8">
              {getStatusIcon()}
              <h2 className="text-xl font-semibold text-gray-900 mb-2 mt-4">
                {getStatusLabel()}
              </h2>
              <Badge variant={isValid ? "default" : "destructive"} className="mb-4">
                {getStatusDescription()}
              </Badge>
              
              {numeroProtocolo && (
                <div className="text-center">
                  <p className="text-sm text-gray-600">Protocolo consultado</p>
                  <p className="font-mono font-bold text-lg">
                    {numeroProtocolo}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Certificate Information */}
          {isValid && certidao && certidao.profiles && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Informações da Certidão</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <h3 className="text-lg font-semibold">{certidao.profiles.nome_completo}</h3>
                  </div>
                  <p className="text-gray-600">CPF: {certidao.profiles.cpf}</p>
                </div>

                {/* Church Info */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Informações Ministeriais</span>
                  </div>
                  <p className="text-gray-600">Cargo: {certidao.profiles.cargo}</p>
                  <p className="text-gray-600">Igreja: {certidao.profiles.igreja}</p>
                </div>

                {/* Certificate Details */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Detalhes da Certidão</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Tipo</p>
                      <p className="font-medium">{certidao.tipo_certidao}</p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-600">Data de Emissão</p>
                      </div>
                      <p className="font-medium">
                        {certidao.data_aprovacao ? 
                          new Date(certidao.data_aprovacao).toLocaleDateString('pt-BR') :
                          new Date(certidao.data_solicitacao).toLocaleDateString('pt-BR')
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Download Link */}
                {certidao.arquivo_pdf && (
                  <div className="border-t pt-4">
                    <a
                      href={certidao.arquivo_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-comademig-blue text-white rounded hover:bg-comademig-blue/90 transition-colors"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Visualizar Certidão Original
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-600">
            <p>
              Esta validação foi realizada em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
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

export default ValidarCertidao;
