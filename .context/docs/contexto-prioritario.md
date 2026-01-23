# Contexto Prioritário COMADEMIG

## ⚠️ REGRA FUNDAMENTAL

**ANTES de qualquer análise, implementação ou resposta:**

1. ✅ **LER ESTE ARQUIVO COMPLETO**
2. ✅ **VERIFICAR ESTADO REAL DO BANCO** (via Power Supabase)
3. ✅ **CONSULTAR ARQUIVOS DE STEERING RELEVANTES**
4. ✅ **VALIDAR COM DOCUMENTAÇÃO TÉCNICA**

## 📋 ORDEM DE LEITURA OBRIGATÓRIA

### SEMPRE ler nesta ordem:
1. **ESTE ARQUIVO** - Contexto geral
2. **Skills de Análise Preventiva** - Antes de implementar
3. **Skills de Verificação de Banco** - Antes de operações no banco
4. **Skills de Compromisso de Honestidade** - Antes de reportar
5. **Skills de Funcionalidade sobre Testes** - Durante desenvolvimento

## 🔑 CREDENCIAIS E ACESSO

### Supabase
```
Project ID: amkelczfwazutrciqtlk
URL: https://amkelczfwazutrciqtlk.supabase.co
Anon Key: Disponível em .env (VITE_SUPABASE_PUBLISHABLE_KEY)
Service Role: Disponível em .env (SUPABASE_SERVICE_ROLE_KEY)
```

**Métodos de Acesso:**
- ✅ **Power Supabase**: `kiroPowers` → "supabase-hosted" (PREFERENCIAL)
- ✅ **CLI**: `supabase db execute "SQL"` (alternativo)
- ⚠️ **Dashboard**: Manual (confirmação visual)

### Asaas (Sandbox)
```
API Key: Disponível em .env (ASAAS_API_KEY)
Webhook Token: Disponível em .env (ASAAS_WEBHOOK_TOKEN)
Environment: sandbox
Base URL: https://sandbox.asaas.com/api/v3
```

## 🚨 ERROS ANTERIORES A EVITAR

### Erro #1: Análise Superficial
❌ **Não fazer**: Afirmar que algo não existe sem buscar
✅ **Fazer**: Busca exaustiva antes de afirmar ausência

### Erro #2: Não Validar Banco Real
❌ **Não fazer**: Assumir tabelas vazias sem consultar
✅ **Fazer**: SEMPRE conectar ao banco e verificar

### Erro #3: Tom Alarmista
❌ **Não fazer**: Classificar tudo como CRÍTICO
✅ **Fazer**: Classificar por impacto REAL:
- 🔴 **Crítico**: Impede produção AGORA
- 🟡 **Importante**: Deve corrigir em breve
- 🟢 **Melhoria**: Pode esperar

### Erro #4: Não Reconhecer Pontos Positivos
❌ **Não fazer**: Focar apenas em problemas
✅ **Fazer**: Análise equilibrada (problemas + pontos fortes)

## ✅ PROTOCOLO DE ANÁLISE CORRETA

### ANTES de qualquer análise:
1. **Conectar ao banco real** via Power Supabase
2. **Verificar tabelas** e contar registros
3. **Analisar estrutura** de dados existentes
4. **Buscar no código** referências relevantes

### DEPOIS da análise:
1. ✅ **Classificar problemas por impacto REAL**
2. ✅ **Reconhecer o que funciona bem**
3. ✅ **Propor plano de ação viável**
4. ✅ **Dar estimativas realistas de tempo**

## 📊 ESTADO ATUAL DO SISTEMA

### Banco de Dados:
- ✅ **member_types**: 4 registros (Bispo, Pastor, Diácono, Membro)
- ✅ **subscription_plans**: 12 registros (3 periodicidades por cargo)
- ✅ **Edge Functions**: 17 implementadas
- ✅ **Validação CPF**: Implementada em `src/utils/validators.ts`
- ✅ **Testes**: 7 arquivos de teste

### Pontos Fortes:
- ✅ Arquitetura robusta (17 Edge Functions)
- ✅ Webhook seguro com validação
- ✅ Sistema de testes implementado
- ✅ Validações de dados funcionais

## 🎯 REGRAS DE OURO

### 1. NUNCA assumir, SEMPRE verificar
- ❌ "A tabela deve estar vazia"
- ✅ "Vou verificar via Power Supabase"

### 2. NUNCA afirmar ausência sem busca exaustiva
- ❌ "Validação CPF não existe"
- ✅ "Busquei em: grep_search, file_search, read_file - não encontrei"

### 3. SEMPRE classificar por impacto REAL
- 🔴 Crítico: Impede produção/segurança comprometida
- 🟡 Importante: Deve corrigir logo
- 🟢 Melhoria: Pode esperar

### 4. SEMPRE dar análise equilibrada
- ✅ Problemas encontrados (com evidências)
- ✅ Pontos positivos (o que funciona)
- ✅ Plano de ação (tempo real, não "reescrever tudo")

### 5. SEMPRE consultar documentação
- Antes de implementar: ler spec técnica
- Antes de alterar: verificar structure.md
- Antes de migração: usar skills de verificação de banco

## 📞 QUANDO PEDIR AJUDA

**SEMPRE perguntar quando:**
- ❌ Não tiver certeza sobre impacto de mudança
- ❌ Encontrar conflito entre requisitos
- ❌ Precisar de credenciais ou configurações
- ❌ Identificar problema que impede conclusão
- ❌ Houver múltiplas formas de implementar

**NUNCA assumir. SEMPRE perguntar.**

## ✅ CHECKLIST ANTES DE QUALQUER RESPOSTA

- [ ] Li este arquivo completo?
- [ ] Verifiquei estado real do banco (se aplicável)?
- [ ] Consultei skills relevantes?
- [ ] Classifiquei problemas por impacto REAL?
- [ ] Reconheci pontos positivos?
- [ ] Dei plano de ação viável?
- [ ] Evitei tom alarmista?
- [ ] Validei minhas afirmações com evidências?

**Se TODOS os itens estiverem marcados: PROSSIGA**
**Se ALGUM item estiver desmarcado: PARE e complete**