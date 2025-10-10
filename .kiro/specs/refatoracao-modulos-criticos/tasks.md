# Implementation Plan

## Overview

Este plano de implementação divide a refatoração dos três módulos críticos em tarefas incrementais e testáveis. Cada tarefa é focada em código e pode ser executada por um agente de desenvolvimento. O plano segue uma abordagem de desenvolvimento incremental, priorizando correções críticas primeiro, seguidas por implementações completas.

---

## Tasks

- [ ] 1. Correção do Módulo de Suporte
  - Corrigir inconsistência de nomenclatura de hooks e garantir persistência correta de tickets
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 1.1 Remover hook incorreto e atualizar importações



  - Deletar arquivo `src/hooks/useSuporteTickets.ts`
  - Atualizar `src/pages/dashboard/Suporte.tsx` para usar `useSupport.ts`
  - Substituir interface `SuporteTicket` por `SupportTicket`
  - Atualizar componentes `TicketCard`, `TicketDetail` e `NovoTicketModal` se necessário
  - _Requirements: 1.5_

- [x] 1.2 Criar políticas RLS para módulo de suporte



  - Criar política para usuários verem apenas seus tickets
  - Criar política para admins verem todos os tickets
  - Criar política para usuários criarem tickets
  - Criar política para admins atualizarem tickets
  - Criar políticas para mensagens (visualização e criação)
  - Criar política para visualização de categorias ativas
  - _Requirements: 8.1, 8.2, 8.3_

- [ ]* 1.3 Testar fluxo completo do módulo de suporte
  - Criar ticket como usuário e verificar salvamento em `support_tickets`
  - Verificar ticket aparece no painel do usuário
  - Verificar ticket aparece no painel admin
  - Enviar mensagem e verificar salvamento em `support_messages`
  - Testar resposta de admin e visualização em tempo real
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

- [ ] 2. Estrutura de Banco de Dados para Afiliados e Split
  - Criar tabelas necessárias e atualizar estruturas existentes
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 2.1 Criar migração para tabela affiliate_referrals


  - Criar arquivo de migração SQL em `supabase/migrations/`
  - Definir estrutura da tabela com campos: id, affiliate_id, referred_user_id, referral_code, status, conversion_date, conversion_value
  - Criar índices para affiliate_id, referred_user_id e referral_code
  - Adicionar foreign keys com ON DELETE CASCADE
  - _Requirements: 6.5_

- [x] 2.2 Criar migração para atualizar tabela asaas_splits



  - Adicionar campos: recipient_type, recipient_name, recipient_wallet_id
  - Remover constraint de unicidade em payment_id se existir
  - Criar índice composto em (payment_id, recipient_type)
  - Adicionar check constraint para recipient_type
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 2.3 Criar migrações para tabelas de configuração de split


  - Criar tabela `split_configurations` com campos: id, category, category_label, is_active
  - Criar tabela `split_recipients` com campos: id, configuration_id, recipient_type, recipient_name, recipient_identifier, wallet_id, percentage, sort_order
  - Criar índices apropriados
  - Adicionar check constraint para percentage (> 0 AND <= 100)
  - _Requirements: 6.1, 6.2, 6.3, 6.4_


- [x] 2.4 Atualizar arquivo types.ts com novos tipos


  - Adicionar interface `AffiliateReferral`
  - Atualizar interface `AsaasSplit` com novos campos
  - Adicionar interfaces `SplitConfiguration` e `SplitRecipient`
  - Garantir que `AffiliateCommission` está mapeada
  - _Requirements: 6.6_

- [x] 2.5 Criar políticas RLS para tabelas de afiliados


  - Criar políticas para `affiliates` (usuário vê próprio, admin vê todos)
  - Criar políticas para `affiliate_referrals` (afiliado vê próprias, admin vê todas)
  - Criar políticas para `affiliate_commissions` (afiliado vê próprias, admin vê todas)
  - _Requirements: 8.4, 8.5, 8.8_


- [x] 2.6 Criar políticas RLS para tabelas de split


  - Criar política para `asaas_splits` (apenas admins e super admins)
  - Criar políticas para `split_configurations` (apenas super admins)
  - Criar políticas para `split_recipients` (apenas super admins)
  - _Requirements: 8.6, 8.7_


- [x] 3. Módulo de Afiliados - Hooks e Lógica de Negócio


  - Implementar hooks atualizados com novas funcionalidades
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_


