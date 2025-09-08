
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Shield, CreditCard, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useCertidoesWithPayment } from "@/hooks/useCertidoesWithPayment";
import { AdminAprovacao } from "./AdminAprovacao";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export const AdminCertidoes = () => {
  const { todasSolicitacoes, isLoading, refetch } = useCertidoesWithPayment();

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-12" />;
  }

  // Filtrar apenas solicitações pagas (não mostrar pendentes sem pagamento)
  const solicitacoesPagas = todasSolicitacoes.filter(s => s.status === 'pago');
  const solicitacoesEmAnalise = todasSolicitacoes.filter(s => s.status === 'em_analise');
  const solicitacoesAprovadas = todasSolicitacoes.filter(s => s.status === 'aprovada');
  const solicitacoesRejeitadas = todasSolicitacoes.filter(s => s.status === 'rejeitada');
  const solicitacoesEntregues = todasSolicitacoes.filter(s => s.status === 'entregue');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Administração de Certidões</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CreditCard className="h-3 w-3 mr-1" />
              Apenas Pagas
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Pagas</p>
                  <p className="text-2xl font-bold text-blue-700">{solicitacoesPagas.length}</p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600">Em Análise</p>
                  <p className="text-2xl font-bold text-yellow-700">{solicitacoesEmAnalise.length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Aprovadas</p>
                  <p className="text-2xl font-bold text-green-700">{solicitacoesAprovadas.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Rejeitadas</p>
                  <p className="text-2xl font-bold text-red-700">{solicitacoesRejeitadas.length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Entregues</p>
                  <p className="text-2xl font-bold text-purple-700">{solicitacoesEntregues.length}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <CreditCard className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-800">Sistema de Pagamento Integrado</h4>
                <p className="text-sm text-green-700 mt-1">
                  Agora você recebe apenas solicitações de certidões que foram pagas pelos usuários. 
                  Não há mais solicitações pendentes sem pagamento.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Solicitações Pagas Aguardando Processamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-600 flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Solicitações Pagas - Aguardando Processamento ({solicitacoesPagas.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {solicitacoesPagas.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhuma solicitação paga aguardando processamento.
            </p>
          ) : (
            <div className="space-y-4">
              {solicitacoesPagas.map((solicitacao) => (
                <AdminAprovacao
                  key={solicitacao.id}
                  solicitacao={solicitacao}
                  onStatusChange={refetch}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Solicitações Em Análise */}
      {solicitacoesEmAnalise.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600 flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Em Análise ({solicitacoesEmAnalise.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {solicitacoesEmAnalise.map((solicitacao) => (
                <AdminAprovacao
                  key={solicitacao.id}
                  solicitacao={solicitacao}
                  onStatusChange={refetch}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Solicitações Processadas */}
      {(solicitacoesAprovadas.length > 0 || solicitacoesRejeitadas.length > 0 || solicitacoesEntregues.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Solicitações Processadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...solicitacoesAprovadas, ...solicitacoesRejeitadas, ...solicitacoesEntregues]
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                .map((solicitacao) => (
                  <AdminAprovacao
                    key={solicitacao.id}
                    solicitacao={solicitacao}
                    onStatusChange={refetch}
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
