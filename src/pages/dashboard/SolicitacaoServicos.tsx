import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useServicosPorCategoria } from '@/hooks/useServicos';
import { useSolicitacoes } from '@/hooks/useSolicitacoes';
import { useServicoExigencias } from '@/hooks/useServicoExigencias';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ServicoCard } from '@/components/servicos/ServicoCard';
import { ServicoForm } from '@/components/servicos/ServicoForm';
import { SolicitacaoCard } from '@/components/solicitacoes/SolicitacaoCard';
import { SolicitacaoDetalhes } from '@/components/solicitacoes/SolicitacaoDetalhes';
import { FileText, History, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Servico } from '@/hooks/useServicos';

export default function SolicitacaoServicos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // States
  const [categoriaAtiva, setCategoriaAtiva] = useState<'certidao' | 'regularizacao' | 'outros'>('certidao');
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null);
  const [modalFormularioAberto, setModalFormularioAberto] = useState(false);
  const [solicitacaoDetalhesId, setSolicitacaoDetalhesId] = useState<string | null>(null);

  // Queries
  const { data: servicosCertidao = [], isLoading: loadingCertidao } = useServicosPorCategoria('certidao');
  const { data: servicosRegularizacao = [], isLoading: loadingRegularizacao } = useServicosPorCategoria('regularizacao');
  const { data: servicosOutros = [], isLoading: loadingOutros } = useServicosPorCategoria('outros');
  const { solicitacoes, isLoading: loadingSolicitacoes } = useSolicitacoes(user?.id);
  const { exigencias, isLoading: loadingExigencias } = useServicoExigencias(servicoSelecionado?.id);

  // Handlers
  const handleSolicitarServico = (servico: Servico) => {
    setServicoSelecionado(servico);
    setModalFormularioAberto(true);
  };

  const handleSubmitFormulario = (dados: Record<string, any>) => {
    if (!servicoSelecionado) return;

    // Fechar modal
    setModalFormularioAberto(false);

    // Redirecionar para checkout com dados
    navigate('/dashboard/checkout-servico', {
      state: {
        servico: servicoSelecionado,
        dadosFormulario: dados,
      },
    });
  };

  const handleVerDetalhes = (id: string) => {
    setSolicitacaoDetalhesId(id);
  };

  const handleFecharDetalhes = () => {
    setSolicitacaoDetalhesId(null);
  };

  // Obter serviços da categoria ativa
  const getServicosAtivos = () => {
    switch (categoriaAtiva) {
      case 'certidao':
        return servicosCertidao;
      case 'regularizacao':
        return servicosRegularizacao;
      case 'outros':
        return servicosOutros;
      default:
        return [];
    }
  };

  const isLoadingServicos = () => {
    switch (categoriaAtiva) {
      case 'certidao':
        return loadingCertidao;
      case 'regularizacao':
        return loadingRegularizacao;
      case 'outros':
        return loadingOutros;
      default:
        return false;
    }
  };

  const servicosAtivos = getServicosAtivos();
  const solicitacaoDetalhes = solicitacoes.find(s => s.id === solicitacaoDetalhesId);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Solicitação de Serviços</h1>
        <p className="text-muted-foreground mt-2">
          Solicite certidões, regularizações e outros serviços
        </p>
      </div>

      {/* Tabs por Categoria */}
      <Tabs value={categoriaAtiva} onValueChange={(v) => setCategoriaAtiva(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="certidao">
            📜 Certidões
          </TabsTrigger>
          <TabsTrigger value="regularizacao">
            ⚖️ Regularização
          </TabsTrigger>
          <TabsTrigger value="outros">
            📋 Outros
          </TabsTrigger>
        </TabsList>

        <TabsContent value={categoriaAtiva} className="space-y-6 mt-6">
          {/* Serviços Disponíveis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Serviços Disponíveis
              </CardTitle>
              <CardDescription>
                Selecione o serviço que deseja solicitar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingServicos() ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : servicosAtivos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum serviço disponível nesta categoria</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {servicosAtivos.map((servico) => (
                    <ServicoCard
                      key={servico.id}
                      servico={servico}
                      onSolicitar={handleSolicitarServico}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Meu Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Meu Histórico
          </CardTitle>
          <CardDescription>
            Acompanhe suas solicitações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSolicitacoes ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : solicitacoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Você ainda não fez nenhuma solicitação</p>
              <p className="text-sm mt-2">
                Selecione um serviço acima para começar
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {solicitacoes.map((solicitacao) => (
                <SolicitacaoCard
                  key={solicitacao.id}
                  solicitacao={solicitacao}
                  onVerDetalhes={handleVerDetalhes}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Formulário de Solicitação */}
      <Dialog open={modalFormularioAberto} onOpenChange={setModalFormularioAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {servicoSelecionado?.nome}
            </DialogTitle>
          </DialogHeader>
          {servicoSelecionado && !loadingExigencias && (
            <ServicoForm
              exigencias={exigencias}
              onSubmit={handleSubmitFormulario}
              onCancel={() => setModalFormularioAberto(false)}
            />
          )}
          {loadingExigencias && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Detalhes da Solicitação */}
      <Dialog open={!!solicitacaoDetalhesId} onOpenChange={handleFecharDetalhes}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
          </DialogHeader>
          {solicitacaoDetalhes && (
            <SolicitacaoDetalhes 
              solicitacao={{
                ...solicitacaoDetalhes,
                servico: {
                  ...solicitacaoDetalhes.servico,
                  descricao: '',
                },
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
