# Requirements Document - Correção Sistema de Filiação e Integração Asaas

## Introduction

Este documento define os requisitos para a correção completa do sistema de filiação, split de pagamentos e programa de afiliados do COMADEMIG. A análise realizada pelo MANUS identificou problemas críticos que impedem o funcionamento correto das transações financeiras, comissões de afiliados e divisão de pagamentos com a RENUM.

O sistema atual apresenta falhas na integração com o gateway Asaas que resultam em:
- Split de pagamentos não sendo configurado nas assinaturas
- Webhooks não implementados, impedindo atualização automática de status
- Duplicidade de dados em tabelas de assinatura
- Triggers causando falhas no cadastro de novos membros
- Programa de afiliados não funcional

Esta correção é crítica para o modelo de negócio da plataforma, pois afeta diretamente a receita da COMADEMIG, RENUM e afiliados.

## Requirements

### Requirement 1: Correção do Fluxo de Cadastro

**User Story:** Como um novo membro, eu quero conseguir me cadastrar no sistema sem erros, para que eu possa acessar os serviços da COMADEMIG.

#### Acceptance Criteria

1. WHEN um usuário preenche o formulário de filiação THEN o sistema cria a conta no auth.users sem erros
2. WHEN a conta é criada no auth.users THEN o trigger handle_new_user cria automaticamente o profile em profiles
3. WHEN o profile é criado THEN o trigger sync_user_role_to_metadata sincroniza o tipo_membro para auth.users.raw_app_meta_data sem causar falha
4. IF o trigger sync_user_role_to_metadata falhar THEN o erro é logado mas NÃO impede a criação do usuário
5. WHEN o cadastro é concluído THEN o usuário recebe confirmação de sucesso

### Requirement 2: Unificação das Tabelas de Assinatura

**User Story:** Como desenvolvedor, eu quero uma única fonte de verdade para dados de assinatura, para que não haja inconsistências e duplicação de dados.

#### Acceptance Criteria

1. WHEN o sistema precisa armazenar dados de assinatura THEN usa apenas a tabela user_subscriptions
2. WHEN uma assinatura é criada no Asaas THEN os dados são salvos em user_subscriptions com todos os campos necessários
3. IF a tabela asaas_subscriptions existir THEN é marcada como deprecated e não é mais utilizada
4. WHEN consulto o status de uma assinatura THEN obtenho dados consistentes de uma única fonte
5. WHEN migro dados existentes THEN todas as assinaturas de asaas_subscriptions são transferidas para user_subscriptions sem perda de dados

### Requirement 3: Configuração Correta do Split de Pagamentos

**User Story:** Como COMADEMIG, eu quero que os pagamentos sejam automaticamente divididos entre COMADEMIG, RENUM e afiliados (quando aplicável), para que todos recebam suas comissões corretamente.

#### Acceptance Criteria

1. WHEN uma assinatura é criada THEN o sistema busca a configuração de split antes de enviar para o Asaas
2. WHEN há um afiliado vinculado THEN o split inclui 20% para o afiliado, 40% para RENUM e 40% para COMADEMIG
3. WHEN NÃO há afiliado THEN o split inclui 50% para RENUM e 50% para COMADEMIG
4. WHEN o payload da assinatura é enviado ao Asaas THEN inclui o array splits com walletId e percentualValue corretos
5. WHEN a assinatura é criada no Asaas THEN o split é configurado automaticamente para todas as cobranças futuras
6. WHEN uma cobrança é gerada pelo Asaas THEN o split é aplicado automaticamente sobre o valor líquido
7. IF houver divergência de split THEN o sistema recebe webhook e notifica administradores

### Requirement 4: Implementação de Webhooks do Asaas

**User Story:** Como sistema, eu quero receber notificações automáticas do Asaas sobre eventos de pagamento, para que possa atualizar o status das assinaturas em tempo real.

#### Acceptance Criteria

1. WHEN o Asaas envia um webhook THEN o sistema recebe e valida a autenticidade da requisição
2. WHEN recebe evento PAYMENT_RECEIVED THEN atualiza user_subscriptions.status de 'pending' para 'active'
3. WHEN recebe evento PAYMENT_CONFIRMED THEN registra a confirmação e atualiza dados financeiros
4. WHEN recebe evento PAYMENT_OVERDUE THEN atualiza status para 'overdue' e notifica o usuário
5. WHEN recebe evento SUBSCRIPTION_UPDATED THEN sincroniza dados da assinatura no banco local
6. WHEN recebe evento sobre split THEN atualiza status do split em asaas_splits
7. IF o processamento do webhook falhar THEN o erro é registrado em webhook_errors para retry
8. WHEN um webhook é processado com sucesso THEN retorna status 200 para o Asaas

### Requirement 5: Correção do Programa de Afiliados

**User Story:** Como afiliado, eu quero receber automaticamente 20% de comissão sobre as filiações que indico, para que seja vantajoso divulgar a plataforma.

#### Acceptance Criteria

1. WHEN um usuário acessa /filiacao?ref=CODIGO THEN o sistema valida se o código de referral existe
2. IF o código é válido THEN exibe informações do afiliado (nome, foto) para o usuário
3. WHEN o usuário completa a filiação THEN o sistema registra a indicação em affiliate_referrals
4. WHEN a assinatura é criada THEN o split inclui o wallet_id do afiliado com 20% de comissão
5. WHEN o pagamento é confirmado THEN o afiliado recebe automaticamente sua comissão via split do Asaas
6. WHEN a comissão é creditada THEN o sistema registra em affiliate_commissions com status 'credited'
7. WHEN consulto o dashboard de afiliado THEN vejo todas as indicações e comissões recebidas

