# 📅 CRONOGRAMA DE FINALIZAÇÃO - SISTEMA COMADEMIG

**Data de Criação:** 16 de Janeiro de 2026  
**Projeto:** COMADEMIG - Sistema de Gestão  
**Baseado em:** Relatório de Auditoria Completa

---

## 🎯 OBJETIVO

Finalizar as funcionalidades pendentes do sistema COMADEMIG, priorizando as tarefas críticas que impactam diretamente a operação e experiência do usuário.

**Tempo Total Estimado:** 2-3 semanas (80-120 horas)

---

## 🔴 FASE 1: TAREFAS CRÍTICAS (Semana 1)

### **Prioridade MÁXIMA - Impacto Direto na Operação**

---

### ✅ **Tarefa 1.1: Remover Dados Mockados do Sistema**
**Tempo Estimado:** 4 horas  
**Prioridade:** 🔴 CRÍTICA  
**Impacto:** Alto - Sistema mostrando dados falsos

**Descrição:**
Substituir todos os dados mockados por queries reais ao Supabase.

**Arquivos Afetados:**
- `src/pages/admin/UserManagement.tsx` (linha 65 - mockUsers)
- Verificar outros componentes com mock

**Checklist:**
- [ ] Identificar todos os `mockData` no código
- [ ] Substituir por queries reais usando React Query
- [ ] Implementar loading states
- [ ] Implementar tratamento de erros
- [ ] Testar com dados reais do banco
- [ ] Validar paginação se necessário

**Critério de Conclusão:**
- ✅ Nenhum dado mockado no sistema
- ✅ Todas as listagens usando dados reais
- ✅ Loading e error states funcionando

---

### ✅ **Tarefa 1.2: Consolidar Sistema Financeiro**
**Tempo Estimado:** 8 horas  
**Prioridade:** 🔴 CRÍTICA  
**Impacto:** Alto - Múltiplas tabelas causando confusão

**Descrição:**
Definir e consolidar a estrutura financeira do sistema.

**Problema Identificado:**
- 3 tabelas financeiras: `payment_transactions`, `financial_transactions`, `asaas_cobrancas`
- Possível duplicação de dados
- Relatórios podem estar inconsistentes

**Checklist:**
- [ ] Analisar uso de cada tabela no código
- [ ] Definir tabela principal (recomendado: `asaas_cobrancas`)
- [ ] Migrar/consolidar dados se necessário
- [ ] Atualizar queries no frontend
- [ ] Atualizar Edge Functions
- [ ] Testar relatórios financeiros
- [ ] Documentar estrutura final

**Critério de Conclusão:**
- ✅ Uma única fonte de verdade para transações
- ✅ Relatórios financeiros precisos
- ✅ Dashboard financeiro funcional

---

### ✅ **Tarefa 1.3: Testar Fluxo Completo de Filiação**
**Tempo Estimado:** 6 horas  
**Prioridade:** 🔴 CRÍTICA  
**Impacto:** Alto - Funcionalidade principal do sistema

**Descrição:**
Validar todo o fluxo de filiação end-to-end com dados reais.

**Fluxo a Testar:**
1. Cadastro de novo usuário
2. Seleção de tipo de membro
3. Escolha de plano (mensal/semestral/anual)
4. Pagamento (PIX/Cartão/Boleto)
5. Webhook do Asaas
6. Ativação da assinatura
7. Geração de carteira digital
8. Split de comissões (se houver afiliado)

**Checklist:**
- [ ] Testar cadastro completo
- [ ] Testar pagamento PIX
- [ ] Testar pagamento com cartão
- [ ] Testar pagamento com boleto
- [ ] Validar recebimento de webhook
- [ ] Verificar ativação de assinatura
- [ ] Confirmar geração de carteira
- [ ] Testar splits de afiliados
- [ ] Documentar problemas encontrados
- [ ] Corrigir bugs identificados

**Critério de Conclusão:**
- ✅ Fluxo completo funciona sem erros
- ✅ Webhooks processados corretamente
- ✅ Assinatura ativada automaticamente
- ✅ Carteira gerada com sucesso

---

### ✅ **Tarefa 1.4: Implementar Sistema de Logs e Auditoria**
**Tempo Estimado:** 6 horas  
**Prioridade:** 🔴 CRÍTICA  
**Impacto:** Alto - Essencial para debugging e segurança

