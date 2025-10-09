import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Lock } from 'lucide-react';
import { 
  validarNumeroCartao, 
  formatarNumeroCartao, 
  detectarBandeiraCartao 
} from '@/hooks/useCheckoutTransparente';

// ============================================================================
// TYPES
// ============================================================================

export interface DadosCartao {
  numero: string;
  nome_titular: string;
  mes_validade: string;
  ano_validade: string;
  cvv: string;
  parcelas: number;
}

interface CardPaymentFormProps {
  valor: number;
  maxParcelas: number;
  onChange: (dados: DadosCartao) => void;
  onValidChange?: (isValid: boolean) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CardPaymentForm({ 
  valor, 
  maxParcelas, 
  onChange,
  onValidChange 
}: CardPaymentFormProps) {
  const [dados, setDados] = useState<DadosCartao>({
    numero: '',
    nome_titular: '',
    mes_validade: '',
    ano_validade: '',
    cvv: '',
    parcelas: 1,
  });

  const [erros, setErros] = useState<Partial<Record<keyof DadosCartao, string>>>({});
  const [bandeira, setBandeira] = useState<string>('');

  // Validar formulário
  useEffect(() => {
    const novosErros: Partial<Record<keyof DadosCartao, string>> = {};

    // Validar número do cartão
    if (dados.numero && !validarNumeroCartao(dados.numero)) {
      novosErros.numero = 'Número de cartão inválido';
    }

    // Validar nome
    if (dados.nome_titular && dados.nome_titular.length < 3) {
      novosErros.nome_titular = 'Nome muito curto';
    }

    // Validar mês
    if (dados.mes_validade) {
      const mes = parseInt(dados.mes_validade);
      if (mes < 1 || mes > 12) {
        novosErros.mes_validade = 'Mês inválido';
      }
    }

    // Validar ano
    if (dados.ano_validade) {
      const anoAtual = new Date().getFullYear() % 100;
      const ano = parseInt(dados.ano_validade);
      if (ano < anoAtual) {
        novosErros.ano_validade = 'Cartão vencido';
      }
    }

    // Validar CVV
    if (dados.cvv && (dados.cvv.length < 3 || dados.cvv.length > 4)) {
      novosErros.cvv = 'CVV inválido';
    }

    setErros(novosErros);

    // Verificar se formulário está válido
    const isValid = 
      dados.numero.length > 0 &&
      dados.nome_titular.length > 0 &&
      dados.mes_validade.length > 0 &&
      dados.ano_validade.length > 0 &&
      dados.cvv.length > 0 &&
      Object.keys(novosErros).length === 0;

    onValidChange?.(isValid);
    onChange(dados);
  }, [dados, onChange, onValidChange]);

  // Atualizar bandeira quando número mudar
  useEffect(() => {
    if (dados.numero.length >= 4) {
      setBandeira(detectarBandeiraCartao(dados.numero));
    } else {
      setBandeira('');
    }
  }, [dados.numero]);

  // Handlers
  const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, '');
    const formatado = formatarNumeroCartao(valor);
    setDados({ ...dados, numero: formatado });
  };

  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.toUpperCase();
    setDados({ ...dados, nome_titular: valor });
  };

  const handleMesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, '').slice(0, 2);
    setDados({ ...dados, mes_validade: valor });
  };

  const handleAnoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, '').slice(0, 2);
    setDados({ ...dados, ano_validade: valor });
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, '').slice(0, 4);
    setDados({ ...dados, cvv: valor });
  };

  const handleParcelasChange = (value: string) => {
    setDados({ ...dados, parcelas: parseInt(value) });
  };

  // Calcular valor da parcela
  const valorParcela = valor / dados.parcelas;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Dados do Cartão</h3>
          <Lock className="h-4 w-4 text-muted-foreground ml-auto" />
        </div>

        {/* Número do Cartão */}
        <div className="space-y-2">
          <Label htmlFor="numero">Número do Cartão</Label>
          <div className="relative">
            <Input
              id="numero"
              placeholder="0000 0000 0000 0000"
              value={dados.numero}
              onChange={handleNumeroChange}
              maxLength={19}
              className={erros.numero ? 'border-red-500' : ''}
            />
            {bandeira && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {bandeira}
              </span>
            )}
          </div>
          {erros.numero && (
            <p className="text-xs text-red-500">{erros.numero}</p>
          )}
        </div>

        {/* Nome do Titular */}
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Titular</Label>
          <Input
            id="nome"
            placeholder="NOME COMO NO CARTÃO"
            value={dados.nome_titular}
            onChange={handleNomeChange}
            className={erros.nome_titular ? 'border-red-500' : ''}
          />
          {erros.nome_titular && (
            <p className="text-xs text-red-500">{erros.nome_titular}</p>
          )}
        </div>

        {/* Validade e CVV */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mes">Mês</Label>
            <Input
              id="mes"
              placeholder="MM"
              value={dados.mes_validade}
              onChange={handleMesChange}
              maxLength={2}
              className={erros.mes_validade ? 'border-red-500' : ''}
            />
            {erros.mes_validade && (
              <p className="text-xs text-red-500">{erros.mes_validade}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ano">Ano</Label>
            <Input
              id="ano"
              placeholder="AA"
              value={dados.ano_validade}
              onChange={handleAnoChange}
              maxLength={2}
              className={erros.ano_validade ? 'border-red-500' : ''}
            />
            {erros.ano_validade && (
              <p className="text-xs text-red-500">{erros.ano_validade}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              placeholder="123"
              value={dados.cvv}
              onChange={handleCvvChange}
              maxLength={4}
              type="password"
              className={erros.cvv ? 'border-red-500' : ''}
            />
            {erros.cvv && (
              <p className="text-xs text-red-500">{erros.cvv}</p>
            )}
          </div>
        </div>

        {/* Parcelas */}
        {maxParcelas > 1 && (
          <div className="space-y-2">
            <Label htmlFor="parcelas">Número de Parcelas</Label>
            <Select
              value={dados.parcelas.toString()}
              onValueChange={handleParcelasChange}
            >
              <SelectTrigger id="parcelas">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: maxParcelas }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}x de R$ {valorParcela.toFixed(2)}
                    {num === 1 ? ' (à vista)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Resumo */}
        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total a pagar:</span>
            <span className="font-semibold">
              {dados.parcelas}x de R$ {valorParcela.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold mt-1">
            <span>Total:</span>
            <span>R$ {valor.toFixed(2)}</span>
          </div>
        </div>

        {/* Aviso de Segurança */}
        <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
          <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Seus dados estão protegidos com criptografia de ponta a ponta.
            Não armazenamos informações do seu cartão.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
