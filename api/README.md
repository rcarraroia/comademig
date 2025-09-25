# API de Pagamentos COMADEMIG

API Node.js para sistema de pagamentos integrado com Asaas v3, incluindo cobranças PIX/cartão, assinaturas recorrentes e split automático entre múltiplas wallets.

## 🚀 Funcionalidades

- **Integração Asaas v3**: PIX, cartão de crédito e assinaturas recorrentes
- **Split Automático**: Divisão 40%/40%/20% entre Comademig, Renum e Afiliados
- **Webhooks em Tempo Real**: Processamento automático de eventos
- **Sistema de Retry**: Reprocessamento automático de falhas
- **Conciliação**: Validação periódica de splits
- **Auditoria Completa**: Logs estruturados e rastreabilidade
- **Segurança**: Rate limiting, validação e autenticação JWT

## 📋 Pré-requisitos

- Node.js >= 18.0.0
- NPM ou Yarn
- Conta Asaas (sandbox para desenvolvimento)
- Banco Supabase configurado
- Redis (opcional, para cache)

## 🛠️ Instalação

1. **Clone o repositório e navegue para a pasta da API:**
```bash
cd api
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. **Execute as migrations do banco de dados:**
```bash
# As migrations estão em ../supabase/migrations/
# Execute no painel do Supabase ou via CLI
```

## 🔧 Configuração

### Variáveis de Ambiente Obrigatórias

```env
# Asaas API
ASAAS_API_KEY=your_asaas_api_key
ASAAS_API_URL=https://api-sandbox.asaas.com/v3  # sandbox
# ASAAS_API_URL=https://api.asaas.com/v3        # produção

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_jwt_secret

# Wallets para Split
# COMADEMIG_WALLET_ID não necessário - usa conta principal
RENUM_WALLET_ID=wallet_renum_id
```

### Configuração do Webhook no Asaas

1. Acesse o painel do Asaas
2. Vá em Configurações > Webhooks
3. Configure a URL: `https://sua-api.com/webhook/asaas`
4. Selecione os eventos:
   - `PAYMENT_RECEIVED`
   - `PAYMENT_FAILED`
   - `SUBSCRIPTION_CREATED`
   - `SUBSCRIPTION_PAYMENT_RECEIVED`
   - `SUBSCRIPTION_CANCELED`

## 🚀 Execução

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

### Testes
```bash
npm test
npm run test:watch
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## 📡 Endpoints da API

### Públicos (Filiação)

#### `POST /api/members/join`
Criar nova filiação com assinatura recorrente.

**Request:**
```json
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "phone": "31999999999",
  "cpfCnpj": "12345678901",
  "cargo": "Pastor",
  "plan_id": "uuid-do-plano",
  "payment_method": "PIX",
  "affiliate_code": "REF123"
}
```

**Response:**
```json
{
  "success": true,
  "customer_id": "cus_xxx",
  "subscription_id": "sub_xxx",
  "payment_id": "pay_xxx",
  "pix_qr_code": "data:image/png;base64...",
  "pix_payload": "00020126..."
}
```

### Autenticados (Serviços)

#### `POST /api/payments/service`
Criar cobrança para serviço pontual (certidão/regularização).

**Headers:**
```
Authorization: Bearer jwt_token
```

**Request:**
```json
{
  "service_type": "certidao",
  "service_data": {
    "tipo": "Certidão de Regularidade",
    "observacoes": "Urgente"
  },
  "payment_method": "PIX"
}
```

### Webhooks

#### `POST /webhook/asaas`
Receber eventos do Asaas em tempo real.

**Headers:**
```
X-Webhook-Token: webhook_token (se configurado)
```

### Administrativos

#### `POST /internal/admin/notify`
Notificar administradores sobre eventos.

#### `POST /internal/reconcile/splits`
Executar conciliação de splits.

## 🔒 Segurança

### Rate Limiting
- **Geral**: 100 requisições por 15 minutos
- **Pagamentos**: 10 tentativas por minuto
- **Webhooks**: 100 por minuto

### Autenticação
- JWT tokens para endpoints protegidos
- Validação de webhook token
- Sanitização de entrada

### Logs de Auditoria
Todos os eventos críticos são logados:
- Criação de pagamentos
- Processamento de webhooks
- Falhas de autenticação
- Rate limiting

## 📊 Monitoramento

### Health Check
```bash
GET /health
```

### Logs
- **Console**: Logs coloridos para desenvolvimento
- **Arquivo**: `logs/app.log` (se configurado)
- **Estruturado**: JSON format para análise

### Métricas
- Tempo de resposta
- Taxa de erro
- Webhooks processados
- Splits conciliados

## 🔄 Fluxos Principais

### 1. Filiação de Novo Membro
```
Frontend → POST /api/members/join → Asaas API → Webhook → Ativação
```

### 2. Serviço Pontual
```
Frontend → POST /api/payments/service → Asaas API → Webhook → Notificação Admin
```

### 3. Processamento de Webhook
```
Asaas → POST /webhook/asaas → Validação → Processamento → Notificação
```

### 4. Conciliação de Split
```
Cron Job → GET Asaas API → Comparação → Audit Log → Notificação
```

## 🐛 Troubleshooting

### Problemas Comuns

**1. Webhook não está sendo recebido**
- Verifique a URL configurada no Asaas
- Confirme que o token está correto
- Verifique os logs para erros de validação

**2. Split não está sendo aplicado**
- Confirme que os wallet IDs estão corretos
- Verifique se as wallets estão ativas no Asaas
- Execute a conciliação para identificar divergências

**3. Rate limit sendo atingido**
- Implemente retry com backoff no frontend
- Considere aumentar os limites se necessário
- Verifique se há loops ou requisições desnecessárias

### Logs Úteis
```bash
# Ver logs em tempo real
tail -f logs/app.log

# Filtrar logs de pagamento
grep "PAYMENT" logs/app.log

# Filtrar logs de webhook
grep "WEBHOOK" logs/app.log
```

## 📚 Documentação Adicional

- [Documentação Asaas API](https://docs.asaas.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Especificação Completa](../.kiro/specs/sistema-pagamentos-asaas/)

## 🤝 Contribuição

1. Siga o padrão de código (ESLint + Prettier)
2. Adicione testes para novas funcionalidades
3. Atualize a documentação
4. Teste em ambiente sandbox antes de produção

## 📄 Licença

Propriedade da COMADEMIG - Todos os direitos reservados.