**Descrição:**
Ativar e popular as tabelas de auditoria do sistema.

**Tabelas Envolvidas:**
- `audit_logs` (ações administrativas)
- `user_activity_log` (ações de usuários)
- `system_logs` (logs de sistema)
- `security_events` (eventos de segurança)

**Checklist:**
- [ ] Criar triggers para popular `audit_logs`
- [ ] Implementar logging em Edge Functions
- [ ] Adicionar logs em ações críticas (pagamentos, alterações)
- [ ] Criar página de visualização de logs (admin)
- [ ] Implementar filtros e busca
- [ ] Testar com ações reais
- [ ] Configurar retenção de logs

**Critério de Conclusão:**
- ✅ Todas as ações críticas sendo logadas
- ✅ Dashboard de logs funcional
- ✅ Filtros e busca operacionais

---

## 🟡 FASE 2: TAREFAS IMPORTANTES (Semana 2)

### **Prioridade ALTA - Funcionalidades Essenciais**

---

### ✅ **Tarefa 2.1: Implementar Sistema de Mensagens**
**Tempo Estimado:** 10 horas  
**Prioridade:** 🟡 IMPORTANTE  
**Impacto:** Médio - Comunicação interna

**Descrição:**
Criar interface completa para envio e recebimento de mensagens.

**Funcionalidades:**
- Enviar mensagem para usuário específico
- Enviar mensagem broadcast (admin)
- Listar mensagens recebidas
- Marcar como lida
- Notificações em tempo real (opcional)

**Checklist:**
- [ ] Criar página de mensagens no dashboard
- [ ] Implementar formulário de envio
- [ ] Criar listagem de mensagens
- [ ] Implementar marcação de lida/não lida
- [ ] Adicionar contador de não lidas
- [ ] Implementar busca e filtros
- [ ] Testar envio e recebimento
- [ ] (Opcional) Adicionar notificações real-time

**Critério de Conclusão:**
- ✅ Usuários podem enviar/receber mensagens
- ✅ Admins podem enviar broadcasts
- ✅ Contador de não lidas funcional

---

### ✅ **Tarefa 2.2: Expandir Catálogo de Serviços**
**Tempo Estimado:** 4 horas  
**Prioridade:** 🟡 IMPORTANTE  
**Impacto:** Médio - Mais opções para usuários

**Descrição:**
Cadastrar todos os serviços oferecidos pela COMADEMIG.

**Serviços Atuais:**
- ✅ Certidão teste (R$ 29,00)
- ✅ Solicitar CNPJ (R$ 59,00)

**Serviços a Adicionar:**
- [ ] Certidão de Regularidade
- [ ] Certidão de Filiação
- [ ] Certidão de Ordenação
- [ ] Regularização de Situação Cadastral
- [ ] Outros serviços conforme necessidade

**Checklist:**
- [ ] Levantar lista completa de serviços
- [ ] Definir valores e prazos
- [ ] Cadastrar via interface admin
- [ ] Configurar exigências de cada serviço
- [ ] Testar solicitação de cada serviço
- [ ] Validar fluxo de pagamento

**Critério de Conclusão:**
- ✅ Todos os serviços cadastrados
- ✅ Exigências configuradas
- ✅ Fluxo de solicitação testado

---

### ✅ **Tarefa 2.3: Implementar Sistema de Suporte/Tickets**
**Tempo Estimado:** 8 horas  
**Prioridade:** 🟡 IMPORTANTE  
**Impacto:** Médio - Atendimento ao usuário

**Descrição:**
Ativar e integrar o sistema de suporte com tickets.

**Estrutura Existente:**
- ✅ Tabelas criadas: `support_categories`, `support_tickets`, `support_messages`
- ❌ Interface não implementada

**Checklist:**
- [ ] Criar página de abertura de ticket (usuário)
- [ ] Criar página de listagem de tickets (usuário)
- [ ] Criar página de gerenciamento (admin)
- [ ] Implementar sistema de mensagens do ticket
- [ ] Adicionar categorias de suporte
- [ ] Implementar priorização
- [ ] Adicionar atribuição de tickets
- [ ] Testar fluxo completo

