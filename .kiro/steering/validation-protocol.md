# 🔒 PROTOCOLO OBRIGATÓRIO DE VALIDAÇÃO DE TAREFAS

## ⚠️ REGRA FUNDAMENTAL

**Uma tarefa SÓ pode ser marcada como concluída [x] quando TODOS os critérios forem atendidos:**

1. ✅ Código foi escrito e salvo
2. ✅ Código foi integrado no sistema (imports, rotas, links)
3. ✅ Funcionalidade está acessível via interface
4. ✅ Funcionalidade foi testada manualmente
5. ✅ Resultado do teste foi documentado
6. ✅ Usuário validou que está funcionando

## 🚫 PROIBIÇÕES ABSOLUTAS

❌ **NUNCA** marcar tarefa como concluída sem testar
❌ **NUNCA** assumir que "deve estar funcionando"
❌ **NUNCA** pular etapas de integração (rotas, links, imports)
❌ **NUNCA** ignorar tarefas marcadas como opcionais sem consultar o usuário
❌ **NUNCA** marcar múltiplas tarefas como concluídas sem validação individual
❌ **NUNCA** considerar tarefa completa apenas porque o arquivo foi criado

## 📝 CHECKLIST POR TIPO DE TAREFA

### ✅ Para Páginas Admin/Dashboard:

**Critérios Obrigatórios:**
- [ ] Arquivo da página criado em `src/pages/admin/` ou `src/pages/dashboard/`
- [ ] Componente exportado corretamente
- [ ] **ROTA adicionada em `src/App.tsx`**
- [ ] **LINK adicionado em `src/components/dashboard/DashboardSidebar.tsx`**
- [ ] Verificação de permissões implementada (se aplicável)
- [ ] Página acessível via navegação do menu
- [ ] Layout renderizando corretamente

**Teste Obrigatório:**
```
1. Abrir navegador
2. Fazer login como admin/usuário apropriado
3. Clicar no link do menu
4. Verificar que a página carrega sem erros
5. Verificar que o conteúdo está visível
6. Documentar resultado
```

**Documentação Obrigatória:**
```markdown
### Teste Realizado:
- URL testada: [url]
- Usuário: [tipo de usuário]
- Resultado: [sucesso/falha]
- Screenshot: [se possível]
- Problemas encontrados: [lista]
```

---

### ✅ Para Componentes de UI:

**Critérios Obrigatórios:**
- [ ] Arquivo do componente criado
- [ ] Componente exportado corretamente
- [ ] **Componente importado na página/componente pai**
- [ ] **Componente renderizado no JSX do pai**
- [ ] Props definidas e tipadas
- [ ] Props sendo passadas corretamente
- [ ] Componente visível na interface

**Teste Obrigatório:**
```
1. Navegar até a página que usa o componente
2. Verificar que o componente está visível
3. Testar interações (cliques, inputs, etc)
4. Verificar que dados são exibidos corretamente
5. Documentar resultado
```

---

### ✅ Para Hooks Customizados:

**Critérios Obrigatórios:**
- [ ] Arquivo do hook criado em `src/hooks/`
- [ ] Hook exportado corretamente
- [ ] **Hook importado nos componentes que o usam**
- [ ] **Hook sendo chamado nos componentes**
- [ ] Queries/Mutations configuradas corretamente
- [ ] Dados sendo retornados
- [ ] Loading/Error states funcionando

**Teste Obrigatório:**
```
1. Abrir DevTools do navegador
2. Navegar até componente que usa o hook
3. Verificar no console/React Query DevTools que dados são carregados
4. Testar mutations (se aplicável)
5. Verificar que dados persistem no banco
6. Documentar resultado
```

---

### ✅ Para Rotas e Navegação:

**Critérios Obrigatórios:**
- [ ] Rota adicionada em `src/App.tsx`
- [ ] Path correto definido
- [ ] Componente correto importado
- [ ] Layout apropriado aplicado (AdminLayout, DashboardLayout, etc)
- [ ] Proteção de rota implementada (se necessário)
- [ ] Link adicionado no menu apropriado
- [ ] Navegação funcionando

**Teste Obrigatório:**
```
1. Acessar URL diretamente no navegador
2. Verificar que página carrega
3. Clicar no link do menu
4. Verificar que navegação funciona
5. Testar permissões (tentar acessar sem permissão)
6. Documentar resultado
```

---

### ✅ Para Integrações e Fluxos:

**Critérios Obrigatórios:**
- [ ] Código de integração escrito
- [ ] Edge Functions atualizadas (se aplicável)
- [ ] Webhooks configurados (se aplicável)
- [ ] **Fluxo completo testado end-to-end**
- [ ] Dados persistindo no banco de dados
- [ ] Notificações/Emails enviados (se aplicável)
- [ ] Logs de erro verificados

