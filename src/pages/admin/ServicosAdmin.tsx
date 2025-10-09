import { useState } from 'react';
import { useServicos } from '@/hooks/useServicos';
import { useServicoExigencias } from '@/hooks/useServicoExigencias';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Search, Edit, Power, PowerOff, Loader2, Settings } from 'lucide-react';
import type { Servico } from '@/hooks/useServicos';
import { ServicoFormAdmin } from '@/components/admin/ServicoFormAdmin';
import { ExigenciasManager } from '@/components/admin/ExigenciasManager';

export default function ServicosAdmin() {
  const { servicos, isLoading, desativarServico, ativarServico } = useServicos();
  
  // States
  const [filtroCategoria, setFiltroCategoria] = useState<string>('all');
  const [filtroStatus, setFiltroStatus] = useState<string>('all');
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [modalExigencias, setModalExigencias] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null);
  const [modoEdicao, setModoEdicao] = useState(false);

  // Filtrar serviços
  const servicosFiltrados = servicos.filter((servico) => {
    const matchCategoria = filtroCategoria === 'all' || servico.categoria === filtroCategoria;
    const matchStatus = filtroStatus === 'all' || 
      (filtroStatus === 'ativo' && servico.is_active) ||
      (filtroStatus === 'inativo' && !servico.is_active);
    const matchBusca = servico.nome.toLowerCase().includes(busca.toLowerCase()) ||
      servico.descricao.toLowerCase().includes(busca.toLowerCase());
    
    return matchCategoria && matchStatus && matchBusca;
  });

  // Handlers
  const handleNovoServico = () => {
    setServicoSelecionado(null);
    setModoEdicao(false);
    setModalAberto(true);
  };

  const handleEditarServico = (servico: Servico) => {
    setServicoSelecionado(servico);
    setModoEdicao(true);
    setModalAberto(true);
  };

  const handleGerenciarExigencias = (servico: Servico) => {
    setServicoSelecionado(servico);
    setModalExigencias(true);
  };

  const handleToggleStatus = (servico: Servico) => {
    if (servico.is_active) {
      desativarServico(servico.id);
    } else {
      ativarServico(servico.id);
    }
  };

  const handleFecharModal = () => {
    setModalAberto(false);
    setServicoSelecionado(null);
    setModoEdicao(false);
  };

  const getCategoriaEmoji = (categoria: string) => {
    const emojis: Record<string, string> = {
      certidao: '📜',
      regularizacao: '⚖️',
      outros: '📋',
    };
    return emojis[categoria] || '📋';
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Serviços</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os serviços oferecidos pela plataforma
          </p>
        </div>
        <Button onClick={handleNovoServico}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Serviço
        </Button>
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
                  placeholder="Nome ou descrição..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Serviços */}
      <Card>
        <CardHeader>
          <CardTitle>Serviços Cadastrados</CardTitle>
          <CardDescription>
            {servicosFiltrados.length} serviço(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : servicosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum serviço encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servicosFiltrados.map((servico) => (
                    <TableRow key={servico.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{servico.nome}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {servico.descricao}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">
                          {getCategoriaEmoji(servico.categoria)} {servico.categoria}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          R$ {servico.valor.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>{servico.prazo}</TableCell>
                      <TableCell>
                        <Badge variant={servico.is_active ? 'default' : 'secondary'}>
                          {servico.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGerenciarExigencias(servico)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditarServico(servico)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(servico)}
                          >
                            {servico.is_active ? (
                              <PowerOff className="h-4 w-4 text-red-500" />
                            ) : (
                              <Power className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Criar/Editar Serviço */}
      <Dialog open={modalAberto} onOpenChange={handleFecharModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modoEdicao ? 'Editar Serviço' : 'Novo Serviço'}
            </DialogTitle>
          </DialogHeader>
          <ServicoFormAdmin
            servico={servicoSelecionado}
            onSuccess={handleFecharModal}
            onCancel={handleFecharModal}
          />
        </DialogContent>
      </Dialog>

      {/* Modal: Gerenciar Exigências */}
      <Dialog open={modalExigencias} onOpenChange={setModalExigencias}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Gerenciar Exigências - {servicoSelecionado?.nome}
            </DialogTitle>
          </DialogHeader>
          {servicoSelecionado && (
            <ExigenciasManager servicoId={servicoSelecionado.id} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