**Critério de Conclusão:**
- ✅ Usuários podem abrir tickets
- ✅ Admins podem responder e gerenciar
- ✅ Sistema de mensagens funcional

---

### ✅ **Tarefa 2.4: Ativar Carteira Digital**
**Tempo Estimado:** 6 horas  
**Prioridade:** 🟡 IMPORTANTE  
**Impacto:** Médio - Identificação digital

**Descrição:**
Implementar geração automática de carteira digital após filiação.

**Funcionalidades:**
- Geração automática após pagamento confirmado
- QR Code único
- Número de carteira único
- Validação pública via QR Code
- Download em PDF

**Checklist:**
- [ ] Implementar geração automática (webhook)
- [ ] Criar função de geração de QR Code
- [ ] Implementar geração de número único
- [ ] Criar template de PDF da carteira
- [ ] Implementar página de validação pública
- [ ] Testar geração após pagamento
- [ ] Testar validação via QR Code

**Critério de Conclusão:**
- ✅ Carteira gerada automaticamente
- ✅ QR Code funcional
- ✅ Validação pública operacional

---

## 🟢 FASE 3: MELHORIAS E OTIMIZAÇÕES (Semana 3)

### **Prioridade MÉDIA - Qualidade e Experiência**

---

### ✅ **Tarefa 3.1: Remover Tabelas Deprecated**
**Tempo Estimado:** 3 horas  
**Prioridade:** 🟢 MELHORIA  
**Impacto:** Baixo - Limpeza técnica

**Descrição:**
Remover tabelas obsoletas do banco de dados.

**Tabelas a Remover:**
1. `certidoes` (substituída por `solicitacoes_servicos`)
2. `solicitacoes_certidoes` (substituída por `solicitacoes_servicos`)
3. `solicitacoes_regularizacao` (substituída por `solicitacoes_servicos`)
4. `servicos_regularizacao` (substituída por `servicos`)
5. `valores_certidoes` (substituída por `servicos`)

**Checklist:**
- [ ] Verificar que não há dependências no código
- [ ] Fazer backup das tabelas
- [ ] Executar DROP TABLE via migração
- [ ] Validar que sistema continua funcional
- [ ] Documentar remoção

**Critério de Conclusão:**
- ✅ Tabelas removidas
- ✅ Sistema funcional
- ✅ Backup realizado

---

### ✅ **Tarefa 3.2: Implementar Sistema de Eventos Completo**
**Tempo Estimado:** 12 horas  
**Prioridade:** 🟢 MELHORIA  
**Impacto:** Médio - Funcionalidade adicional

**Descrição:**
Ativar sistema completo de eventos com inscrições e certificados.

**Funcionalidades:**
- Cadastro de eventos (admin)
- Inscrições de usuários
- Pagamento de inscrição
- Controle de presença (QR Code)
- Geração automática de certificados
- Validação pública de certificados

**Checklist:**
- [ ] Criar página de cadastro de eventos (admin)
- [ ] Criar página de listagem de eventos (público)
- [ ] Implementar sistema de inscrições
- [ ] Integrar pagamento de inscrição
- [ ] Implementar controle de presença
- [ ] Criar geração de certificados
- [ ] Implementar validação pública
- [ ] Testar fluxo completo

**Critério de Conclusão:**
- ✅ Eventos podem ser cadastrados
- ✅ Usuários podem se inscrever
- ✅ Certificados gerados automaticamente

---

### ✅ **Tarefa 3.3: Dashboard de Analytics e Métricas**
**Tempo Estimado:** 8 horas  
**Prioridade:** 🟢 MELHORIA  
**Impacto:** Baixo - Gestão e análise

**Descrição:**
Criar dashboard com métricas e analytics do sistema.

**Métricas a Implementar:**
- Total de usuários ativos
- Filiações por mês
- Receita mensal/anual
- Serviços mais solicitados
- Taxa de conversão
- Gráficos de crescimento
- Comissões de afiliados

**Checklist:**
- [ ] Criar queries de métricas
- [ ] Implementar gráficos (Recharts)
- [ ] Criar cards de resumo
- [ ] Adicionar filtros de período
- [ ] Implementar exportação de relatórios
- [ ] Testar performance das queries
- [ ] Otimizar se necessário

**Critério de Conclusão:**
- ✅ Dashboard com métricas principais
- ✅ Gráficos funcionais
- ✅ Filtros operacionais

