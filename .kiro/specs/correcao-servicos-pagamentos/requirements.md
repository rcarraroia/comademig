# Correção e Integração dos Serviços com Sistema de Pagamentos

## Introdução

Este projeto visa corrigir e implementar a integração completa dos três serviços principais do sistema COMADEMIG com o sistema de pagamentos: Solicitação de Certidões, Regularização de Igrejas e Filiação de Membros. Atualmente, todos os serviços têm problemas críticos de integração com pagamentos, resultando em fluxos incompletos e processos administrativos inadequados.

## Requisitos

### Requisito 1: Correção do Sistema de Pagamentos (Edge Function)

**User Story:** Como usuário do sistema, eu quero que o processo de pagamento funcione corretamente, para que eu possa finalizar minhas solicitações de serviços sem erros.

#### Acceptance Criteria

1. WHEN um usuário tenta gerar uma cobrança THEN a edge function `asaas-create-payment` SHALL processar sem erros
2. WHEN a edge function é chamada THEN ela SHALL validar corretamente os dados do cliente e criar cobrança no Asaas
3. WHEN uma cobrança é criada THEN o sistema SHALL salvar os dados na tabela `asaas_cobrancas` com todas as informações necessárias
4. WHEN o pagamento é PIX THEN o sistema SHALL gerar e retornar o QR Code corretamente
5. WHEN ocorre erro na API Asaas THEN o sistema SHALL retornar mensagens de erro claras e específicas

### Requisito 2: Integração de Certidões com Pagamento Obrigatório

**User Story:** Como usuário, eu quero que o sistema me direcione para pagamento antes de processar minha solicitação de certidão, para que o processo seja transparente e o admin receba apenas solicitações pagas.

#### Acceptance Criteria

1. WHEN um usuário preenche o formulário de certidão THEN o sistema SHALL calcular o valor baseado na tabela `valores_certidoes`
2. WHEN o usuário submete a solicitação THEN o sistema SHALL redirecionar para checkout de pagamento
3. WHEN o pagamento é confirmado THEN o sistema SHALL criar a solicitação com referência de pagamento
4. WHEN o admin acessa o painel THEN ele SHALL ver apenas solicitações com pagamento confirmado
5. WHEN uma certidão é solicitada sem pagamento THEN o sistema SHALL impedir a criação da solicitação

### Requisito 3: Integração de Regularização com Pagamento Real

**User Story:** Como usuário interessado em regularização, eu quero que o checkout gere uma cobrança real, para que eu possa efetuar o pagamento e ter meu pedido processado adequadamente.

#### Acceptance Criteria

1. WHEN um usuário seleciona serviços de regularização THEN o sistema SHALL calcular o valor total corretamente
2. WHEN o usuário finaliza o pedido THEN o sistema SHALL gerar cobrança real via edge function
3. WHEN a cobrança é criada THEN o sistema SHALL salvar a solicitação com referência de pagamento
4. WHEN o pagamento é confirmado THEN o sistema SHALL notificar o admin sobre nova solicitação
5. WHEN não há pagamento confirmado THEN o admin NÃO SHALL receber a solicitação

### Requisito 4: Correção do Fluxo de Filiação

**User Story:** Como novo membro, eu quero completar meu processo de filiação com pagamento, para que minha assinatura seja ativada corretamente após confirmação do pagamento.

#### Acceptance Criteria

1. WHEN um usuário seleciona cargo ministerial e plano THEN o sistema SHALL calcular o valor corretamente
2. WHEN o usuário submete o formulário THEN o sistema SHALL gerar cobrança sem erros
3. WHEN a cobrança é criada THEN o sistema SHALL criar assinatura com status 'pending'
4. WHEN o pagamento é confirmado via webhook THEN o sistema SHALL ativar a assinatura automaticamente
5. WHEN há erro no processo THEN o sistema SHALL exibir mensagens claras e permitir nova tentativa

### Requisito 5: Implementação de Painéis Administrativos

**User Story:** Como administrador, eu quero gerenciar solicitações de certidões e regularização que foram pagas, para que eu possa processar apenas pedidos válidos e manter controle financeiro.

#### Acceptance Criteria

1. WHEN o admin acessa painel de certidões THEN ele SHALL ver apenas solicitações com pagamento confirmado
2. WHEN o admin acessa painel de regularização THEN ele SHALL ver lista de solicitações pagas
3. WHEN uma nova solicitação paga é criada THEN o admin SHALL receber notificação
4. WHEN o admin processa uma solicitação THEN ele SHALL poder atualizar status e adicionar observações
5. WHEN há problemas de pagamento THEN o admin SHALL ter visibilidade sobre cobranças pendentes

### Requisito 6: Fluxo de Checkout Unificado

**User Story:** Como usuário, eu quero uma experiência consistente de checkout para todos os serviços, para que o processo seja intuitivo e confiável.

#### Acceptance Criteria

1. WHEN qualquer serviço redireciona para checkout THEN a interface SHALL ser consistente
2. WHEN o usuário está no checkout THEN ele SHALL ver claramente o que está comprando e o valor
3. WHEN o pagamento é processado THEN o usuário SHALL receber confirmação clara
4. WHEN há erro no pagamento THEN o usuário SHALL poder tentar novamente facilmente
5. WHEN o pagamento é confirmado THEN o usuário SHALL ser redirecionado adequadamente

### Requisito 7: Sistema de Notificações e Webhooks

**User Story:** Como sistema, eu preciso processar webhooks de pagamento corretamente, para que as ações apropriadas sejam executadas automaticamente quando pagamentos são confirmados.

#### Acceptance Criteria

1. WHEN um webhook de pagamento é recebido THEN o sistema SHALL identificar o tipo de serviço corretamente
2. WHEN é pagamento de certidão THEN o sistema SHALL atualizar status da solicitação
3. WHEN é pagamento de regularização THEN o sistema SHALL notificar admin sobre nova solicitação
4. WHEN é pagamento de filiação THEN o sistema SHALL ativar assinatura do usuário
5. WHEN há erro no processamento THEN o sistema SHALL registrar log para investigação

### Requisito 8: Validações e Segurança

**User Story:** Como sistema, eu preciso validar todos os dados e transações, para garantir segurança e integridade dos processos de pagamento.

#### Acceptance Criteria

1. WHEN dados são enviados para pagamento THEN o sistema SHALL validar todos os campos obrigatórios
2. WHEN valores são calculados THEN o sistema SHALL usar apenas dados da base de dados oficial
3. WHEN webhooks são recebidos THEN o sistema SHALL validar autenticidade
4. WHEN há tentativa de manipulação THEN o sistema SHALL rejeitar e registrar tentativa
5. WHEN transações são processadas THEN o sistema SHALL manter auditoria completa