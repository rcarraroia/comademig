# Implementation Plan - Auditoria Completa do Sistema de Pagamentos

## ⚠️ IMPORTANTE: Esta é uma auditoria de ANÁLISE APENAS
- Nenhuma alteração será feita no código, banco de dados ou configurações
- Todas as tarefas são de análise, documentação e diagnóstico
- O resultado final será o relatório AUDITORIA_SISTEMA_PAGAMENTOS.md

---

- [x] 1. Preparação e Setup Inicial


  - Criar estrutura de diretórios para armazenar análises temporárias
  - Extrair credenciais do Supabase de `src/integrations/supabase/client.ts`
  - Criar script Python base para conexão com Supabase (somente leitura)
  - Testar conectividade com banco de dados
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1_


- [x] 2. Análise de Banco de Dados - Estado Atual


  - Criar script Python completo para análise de todas as tabelas críticas
  - Executar análise de `user_subscriptions` (estrutura, contagem, amostras)
  - Executar análise de `profiles` (relacionamento com subscriptions)
  - Executar análise de `member_types` e `subscription_plans`
  - Executar análise de `asaas_cobrancas` (estrutura e dados)
  - Executar análise de `asaas_splits` (se existir)
  - Executar análise de `affiliates` (se existir)
  - Executar análise de `solicitacoes_certidoes` (se existir)
  - Documentar estrutura real vs esperada de cada tabela
  - Identificar usuários de teste e seus status atuais
  - _Requirements: 1.1, 2.1, 5.2, 6.3_

- [x] 3. Análise de Controle de Acesso - Middleware e Autenticação



  - Buscar e analisar arquivo de middleware de autenticação (`src/lib/auth/middleware.ts` ou similar)
  - Analisar `src/contexts/AuthContext.tsx` para verificação de status
  - Verificar hooks de autenticação (`src/hooks/useAuthState.ts`, `useSubscriptionStatus.ts`)
  - Buscar componente `ProtectedRoute` ou similar
  - Analisar `src/App.tsx` para verificar proteção de rotas
  - Identificar onde DEVERIA ter verificação de `user_subscriptions.status`
  - Documentar todos os pontos onde verificação está faltando
  - Criar matriz: "Onde está" vs "Onde deveria estar"
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 4. Análise de Políticas RLS



  - Buscar políticas RLS em arquivos de migração (`supabase/migrations/*.sql`)
  - Documentar políticas existentes para `user_subscriptions`
  - Documentar políticas existentes para `profiles`
  - Documentar políticas existentes para `certificates`
  - Documentar políticas existentes para `services` e tabelas relacionadas
  - Identificar se políticas verificam status de assinatura
  - Identificar políticas permissivas demais
  - Propor políticas RLS corretas (sem implementar)
  - _Requirements: 1.3_

- [x] 5. Análise de Dashboard e Componentes Protegidos


  - Analisar `src/pages/Dashboard.tsx` para verificação de status
  - Analisar `src/pages/dashboard/*` para proteções individuais
  - Analisar `src/components/layout/DashboardLayout.tsx`
  - Analisar `src/components/dashboard/DashboardSidebar.tsx`
  - Verificar se há bloqueio de funcionalidades baseado em status
  - Identificar componentes que deveriam verificar status mas não verificam
  - Documentar fluxo de renderização do dashboard
  - _Requirements: 1.5_

- [x] 6. Análise Completa do Fluxo de Filiação

  - Analisar `src/hooks/useFiliacaoPayment.ts` linha por linha
  - Mapear passo 1: Criação de usuário Auth (qual função, qual status inicial)
  - Mapear passo 2: Criação de profile (campos, relacionamentos)
  - Mapear passo 3: Criação de cliente Asaas (API call, resposta)
  - Mapear passo 4: Criação de assinatura Asaas (status inicial retornado)
  - Mapear passo 5: Criação de `user_subscription` (qual status é gravado no BD)
  - Mapear passo 6: Redirecionamento do usuário (para qual página)
  - Identificar quando status muda de PENDING para ACTIVE
  - Criar diagrama de sequência completo do fluxo
  - _Requirements: 2.1_

- [x] 7. Análise de Webhook de Confirmação de Pagamento

  - Analisar `supabase/functions/asaas-webhook/index.ts` completamente
  - Identificar quais eventos do Asaas são tratados
  - Identificar qual evento específico confirma pagamento de filiação
  - Verificar o que o webhook atualiza no banco de dados
  - Verificar se `user_subscriptions.status` é atualizado pelo webhook
  - Verificar se há notificação ao usuário após confirmação
  - Verificar logs de webhook no Supabase (se possível via análise de código)
  - Identificar se webhook está recebendo eventos (verificar configuração)
  - Documentar gaps no tratamento de webhook
  - _Requirements: 2.2_

