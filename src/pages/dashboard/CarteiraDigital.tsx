
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, User, RefreshCw, AlertCircle, CheckCircle, QrCode, Camera, Link as LinkIcon } from "lucide-react";
import { useCarteiraDigital } from "@/hooks/useCarteiraDigital";
import { useStorage } from "@/hooks/useStorage";
import { useAuth } from "@/contexts/AuthContext";
import { CarteiraDigitalCard } from "@/components/carteira/CarteiraDigitalCard";
import { QRCodeScanner } from "@/components/carteira/QRCodeScanner";
import CarteiraStatus from "@/components/carteira/CarteiraStatus";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ProfileData {
  nome_completo: string;
  cpf?: string;
  igreja?: string;
  cargo?: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  tipo_membro?: string;
}

const CarteiraDigital = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [validationUrl, setValidationUrl] = useState('');

  const {
    carteira,
    profile: rawProfile,
    isLoading,
    error,
    gerarCarteira,
    renovarCarteira,
    atualizarFoto,
    sincronizarFotoPerfil
  } = useCarteiraDigital();
  const { uploadFile } = useStorage();

  const profile = rawProfile as ProfileData | null;

  const handleUpdatePhoto = async (file: File) => {
    try {
      setIsUploadingPhoto(true);

      // Upload da foto para o storage
      const photoUrl = await uploadFile(
        file,
        'carteiras',
        `foto-${user?.id}-${Date.now()}`
      );

      if (photoUrl) {
        await atualizarFoto.mutateAsync(photoUrl);
        toast({
          title: "Foto atualizada",
          description: "A foto da carteira foi atualizada com sucesso",
        });
      } else {
        throw new Error('Falha no upload da imagem');
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload da foto:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível atualizar a foto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleScanSuccess = (url: string) => {
    // Extrair número da carteira da URL ou redirecionar diretamente
    if (url.includes('/validar-carteira/')) {
      window.open(url, '_blank');
    } else {
      // Se for apenas o número da carteira
      const numeroCarteira = url.replace(/.*\//, '');
      window.open(`/validar-carteira/${numeroCarteira}`, '_blank');
    }
  };

  const handleValidateByUrl = () => {
    if (!validationUrl.trim()) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida",
        variant: "destructive",
      });
      return;
    }

    // Verificar se é uma URL válida
    try {
      const url = new URL(validationUrl);
      if (url.pathname.includes('/validar-carteira/')) {
        window.open(validationUrl, '_blank');
        setValidationUrl('');
      } else {
        throw new Error('URL não é de validação de carteira');
      }
    } catch (error) {
      toast({
        title: "URL inválida",
        description: "A URL fornecida não é válida para validação de carteira",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title="Erro ao carregar carteira"
        message={error.message || "Ocorreu um erro inesperado"}
        retry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-comademig-blue mb-2">
          Identificação Eclesiástica
        </h1>
        <p className="text-gray-600">
          Sua carteira digital da COMADEMIG para identificação oficial
        </p>
      </div>

      <Tabs defaultValue="carteira" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="carteira" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Minha Carteira</span>
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Status</span>
          </TabsTrigger>
          <TabsTrigger value="validacao" className="flex items-center space-x-2">
            <QrCode className="h-4 w-4" />
            <span>Validação</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="carteira" className="space-y-6">
          {carteira && profile ? (
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <CarteiraDigitalCard
                  carteira={carteira}
                  onRenovar={() => renovarCarteira.mutate(undefined)}
                  onSincronizarFoto={() => sincronizarFotoPerfil.mutate(undefined)}
                  renovandoCarteira={renovarCarteira.isPending}
                  sincronizandoFoto={sincronizarFotoPerfil.isPending}
                />
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Informações Pessoais</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Nome Completo</p>
                        <p className="font-medium">{profile.nome_completo}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">CPF</p>
                        <p className="font-medium">{profile.cpf || 'Não informado'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Igreja</p>
                        <p className="font-medium">{profile.igreja || 'Não informado'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Cargo</p>
                        <p className="font-medium">{profile.cargo || 'Não informado'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Telefone</p>
                        <p className="font-medium">{profile.telefone || 'Não informado'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Localização</p>
                        <p className="font-medium">
                          {profile.cidade && profile.estado
                            ? `${profile.cidade}, ${profile.estado}`
                            : 'Não informado'
                          }
                        </p>
                      </div>
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Para alterar suas informações pessoais, acesse a seção "Meus Dados" no menu.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Nenhuma carteira encontrada
              </h3>
              <p className="text-gray-600 mb-6">
                Você ainda não possui uma carteira digital ativa.
              </p>
              <Button
                onClick={() => gerarCarteira.mutate(undefined)}
                disabled={gerarCarteira.isPending}
                className="bg-comademig-blue hover:bg-comademig-blue/90"
              >
                {gerarCarteira.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  'Gerar Carteira Digital'
                )}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="status">
          <CarteiraStatus
            carteira={carteira}
            onGerar={() => gerarCarteira.mutate(undefined)}
            onRenovar={() => renovarCarteira.mutate(undefined)}
            isLoading={gerarCarteira.isPending || renovarCarteira.isPending}
          />
        </TabsContent>

        <TabsContent value="validacao" className="space-y-6">
          {/* Validar outras carteiras */}
          <Card>
            <CardHeader>
              <CardTitle>Validar Carteira Digital</CardTitle>
              <CardDescription>
                Valide a autenticidade de uma carteira digital COMADEMIG
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Validação por QR Code */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Escanear QR Code
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Use a câmera do seu dispositivo para escanear o QR Code de uma carteira
                </p>
                <Button
                  onClick={() => setShowQRScanner(true)}
                  className="w-full sm:w-auto"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Abrir Scanner
                </Button>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Validar por URL
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Cole a URL de validação de uma carteira digital
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={validationUrl}
                    onChange={(e) => setValidationUrl(e.target.value)}
                    placeholder="https://exemplo.com/validar-carteira/COMADEMIG-..."
                    className="flex-1 px-3 py-2 border rounded-md text-sm"
                  />
                  <Button
                    onClick={handleValidateByUrl}
                    disabled={!validationUrl.trim()}
                  >
                    Validar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações sobre validação */}
          <Card>
            <CardHeader>
              <CardTitle>Como Funciona a Validação</CardTitle>
              <CardDescription>
                Entenda o processo de verificação de autenticidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <QrCode className="h-4 w-4" />
                <AlertDescription>
                  Cada carteira digital possui um QR Code único que permite validar sua autenticidade.
                  O código pode ser escaneado ou a URL pode ser acessada diretamente.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-medium">Processo de validação:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Escaneie o QR Code da carteira ou acesse a URL de validação</li>
                  <li>O sistema verificará automaticamente a autenticidade</li>
                  <li>Será exibido o status atual da carteira (ativa, expirada, etc.)</li>
                  <li>As informações do portador serão mostradas conforme autorizado</li>
                </ol>
              </div>

              {carteira && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">URL de validação da sua carteira:</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={carteira.qr_code}
                      readOnly
                      className="flex-1 text-xs bg-white border rounded px-2 py-1 font-mono"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(carteira.qr_code);
                        toast({
                          title: "URL copiada",
                          description: "Link de validação copiado para a área de transferência",
                        });
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Scanner de QR Code */}
      <QRCodeScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
};

export default CarteiraDigital;