- [x] 3.1 Atualizar hook useAffiliate com novas funções


  - Adicionar função `useAffiliateReferrals` para buscar indicações
  - Adicionar função `useAffiliateStats` para buscar estatísticas
  - Adicionar função `useAffiliateCommissions` para buscar comissões
  - Implementar queries com React Query e relacionamentos corretos
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3.2 Atualizar Edge Function affiliates-management


  - Modificar endpoint GET para incluir referrals de `affiliate_referrals`
  - Modificar endpoint GET para incluir commissions de `affiliate_commissions`
  - Garantir que validações de Wallet ID estão corretas
  - Adicionar tratamento de erros apropriado
  - _Requirements: 2.5, 2.6, 2.7_


- [ ] 3.3 Criar função para registrar indicações
  - Criar função `createReferral` que salva em `affiliate_referrals`
  - Implementar validação de código de indicação
  - Vincular referred_user_id ao perfil criado
  - Definir status inicial como 'pending'

  - _Requirements: 7.1_


- [ ] 4. Módulo de Afiliados - Painel do Usuário
  - Implementar interface completa para afiliados visualizarem seu desempenho
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 4.1 Criar componente AffiliatesDashboard


  - Criar arquivo `src/components/affiliates/AffiliatesDashboard.tsx`
  - Implementar cards de estatísticas: saldo acumulado, indicações ativas, comissões pendentes, comissões pagas
  - Usar hook `useAffiliateStats` para buscar dados reais
  - Adicionar gráfico simples de desempenho mensal usando Recharts
  - _Requirements: 2.1, 2.2_

- [x] 4.2 Criar componente AffiliatesReferralsList


  - Criar arquivo `src/components/affiliates/AffiliatesReferralsList.tsx`
  - Implementar tabela com colunas: nome/identificação, data, status, valor de conversão
  - Usar hook `useAffiliateReferrals` para buscar dados
  - Adicionar filtros por status (pending, converted, cancelled)
  - Implementar paginação se necessário
  - _Requirements: 2.3_

- [x] 4.3 Criar componente AffiliatesCommissionsList


  - Criar arquivo `src/components/affiliates/AffiliatesCommissionsList.tsx`
  - Implementar tabela com colunas: valor, status, data de liberação
  - Usar hook `useAffiliateCommissions` para buscar dados
  - Adicionar badges de status (pendente, pago, cancelado)
  - Calcular totais por status
  - _Requirements: 2.4_

- [x] 4.4 Criar componente AffiliatesTools


  - Criar arquivo `src/components/affiliates/AffiliatesTools.tsx`
  - Implementar exibição do link exclusivo do afiliado
  - Adicionar botão "Copiar Link" com feedback visual
  - Gerar QR Code usando biblioteca `qrcode` com o link de indicação
  - Adicionar botões de compartilhamento (WhatsApp, Email, Redes Sociais)
  - _Requirements: 2.7_

- [x] 4.5 Atualizar página Afiliados.tsx com abas funcionais



  - Atualizar `src/pages/dashboard/Afiliados.tsx`
  - Implementar Tabs com: Dashboard, Indicações, Comissões, Ferramentas
  - Integrar componentes criados em cada aba
  - Manter formulário de cadastro existente


  - Adicionar verificação de status (pendente/ativo) e exibir mensagem apropriada
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_


- [x] 5. Módulo de Afiliados - Painel Admin



  - Implementar interface completa para admins gerenciarem afiliados
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 5.1 Criar página AffiliatesManagement


  - Criar arquivo `src/pages/admin/AffiliatesManagement.tsx`
  - Implementar estrutura de Tabs: Afiliados, Indicações, Comissões, Relatórios, Configurações
  - Adicionar verificação de permissão (apenas admin e super_admin)
  - Criar layout base com navegação entre abas
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 5.2 Criar componente AffiliatesList para admin



  - Criar arquivo `src/pages/admin/components/AffiliatesList.tsx`
  - Implementar tabela com todos os afiliados
  - Adicionar colunas: nome, CPF/CNPJ, email, status, data de cadastro
  - Implementar ações: Aprovar, Suspender, Banir
  - Adicionar filtros por status
  - Implementar busca por nome/email
  - _Requirements: 3.1, 3.2_

- [x] 5.3 Criar componente AffiliateDetail para admin


  - Criar arquivo `src/pages/admin/components/AffiliateDetail.tsx`
  - Exibir dados cadastrais completos incluindo Wallet ID (mascarado)
  - Mostrar estatísticas do afiliado (indicações, comissões)
  - Adicionar botões de ação (aprovar, suspender, editar)
  - Exibir histórico de atividades
  - _Requirements: 3.2_

