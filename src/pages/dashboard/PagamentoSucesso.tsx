import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, FileText, Home } from 'lucide-react';

export default function PagamentoSucesso() {
  const location = useLocation();
  const navigate = useNavigate();

  const cobrancaId = location.state?.cobranca_id;
  const servicoNome = location.state?.servico;
  const protocolo = location.state?.protocolo;

  return (
    <div className="container mx-auto py-16">
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-12 pb-8">
            <div className="text-center space-y-6">
              {/* Ícone de Sucesso */}
              <div className="flex justify-center">
                <div className="p-4 bg-green-100 rounded-full">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
              </div>

              {/* Mensagem Principal */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-green-900">
                  Pagamento Confirmado!
                </h1>
                <p className="text-lg text-green-700">
                  Sua solicitação foi recebida com sucesso
                </p>
              </div>

              {/* Informações */}
              <Card className="bg-white">
                <CardContent className="pt-6 space-y-4">
                  {servicoNome && (
                    <div>
                      <p className="text-sm text-muted-foreground">Serviço Solicitado</p>
                      <p className="font-semibold text-lg">{servicoNome}</p>
                    </div>
                  )}

                  {protocolo && (
                    <div>
                      <p className="text-sm text-muted-foreground">Número de Protocolo</p>
                      <p className="font-mono font-bold text-2xl text-primary">
                        {protocolo}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Guarde este número para acompanhar sua solicitação
                      </p>
                    </div>
                  )}

                  {cobrancaId && (
                    <div>
                      <p className="text-sm text-muted-foreground">ID da Cobrança</p>
                      <p className="font-mono text-sm">{cobrancaId}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Próximos Passos */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3 text-blue-900">
                    📋 Próximos Passos
                  </h3>
                  <ol className="text-left space-y-2 text-sm text-blue-800">
                    <li className="flex gap-2">
                      <span className="font-bold">1.</span>
                      <span>Você receberá um email de confirmação</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold">2.</span>
                      <span>Sua solicitação será analisada pela equipe</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold">3.</span>
                      <span>Acompanhe o status pelo painel de solicitações</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold">4.</span>
                      <span>Você será notificado quando estiver pronto</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={() => navigate('/dashboard/solicitacao-servicos')}
                  variant="outline"
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Minhas Solicitações
                </Button>
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Voltar ao Dashboard
                </Button>
              </div>

              {/* Informação Adicional */}
              <p className="text-xs text-muted-foreground pt-4">
                Em caso de dúvidas, entre em contato com nosso suporte
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
