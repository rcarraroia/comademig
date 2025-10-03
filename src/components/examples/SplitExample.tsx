import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useAsaasSplits } from '@/hooks/useAsaasSplits'
import { useAsaasPixPayments } from '@/hooks/useAsaasPixPayments'
import { useAuthState } from '@/hooks/useAuthState'
import { Percent, Users, DollarSign, Zap } from 'lucide-react'
import { toast } from 'sonner'

export default function SplitExample() {
  const { user } = useAuthState()
  const { createPixPayment } = useAsaasPixPayments()
  const { configureSplit, processSplits, getSplitsByCobranca } = useAsaasSplits()

  const [paymentValue, setPaymentValue] = useState<string>('100.00')
  const [affiliatePercentage, setAffiliatePercentage] = useState<string>('10')
  const [currentCobrancaId, setCurrentCobrancaId] = useState<string>('')
  const [isCreatingPayment, setIsCreatingPayment] = useState(false)

  const splitsQuery = getSplitsByCobranca(currentCobrancaId)

  // Simular ID de afiliado (em produção, viria de seleção)
  const mockAffiliateId = 'affiliate-user-id-123'

  const handleCreatePaymentWithSplit = async () => {
    if (!user) {
      toast.error('Faça login para continuar')
      return
    }

    if (!paymentValue || !affiliatePercentage) {
      toast.error('Preencha todos os campos')
      return
    }

    setIsCreatingPayment(true)

    try {
      // 1. Criar pagamento PIX
      const paymentResult = await createPixPayment({
        customerId: user.id,
        value: parseFloat(paymentValue),
        description: `Exemplo de pagamento com split - ${affiliatePercentage}% para afiliado`,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })

      if (!paymentResult.success) {
        throw new Error('Erro ao criar pagamento')
      }

      const cobrancaId = paymentResult.data.cobrancaId
      setCurrentCobrancaId(cobrancaId)

      // 2. Configurar split para o afiliado
      await configureSplit.mutateAsync({
        cobrancaId,
        affiliateId: mockAffiliateId,
        percentage: parseFloat(affiliatePercentage),
        description: `Split automático de ${affiliatePercentage}% para afiliado`
      })

      toast.success('Pagamento criado com split configurado!')

    } catch (error) {
      console.error('Erro ao criar pagamento com split:', error)
      toast.error('Erro ao criar pagamento com split')
    } finally {
      setIsCreatingPayment(false)
    }
  }

  const handleProcessSplits = async () => {
    if (!currentCobrancaId) {
      toast.error('Nenhuma cobrança selecionada')
      return
    }

    try {
      await processSplits.mutateAsync({
        cobrancaId: currentCobrancaId,
        paymentValue: parseFloat(paymentValue)
      })
    } catch (error) {
      console.error('Erro ao processar splits:', error)
    }
  }

  const calculateCommission = () => {
    const value = parseFloat(paymentValue) || 0
    const percentage = parseFloat(affiliatePercentage) || 0
    return (value * percentage) / 100
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Exemplo: Sistema de Split para Afiliados
          </CardTitle>
          <CardDescription>
            Demonstração completa do sistema de divisão automática de comissões
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuração do Exemplo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Valor do Pagamento (R$)</Label>
              <Input
                id="value"
                type="number"
                min="1"
                step="0.01"
                value={paymentValue}
                onChange={(e) => setPaymentValue(e.target.value)}
                placeholder="100.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentage">Porcentagem do Afiliado (%)</Label>
              <Input
                id="percentage"
                type="number"
                min="0.1"
                max="50"
                step="0.1"
                value={affiliatePercentage}
                onChange={(e) => setAffiliatePercentage(e.target.value)}
                placeholder="10"
              />
            </div>
          </div>

          {/* Resumo da Comissão */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Resumo da Comissão</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Valor Total</p>
                <p className="font-medium">R$ {parseFloat(paymentValue || '0').toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Comissão ({affiliatePercentage}%)</p>
                <p className="font-medium text-green-600">R$ {calculateCommission().toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Valor Líquido</p>
                <p className="font-medium">R$ {(parseFloat(paymentValue || '0') - calculateCommission()).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleCreatePaymentWithSplit}
              disabled={isCreatingPayment || !user}
              className="flex-1"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isCreatingPayment ? 'Criando...' : 'Criar Pagamento com Split'}
            </Button>

            {currentCobrancaId && (
              <Button 
                onClick={handleProcessSplits}
                disabled={processSplits.isPending}
                variant="outline"
                className="flex-1"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                {processSplits.isPending ? 'Processando...' : 'Processar Splits'}
              </Button>
            )}
          </div>

          {!user && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Faça login para testar o sistema de splits
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Splits Configurados */}
      {currentCobrancaId && splitsQuery.data && splitsQuery.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Splits Configurados
            </CardTitle>
            <CardDescription>
              Splits ativos para a cobrança atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {splitsQuery.data.map((split: any) => (
                <div key={split.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">Afiliado: {split.affiliate_id}</p>
                      <p className="text-sm text-muted-foreground">Split ID: {split.id}</p>
                    </div>
                    <Badge variant={split.status === 'active' ? 'default' : 'secondary'}>
                      {split.status}
                    </Badge>
                  </div>

                  <Separator className="my-2" />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Porcentagem</p>
                      <p className="font-medium">{split.percentage}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Comissão</p>
                      <p className="font-medium text-green-600">
                        R$ {split.commission_value?.toFixed(2) || calculateCommission().toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Transfer ID</p>
                      <p className="font-medium text-xs">
                        {split.transfer_id || 'Pendente'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">{split.status}</p>
                    </div>
                  </div>

                  {split.notes && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs">
                      <p className="text-muted-foreground">Observações:</p>
                      <p>{split.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona o Sistema de Splits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">1. Configuração Automática</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Split configurado no momento da criação do pagamento</li>
                <li>• Porcentagem definida por afiliado</li>
                <li>• Validação de valores mínimos</li>
                <li>• Registro para auditoria</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. Processamento Automático</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ativado via webhook quando pagamento é confirmado</li>
                <li>• Transferência PIX automática para afiliado</li>
                <li>• Histórico de comissões registrado</li>
                <li>• Notificações em tempo real</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. Segurança e Validação</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Validação de tokens de webhook</li>
                <li>• Verificação de valores mínimos</li>
                <li>• Prevenção de processamento duplicado</li>
                <li>• Logs completos para auditoria</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">4. Dashboard do Afiliado</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Visualização de comissões em tempo real</li>
                <li>• Histórico de pagamentos</li>
                <li>• Status de transferências</li>
                <li>• Estatísticas de performance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}