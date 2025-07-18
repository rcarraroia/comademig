
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CreditCard, Barcode, CheckCircle } from "lucide-react";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { formData, taxa, cargoDisplay } = location.state || {};
  const [metodoPagamento, setMetodoPagamento] = useState("");
  const [dadosCartao, setDadosCartao] = useState({
    numero: "",
    nome: "",
    validade: "",
    cvv: ""
  });

  if (!formData) {
    return (
      <div className="min-h-screen bg-comademig-light flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Dados não encontrados. Por favor, preencha o formulário novamente.</p>
            <Button onClick={() => navigate("/filiacao")} className="mt-4">
              Voltar ao Formulário
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePagamento = () => {
    // Simular processamento do pagamento
    setTimeout(() => {
      navigate("/pagamento-sucesso", {
        state: {
          formData,
          taxa,
          cargoDisplay,
          metodoPagamento
        }
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-comademig-light py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-comademig-blue mb-4">
              Finalizar Filiação
            </h1>
            <p className="text-gray-600">
              Confirme seus dados e escolha a forma de pagamento
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Resumo do Pedido */}
            <Card>
              <CardHeader>
                <CardTitle className="text-comademig-blue">Resumo da Filiação</CardTitle>
                <CardDescription>Confirme os dados da sua solicitação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-comademig-light p-4 rounded-lg">
                  <h3 className="font-semibold text-comademig-blue mb-2">Dados Pessoais</h3>
                  <p><strong>Nome:</strong> {formData.nomeCompleto}</p>
                  <p><strong>CPF:</strong> {formData.cpf}</p>
                  <p><strong>E-mail:</strong> {formData.email}</p>
                  <p><strong>Celular:</strong> {formData.celular}</p>
                </div>

                <div className="bg-comademig-light p-4 rounded-lg">
                  <h3 className="font-semibold text-comademig-blue mb-2">Dados Ministeriais</h3>
                  <p><strong>Cargo:</strong> {cargoDisplay}</p>
                  <p><strong>Igreja:</strong> {formData.nomeIgreja}</p>
                  <p><strong>Pastor:</strong> {formData.nomePastor}</p>
                </div>

                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Taxa de Filiação:</span>
                    <Badge className="bg-comademig-blue text-white text-lg px-3 py-1">
                      R$ {taxa.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Forma de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle className="text-comademig-blue">Forma de Pagamento</CardTitle>
                <CardDescription>Escolha como deseja pagar a taxa de filiação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup value={metodoPagamento} onValueChange={setMetodoPagamento}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="cartao" id="cartao" />
                    <Label htmlFor="cartao" className="flex items-center cursor-pointer">
                      <CreditCard className="mr-2 h-5 w-5 text-comademig-blue" />
                      Cartão de Crédito
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="boleto" id="boleto" />
                    <Label htmlFor="boleto" className="flex items-center cursor-pointer">
                      <Barcode className="mr-2 h-5 w-5 text-comademig-blue" />
                      Boleto Bancário
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="flex items-center cursor-pointer">
                      <CheckCircle className="mr-2 h-5 w-5 text-comademig-blue" />
                      PIX (Desconto de 5%)
                    </Label>
                  </div>
                </RadioGroup>

                {/* Dados do Cartão */}
                {metodoPagamento === "cartao" && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-semibold text-comademig-blue">Dados do Cartão</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="numeroCartao">Número do Cartão</Label>
                        <Input
                          id="numeroCartao"
                          placeholder="0000 0000 0000 0000"
                          value={dadosCartao.numero}
                          onChange={(e) => setDadosCartao(prev => ({...prev, numero: e.target.value}))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="nomeCartao">Nome no Cartão</Label>
                        <Input
                          id="nomeCartao"
                          placeholder="Nome como impresso no cartão"
                          value={dadosCartao.nome}
                          onChange={(e) => setDadosCartao(prev => ({...prev, nome: e.target.value}))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="validade">Validade</Label>
                          <Input
                            id="validade"
                            placeholder="MM/AA"
                            value={dadosCartao.validade}
                            onChange={(e) => setDadosCartao(prev => ({...prev, validade: e.target.value}))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            placeholder="000"
                            value={dadosCartao.cvv}
                            onChange={(e) => setDadosCartao(prev => ({...prev, cvv: e.target.value}))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informações sobre PIX */}
                {metodoPagamento === "pix" && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">PIX - Desconto de 5%</h4>
                    <p className="text-green-700 text-sm mb-2">
                      Valor com desconto: <strong>R$ {(taxa * 0.95).toFixed(2)}</strong>
                    </p>
                    <p className="text-green-700 text-sm">
                      Você receberá o código PIX para pagamento na próxima tela.
                    </p>
                  </div>
                )}

                {/* Informações sobre Boleto */}
                {metodoPagamento === "boleto" && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Boleto Bancário</h4>
                    <p className="text-blue-700 text-sm">
                      O boleto será gerado e enviado para seu e-mail. 
                      Prazo de vencimento: 3 dias úteis.
                    </p>
                  </div>
                )}

                <div className="flex space-x-4 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/filiacao")}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button 
                    onClick={handlePagamento}
                    disabled={!metodoPagamento}
                    className="flex-1 bg-comademig-blue hover:bg-comademig-blue/90"
                  >
                    {metodoPagamento === "boleto" ? "Gerar Boleto" : 
                     metodoPagamento === "pix" ? "Gerar PIX" : "Finalizar Pagamento"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
