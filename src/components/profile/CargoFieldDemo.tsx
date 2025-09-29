import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Info, 
  Lock, 
  Unlock, 
  Shield, 
  User, 
  Settings,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface CargoFieldDemoProps {
  className?: string;
}

export default function CargoFieldDemo({ className = '' }: CargoFieldDemoProps) {
  const [subscriptionSource, setSubscriptionSource] = useState<'filiacao' | 'manual' | null>('filiacao');
  const [isEditing, setIsEditing] = useState(false);
  const [cargoValue, setCargoValue] = useState('Pastor');
  const [memberTypeName, setMemberTypeName] = useState('Pastor');

  const scenarios = [
    {
      id: 'filiacao',
      label: 'Definido via Filiação',
      description: 'Cargo foi definido durante o processo de filiação',
      readonly: true,
      icon: Shield,
      color: 'blue'
    },
    {
      id: 'manual',
      label: 'Definido Manualmente',
      description: 'Cargo foi definido manualmente pelo administrador',
      readonly: true,
      icon: Settings,
      color: 'orange'
    },
    {
      id: null,
      label: 'Campo Livre',
      description: 'Usuário pode editar livremente',
      readonly: false,
      icon: User,
      color: 'green'
    }
  ];

  const currentScenario = scenarios.find(s => s.id === subscriptionSource);
  const isReadonly = !isEditing || (subscriptionSource !== null);

  const handleScenarioChange = (value: string) => {
    const newSource = value === 'null' ? null : value as 'filiacao' | 'manual';
    setSubscriptionSource(newSource);
    
    // Atualizar valores baseado no cenário
    if (newSource === 'filiacao') {
      setCargoValue('Pastor');
      setMemberTypeName('Pastor');
    } else if (newSource === 'manual') {
      setCargoValue('Evangelista');
      setMemberTypeName('Evangelista');
    } else {
      setCargoValue('Membro');
      setMemberTypeName('');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Demonstração: Campo Cargo com Lógica Readonly
          </CardTitle>
          <CardDescription>
            Veja como o campo cargo se comporta baseado na origem dos dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controles de Demonstração */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Cenário de Teste:</Label>
              <Select value={subscriptionSource || 'null'} onValueChange={handleScenarioChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.map((scenario) => (
                    <SelectItem key={scenario.id || 'null'} value={scenario.id || 'null'}>
                      <div className="flex items-center gap-2">
                        <scenario.icon className="h-4 w-4" />
                        {scenario.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button
                variant={isEditing ? "destructive" : "default"}
                onClick={() => setIsEditing(!isEditing)}
                className="w-full"
              >
                {isEditing ? (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Parar Edição
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Modo Edição
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Status Atual */}
          {currentScenario && (
            <Alert className={`border-${currentScenario.color}-200 bg-${currentScenario.color}-50`}>
              <currentScenario.icon className={`h-4 w-4 text-${currentScenario.color}-600`} />
              <AlertDescription className={`text-${currentScenario.color}-800`}>
                <strong>Cenário Ativo:</strong> {currentScenario.description}
                <br />
                <strong>Campo Editável:</strong> {currentScenario.readonly ? 'Não' : 'Sim'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Campo de Demonstração */}
      <Card>
        <CardHeader>
          <CardTitle>Campo Cargo - Comportamento Real</CardTitle>
          <CardDescription>
            Este é exatamente como o campo aparece na página de perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cargo-demo">Cargo/Ministério</Label>
            <Input
              id="cargo-demo"
              value={cargoValue}
              onChange={(e) => setCargoValue(e.target.value)}
              disabled={isReadonly}
              className={isReadonly ? 'bg-gray-100' : ''}
              placeholder="Digite seu cargo..."
            />
            
            {/* Mensagens Contextuais */}
            {subscriptionSource === 'filiacao' && memberTypeName && (
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Cargo definido durante a filiação: {memberTypeName}
              </p>
            )}
            
            {subscriptionSource === 'manual' && (
              <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Cargo definido manualmente pelo administrador
              </p>
            )}
            
            {!subscriptionSource && (
              <p className="text-xs text-gray-500 mt-1">
                Campo editável - você pode alterar seu cargo/ministério
              </p>
            )}
          </div>

          {/* Estado do Campo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-700">
                {isEditing ? 'Editando' : 'Visualizando'}
              </div>
              <div className="text-sm text-gray-600">Modo Atual</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-700">
                {isReadonly ? 'Bloqueado' : 'Liberado'}
              </div>
              <div className="text-sm text-gray-600">Status do Campo</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-700">
                {subscriptionSource || 'Livre'}
              </div>
              <div className="text-sm text-gray-600">Origem dos Dados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Explicação da Lógica */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-gray-800">Como Funciona a Lógica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Filiação (subscription_source = 'filiacao'):</strong> Campo readonly quando o cargo foi definido durante o processo de filiação. Mostra o tipo de membro da assinatura ativa.
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Settings className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Manual (subscription_source = 'manual'):</strong> Campo readonly quando foi definido manualmente pelo administrador. Preserva a configuração administrativa.
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Livre (subscription_source = null):</strong> Campo editável quando não há restrições. Usuário pode alterar livremente seu cargo.
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Compatibilidade:</strong> Sistema mantém compatibilidade com dados existentes, aplicando a lógica apenas quando há informação de origem.
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Prioridade:</strong> Dados de filiação têm prioridade sobre configurações manuais, garantindo consistência com o sistema de assinaturas.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Casos de Uso */}
      <Card>
        <CardHeader>
          <CardTitle>Casos de Uso Práticos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Novo Membro
              </h4>
              <p className="text-sm text-gray-600">
                Usuário se filia escolhendo "Pastor" → Campo fica readonly mostrando "Pastor" → Consistência garantida
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Correção Admin
              </h4>
              <p className="text-sm text-gray-600">
                Admin corrige cargo de "Membro" para "Diácono" → Campo fica readonly → Evita alterações indevidas
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Usuário Antigo
              </h4>
              <p className="text-sm text-gray-600">
                Perfil sem subscription_source → Campo editável → Usuário pode atualizar livremente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}