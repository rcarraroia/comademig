# 📚 Documentação do Sistema COMADEMIG

**Última Atualização:** 16/10/2025  
**Versão:** 1.0

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Estrutura de Tabelas](#estrutura-de-tabelas)
4. [Fluxos Principais](#fluxos-principais)
5. [Configuração e Deploy](#configuração-e-deploy)
6. [Testes](#testes)
7. [Referências Rápidas](#referências-rápidas)

---

## 🎯 VISÃO GERAL

### O que é o COMADEMIG?

Portal web para o Conselho de Medicina Veterinária de Minas Gerais, oferecendo serviços digitais para médicos veterinários e zootecnistas.

### Funcionalidades Principais

- ✅ **Filiação Digital** - Sistema completo de cadastro e filiação
- ✅ **Carteira Digital** - Emissão e validação de carteiras profissionais
- ✅ **Pagamentos** - Integração com Asaas (PIX, Cartão, Boleto)
- ✅ **Sistema de Splits** - Divisão automática de pagamentos
- ✅ **Programa de Afiliados** - Indicações com comissões
- ✅ **Certidões** - Emissão de certidões profissionais
- ✅ **Regularização** - Serviços de regularização de igrejas
- ✅ **Eventos** - Gestão de eventos e certificados
- ✅ **Área Administrativa** - Gestão completa do sistema

---

## 🏗️ ARQUITETURA DO SISTEMA

### Stack Tecnológico

**Frontend:**
- React 18 + TypeScript
- Vite 5
- TanStack Query (React Query)
- shadcn/ui + Radix UI
- Tailwind CSS

**Backend:**
- Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- Asaas (Gateway de Pagamentos)

**Deploy:**
- Lovable (deploy automático)
- Supabase CLI (gerenciamento de banco)

### Estrutura de Pastas

```
comademig/
├── src/
│   ├── components/      # Componentes React
│   ├── hooks/           # Custom hooks
│   ├── pages/           # Páginas da aplicação
│   ├── contexts/        # Contextos React
│   ├── utils/           # Utilitários
│   └── integrations/    # Integrações (Supabase)
├── supabase/
│   ├── functions/       # Edge Functions
│   ├── migrations/      # Migrações SQL
│   └── migrations_backup/ # Backup de migrações
├── .kiro/
│   ├── specs/           # Especificações de features
│   └── steering/        # Regras e diretrizes
└── _archive/            # Arquivos temporários (não commitar)
```

---

## 🗄️ ESTRUTURA DE TABELAS

### Sistema de Usuários

**`profiles`** - Perfis de usuários
- Dados pessoais, endereço, cargo, igreja
- RLS: Usuários veem apenas seu próprio perfil

**`user_roles`** - Roles dos usuários
- Roles: user, admin, super_admin
- RLS: Apenas admins gerenciam roles

### Sistema de Filiação

**`member_types`** - Tipos de membros
- Médico Veterinário, Zootecnista, etc.

**`subscription_plans`** - Planos de assinatura
- Mensal, Semestral, Anual
- Valores e configurações

**`user_subscriptions`** - Assinaturas ativas
- Vincula usuário + plano + pagamento
- Status: pending, active, overdue, cancelled

### Sistema de Pagamentos (Asaas)

**`asaas_customers`** - Clientes no Asaas
- Dados do cliente para cobrança

**`asaas_cobrancas`** - Cobranças criadas
- Histórico de todas as cobranças
- Status, valor, forma de pagamento

**`asaas_splits`** - Divisão de pagamentos
- Splits automáticos (RENUM, COMADEMIG, Afiliado)
- Percentuais configuráveis

**`webhook_events`** - Eventos de webhook
- Log de todos os webhooks recebidos
- Processamento e retry

### Sistema de Afiliados

**`affiliates`** - Afiliados cadastrados
- Código único, wallet_id, comissões

**`affiliate_referrals`** - Indicações
- Rastreamento de indicações

**`affiliate_commissions`** - Comissões
- Histórico de comissões pagas

### Sistema de Serviços

#### 3 Sistemas Independentes:

**1. Certidões:**
- `valores_certidoes` - Valores dos tipos de certidão
- `solicitacoes_certidoes` - Solicitações de certidões

**2. Regularização:**
- `servicos_regularizacao` - Serviços de regularização
- `solicitacoes_regularizacao` - Solicitações de regularização

**3. Serviços Gerais (Novo):**
- `servicos` - Serviços dinâmicos (admin cria)
- `solicitacoes_servicos` - Solicitações gerais

---

## 🔄 FLUXOS PRINCIPAIS

### 1. Fluxo de Filiação

```
1. Usuário preenche formulário de filiação
2. Seleciona plano (Mensal/Semestral/Anual)
3. Escolhe forma de pagamento (Cartão)
4. Sistema cria:
   - Cliente no Asaas
   - Cobrança imediata (initial payment)
   - Assinatura recorrente
   - Splits automáticos
5. Webhook confirma pagamento
6. Status atualizado para 'active'
7. Carteira digital liberada
```

**Hooks Principais:**
- `useFiliacaoPayment.ts`
- `useAsaasSubscriptions.ts`

**Edge Functions:**
- `asaas-create-subscription`
- `asaas-webhook`

### 2. Fluxo de Splits

**Sem Afiliado:**
- 50% RENUM
- 50% COMADEMIG

**Com Afiliado:**
- 40% RENUM
- 40% COMADEMIG
- 20% Afiliado

**Configuração:**
- Variáveis de ambiente: `RENUM_WALLET_ID`, `COMADEMIG_WALLET_ID`
- Afiliado: `wallet_id` na tabela `affiliates`

### 3. Fluxo de Webhooks

```
1. Asaas envia webhook para Edge Function
2. Validação de autenticidade (token)
3. Verificação de idempotência (event_id)
4. Processamento baseado no tipo de evento:
   - PAYMENT_RECEIVED → Ativa assinatura
   - PAYMENT_CONFIRMED → Confirma pagamento
   - PAYMENT_OVERDUE → Marca como atrasado
5. Atualização de status no banco
6. Retry automático em caso de falha
```

**Edge Function:**
- `asaas-webhook/index.ts`

---

## ⚙️ CONFIGURAÇÃO E DEPLOY

### Variáveis de Ambiente (Supabase Secrets)

```bash
# Asaas
ASAAS_API_KEY=sua_chave_api

# Splits
RENUM_WALLET_ID=wallet_id_renum
COMADEMIG_WALLET_ID=wallet_id_comademig

# Outros
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Configurar Secrets

```powershell
supabase secrets set ASAAS_API_KEY=valor
supabase secrets set RENUM_WALLET_ID=valor
supabase secrets set COMADEMIG_WALLET_ID=valor
```

### Deploy de Edge Functions

```powershell
# Deploy individual
supabase functions deploy asaas-webhook

# Deploy todas
supabase functions deploy
```

### Aplicar Migrações

```powershell
# Ver migrações pendentes
supabase migration list

# Aplicar migrações
supabase db push
```

### Configurar Webhooks no Asaas

1. Acessar Dashboard Asaas
2. Configurações > Webhooks
3. URL: `https://[projeto].supabase.co/functions/v1/asaas-webhook`
4. Token: Configurar secret `ASAAS_WEBHOOK_TOKEN`
5. Eventos: Selecionar todos relacionados a pagamentos

---

## 🧪 TESTES

### Cartões de Teste (Asaas Sandbox)

**Aprovado:**
```
Número: 5162 3060 0829 1000
CVV: 318
Validade: 12/2030
```

**Recusado:**
```
Número: 5105 1051 0510 5100
CVV: 123
Validade: 12/2030
```

### Testar Fluxo de Filiação

1. Acessar `/filiacao`
2. Preencher formulário completo
3. Selecionar plano
4. Usar cartão de teste
5. Verificar:
   - Assinatura criada no Asaas
   - Registro em `user_subscriptions`
   - Splits configurados
   - Webhook recebido

### Testar com Afiliado

1. Criar afiliado com código único
2. Acessar `/filiacao?ref=CODIGO`
3. Completar filiação
4. Verificar split de 20% para afiliado

---

## 📖 REFERÊNCIAS RÁPIDAS

### Documentos Essenciais

- **README.md** - Documentação principal do projeto
- **CARTOES_TESTE_ASAAS.md** - Cartões para testes
- **CLI_CONFIGURADO_SUCESSO.md** - Configuração do Supabase CLI
- **setup_supabase_cli.md** - Guia de instalação do CLI
- **INSTRUCOES_PASTA_ARCHIVE.md** - Sobre a pasta _archive/

### Specs Atuais

- `.kiro/specs/correcao-sistema-filiacao-asaas/`
  - `requirements.md` - Requisitos
  - `design.md` - Design do sistema
  - `tasks.md` - Lista de tarefas
  - `ANALISE_TABELAS_SERVICOS.md` - Análise de tabelas
  - `CONCLUSAO_ANALISE_TABELAS.md` - Conclusões

### Comandos Úteis

```powershell
# Desenvolvimento
npm run dev              # Iniciar servidor (porta 8080)
npm run build            # Build para produção

# Supabase
supabase status          # Ver status
supabase db push         # Aplicar migrações
supabase functions deploy nome  # Deploy function
supabase functions logs nome    # Ver logs
supabase secrets list    # Listar secrets

# Git
git status               # Ver mudanças
git add .                # Adicionar tudo
git commit -m "msg"      # Commit
git push                 # Push para remoto
```

### Links Importantes

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Asaas Dashboard:** https://www.asaas.com/
- **Documentação Asaas:** https://docs.asaas.com/
- **Documentação Supabase:** https://supabase.com/docs

---

## 🚨 TROUBLESHOOTING

### Erro: "Invalid API key"
- Verificar `ASAAS_API_KEY` nos secrets
- Confirmar que está usando a chave correta (sandbox/produção)

### Webhook não está sendo recebido
- Verificar URL configurada no Asaas
- Verificar logs: `supabase functions logs asaas-webhook`
- Confirmar que function está deployada

### Split não está funcionando
- Verificar `RENUM_WALLET_ID` e `COMADEMIG_WALLET_ID`
- Confirmar que afiliado tem `wallet_id` configurado
- Ver logs da Edge Function

### Migração falhou
- Ver erro específico
- Verificar se tabela já existe
- Usar `supabase db reset` (CUIDADO: apaga dados locais)

---

## 📞 SUPORTE

Para dúvidas ou problemas:

1. Verificar esta documentação
2. Consultar specs em `.kiro/specs/`
3. Ver logs das Edge Functions
4. Verificar documentação oficial (Supabase/Asaas)

---

**Documentação mantida pela equipe de desenvolvimento COMADEMIG**

**Última revisão:** Fase 6 - Limpeza e Consolidação (16/10/2025)
