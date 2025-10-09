import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, FileText, Download } from "lucide-react";

interface GerenciarSolicitacaoProps {
  solicitacao: any;
  onUpdate: () => void;
}

export function GerenciarSolicitacao({ solicitacao, onUpdate }: GerenciarSolicitacaoProps) {
  const [observacoes, setObservacoes] = useState(solicitacao.observacoes_admin || "");
  const [loading, setLoading] = useState(false);

  const statusConfig = {
    pendente: { label: "Pendente", icon: Clock, color: "bg-yellow-500" },
    em_analise: { label: "Em Análise", icon: Clock, color: "bg-blue-500" },
    aprovado: { label: "Aprovado", icon: CheckCircle, color: "bg-green-500" },
    rejeitado: { label: "Rejeitado", icon: XCircle, color: "bg-red-500" },
    concluido: { label: "Concluído", icon: CheckCircle, color: "bg-green-600" }
  };

  const currentStatus = statusConfig[solicitacao.status as keyof typeof statusConfig];

  const handleUpdateStatus = async (novoStatus: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("solicitacoes_servicos")
        .update({
          status: novoStatus,
          observacoes_admin: observacoes,
          updated_at: new Date().toISOString()
        })
        .eq("id", solicitacao.id);

      if (error) throw error;

      toast.success(`Status atualizado para: ${statusConfig[novoStatus as keyof typeof statusConfig].label}`);
      onUpdate();
    } catch (error: any) {
      toast.error("Erro ao atualizar status: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocumento = async (documentoUrl: string, nomeDocumento: string) => {
    try {
      // Extrair o path do storage da URL
      const path = documentoUrl.split('/storage/v1/object/public/')[1];
      
      const { data, error } = await supabase.storage
        .from(path.split('/')[0])
        .download(path.split('/').slice(1).join('/'));

      if (error) throw error;

      // Criar URL temporária e fazer download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeDocumento;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Download iniciado!");
    } catch (error: any) {
      toast.error("Erro ao baixar documento: " + error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Gerenciar Solicitação #{solicitacao.id.slice(0, 8)}</span>
          <Badge className={currentStatus.color}>
            <currentStatus.icon className="w-4 h-4 mr-1" />
            {currentStatus.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações do Solicitante */}
        <div>
          <h3 className="font-semibold mb-2">Solicitante</h3>
          <div className="text-sm space-y-1">
            <p><strong>ID:</strong> {solicitacao.user_id}</p>
            <p><strong>Data:</strong> {new Date(solicitacao.created_at).toLocaleString('pt-BR')}</p>
          </div>
        </div>

        {/* Serviço Solicitado */}
        <div>
          <h3 className="font-semibold mb-2">Serviço</h3>
          <div className="text-sm space-y-1">
            <p><strong>Nome:</strong> {solicitacao.servicos?.nome}</p>
            <p><strong>Valor:</strong> R$ {solicitacao.valor?.toFixed(2)}</p>
          </div>
        </div>

        {/* Documentos Enviados */}
        {solicitacao.documentos && solicitacao.documentos.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Documentos Enviados</h3>
            <div className="space-y-2">
              {solicitacao.documentos.map((doc: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">{doc.nome}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadDocumento(doc.url, doc.nome)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dados Adicionais */}
        {solicitacao.dados_adicionais && Object.keys(solicitacao.dados_adicionais).length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Dados Adicionais</h3>
            <div className="text-sm space-y-1">
              {Object.entries(solicitacao.dados_adicionais).map(([key, value]) => (
                <p key={key}>
                  <strong>{key}:</strong> {String(value)}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Observações do Admin */}
        <div>
          <h3 className="font-semibold mb-2">Observações Administrativas</h3>
          <Textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Adicione observações sobre esta solicitação..."
            rows={4}
          />
        </div>

        {/* Ações de Status */}
        <div>
          <h3 className="font-semibold mb-2">Alterar Status</h3>
          <div className="flex flex-wrap gap-2">
            {solicitacao.status !== "em_analise" && (
              <Button
                onClick={() => handleUpdateStatus("em_analise")}
                disabled={loading}
                variant="outline"
              >
                <Clock className="w-4 h-4 mr-2" />
                Em Análise
              </Button>
            )}
            {solicitacao.status !== "aprovado" && (
              <Button
                onClick={() => handleUpdateStatus("aprovado")}
                disabled={loading}
                variant="outline"
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprovar
              </Button>
            )}
            {solicitacao.status !== "rejeitado" && (
              <Button
                onClick={() => handleUpdateStatus("rejeitado")}
                disabled={loading}
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeitar
              </Button>
            )}
            {solicitacao.status === "aprovado" && solicitacao.status !== "concluido" && (
              <Button
                onClick={() => handleUpdateStatus("concluido")}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Concluir
              </Button>
            )}
          </div>
        </div>

        {/* Informações de Pagamento */}
        {solicitacao.payment_id && (
          <div>
            <h3 className="font-semibold mb-2">Pagamento</h3>
            <div className="text-sm space-y-1">
              <p><strong>ID:</strong> {solicitacao.payment_id}</p>
              <p><strong>Status:</strong> {solicitacao.payment_status || "Pendente"}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
