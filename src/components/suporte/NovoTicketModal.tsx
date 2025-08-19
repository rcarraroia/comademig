
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSuporteTickets } from "@/hooks/useSuporteTickets";

interface NovoTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NovoTicketModal = ({ open, onOpenChange }: NovoTicketModalProps) => {
  const [formData, setFormData] = useState({
    assunto: "",
    descricao: "",
    prioridade: "normal"
  });

  const { criarTicket } = useSuporteTickets();

  const handleSubmit = async () => {
    if (!formData.assunto.trim() || !formData.descricao.trim()) {
      return;
    }

    try {
      await criarTicket.mutateAsync(formData);
      
      // Reset form e fechar modal
      setFormData({
        assunto: "",
        descricao: "",
        prioridade: "normal"
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Ticket de Suporte</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="assunto">Assunto *</Label>
            <Input
              id="assunto"
              placeholder="Descreva brevemente o problema"
              value={formData.assunto}
              onChange={(e) => setFormData(prev => ({ ...prev, assunto: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="prioridade">Prioridade</Label>
            <Select 
              value={formData.prioridade} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, prioridade: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="descricao">Descrição do Problema *</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o problema em detalhes..."
              rows={6}
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Seja específico sobre o problema para um atendimento mais rápido
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={criarTicket.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.assunto.trim() || !formData.descricao.trim() || criarTicket.isPending}
              className="bg-comademig-blue hover:bg-comademig-blue/90"
            >
              {criarTicket.isPending ? 'Criando...' : 'Criar Ticket'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
