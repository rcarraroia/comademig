
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, DollarSign, CreditCard, AlertCircle, CheckCircle } from "lucide-react";

const Financeiro = () => {
  const payments = [
    {
      id: "001",
      description: "Taxa Anual 2024",
      value: "R$ 120,00",
      dueDate: "2024-02-15",
      status: "Pendente",
      type: "taxa"
    },
    {
      id: "002",
      description: "Contribuição Janeiro 2024",
      value: "R$ 50,00",
      dueDate: "2024-01-31",
      status: "Pago",
      type: "contribuicao"
    },
    {
      id: "003",
      description: "Certificação Ministerial",
      value: "R$ 80,00",
      dueDate: "2023-12-15",
      status: "Pago",
      type: "certificacao"
    },
    {
      id: "004",
      description: "Taxa de Renovação",
      value: "R$ 45,00",
      dueDate: "2023-11-30",
      status: "Pago",
      type: "renovacao"
    }
  ];

  const getStatusBadge = (status: string) => {
    if (status === "Pago") {
      return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
    } else if (status === "Pendente") {
      return <Badge className="bg-orange-100 text-orange-800">Pendente</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Vencido</Badge>;
    }
  };

  const pendingPayments = payments.filter(p => p.status === "Pendente");
  const totalPending = pendingPayments.reduce((sum, p) => {
    return sum + parseFloat(p.value.replace("R$ ", "").replace(",", "."));
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-comademig-blue">Financeiro</h1>
        <p className="text-gray-600">Consulte seus pagamentos e mantenha suas contribuições em dia</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Situação Geral</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Em Dia</div>
            <p className="text-xs text-muted-foreground">Nenhum débito vencido</p>
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
            <div className="text-2xl font-bold">R$ 50,00</div>
            <p className="text-xs text-muted-foreground">Janeiro 2024</p>
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
                  Mantenha suas contribuições em dia para continuar usufruindo dos benefícios da COMADEMIG.
                </p>
                <div className="mt-3 space-x-2">
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                    <CreditCard size={16} className="mr-2" />
                    Pagar Agora
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download size={16} className="mr-2" />
                    Gerar Boleto
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{payment.description}</div>
                      <div className="text-sm text-gray-500">#{payment.id}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{payment.value}</TableCell>
                  <TableCell>
                    {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {payment.status === "Pendente" ? (
                        <>
                          <Button size="sm" className="bg-comademig-blue hover:bg-comademig-blue/90">
                            Pagar
                          </Button>
                          <Button size="sm" variant="outline">
                            Boleto
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline">
                          <Download size={16} className="mr-1" />
                          Comprovante
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Formas de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <CreditCard className="h-6 w-6 text-comademig-blue" />
                <h3 className="font-semibold">Cartão de Crédito/Débito</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Pagamento instantâneo com aprovação imediata
              </p>
              <Button className="w-full bg-comademig-blue hover:bg-comademig-blue/90">
                Pagar com Cartão
              </Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <Download className="h-6 w-6 text-comademig-gold" />
                <h3 className="font-semibold">Boleto Bancário</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Gere um boleto para pagamento em bancos ou internet banking
              </p>
              <Button variant="outline" className="w-full">
                Gerar Boleto
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Financeiro;
