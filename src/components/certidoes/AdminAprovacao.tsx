
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, CheckCircle, XCircle, FileText, CreditCard } from "lucide-react";
import { useCertidoesWithPayment } from "@/hooks/useCertidoesWithPayment";
import { useCertidoesPDF } from "@/hooks/useCertidoesPDF";

interface SolicitacaoDetalhes {
  id: string;
  tipo_certidao: string;
  justificativa: string;
  numero_protocolo: string;
  data_solicitacao: string;
  status: string;
  payment_reference?: string;
  valor?: number;
  profiles?: {
    nome_completo: string;
    cpf: string;
    cargo: string;
    igreja: string;
  };
}

interface AdminAprovacaoProps {
  solicitacao: SolicitacaoDetalhes;
  onStatusChange: () => void;
}

export const AdminAprovacao = ({ solicitacao, onStatusChange }: AdminAprovacaoProps) => {
  const [observacoes, setObservacoes] = useState("");
  const [showModal, setShowModal] = useState(false);
  const { atualizarStatusCertidao } = useCertidoesWithPayment();
  const { gerarCertidaoPDF } = useCertidoesPDF();

  const handleAprovar = async () => {
    if (!solicitacao.profiles) return;

    try {
      // Gerar PDF da certidão
      await gerarCertidaoPDF.mutateAsync({
        solicitacaoId: solicitacao.id,
        dadosUsuario: {
          nome: solicitacao.profiles.nome_completo,
          cpf: solicitacao.profiles.cpf || '',
          cargo: solicitacao.profiles.cargo || '',
          igreja: solicitacao.profiles.igreja || ''
        },
        tipoCertidao: solicitacao.tipo_certidao,
        numeroProtocolo: solicitacao.numero_protocolo
      });

      setShowModal(false);
      setObservacoes("");
      onStatusChange();
    } catch (error) {
      console.error('Erro ao aprovar certidão:', error);
    }
  };

  const handleRejeitar = async () => {
    try {
      await atualizarStatusCertidao.mutateAsync({
        id: solicitacao.id,
        status: 'rejeitada',
        observacoes: observacoes.trim() || 'Solicitação rejeitada'
      });

      setShowModal(false);
      setObservacoes("");
      onStatusChange();
    } catch (error) {
      console.error('Erro ao rejeitar certidão:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pago: <Badge className="bg-blue-100 text-blue-800">Pago</Badge>,
      pendente: <Badge variant="secondary">Pendente</Badge>,
      em_analise: <Badge className="bg-yellow-100 text-yellow-800">Em Análise</Badge>,
      aprovada: <Badge className="bg-green-100 text-green-800">Aprovada</Badge>,
      rejeitada: <Badge className="bg-red-100 text-red-800">Rejeitada</Badge>,
      entregue: <Badge className="bg-purple-100 text-purple-800">Entregue</Badge>,
    };
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>;
  };

  const certidaoLabels: Record<string, string> = {
    ministerio: "Certidão de Ministério",
    vinculo: "Certidão de Vínculo",
    atuacao: "Certidão de Atuação",
    historico: "Histórico Ministerial",
    ordenacao: "Certidão de Ordenação"
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">{solicitacao.profiles?.nome_completo}</h3>
            <p className="text-sm text-gray-600">{solicitacao.profiles?.igreja}</p>
            <p className="text-sm text-gray-600">Protocolo: {solicitacao.numero_protocolo}</p>
            {solicitacao.payment_reference && (
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <CreditCard className="h-3 w-3 mr-1" />
                Pagamento: {solicitacao.payment_reference}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="mb-2">{getStatusBadge(solicitacao.status)}</div>
            {solicitacao.valor && (
              <p className="text-sm font-semibold text-green-600 mb-1">
                R$ {solicitacao.valor.toFixed(2)}
              </p>
            )}
            <p className="text-xs text-gray-500">
              {new Date(solicitacao.data_solicitacao).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium mb-1">Tipo: {certidaoLabels[solicitacao.tipo_certidao] || solicitacao.tipo_certidao}</p>
          <p className="text-sm text-gray-600">Justificativa: {solicitacao.justificativa}</p>
        </div>

        {(solicitacao.status === 'pago' || solicitacao.status === 'em_analise') && (
          <div className="flex space-x-2">
            <Dialog open={showModal} onOpenChange={setShowModal}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-1" />
                  Analisar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Analisar Solicitação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Detalhes da Solicitação</h4>
                    <p className="text-sm"><strong>Solicitante:</strong> {solicitacao.profiles?.nome_completo}</p>
                    <p className="text-sm"><strong>Igreja:</strong> {solicitacao.profiles?.igreja}</p>
                    <p className="text-sm"><strong>Cargo:</strong> {solicitacao.profiles?.cargo}</p>
                    <p className="text-sm"><strong>Tipo:</strong> {certidaoLabels[solicitacao.tipo_certidao]}</p>
                    <p className="text-sm"><strong>Justificativa:</strong> {solicitacao.justificativa}</p>
                    {solicitacao.valor && (
                      <p className="text-sm"><strong>Valor Pago:</strong> R$ {solicitacao.valor.toFixed(2)}</p>
                    )}
                    {solicitacao.payment_reference && (
                      <p className="text-sm"><strong>Referência Pagamento:</strong> {solicitacao.payment_reference}</p>
                    )}
                  </div>

                  <div>
                    <Label>Observações (opcional)</Label>
                    <Textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Observações para o solicitante..."
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleAprovar}
                      disabled={gerarCertidaoPDF.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {gerarCertidaoPDF.isPending ? 'Processando...' : 'Aprovar'}
                    </Button>
                    <Button
                      onClick={handleRejeitar}
                      disabled={atualizarStatusCertidao.isPending}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      {atualizarStatusCertidao.isPending ? 'Processando...' : 'Rejeitar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
