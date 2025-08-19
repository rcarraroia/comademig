
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield } from "lucide-react";
import { useCertidoes } from "@/hooks/useCertidoes";
import { AdminAprovacao } from "./AdminAprovacao";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export const AdminCertidoes = () => {
  const { todasSolicitacoes, isLoading, refetch } = useCertidoes();

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-12" />;
  }

  const solicitacoesPendentes = todasSolicitacoes.filter(s => s.status === 'pendente');
  const solicitacoesProcessadas = todasSolicitacoes.filter(s => s.status !== 'pendente');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Administração de Certidões</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-700">{solicitacoesPendentes.length}</p>
                </div>
                <FileText className="h-8 w-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Aprovadas</p>
                  <p className="text-2xl font-bold text-green-700">
                    {todasSolicitacoes.filter(s => s.status === 'aprovada').length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Rejeitadas</p>
                  <p className="text-2xl font-bold text-red-700">
                    {todasSolicitacoes.filter(s => s.status === 'rejeitada').length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Total</p>
                  <p className="text-2xl font-bold text-blue-700">{todasSolicitacoes.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Solicitações Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-yellow-600">
            Solicitações Pendentes ({solicitacoesPendentes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {solicitacoesPendentes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhuma solicitação pendente no momento.
            </p>
          ) : (
            <div className="space-y-4">
              {solicitacoesPendentes.map((solicitacao) => (
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

      {/* Histórico de Solicitações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Solicitações</CardTitle>
        </CardHeader>
        <CardContent>
          {solicitacoesProcessadas.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhuma solicitação processada ainda.
            </p>
          ) : (
            <div className="space-y-4">
              {solicitacoesProcessadas.map((solicitacao) => (
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
    </div>
  );
};
