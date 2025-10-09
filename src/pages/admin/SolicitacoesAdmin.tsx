import { useState } from 'react';
import { useSolicitacoesAdmin } from '@/hooks/useSolicitacoes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Eye, Loader2, FileText } from 'lucide-react';
import { getStatusColor, getStatusLabel } from '@/hooks/useSolicitacoes';
import { SolicitacaoDetalhes } from '@/components/solicitacoes/SolicitacaoDetalhes';
import { GerenciarSolicitacao } from '@/components/admin/GerenciarSolicitacao';
import type { AdminFilters } from '@/hooks/useSolicitacoes';

export default function SolicitacoesAdmin() {
  // States
  const [filtros, setFiltros] = useState<AdminFilters>({});
  const [busca, setBusca] = useState('');
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState<any>(null);
  const [modalDetalhes, setModalDetalhes] = useState(false);

  // Query
  const { solicitacoes, isLoading } = useSolicitacoesAdmin(filtros);

  // Filtrar por busca local
  const solicitacoesFiltradas = solicitacoes.filter((sol) => {
    if (!busca) return true;
    const buscaLower = busca.toLowerCase();
    return (
      sol.protocolo.toLowerCase().includes(buscaLower) ||
      sol.usuario.nome_completo.toLowerCase().includes(buscaLower) ||
      sol.servico.nome.toLowerCase().includes(buscaLower)
    );
  });

  // Handlers
  const handleVerDetalhes = (solicitacao: any) => {
    setSolicitacaoSelecionada(solicitacao);
    setModalDetalhes(true);
  };

  const handleFecharModal = () => {
    setModalDetalhes(false);
    setSolicitacaoSelecionada(null);
  };

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
      outros: '📋',
    };
    return emojis[categoria] || '📋';
  };

  // Estatísticas
  const stats = {
    total: solicitacoes.length,
    pago: solicitacoes.filter(s => s.status === 'pago').length,
    em_analise: solicitacoes.filter(s => s.status === 'em_analise').length,
    entregue: solicitacoes.filter(s => s.status === 'entregue').length,
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Gestão de Solicitações</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie todas as solicitações de serviços
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.pago}</div>
            <p className="text-sm text-muted-foreground">Pagas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.em_analise}</div>
            <p className="text-sm text-muted-foreground">Em Análise</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.entregue}</div>
            <p className="text-sm text-muted-foreground">Entregues</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Protocolo, usuário ou serviço..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filtros.status || 'all'}
                onValueChange={(value) => setFiltros({ ...filtros, status: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="aprovada">Aprovada</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                  <SelectItem value="rejeitada">Rejeitada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select
                value={filtros.categoria || 'all'}
                onValueChange={(value) => setFiltros({ ...filtros, categoria: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="certidao">📜 Certidões</SelectItem>
                  <SelectItem value="regularizacao">⚖️ Regularização</SelectItem>
                  <SelectItem value="outros">📋 Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Solicitações */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitações</CardTitle>
          <CardDescription>
            {solicitacoesFiltradas.length} solicitação(ões) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : solicitacoesFiltradas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma solicitação encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solicitacoesFiltradas.map((solicitacao) => (
                    <TableRow key={solicitacao.id}>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {solicitacao.protocolo}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{solicitacao.usuario.nome_completo}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {getCategoriaEmoji(solicitacao.servico.categoria)} {solicitacao.servico.nome}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {solicitacao.servico.categoria}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(solicitacao.status)}>
                          {getStatusLabel(solicitacao.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          R$ {solicitacao.valor_pago.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatarData(solicitacao.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVerDetalhes(solicitacao)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Detalhes e Gerenciamento */}
      <Dialog open={modalDetalhes} onOpenChange={handleFecharModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Solicitação</DialogTitle>
          </DialogHeader>
          {solicitacaoSelecionada && (
            <GerenciarSolicitacao
              solicitacao={solicitacaoSelecionada}
              onClose={handleFecharModal}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
