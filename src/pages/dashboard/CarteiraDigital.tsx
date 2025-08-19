
import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CreditCard, User, Calendar, Download, RefreshCw, AlertCircle, CheckCircle, QrCode } from "lucide-react";
import { useCarteiraDigital } from "@/hooks/useCarteiraDigital";
import { useStorage } from "@/hooks/useStorage";
import { useAuth } from "@/contexts/AuthContext";
import CarteiraDigitalCard from "@/components/carteira/CarteiraDigitalCard";
import CarteiraStatus from "@/components/carteira/CarteiraStatus";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";

const CarteiraDigital = () => {
  const { user } = useAuth();
  const { 
    carteira, 
    profile, 
    isLoading, 
    error, 
    gerarCarteira, 
    renovarCarteira, 
    atualizarFoto 
  } = useCarteiraDigital();
  const { uploadFile } = useStorage();

  const handleUpdatePhoto = async (file: File) => {
    try {
      const photoUrl = await uploadFile(file, 'carteiras', `foto-${user?.id}-${Date.now()}`);
      if (photoUrl) {
        atualizarFoto.mutate(photoUrl);
      }
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorMessage
          title="Erro ao carregar carteira"
          message={error.message || "Ocorreu um erro inesperado"}
          retry={() => window.location.reload()}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
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
                    profile={profile}
                    userEmail={user?.email}
                    onUpdatePhoto={handleUpdatePhoto}
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
                  onClick={() => gerarCarteira.mutate()}
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
              onGerar={() => gerarCarteira.mutate()}
              onRenovar={() => renovarCarteira.mutate()}
              isLoading={gerarCarteira.isPending || renovarCarteira.isPending}
            />
          </TabsContent>

          <TabsContent value="validacao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Validação de Autenticidade</CardTitle>
                <CardDescription>
                  Informações sobre como validar carteiras digitais
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
                  <h4 className="font-medium">Como funciona a validação:</h4>
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
                        className="flex-1 text-xs bg-white border rounded px-2 py-1"
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(carteira.qr_code)}
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
      </div>
    </DashboardLayout>
  );
};

export default CarteiraDigital;