- [x] 8. Criar Matriz Status vs Acesso


  - Documentar para status PENDING: deveria ter acesso? tem acesso atualmente?
  - Documentar para status ACTIVE: deveria ter acesso? tem acesso atualmente?
  - Documentar para status PAST_DUE: deveria ter acesso? tem acesso atualmente?
  - Documentar para status CANCELED: deveria ter acesso? tem acesso atualmente?
  - Documentar para status SUSPENDED: deveria ter acesso? tem acesso atualmente?
  - Identificar inconsistências entre expectativa e realidade
  - Propor lógica correta de controle de acesso
  - _Requirements: 2.3_

- [x] 9. Análise de Sistema de Renovação Automática


  - Verificar se assinatura no Asaas é configurada como recorrente
  - Buscar configuração de cobrança automática no código
  - Verificar como sistema detecta falha de pagamento
  - Verificar se webhook de falha de pagamento está configurado
  - Analisar tratamento de evento de falha no webhook
  - Documentar fluxo completo de renovação
  - _Requirements: 3.1_

- [x] 10. Análise de Tratamento de Falha de Pagamento


  - Buscar triggers relacionados a `user_subscriptions` no banco
  - Buscar Edge Function de verificação de expiração (`check-expired-subscriptions` ou similar)
  - Verificar se campo `expires_at` é usado para controle
  - Verificar se existe job agendado (cron) para verificar expirações
  - Documentar o que acontece quando pagamento falha
  - Verificar se status muda automaticamente
  - Verificar se há tentativa de recobrança
  - Verificar se usuário é notificado
  - Verificar se acesso é bloqueado imediatamente
  - Identificar gap entre falha e bloqueio de acesso
  - _Requirements: 3.2, 3.3_

- [x] 11. Análise de Interface de Pagamento para Membros


  - Buscar páginas: `src/pages/*Payment*`, `src/pages/*Subscription*`, `src/pages/*Billing*`
  - Buscar componentes: `src/components/*Payment*`, `src/components/*Subscription*`
  - Verificar rotas em `src/App.tsx` relacionadas a pagamento
  - Verificar links no `DashboardSidebar` para área de pagamentos
  - Documentar funcionalidades existentes (se houver)
  - Documentar funcionalidades faltantes
  - Propor estrutura de interface completa para gerenciamento de assinatura
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 12. Análise de Fluxo de Pagamento de Serviços


  - Analisar `src/pages/Services.tsx` ou similar
  - Analisar componentes em `src/components/certidoes/*`
  - Mapear como usuário solicita certidão/regularização
  - Verificar como valor é calculado
  - Verificar se cria cobrança no Asaas
  - Verificar integração com sistema de split
  - Mapear relacionamento entre status do serviço e status do pagamento
  - Criar diagrama de sequência do fluxo
  - _Requirements: 5.1_

- [x] 13. Análise de Tabelas de Serviços e Cobranças


  - Verificar estrutura de tabela `services` ou `solicitacoes_certidoes`
  - Verificar estrutura de tabela `service_requests` (se existir)
  - Verificar relacionamento com `asaas_cobrancas`
  - Verificar integridade referencial entre tabelas
  - Identificar registros órfãos ou inconsistências
  - Documentar modelo de dados completo
  - _Requirements: 5.2_

- [x] 14. Análise de Edge Functions de Pagamento de Serviços

  - Buscar Edge Function `asaas-create-service-payment` ou similar
  - Buscar Edge Function `asaas-process-service-payment` ou similar
  - Analisar lógica de criação de cobrança
  - Verificar se split é configurado para serviços
  - Verificar tratamento de webhook para pagamentos de serviços
  - Documentar gaps de implementação
  - _Requirements: 5.3_

- [x] 15. Análise de Integração de Split com Filiação

  - Verificar em `src/hooks/useFiliacaoPayment.ts` se há chamada para `asaas-configure-split`
  - Verificar se split é configurado após criação de assinatura
  - Verificar se afiliado é vinculado à filiação
  - Documentar se integração existe ou está faltando
  - _Requirements: 6.1_

- [x] 16. Análise de Integração de Split com Serviços

  - Verificar em código de solicitação de certidões se split é configurado
  - Verificar em código de regularizações se split é configurado
  - Verificar em pagamentos avulsos se split é configurado
  - Documentar para cada tipo de transação se split está implementado
  - _Requirements: 6.2_

