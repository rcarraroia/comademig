
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { useCertidoes } from "@/hooks/useCertidoes";

interface FormSolicitacaoCertidaoProps {
  onClose: () => void;
}

const certidaoTypes = [
  { value: "ministerio", label: "Certidão de Ministério" },
  { value: "vinculo", label: "Certidão de Vínculo" },
  { value: "atuacao", label: "Certidão de Atuação" },
  { value: "historico", label: "Histórico Ministerial" },
  { value: "ordenacao", label: "Certidão de Ordenação" }
];

export const FormSolicitacaoCertidao = ({ onClose }: FormSolicitacaoCertidaoProps) => {
  const [selectedType, setSelectedType] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const { solicitarCertidao } = useCertidoes();

  const handleSubmit = async () => {
    if (!selectedType || !justificativa.trim()) return;
    
    try {
      await solicitarCertidao.mutateAsync({
        tipo: selectedType,
        justificativa: justificativa.trim()
      });
      
      setSelectedType("");
      setJustificativa("");
      onClose();
    } catch (error) {
      console.error('Erro ao solicitar certidão:', error);
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
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de certidão" />
            </SelectTrigger>
            <SelectContent>
              {certidaoTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        <div className="flex space-x-3 pt-4">
          <Button 
            onClick={handleSubmit}
            disabled={!selectedType || !justificativa.trim() || solicitarCertidao.isPending}
            className="bg-comademig-blue hover:bg-comademig-blue/90"
          >
            {solicitarCertidao.isPending ? 'Enviando...' : 'Enviar Solicitação'}
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
