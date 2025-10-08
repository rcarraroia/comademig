import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface AdvancedFilters {
  tipoMembro: string[];
  status: string[];
  periodo: string;
}

interface AdvancedFiltersPanelProps {
  onApplyFilters: (filters: AdvancedFilters) => void;
  activeFiltersCount: number;
}

const MEMBER_TYPES = [
  { value: 'membro', label: 'Membro' },
  { value: 'pastor', label: 'Pastor' },
  { value: 'moderador', label: 'Moderador' },
  { value: 'admin', label: 'Administrador' },
  { value: 'super_admin', label: 'Super Administrador' },
];

const STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'pendente', label: 'Pendente' },
];

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Todos os períodos' },
  { value: '7days', label: 'Últimos 7 dias' },
  { value: '30days', label: 'Últimos 30 dias' },
  { value: '90days', label: 'Últimos 90 dias' },
  { value: '1year', label: 'Último ano' },
];

export function AdvancedFiltersPanel({ onApplyFilters, activeFiltersCount }: AdvancedFiltersPanelProps) {
  const [open, setOpen] = useState(false);
  const [tipoMembro, setTipoMembro] = useState<string[]>([]);
  const [status, setStatus] = useState<string[]>([]);
  const [periodo, setPeriodo] = useState('all');

  const handleToggleTipoMembro = (value: string) => {
    setTipoMembro(prev =>
      prev.includes(value)
        ? prev.filter(t => t !== value)
        : [...prev, value]
    );
  };

  const handleToggleStatus = (value: string) => {
    setStatus(prev =>
      prev.includes(value)
        ? prev.filter(s => s !== value)
        : [...prev, value]
    );
  };

  const handleApply = () => {
    onApplyFilters({ tipoMembro, status, periodo });
    setOpen(false);
  };

  const handleClear = () => {
    setTipoMembro([]);
    setStatus([]);
    setPeriodo('all');
    onApplyFilters({ tipoMembro: [], status: [], periodo: 'all' });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filtros Avançados
          {activeFiltersCount > 0 && (
            <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filtros Avançados</SheetTitle>
          <SheetDescription>
            Refine sua busca com múltiplos filtros
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Filtro por Tipo de Membro */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Tipo de Membro</Label>
            <div className="space-y-2">
              {MEMBER_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tipo-${type.value}`}
                    checked={tipoMembro.includes(type.value)}
                    onCheckedChange={() => handleToggleTipoMembro(type.value)}
                  />
                  <label
                    htmlFor={`tipo-${type.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Filtro por Status */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Status</Label>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((statusOption) => (
                <div key={statusOption.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${statusOption.value}`}
                    checked={status.includes(statusOption.value)}
                    onCheckedChange={() => handleToggleStatus(statusOption.value)}
                  />
                  <label
                    htmlFor={`status-${statusOption.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {statusOption.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Filtro por Período */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Período de Cadastro</Label>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2 mt-8">
          <Button onClick={handleApply} className="flex-1">
            Aplicar Filtros
          </Button>
          <Button onClick={handleClear} variant="outline" className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
