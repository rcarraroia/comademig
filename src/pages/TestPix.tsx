import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, XCircle, Copy, QrCode } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export default function TestPix() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Dados do formulário - SIMULANDO FILIAÇÃO
  const [nome, setNome] = useState('João Silva Teste')
  const [email, setEmail] = useState(`teste${Date.now()}@example.com`)
  const [cpf, setCpf] = useState('12345678900')
  const [telefone, setTelefone] = useState('11999999999')
  const [valor, setValor] = useState('10.00')
  const [descricao, setDescricao] = useState('Teste Filiação PIX - Sandbox')
  const [customerId] = useState('cus_000007116207')

  const handleTestPix = async () => {

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // PASSO 1: Criar conta (simulando filiação)
      console.log('1. Criando conta para novo usuário...')
      
      const senhaTemporaria = Math.random().toString(36).slice(-12)
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senhaTemporaria,
        options: {
          data: {
            nome_completo: nome,
            cpf,
            telefone,
            needs_password_reset: true,
            filiacao_em_andamento: true
          }
        }
      })

      if (authError || !authData.user) {
        throw new Error(`Erro ao criar conta: ${authError?.message}`)
      }

      const newUserId = authData.user.id
      setUserId(newUserId)
      console.log('✅ Conta criada:', newUserId)

      // PASSO 2: Criar pagamento PIX (agora COM user_id)
      console.log('2. Criando pagamento PIX com user_id...')

      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 1)

      const { data: pixData, error: pixError } = await supabase.functions.invoke(
        'asaas-create-pix-payment',
        {
          body: {
            customer_id: customerId,
            user_id: newUserId, // ← Agora temos user_id!
            service_type: 'filiacao',
            service_data: {
              tipo: 'teste_filiacao',
              descricao: 'Teste de filiação com PIX'
            },
            payment_data: {
              value: parseFloat(valor),
              dueDate: dueDate.toISOString().split('T')[0],
              description: descricao,
              externalReference: `test_filiacao_${Date.now()}`
            }
          }
        }
      )

      if (pixError) {
        throw new Error(`Erro ao criar PIX: ${pixError.message}`)
      }

      if (!pixData.success) {
        throw new Error(pixData.message || 'Erro ao criar PIX')
      }

      console.log('✅ PIX criado:', pixData)

      setResult(pixData)
      toast.success('PIX criado com sucesso!')

    } catch (err) {
      console.error('Erro no teste:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado para área de transferência!')
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Teste Filiação com PIX - Sandbox</h1>
        <p className="text-muted-foreground mt-2">
          Simula o fluxo completo de filiação: criar conta → gerar pagamento PIX
        </p>
      </div>

      {/* Alertas de Ambiente */}
      <Alert className="mb-6 border-blue-500 bg-blue-50">
        <AlertDescription>
          <strong>🎯 Fluxo de Teste:</strong>
          <br />
          1. Cria uma conta temporária (simulando novo usuário)
          <br />
          2. Gera pagamento PIX vinculado à conta criada
          <br />
          3. Demonstra que user_id sempre existe no momento do pagamento
        </AlertDescription>
      </Alert>

      <Alert className="mb-6 border-yellow-500 bg-yellow-50">
        <AlertDescription>
          <strong>⚠️ Ambiente: SANDBOX</strong>
          <br />
          Este é um ambiente de testes. Nenhum pagamento real será processado.
        </AlertDescription>
      </Alert>

      {/* Formulário */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Dados da Filiação (Simulação)</CardTitle>
          <CardDescription>
            Simula um novo usuário fazendo filiação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="João Silva"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@example.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email único gerado automaticamente
              </p>
            </div>

            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="12345678900"
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="11999999999"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Dados do Pagamento</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="10"
                  max="1000"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="10.00"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Desconto PIX: 5% | Valor final: R$ {(parseFloat(valor || '0') * 0.95).toFixed(2)}
                </p>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Filiação - Teste"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleTestPix}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando Filiação...
              </>
            ) : (
              <>
                <QrCode className="mr-2 h-4 w-4" />
                Simular Filiação com PIX
              </>
            )}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            ℹ️ Não precisa estar logado - simula novo usuário
          </p>
        </CardContent>
      </Card>

      {/* Erro */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Erro:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Resultado */}
      {result && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle2 className="mr-2 h-5 w-5" />
              PIX Criado com Sucesso!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Informações da Conta Criada */}
            {userId && (
              <Alert className="bg-green-50 border-green-500">
                <AlertDescription>
                  <strong>✅ Conta criada com sucesso!</strong>
                  <br />
                  <span className="font-mono text-xs">User ID: {userId}</span>
                  <br />
                  <span className="text-xs text-muted-foreground">
                    Agora o pagamento pode ser criado com user_id vinculado
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* Informações do Pagamento */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">ID do Pagamento</p>
                <p className="font-mono text-sm">{result.payment_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ID Asaas</p>
                <p className="font-mono text-sm">{result.asaas_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Original</p>
                <p className="font-semibold">R$ {result.original_value.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor com Desconto</p>
                <p className="font-semibold text-green-600">
                  R$ {result.discounted_value.toFixed(2)} (-{result.discount_percentage}%)
                </p>
              </div>
              {result.expiration_date && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Validade</p>
                  <p className="text-sm">
                    {new Date(result.expiration_date).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
            </div>

            {/* QR Code */}
            {result.qr_code ? (
              <div>
                <Label>QR Code PIX</Label>
                <div className="mt-2 p-4 bg-white border rounded-lg flex justify-center">
                  {result.qr_code.startsWith('data:image') ? (
                    <img
                      src={result.qr_code}
                      alt="QR Code PIX"
                      className="max-w-xs"
                    />
                  ) : (
                    <div className="text-center">
                      <QrCode className="h-32 w-32 mx-auto text-gray-400" />
                      <p className="text-sm text-muted-foreground mt-2">
                        QR Code não disponível em formato de imagem
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  ⚠️ QR Code não foi gerado pelo Asaas sandbox. Isso é normal no ambiente de testes.
                </AlertDescription>
              </Alert>
            )}

            {/* Código Copia e Cola */}
            {result.copy_paste_code && (
              <div>
                <Label>Código Copia e Cola</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={result.copy_paste_code}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(result.copy_paste_code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cole este código no app do seu banco para pagar (apenas em sandbox)
                </p>
              </div>
            )}

            {/* Instruções */}
            <Alert>
              <AlertDescription>
                <strong>📱 Como testar:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>Este é um PIX de TESTE (sandbox)</li>
                  <li>O QR Code não funciona em apps de banco reais</li>
                  <li>Para simular pagamento, use o painel do Asaas</li>
                  <li>Ou aguarde o webhook de confirmação (se configurado)</li>
                </ol>
              </AlertDescription>
            </Alert>

            {/* JSON Completo (Debug) */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Ver resposta completa (JSON)
              </summary>
              <pre className="mt-2 p-4 bg-gray-900 text-gray-100 rounded-lg overflow-auto text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
