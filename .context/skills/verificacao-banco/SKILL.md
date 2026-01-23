# Skill: Verificação de Banco Real

## Objetivo
Garantir que toda intervenção no banco de dados seja precedida de análise do estado atual para evitar perda de dados ou corrupção.

## Quando Usar
- ANTES de criar qualquer migração ou script SQL
- ANTES de alterar estruturas de banco
- SEMPRE que trabalhar com Supabase

## Método Oficial de Acesso
**🔌 Power: Supabase Hosted Development (EXCLUSIVO)**

## Checklist de Verificação Obrigatória

ANTES de criar qualquer migração ou script SQL:

- [ ] Conectou ao banco real via Power: Supabase Hosted Development?
- [ ] Verificou se a tabela/estrutura já existe?
- [ ] Contou quantos registros existem?
- [ ] Analisou a estrutura atual dos dados?
- [ ] Identificou relacionamentos com outras tabelas?
- [ ] Verificou políticas RLS existentes?
- [ ] Buscou no código referências à estrutura?
- [ ] Avaliou o impacto em funcionalidades existentes?
- [ ] Documentou o estado atual antes da mudança?
- [ ] Criou estratégia de rollback se necessário?

## Como Usar o Power Supabase

### 1. Ativar o Power
```
Use o comando kiroPowers para ativar o power "supabase-hosted"
```

### 2. Verificar Estrutura de Tabelas
```
Use as ferramentas do power para listar tabelas e verificar estruturas
```

### 3. Executar Queries de Verificação
```
Use as ferramentas do power para executar queries SELECT e verificar dados
```

### 4. Aplicar Migrations
```
Use as ferramentas do power para aplicar mudanças no banco
```

## Comandos Básicos via Power

### Verificar Estrutura Geral
- Listar todas as tabelas do schema public
- Verificar estrutura de tabelas específicas
- Contar registros em tabelas

### Verificar Dados Existentes
- Executar queries SELECT para análise
- Verificar relacionamentos entre tabelas
- Analisar políticas RLS ativas

### Aplicar Mudanças
- Executar migrations de forma segura
- Criar/alterar tabelas quando necessário
- Aplicar políticas RLS

## Protocolo de Análise Prévia

### Exemplo de Verificação Completa via Power

```
1. Ativar Power Supabase:
   - Usar kiroPowers para ativar "supabase-hosted"
   - Verificar conexão com o projeto

2. Verificar tabelas relacionadas:
   - Listar tabelas relacionadas à funcionalidade
   - Verificar estrutura das tabelas existentes
   - Contar registros em cada tabela

3. Analisar dados existentes:
   - Verificar dados nas tabelas
   - Identificar relacionamentos
   - Verificar políticas RLS ativas

4. Documentar estado atual:
   - Registrar estruturas encontradas
   - Documentar dados importantes
   - Planejar mudanças necessárias
```

## Situações Críticas

### Se Tabelas NÃO Existem
- ✅ Pode criar normalmente via Power
- ✅ Aplicar migrations via Power
- ✅ Inserir dados de teste via Power

### Se Tabelas JÁ Existem
- ⚠️ CUIDADO: Verificar estrutura atual via Power
- ⚠️ CUIDADO: Verificar dados existentes via Power
- ⚠️ CUIDADO: Criar migration de alteração, não criação

### Se Há Dados Importantes
- 🚨 BACKUP obrigatório antes de qualquer alteração
- 🚨 Testar migration em ambiente de desenvolvimento
- 🚨 Planejar rollback