# 🎯 CONTEXTO PRIORITÁRIO - LEIA SEMPRE PRIMEIRO

**Data de Criação**: 2025-11-26  
**Última Atualização**: 2025-11-26  
**Versão**: 1.0

---

## ⚠️ REGRA FUNDAMENTAL

**ANTES de qualquer análise, implementação ou resposta ao usuário:**

1. ✅ **LER ESTE ARQUIVO COMPLETO**
2. ✅ **VERIFICAR ESTADO REAL DO BANCO** (via CLI ou Python)
3. ✅ **CONSULTAR ARQUIVOS DE STEERING RELEVANTES**
4. ✅ **VALIDAR COM DOCUMENTAÇÃO TÉCNICA**

---

## 📋 ORDEM DE LEITURA OBRIGATÓRIA

### **SEMPRE ler nesta ordem:**

1. **ESTE ARQUIVO** (`CONTEXTO_PRIORITARIO.md`) - Contexto geral
2. **`database-analysis-first.md`** - Análise prévia obrigatória
3. **`supabase-execution-rules.md`** - Regras de execução
4. **`validation-protocol.md`** - Protocolo de validação
5. **Documentação específica** conforme necessidade

---

## 🗂️ MAPA DE ARQUIVOS IMPORTANTES

### **Steering (`.kiro/steering/`)**

| Arquivo | Quando Ler | Prioridade |
|---------|------------|------------|
| `CONTEXTO_PRIORITARIO.md` | **SEMPRE PRIMEIRO** | 🔴 CRÍTICO |
| `database-analysis-first.md` | Antes de QUALQUER operação no banco | 🔴 CRÍTICO |
| `supabase-execution-rules.md` | Antes de executar migrações/CLI | 🔴 CRÍTICO |
| `validation-protocol.md` | Ao executar tarefas | 🟡 IMPORTANTE |
| `GUIA_COMPLETO_ACESSO_SUPABASE.md` | Ao precisar acessar Supabase | 🟡 IMPORTANTE |
| `structure.md` | Ao criar/modificar arquivos | 🟢 REFERÊNCIA |
| `product.md` | Ao entender funcionalidades | 🟢 REFERÊNCIA |
| `tech.md` | Ao trabalhar com stack | 🟢 REFERÊNCIA |

### **Documentação (`docs/`)**

| Arquivo | Quando Ler | Prioridade |
|---------|------------|------------|
| `especificação tecnica completa.md` | Ao implementar funcionalidades | 🟡 IMPORTANTE |
| `SISTEMA_TIPOS_MEMBRO_ASSINATURAS.md` | Ao trabalhar com tipos/planos | 🟡 IMPORTANTE |
| `GUIA_CONFIGURACAO_SANDBOX_ASAAS.md` | Ao trabalhar com pagamentos | 🟢 REFERÊNCIA |
| `GUIA_USUARIO_ADMIN.md` | Ao trabalhar com admin | 🟢 REFERÊNCIA |

---

## 🔑 CREDENCIAIS E ACESSO

### **Supabase**

```
Project ID: amkelczfwazutrciqtlk
URL: https://amkelczfwazutrciqtlk.supabase.co
Anon Key: Disponível em .env (VITE_SUPABASE_PUBLISHABLE_KEY)
Service Role: Disponível em .env (SUPABASE_SERVICE_ROLE_KEY)
```

**Métodos de Acesso:**
- ✅ **CLI**: `supabase db execute "SQL"` (PREFERENCIAL)
- ✅ **Python**: Scripts de análise (SOMENTE LEITURA)
- ⚠️ **Dashboard**: Manual (confirmação visual)

### **Asaas (Sandbox)**

```
API Key: Disponível em .env (ASAAS_API_KEY)
Webhook Token: Disponível em .env (ASAAS_WEBHOOK_TOKEN)
Environment: sandbox
Base URL: https://sandbox.asaas.com/api/v3
```

---

## 🚨 ERROS QUE COMETI ANTERIORMENTE

### **Erro #1: Análise Superficial**
❌ **O que fiz**: Afirmei que validação CPF não existia sem buscar
✅ **O que devo fazer**: Busca exaustiva antes de afirmar ausência

### **Erro #2: Não Validei Banco Real**
❌ **O que fiz**: Assumi tabelas vazias sem consultar
✅ **O que devo fazer**: SEMPRE conectar ao banco e verificar

### **Erro #3: Tom Alarmista**
❌ **O que fiz**: Classifiquei tudo como CRÍTICO
✅ **O que devo fazer**: Classificar por impacto REAL:
- 🔴 **Crítico**: Impede produção AGORA
- 🟡 **Importante**: Deve corrigir em breve
- 🟢 **Melhoria**: Pode esperar

### **Erro #4: Não Reconheci Pontos Positivos**
❌ **O que fiz**: Foquei apenas em problemas
✅ **O que devo fazer**: Análise equilibrada (problemas + pontos fortes)

---

