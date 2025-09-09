import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SubscriptionPlan {
    id?: string;
    name: string;
    description: string;
    price: number;
    billing_cycle: 'monthly' | 'yearly';
    features: string[];
    is_active: boolean;
    member_type_ids: string[];
    max_users?: number;
    trial_days?: number;
}

interface MemberType {
    id: string;
    name: string;
    description: string;
}

interface SubscriptionPlanFormProps {
    plan?: SubscriptionPlan;
    memberTypes: MemberType[];
    onSave: (plan: SubscriptionPlan) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export const SubscriptionPlanForm = ({
    plan,
    memberTypes,
    onSave,
    onCancel,
    isLoading = false
}: SubscriptionPlanFormProps) => {
    const { toast } = useToast();
    const [formData, setFormData] = useState<SubscriptionPlan>({
        name: '',
        description: '',
        price: 0,
        billing_cycle: 'monthly',
        features: [],
        is_active: true,
        member_type_ids: [],
        max_users: undefined,
        trial_days: 0,
    });

    const [newFeature, setNewFeature] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (plan) {
            setFormData(plan);
        }
    }, [plan]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nome do plano é obrigatório';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Descrição é obrigatória';
        }

        if (formData.price < 0) {
            newErrors.price = 'Preço deve ser maior ou igual a zero';
        }

        if (formData.features.length === 0) {
            newErrors.features = 'Adicione pelo menos uma funcionalidade';
        }

        if (formData.member_type_ids.length === 0) {
            newErrors.member_types = 'Selecione pelo menos um tipo de membro';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast({
                title: "Erro de validação",
                description: "Corrija os erros no formulário antes de continuar",
                variant: "destructive",
            });
            return;
        }

        try {
            await onSave(formData);
            toast({
                title: "Plano salvo",
                description: `Plano "${formData.name}" foi ${plan ? 'atualizado' : 'criado'} com sucesso`,
            });
        } catch (error: any) {
            toast({
                title: "Erro ao salvar",
                description: error.message || "Erro inesperado ao salvar o plano",
                variant: "destructive",
            });
        }
    };

    const addFeature = () => {
        if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
            setFormData(prev => ({
                ...prev,
                features: [...prev.features, newFeature.trim()]
            }));
            setNewFeature('');
        }
    };

    const removeFeature = (feature: string) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.filter(f => f !== feature)
        }));
    };

    const toggleMemberType = (memberTypeId: string) => {
        setFormData(prev => ({
            ...prev,
            member_type_ids: prev.member_type_ids.includes(memberTypeId)
                ? prev.member_type_ids.filter(id => id !== memberTypeId)
                : [...prev.member_type_ids, memberTypeId]
        }));
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    {plan ? 'Editar Plano de Assinatura' : 'Novo Plano de Assinatura'}
                    <Button variant="ghost" size="sm" onClick={onCancel}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardTitle>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informações Básicas */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Informações Básicas</h3>

                        <div>
                            <Label htmlFor="name">Nome do Plano *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Ex: Plano Premium"
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="description">Descrição *</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Descreva os benefícios e características do plano"
                                rows={3}
                                className={errors.description ? 'border-red-500' : ''}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="price">Preço (R$) *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                    className={errors.price ? 'border-red-500' : ''}
                                />
                                {errors.price && (
                                    <p className="text-sm text-red-500 mt-1">{errors.price}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="billing_cycle">Ciclo de Cobrança</Label>
                                <Select
                                    value={formData.billing_cycle}
                                    onValueChange={(value: 'monthly' | 'yearly') =>
                                        setFormData(prev => ({ ...prev, billing_cycle: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">Mensal</SelectItem>
                                        <SelectItem value="yearly">Anual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="max_users">Máximo de Usuários</Label>
                                <Input
                                    id="max_users"
                                    type="number"
                                    min="1"
                                    value={formData.max_users || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        max_users: e.target.value ? parseInt(e.target.value) : undefined
                                    }))}
                                    placeholder="Ilimitado"
                                />
                            </div>

                            <div>
                                <Label htmlFor="trial_days">Dias de Teste Grátis</Label>
                                <Input
                                    id="trial_days"
                                    type="number"
                                    min="0"
                                    value={formData.trial_days || 0}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        trial_days: parseInt(e.target.value) || 0
                                    }))}
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                            />
                            <Label htmlFor="is_active">Plano ativo</Label>
                        </div>
                    </div>

                    {/* Funcionalidades */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Funcionalidades</h3>

                        <div className="flex gap-2">
                            <Input
                                value={newFeature}
                                onChange={(e) => setNewFeature(e.target.value)}
                                placeholder="Digite uma funcionalidade"
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                            />
                            <Button type="button" onClick={addFeature} size="sm">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {formData.features.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.features.map((feature, index) => (
                                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                        {feature}
                                        <button
                                            type="button"
                                            onClick={() => removeFeature(feature)}
                                            className="ml-1 hover:text-red-500"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {errors.features && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{errors.features}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* Tipos de Membro */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Tipos de Membro Associados</h3>

                        <div className="grid grid-cols-2 gap-2">
                            {memberTypes.map((memberType) => (
                                <div key={memberType.id} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={`member-type-${memberType.id}`}
                                        checked={formData.member_type_ids.includes(memberType.id)}
                                        onChange={() => toggleMemberType(memberType.id)}
                                        className="rounded"
                                    />
                                    <Label htmlFor={`member-type-${memberType.id}`} className="text-sm">
                                        {memberType.name}
                                    </Label>
                                </div>
                            ))}
                        </div>

                        {errors.member_types && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{errors.member_types}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>Salvando...</>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {plan ? 'Atualizar' : 'Criar'} Plano
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};