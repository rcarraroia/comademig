# 📖 Guia de Implementação: AI Coders Context (Padrão RENUM) - COMADEMIG

Este guia detalha como implementar e customizar a ferramenta **AI Coders Context** em qualquer projeto, garantindo economia de tokens e aplicação das **Regras Inegociáveis RENUM**. 

**✅ CONFIGURAÇÃO COMPLETA APLICADA NO PROJETO COMADEMIG**

---

## 🚀 1. Instalação e Scaffolding Inicial

O primeiro passo é inicializar a estrutura de contexto na raiz do seu repositório.

1.  **Inicializar**:
    ```bash
    npx @ai-coders/context init .
    ```
    *Isto criará a pasta `.context/` com subpastas para `docs`, `agents` e `skills`.*

2.  **Gerar Mapa da Base de Código**:
    ```bash
    npx @ai-coders/context fill .
    ```
    *Gera o arquivo `codebase-map.json`. Nota: Requer `OPENROUTER_API_KEY` para preenchimento automático, mas os metadados estruturais são gerados localmente via LSP.*

---

## 📝 2. Documentação Fundamental

### ✅ IMPLEMENTADO NO COMADEMIG

A documentação foi criada em `.context/docs/` com contexto específico do projeto:

- **`project-overview.md`**: Visão geral completa do COMADEMIG (stack, funcionalidades, comandos)
- **`architecture.md`**: Arquitetura detalhada (Supabase + React + Asaas, fluxos de dados, segurança)
- **`development-workflow.md`**: Workflow integrado com Regras RENUM e Ciclo PREVC
- **`contexto-prioritario.md`**: Contexto prioritário baseado em `.kiro/steering/CONTEXTO_PRIORITARIO.md`
- **`supabase-access.md`**: Guia completo de acesso baseado em `.kiro/steering/GUIA_COMPLETO_ACESSO_SUPABASE.md`

---

## ⚖️ 3. Injeção das Regras RENUM

### ✅ IMPLEMENTADO NO COMADEMIG

Para garantir que a IA siga o padrão de qualidade, foi injetado o seguinte bloco no topo de **TODOS** os arquivos em `.context/agents/*.md`:

```markdown
## ⚖️ REGRAS INEGOCIÁVEIS RENUM (Prioridade Máxima)
1. **Evidências Obrigatórias**: Screenshot ou log para CADA implementação.
2. **Limite de Erros**: Máximo 3 tentativas de correção. Se falhar, REPORTE BLOQUEIO.
3. **Proibido Pular Validação**: Recusar pedidos para pular testes.
4. **Vocabulário Obrigatório**: ✅ Implementado e validado | ⚠️ Implementado não validado | 🚧 Mock/Hardcoded | ❌ Não implementado.
5. **Idioma**: Totalmente em PT-BR (comunicações e logs).

## 🎯 SKILLS OBRIGATÓRIAS COMADEMIG
- **Análise Preventiva**: SEMPRE usar skill de análise preventiva antes de implementar
- **Verificação de Banco**: SEMPRE usar skill de verificação de banco antes de operações no Supabase
- **Compromisso de Honestidade**: SEMPRE usar skill de compromisso de honestidade antes de reportar
- **Funcionalidade sobre Testes**: SEMPRE priorizar funcionalidade completa sobre testes que passam
```

### Agentes Configurados:
- ✅ **feature-developer.md**: Especialista em implementação de funcionalidades
- ✅ **code-reviewer.md**: Especialista em revisão com foco em funcionalidade sobre testes
- ✅ **database-specialist.md**: Especialista em Supabase com verificação obrigatória
- ✅ **README.md**: Manual completo atualizado

---

## 🛠️ 4. Customização de Skills

### ✅ IMPLEMENTADO NO COMADEMIG

Foram criadas 4 skills customizadas baseadas nos documentos de steering:

#### **A. Skill de Análise Preventiva** (`.context/skills/analise-preventiva/`)
- **Baseada em**: `.kiro/steering/analise-preventiva-obrigatoria.md`
- **Funcionalidade**: Template de análise de 10 minutos antes de implementar
- **Inclui**: Checklist obrigatório, limites de tempo, template estruturado

