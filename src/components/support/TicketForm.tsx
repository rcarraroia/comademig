import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Send, 
  X, 
  AlertCircle,
  Loader2,
  HelpCircle,
  DollarSign,
  FileText,
  Building,
  User,
  MessageSquare
} from 'lucide-react';
import { useSupportCategories, useCreateTicket } from '@/hooks/useSupport';
import { toast } from 'sonner';

interface TicketFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

const TicketForm: React.FC<TicketFormProps> = ({ 
  onSuccess, 
  onCancel, 
  className = '' 
}) => {
  const [formData, setFormData] = useState({
    category_id: '',
    subject: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });

  const { data: categories, isLoading: loadingCategories } = useSupportCategories();
  const createTicketMutation = useCreateTicket();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.category_id) {
      toast.error('Selecione uma categoria');
      return;
    }
    
    if (!formData.subject.trim()) {
      toast.error('Assunto é obrigatório');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Descrição é obrigatória');
      return;
    }

    createTicketMutation.mutate(formData, {
      onSuccess: () => {
        // Resetar formulário
        setFormData({
          category_id: '',
          subject: '',
          description: '',
          priority: 'medium',
        });
        
        if (onSuccess) {
          onSuccess();
        }
      }
    });
  };

  const handleCancel = () => {
    setFormData({
      category_id: '',
      subject: '',
      description: '',
      priority: 'medium',
    });
    
    if (onCancel) {
      onCancel();
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'HelpCircle':
        return <HelpCircle className="h-4 w-4" />;
      case 'DollarSign':
        return <DollarSign className="h-4 w-4" />;
      case 'FileText':
        return <FileText className="h-4 w-4" />;
      case 'Building':
        return <Building className="h-4 w-4" />;
      case 'AlertCircle':
        return <AlertCircle className="h-4 w-4" />;
      case 'User':
        return <User className="h-4 w-4" />;
      case 'MessageSquare':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'text-gray-600';
      case 'medium':
        return 'text-blue-600';
      case 'high':
        return 'text-orange-600';
      case 'urgent':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loadingCategories) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando categorias...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Criar Novo Ticket de Suporte
        </CardTitle>
        <CardDescription>
          Descreva sua dúvida ou problema e nossa equipe irá ajudá-lo
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category.icon)}
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-xs text-gray-500">{category.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prioridade */}
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                setFormData(prev => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <span className={getPriorityColor('low')}>Baixa</span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className={getPriorityColor('medium')}>Média</span>
                </SelectItem>
                <SelectItem value="high">
                  <span className={getPriorityColor('high')}>Alta</span>
                </SelectItem>
                <SelectItem value="urgent">
                  <span className={getPriorityColor('urgent')}>Urgente</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assunto */}
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Descreva brevemente o problema ou dúvida"
              maxLength={200}
              required
            />
            <div className="text-xs text-gray-500 text-right">
              {formData.subject.length}/200 caracteres
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição Detalhada *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva detalhadamente sua dúvida ou problema. Inclua informações como quando ocorreu, passos que você seguiu, mensagens de erro, etc."
              rows={6}
              maxLength={2000}
              required
            />
            <div className="text-xs text-gray-500 text-right">
              {formData.description.length}/2000 caracteres
            </div>
          </div>

          {/* Dicas */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Dicas para um atendimento mais rápido:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Seja específico sobre o problema</li>
                <li>• Inclua capturas de tela se necessário</li>
                <li>• Mencione quando o problema começou</li>
                <li>• Descreva os passos que você já tentou</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Botões */}
          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={createTicketMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={createTicketMutation.isPending}
              className="bg-comademig-blue hover:bg-comademig-blue/90"
            >
              {createTicketMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar Ticket
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TicketForm;