---

### ✅ **Tarefa 3.4: Otimização e Performance**
**Tempo Estimado:** 6 horas  
**Prioridade:** 🟢 MELHORIA  
**Impacto:** Médio - Experiência do usuário

**Descrição:**
Otimizar queries, adicionar índices e melhorar performance.

**Áreas de Foco:**
- Queries lentas
- Índices faltantes
- Cache de dados
- Lazy loading de imagens
- Code splitting

**Checklist:**
- [ ] Identificar queries lentas
- [ ] Adicionar índices necessários
- [ ] Implementar cache estratégico
- [ ] Otimizar imagens
- [ ] Implementar lazy loading
- [ ] Testar performance
- [ ] Medir melhorias

**Critério de Conclusão:**
- ✅ Queries otimizadas
- ✅ Índices adicionados
- ✅ Performance melhorada

---

## 📊 RESUMO DO CRONOGRAMA

| Fase | Período | Tarefas | Horas | Prioridade |
|------|---------|---------|-------|------------|
| **Fase 1** | Semana 1 | 4 tarefas | 24h | 🔴 CRÍTICA |
| **Fase 2** | Semana 2 | 4 tarefas | 28h | 🟡 IMPORTANTE |
| **Fase 3** | Semana 3 | 4 tarefas | 29h | 🟢 MELHORIA |
| **TOTAL** | 3 semanas | 12 tarefas | 81h | - |

---

## 🎯 MARCOS DE ENTREGA (MILESTONES)

### **Milestone 1: Sistema Operacional** (Fim da Semana 1)
- ✅ Sem dados mockados
- ✅ Sistema financeiro consolidado
- ✅ Fluxo de filiação testado
- ✅ Logs e auditoria ativos

**Critério:** Sistema pode ser usado em produção com confiança

---

### **Milestone 2: Funcionalidades Completas** (Fim da Semana 2)
- ✅ Sistema de mensagens funcional
- ✅ Catálogo de serviços completo
- ✅ Suporte via tickets operacional
- ✅ Carteira digital automática

**Critério:** Todas as funcionalidades essenciais disponíveis

---

### **Milestone 3: Sistema Otimizado** (Fim da Semana 3)
- ✅ Banco de dados limpo
- ✅ Sistema de eventos completo
- ✅ Dashboard de analytics
- ✅ Performance otimizada

**Critério:** Sistema polido e pronto para crescimento

---

## 📝 NOTAS IMPORTANTES

### **Dependências Identificadas:**
- Tarefa 1.3 depende de 1.2 (sistema financeiro consolidado)
- Tarefa 2.4 depende de 1.3 (fluxo de filiação testado)
- Tarefa 3.2 pode ser feita em paralelo com outras

### **Riscos e Mitigações:**
- **Risco:** Consolidação financeira pode revelar problemas
  - **Mitigação:** Fazer backup antes, testar extensivamente
  
- **Risco:** Webhooks do Asaas podem falhar
  - **Mitigação:** Implementar retry logic e logs detalhados

- **Risco:** Performance pode degradar com mais dados
  - **Mitigação:** Adicionar índices preventivamente

### **Recursos Necessários:**
- Acesso ao ambiente de produção
- Credenciais do Asaas (sandbox e produção)
- Tempo para testes manuais
- Validação do usuário em cada milestone

---

## ✅ CHECKLIST DE CONCLUSÃO GERAL

Ao final das 3 semanas, o sistema deve ter:

- [ ] ✅ Zero dados mockados
- [ ] ✅ Sistema financeiro consolidado e funcional
- [ ] ✅ Fluxo de filiação 100% testado
- [ ] ✅ Logs e auditoria ativos
- [ ] ✅ Sistema de mensagens operacional
- [ ] ✅ Catálogo completo de serviços
- [ ] ✅ Suporte via tickets funcional
- [ ] ✅ Carteira digital automática
- [ ] ✅ Banco de dados limpo (sem tabelas deprecated)
- [ ] ✅ Sistema de eventos completo
- [ ] ✅ Dashboard de analytics
- [ ] ✅ Performance otimizada

---

**Documento criado em:** 16/01/2026  
**Baseado em:** Relatório de Auditoria Completa  
**Próxima revisão:** Após conclusão de cada fase
