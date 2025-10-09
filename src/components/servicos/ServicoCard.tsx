import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CreditCard, DollarSign } from 'lucide-react';
import type { Servico } from '@/hooks/useServicos';

// ============================================================================
// TYPES
// ============================================================================

interface ServicoCardProps {
  servico: Servico;
  onSolicitar?: (servico: Servico) => void;
  variant?: 'default' | 'compact';
  showCategory?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ServicoCard({ 
  servico, 
  onSolicitar, 
  variant = 'default',
  showCategory = true 
}: ServicoCardProps) {
  
  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      certidao: 'Certidão',
      regularizacao: 'Regularização',
      outros: 'Outros',
    };
    return labels[categoria] || categoria;
  };

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      certidao: 'bg-blue-100 text-blue-800',
      regularizacao: 'bg-green-100 text-green-800',
      outros: 'bg-gray-100 text-gray-800',
    };
    return colors[categoria] || 'bg-gray-100 text-gray-800';
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  if (variant === 'compact') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{servico.nome}</CardTitle>
              {showCategory && (
                <Badge className={`mt-2 ${getCategoriaColor(servico.categoria)}`}>
                  {getCategoriaLabel(servico.categoria)}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {formatarValor(servico.valor)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardFooter className="pt-0">
          <Button 
            onClick={() => onSolicitar?.(servico)} 
            className="w-full"
            disabled={!servico.is_active}
          >
            {servico.is_active ? 'Solicitar' : 'Indisponível'}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{servico.nome}</CardTitle>
            <CardDescription className="mt-2">{servico.descricao}</CardDescription>
          </div>
          {showCategory && (
            <Badge className={getCategoriaColor(servico.categoria)}>
              {getCategoriaLabel(servico.categoria)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações do serviço */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prazo */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{servico.prazo}</span>
          </div>

          {/* Valor */}
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold text-primary">
              {formatarValor(servico.valor)}
            </span>
          </div>
        </div>

        {/* Formas de pagamento */}
        <div className="flex flex-wrap gap-2">
          {servico.aceita_pix && (
            <Badge variant="outline" className="bg-green-50">
              <CreditCard className="h-3 w-3 mr-1" />
              PIX (5% desconto)
            </Badge>
          )}
          {servico.aceita_cartao && (
            <Badge variant="outline" className="bg-blue-50">
              <CreditCard className="h-3 w-3 mr-1" />
              Cartão até {servico.max_parcelas}x
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          onClick={() => onSolicitar?.(servico)} 
          className="w-full"
          size="lg"
          disabled={!servico.is_active}
        >
          {servico.is_active ? 'Solicitar Serviço' : 'Serviço Indisponível'}
        </Button>
      </CardFooter>
    </Card>
  );
}