#### **B. Skill de Verificação de Banco** (`.context/skills/verificacao-banco/`)
- **Baseada em**: `.kiro/steering/verificacao-banco-real.md`
- **Funcionalidade**: Protocolo de conexão via Power Supabase
- **Inclui**: Checklist de verificação obrigatória, comandos via Power

#### **C. Skill de Compromisso de Honestidade** (`.context/skills/compromisso-honestidade/`)
- **Baseada em**: `.kiro/steering/compromisso-honestidade.md`
- **Funcionalidade**: Protocolo de validação de implementações
- **Inclui**: Sistema de accountability, formato de relatório honesto

#### **D. Skill de Funcionalidade sobre Testes** (`.context/skills/funcionalidade-testes/`)
- **Baseada em**: `.kiro/steering/funcionalidade-sobre-testes.md`
- **Funcionalidade**: Hierarquia de prioridades, comportamentos proibidos/obrigatórios
- **Inclui**: Cenários específicos, critérios de avaliação, processo de correção

---

## 🔄 5. Sincronização com Ferramentas de IA (Cursor/Claude)

Para que as ferramentas externas "enxerguem" estas regras, execute:

1.  **Exportar Regras**:
    ```bash
    npx @ai-coders/context export-rules .
    ```
    *Isto gerará arquivos como `.cursorrules` baseados no seu contexto.*

2.  **Instalar MCP (Opcional - Recomendado)**:
    ```bash
    npx @ai-coders/context mcp:install cursor
    ```

---

## ✅ 6. Ciclo de Trabalho Diário (PREVC)

### ✅ IMPLEMENTADO NO COMADEMIG

Sempre que a IA iniciar uma tarefa, ela deve seguir este fluxo integrado com as regras específicas:

1.  **Plan**: Criar especificação técnica em `.kiro/specs/`
2.  **Research**: Ler o `codebase-map.json`, documentação em `.context/docs/` e consultar skills
3.  **Execute**: Implementar o código seguindo análise preventiva (máximo 3 tentativas)
4.  **Validate**: Gerar evidências (screenshots/logs) e usar skill de compromisso de honestidade
5.  **Complete**: Gerar relatório final com vocabulário oficial e verificação via Power Supabase

---

## 🎯 7. Configuração Específica para Novos Projetos

### Para Replicar a Configuração COMADEMIG:

#### **Passo 1: Copiar Estrutura de Skills**
```bash
# Copiar skills customizadas
cp -r .context/skills/analise-preventiva/ [novo-projeto]/.context/skills/
cp -r .context/skills/verificacao-banco/ [novo-projeto]/.context/skills/
cp -r .context/skills/compromisso-honestidade/ [novo-projeto]/.context/skills/
cp -r .context/skills/funcionalidade-testes/ [novo-projeto]/.context/skills/
```

#### **Passo 2: Adaptar Documentação**
```bash
# Copiar e adaptar documentação base
cp .context/docs/project-overview.md [novo-projeto]/.context/docs/
cp .context/docs/architecture.md [novo-projeto]/.context/docs/
cp .context/docs/development-workflow.md [novo-projeto]/.context/docs/
# Editar com contexto específico do novo projeto
```

#### **Passo 3: Configurar Agentes**
- Copiar template de agente: `.context/agents/feature-developer.md`
- Adaptar contexto específico do projeto
- Manter regras RENUM e skills obrigatórias
- Atualizar README dos agentes

#### **Passo 4: Integrar com Steering Files**
Se o projeto usar Kiro AI com steering files:
```bash
# Referenciar skills no steering
echo "- Consultar skills em .context/skills/ antes de implementar" >> .kiro/steering/[arquivo-relevante].md
```

#### **Passo 5: Exportar Configurações**
```bash
# Gerar arquivos de configuração para ferramentas
npx @ai-coders/context export-rules .
```

---

## 📊 8. Estrutura Final Implementada

