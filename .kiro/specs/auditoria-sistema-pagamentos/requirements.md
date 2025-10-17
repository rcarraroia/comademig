# Requirements Document - Auditoria Completa do Sistema de Pagamentos

## Introduction

Esta auditoria tem como objetivo realizar uma análise completa e detalhada do sistema de pagamentos do COMADEMIG, identificando problemas de segurança, lógica de negócio, gaps de implementação e mapeando todos os fluxos e relacionamentos entre componentes. O foco é **APENAS diagnóstico e documentação**, sem realizar nenhuma alteração no sistema.

O problema crítico reportado é que usuários com status `PENDING` têm acesso total às funcionalidades do sistema, quando deveriam ter acesso bloqueado até a confirmação do pagamento.

## Requirements

### Requirement 1: Análise de Controle de Acesso e Autenticação

**User Story:** Como auditor técnico, eu quero analisar completamente o sistema de controle de acesso, para que eu possa identificar por que usuários PENDING têm acesso total ao sistema.

#### Acceptance Criteria

1. WHEN analisando a tabela `user_subscriptions` THEN o sistema SHALL documentar o status atual de todos os usuários de teste, incluindo campos `status`, `started_at`, `expires_at`, e `asaas_subscription_id`

2. WHEN verificando middleware de autenticação THEN o sistema SHALL identificar se existe verificação de status da assinatura e onde está o guard de acesso

3. WHEN analisando políticas RLS THEN o sistema SHALL documentar TODAS as políticas de SELECT em tabelas críticas (`user_subscriptions`, `profiles`, `certificates`, `services`)

4. WHEN verificando rotas protegidas THEN o sistema SHALL identificar se existe componente `<ProtectedRoute>` ou similar e qual a lógica de proteção implementada

5. WHEN analisando Dashboard THEN o sistema SHALL verificar se há validação de status antes de renderizar componentes e onde deveria ter bloqueio

6. WHEN comparando com sistema de roles THEN o sistema SHALL documentar diferenças entre verificação de roles e verificação de status de assinatura

### Requirement 2: Análise do Fluxo de Filiação e Primeiro Pagamento

**User Story:** Como auditor técnico, eu quero mapear completamente o fluxo de filiação desde o cadastro até a confirmação de pagamento, para que eu possa identificar onde o controle de acesso falha.

#### Acceptance Criteria

1. WHEN analisando `useFiliacaoPayment.ts` THEN o sistema SHALL mapear passo a passo todo o fluxo: criação de usuário Auth, criação de profile, criação de cliente Asaas, criação de assinatura Asaas, criação de user_subscription, redirecionamento, e mudança de status

2. WHEN verificando webhook de confirmação THEN o sistema SHALL documentar qual evento confirma pagamento, o que o webhook atualiza no BD, se status é atualizado, se há notificação ao usuário, e se webhook está recebendo eventos

3. WHEN analisando matriz de status vs acesso THEN o sistema SHALL documentar para cada status (PENDING, ACTIVE, PAST_DUE, CANCELED, SUSPENDED) se deveria ter acesso e se tem acesso atualmente

4. WHEN mapeando fluxo completo THEN o sistema SHALL documentar código e linha de cada etapa, status inicial após filiação, funcionamento do webhook, e onde deveria ter bloqueio

### Requirement 3: Análise de Pagamentos Recorrentes e Renovação

**User Story:** Como auditor técnico, eu quero analisar o sistema de renovação automática e tratamento de falhas de pagamento, para que eu possa identificar se há bloqueio de acesso quando pagamentos falham.

#### Acceptance Criteria

1. WHEN verificando sistema de renovação THEN o sistema SHALL documentar se assinatura no Asaas é recorrente, se há cobrança automática configurada, como detectar falha de pagamento, e se webhook de falha está configurado

2. WHEN analisando tratamento de falha THEN o sistema SHALL verificar se existe trigger para atualizar status, job agendado para verificar expiração, e se campo `expires_at` é usado

3. WHEN documentando ações após falha THEN o sistema SHALL identificar o que acontece quando pagamento falha, se status muda automaticamente, se há tentativa de recobrança, se usuário é notificado, e se acesso é bloqueado

4. WHEN analisando gaps THEN o sistema SHALL documentar lógica de renovação automática, tratamento de falha, sistema de retry, notificação ao usuário, e gap entre falha e bloqueio

### Requirement 4: Análise do Módulo de Pagamento para Membros