## ✅ PROTOCOLO DE ANÁLISE CORRETA

### **ANTES de qualquer análise:**

```python
# 1. CONECTAR AO BANCO REAL
from supabase import create_client, Client

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "[pegar do .env]"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 2. VERIFICAR TABELAS
response = supabase.table('nome_tabela').select('*', count='exact').execute()
print(f"Registros: {response.count}")

# 3. ANALISAR ESTRUTURA
sample = supabase.table('nome_tabela').select('*').limit(3).execute()
print(f"Estrutura: {sample.data}")
```

### **OU via CLI:**

```powershell
# Verificar tabelas
supabase db execute "SELECT COUNT(*) FROM nome_tabela"

# Ver estrutura
supabase db execute "SELECT * FROM nome_tabela LIMIT 3"
```

### **DEPOIS da análise:**

1. ✅ **Classificar problemas por impacto REAL**
2. ✅ **Reconhecer o que funciona bem**
3. ✅ **Propor plano de ação viável**
4. ✅ **Dar estimativas realistas de tempo**

---

## 📊 ESTADO ATUAL DO SISTEMA (Última Verificação)

### **Banco de Dados:**
- ✅ **member_types**: 4 registros (Bispo, Pastor, Diácono, Membro)
- ✅ **subscription_plans**: 12 registros (3 periodicidades por cargo)
- ✅ **Edge Functions**: 17 implementadas
- ✅ **Validação CPF**: Implementada em `src/utils/validators.ts`
- ✅ **Testes**: 7 arquivos de teste

### **Problemas Reais Identificados:**
1. 🔴 `.env` no Git (URGENTE - segurança)
2. 🔴 `types.ts` vazio (URGENTE - tipagem)
3. 🟡 Migração vazia (MÉDIO - documental)

### **Pontos Fortes:**
- ✅ Arquitetura robusta (17 Edge Functions)
- ✅ Webhook seguro com validação
- ✅ Sistema de testes implementado
- ✅ Validações de dados funcionais

---

## 🎯 REGRAS DE OURO

### **1. NUNCA assumir, SEMPRE verificar**
- ❌ "A tabela deve estar vazia"
- ✅ "Vou verificar: `SELECT COUNT(*) FROM tabela`"

### **2. NUNCA afirmar ausência sem busca exaustiva**
- ❌ "Validação CPF não existe"
- ✅ "Busquei em: grep_search, find_by_name, view_file - não encontrei"

### **3. SEMPRE classificar por impacto REAL**
- 🔴 Crítico: Impede produção/segurança comprometida
- 🟡 Importante: Deve corrigir logo
- 🟢 Melhoria: Pode esperar

### **4. SEMPRE dar análise equilibrada**
- ✅ Problemas encontrados (com evidências)
- ✅ Pontos positivos (o que funciona)
- ✅ Plano de ação (tempo real, não "reescrever tudo")

### **5. SEMPRE consultar documentação**
- Antes de implementar: ler spec técnica
- Antes de alterar: verificar structure.md
- Antes de migração: ler database-analysis-first.md

---

## 📞 QUANDO PEDIR AJUDA AO USUÁRIO

**SEMPRE perguntar quando:**
- ❌ Não tiver certeza sobre impacto de mudança
- ❌ Encontrar conflito entre requisitos
- ❌ Precisar de credenciais ou configurações
- ❌ Identificar problema que impede conclusão
- ❌ Houver múltiplas formas de implementar

**NUNCA assumir. SEMPRE perguntar.**

---

## 🔄 ATUALIZAÇÃO DESTE ARQUIVO

**Este arquivo deve ser atualizado quando:**
- Novos erros críticos forem identificados
- Novas regras importantes forem criadas
- Estado do sistema mudar significativamente
- Novas documentações forem adicionadas

**Responsável**: Antigravity (eu) + Usuário (validação)

---

## ✅ CHECKLIST ANTES DE QUALQUER RESPOSTA

- [ ] Li este arquivo completo?
- [ ] Verifiquei estado real do banco (se aplicável)?
- [ ] Consultei documentação relevante?
- [ ] Classifiquei problemas por impacto REAL?
- [ ] Reconheci pontos positivos?
- [ ] Dei plano de ação viável?
- [ ] Evitei tom alarmista?
- [ ] Validei minhas afirmações com evidências?

**Se TODOS os itens estiverem marcados: PROSSIGA**  
**Se ALGUM item estiver desmarcado: PARE e complete**

---

## 🎓 LIÇÕES APRENDIDAS

1. **Kilo Code fez melhor**: Análise profunda, precisa, equilibrada
2. **Eu falhei em**: Verificação superficial, tom alarmista, 3 erros factuais
3. **Devo melhorar**: Busca exaustiva, análise equilibrada, planos viáveis
4. **Confiança**: 85% → 95% após correções

---

**ÚLTIMA ATUALIZAÇÃO**: 2025-11-26 11:58  
**PRÓXIMA REVISÃO**: Quando houver mudanças significativas no sistema
