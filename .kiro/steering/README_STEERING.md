# 📚 GUIA DE USO - PASTA STEERING

**Propósito**: Esta pasta contém regras, protocolos e guias que o Antigravity (AI) deve seguir ao trabalhar no projeto COMADEMIG.

---

## 🎯 COMO O ANTIGRAVITY DEVE USAR ESTES ARQUIVOS

### **Regra Fundamental:**
**SEMPRE ler `CONTEXTO_PRIORITARIO.md` ANTES de qualquer análise ou implementação.**

---

## 📁 ESTRUTURA DE ARQUIVOS

### **1. CONTEXTO_PRIORITARIO.md** 🔴 CRÍTICO
**Quando ler**: SEMPRE PRIMEIRO, em TODA conversa
**Conteúdo**:
- Ordem de leitura obrigatória
- Mapa de arquivos importantes
- Credenciais e acesso
- Erros anteriores a evitar
- Protocolo de análise correta
- Estado atual do sistema

### **2. database-analysis-first.md** 🔴 CRÍTICO
**Quando ler**: Antes de QUALQUER operação no banco
**Conteúdo**:
- Princípio de análise prévia obrigatória
- Protocolo de verificação do banco
- Scripts Python para análise
- Checklist de análise prévia

### **3. supabase-execution-rules.md** 🔴 CRÍTICO
**Quando ler**: Antes de executar migrações/CLI
**Conteúdo**:
- Regras de execução via CLI
- Comandos permitidos/proibidos
- Fluxo de trabalho recomendado
- Quando usar CLI vs Dashboard vs Python

### **4. validation-protocol.md** 🟡 IMPORTANTE
**Quando ler**: Ao executar tarefas de implementação
**Conteúdo**:
- Protocolo de validação de tarefas
- Checklist por tipo de tarefa
- Processo de execução
- Relatório obrigatório por tarefa

### **5. GUIA_COMPLETO_ACESSO_SUPABASE.md** 🟡 IMPORTANTE
**Quando ler**: Ao precisar acessar Supabase
**Conteúdo**:
- Configuração do Supabase CLI
- Comandos CLI essenciais
- Scripts Python para análise
- Troubleshooting

### **6. structure.md** 🟢 REFERÊNCIA
**Quando ler**: Ao criar/modificar arquivos
**Conteúdo**:
- Organização de pastas
- Convenções de nomenclatura
- Padrões de arquitetura
- Regras de preservação de layouts

### **7. product.md** 🟢 REFERÊNCIA
**Quando ler**: Ao entender funcionalidades
**Conteúdo**:
- Visão geral do produto
- Funcionalidades principais
- Público-alvo
- Modelo de negócio

### **8. tech.md** 🟢 REFERÊNCIA
**Quando ler**: Ao trabalhar com stack
**Conteúdo**:
- Stack tecnológico
- Bibliotecas principais
- Comandos essenciais
- Configurações importantes

### **9. como-configurar-supabase-cli-automaticamente.md** 🟢 REFERÊNCIA
**Quando ler**: Ao configurar CLI pela primeira vez
**Conteúdo**:
- Passo a passo de instalação
- Configuração automática
- Troubleshooting

---

## 🔄 FLUXO DE TRABALHO RECOMENDADO

### **Para Análise do Sistema:**

```
1. Ler CONTEXTO_PRIORITARIO.md
2. Ler database-analysis-first.md
3. Conectar ao banco via Python/CLI
4. Verificar estado real das tabelas
5. Consultar documentação relevante
6. Fazer análise equilibrada
7. Classificar problemas por impacto REAL
8. Propor plano de ação viável
```

### **Para Implementação de Funcionalidade:**

```
1. Ler CONTEXTO_PRIORITARIO.md
2. Ler validation-protocol.md
3. Ler especificação técnica (docs/)
4. Verificar structure.md para padrões
5. Implementar código
6. Integrar (rotas, links, imports)
7. Testar manualmente
8. Documentar resultado
9. Solicitar validação do usuário
```

### **Para Operações no Banco:**

```
1. Ler CONTEXTO_PRIORITARIO.md
2. Ler database-analysis-first.md
3. Ler supabase-execution-rules.md
4. Analisar estado atual do banco
5. Criar migração via CLI
6. Testar localmente (se possível)
7. Aplicar com supabase db push
8. Verificar resultado
9. Documentar mudança
```

---

## ⚠️ REGRAS CRÍTICAS

### **NUNCA:**
- ❌ Assumir estado do banco sem verificar
- ❌ Afirmar ausência sem busca exaustiva
- ❌ Classificar tudo como CRÍTICO
- ❌ Ignorar pontos positivos do sistema
- ❌ Alterar layouts/políticas sem autorização
- ❌ Criar múltiplas versões do mesmo script
- ❌ Executar operações de escrita via Python

### **SEMPRE:**
- ✅ Ler CONTEXTO_PRIORITARIO.md primeiro
- ✅ Verificar estado real do banco
- ✅ Classificar por impacto REAL
- ✅ Dar análise equilibrada
- ✅ Propor planos viáveis
- ✅ Documentar mudanças
- ✅ Solicitar validação do usuário

---

## 📊 PRIORIDADES

### **🔴 CRÍTICO - Ler SEMPRE**
- CONTEXTO_PRIORITARIO.md
- database-analysis-first.md
- supabase-execution-rules.md

### **🟡 IMPORTANTE - Ler quando aplicável**
- validation-protocol.md
- GUIA_COMPLETO_ACESSO_SUPABASE.md

### **🟢 REFERÊNCIA - Consultar conforme necessidade**
- structure.md
- product.md
- tech.md
- como-configurar-supabase-cli-automaticamente.md

---

## 🔧 MANUTENÇÃO

### **Atualizar quando:**
- Novas regras críticas forem criadas
- Erros recorrentes forem identificados
- Estado do sistema mudar significativamente
- Novas funcionalidades forem implementadas

### **Responsável:**
- Antigravity (AI) + Usuário (validação)

---

## 📞 SUPORTE

**Se tiver dúvidas:**
1. Consultar CONTEXTO_PRIORITARIO.md
2. Buscar no arquivo específico
3. Perguntar ao usuário (NUNCA assumir)

---

**ÚLTIMA ATUALIZAÇÃO**: 2025-11-26  
**VERSÃO**: 1.0
