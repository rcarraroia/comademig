import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Filter, X, Download, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface FilterState {
  dateRange: {
    from?: Date
    to?: Date
  }
  status: string[]
  paymentMethod: string[]
  serviceType: string[]
  minValue?: number
  maxValue?: number
}

interface FinancialFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  onExport: () => void
  onRefresh: () => void
  isLoading?: boolean
}

export default function FinancialFilters({ 
  onFiltersChange, 
  onExport, 
  onRefresh, 
  isLoading = false 
}: FinancialFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {},
    status: [],
    paymentMethod: [],
    serviceType: [],
    minValue: undefined,
    maxValue: undefined
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  const statusOptions = [
    { value: 'CONFIRMED', label: 'Confirmado' },
    { value: 'RECEIVED', label: 'Recebido' },
    { value: 'PENDING', label: 'Pendente' },
    { value: 'OVERDUE', label: 'Vencido' },
    { value: 'CANCELLED', label: 'Cancelado' }
  ]

  const paymentMethodOptions = [
    { value: 'PIX', label: 'PIX' },
    { value: 'CREDIT_CARD', label: 'Cartão de Crédito' },
    { value: 'BOLETO', label: 'Boleto' }
  ]

  const serviceTypeOptions = [
    { value: 'filiacao', label: 'Filiação' },
    { value: 'certidao', label: 'Certidão' },
    { value: 'regularizacao', label: 'Regularização' },
    { value: 'evento', label: 'Evento' },
    { value: 'taxa_anual', label: 'Taxa Anual' }
  ]

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFiltersChange(updatedFilters)
  }

  const addFilter = (type: keyof FilterState, value: string) => {
    if (type === 'status' || type === 'paymentMethod' || type === 'serviceType') {
      const currentValues = filters[type] as string[]
      if (!currentValues.includes(value)) {
        updateFilters({
          [type]: [...currentValues, value]
        })
      }
    }
  }

  const removeFilter = (type: keyof FilterState, value: string) => {
    if (type === 'status' || type === 'paymentMethod' || type === 'serviceType') {
      const currentValues = filters[type] as string[]
      updateFilters({
        [type]: currentValues.filter(v => v !== value)
      })
    }
  }

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      dateRange: {},
      status: [],
      paymentMethod: [],
      serviceType: [],
      minValue: undefined,
      maxValue: undefined
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const hasActiveFilters = () => {
    return (
      filters.dateRange.from ||
      filters.dateRange.to ||
      filters.status.length > 0 ||
      filters.paymentMethod.length > 0 ||
      filters.serviceType.length > 0 ||
      filters.minValue !== undefined ||
      filters.maxValue !== undefined
    )
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.dateRange.from || filters.dateRange.to) count++
    count += filters.status.length
    count += filters.paymentMethod.length
    count += filters.serviceType.length
    if (filters.minValue !== undefined) count++
    if (filters.maxValue !== undefined) count++
    return count
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
              {hasActiveFilters() && (
                <Badge variant="secondary" className="ml-2">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Filtre os dados financeiros por período, status e outros critérios
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros Básicos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Período */}
          <div className="space-y-2">
            <Label>Período</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.from ? (
                    filters.dateRange.to ? (
                      <>
                        {format(filters.dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                        {format(filters.dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                      </>
                    ) : (
                      format(filters.dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    "Selecionar período"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={filters.dateRange.from}
                  selected={filters.dateRange}
                  onSelect={(range) => updateFilters({ dateRange: range || {} })}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select onValueChange={(value) => addFilter('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Método de Pagamento */}
          <div className="space-y-2">
            <Label>Método de Pagamento</Label>
            <Select onValueChange={(value) => addFilter('paymentMethod', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar método" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros Avançados */}
        {showAdvanced && (
          <>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tipo de Serviço */}
              <div className="space-y-2">
                <Label>Tipo de Serviço</Label>
                <Select onValueChange={(value) => addFilter('serviceType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Valor Mínimo */}
              <div className="space-y-2">
                <Label>Valor Mínimo (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={filters.minValue || ''}
                  onChange={(e) => updateFilters({ 
                    minValue: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                />
              </div>

              {/* Valor Máximo */}
              <div className="space-y-2">
                <Label>Valor Máximo (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={filters.maxValue || ''}
                  onChange={(e) => updateFilters({ 
                    maxValue: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                />
              </div>
            </div>
          </>
        )}

        {/* Filtros Ativos */}
        {hasActiveFilters() && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Filtros Ativos</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar Todos
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.status.map((status) => (
                  <Badge key={status} variant="secondary" className="flex items-center gap-1">
                    Status: {statusOptions.find(o => o.value === status)?.label}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeFilter('status', status)}
                    />
                  </Badge>
                ))}
                {filters.paymentMethod.map((method) => (
                  <Badge key={method} variant="secondary" className="flex items-center gap-1">
                    Método: {paymentMethodOptions.find(o => o.value === method)?.label}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeFilter('paymentMethod', method)}
                    />
                  </Badge>
                ))}
                {filters.serviceType.map((service) => (
                  <Badge key={service} variant="secondary" className="flex items-center gap-1">
                    Serviço: {serviceTypeOptions.find(o => o.value === service)?.label}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeFilter('serviceType', service)}
                    />
                  </Badge>
                ))}
                {filters.minValue !== undefined && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Min: R$ {filters.minValue.toFixed(2)}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilters({ minValue: undefined })}
                    />
                  </Badge>
                )}
                {filters.maxValue !== undefined && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Max: R$ {filters.maxValue.toFixed(2)}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilters({ maxValue: undefined })}
                    />
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}

        {/* Toggle Filtros Avançados */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Ocultar' : 'Mostrar'} Filtros Avançados
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}