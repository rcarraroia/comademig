import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAsaasSplits } from '@/hooks/useAsaasSplits'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Percent, Users, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface SplitManagerProps {
  cobrancaId: string
  paymentValue: number
  onSplitConfigured?: () => void
}

interface Affiliate {
  id: string
  full_name: string
  email: string
}

export default function SplitManager({ cobrancaId, paymentValue, onSplitConfigured }: SplitManagerProps) {
  const [selectedAffiliate, setSelectedAffiliate] = useState<string>('')
  const [percentage, setPercentage] = useState<string>('10')
  const [description, setDescription] = useState<string>('')

  const { configureSplit, processSplits, getSplitsByCobranca, isConfiguring, isProcessing } = useAsaasSplits()
  const splitsQuery = getSplitsByCobranca(cobrancaId)

  // Buscar afiliados disponíveis
  const { data: affiliates = [] } = useQuery({
    queryKey: ['affiliates'],
    queryFn: async (): Promise<Affiliate[]> => {
      const { data, error } = await supabase
        .from('profiles' as any)
        .select('id, full_name, email')
        .eq('role', 'affiliate')
        .eq('status', 'active')
        .order('full_name')

      if (error) {
        console.error('Error fetching affiliates:', error)
        return []
      }

      return (data || []) as Affiliate[]
    }
  })

  const handleConfigureSplit = async () => {
    if (!selectedAffiliate || !percentage) {
      toast.error('Selecione um afiliado e defina a porcentagem')
      return
    }

    const percentageNum = parseFloat(percentage)
    if (percentageNum <= 0 || percentageNum > 50) {
      toast.error('Porcentagem deve ser entre 0.1% e 50%')
      return
    }

    try {
      await configureSplit.mutateAsync({
        cobrancaId,
        affiliateId: selectedAffiliate,
        percentage: percentageNum,
        description: description || `Split de ${percentageNum}% para afiliado`
      })

      // Limpar formulário
      setSelectedAffiliate('')
      setPercentage('10')
      setDescription('')
      
      onSplitConfigured?.()
    } catch (error) {
      console.error('Error configuring split:', error)
    }
  }

  const handleProcessSplits = async () => {
    try {
      await processSplits.mutateAsync({
        cobrancaId,
        paymentValue
      })
    } catch (error) {
      console.error('Error processing splits:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativo', variant: 'default' as const, icon: Clock },
      processed: { label: 'Processado', variant: 'default' as const, icon: CheckCircle },
      cancelled: { label: 'Cancelado', variant: 'secondary' as const, icon: XCircle },
      error: { label: 'Erro', variant: 'destructive' as const, icon: XCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const calculateCommission = (percentage: number) => {
    return (paymentValue * percentage) / 100
  }

  return (
    <div className="space-y-6">
      {/* Configurar Novo Split */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Configurar Split de Afiliado
          </CardTitle>
          <CardDescription>
            Configure a divisão de comissão para afiliados nesta cobrança
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="affiliate">Afiliado</Label>
              <Select value={selectedAffiliate} onValueChange={setSelectedAffiliate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um afiliado" />
                </SelectTrigger>
                <SelectContent>
                  {affiliates.map((affiliate) => (
                    <SelectItem key={affiliate.id} value={affiliate.id}>
                      {affiliate.full_name} ({affiliate.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentage">Porcentagem (%)</Label>
              <Input
                id="percentage"
                type="number"
                min="0.1"
                max="50"
                step="0.1"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do split"
            />
          </div>

          {percentage && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span>Valor do pagamento:</span>
                <span className="font-medium">R$ {paymentValue.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Comissão ({percentage}%):</span>
                <span className="font-medium text-green-600">
                  R$ {calculateCommission(parseFloat(percentage) || 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <Button 
            onClick={handleConfigureSplit}
            disabled={isConfiguring || !selectedAffiliate || !percentage}
            className="w-full"
          >
            {isConfiguring ? 'Configurando...' : 'Configurar Split'}
          </Button>
        </CardContent>
      </Card>

      {/* Splits Existentes */}
      {splitsQuery.data && splitsQuery.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Splits Configurados
            </CardTitle>
            <CardDescription>
              Splits ativos e processados para esta cobrança
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {splitsQuery.data.map((split: any) => (
                <div key={split.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{split.affiliate?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{split.affiliate?.email}</p>
                    </div>
                    {getStatusBadge(split.status)}
                  </div>

                  <Separator className="my-2" />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Porcentagem</p>
                      <p className="font-medium">{split.percentage}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Comissão</p>
                      <p className="font-medium">
                        {split.commission_value 
                          ? `R$ ${split.commission_value.toFixed(2)}`
                          : `R$ ${calculateCommission(split.percentage).toFixed(2)}`
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Transfer ID</p>
                      <p className="font-medium text-xs">
                        {split.transfer_id || 'Pendente'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Processado em</p>
                      <p className="font-medium text-xs">
                        {split.processed_at 
                          ? new Date(split.processed_at).toLocaleDateString('pt-BR')
                          : 'Pendente'
                        }
                      </p>
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

              {/* Botão para processar splits */}
              {splitsQuery.data.some((split: any) => split.status === 'active') && (
                <div className="pt-4">
                  <Button 
                    onClick={handleProcessSplits}
                    disabled={isProcessing}
                    className="w-full"
                    variant="outline"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    {isProcessing ? 'Processando...' : 'Processar Splits Pendentes'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}