- [x] 17. Análise de Tabela asaas_splits e Relacionamentos

  - Verificar estrutura completa da tabela `asaas_splits`
  - Verificar relacionamento com `asaas_cobrancas` (FK existe?)
  - Verificar relacionamento com `user_subscriptions` (se aplicável)
  - Verificar relacionamento com `services` (se aplicável)
  - Verificar dados reais na tabela (amostras)
  - Documentar modelo de dados completo
  - _Requirements: 6.3_

- [x] 18. Análise de Sistema de Afiliados

  - Verificar se tabela `affiliates` existe no banco
  - Verificar se campo `asaas_wallet_id` existe
  - Buscar código de vinculação de afiliado à filiação
  - Buscar código de cálculo de comissão
  - Buscar páginas/componentes de área de afiliados
  - Documentar sistema completo de afiliados
  - Identificar gaps de implementação
  - _Requirements: 6.4_

- [x] 19. Análise de Método de Pagamento PIX

  - Buscar Edge Function `asaas-create-pix-payment` ou similar
  - Verificar geração de QR Code (código e biblioteca usada)
  - Verificar configuração de expiração do PIX
  - Verificar tratamento de webhook de confirmação PIX
  - Analisar fluxo completo no frontend (componentes e hooks)
  - Buscar componentes: `PixPayment.tsx`, `QRCodeDisplay.tsx`
  - Buscar hooks: `usePixPayment.ts`
  - Documentar fluxo completo e problemas identificados
  - _Requirements: 7.1_

- [x] 20. Análise de Método de Pagamento Cartão de Crédito

  - Buscar Edge Function `asaas-process-credit-card` ou similar
  - Verificar implementação de tokenização
  - Verificar se dados sensíveis não trafegam pelo frontend
  - Verificar tratamento de webhook de confirmação
  - Verificar tratamento de erro de autorização
  - Verificar suporte a parcelamento
  - Buscar componentes: `CreditCardForm.tsx`
  - Buscar hooks: `useCreditCardPayment.ts`
  - Documentar fluxo completo e problemas identificados
  - _Requirements: 7.1_

- [x] 21. Análise de Método de Pagamento Boleto

  - Buscar Edge Function `asaas-create-boleto` ou similar
  - Verificar geração de boleto
  - Verificar configuração de prazo de vencimento
  - Verificar tratamento de webhook de confirmação
  - Verificar tratamento de expiração de boleto
  - Verificar link para download do boleto
  - Buscar componentes: `BoletoPayment.tsx`
  - Documentar fluxo completo e problemas identificados
  - _Requirements: 7.1_

- [x] 22. Análise Comparativa de Métodos de Pagamento

  - Comparar consistência de implementação entre PIX, Cartão e Boleto
  - Comparar tratamento de erros entre métodos
  - Comparar experiência do usuário entre métodos
  - Identificar inconsistências e gaps
  - Propor padronização (sem implementar)
  - _Requirements: 7.1_

- [x] 23. Consolidação de Análises - Parte 1 (Controle de Acesso)

  - Consolidar todas as análises de controle de acesso
  - Criar seção completa no relatório: "1. Controle de Acesso e Autenticação"
  - Incluir: Estado Atual, Estado Esperado, Problemas Identificados, Impacto, Proposta de Solução
  - Adicionar diagramas relevantes
  - _Requirements: 8.2_

- [x] 24. Consolidação de Análises - Parte 2 (Fluxo de Filiação)

  - Consolidar todas as análises de fluxo de filiação
  - Criar seção completa no relatório: "2. Fluxo de Filiação e Primeiro Pagamento"
  - Incluir: Mapeamento do Fluxo, Análise de Gaps, Webhook, Matriz Status vs Acesso, Proposta
  - Adicionar diagrama de sequência completo
  - _Requirements: 8.2_

- [x] 25. Consolidação de Análises - Parte 3 (Pagamentos Recorrentes)

  - Consolidar todas as análises de renovação e falhas
  - Criar seção completa no relatório: "3. Pagamentos Recorrentes e Renovação"
  - Incluir: Sistema Atual, Tratamento de Falhas, Gaps, Proposta de Implementação
  - _Requirements: 8.2_

- [x] 26. Consolidação de Análises - Parte 4 (Interface de Pagamento)

  - Consolidar análise de interface para membros
  - Criar seção completa no relatório: "4. Módulo de Pagamento para Membros"
  - Incluir: Estado Atual, Funcionalidades Faltantes, Proposta de Interface
  - Adicionar mockup conceitual se aplicável
  - _Requirements: 8.2_

