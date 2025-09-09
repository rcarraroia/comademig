import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, QrCode, Copy, Check } from 'lucide-react';

interface CobrancaData {
  id: string;
  asaas_id: string;
  valor: number;
  descricao: string;
  forma_pagamento: string;
  status: string;
  qr_code_pix?: string;
  linha_digitavel?: string;
  data_vencimento: string;
}

export default function Checkout() {
  const { cobrancaId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cobranca, setCobranca] = useState<CobrancaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Estados para cartão de crédito
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: ''
  });

  useEffect(() => {
    if (cobrancaId) {
      loadCobranca();
    }
  }, [cobrancaId]);

  const loadCobranca = async () => {
    try {
      const { data, error } = await supabase
        .from('asaas_cobrancas')
        .select('*')
        .eq('id', cobrancaId)
        .single();

      if (error) throw error;
      setCobranca(data);
    } catch (error) {
      console.error('Erro ao carregar cobrança:', error);
      toast({
        title: "Erro",
        description: "Cobrança não encontrada",
        variant: "destructive"
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "Código copiado para área de transferência"
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados do pagamento...</p>
        </div>
      </div>
    );
  }

  if (!cobranca) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Cobrança não encontrada</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Finalizar Pagamento</h1>
          <p className="text-gray-600 mt-2">{cobranca.descricao}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Resumo do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Descrição:</span>
                <span className="font-medium">{cobranca.descricao}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valor:</span>
                <span className="font-bold text-xl text-green-600">
                  R$ {cobranca.valor.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vencimento:</span>
                <span>{new Date(cobranca.data_vencimento).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                  {cobranca.status}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Formas de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {cobranca.forma_pagamento === 'PIX' && <QrCode className="h-5 w-5" />}
                {cobranca.forma_pagamento === 'CREDIT_CARD' && <CreditCard className="h-5 w-5" />}
                Pagamento via {cobranca.forma_pagamento === 'PIX' ? 'PIX' : 'Cartão de Crédito'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* PIX */}
              {cobranca.forma_pagamento === 'PIX' && (
                <div className="space-y-4">
                  {cobranca.qr_code_pix ? (
                    <>
                      <div className="text-center">
                        <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 inline-block">
                          <QrCode className="h-32 w-32 mx-auto text-gray-400" />
                          <p className="text-sm text-gray-600 mt-2">QR Code PIX</p>
                        </div>
                      </div>
                      <div>
                        <Label>Código PIX (Copia e Cola)</Label>
                        <div className="flex gap-2 mt-1">
                          <Input 
                            value={cobranca.qr_code_pix} 
                            readOnly 
                            className="font-mono text-xs"
                          />
                          <Button
                            onClick={() => copyToClipboard(cobranca.qr_code_pix!)}
                            variant="outline"
                            size="sm"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">QR Code PIX sendo gerado...</p>
                      <Button 
                        onClick={loadCobranca} 
                        variant="outline" 
                        className="mt-4"
                      >
                        Atualizar
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Cartão de Crédito */}
              {cobranca.forma_pagamento === 'CREDIT_CARD' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="cardNumber">Número do Cartão</Label>
                      <Input
                        id="cardNumber"
                        placeholder="0000 0000 0000 0000"
                        value={cardData.number}
                        onChange={(e) => setCardData({...cardData, number: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="cardName">Nome no Cartão</Label>
                      <Input
                        id="cardName"
                        placeholder="Nome como está no cartão"
                        value={cardData.name}
                        onChange={(e) => setCardData({...cardData, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiryMonth">Mês</Label>
                      <Input
                        id="expiryMonth"
                        placeholder="MM"
                        value={cardData.expiryMonth}
                        onChange={(e) => setCardData({...cardData, expiryMonth: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiryYear">Ano</Label>
                      <Input
                        id="expiryYear"
                        placeholder="AAAA"
                        value={cardData.expiryYear}
                        onChange={(e) => setCardData({...cardData, expiryYear: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="ccv">CCV</Label>
                      <Input
                        id="ccv"
                        placeholder="000"
                        value={cardData.ccv}
                        onChange={(e) => setCardData({...cardData, ccv: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button className="w-full" size="lg">
                    Pagar R$ {cobranca.valor.toFixed(2).replace('.', ',')}
                  </Button>
                </div>
              )}


            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard/financeiro')}
          >
            Voltar ao Painel Financeiro
          </Button>
        </div>
      </div>
    </div>
  );
}