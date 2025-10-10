
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTicket, useSupportCategories } from "@/hooks/useSupport";

interface NovoTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NovoTicketModal = ({ open, onOpenChange }: NovoTicketModalProps) => {
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    category_id: ""
  });

  const criarTicket = useCreateTicket();
  const { data: categories = [] } = useSupportCategories();

  const handleSubmit = async () => {
    if (!formData.subject.trim() || !formData.description.trim() || !formData.category_id) {
      return;
    }

    try {
      await criarTicket.mutateAsync(formData);
      
      // Reset form e fechar modal
      setFormData({
        subject: "",
        description: "",
        priority: "medium",
        category_id: ""
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
            <Label htmlFor="category">Categoria *</Label>
            <Select 
              value={formData.category_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              placeholder="Descreva brevemente o problema"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="priority">Prioridade</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Normal</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Descrição do Problema *</Label>
            <Textarea
              id="description"
              placeholder="Descreva o problema em detalhes..."
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
              disabled={!formData.subject.trim() || !formData.description.trim() || !formData.category_id || criarTicket.isPending}
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
