# Skill: Análise Preventiva Obrigatória

## Objetivo
Garantir que toda implementação seja precedida de análise preventiva completa para evitar loops de correção e retrabalho.

## Quando Usar
- ANTES de implementar qualquer tarefa
- ANTES de escrever qualquer código
- SEMPRE que iniciar uma nova funcionalidade

## Processo Obrigatório

### 1. ANÁLISE PRÉ-IMPLEMENTAÇÃO (5-10 minutos)
```
CHECKLIST OBRIGATÓRIO:

□ Ler TODOS os arquivos relacionados à tarefa
□ Entender EXATAMENTE o que precisa ser implementado
□ Identificar dependências e integrações necessárias
□ Verificar padrões de código existentes no projeto
□ Identificar possíveis pontos de erro ANTES de implementar
□ Planejar estrutura de arquivos e funções
□ Definir estratégia de testes ANTES de implementar
```

### 2. TEMPLATE DE ANÁLISE
```markdown
## ANÁLISE PREVENTIVA - TAREFA X.Y

### 1. ENTENDIMENTO DA TAREFA
- O que exatamente precisa ser implementado?
- Quais são os requisitos específicos?
- Que arquivos precisam ser criados/modificados?

### 2. DEPENDÊNCIAS E INTEGRAÇÕES
- Que outros serviços/classes esta tarefa usa?
- Que imports são necessários?
- Que configurações são necessárias?

### 3. PADRÕES EXISTENTES
- Como tarefas similares foram implementadas?
- Que estrutura de código seguir?
- Que convenções de nomenclatura usar?

### 4. PONTOS DE RISCO IDENTIFICADOS
- Onde podem ocorrer erros?
- Que validações são necessárias?
- Que casos edge considerar?

### 5. ESTRATÉGIA DE IMPLEMENTAÇÃO
- Em que ordem implementar as funcionalidades?
- Que estrutura de arquivos usar?
- Como organizar o código?

### 6. ESTRATÉGIA DE TESTE
- Que testes são realmente necessários?
- Como validar se está funcionando?
- Que cenários testar?
```

## Limites de Tempo
- **Análise Preventiva:** 10 minutos máximo
- **Implementação:** 30 minutos máximo
- **Testes:** 15 minutos máximo
- **TOTAL POR TAREFA:** 55 minutos máximo

## Comportamentos Proibidos
- ❌ Começar a implementar sem análise prévia
- ❌ Ficar mais de 2 tentativas corrigindo o mesmo erro
- ❌ Gastar mais de 15 minutos testando uma funcionalidade
- ❌ Reimplementar código do zero sem entender o erro
- ❌ Continuar em loop de teste-correção por mais de 30 minutos

## Quando Reportar Problemas
- ✅ Parar após 2 tentativas de correção
- ✅ Reportar o problema específico ao usuário
- ✅ Explicar o que foi tentado e onde travou
- ✅ Pedir orientação ao invés de continuar tentando

## Métricas de Sucesso
- **Tempo médio por tarefa:** < 45 minutos
- **Taxa de sucesso na 1ª implementação:** > 80%
- **Tempo gasto em testes:** < 25% do tempo total
- **Retrabalho:** < 10% das tarefas