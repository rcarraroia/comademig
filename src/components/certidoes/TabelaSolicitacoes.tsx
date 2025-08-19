
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface SolicitacaoCertidao {
  id: string;
  tipo_certidao: string;
  numero_protocolo: string;
  status: string;
  data_solicitacao: string;
  data_aprovacao?: string;
  data_entrega?: string;
  arquivo_pdf?: string;
}

interface TabelaSolicitacoesProps {
  solicitacoes: SolicitacaoCertidao[];
}

const certidaoLabels: Record<string, string> = {
  ministerio: "Certidão de Ministério",
  vinculo: "Certidão de Vínculo",
  atuacao: "Certidão de Atuação",
  historico: "Histórico Ministerial",
  ordenacao: "Certidão de Ordenação"
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pendente":
      return <Badge variant="secondary"><Clock size={12} className="mr-1" />Pendente</Badge>;
    case "em_analise":
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock size={12} className="mr-1" />Em Análise</Badge>;
    case "aprovada":
      return <Badge className="bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" />Aprovada</Badge>;
    case "entregue":
      return <Badge className="bg-blue-100 text-blue-800"><CheckCircle size={12} className="mr-1" />Entregue</Badge>;
    case "rejeitada":
      return <Badge className="bg-red-100 text-red-800"><XCircle size={12} className="mr-1" />Rejeitada</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export const TabelaSolicitacoes = ({ solicitacoes }: TabelaSolicitacoesProps) => {
  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Protocolo</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Data Solicitação</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Data Entrega</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {solicitacoes.map((solicitacao) => (
          <TableRow key={solicitacao.id}>
            <TableCell className="font-medium">{solicitacao.numero_protocolo}</TableCell>
            <TableCell>{certidaoLabels[solicitacao.tipo_certidao] || solicitacao.tipo_certidao}</TableCell>
            <TableCell>
              {new Date(solicitacao.data_solicitacao).toLocaleDateString('pt-BR')}
            </TableCell>
            <TableCell>{getStatusBadge(solicitacao.status)}</TableCell>
            <TableCell>
              {solicitacao.data_entrega 
                ? new Date(solicitacao.data_entrega).toLocaleDateString('pt-BR')
                : "-"
              }
            </TableCell>
            <TableCell>
              {solicitacao.status === "aprovada" || solicitacao.status === "entregue" ? (
                <Button 
                  size="sm" 
                  className="bg-comademig-blue hover:bg-comademig-blue/90"
                  onClick={() => solicitacao.arquivo_pdf && handleDownload(solicitacao.arquivo_pdf)}
                >
                  <Download size={16} className="mr-1" />
                  Baixar
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  Aguardando
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