**User Story:** Como auditor técnico, eu quero verificar se existe interface para membros gerenciarem suas assinaturas e pagamentos, para que eu possa documentar funcionalidades existentes e faltantes.

#### Acceptance Criteria

1. WHEN buscando arquivos relacionados THEN o sistema SHALL verificar existência de páginas em `src/pages/*Payment*`, `src/pages/*Subscription*`, `src/components/*Payment*`, e rotas no `App.tsx`

2. IF módulo NÃO existe THEN o sistema SHALL documentar o que seria necessário: página de gerenciamento, opção de pagar fatura pendente, opção de trocar método de pagamento, histórico de pagamentos, e status da assinatura

3. IF módulo existe THEN o sistema SHALL documentar onde está, o que funciona, o que falta, e como está o UX/fluxo

4. WHEN finalizando análise THEN o sistema SHALL propor implementação se não existir ou melhorias se existir

### Requirement 5: Análise de Pagamentos de Serviços

**User Story:** Como auditor técnico, eu quero analisar o fluxo completo de solicitação e pagamento de serviços (certidões e regularizações), para que eu possa identificar problemas de integração e gaps de implementação.

#### Acceptance Criteria

1. WHEN analisando fluxo de solicitação THEN o sistema SHALL mapear como usuário solicita serviço, como valor é calculado, se cria cobrança no Asaas, integração com split, e status do serviço vs pagamento

2. WHEN verificando tabelas relacionadas THEN o sistema SHALL documentar estrutura de `services`, `service_requests`, `asaas_cobrancas`, e relacionamento entre elas

3. WHEN verificando Edge Functions THEN o sistema SHALL identificar se existe `asaas-create-service-payment`, `asaas-process-service-payment`, ou similar

4. WHEN documentando problemas THEN o sistema SHALL listar todos os problemas identificados no fluxo de pagamento de serviços

### Requirement 6: Análise do Sistema de Split de Pagamentos

**User Story:** Como auditor técnico, eu quero analisar a integração do sistema de split com todos os tipos de transação, para que eu possa complementar o relatório existente e identificar gaps de implementação.

#### Acceptance Criteria

1. WHEN verificando integração com filiação THEN o sistema SHALL identificar se existe chamada para `asaas-configure-split` após criar assinatura em `useFiliacaoPayment.ts`

2. WHEN verificando integração com serviços THEN o sistema SHALL documentar se existe split em solicitação de certidões, regularizações, e pagamentos avulsos

3. WHEN analisando tabela `asaas_splits` THEN o sistema SHALL documentar estrutura completa e relacionamento com `asaas_cobrancas`, `user_subscriptions`, e `services`

4. WHEN verificando programa de afiliados THEN o sistema SHALL documentar se tabela `affiliates` existe, se campo `asaas_wallet_id` existe, como vincular afiliado à filiação, como calcular comissão, e onde está o código de afiliados

5. WHEN finalizando análise THEN o sistema SHALL complementar relatório existente com status atual do split, integração com cada tipo de transação, sistema de afiliados completo, cálculo e distribuição de comissões, e todos os gaps

### Requirement 7: Análise de Métodos de Pagamento

**User Story:** Como auditor técnico, eu quero analisar a implementação de todos os métodos de pagamento (PIX, Cartão de Crédito, Boleto), para que eu possa identificar problemas de integração e fluxos incompletos.

#### Acceptance Criteria

1. WHEN analisando PIX THEN o sistema SHALL verificar geração de QR Code, Edge Function `asaas-create-pix-payment`, expiração do PIX, webhook de confirmação, e fluxo completo no frontend

2. WHEN analisando Cartão de Crédito THEN o sistema SHALL verificar tokenização, processamento seguro, Edge Function de processamento, webhook de confirmação, e tratamento de erros

3. WHEN analisando Boleto THEN o sistema SHALL verificar geração de boleto, Edge Function, prazo de vencimento, webhook de confirmação, e fluxo de expiração

4. WHEN comparando métodos THEN o sistema SHALL documentar consistência entre implementações, tratamento de erros, e experiência do usuário

5. WHEN identificando problemas THEN o sistema SHALL listar todos os gaps, inconsistências, e vulnerabilidades encontradas

### Requirement 8: Análise Completa de Edge Functions

**User Story:** Como auditor técnico, eu quero inventariar e analisar TODAS as Edge Functions do sistema, para que eu possa identificar problemas de implementação, configuração e logs.

#### Acceptance Criteria

