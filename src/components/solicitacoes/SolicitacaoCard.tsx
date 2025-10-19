import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Eye } from 'lucide-react';
import { getStatusColor, getStatusLabel } from '@/hooks/useSolicitacoes';
import type { SolicitacaoComServico } from '@/hooks/useSolicitacoes';

// ============================================================================
// TYPES
// ============================================================================

interface SolicitacaoCardProps {
  solicitacao: SolicitacaoComServico;
  onVerDetalhes: (id: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SolicitacaoCard({ solicitacao, onVerDetalhes }: SolicitacaoCardProps) {
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getCategoriaEmoji = (categoria: string) => {
    const emojis: Record<string, string> = {
      certidao: '📜',
      regularizacao: '⚖️',
    };
    return emojis[categoria] || '📋';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Conteúdo Principal */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg">
                    {getCategoriaEmoji(solicitacao.servico.categoria)} {solicitacao.servico.nome}
                  </h3>
                  <Badge className={getStatusColor(solicitacao.status)}>
                    {getStatusLabel(solicitacao.status)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Protocolo: <span className="font-mono font-medium">{solicitacao.protocolo}</span>
                </p>
              </div>
            </div>

            {/* Informações */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Solicitado em</p>
                  <p className="font-medium">{formatarData(solicitacao.created_at)}</p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground">Valor pago</p>
                <p className="font-medium text-lg">
                  R$ {solicitacao.valor_pago.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Forma de Pagamento */}
            {solicitacao.forma_pagamento && (
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-muted rounded">
                  {solicitacao.forma_pagamento === 'pix' && '💳 PIX'}
                  {solicitacao.forma_pagamento === 'cartao' && '💳 Cartão'}
                  {solicitacao.forma_pagamento === 'boleto' && '📄 Boleto'}
                </span>
              </div>
            )}

            {/* Data de Conclusão */}
            {solicitacao.data_conclusao && (
              <div className="text-sm text-muted-foreground">
                Concluído em {formatarData(solicitacao.data_conclusao)}
              </div>
            )}
          </div>

          {/* Botão Ver Detalhes */}
          <Button
            onClick={() => onVerDetalhes(solicitacao.id)}
            variant="outline"
            size="sm"
            className="shrink-0"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
