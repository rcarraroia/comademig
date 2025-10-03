import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  QrCode, 
  CreditCard, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Percent,
  Zap,
  Shield
} from 'lucide-react'

interface PaymentMethod {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  advantages: string[]
  processingTime: string
  discount?: number
  reliability: 'high' | 'medium' | 'low'
  recommended?: boolean
}

interface AlternativePaymentSuggestionsProps {
  failedMethod?: string
  errorType?: string
  onMethodSelect: (methodId: string) => void
  currentValue: number
}

export default function AlternativePaymentSuggestions({ 
  failedMethod, 
  errorType, 
  onMethodSelect,
  currentValue 
}: AlternativePaymentSuggestionsProps) {
  
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'pix',
      name: 'PIX',
      icon: <QrCode className="h-5 w-5" />,
      description: 'Pagamento instantâneo via PIX',
      advantages: [
        'Confirmação imediata',
        '5% de desconto automático',
        'Disponível 24/7',
        'Sem taxas adicionais'
      ],
      processingTime: 'Instantâneo',
      discount: 5,
      reliability: 'high',
      recommended: true
    },
    {
      id: 'credit_card',
      name: 'Cartão de Crédito',
      icon: <CreditCard className="h-5 w-5" />,
      description: 'Pagamento com cartão de crédito',
      advantages: [
        'Parcelamento em até 12x',
        'Proteção contra fraude',
        'Confirmação rápida',
        'Amplamente aceito'
      ],
      processingTime: '1-2 dias úteis',
      reliability: 'high'
    },
    {
      id: 'boleto',
      name: 'Boleto Bancário',
      icon: <FileText className="h-5 w-5" />,
      description: 'Pagamento via boleto bancário',
      advantages: [
        'Não precisa de cartão',
        'Pagamento em qualquer banco',
        'Comprovante físico',
        'Sem limite de valor'
      ],
      processingTime: '1-3 dias úteis',
      reliability: 'medium'
    }
  ]

  // Filtrar métodos baseado no que falhou
  const availableMethods = paymentMethods.filter(method => method.id !== failedMethod)

  // Ordenar por recomendação e confiabilidade
  const sortedMethods = availableMethods.sort((a, b) => {
    if (a.recommended && !b.recommended) return -1
    if (!a.recommended && b.recommended) return 1
    
    const reliabilityOrder = { high: 3, medium: 2, low: 1 }
    return reliabilityOrder[b.reliability] - reliabilityOrder[a.reliability]
  })

  const getReliabilityBadge = (reliability: PaymentMethod['reliability']) => {
    const config = {
      high: { variant: 'default' as const, label: 'Alta Confiabilidade', icon: CheckCircle },
      medium: { variant: 'secondary' as const, label: 'Média Confiabilidade', icon: Clock },
      low: { variant: 'outline' as const, label: 'Baixa Confiabilidade', icon: AlertTriangle }
    }

    const { variant, label, icon: Icon } = config[reliability]

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const getFailureMessage = () => {
    switch (errorType) {
      case 'credit_card_declined':
        return 'Seu cartão foi recusado. Tente outro método de pagamento.'
      case 'insufficient_balance':
        return 'Saldo insuficiente. Escolha outro método de pagamento.'
      case 'network_error':
        return 'Problema de conexão. Tente novamente ou use outro método.'
      case 'rate_limit_exceeded':
        return 'Muitas tentativas. Aguarde alguns minutos ou use outro método.'
      default:
        return 'Houve um problema com o pagamento. Tente outro método.'
    }
  }

  const calculateDiscountedValue = (method: PaymentMethod) => {
    if (method.discount) {
      return currentValue * (1 - method.discount / 100)
    }
    return currentValue
  }

  return (
    <div className="space-y-6">
      {/* Mensagem de Erro */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div>
              <p className="font-medium text-orange-800">Problema no Pagamento</p>
              <p className="text-sm text-orange-700">{getFailureMessage()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métodos Alternativos */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Métodos de Pagamento Alternativos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedMethods.map((method) => (
            <Card 
              key={method.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                method.recommended ? 'ring-2 ring-green-200 bg-green-50' : ''
              }`}
              onClick={() => onMethodSelect(method.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {method.icon}
                    <CardTitle className="text-base">{method.name}</CardTitle>
                  </div>
                  {method.recommended && (
                    <Badge variant="default" className="bg-green-600">
                      <Zap className="h-3 w-3 mr-1" />
                      Recomendado
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm">
                  {method.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Valor com Desconto */}
                {method.discount && (
                  <div className="p-3 bg-green-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Percent className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        {method.discount}% de desconto
                      </span>
                    </div>
                    <div className="text-sm text-green-700">
                      <span className="line-through">R$ {currentValue.toFixed(2)}</span>
                      <span className="ml-2 font-bold">
                        R$ {calculateDiscountedValue(method).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Tempo de Processamento */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Processamento:</span>
                  <span className="font-medium">{method.processingTime}</span>
                </div>

                {/* Confiabilidade */}
                <div className="flex justify-center">
                  {getReliabilityBadge(method.reliability)}
                </div>

                <Separator />

                {/* Vantagens */}
                <div>
                  <p className="text-sm font-medium mb-2">Vantagens:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {method.advantages.map((advantage, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                        {advantage}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Botão de Ação */}
                <Button 
                  className="w-full" 
                  variant={method.recommended ? 'default' : 'outline'}
                  onClick={(e) => {
                    e.stopPropagation()
                    onMethodSelect(method.id)
                  }}
                >
                  {method.recommended && <Zap className="h-4 w-4 mr-2" />}
                  Pagar com {method.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Dicas de Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Dicas de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">PIX</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Verifique sempre o QR Code antes de pagar</li>
                <li>• Confirme o valor e destinatário</li>
                <li>• Guarde o comprovante de pagamento</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Cartão de Crédito</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Nunca compartilhe dados do cartão</li>
                <li>• Verifique se a conexão é segura (HTTPS)</li>
                <li>• Monitore seu extrato regularmente</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Boleto</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Pague apenas em bancos ou apps oficiais</li>
                <li>• Verifique o código de barras</li>
                <li>• Respeite a data de vencimento</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Geral</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Mantenha seus dados atualizados</li>
                <li>• Entre em contato em caso de dúvidas</li>
                <li>• Guarde todos os comprovantes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}