# 🧹 PLANO DE LIMPEZA DO BANCO DE DADOS

**Data:** 17/10/2025  
**Status:** ⏳ AGUARDANDO APROVAÇÃO

---

## 📊 RESULTADO DA ANÁLISE

### Situação Encontrada:
- **15 tabelas** existentes no banco
- **3 tabelas** com dados (MANTER)
- **12 tabelas** vazias (ANALISAR)

### Verificações Realizadas:
- ✅ Análise completa do banco de dados
- ✅ Contagem de registros em todas as tabelas
- ✅ Busca no código por referências a `profiles` e `transactions`
- ✅ Identificação de tabelas funcionais vs não utilizadas

---

## 🗑️ TABELAS PARA DELETAR (5 tabelas)

### 1. noticias (0 registros)
**Motivo:** Vazia, será recriada com schema correto na Fase 2

### 2. multimidia (0 registros)
**Motivo:** Vazia, não será mais usada (criaremos videos, albuns_fotos, fotos)

### 3. eventos (0 registros)
**Motivo:** Vazia, fora do escopo atual do projeto

### 4. profiles (0 registros)
**Motivo:** Vazia, sem referências no código (verificado)

### 5. transactions (0 registros)
**Motivo:** Vazia, sem referências no código (verificado)

---

## ✅ TABELAS PARA MANTER (10 tabelas)

### Com Dados (3 tabelas):
1. **content_management** - 13 registros (CRÍTICA)
2. **member_types** - 4 registros (Sistema de filiação)
3. **subscription_plans** - 12 registros (Sistema de filiação)

### Vazias mas Funcionais (7 tabelas):
4. **user_subscriptions** - Relacionada a subscription_plans
5. **asaas_cobrancas** - Integração com gateway de pagamento
6. **solicitacoes_certidoes** - Sistema de certidões (futuro)
7. **certidoes** - Sistema de certidões (futuro)
8. **affiliates** - Sistema de afiliados
9. **affiliate_commissions** - Sistema de afiliados
10. **audit_logs** - Logs de auditoria

---

## 📝 SCRIPT SQL DE LIMPEZA

```sql
-- Deletar tabelas vazias que serão recriadas
DROP TABLE IF EXISTS noticias CASCADE;
DROP TABLE IF EXISTS multimidia CASCADE;
DROP TABLE IF EXISTS eventos CASCADE;

-- Deletar tabelas vazias sem uso no código
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
```

**Arquivo:** `cleanup_database.sql`

---

## ⚙️ COMO EXECUTAR

### Opção 1: Via Supabase CLI (RECOMENDADO)
```bash
supabase db execute -f cleanup_database.sql
```

### Opção 2: Via Dashboard do Supabase
1. Acessar: https://supabase.com/dashboard/project/amkelczfwazutrciqtlk/sql
2. Copiar conteúdo de `cleanup_database.sql`
3. Colar no editor SQL
4. Executar

---

## ✅ VERIFICAÇÃO PÓS-LIMPEZA

Após executar o script, verificar que restaram apenas 10 tabelas:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Resultado esperado:**
1. affiliates
2. affiliate_commissions
3. asaas_cobrancas
4. audit_logs
5. certidoes
6. content_management
7. member_types
8. solicitacoes_certidoes
9. subscription_plans
10. user_subscriptions

---

## 🎯 BENEFÍCIOS DA LIMPEZA

1. **Organização:** Banco de dados limpo e organizado
2. **Sem Conflitos:** Evita conflitos de nomes ao criar novas tabelas
3. **Clareza:** Fácil identificar quais tabelas estão em uso
4. **Performance:** Menos tabelas = queries mais rápidas
5. **Manutenção:** Facilita futuras manutenções

---

## ⚠️ SEGURANÇA

- ✅ Todas as tabelas a deletar estão **VAZIAS** (0 registros)
- ✅ Nenhuma tabela com dados será afetada
- ✅ Uso de `CASCADE` garante remoção de dependências
- ✅ Uso de `IF EXISTS` evita erros se tabela não existir
- ✅ Backup não necessário (tabelas vazias)

---

## 📋 PRÓXIMOS PASSOS

### Após Aprovação:

1. **Executar Limpeza** (2 minutos)
   - Executar `cleanup_database.sql`
   - Verificar que 5 tabelas foram removidas

2. **Confirmar Resultado** (1 minuto)
   - Verificar que restaram 10 tabelas
   - Confirmar que content_management ainda tem 13 registros

3. **Iniciar Implementação** (18-23 horas)
   - Começar Fase 1: Correções na Home
   - Criar novas tabelas conforme necessário

---

## 🚀 DECISÃO NECESSÁRIA

**Você aprova a execução deste plano de limpeza?**

- [ ] ✅ **SIM** - Pode executar a limpeza agora
- [ ] ⚠️ **REVISAR** - Quero revisar algo antes
- [ ] ❌ **NÃO** - Não deletar nada

---

**Aguardando sua decisão para prosseguir...**
