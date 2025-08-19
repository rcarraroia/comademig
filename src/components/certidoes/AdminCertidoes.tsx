
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, FileText, Download } from "lucide-react";
import { useCertidoes } from "@/hooks/useCertidoes";

export const AdminCertidoes = () => {
  const { todasSolicitacoes, atualizarStatusCertidao, gerarPdfCertidao } = useCertidoes();
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<any>(null);
  const [novoStatus, setNovoStatus] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const handleAtualizarStatus = async () => {
    if (!selectedSolicitacao || !novoStatus) return;

    try {
      await atualizarStatusCertidao.mutateAsync({
        id: selectedSolicitacao.id,
        status: novoStatus,
        observacoes: observacoes.trim() || undefined
      });
      
      setSelectedSolicitacao(null);
      setNovoStatus("");
      setObservacoes("");
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleGerarPdf = async (solicitacaoId: string) => {
    try {
      await gerarPdfCertidao.mutateAsync(solicitacaoId);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pendente: <Badge variant="secondary">Pendente</Badge>,
      em_analise: <Badge className="bg-yellow-100 text-yellow-800">Em Análise</Badge>,
      aprovada: <Badge className="bg-green-100 text-green-800">Aprovada</Badge>,
      entregue: <Badge className="bg-blue-100 text-blue-800">Entregue</Badge>,
      rejeitada: <Badge className="bg-red-100 text-red-800">Rejeitada</Badge>
    };
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Gerenciar Solicitações de Certidões</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Protocolo</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {todasSolicitacoes.map((solicitacao: any) => (
              <TableRow key={solicitacao.id}>
                <TableCell className="font-medium">{solicitacao.numero_protocolo}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{solicitacao.profiles?.nome_completo}</p>
                    <p className="text-sm text-gray-600">{solicitacao.profiles?.igreja}</p>
                  </div>
                </TableCell>
                <TableCell>{solicitacao.tipo_certidao}</TableCell>
                <TableCell>
                  {new Date(solicitacao.data_solicitacao).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>{getStatusBadge(solicitacao.status)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedSolicitacao(solicitacao)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Detalhes da Solicitação</DialogTitle>
                        </DialogHeader>
                        {selectedSolicitacao && (
                          <div className="space-y-4">
                            <div>
                              <Label>Justificativa</Label>
                              <p className="text-sm bg-gray-50 p-2 rounded">
                                {selectedSolicitacao.justificativa}
                              </p>
                            </div>
                            
                            <div>
                              <Label>Novo Status</Label>
                              <Select value={novoStatus} onValueChange={setNovoStatus}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="em_analise">Em Análise</SelectItem>
                                  <SelectItem value="aprovada">Aprovada</SelectItem>
                                  <SelectItem value="rejeitada">Rejeitada</SelectItem>
                                  <SelectItem value="entregue">Entregue</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Observações</Label>
                              <Textarea
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                                placeholder="Observações para o solicitante..."
                                rows={3}
                              />
                            </div>

                            <div className="flex space-x-2">
                              <Button
                                onClick={handleAtualizarStatus}
                                disabled={!novoStatus || atualizarStatusCertidao.isPending}
                                className="flex-1"
                              >
                                {atualizarStatusCertidao.isPending ? 'Atualizando...' : 'Atualizar'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {solicitacao.status === 'em_analise' && (
                      <Button
                        size="sm"
                        onClick={() => handleGerarPdf(solicitacao.id)}
                        disabled={gerarPdfCertidao.isPending}
                        className="bg-comademig-gold hover:bg-comademig-gold/90"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Gerar PDF
                      </Button>
                    )}

                    {solicitacao.arquivo_pdf && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(solicitacao.arquivo_pdf, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
