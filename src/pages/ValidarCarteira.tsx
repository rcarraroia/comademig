
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

interface CarteiraData {
  id: string;
  numero_carteira: string;
  qr_code: string;
  data_emissao: string;
  data_validade: string;
  status: string;
  foto_url?: string;
  user_id: string;
}

interface ProfileData {
  nome_completo: string;
  igreja?: string;
  cargo?: string;
  cidade?: string;
  estado?: string;
  tipo_membro?: string;
}

interface CarteiraValidacao {
  carteira: CarteiraData | null;
  profile: ProfileData | null;
  isValid: boolean;
  error?: string;
}

const ValidarCarteira = () => {
  const { numeroCarteira } = useParams<{ numeroCarteira: string }>();
  const [validacao, setValidacao] = useState<CarteiraValidacao | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validarCarteira = async () => {
      if (!numeroCarteira) {
        setValidacao({
          carteira: null,
          profile: null,
          isValid: false,
          error: "Número da carteira não fornecido"
        });
        setIsLoading(false);
        return;
      }

      try {
        // First, get the carteira
        const { data: carteira, error: carteiraError } = await (supabase as any)
          .from('carteira_digital')
          .select('*')
          .eq('numero_carteira', numeroCarteira)
          .eq('status', 'ativa')
          .single();

        if (carteiraError || !carteira) {
          setValidacao({
            carteira: null,
            profile: null,
            isValid: false,
            error: "Carteira não encontrada ou inválida"
          });
          setIsLoading(false);
          return;
        }

        // Then get the profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('nome_completo, igreja, cargo, cidade, estado, tipo_membro')
          .eq('id', carteira.user_id)
          .single();

        if (profileError || !profile) {
          setValidacao({
            carteira: carteira,
            profile: null,
            isValid: false,
            error: "Perfil do usuário não encontrado"
          });
          setIsLoading(false);
          return;
        }

        // Check if carteira is still valid (not expired)
        const isValid = new Date(carteira.data_validade) > new Date();

        setValidacao({
          carteira: carteira,
          profile: profile,
          isValid: isValid && carteira.status === 'ativa',
          error: isValid ? undefined : "Carteira expirada"
        });

      } catch (error) {
        console.error('Erro ao validar carteira:', error);
        setValidacao({
          carteira: null,
          profile: null,
          isValid: false,
          error: "Erro interno ao validar carteira"
        });
      } finally {
        setIsLoading(false);
      }
    };

    validarCarteira();
  }, [numeroCarteira]);

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
              Não foi possível validar a carteira digital.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (validacao.isValid) {
      return <CheckCircle className="h-16 w-16 text-green-500" />;
    } else if (validacao.error?.includes("expirada")) {
      return <AlertCircle className="h-16 w-16 text-yellow-500" />;
    } else {
      return <XCircle className="h-16 w-16 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    if (validacao.isValid) return "success";
    if (validacao.error?.includes("expirada")) return "warning";
    return "destructive";
  };

  const getStatusLabel = () => {
    if (validacao.isValid) return "Carteira Válida";
    if (validacao.error?.includes("expirada")) return "Carteira Expirada";
    return "Carteira Inválida";
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
              Validação de Carteira Digital
            </h1>
            <p className="text-gray-600">
              Verificação de autenticidade da identificação eclesiástica
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
              
              {validacao.carteira && (
                <div className="text-center">
                  <p className="text-sm text-gray-600">Número da Carteira</p>
                  <p className="font-mono font-bold text-lg">
                    {validacao.carteira.numero_carteira}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Information */}
          {validacao.isValid && validacao.profile && validacao.carteira && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Informações do Portador</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar and Basic Info */}
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={validacao.carteira.foto_url} />
                    <AvatarFallback className="bg-comademig-blue text-white text-lg">
                      {validacao.profile.nome_completo?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{validacao.profile.nome_completo}</h3>
                    {validacao.profile.tipo_membro && (
                      <Badge variant="outline" className="mt-1">
                        {validacao.profile.tipo_membro}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {validacao.profile.cargo && (
                    <div>
                      <p className="text-sm text-gray-600">Cargo</p>
                      <p className="font-medium">{validacao.profile.cargo}</p>
                    </div>
                  )}
                  
                  {validacao.profile.igreja && (
                    <div>
                      <p className="text-sm text-gray-600">Igreja</p>
                      <p className="font-medium">{validacao.profile.igreja}</p>
                    </div>
                  )}
                  
                  {validacao.profile.cidade && validacao.profile.estado && (
                    <div>
                      <p className="text-sm text-gray-600">Localização</p>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {validacao.profile.cidade}, {validacao.profile.estado}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Validity Information */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Data de Emissão</p>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {format(new Date(validacao.carteira.data_emissao), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Válida até</p>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {format(new Date(validacao.carteira.data_validade), 'dd/MM/yyyy', { locale: ptBR })}
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

export default ValidarCarteira;