### Requirement 6: Validação e Tratamento de Erros

**User Story:** Como usuário, eu quero receber mensagens de erro claras e específicas quando algo der errado, para que eu saiba como resolver o problema.

#### Acceptance Criteria

1. WHEN o CPF já está cadastrado no Asaas THEN retorna erro específico "CPF já cadastrado"
2. WHEN o email já está cadastrado THEN retorna erro específico "Email já cadastrado - faça login"
3. WHEN o cartão é recusado THEN retorna erro com motivo da recusa
4. WHEN há erro de comunicação com Asaas THEN retorna erro "Erro temporário - tente novamente"
5. WHEN o plano selecionado não existe THEN retorna erro "Plano inválido"
6. WHEN o código de afiliado é inválido THEN retorna erro "Código de indicação inválido"
7. IF qualquer erro ocorrer THEN é logado em system_logs com contexto completo para debug

### Requirement 7: Suporte a Múltiplos Métodos de Pagamento

**User Story:** Como usuário, eu quero poder escolher entre PIX e cartão de crédito para pagar minha filiação, independente do plano escolhido.

#### Acceptance Criteria

1. WHEN seleciono plano mensal THEN posso escolher entre PIX e cartão de crédito
2. WHEN seleciono plano semestral THEN posso escolher entre PIX e cartão de crédito
3. WHEN seleciono plano anual THEN posso escolher entre PIX e cartão de crédito
4. WHEN escolho PIX THEN recebo 5% de desconto sobre o valor do plano
5. WHEN escolho cartão THEN posso parcelar conforme regras do plano
6. WHEN a validação restritiva de método de pagamento existir THEN é removida do backend

### Requirement 8: Cobrança Imediata + Assinatura Futura

**User Story:** Como COMADEMIG, eu quero cobrar imediatamente a primeira mensalidade e criar uma assinatura para cobranças futuras em +30 dias, para garantir receita imediata e recorrente.

#### Acceptance Criteria

1. WHEN um usuário completa a filiação THEN o sistema cria uma cobrança imediata (payment) no Asaas
2. WHEN a cobrança imediata é criada THEN inclui o split configurado (RENUM + afiliado se houver)
3. WHEN a cobrança imediata é criada THEN cria também uma assinatura com nextDueDate = hoje + 30 dias
4. WHEN a assinatura é criada THEN inclui o mesmo split da cobrança imediata
5. WHEN o pagamento imediato é confirmado THEN user_subscriptions.status = 'active'
6. WHEN a assinatura gera a próxima cobrança THEN o split é aplicado automaticamente
7. WHEN registro a cobrança localmente THEN salvo o initial_payment_id separado do subscription_id

### Requirement 9: Segurança e Políticas RLS

**User Story:** Como administrador de sistema, eu quero que apenas usuários autorizados possam modificar dados financeiros, para garantir a segurança dos dados.

#### Acceptance Criteria

1. WHEN um usuário comum tenta modificar asaas_customers THEN a operação é negada
2. WHEN service_role tenta modificar asaas_customers THEN a operação é permitida
3. WHEN um usuário tenta ver dados de outro usuário THEN vê apenas seus próprios dados
4. WHEN admin ou super_admin consulta dados THEN pode ver dados de todos os usuários
5. WHEN políticas RLS permissivas existirem THEN são corrigidas para serem restritivas
6. WHEN um usuário tenta deletar um super_admin THEN a operação é negada

### Requirement 10: Monitoramento e Logs

**User Story:** Como desenvolvedor, eu quero logs detalhados de todas as operações financeiras, para facilitar debug e auditoria.

#### Acceptance Criteria

1. WHEN uma assinatura é criada THEN o evento é logado em system_logs com todos os parâmetros
2. WHEN um webhook é recebido THEN o payload completo é logado
3. WHEN um split é configurado THEN os detalhes são logados (walletIds, percentuais)
4. WHEN um erro ocorre THEN o stack trace completo é logado
5. WHEN consulto logs THEN posso filtrar por user_id, tipo de evento e período
6. WHEN um webhook falha THEN é registrado em webhook_errors com contador de tentativas

## Success Criteria

O sistema será considerado corrigido quando:

1. ✅ Novos membros conseguem se cadastrar sem erros
2. ✅ Split de pagamentos é configurado automaticamente em todas as assinaturas
3. ✅ RENUM recebe sua porcentagem em todas as transações
4. ✅ Afiliados recebem 20% de comissão automaticamente
5. ✅ Webhooks atualizam status de assinaturas automaticamente
6. ✅ Não há duplicação de dados entre tabelas
7. ✅ Todos os métodos de pagamento funcionam corretamente
8. ✅ Cobrança imediata + assinatura futura funcionam conforme especificado
9. ✅ Políticas de segurança estão corretas e restritivas
10. ✅ Logs permitem auditoria completa de todas as transações

## Out of Scope

- Alterações no design do formulário de filiação
- Implementação de novos métodos de pagamento além de PIX e cartão
- Alterações nas regras de negócio de comissionamento (percentuais)
- Migração de dados históricos de assinaturas antigas
- Implementação de dashboard de afiliados (apenas backend)