- [x] 5.4 Criar componente ReferralsManagement para admin



  - Criar arquivo `src/pages/admin/components/ReferralsManagement.tsx`
  - Implementar tabela com todas as indicações do sistema
  - Adicionar colunas: afiliado, indicado, data, status, valor de conversão
  - Implementar filtros por: afiliado, status, período
  - Adicionar busca por nome de afiliado ou indicado
  - _Requirements: 3.3, 3.4_

- [x] 5.5 Criar componente CommissionsManagement para admin


  - Criar arquivo `src/pages/admin/components/CommissionsManagement.tsx`
  - Implementar tabela com todas as comissões
  - Adicionar colunas: afiliado, valor, status, data, ações
  - Implementar aprovação manual de comissões quando necessário
  - Exibir histórico de repasses automáticos via Asaas
  - Adicionar filtros por status e período
  - _Requirements: 3.5, 3.6_

- [x] 5.6 Criar componente AffiliatesReports para admin


  - Criar arquivo `src/pages/admin/components/AffiliatesReports.tsx`
  - Implementar cards com: afiliados mais ativos, total de indicações, total de conversões, volume financeiro
  - Adicionar gráficos de desempenho usando Recharts
  - Implementar filtros por período
  - Adicionar opção de exportar relatório
  - _Requirements: 3.7_


- [x] 5.7 Criar componente AffiliatesSettings para admin

  - Criar arquivo `src/pages/admin/components/AffiliatesSettings.tsx`
  - Implementar formulário para configurar percentual de comissão padrão
  - Adicionar configuração de regras de elegibilidade
  - Implementar configuração de bonificações extras
  - Salvar configurações em tabela apropriada
  - _Requirements: 3.8_


- [x] 6. Módulo de Split - Correção da Divisão Tripla




  - Corrigir lógica de split para dividir corretamente entre 3 beneficiários
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 6.1 Configurar variável de ambiente RENUM_WALLET_ID


  - Adicionar variável `RENUM_WALLET_ID` no painel do Supabase
  - Documentar valor correto do Wallet ID da RENUM
  - Verificar que variável está acessível nas Edge Functions
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6.2 Atualizar Edge Function asaas-configure-split

  - Modificar função para criar 3 splits ao invés de 1
  - Implementar lógica de divisão por tipo de serviço (filiacao: 40%-40%-20%, servicos: 60%-40%, publicidade: 100%)
  - Para COMADEMIG: não criar split no Asaas (recebe direto), apenas registrar localmente
  - Para RENUM: criar split no Asaas com Wallet ID fixo
  - Para Afiliado: criar split no Asaas com Wallet ID dinâmico
  - Registrar os 3 splits na tabela `asaas_splits` com recipient_type correto
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_


- [ ] 6.3 Atualizar Edge Function asaas-process-splits
  - Modificar função para processar múltiplos splits por pagamento
  - Buscar todos os splits do payment_id (não apenas 1)
  - Processar transferências para RENUM e Afiliado
  - Atualizar status de cada split individualmente
  - Registrar comissões em `affiliate_commissions` apenas para afiliados
  - _Requirements: 4.6, 4.7, 4.8_


- [ ] 6.4 Criar função para popular configurações padrão de split
  - Criar script ou migração para inserir configurações iniciais
  - Adicionar categoria "filiacao" com 3 beneficiários (40%-40%-20%)
  - Adicionar categoria "servicos" com 2 beneficiários (60%-40%)
  - Adicionar categoria "publicidade" com 1 beneficiário (100%)
  - Marcar todas como ativas
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 6.5 Testar divisão tripla de split
  - Criar pagamento de teste de filiação (R$ 1000)
  - Verificar que 3 splits são criados
  - Validar percentuais: COMADEMIG 40% (R$ 400), RENUM 40% (R$ 400), Afiliado 20% (R$ 200)
  - Confirmar pagamento e verificar processamento
  - Validar transferências no Asaas para RENUM e Afiliado
  - _Requirements: 4.1, 4.2, 4.3, 4.6, 4.7_

- [x] 7. Módulo de Split - Interface Super Admin



  - Criar interface exclusiva para super admin gerenciar configurações de split
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_


- [x] 7.1 Criar hook useSplitManagement

  - Criar arquivo `src/hooks/useSplitManagement.ts`
  - Implementar função `useConfigurations` para buscar configurações
  - Implementar função `updateConfiguration` para criar/atualizar configurações
  - Adicionar validação de soma de percentuais = 100%
  - Implementar função `useSplitHistory` para buscar histórico de splits
  - Implementar função `useSplitReports` para relatórios por beneficiário
  - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7_


