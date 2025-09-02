
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, DollarSign, CreditCard, AlertCircle, CheckCircle, Plus, RefreshCw } from "lucide-react";
import { useAsaasPayments } from "@/hooks/useAsaasPayments";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { PaymentResult } from "@/components/payments/PaymentResult";
import { useAuth } from "@/contexts/AuthContext";

const Financeiro = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPaymentResult, setShowPaymentResult] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const { getUserPayments, checkPaymentStatus, loading } = useAsaasPayments();
  const { profile } = useAuth();

  const loadPayments = async () => {
    const data = await getUserPayments();
    setPayments(data || []);
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleCreatePayment = (cobranca: any) => {
    setSelectedPayment(cobranca);
    setShowPaymentForm(false);
    setShowPaymentResult(true);
    loadPayments(); // Recarregar lista
  };

  const handleCheckStatus = async (paymentId: string) => {
    try {
      await checkPaymentStatus(paymentId);
      loadPayments(); // Recarregar após verificar status
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      'PENDING': { label: 'Pendente', className: 'bg-orange-100 text-orange-800' },
      'CONFIRMED': { label: 'Confirmado', className: 'bg-blue-100 text-blue-800' },
      'RECEIVED': { label: 'Pago', className: 'bg-green-100 text-green-800' },
      'OVERDUE': { label: 'Vencido', className: 'bg-red-100 text-red-800' }
    };

    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const getPaymentTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'filiacao': 'Filiação',
      'taxa_anual': 'Taxa Anual',
      'certidao': 'Certidão',
      'evento': 'Evento',
      'outros': 'Outros'
    };
    return typeMap[type] || type;
  };

  const pendingPayments = payments.filter(p => p.status === 'PENDING');
  const totalPending = pendingPayments.reduce((sum, p) => sum + parseFloat(p.valor), 0);
  const lastPayment = payments.find(p => p.status === 'RECEIVED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-comademig-blue">Financeiro</h1>
          <p className="text-gray-600">Gerencie seus pagamentos e cobranças</p>
        </div>
        <div className="space-x-2">
          <Button onClick={loadPayments} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={() => setShowPaymentForm(true)} className="bg-comademig-blue hover:bg-comademig-blue/90">
            <Plus className="h-4 w-4 mr-2" />
            Nova Cobrança
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Situação Geral</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {pendingPayments.length === 0 ? 'Em Dia' : 'Pendências'}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingPayments.length === 0 ? 'Nenhuma pendência' : `${pendingPayments.length} pendência(s)`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valores Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              R$ {totalPending.toFixed(2).replace(".", ",")}
            </div>
            <p className="text-xs text-muted-foreground">{pendingPayments.length} pagamento(s) pendente(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Pagamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastPayment ? `R$ ${parseFloat(lastPayment.valor).toFixed(2).replace(".", ",")}` : 'Nenhum'}
            </div>
            <p className="text-xs text-muted-foreground">
              {lastPayment ? new Date(lastPayment.data_pagamento).toLocaleDateString('pt-BR') : 'Nenhum pagamento'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments Alert */}
      {pendingPayments.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-800">Atenção: Pagamentos Pendentes</h3>
                <p className="text-sm text-orange-700 mt-1">
                  Você possui {pendingPayments.length} pagamento(s) pendente(s). 
                  Clique em "Ver Detalhes" para acessar as formas de pagamento.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Cobranças</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Nenhuma cobrança encontrada
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.descricao}</div>
                        <div className="text-sm text-gray-500">ID: {payment.asaas_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getPaymentTypeLabel(payment.tipo_cobranca)}</TableCell>
                    <TableCell className="font-medium">
                      R$ {parseFloat(payment.valor).toFixed(2).replace(".", ",")}
                    </TableCell>
                    <TableCell>
                      {new Date(payment.data_vencimento).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {payment.status === 'PENDING' || payment.status === 'CONFIRMED' ? (
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowPaymentResult(true);
                            }}
                            className="bg-comademig-blue hover:bg-comademig-blue/90"
                          >
                            Ver Detalhes
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled>
                            <Download size={16} className="mr-1" />
                            Pago
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCheckStatus(payment.asaas_id)}
                          disabled={loading}
                        >
                          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Form Dialog */}
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Nova Cobrança</DialogTitle>
          </DialogHeader>
          <PaymentForm
            defaultData={{
              customer: {
                name: profile?.nome_completo || '',
                email: profile?.id || '', // será pego do user
                cpfCnpj: profile?.cpf || '',
                phone: profile?.telefone || '',
                city: profile?.cidade || '',
                province: profile?.estado || ''
              },
              tipoCobranca: 'outros',
              value: 50.00,
              description: 'Cobrança gerada pelo sistema'
            }}
            onSuccess={handleCreatePayment}
            onCancel={() => setShowPaymentForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Payment Result Dialog */}
      <Dialog open={showPaymentResult} onOpenChange={setShowPaymentResult}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pagamento</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <PaymentResult
              cobranca={selectedPayment}
              onClose={() => setShowPaymentResult(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Financeiro;
