import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, QrCode, Smartphone, Loader2 } from 'lucide-react';
import RenewalCheckout from '@/components/checkout/RenewalCheckout';

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
    tipo_cobranca: string;
}

export default function CheckoutNew() {
    const { cobrancaId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();
    
    // Verificar se é renovação
    const isRenewal = searchParams.get('type') === 'renewal';
    const subscriptionId = searchParams.get('subscriptionId');
    const planId = searchParams.get('planId');
    const memberTypeId = searchParams.get('memberTypeId');
    const currentStatus = searchParams.get('currentStatus');

    // Se for renovação, usar componente específico
    if (isRenewal) {
        return (
            <RenewalCheckout 
                subscriptionId={subscriptionId}
                planId={planId}
                memberTypeId={memberTypeId}
                currentStatus={currentStatus}
            />
        );
    }

    const [cobranca, setCobranca] = useState<CobrancaData | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Estados para o checkout
    const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');

    // Estados para dados pessoais
    const [customerData, setCustomerData] = useState({
        name: '',
        email: '',
        phone: '',
        cpfCnpj: ''
    });

    // Estados para cartão de crédito
    const [cardData, setCardData] = useState({
        number: '',
        holderName: '',
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

            // Definir método de pagamento baseado na cobrança
            setPaymentMethod(data.forma_pagamento as 'PIX' | 'CREDIT_CARD');
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

    const processPayment = async () => {
        setProcessing(true);
        try {
            if (paymentMethod === 'PIX') {
                // Para PIX, buscar QR Code
                const { data, error } = await supabase.functions.invoke('asaas-process-pix', {
                    body: {
                        paymentId: cobranca?.asaas_id,
                        customerData
                    }
                });

                if (error) throw error;

                // Mostrar QR Code PIX
                toast({
                    title: "PIX Gerado!",
                    description: "Use o QR Code ou código copia-e-cola para pagar"
                });

            } else {
                // Para Cartão, processar pagamento
                const { data, error } = await supabase.functions.invoke('asaas-process-card', {
                    body: {
                        paymentId: cobranca?.asaas_id,
                        customerData,
                        cardData
                    }
                });

                if (error) throw error;

                if (data.success) {
                    toast({
                        title: "Pagamento Aprovado!",
                        description: "Sua filiação foi processada com sucesso"
                    });
                    navigate('/dashboard');
                } else {
                    throw new Error(data.error || 'Pagamento negado');
                }
            }
        } catch (error: any) {
            console.error('Erro ao processar pagamento:', error);
            toast({
                title: "Erro no Pagamento",
                description: error.message || "Erro ao processar pagamento",
                variant: "destructive"
            });
        } finally {
            setProcessing(false);
        }
    };

    const getButtonText = () => {
        if (processing) return 'Processando...';

        switch (cobranca?.tipo_cobranca) {
            case 'filiacao':
                return 'Quero me Filiar';
            case 'certidao':
                return 'Solicitar Certidão';
            case 'regularizacao':
                return 'Regularizar Igreja';
            default:
                return 'Pagar Agora';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
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
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {cobranca.tipo_cobranca === 'filiacao' ? 'Finalizar Filiação' : 'Finalizar Pagamento'}
                    </h1>
                    <p className="text-gray-600 mt-2">{cobranca.descricao}</p>
                </div>

                <div className="space-y-6">
                    {/* Valor do Pagamento */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-center">
                                {cobranca.tipo_cobranca === 'filiacao' ? 'Valor da Filiação' : 'Valor do Pagamento'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <div className="text-4xl font-bold text-green-600 mb-2">
                                R$ {cobranca.valor.toFixed(2).replace('.', ',')}
                            </div>
                            <p className="text-gray-600">{cobranca.descricao}</p>
                        </CardContent>
                    </Card>

                    {/* Forma de Pagamento */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Forma de Pagamento</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup
                                value={paymentMethod}
                                onValueChange={(value: 'PIX' | 'CREDIT_CARD') => setPaymentMethod(value)}
                                className="space-y-3"
                            >
                                <div className={`flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer ${paymentMethod === 'PIX' ? 'border-blue-500 bg-blue-50' : ''}`}>
                                    <RadioGroupItem value="PIX" id="pix" />
                                    <Label htmlFor="pix" className="flex items-center space-x-3 cursor-pointer flex-1">
                                        <Smartphone className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <div className="font-medium">PIX</div>
                                            <div className="text-sm text-gray-500">Instantâneo</div>
                                        </div>
                                    </Label>
                                </div>

                                <div className={`flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer ${paymentMethod === 'CREDIT_CARD' ? 'border-green-500 bg-green-50' : ''}`}>
                                    <RadioGroupItem value="CREDIT_CARD" id="card" />
                                    <Label htmlFor="card" className="flex items-center space-x-3 cursor-pointer flex-1">
                                        <CreditCard className="h-5 w-5 text-green-600" />
                                        <div>
                                            <div className="font-medium">Cartão de Crédito</div>
                                            <div className="text-sm text-gray-500">À vista</div>
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </CardContent>
                    </Card>

                    {/* Dados Pessoais */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Seus Dados</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="name">Nome Completo *</Label>
                                <Input
                                    id="name"
                                    placeholder="Seu nome completo"
                                    value={customerData.name}
                                    onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="email">E-mail *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={customerData.email}
                                    onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input
                                        id="phone"
                                        placeholder="(11) 99999-9999"
                                        value={customerData.phone}
                                        onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="cpf">CPF</Label>
                                    <Input
                                        id="cpf"
                                        placeholder="000.000.000-00"
                                        value={customerData.cpfCnpj}
                                        onChange={(e) => setCustomerData({ ...customerData, cpfCnpj: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dados do Cartão (apenas se cartão selecionado) */}
                    {paymentMethod === 'CREDIT_CARD' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Dados do Cartão de Crédito
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="cardHolderName">Nome do Portador *</Label>
                                    <Input
                                        id="cardHolderName"
                                        placeholder="Nome como está no cartão"
                                        value={cardData.holderName}
                                        onChange={(e) => setCardData({ ...cardData, holderName: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="cardNumber">Número do Cartão *</Label>
                                    <Input
                                        id="cardNumber"
                                        placeholder="0000 0000 0000 0000"
                                        value={cardData.number}
                                        onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="month">Mês *</Label>
                                        <Input
                                            id="month"
                                            placeholder="MM"
                                            maxLength={2}
                                            value={cardData.expiryMonth}
                                            onChange={(e) => setCardData({ ...cardData, expiryMonth: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="year">Ano *</Label>
                                        <Input
                                            id="year"
                                            placeholder="AAAA"
                                            maxLength={4}
                                            value={cardData.expiryYear}
                                            onChange={(e) => setCardData({ ...cardData, expiryYear: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="cvv">CCV *</Label>
                                        <Input
                                            id="cvv"
                                            placeholder="000"
                                            maxLength={3}
                                            value={cardData.ccv}
                                            onChange={(e) => setCardData({ ...cardData, ccv: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <span>🔒</span>
                                    Seus dados são protegidos com criptografia SSL. Não armazenamos informações do cartão.
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Botão de Pagamento */}
                    <Button
                        onClick={processPayment}
                        disabled={processing}
                        className="w-full h-12 text-lg font-semibold bg-red-500 hover:bg-red-600"
                    >
                        {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {getButtonText()}
                    </Button>

                    <div className="text-center">
                        <Button
                            variant="outline"
                            onClick={() => navigate('/dashboard/financeiro')}
                        >
                            Voltar ao Painel Financeiro
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}