- [x] 27. Consolidação de Análises - Parte 5 (Pagamentos de Serviços)

  - Consolidar todas as análises de pagamento de serviços
  - Criar seção completa no relatório: "5. Pagamentos de Serviços"
  - Incluir: Fluxo Atual, Integração com Asaas, Problemas, Proposta de Correção
  - Adicionar diagrama de fluxo
  - _Requirements: 8.2_

- [x] 28. Consolidação de Análises - Parte 6 (Sistema de Split)

  - Consolidar todas as análises de split e afiliados
  - Criar seção completa no relatório: "6. Sistema de Split de Pagamentos"
  - Incluir: Status Atual, Integração com Transações, Programa de Afiliados, Gaps
  - Complementar relatório existente (RELATORIO_SISTEMA_SPLIT.md)
  - _Requirements: 8.2_

- [x] 29. Consolidação de Análises - Parte 7 (Métodos de Pagamento)

  - Consolidar todas as análises de métodos de pagamento
  - Criar seção completa no relatório: "7. Métodos de Pagamento"
  - Incluir subseções: PIX, Cartão de Crédito, Boleto, Análise Comparativa
  - Adicionar matriz de funcionalidades por método
  - _Requirements: 8.2_

- [x] 30. Criar Sumário Executivo

  - Resumir os 3-5 problemas mais críticos identificados
  - Criar matriz de riscos (Probabilidade x Impacto)
  - Listar recomendações prioritárias (top 5)
  - Adicionar estatísticas gerais da auditoria
  - _Requirements: 8.1_

- [x] 31. Criar Roadmap de Correções

  - Classificar todos os problemas por prioridade (Crítico, Alto, Médio, Baixo)
  - Criar Fase 1: Correções Críticas (Imediato - 1-2 semanas)
  - Criar Fase 2: Correções de Alta Prioridade (Curto Prazo - 3-4 semanas)
  - Criar Fase 3: Correções de Média Prioridade (Médio Prazo - 1-2 meses)
  - Criar Fase 4: Melhorias de Baixa Prioridade (Longo Prazo - 3+ meses)
  - Estimar esforço para cada fase
  - _Requirements: 8.4_

- [x] 32. Criar Anexos do Relatório

  - Anexo A: Todos os diagramas de fluxo em Mermaid
  - Anexo B: Estrutura detalhada de todas as tabelas analisadas
  - Anexo C: Trechos de código relevantes com comentários
  - Anexo D: Checklist de implementação para desenvolvedores
  - _Requirements: 8.5_

- [x] 33. Análise Completa de TODAS as Edge Functions

  - Listar TODAS as Edge Functions em `supabase/functions/`
  - Para cada Edge Function documentar: nome, localização, responsabilidade
  - Para cada Edge Function documentar: parâmetros de entrada esperados
  - Para cada Edge Function documentar: resposta retornada
  - Para cada Edge Function identificar: onde é chamada no frontend
  - Para cada Edge Function verificar: variáveis de ambiente necessárias
  - Para cada Edge Function buscar: logs de execução e erros
  - Criar tabela resumo de todas as Edge Functions
  - Identificar Edge Functions faltantes ou incompletas
  - _Requirements: 8.2_

- [x] 34. Análise Completa de Hooks Relacionados a Pagamento

  - Listar TODOS os hooks em `src/hooks/` relacionados a pagamento/assinatura
  - Analisar `useFiliacaoPayment.ts` (responsabilidade, estados, mutations)
  - Analisar `useAsaasCustomers.ts` (se existir)
  - Analisar `useSubscription.ts` ou similar (se existir)
  - Analisar `usePayment.ts` ou similar (se existir)
  - Para cada hook documentar: responsabilidade, estados gerenciados, queries/mutations
  - Para cada hook identificar: onde é usado no código
  - Identificar duplicação de código entre hooks
  - Propor refatoração se necessário (sem implementar)
  - _Requirements: 8.2_

- [x] 35. Análise Completa de Integração com Asaas

  - Verificar configuração completa: API Key, Base URL, Timeout, Retry
  - Listar TODOS os endpoints Asaas usados no sistema
  - Para cada endpoint documentar: método HTTP, parâmetros, resposta
  - Verificar configuração de webhook: URL, token de validação
  - Listar TODOS os eventos de webhook tratados
  - Analisar logs de webhook das últimas 24h (se possível via código)
  - Verificar tratamento de rate limiting
  - Verificar tratamento de erros da API Asaas
  - Criar tabela resumo de integração completa
  - _Requirements: 8.2_