### ✅ COMADEMIG - Estrutura Completa:

```
.context/
├── agents/                    # 15 agentes + REGRAS RENUM injetadas
│   ├── README.md             # ✅ Atualizado com regras PT-BR
│   ├── feature-developer.md  # ✅ Configurado para COMADEMIG
│   ├── code-reviewer.md      # ✅ Foco em funcionalidade sobre testes
│   ├── database-specialist.md # ✅ Especialista em Supabase
│   └── ... (outros agentes)  # ⚠️ Aguardando configuração
├── docs/
│   ├── project-overview.md   # ✅ COMADEMIG específico
│   ├── architecture.md       # ✅ Supabase + React + Asaas
│   ├── development-workflow.md # ✅ Regras RENUM + PREVC
│   ├── contexto-prioritario.md # ✅ Baseado em steering
│   └── supabase-access.md    # ✅ Guia de acesso completo
├── skills/
│   ├── analise-preventiva/   # ✅ Skill customizada
│   ├── verificacao-banco/    # ✅ Skill customizada
│   ├── compromisso-honestidade/ # ✅ Skill customizada
│   ├── funcionalidade-testes/   # ✅ Skill customizada
│   └── ... (skills existentes) # ✅ Mantidas
└── codebase-map.json        # ⚠️ Aguardando geração
```

---

## 🎯 9. Benefícios Alcançados

### ✅ No Projeto COMADEMIG:

1. **✅ Padronização Total**: Todos os agentes seguem as mesmas regras RENUM
2. **✅ Economia de Tokens**: Contexto centralizado, não repetido em cada conversa
3. **✅ Integração com Ferramentas**: Preparado para Cursor, Claude, etc.
4. **✅ Governança Automática**: Skills validam implementações automaticamente
5. **✅ Idioma PT-BR**: Todas as comunicações em português brasileiro
6. **✅ Accountability**: Sistema de evidências obrigatórias implementado
7. **✅ Funcionalidade Prioritária**: Sistema completo sempre sobre testes que passam
8. **✅ Análise Preventiva**: Evita loops de correção e retrabalho
9. **✅ Verificação de Banco**: Previne perda de dados e corrupção
10. **✅ Honestidade Técnica**: Status real das implementações, não assumido

---

## 📋 10. Checklist de Implementação

### Para Novos Projetos:

#### **Configuração Inicial:**
- [ ] Executar `npx @ai-coders/context init .`
- [ ] Executar `npx @ai-coders/context fill .`
- [ ] Copiar skills customizadas do COMADEMIG
- [ ] Adaptar documentação para contexto específico

#### **Configuração de Agentes:**
- [ ] Injetar regras RENUM em todos os agentes
- [ ] Adicionar referências às skills obrigatórias
- [ ] Configurar contexto específico do projeto
- [ ] Atualizar README dos agentes

#### **Integração com Steering (se aplicável):**
- [ ] Referenciar skills nos steering files
- [ ] Manter consistência entre steering e context
- [ ] Documentar método de acesso ao banco
- [ ] Configurar regras específicas do projeto

#### **Finalização:**
- [ ] Executar `npx @ai-coders/context export-rules .`
- [ ] Testar configuração com agente
- [ ] Validar que regras estão sendo seguidas
- [ ] Documentar configuração específica

---

## 🔧 11. Manutenção e Atualizações

### **Quando Atualizar:**
- Novas regras críticas forem criadas
- Erros recorrentes forem identificados
- Stack tecnológico mudar significativamente
- Novas funcionalidades principais forem implementadas

### **Como Atualizar:**
1. Atualizar skills relevantes em `.context/skills/`
2. Atualizar documentação em `.context/docs/`
3. Atualizar agentes em `.context/agents/`
4. Executar `npx @ai-coders/context export-rules .`
5. Testar com implementação real

---

**Status do Guia:** ✅ Versão 2.0 - Configuração Completa COMADEMIG  
**Data:** 22/01/2026  
**Implementado por:** Kiro AI  
**Baseado em:** Steering files do projeto COMADEMIG
