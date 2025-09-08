
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, CreditCard, Info } from "lucide-react";
import { useCertidoesWithPayment } from "@/hooks/useCertidoesWithPayment";

interface FormSolicitacaoCertidaoProps {
  onClose: () => void;
  onProceedToPayment?: (certidaoData: any, valor: number) => void;
}

const certidaoTypes = [
  { 
    value: "ministerio", 
    label: "Certidão de Ministério",
    description: "Documento que comprova seu ministério na COMADEMIG",
    valor: 45.00
  },
  { 
    value: "vinculo", 
    label: "Certidão de Vínculo",
    description: "Certifica seu vínculo com uma igreja local",
    valor: 35.00
  },
  { 
    value: "atuacao", 
    label: "Certidão de Atuação",
    description: "Comprova sua atuação ministerial em campo específico",
    valor: 40.00
  },
  { 
    value: "historico", 
    label: "Histórico Ministerial",
    description: "Histórico completo de sua trajetória ministerial",
    valor: 55.00
  },
  { 
    value: "ordenacao", 
    label: "Certidão de Ordenação",
    description: "Certifica sua ordenação ministerial",
    valor: 50.00
  }
];

export const FormSolicitacaoCertidao = ({ onClose, onProceedToPayment }: FormSolicitacaoCertidaoProps) => {
  const [selectedType, setSelectedType] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [calculatedValue, setCalculatedValue] = useState<number>(0);
  
  const { 
    calcularValorCertidao, 
    solicitarCertidaoComPagamento,
    valoresCertidoes 
  } = useCertidoesWithPayment();

  // Atualizar valor quando tipo for selecionado
  const handleTypeChange = async (tipo: string) => {
    setSelectedType(tipo);
    
    try {
      const valor = await calcularValorCertidao(tipo);
      setCalculatedValue(valor);
    } catch (error) {
      console.error('Erro ao calcular valor:', error);
      // Usar valor padrão do tipo
      const tipoInfo = certidaoTypes.find(t => t.value === tipo);
      setCalculatedValue(tipoInfo?.valor || 45.00);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType || !justificativa.trim()) return;
    
    try {
      // Preparar dados para pagamento
      const certidaoData = await solicitarCertidaoComPagamento.mutateAsync({
        tipo_certidao: selectedType,
        justificativa: justificativa.trim()
      });
      
      // Se há callback para pagamento, usar ele
      if (onProceedToPayment) {
        onProceedToPayment(certidaoData, calculatedValue);
      } else {
        // Caso contrário, redirecionar para checkout (implementar depois)
        console.log('Redirecionando para checkout:', certidaoData);
      }
      
      // Limpar formulário
      setSelectedType("");
      setJustificativa("");
      setCalculatedValue(0);
      onClose();
      
    } catch (error) {
      console.error('Erro ao preparar solicitação de certidão:', error);
    }
  };

  return (
    <Card className="border-comademig-gold">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-comademig-gold">Nova Solicitação de Certidão</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="type">Tipo de Certidão</Label>
          <Select value={selectedType} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de certidão" />
            </SelectTrigger>
            <SelectContent>
              {certidaoTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{type.label}</span>
                    <span className="text-sm text-gray-500">R$ {type.valor.toFixed(2)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedType && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">
                    {certidaoTypes.find(t => t.value === selectedType)?.label}
                  </p>
                  <p className="text-blue-600 mt-1">
                    {certidaoTypes.find(t => t.value === selectedType)?.description}
                  </p>
                  <p className="font-semibold text-blue-800 mt-2">
                    Valor: R$ {calculatedValue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="justificativa">Justificativa/Observações</Label>
          <Textarea
            id="justificativa"
            placeholder="Descreva o motivo da solicitação e outras observações relevantes..."
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            rows={4}
          />
        </div>

        {selectedType && calculatedValue > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <CreditCard className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Pagamento Obrigatório:</strong> Esta certidão requer pagamento de R$ {calculatedValue.toFixed(2)} antes do processamento.
              <br />
              <small>Você será direcionado para o checkout após confirmar os dados.</small>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex space-x-3 pt-4">
          <Button 
            onClick={handleSubmit}
            disabled={!selectedType || !justificativa.trim() || solicitarCertidaoComPagamento.isPending}
            className="bg-comademig-blue hover:bg-comademig-blue/90"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {solicitarCertidaoComPagamento.isPending ? 'Preparando...' : 'Prosseguir para Pagamento'}
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
