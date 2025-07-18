
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, Home } from "lucide-react";

const PagamentoSucesso = () => {
  const location = useLocation();
  const { formData, taxa, cargoDisplay, metodoPagamento } = location.state || {};

  if (!formData) {
    return (
      <div className="min-h-screen bg-comademig-light flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Informações não encontradas.</p>
            <Button asChild className="mt-4">
              <Link to="/">Voltar ao Início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const numeroProtocolo = Math.random().toString(36).substr(2, 9).toUpperCase();
  const dataProcessamento = new Date().toLocaleDateString('pt-BR');

  return (
    <div className="min-h-screen bg-comademig-light py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-comademig-blue mb-4">
              Solicitação Enviada com Sucesso!
            </h1>
            <p className="text-gray-600">
              Sua filiação à COMADEMIG foi solicitada e está em análise
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-comademig-blue flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                Confirmação da Solicitação
              </CardTitle>
              <CardDescription>
                Protocolo: <strong>{numeroProtocolo}</strong> | Data: {dataProcessamento}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status do Pagamento */}
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Status do Pagamento</h3>
                {metodoPagamento === "cartao" && (
                  <p className="text-green-700">
                    ✅ Pagamento aprovado via cartão de crédito
                  </p>
                )}
                {metodoPagamento === "pix" && (
                  <p className="text-green-700">
                    ✅ Pagamento confirmado via PIX - Desconto aplicado
                  </p>
                )}
                {metodoPagamento === "boleto" && (
                  <p className="text-orange-700 bg-orange-50 p-2 rounded">
                    ⏳ Aguardando pagamento do boleto (enviado para seu e-mail)
                  </p>
                )}
                <div className="mt-2">
                  <Badge className="bg-comademig-blue text-white">
                    Valor: R$ {metodoPagamento === "pix" ? (taxa * 0.95).toFixed(2) : taxa.toFixed(2)}
                  </Badge>
                </div>
              </div>

              {/* Resumo da Filiação */}
              <div className="bg-comademig-light p-4 rounded-lg">
                <h3 className="font-semibold text-comademig-blue mb-3">Resumo da Filiação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Nome:</strong> {formData.nomeCompleto}</p>
                    <p><strong>CPF:</strong> {formData.cpf}</p>
                    <p><strong>E-mail:</strong> {formData.email}</p>
                  </div>
                  <div>
                    <p><strong>Cargo:</strong> {cargoDisplay}</p>
                    <p><strong>Igreja:</strong> {formData.nomeIgreja}</p>
                    <p><strong>Pastor:</strong> {formData.nomePastor}</p>
                  </div>
                </div>
              </div>

              {/* Próximos Passos */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-3">Próximos Passos</h3>
                <ul className="text-blue-700 text-sm space-y-2">
                  <li>✓ Sua solicitação será analisada pela diretoria da COMADEMIG</li>
                  <li>✓ Você receberá um e-mail de confirmação em até 24 horas</li>
                  <li>✓ A análise da documentação leva até 5 dias úteis</li>
                  <li>✓ Após aprovação, sua carteira digital será liberada no portal</li>
                  <li>✓ Você será notificado por e-mail quando a carteira estiver disponível</li>
                </ul>
              </div>

              {/* Informações Importantes */}
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Informações Importantes</h3>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• Guarde o número do protocolo para acompanhar sua solicitação</li>
                  <li>• Verifique sua caixa de e-mail (inclusive spam)</li>
                  <li>• Em caso de dúvidas, entre em contato pelo WhatsApp ou telefone</li>
                  <li>• Acesse o portal para acompanhar o status da sua filiação</li>
                </ul>
              </div>

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Comprovante
                </Button>
                <Button asChild className="flex-1 bg-comademig-blue hover:bg-comademig-blue/90">
                  <Link to="/dashboard">
                    Acessar Portal
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/">
                    <Home className="mr-2 h-4 w-4" />
                    Voltar ao Site
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Informações de Contato */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-comademig-blue">Precisa de Ajuda?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">WhatsApp</h4>
                  <p>(31) 99999-9999</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">E-mail</h4>
                  <p>contato@comademig.org.br</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Telefone</h4>
                  <p>(31) 3333-3333</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PagamentoSucesso;
