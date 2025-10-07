import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, 
  Clock, 
  User, 
  DollarSign,
  Calendar,
  Phone,
  Mail,
  Search,
  Download,
  RefreshCw,
  Send,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { 
  useFinancialTransactions, 
  formatCurrency, 
  getStatusColor, 
  getStatusLabel,
  getPaymentMethodLabel 
} from '@/hooks/useFinancial';

interface OverduePaymentsProps {
  className?: string;
}

const OverduePayments: React.FC<OverduePaymentsProps> = ({ 
  className = '' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Buscar transações em atraso
  const today = new Date().toISOString().split('T')[0];
  const { data: transactions, isLoading, error, refetch } = useFinancialTransactions({
    status: 'pending',
    date_to: today, // Vencidas até hoje
  }, { limit: 100 });

  // Filtrar transações em atraso (due_date < hoje)
  const overdueTransactions = transactions?.filter(transaction => {
    if (!transaction.due_date) return false;
    
    const dueDate = new Date(transaction.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isOverdue = dueDate < today;
    
    // Aplicar filtro de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        transaction.user?.nome_completo?.toLowerCase().includes(searchLower) ||
        transaction.description?.toLowerCase().includes(searchLower) ||
        transaction.id.toLowerCase().includes(searchLower);
      
      return isOverdue && matchesSearch;
    }
    
    return isOverdue;
  }) || [];

  const calculateDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTotalOverdueAmount = () => {
    return overdueTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  const handleSendReminder = (transactionId: string) => {
    // TODO: Implementar envio de lembrete
    console.log('Enviar lembrete para transação:', transactionId);
  };

  const handleExportOverdue = () => {
    // TODO: Implementar exportação
    console.log('Exportar lista de inadimplentes');
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando pagamentos em atraso...</span>
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
              Erro ao carregar dados: {(error as Error).message}
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
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Pagamentos em Atraso
            </CardTitle>
            <CardDescription>
              Membros com pagamentos vencidos que precisam de atenção
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportOverdue}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {overdueTransactions.length}
            </div>
            <div className="text-sm text-red-700">Pagamentos em Atraso</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(getTotalOverdueAmount())}
            </div>
            <div className="text-sm text-red-700">Valor Total em Atraso</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {overdueTransactions.length > 0 
                ? Math.round(overdueTransactions.reduce((sum, t) => 
                    sum + calculateDaysOverdue(t.due_date!), 0) / overdueTransactions.length)
                : 0
              }
            </div>
            <div className="text-sm text-red-700">Dias Médios de Atraso</div>
          </div>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, descrição ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de pagamentos em atraso */}
        {overdueTransactions.length === 0 ? (
          <div className="text-center py-8">
            {transactions?.length === 0 ? (
              <>
                <AlertTriangle className="h-12 w-12 mx-auto text-green-400 mb-4" />
                <p className="text-green-600 font-medium">Excelente! Nenhum pagamento em atraso</p>
                <p className="text-sm text-gray-600 mt-2">
                  Todos os pagamentos estão em dia
                </p>
              </>
            ) : (
              <>
                <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  Nenhum pagamento em atraso encontrado com os filtros aplicados
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {overdueTransactions.map((transaction) => {
              const daysOverdue = calculateDaysOverdue(transaction.due_date!);
              const severityLevel = daysOverdue > 30 ? 'high' : daysOverdue > 15 ? 'medium' : 'low';
              
              return (
                <Card 
                  key={transaction.id} 
                  className={`border-l-4 ${
                    severityLevel === 'high' ? 'border-l-red-500 bg-red-50' :
                    severityLevel === 'medium' ? 'border-l-orange-500 bg-orange-50' :
                    'border-l-yellow-500 bg-yellow-50'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(transaction.status)}>
                            {getStatusLabel(transaction.status)}
                          </Badge>
                          <Badge variant={
                            severityLevel === 'high' ? 'destructive' :
                            severityLevel === 'medium' ? 'secondary' : 'outline'
                          }>
                            {daysOverdue} dias de atraso
                          </Badge>
                        </div>

                        {/* Informações do usuário */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">
                                {transaction.user?.nome_completo || 'Usuário não identificado'}
                              </span>
                              {transaction.user?.cargo && (
                                <span className="text-sm text-gray-500">
                                  ({transaction.user.cargo})
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              <span className="font-medium">{formatCurrency(transaction.amount)}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Venceu em {new Date(transaction.due_date!).toLocaleDateString('pt-BR')}
                              </span>
                            </div>

                            {transaction.payment_method && (
                              <div className="flex items-center gap-1">
                                <span>{getPaymentMethodLabel(transaction.payment_method)}</span>
                              </div>
                            )}
                          </div>

                          {transaction.description && (
                            <div className="text-sm text-gray-700">
                              {transaction.description}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSendReminder(transaction.id)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Lembrete
                        </Button>
                        
                        {transaction.asaas_invoice_url && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(transaction.asaas_invoice_url, '_blank')}
                          >
                            Ver Cobrança
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Ações em lote */}
        {overdueTransactions.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              {overdueTransactions.length} pagamento(s) em atraso selecionado(s)
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Enviar Lembretes em Lote
              </Button>
              
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Gerar Lista de Contatos
              </Button>
            </div>
          </div>
        )}

        {/* Dicas para cobrança */}
        {overdueTransactions.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Dicas para Cobrança:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Entre em contato primeiro por WhatsApp ou telefone</li>
                <li>• Ofereça facilidades de pagamento quando possível</li>
                <li>• Mantenha tom respeitoso e compreensivo</li>
                <li>• Documente todas as tentativas de contato</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default OverduePayments;