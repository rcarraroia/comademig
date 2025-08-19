
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, AlertCircle, Calendar, MapPin, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface CarteiraValidacao {
  id: string;
  numero_carteira: string;
  data_emissao: string;
  data_validade: string;
  status: string;
  foto_url?: string;
  profile: {
    nome_completo: string;
    igreja?: string;
    cargo?: string;
    cidade?: string;
    estado?: string;
    tipo_membro?: string;
  };
}

const ValidarCarteira = () => {
  const { numeroCarteira } = useParams<{ numeroCarteira: string }>();
  const [carteira, setCarteira] = useState<CarteiraValidacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validarCarteira = async () => {
      if (!numeroCarteira) {
        setError('Número da carteira não fornecido');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('carteira_digital')
          .select(`
            *,
            profiles (
              nome_completo,
              igreja,
              cargo,
              cidade,
              estado,
              tipo_membro
            )
          `)
          .eq('numero_carteira', numeroCarteira)
          .single();

        if (error) {
          throw error;
        }

        setCarteira({
          ...data,
          profile: data.profiles
        } as CarteiraValidacao);
      } catch (error: any) {
        console.error('Erro ao validar carteira:', error);
        setError(error.message === 'No rows returned by the query.' 
          ? 'Carteira não encontrada' 
          : 'Erro ao validar carteira');
      } finally {
        setLoading(false);
      }
    };

    validarCarteira();
  }, [numeroCarteira]);

  const getStatusInfo = (status: string, dataValidade: string) => {
    const agora = new Date();
    const validade = new Date(dataValidade);
    const isExpirada = validade < agora;

    if (status !== 'ativa' || isExpirada) {
      return {
        icon: <XCircle className="h-6 w-6 text-red-500" />,
        badge: <Badge variant="destructive">Inválida</Badge>,
        message: 'Esta carteira não é válida ou está expirada',
        color: 'border-red-200 bg-red-50'
      };
    }

    return {
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
      badge: <Badge variant="success">Válida</Badge>,
      message: 'Esta carteira é válida e autêntica',
      color: 'border-green-200 bg-green-50'
    };
  };

  const getTipoMembroLabel = (tipo: string) => {
    switch (tipo) {
      case 'pastor': return 'Pastor';
      case 'evangelista': return 'Evangelista';
      case 'presbitero': return 'Presbítero';
      case 'diacono': return 'Diácono';
      case 'obreiro': return 'Obreiro';
      case 'membro': return 'Membro';
      default: return 'Membro';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Validando carteira...</p>
        </div>
      </div>
    );
  }

  if (error || !carteira) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <XCircle className="h-6 w-6" />
              <span>Carteira Inválida</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Carteira não encontrada ou inválida.'}
              </AlertDescription>
            </Alert>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Número da carteira: <span className="font-mono">{numeroCarteira}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(carteira.status, carteira.data_validade);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto py-4 px-4">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/3b224a34-6b1d-42ce-9831-77c118c82d27.png" 
              alt="COMADEMIG" 
              className="h-8 w-auto"
            />
            <div>
              <h1 className="font-bold text-lg text-comademig-blue">COMADEMIG</h1>
              <p className="text-sm text-gray-600">Validação de Carteira Digital</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-2xl mx-auto py-8">
        <Card className={`${statusInfo.color} border-2`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {statusInfo.icon}
                <span>Validação de Carteira</span>
              </div>
              {statusInfo.badge}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {statusInfo.message}
              </AlertDescription>
            </Alert>

            {/* Informações do Portador */}
            <div className="flex items-start space-x-4">
              <Avatar className="h-20 w-20 border-2 border-comademig-blue">
                <AvatarImage src={carteira.foto_url} />
                <AvatarFallback className="bg-comademig-blue text-white text-lg font-bold">
                  {carteira.profile.nome_completo?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h3 className="font-bold text-xl text-gray-900">
                  {carteira.profile.nome_completo}
                </h3>
                <p className="text-comademig-blue font-medium">
                  {getTipoMembroLabel(carteira.profile.tipo_membro || 'membro')}
                </p>
                {carteira.profile.cargo && (
                  <p className="text-gray-600">{carteira.profile.cargo}</p>
                )}
              </div>
            </div>

            {/* Informações da Igreja */}
            {carteira.profile.igreja && (
              <div className="bg-white/50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="h-4 w-4 text-comademig-blue" />
                  <h4 className="font-medium">Igreja</h4>
                </div>
                <p className="font-medium">{carteira.profile.igreja}</p>
                {carteira.profile.cidade && carteira.profile.estado && (
                  <p className="text-sm text-gray-600">
                    {carteira.profile.cidade}, {carteira.profile.estado}
                  </p>
                )}
              </div>
            )}

            {/* Informações da Carteira */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Número da Carteira</p>
                <p className="font-mono font-bold">{carteira.numero_carteira}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Data de Emissão</p>
                <p className="font-medium">
                  {format(new Date(carteira.data_emissao), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Válida até</p>
                <p className="font-medium">
                  {format(new Date(carteira.data_validade), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Rodapé */}
            <div className="border-t pt-4 text-center text-xs text-gray-500">
              <p>Validação realizada em {format(new Date(), 'dd/MM/yyyy às HH:mm', { locale: ptBR })}</p>
              <p className="mt-1">
                Esta validação confirma a autenticidade da carteira digital emitida pela COMADEMIG
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ValidarCarteira;