- [x] 7.2 Criar página SplitManagement

  - Criar arquivo `src/pages/admin/SplitManagement.tsx`
  - Adicionar verificação de acesso (apenas super_admin)
  - Redirecionar para dashboard se não for super admin
  - Implementar estrutura de Tabs: Configurações, Histórico, Relatórios, Auditoria
  - _Requirements: 5.1, 5.2_


- [ ] 7.3 Criar componente SplitConfigurations
  - Criar arquivo `src/pages/admin/components/SplitConfigurations.tsx`
  - Implementar lista de categorias de receita (filiacao, servicos, publicidade)
  - Para cada categoria, exibir beneficiários e percentuais
  - Adicionar botão "Editar" que abre modal de edição
  - Implementar modal com formulário para editar beneficiários e percentuais
  - Adicionar validação em tempo real de soma = 100%
  - _Requirements: 5.3, 5.4, 5.5_


- [ ] 7.4 Criar componente SplitHistory
  - Criar arquivo `src/pages/admin/components/SplitHistory.tsx`
  - Implementar tabela com histórico de splits processados
  - Adicionar colunas: data, payment_id, categoria, beneficiários, valores, status
  - Implementar filtros por: período, categoria, status
  - Adicionar busca por payment_id
  - Exibir detalhes expandidos ao clicar em linha

  - _Requirements: 5.6_

- [ ] 7.5 Criar componente SplitReports
  - Criar arquivo `src/pages/admin/components/SplitReports.tsx`
  - Implementar cards com totais por beneficiário (COMADEMIG, RENUM, Afiliados)
  - Adicionar gráficos de distribuição usando Recharts
  - Implementar filtros por período
  - Exibir tabela detalhada com valores por categoria

  - Adicionar opção de exportar relatório
  - _Requirements: 5.7_

- [ ] 7.6 Criar componente SplitAuditLog
  - Criar arquivo `src/pages/admin/components/SplitAuditLog.tsx`
  - Implementar tabela com log de alterações de configuração
  - Adicionar colunas: data, usuário, ação, categoria, alterações
  - Exibir diff de valores antigos vs novos
  - Implementar filtros por período e usuário
  - _Requirements: 5.6_

- [x] 8. Integração e Fluxo Completo



  - Integrar todos os módulos e garantir fluxo automático
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 8.1 Integrar registro de indicação no fluxo de cadastro



  - Modificar página de cadastro/filiação para capturar parâmetro `ref` da URL
  - Ao criar perfil, verificar se há código de indicação
  - Se houver, buscar afiliado pelo referral_code
  - Criar registro em `affiliate_referrals` vinculando afiliado e novo usuário
  - Definir status inicial como 'pending'
  - _Requirements: 7.1_


- [x] 8.2 Integrar configuração de split no fluxo de pagamento

  - Modificar função de criação de cobrança
  - Após criar cobrança no Asaas, verificar se usuário foi indicado
  - Se foi indicado, chamar `asaas-configure-split` automaticamente
  - Passar tipo de serviço correto (filiacao, servicos, etc)
  - Registrar splits criados
  - _Requirements: 7.2, 7.3_


- [x] 8.3 Integrar processamento de split no webhook

  - Modificar Edge Function `asaas-webhook`
  - Quando pagamento é confirmado (status RECEIVED), chamar `asaas-process-splits`
  - Passar cobrancaId e paymentValue
  - Processar splits automaticamente
  - Atualizar status de indicação para 'converted' se aplicável
  - _Requirements: 7.4, 7.5_


- [x] 8.4 Implementar notificação de comissão para afiliado

  - Após processar split com sucesso, criar notificação
  - Enviar notificação in-app para o afiliado
  - Incluir valor da comissão e referência ao pagamento
  - Opcionalmente, enviar email de notificação
  - _Requirements: 7.6_

- [x] 8.5 Implementar reprocessamento manual de splits com erro


  - Criar função admin para reprocessar splits com status ERROR
  - Adicionar botão "Reprocessar" no painel admin
  - Tentar processar novamente e atualizar status
  - Registrar tentativa em logs
  - _Requirements: 7.7_

- [ ]* 8.6 Testar fluxo completo end-to-end
  - Criar afiliado e obter código de indicação
  - Cadastrar novo usuário usando código de indicação
  - Verificar registro em `affiliate_referrals`
  - Criar pagamento para o usuário indicado
  - Verificar que splits são configurados automaticamente
  - Confirmar pagamento via webhook
  - Verificar que splits são processados
  - Verificar que comissão aparece no painel do afiliado
  - Verificar que transferências foram criadas no Asaas
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

