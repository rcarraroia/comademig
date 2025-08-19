
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calendar, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CarteiraStatusProps {
  carteira?: {
    status: string;
    data_validade: string;
    data_emissao: string;
  } | null;
  onGerar: () => void;
  onRenovar: () => void;
  isLoading?: boolean;
}

const CarteiraStatus = ({ carteira, onGerar, onRenovar, isLoading }: CarteiraStatusProps) => {
  if (!carteira) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span>Carteira Digital Não Encontrada</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você ainda não possui uma carteira digital ativa. Gere sua carteira para ter acesso 
              à identificação eclesiástica digital da COMADEMIG.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={onGerar} 
            disabled={isLoading}
            className="w-full bg-comademig-blue hover:bg-comademig-blue/90"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              'Gerar Carteira Digital'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const dataValidade = new Date(carteira.data_validade);
  const agora = new Date();
  const expiraEm30Dias = addDays(agora, 30);
  
  const isExpirada = isBefore(dataValidade, agora);
  const expiraEmBreve = isAfter(dataValidade, agora) && isBefore(dataValidade, expiraEm30Dias);
  const isAtiva = !isExpirada && !expiraEmBreve;

  const getStatusIcon = () => {
    if (isExpirada) return <XCircle className="h-5 w-5 text-red-500" />;
    if (expiraEmBreve) return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getStatusTitle = () => {
    if (isExpirada) return 'Carteira Expirada';
    if (expiraEmBreve) return 'Carteira Expirando em Breve';
    return 'Carteira Ativa';
  };

  const getStatusBadge = () => {
    if (isExpirada) return <Badge variant="destructive">Expirada</Badge>;
    if (expiraEmBreve) return <Badge variant="warning">Expira em Breve</Badge>;
    return <Badge variant="success">Ativa</Badge>;
  };

  const getStatusMessage = () => {
    if (isExpirada) {
      return 'Sua carteira digital expirou. Renove agora para continuar usando sua identificação eclesiástica.';
    }
    if (expiraEmBreve) {
      return `Sua carteira expira em breve (${format(dataValidade, 'dd/MM/yyyy', { locale: ptBR })}). Renove agora para evitar interrupções.`;
    }
    return `Sua carteira está ativa e válida até ${format(dataValidade, 'dd/MM/yyyy', { locale: ptBR })}.`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span>{getStatusTitle()}</span>
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={isExpirada ? 'destructive' : expiraEmBreve ? 'default' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {getStatusMessage()}
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Data de Emissão</p>
            <p className="font-medium">
              {format(new Date(carteira.data_emissao), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Válida até</p>
            <p className="font-medium">
              {format(dataValidade, 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
        </div>

        {(isExpirada || expiraEmBreve) && (
          <Button 
            onClick={onRenovar} 
            disabled={isLoading}
            className="w-full bg-comademig-gold hover:bg-comademig-gold/90"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Renovando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Renovar Carteira
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default CarteiraStatus;
