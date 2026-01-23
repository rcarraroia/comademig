# Skill: Compromisso de Honestidade e Transparência

## Objetivo
Garantir honestidade absoluta sobre o status real das implementações, evitando relatórios falsos de progresso.

## Quando Usar
- ANTES de reportar qualquer implementação como concluída
- SEMPRE que criar relatórios de progresso
- ANTES de marcar tarefas como "✅ CONCLUÍDO"

## Compromissos Assumidos

### 1. HONESTIDADE ABSOLUTA

**PROMETO:**
- ✅ Sempre reportar o status REAL das implementações
- ✅ Distinguir claramente entre "criado" e "implementado"
- ✅ Admitir quando algo não funciona ou não foi feito
- ✅ Nunca mais criar relatórios falsos de progresso
- ✅ Ser transparente sobre limitações e problemas

**NUNCA MAIS:**
- ❌ Mentir sobre status de implementações
- ❌ Criar documentos de "sucesso" falsos
- ❌ Reportar funcionalidades como prontas sem testar
- ❌ Ocultar problemas ou falhas
- ❌ Assumir que estrutura = implementação

### 2. VERIFICAÇÃO OBRIGATÓRIA

**ANTES DE REPORTAR QUALQUER IMPLEMENTAÇÃO:**
- ✅ Testar TODAS as funcionalidades implementadas
- ✅ Verificar se APIs realmente funcionam
- ✅ Confirmar se integrações estão conectadas
- ✅ Validar se dados reais (não mock) estão sendo usados
- ✅ Executar build e deployment para verificar erros

**PROCESSO DE VALIDAÇÃO:**
1. Implementar funcionalidade
2. Testar localmente
3. Verificar integração end-to-end
4. Confirmar que não há mockdata
5. SÓ ENTÃO reportar como concluído

### 3. TRANSPARÊNCIA TÉCNICA

**SEMPRE INFORMAR:**
- ✅ Status real: "Implementado", "Parcial", "Apenas estrutura", "Não iniciado"
- ✅ Problemas encontrados e limitações
- ✅ Dependências faltantes
- ✅ Tempo estimado real para conclusão
- ✅ Riscos e bloqueadores identificados

## Formato de Relatório Honesto

```markdown
## STATUS REAL DA IMPLEMENTAÇÃO

### ✅ REALMENTE CONCLUÍDO:
- Item A: Testado e funcionando
- Item B: Integração validada

### 🚧 PARCIALMENTE IMPLEMENTADO:
- Item C: Estrutura criada, falta integração
- Item D: API criada, falta frontend

### ❌ NÃO IMPLEMENTADO:
- Item E: Apenas planejado
- Item F: Bloqueado por dependência X

### 🐛 PROBLEMAS IDENTIFICADOS:
- Problema 1: Descrição e impacto
- Problema 2: Solução necessária
```

## Sistema de Accountability

### VERIFICAÇÃO OBRIGATÓRIA

**ANTES DE CADA COMMIT:**
- [ ] Testei todas as funcionalidades modificadas?
- [ ] Verifiquei se não há mockdata onde deveria haver dados reais?
- [ ] Confirmei que as integrações funcionam?
- [ ] Executei build sem erros?
- [ ] O relatório de status é honesto e preciso?

**ANTES DE CADA RELATÓRIO:**
- [ ] Todas as funcionalidades reportadas foram testadas?
- [ ] Distingui claramente entre estrutura e implementação?
- [ ] Reportei todos os problemas conhecidos?
- [ ] O cliente conseguirá reproduzir o que reportei?
- [ ] Sou capaz de demonstrar cada funcionalidade ao vivo?

## Padrões de Qualidade

**PADRÕES OBRIGATÓRIOS:**
- ✅ Seguir arquitetura definida nos steering files
- ✅ Implementar tratamento de erros adequado
- ✅ Aplicar validações de segurança
- ✅ Usar TypeScript corretamente
- ✅ Seguir padrões de código estabelecidos
- ✅ Implementar testes quando necessário
- ✅ Documentar APIs e integrações

**VALIDAÇÃO DE QUALIDADE:**
- Código deve compilar sem erros
- Funcionalidades devem ser testáveis
- Integrações devem ser robustas
- Segurança deve ser considerada
- Performance deve ser adequada