# Workflow de Desenvolvimento COMADEMIG

## Regras RENUM Integradas

### ⚖️ REGRAS INEGOCIÁVEIS (Prioridade Máxima)
1. **Evidências Obrigatórias**: Screenshot ou log para CADA implementação
2. **Limite de Erros**: Máximo 3 tentativas de correção. Se falhar, REPORTE BLOQUEIO
3. **Proibido Pular Validação**: Recusar pedidos para pular testes
4. **Vocabulário Obrigatório**: ✅ Implementado e validado | ⚠️ Implementado não validado | 🚧 Mock/Hardcoded | ❌ Não implementado
5. **Idioma**: Totalmente em PT-BR (comunicações e logs)

## Ciclo PREVC Obrigatório

### 1. **Plan** (Planejamento)
- Criar especificação técnica em `.kiro/specs/`
- Definir requisitos claros
- Identificar dependências
- Estimar tempo de desenvolvimento

### 2. **Research** (Pesquisa)
- Ler `codebase-map.json` e documentação
- Analisar código existente
- Verificar padrões estabelecidos
- Consultar steering files

### 3. **Execute** (Execução)
- Implementar código (máximo 3 tentativas)
- Seguir padrões existentes
- Aplicar tratamento de erros
- Manter funcionalidade completa

### 4. **Validate** (Validação)
- Gerar evidências (screenshots/logs)
- Testar funcionalidades end-to-end
- Verificar integrações
- Confirmar dados reais (não mock)

### 5. **Complete** (Conclusão)
- Gerar relatório final com vocabulário oficial
- Documentar mudanças
- Atualizar documentação relevante
- Solicitar validação do usuário

## Análise Preventiva Obrigatória

### ANTES de implementar qualquer tarefa:

#### 1. ANÁLISE PRÉ-IMPLEMENTAÇÃO (5-10 minutos)
- [ ] Ler TODOS os arquivos relacionados à tarefa
- [ ] Entender EXATAMENTE o que precisa ser implementado
- [ ] Identificar dependências e integrações necessárias
- [ ] Verificar padrões de código existentes no projeto
- [ ] Identificar possíveis pontos de erro ANTES de implementar
- [ ] Planejar estrutura de arquivos e funções
- [ ] Definir estratégia de testes ANTES de implementar

#### 2. IMPLEMENTAÇÃO FOCADA (15-30 minutos)
- [ ] Implementar seguindo exatamente o planejado
- [ ] Usar padrões já estabelecidos no projeto
- [ ] Seguir estruturas similares de arquivos existentes
- [ ] Implementar com tratamento de erros desde o início
- [ ] Não improvisar - seguir o plano da análise

#### 3. TESTE EFICIENTE (5-15 minutos)
- [ ] Testar apenas o que foi implementado
- [ ] Máximo 2 tentativas de correção
- [ ] Se não funcionar na 2ª tentativa = voltar à análise
- [ ] Não ficar em loop de teste-correção-teste
- [ ] Reportar problemas reais ao usuário se persistirem

## Verificação de Banco Real

### SEMPRE antes de intervenções no banco:

#### Método Oficial: Power Supabase Hosted Development
1. **Ativar o Power**: `kiroPowers` → "supabase-hosted"
2. **Verificar Estrutura**: Listar tabelas e verificar estruturas
3. **Executar Queries**: SELECT para análise de dados
4. **Aplicar Migrations**: Mudanças seguras no banco

#### Checklist Obrigatório:
- [ ] Conectou ao banco real via Power?
- [ ] Verificou se a tabela/estrutura já existe?
- [ ] Contou quantos registros existem?
- [ ] Analisou a estrutura atual dos dados?
- [ ] Identificou relacionamentos com outras tabelas?
- [ ] Verificou políticas RLS existentes?
- [ ] Buscou no código referências à estrutura?
- [ ] Avaliou o impacto em funcionalidades existentes?
- [ ] Documentou o estado atual antes da mudança?
- [ ] Criou estratégia de rollback se necessário?

## Compromisso de Honestidade

### Verificação Obrigatória ANTES de reportar:
- [ ] Testei TODAS as funcionalidades implementadas?
- [ ] Verifiquei se APIs realmente funcionam?
- [ ] Confirmei se integrações estão conectadas?
- [ ] Validei se dados reais (não mock) estão sendo usados?
- [ ] Executei build e deployment para verificar erros?

### Formato de Relatório Honesto:
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

## Funcionalidade Sobre Testes

### Hierarquia de Prioridades:
1. **🥇 PRIORIDADE MÁXIMA**: Sistema funcionando 100% como projetado
2. **🥈 PRIORIDADE ALTA**: Correção de problemas técnicos
3. **🥉 PRIORIDADE MÉDIA**: Testes passando COM funcionalidade completa
4. **🏅 PRIORIDADE BAIXA**: Documentação e otimizações

### Comportamentos Proibidos:
- ❌ Simplificar código para passar em testes
- ❌ Remover funcionalidades para evitar erros
- ❌ Priorizar testes sobre funcionalidade
- ❌ Comprometer arquitetura por testes

## Limites de Tempo

### Por Tarefa:
- **Análise Preventiva**: 10 minutos máximo
- **Implementação**: 30 minutos máximo
- **Testes**: 15 minutos máximo
- **TOTAL**: 55 minutos máximo

### Quando Reportar Problemas:
- ✅ Após 2 tentativas de correção
- ✅ Se análise levar mais de 10 min
- ✅ Se implementação levar mais de 30 min
- ✅ Se testes levarem mais de 15 min

## Branching e Commits

### Estrutura de Branches:
- `main`: Produção
- `develop`: Desenvolvimento
- `feature/*`: Novas funcionalidades
- `fix/*`: Correções de bugs

### Conventional Commits:
```
feat(component): add new feature
fix(bug): resolve issue with payment
docs(readme): update installation guide
refactor(auth): improve authentication flow
```

## Code Review

### Checklist do Reviewer:
- [ ] Código segue padrões estabelecidos?
- [ ] Funcionalidade está completa e testada?
- [ ] Não há código morto ou comentado?
- [ ] Tratamento de erros está implementado?
- [ ] Documentação foi atualizada?
- [ ] Testes cobrem cenários principais?

## Deploy

### Processo:
1. **Desenvolvimento**: Branch feature
2. **Teste**: Merge para develop
3. **Validação**: Testes automatizados
4. **Produção**: Merge para main
5. **Deploy**: Automático via Lovable

### Rollback:
- Identificação rápida de problemas
- Rollback automático em caso de falha
- Notificação da equipe
- Análise post-mortem