**Teste Obrigatório:**
```
1. Executar fluxo completo do início ao fim
2. Verificar cada etapa do processo
3. Confirmar dados no banco via SQL ou Supabase Dashboard
4. Verificar logs de Edge Functions
5. Testar cenários de erro
6. Documentar resultado completo
```

---

### ✅ Para Migrações de Banco de Dados:

**Critérios Obrigatórios:**
- [ ] Arquivo de migração criado em `supabase/migrations/`
- [ ] SQL validado e testado
- [ ] **Migração executada MANUALMENTE no Supabase**
- [ ] Tabelas/colunas criadas verificadas
- [ ] Índices criados verificados
- [ ] Políticas RLS criadas e testadas
- [ ] Tipos TypeScript atualizados em `types.ts`

**Teste Obrigatório:**
```
1. Executar migração no Supabase Dashboard
2. Verificar que tabelas foram criadas (Table Editor)
3. Testar inserção de dados manualmente
4. Testar políticas RLS com diferentes usuários
5. Verificar que tipos TypeScript estão corretos
6. Documentar resultado
```

---

## 🎯 PROCESSO DE EXECUÇÃO DE TAREFAS

### **ANTES de iniciar uma tarefa:**
1. Ler completamente a descrição da tarefa
2. Identificar todas as dependências
3. Verificar que tarefas anteriores estão realmente completas
4. Planejar os passos de implementação E integração

### **DURANTE a execução:**
1. Criar o código
2. **IMEDIATAMENTE integrar** (adicionar rotas, links, imports)
3. Testar localmente
4. Documentar o que foi feito

### **APÓS a execução:**
1. Executar checklist apropriado
2. Realizar teste obrigatório
3. Documentar resultado do teste
4. **SOLICITAR VALIDAÇÃO DO USUÁRIO**
5. **SÓ ENTÃO** marcar como concluída

---

## 📊 RELATÓRIO OBRIGATÓRIO POR TAREFA

Após cada tarefa, fornecer:

```markdown
## ✅ Tarefa X.X - [Nome da Tarefa]

### 📝 O que foi implementado:
- Arquivos criados: 
  - [caminho/arquivo1.tsx]
  - [caminho/arquivo2.ts]
- Arquivos modificados:
  - [caminho/arquivo3.tsx] - Adicionado import e uso do componente
  - [App.tsx] - Adicionada rota /admin/exemplo
  - [DashboardSidebar.tsx] - Adicionado link no menu

### 🔗 Integrações realizadas:
- ✅ Rota adicionada: /admin/exemplo
- ✅ Link no menu: Seção "Administração" > "Exemplo"
- ✅ Componente importado em: [página pai]
- ✅ Hook importado em: [componentes]

### 🧪 Teste Realizado:
**Passos:**
1. [passo 1]
2. [passo 2]
3. [passo 3]

**Resultado:**
- ✅ Página acessível via menu
- ✅ Componente renderizando
- ✅ Dados carregando corretamente
- ⚠️ [problemas encontrados, se houver]

### 📸 Evidência:
[Descrição do que foi visto/testado]

### ⏭️ Próximos Passos:
[Se houver dependências ou tarefas relacionadas]

### 🎯 Status: AGUARDANDO SUA VALIDAÇÃO
Por favor, teste acessando [URL] e confirme se está funcionando.
```

---

## 🛑 CHECKPOINTS DE VALIDAÇÃO

### **A cada 3-5 tarefas relacionadas:**

```markdown
## 🛑 CHECKPOINT DE VALIDAÇÃO

### Tarefas Executadas:
- [x] X.1 - [nome]
- [x] X.2 - [nome]
- [x] X.3 - [nome]

### Funcionalidades para Testar:
1. [Funcionalidade 1]: Acesse [URL] e verifique [comportamento]
2. [Funcionalidade 2]: Clique em [botão] e verifique [resultado]
3. [Funcionalidade 3]: Teste [fluxo] e confirme [dados]

### ⚠️ AGUARDANDO SUA VALIDAÇÃO
Por favor, teste as funcionalidades acima e confirme:
- [ ] Tudo funcionando conforme esperado
- [ ] Problemas encontrados: [descrever]

**NÃO prosseguirei para as próximas tarefas até receber sua confirmação.**
```

---

## 🔄 PROCESSO DE REVISÃO DE SPEC

### **Ao revisar uma spec existente:**

