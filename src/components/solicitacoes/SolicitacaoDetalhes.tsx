import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  User, 
  Calendar, 
  DollarSign, 
  Download, 
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { getStatusColor, getStatusLabel } from '@/hooks/useSolicitacoes';
import type { Solicitacao } from '@/hooks/useSolicitacoes';

// ============================================================================
// TYPES
// ============================================================================

interface SolicitacaoDetalhesProps {
  solicitacao: Solicitacao & {
    servico?: {
      nome: string;
      categoria: string;
      descricao: string;
    };
    usuario?: {
      nome_completo: string;
      email: string;
      telefone?: string;
    };
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SolicitacaoDetalhes({ solicitacao }: SolicitacaoDetalhesProps) {
  const formatarData = (data: string | null) => {
    if (!data) return '-';
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: Solicitacao['status']) => {
    const icons = {
      pago: <CheckCircle2 className="h-5 w-5 text-blue-500" />,
      em_analise: <Clock className="h-5 w-5 text-yellow-500" />,
      aprovada: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      rejeitada: <XCircle className="h-5 w-5 text-red-500" />,
      entregue: <CheckCircle2 className="h-5 w-5 text-purple-500" />,
      cancelada: <AlertCircle className="h-5 w-5 text-gray-500" />,
    };
    return icons[status];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {solicitacao.servico?.nome || 'Solicitação'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Protocolo: <span className="font-mono font-medium">{solicitacao.protocolo}</span>
              </p>
            </div>
            <Badge className={getStatusColor(solicitacao.status)}>
              {getStatusLabel(solicitacao.status)}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Informações do Serviço */}
      {solicitacao.servico && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações do Serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{solicitacao.servico.nome}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Categoria</p>
              <p className="font-medium capitalize">{solicitacao.servico.categoria}</p>
            </div>
            {solicitacao.servico.descricao && (
              <div>
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p className="text-sm">{solicitacao.servico.descricao}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dados Enviados */}
      {solicitacao.dados_enviados && Object.keys(solicitacao.dados_enviados).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados Enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(solicitacao.dados_enviados).map(([chave, valor]) => (
                <div key={chave}>
                  <p className="text-sm text-muted-foreground capitalize">
                    {chave.replace(/_/g, ' ')}
                  </p>
                  <p className="font-medium break-words">
                    {typeof valor === 'object' ? JSON.stringify(valor) : String(valor)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Valor Pago</p>
              <p className="text-2xl font-bold text-primary">
                R$ {solicitacao.valor_pago.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
              <p className="font-medium capitalize">
                {solicitacao.forma_pagamento || '-'}
              </p>
            </div>
          </div>
          {solicitacao.payment_reference && (
            <div>
              <p className="text-sm text-muted-foreground">Referência</p>
              <p className="font-mono text-sm">{solicitacao.payment_reference}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline de Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Histórico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Criação */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div className="w-px h-full bg-border mt-2" />
              </div>
              <div className="pb-4">
                <p className="font-medium">Solicitação Criada</p>
                <p className="text-sm text-muted-foreground">
                  {formatarData(solicitacao.created_at)}
                </p>
              </div>
            </div>

            {/* Pagamento */}
            {solicitacao.data_pagamento && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  {(solicitacao.data_analise || solicitacao.data_conclusao) && (
                    <div className="w-px h-full bg-border mt-2" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="font-medium">Pagamento Confirmado</p>
                  <p className="text-sm text-muted-foreground">
                    {formatarData(solicitacao.data_pagamento)}
                  </p>
                </div>
              </div>
            )}

            {/* Análise */}
            {solicitacao.data_analise && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </div>
                  {solicitacao.data_conclusao && (
                    <div className="w-px h-full bg-border mt-2" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="font-medium">Em Análise</p>
                  <p className="text-sm text-muted-foreground">
                    {formatarData(solicitacao.data_analise)}
                  </p>
                </div>
              </div>
            )}

            {/* Conclusão */}
            {solicitacao.data_conclusao && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  {getStatusIcon(solicitacao.status)}
                </div>
                <div>
                  <p className="font-medium">{getStatusLabel(solicitacao.status)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatarData(solicitacao.data_conclusao)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Observações do Admin */}
      {solicitacao.observacoes_admin && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-base">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{solicitacao.observacoes_admin}</p>
          </CardContent>
        </Card>
      )}

      {/* Arquivo de Entrega */}
      {solicitacao.arquivo_entrega && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-base">Arquivo Disponível</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={solicitacao.arquivo_entrega} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Baixar Arquivo
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Informações do Usuário (apenas para admin) */}
      {solicitacao.usuario && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Solicitante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{solicitacao.usuario.nome_completo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{solicitacao.usuario.email}</p>
            </div>
            {solicitacao.usuario.telefone && (
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{solicitacao.usuario.telefone}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