1. WHEN listando Edge Functions THEN o sistema SHALL identificar TODAS as funções em `supabase/functions/`

2. WHEN analisando cada função THEN o sistema SHALL documentar: nome, responsabilidade, parâmetros de entrada, resposta, onde é chamada no frontend, variáveis de ambiente necessárias

3. WHEN verificando logs THEN o sistema SHALL buscar logs de execução e erros recentes

4. WHEN criando tabela resumo THEN o sistema SHALL incluir status de cada função (funcionando, com problemas, não testada)

5. WHEN identificando gaps THEN o sistema SHALL listar Edge Functions faltantes ou incompletas

### Requirement 9: Análise Completa de Hooks

**User Story:** Como auditor técnico, eu quero analisar todos os hooks relacionados a pagamento e assinatura, para que eu possa identificar duplicação de código e problemas de lógica.

#### Acceptance Criteria

1. WHEN listando hooks THEN o sistema SHALL identificar TODOS os hooks em `src/hooks/` relacionados a pagamento/assinatura

2. WHEN analisando cada hook THEN o sistema SHALL documentar: responsabilidade, estados gerenciados, queries/mutations, onde é usado

3. WHEN identificando duplicação THEN o sistema SHALL listar código duplicado entre hooks

4. WHEN propondo melhorias THEN o sistema SHALL sugerir refatoração e hooks compartilhados (sem implementar)

### Requirement 10: Análise Completa de Integração Asaas

**User Story:** Como auditor técnico, eu quero documentar completamente a integração com API Asaas, para que eu possa identificar problemas de configuração, endpoints e webhook.

#### Acceptance Criteria

1. WHEN verificando configuração THEN o sistema SHALL documentar: API Key, Base URL, Timeout, Retry, Webhook URL e Token

2. WHEN listando endpoints THEN o sistema SHALL documentar TODOS os endpoints Asaas usados com método HTTP, parâmetros e resposta

3. WHEN analisando webhook THEN o sistema SHALL documentar: URL, token, TODOS os eventos tratados, logs das últimas 24h

4. WHEN verificando tratamento de erro THEN o sistema SHALL documentar como sistema trata erros da API Asaas e rate limiting

### Requirement 11: Análise de Testes e Monitoramento

**User Story:** Como auditor técnico, eu quero verificar cobertura de testes e sistema de monitoramento, para que eu possa identificar áreas críticas sem testes e propor melhorias.

#### Acceptance Criteria

1. WHEN buscando testes THEN o sistema SHALL identificar TODOS os arquivos de teste (*.test.ts, *.spec.ts)

2. WHEN verificando cobertura THEN o sistema SHALL documentar cobertura de testes para hooks, Edge Functions e componentes de pagamento

3. WHEN analisando logs THEN o sistema SHALL verificar logs de Edge Functions, banco de dados e identificar erros recorrentes

4. WHEN verificando monitoramento THEN o sistema SHALL documentar se há sistema de monitoramento e alertas configurados

5. WHEN propondo melhorias THEN o sistema SHALL listar testes faltantes e melhorias em logging/monitoramento

### Requirement 12: Geração de Relatório Final Completo

**User Story:** Como auditor técnico, eu quero gerar um relatório técnico completo e estruturado com TODAS as 15 áreas analisadas, para que stakeholders possam entender todos os problemas identificados e as soluções propostas.

#### Acceptance Criteria

1. WHEN gerando relatório THEN o sistema SHALL criar arquivo `AUDITORIA_SISTEMA_PAGAMENTOS.md` com estrutura completa de 12 seções

2. WHEN documentando cada seção THEN o sistema SHALL incluir: estado atual, estado esperado, problemas identificados, impacto, e propostas de solução (sem implementar)

3. WHEN mapeando fluxos THEN o sistema SHALL incluir diagramas em Mermaid quando apropriado para visualização de fluxos complexos

4. WHEN priorizando problemas THEN o sistema SHALL classificar cada problema como CRÍTICO, ALTO, MÉDIO, ou BAIXO

5. WHEN propondo soluções THEN o sistema SHALL ser específico sobre arquivos, funções, e lógica necessária, mas SEM implementar nada

6. WHEN finalizando THEN o sistema SHALL incluir sumário executivo, matriz de riscos, roadmap de correções, e TODOS os anexos (diagramas, tabelas, código de referência, checklists)

7. WHEN validando completude THEN o sistema SHALL verificar checklist de 15 itens da solicitação original antes de entregar