1. **Ler todas as tarefas marcadas como [x]**
2. **Para cada tarefa, verificar:**
   - Arquivos foram criados? ✅/❌
   - Integrações foram feitas? ✅/❌
   - Funcionalidade está acessível? ✅/❌
   - Foi testada? ✅/❌

3. **Criar relatório de status real:**
```markdown
## Tarefa X.X - [Nome]
- Status no arquivo: [x] Concluída
- Status real: ⚠️ PARCIALMENTE CONCLUÍDA
- O que foi feito: [lista]
- O que está faltando: [lista]
- Ação necessária: [descrição]
```

4. **Atualizar tasks.md com status real:**
   - Desmarcar tarefas incompletas: [x] → [ ]
   - Adicionar nota de pendência
   - Criar lista de correções necessárias

---

## 📋 TEMPLATE DE PLANO DE CORREÇÃO

Quando identificar tarefas incompletas:

```markdown
# 🔧 PLANO DE CORREÇÃO - [Nome da Spec]

## 📊 Resumo da Situação
- Total de tarefas: X
- Marcadas como concluídas: Y
- Realmente concluídas: Z
- Necessitam correção: Y-Z

## ❌ Tarefas Incompletas Identificadas

### Tarefa X.X - [Nome]
**Status Atual:** Parcialmente concluída
**O que foi feito:**
- ✅ [item 1]
- ✅ [item 2]

**O que está faltando:**
- ❌ [item 3]
- ❌ [item 4]

**Impacto:** [descrição do impacto]
**Prioridade:** Alta/Média/Baixa

---

## 🎯 Plano de Ação

### Fase 1: Correções Críticas (Prioridade Alta)
1. [ ] Corrigir tarefa X.X
   - Adicionar rota em App.tsx
   - Adicionar link em DashboardSidebar.tsx
   - Testar navegação
   - **Checkpoint:** Validar com usuário

2. [ ] Corrigir tarefa Y.Y
   - [ações necessárias]
   - **Checkpoint:** Validar com usuário

### Fase 2: Correções Importantes (Prioridade Média)
[...]

### Fase 3: Melhorias (Prioridade Baixa)
[...]

## ✅ Critérios de Conclusão
- [ ] Todas as funcionalidades acessíveis via interface
- [ ] Todos os fluxos testados end-to-end
- [ ] Usuário validou cada grupo de correções
- [ ] Documentação atualizada
- [ ] Tasks.md reflete status real
```

---

## 🎓 LIÇÕES APRENDIDAS

### **Erros Comuns a Evitar:**

1. ❌ **Marcar tarefa como concluída apenas porque arquivo foi criado**
   - ✅ Correto: Marcar apenas quando funcionalidade está operacional

2. ❌ **Assumir que integração "deve funcionar"**
   - ✅ Correto: Testar navegação e acesso via interface

3. ❌ **Ignorar tarefas de teste marcadas como opcionais**
   - ✅ Correto: Consultar usuário sobre importância de testes

4. ❌ **Não documentar o que foi testado**
   - ✅ Correto: Sempre documentar passos e resultados de testes

5. ❌ **Prosseguir sem validação do usuário**
   - ✅ Correto: Aguardar confirmação antes de continuar

---

## 🔐 COMPROMISSO DE QUALIDADE

**Eu, como agente de desenvolvimento, me comprometo a:**

1. ✅ Seguir este protocolo rigorosamente
2. ✅ Nunca marcar tarefa como concluída sem validação
3. ✅ Sempre integrar código no sistema (rotas, links, imports)
4. ✅ Sempre testar funcionalidades manualmente
5. ✅ Sempre documentar testes realizados
6. ✅ Sempre solicitar validação do usuário
7. ✅ Ser transparente sobre o que foi e não foi feito
8. ✅ Priorizar qualidade sobre velocidade

**Este protocolo é OBRIGATÓRIO e NÃO NEGOCIÁVEL.**

---

## 📞 QUANDO SOLICITAR AJUDA DO USUÁRIO

**Sempre perguntar ao usuário quando:**
- Não tiver certeza se tarefa opcional deve ser executada
- Encontrar conflito entre requisitos
- Precisar de credenciais ou configurações externas
- Identificar problema que impede conclusão da tarefa
- Precisar de validação de abordagem técnica
- Houver múltiplas formas de implementar algo

**NUNCA assumir. SEMPRE perguntar.**

---

## 🎯 OBJETIVO FINAL

**Garantir que cada tarefa marcada como concluída [x] representa:**
- ✅ Código escrito e integrado
- ✅ Funcionalidade acessível e operacional
- ✅ Teste realizado e documentado
- ✅ Usuário validou e confirmou

**Qualidade > Velocidade**
**Transparência > Aparência de progresso**
**Validação > Suposição**
