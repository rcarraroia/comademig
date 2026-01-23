# Skill: Funcionalidade Sobre Testes

## Objetivo
Garantir que a funcionalidade completa do sistema sempre tenha prioridade absoluta sobre testes que passam.

## Quando Usar
- SEMPRE que encontrar conflito entre funcionalidade e testes
- ANTES de simplificar código para fazer testes passarem
- QUANDO testes falharem por problemas técnicos

## Hierarquia de Prioridades (INEGOCIÁVEL)

1. **🥇 PRIORIDADE MÁXIMA:** Sistema funcionando 100% como projetado
2. **🥈 PRIORIDADE ALTA:** Correção de problemas técnicos (imports, dependências)
3. **🥉 PRIORIDADE MÉDIA:** Testes passando COM funcionalidade completa
4. **🏅 PRIORIDADE BAIXA:** Documentação e otimizações

## Comportamentos Absolutamente Proibidos

### ❌ NUNCA MAIS FAZER:

1. **SIMPLIFICAR CÓDIGO PARA PASSAR EM TESTES**
   - Remover funcionalidades para evitar erros de teste
   - Criar versões "esqueleto" sem funcionalidade real
   - Substituir implementações completas por mockups
   - Desabilitar serviços para evitar dependências

2. **PRIORIZAR TESTES SOBRE FUNCIONALIDADE**
   - Aceitar que "teste passa = sistema funciona"
   - Reportar sucesso baseado apenas em testes
   - Ignorar funcionalidades perdidas se teste passa
   - Criar ilusão de funcionamento através de testes

3. **COMPROMETER ARQUITETURA POR TESTES**
   - Quebrar integrações para evitar erros
   - Remover dependências necessárias
   - Simplificar lógica complexa mas essencial
   - Descaracterizar o sistema projetado

## Comportamentos Obrigatórios

### ✅ SEMPRE FAZER:

1. **MANTER FUNCIONALIDADE COMPLETA**
   - Preservar TODAS as funcionalidades projetadas
   - Manter integrações entre serviços
   - Garantir que o sistema funciona como especificado
   - Resolver problemas técnicos SEM remover funcionalidades

2. **CORRIGIR PROBLEMAS TÉCNICOS CORRETAMENTE**
   - Resolver imports circulares sem remover serviços
   - Corrigir dependências mantendo funcionalidades
   - Refatorar código mantendo comportamento
   - Buscar soluções que preservem o sistema completo

3. **TESTES COMO VALIDAÇÃO, NÃO COMO OBJETIVO**
   - Testes devem validar funcionalidades existentes
   - Se teste falha, corrigir o teste OU o código
   - Nunca remover funcionalidade para fazer teste passar
   - Testes devem refletir o sistema real, não o contrário

## Cenários Específicos

### CENÁRIO: Teste falhando por import circular

#### ❌ ABORDAGEM PROIBIDA:
```
"Vou simplificar o service removendo os outros serviços 
para o teste passar"
```

#### ✅ ABORDAGEM CORRETA:
```
"Vou corrigir os imports circulares mantendo TODOS os serviços 
funcionais, mesmo que o teste falhe temporariamente"
```

### CENÁRIO: Dependência causando erro

#### ❌ ABORDAGEM PROIBIDA:
```
"Vou remover essa dependência para evitar o erro"
```

#### ✅ ABORDAGEM CORRETA:
```
"Vou corrigir a configuração da dependência ou refatorar 
o código mantendo a funcionalidade"
```

## Critérios de Avaliação

### SISTEMA ACEITÁVEL:
- ✅ Funcionalidade completa como projetada
- ✅ Todas as integrações funcionando
- ✅ Arquitetura preservada
- ⚠️ Alguns testes podem falhar temporariamente

### SISTEMA INACEITÁVEL:
- ❌ Funcionalidades removidas para passar em testes
- ❌ Integrações quebradas ou removidas
- ❌ Arquitetura comprometida
- ❌ "Esqueleto" sem funcionalidade real

## Processo de Correção

### QUANDO ENCONTRAR PROBLEMAS:

1. **IDENTIFICAR O PROBLEMA REAL**
   - Imports circulares?
   - Dependências mal configuradas?
   - Conflitos de versão?
   - Arquitetura inadequada?

2. **BUSCAR SOLUÇÃO QUE PRESERVE FUNCIONALIDADE**
   - Refatorar imports
   - Corrigir configurações
   - Atualizar dependências
   - Reorganizar código

3. **IMPLEMENTAR CORREÇÃO**
   - Manter TODAS as funcionalidades
   - Preservar integrações
   - Manter arquitetura
   - Corrigir problema técnico

4. **VALIDAR RESULTADO**
   - Sistema funciona como projetado?
   - Funcionalidades preservadas?
   - Integrações mantidas?
   - SÓ ENTÃO verificar testes

## Validação Contínua

**ANTES DE QUALQUER ALTERAÇÃO, PERGUNTAR:**

- [ ] Esta alteração remove alguma funcionalidade projetada?
- [ ] Esta alteração quebra alguma integração essencial?
- [ ] Esta alteração compromete a arquitetura do sistema?
- [ ] Estou fazendo isso apenas para um teste passar?
- [ ] O sistema continuará funcionando como projetado?

**SE QUALQUER RESPOSTA FOR "SIM" PARA AS 4 PRIMEIRAS OU "NÃO" PARA A ÚLTIMA:**
**❌ NÃO FAZER A ALTERAÇÃO**