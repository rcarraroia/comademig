import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  History, 
  DollarSign, 
  Calendar, 
  CreditCard,
  Download,
  ExternalLink,
  Search,
  Filter,
  Receipt,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';
import { 
  useFinancialTransactions, 
  formatCurrency, 
  getStatusColor, 
  getStatusLabel,
  getPaymentMethodLabel,
  type FinancialFilters 
} from '@/hooks/useFinancial';
import { useAuth } from '@/contexts/AuthContext';

interface TransactionHistoryProps {
  userId?: string; // Se não fornecido, usa o usuário atual
  showFilters?: boolean;
  className?: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ 
  userId,
  showFilters = true,
  className = '' 
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  
  const pageSize = 20;
  const targetUserId = userId || user?.id;

  // Calcular filtros de data baseado no período
  const getDateFilters = (): Pick<FinancialFilters, 'date_from' | 'date_to'> => {
    const now = new Date();
    
    switch (periodFilter) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return {
          date_from: today.toISOString(),
          date_to: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { date_from: weekAgo.toISOString() };
      
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { date_from: monthAgo.toISOString() };
      
      case 'year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        return { date_from: yearAgo.toISOString() };
      
      default:
        return {};
    }
  };

  const filters: FinancialFilters = {
    user_id: targetUserId,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    ...getDateFilters(),
  };

  const { data: transactions, isLoading, error } = useFinancialTransactions(
    filters,
    { limit: pageSize, offset: currentPage * pageSize }
  );

  // Filtrar por busca local
  const filteredTransactions = transactions?.filter(transaction => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      transaction.description?.toLowerCase().includes(searchLower) ||
      transaction.id.toLowerCase().includes(searchLower) ||
      transaction.asaas_payment_id?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleGenerateReceipt = (transactionId: string) => {
    // TODO: Implementar geração de comprovante
    console.log('Gerar comprovante para:', transactionId);
  };

  const handlePayNow = (transaction: any) => {
    if (transaction.asaas_invoice_url) {
      window.open(transaction.asaas_invoice_url, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando histórico...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar histórico: {(error as Error).message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Transações
            </CardTitle>
            <CardDescription>
              Acompanhe todos os seus pagamentos e transações
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Filtros */}
        {showFilters && (
          <div className="space-y-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por descrição ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros em linha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo o Período</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Último Mês</SelectItem>
                  <SelectItem value="year">Último Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Lista de transações */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">
              {transactions?.length === 0 
                ? 'Nenhuma transação encontrada'
                : 'Nenhuma transação encontrada com os filtros aplicados'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <Card 
                key={transaction.id} 
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Header da transação */}
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(transaction.status)}
                        <Badge className={getStatusColor(transaction.status)}>
                          {getStatusLabel(transaction.status)}
                        </Badge>
                        {transaction.payment_method && (
                          <Badge variant="outline">
                            {getPaymentMethodLabel(transaction.payment_method)}
                          </Badge>
                        )}
                      </div>

                      {/* Descrição e valor */}
                      <div className="space-y-1 mb-3">
                        <div className="font-medium">
                          {transaction.description || 'Transação'}
                        </div>
                        <div className="text-2xl font-bold text-comademig-blue">
                          {formatCurrency(transaction.amount)}
                        </div>
                      </div>

                      {/* Informações da assinatura */}
                      {transaction.subscription?.subscription_plan && (
                        <div className="text-sm text-gray-600 mb-2">
                          📋 {transaction.subscription.subscription_plan.name}
                          {transaction.subscription.subscription_plan.duration_months && (
                            <span className="ml-1">
                              ({transaction.subscription.subscription_plan.duration_months === 1 ? 'Mensal' :
                                transaction.subscription.subscription_plan.duration_months === 6 ? 'Semestral' :
                                transaction.subscription.subscription_plan.duration_months === 12 ? 'Anual' :
                                `${transaction.subscription.subscription_plan.duration_months} meses`})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Datas */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Criado: {formatDate(transaction.created_at)}</span>
                        </div>
                        
                        {transaction.due_date && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Vence: {new Date(transaction.due_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}

                        {transaction.paid_at && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Pago: {formatDate(transaction.paid_at)}</span>
                          </div>
                        )}
                      </div>

                      {/* ID da transação */}
                      <div className="text-xs text-gray-400 mt-2">
                        ID: {transaction.id}
                        {transaction.asaas_payment_id && (
                          <span className="ml-2">Asaas: {transaction.asaas_payment_id}</span>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2 ml-4">
                      {transaction.status === 'pending' && transaction.asaas_invoice_url && (
                        <Button 
                          size="sm"
                          onClick={() => handlePayNow(transaction)}
                          className="bg-comademig-blue hover:bg-comademig-blue/90"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Pagar Agora
                        </Button>
                      )}
                      
                      {transaction.status === 'paid' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleGenerateReceipt(transaction.id)}
                        >
                          <Receipt className="h-4 w-4 mr-2" />
                          Comprovante
                        </Button>
                      )}

                      {transaction.asaas_transaction_receipt_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(transaction.asaas_transaction_receipt_url, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Recibo
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Paginação */}
        {transactions && transactions.length === pageSize && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              Anterior
            </Button>
            
            <span className="text-sm text-gray-600">
              Página {currentPage + 1}
            </span>
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={transactions.length < pageSize}
            >
              Próxima
            </Button>
          </div>
        )}

        {/* Resumo financeiro */}
        {filteredTransactions.length > 0 && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    filteredTransactions
                      .filter(t => t.status === 'paid')
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </div>
                <div className="text-xs text-gray-600">Total Pago</div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(
                    filteredTransactions
                      .filter(t => t.status === 'pending')
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </div>
                <div className="text-xs text-gray-600">Pendente</div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {filteredTransactions.filter(t => t.status === 'paid').length}
                </div>
                <div className="text-xs text-gray-600">Pagamentos</div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {filteredTransactions.length}
                </div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
            </div>
          </div>
        )}

        {/* Dicas para o usuário */}
        {filteredTransactions.some(t => t.status === 'pending') && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Dica:</strong> Você tem pagamentos pendentes. 
              Clique em "Pagar Agora" para quitar via PIX, cartão ou boleto.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;