- [x] 36. Análise de Testes Existentes

  - Buscar arquivos de teste: `*.test.ts`, `*.test.tsx`, `*.spec.ts`
  - Listar todos os testes relacionados a pagamento
  - Verificar cobertura de testes para hooks de pagamento
  - Verificar cobertura de testes para Edge Functions
  - Verificar cobertura de testes para componentes de pagamento
  - Identificar áreas críticas sem testes
  - Documentar qualidade dos testes existentes
  - Propor testes faltantes (sem implementar)
  - _Requirements: 8.2_

- [x] 37. Análise de Logs e Monitoramento

  - Verificar logs de Edge Functions no Supabase (últimas 24h se possível)
  - Identificar erros recorrentes em logs
  - Verificar logs de banco de dados (queries lentas, erros)
  - Verificar se há sistema de monitoramento configurado
  - Verificar se há alertas configurados para falhas críticas
  - Documentar padrões de erro identificados
  - Propor melhorias em logging e monitoramento
  - _Requirements: 8.2_

- [x] 38. Consolidação de Análises - Parte 8 (Edge Functions)

  - Consolidar análise completa de Edge Functions
  - Criar seção completa no relatório: "8. Edge Functions"
  - Incluir: Tabela resumo, Análise individual, Problemas, Propostas
  - _Requirements: 8.2_

- [x] 39. Consolidação de Análises - Parte 9 (Hooks e Lógica)

  - Consolidar análise de hooks
  - Criar seção completa no relatório: "9. Hooks e Lógica de Negócio"
  - Incluir: Lista de hooks, Análise individual, Duplicações, Propostas
  - _Requirements: 8.2_

- [x] 40. Consolidação de Análises - Parte 10 (Integração Asaas)

  - Consolidar análise de integração Asaas
  - Criar seção completa no relatório: "10. Integração com Asaas"
  - Incluir: Configuração, Endpoints, Webhook, Logs, Problemas, Propostas
  - _Requirements: 8.2_

- [x] 41. Consolidação de Análises - Parte 11 (Testes e Logs)

  - Consolidar análise de testes e logs
  - Criar seção completa no relatório: "11. Testes e Monitoramento"
  - Incluir: Cobertura atual, Testes faltantes, Logs, Monitoramento, Propostas
  - _Requirements: 8.2_

- [x] 42. Revisão Final com Checklist Completo

  - Verificar se TODOS os 15 itens da solicitação original foram cobertos
  - ✅ 1. Controle de Acesso e Autenticação
  - ✅ 2. Fluxo de Filiação e Primeiro Pagamento
  - ✅ 3. Pagamentos Recorrentes e Renovação
  - ✅ 4. Módulo de Pagamento para Membros
  - ✅ 5. Pagamentos de Serviços
  - ✅ 6. Sistema de Split de Pagamentos
  - ✅ 7. Métodos de Pagamento
  - ✅ 8. Edge Functions (análise completa)
  - ✅ 9. Banco de Dados (estrutura e dados)
  - ✅ 10. Políticas RLS
  - ✅ 11. Frontend (componentes e rotas)
  - ✅ 12. Hooks (análise completa)
  - ✅ 13. Integração Asaas (completa)
  - ✅ 14. Testes (cobertura e gaps)
  - ✅ 15. Logs e Monitoramento
  - _Requirements: 8.6_

- [x] 43. Entrega Final do Relatório



  - Revisar relatório completo para consistência
  - Verificar se todas as perguntas críticas foram respondidas
  - Verificar formatação e legibilidade
  - Adicionar índice/sumário navegável
  - Salvar relatório final como `AUDITORIA_SISTEMA_PAGAMENTOS.md`
  - _Requirements: 8.6_

---

## 📊 Resumo de Tarefas

**Total de Tarefas:** 43
**Tarefas de Análise:** 32 (tarefas 1-22, 33-37)
**Tarefas de Consolidação:** 11 (tarefas 23-29, 38-41)
**Tarefas de Relatório Final:** 2 (tarefas 42-43)

**Estimativa de Tempo:** 8-10 horas de trabalho focado

## ⚠️ Lembrete Final

Esta é uma auditoria de **ANÁLISE APENAS**. Nenhuma das tarefas envolve:
- ❌ Alterar código
- ❌ Modificar banco de dados
- ❌ Criar/atualizar políticas RLS
- ❌ Modificar Edge Functions
- ❌ Fazer commits ou push

Todas as tarefas são de:
- ✅ Leitura e análise
- ✅ Documentação
- ✅ Diagnóstico
- ✅ Proposta de soluções (sem implementar)
