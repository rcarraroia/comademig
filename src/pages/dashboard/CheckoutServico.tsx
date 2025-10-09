import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCheckoutTransparente } from '@/hooks/useCheckoutTransparente';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { CardPaymentForm } from '@/components/checkout/CardPaymentForm';
import { PixPaymentDisplay } from '@/components/checkout/PixPaymentDisplay';
import { ArrowLeft, CreditCard, Loader2, QrCode, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { Servico } from '@/hooks/useServicos';
import type { DadosCartao } from '@/components/checkout/CardPaymentForm';

export default function CheckoutServico() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { 
    processarCheckout, 
    calcularValorComDesconto,
    isProcessing,
    currentStep,
    DESCONTO_PIX_PERCENTUAL 
  } = useCheckoutTransparente();

  // Dados vindos da navegação
  const servico = location.state?.servico as Servico | undefined;
  const dadosFormulario = location.state?.dadosFormulario as Record<string, any> | undefined;

  // States
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'cartao'>('pix');
  const [dadosCartao, setDadosCartao] = useState<DadosCartao | null>(null);
  const [cartaoValido, setCartaoValido] = useState(false);
  const [resultadoPix, setResultadoPix] = useState<any>(null);

  // Dados do cliente (pré-preenchidos do perfil)
  const [dadosCliente, setDadosCliente] = useState({
    nome: user?.user_metadata?.full_name || '',
    cpf: '',
    email: user?.email || '',
    telefone: '',
  });

  // Validações
  useEffect(() => {
    if (!servico || !dadosFormulario) {
      toast.error('Dados da solicitação não encontrados');
      navigate('/dashboard/solicitacao-servicos');
    }
  }, [servico, dadosFormulario, navigate]);

  if (!servico || !dadosFormulario) {
    return null;
  }

  // Calcular valores
  const valorOriginal = servico.valor;
  const valorFinal = calcularValorComDesconto(valorOriginal, formaPagamento);
  const economia = valorOriginal - valorFinal;

  // Handler: Finalizar Pagamento
  const handleFinalizarPagamento = async () => {
    // Validar dados do cliente
    if (!dadosCliente.nome || !dadosCliente.cpf || !dadosCliente.email || !dadosCliente.telefone) {
      toast.error('Preencha todos os dados do cliente');
      return;
    }

    // Validar cartão se necessário
    if (formaPagamento === 'cartao' && (!dadosCartao || !cartaoValido)) {
      toast.error('Preencha os dados do cartão corretamente');
      return;
    }

    // Processar checkout
    const resultado = await processarCheckout({
      servico_id: servico.id,
      servico_nome: servico.nome,
      servico_valor: valorOriginal,
      dados_formulario: dadosFormulario,
      forma_pagamento: formaPagamento,
      cliente: dadosCliente,
      cartao: formaPagamento === 'cartao' ? dadosCartao! : undefined,
    });

    if (resultado.success) {
      if (formaPagamento === 'pix') {
        // Mostrar QR Code
        setResultadoPix(resultado);
      } else {
        // Redirecionar para página de sucesso
        navigate('/dashboard/pagamento-sucesso', {
          state: {
            cobranca_id: resultado.cobranca_id,
            servico: servico.nome,
          },
        });
      }
    }
  };

  // Se já processou PIX, mostrar QR Code
  if (resultadoPix) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => setResultadoPix(null)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <PixPaymentDisplay
          qrCode={resultadoPix.qr_code}
          qrCodeUrl={resultadoPix.qr_code_url}
          copiaCola={resultadoPix.qr_code}
          valor={valorFinal}
          aguardandoConfirmacao={true}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna Principal - Formulário */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={dadosCliente.nome}
                    onChange={(e) => setDadosCliente({ ...dadosCliente, nome: e.target.value })}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={dadosCliente.cpf}
                    onChange={(e) => setDadosCliente({ ...dadosCliente, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={dadosCliente.email}
                    onChange={(e) => setDadosCliente({ ...dadosCliente, email: e.target.value })}
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={dadosCliente.telefone}
                    onChange={(e) => setDadosCliente({ ...dadosCliente, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Forma de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={formaPagamento} onValueChange={(v) => setFormaPagamento(v as any)}>
                <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-muted">
                  <RadioGroupItem value="pix" id="pix" />
                  <Label htmlFor="pix" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <QrCode className="h-5 w-5" />
                        <span className="font-medium">PIX</span>
                      </div>
                      <span className="text-sm text-green-600 font-medium">
                        {DESCONTO_PIX_PERCENTUAL}% de desconto
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pagamento instantâneo via QR Code
                    </p>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-muted">
                  <RadioGroupItem value="cartao" id="cartao" />
                  <Label htmlFor="cartao" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      <span className="font-medium">Cartão de Crédito</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Parcele em até {servico.max_parcelas}x
                    </p>
                  </Label>
                </div>
              </RadioGroup>

              {/* Formulário do Cartão */}
              {formaPagamento === 'cartao' && (
                <div className="mt-4">
                  <CardPaymentForm
                    valor={valorFinal}
                    maxParcelas={servico.max_parcelas}
                    onChange={setDadosCartao}
                    onValidChange={setCartaoValido}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botão Finalizar */}
          <Button
            onClick={handleFinalizarPagamento}
            disabled={isProcessing}
            size="lg"
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {currentStep === 'creating_customer' && 'Criando cliente...'}
                {currentStep === 'processing_payment' && 'Processando pagamento...'}
                {currentStep === 'saving_charge' && 'Finalizando...'}
                {currentStep === 'validating' && 'Validando...'}
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Finalizar Pagamento
              </>
            )}
          </Button>
        </div>

        {/* Coluna Lateral - Resumo */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Serviço */}
              <div>
                <p className="text-sm text-muted-foreground">Serviço</p>
                <p className="font-medium">{servico.nome}</p>
              </div>

              <Separator />

              {/* Valores */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor do serviço</span>
                  <span>R$ {valorOriginal.toFixed(2)}</span>
                </div>

                {economia > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto PIX ({DESCONTO_PIX_PERCENTUAL}%)</span>
                    <span>- R$ {economia.toFixed(2)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">R$ {valorFinal.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              {/* Informações */}
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Pagamento 100% seguro e criptografado</span>
                </p>
                <p>• Prazo de entrega: {servico.prazo}</p>
                <p>• Você receberá um número de protocolo</p>
                <p>• Acompanhe o status pelo painel</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
