# Requirements Document - Sistema de Pagamentos Asaas

## Introduction

Este documento define os requisitos para implementação de um sistema completo de pagamentos integrado com a API Asaas v3, incluindo cobranças PIX/cartão, assinaturas recorrentes e split de pagamentos entre múltiplas wallets. O sistema será construído com Node.js e substituirá completamente o sistema anterior que foi removido.

## Requirements

### Requirement 1 - Integração com API Asaas v3

**User Story:** Como administrador do sistema, eu quero integrar com a API Asaas v3 para processar pagamentos, para que possamos aceitar PIX e cartão de crédito com split automático entre as organizações.

#### Acceptance Criteria

1. WHEN o sistema for configurado THEN deve conectar com a API Asaas v3 usando autenticação Bearer token
2. WHEN uma cobrança for criada THEN deve suportar billingType PIX e CREDIT_CARD
3. WHEN um pagamento incluir split THEN deve distribuir automaticamente entre 3 wallets (40% Comademig, 40% Renum, 20% Afiliado)
4. WHEN usar ambiente de desenvolvimento THEN deve conectar com api-sandbox.asaas.com
5. WHEN usar ambiente de produção THEN deve conectar com api.asaas.com

### Requirement 2 - Servidor Node.js para Pagamentos

**User Story:** Como desenvolvedor, eu quero um servidor Node.js robusto para gerenciar pagamentos, para que o sistema seja escalável e mantenha separação de responsabilidades.

#### Acceptance Criteria

1. WHEN o servidor for iniciado THEN deve expor endpoints REST para criação de cobranças e assinaturas
2. WHEN receber requisições THEN deve validar dados de entrada e autenticação
3. WHEN processar pagamentos THEN deve criar customers no Asaas automaticamente
4. WHEN receber webhooks THEN deve processar eventos em tempo real com idempotência
5. WHEN ocorrer erro THEN deve retornar códigos HTTP apropriados e logs detalhados

### Requirement 3 - Fluxo de Filiação de Novos Membros

**User Story:** Como visitante interessado, eu quero me filiar à COMADEMIG online, para que possa escolher meu cargo ministerial, plano de pagamento e forma de pagamento de maneira conveniente.

#### Acceptance Criteria

1. WHEN acessar página de filiação THEN deve exibir formulário com campos: nome, email, telefone, cargo, plano
2. WHEN escolher forma de pagamento PIX THEN deve gerar QR code e código para cópia
3. WHEN escolher cartão de crédito THEN deve exibir formulário seguro com tokenização
4. WHEN submeter formulário THEN deve criar customer no Asaas e subscription/payment conforme plano
5. WHEN pagamento for confirmado via webhook THEN deve liberar acesso ao painel do membro
6. WHEN split estiver configurado THEN deve distribuir valor entre as 3 wallets automaticamente

### Requirement 4 - Serviços Pontuais (Certidões e Regularização)

**User Story:** Como membro logado, eu quero solicitar serviços pontuais como certidões, para que possa pagar online e receber o serviço processado pela administração.

#### Acceptance Criteria

1. WHEN membro logado solicitar serviço THEN deve criar cobrança única (não recorrente)
2. WHEN cobrança for criada THEN deve incluir split de pagamento configurado
3. WHEN pagamento for confirmado THEN deve notificar administradores automaticamente
4. WHEN serviço for pago THEN deve criar entrada na tabela services_requests com status 'paid'
5. WHEN administrador for notificado THEN deve receber informações completas do serviço solicitado

### Requirement 5 - Sistema de Split de Pagamentos

**User Story:** Como administrador financeiro, eu quero que os pagamentos sejam automaticamente divididos entre as organizações parceiras, para que não seja necessário fazer transferências manuais.

#### Acceptance Criteria

1. WHEN criar cobrança THEN deve incluir split: 40% Comademig, 40% Renum, 20% Afiliado
2. WHEN afiliado não tiver wallet cadastrada THEN deve reter 20% na Comademig até regularização
3. WHEN split for aplicado THEN deve validar que walletIds existem e são válidos
4. WHEN pagamento for liquidado THEN deve registrar transações individuais para cada beneficiário
5. WHEN consultar split THEN deve mostrar valores exatos distribuídos para cada wallet

### Requirement 6 - Processamento de Webhooks

**User Story:** Como sistema, eu quero processar webhooks do Asaas em tempo real, para que os status de pagamentos sejam atualizados automaticamente sem intervenção manual.

#### Acceptance Criteria

1. WHEN receber webhook THEN deve validar autenticidade e origem
2. WHEN processar evento THEN deve implementar idempotência para evitar processamento duplicado
3. WHEN pagamento for confirmado THEN deve atualizar status na base de dados
4. WHEN assinatura for criada/cancelada THEN deve atualizar permissões do usuário
5. WHEN webhook falhar THEN deve registrar erro e implementar retry automático via job background
6. WHEN evento for processado THEN deve retornar HTTP 200 rapidamente
7. WHEN webhook não for processado THEN deve reprocessar automaticamente via rotina periódica

### Requirement 7 - Gestão de Assinaturas Recorrentes

**User Story:** Como membro filiado, eu quero que minha mensalidade seja cobrada automaticamente, para que não precise me preocupar com renovações manuais.

#### Acceptance Criteria

1. WHEN criar assinatura THEN deve definir ciclo (MONTHLY ou ANNUAL) conforme plano escolhido
2. WHEN assinatura estiver ativa THEN deve gerar cobranças automaticamente nas datas de vencimento
3. WHEN pagamento de assinatura falhar THEN deve notificar membro e administradores
4. WHEN membro cancelar THEN deve interromper cobranças futuras mas manter acesso até vencimento
5. WHEN assinatura expirar THEN deve restringir acesso ao painel até regularização

### Requirement 8 - Interface de Checkout

**User Story:** Como usuário pagante, eu quero uma interface clara para finalizar meu pagamento, para que possa escolher entre PIX ou cartão de forma intuitiva.

#### Acceptance Criteria

1. WHEN escolher PIX THEN deve exibir QR code, código para cópia e instruções claras
2. WHEN escolher cartão THEN deve exibir formulário seguro com validação em tempo real
3. WHEN pagamento estiver processando THEN deve mostrar status de carregamento
4. WHEN pagamento for confirmado THEN deve redirecionar para página de sucesso
5. WHEN pagamento falhar THEN deve exibir mensagem de erro clara e opções de retry

### Requirement 9 - Programa de Afiliados

**User Story:** Como afiliado, eu quero receber comissões automáticas pelas indicações que resultarem em pagamentos, para que seja incentivado a promover a COMADEMIG.

#### Acceptance Criteria

1. WHEN afiliado se cadastrar THEN deve ser obrigatório informar walletId válido antes da ativação
2. WHEN walletId for informado THEN deve validar no Asaas antes de ativar conta de afiliado
3. WHEN indicação resultar em pagamento THEN deve calcular 20% de comissão automaticamente
4. WHEN split for processado THEN deve transferir comissão diretamente para wallet do afiliado
5. WHEN consultar comissões THEN deve mostrar histórico detalhado de ganhos
6. WHEN afiliado não tiver wallet válida THEN não deve permitir ativação do perfil de afiliado

### Requirement 10 - Auditoria e Logs

**User Story:** Como administrador técnico, eu quero logs detalhados de todas as transações, para que possa auditar o sistema e resolver problemas rapidamente.

#### Acceptance Criteria

1. WHEN processar pagamento THEN deve registrar payload completo da requisição
2. WHEN receber webhook THEN deve salvar evento completo com timestamp
3. WHEN ocorrer erro THEN deve registrar stack trace e contexto completo
4. WHEN consultar logs THEN deve permitir filtros por usuário, data e tipo de transação
5. WHEN dados sensíveis forem logados THEN deve criptografar informações de cartão

### Requirement 11 - Notificações Administrativas

**User Story:** Como administrador, eu quero ser notificado automaticamente quando serviços forem pagos, para que possa processar as solicitações rapidamente.

#### Acceptance Criteria

1. WHEN serviço pontual for pago THEN deve enviar notificação via email/Slack
2. WHEN assinatura for criada THEN deve notificar equipe de boas-vindas
3. WHEN pagamento falhar THEN deve alertar equipe financeira
4. WHEN split não for aplicado THEN deve notificar administradores técnicos
5. WHEN webhook falhar repetidamente THEN deve escalar para equipe técnica

### Requirement 12 - Segurança e Validações

**User Story:** Como responsável pela segurança, eu quero que o sistema seja robusto contra fraudes e ataques, para que os dados financeiros estejam protegidos.

#### Acceptance Criteria

1. WHEN receber requisição THEN deve validar todos os parâmetros de entrada
2. WHEN processar cartão THEN deve usar tokenização e nunca armazenar dados sensíveis
3. WHEN receber webhook THEN deve validar origem e assinatura
4. WHEN detectar tentativa de fraude THEN deve bloquear e registrar incidente
5. WHEN armazenar dados THEN deve criptografar informações sensíveis

### Requirement 13 - Tokenização Persistente para Assinaturas

**User Story:** Como sistema, eu quero persistir tokens de cartão de forma segura, para que as renovações automáticas de assinaturas funcionem corretamente.

#### Acceptance Criteria

1. WHEN criar assinatura com cartão THEN deve persistir token de forma segura vinculado ao subscription
2. WHEN renovação automática ocorrer THEN deve utilizar token persistido para cobrança
3. WHEN token expirar THEN deve notificar usuário para atualizar dados do cartão
4. WHEN armazenar token THEN deve usar apenas referência do Asaas, nunca dados sensíveis
5. WHEN usuário cancelar THEN deve invalidar tokens associados

### Requirement 14 - Conciliação de Split

**User Story:** Como administrador financeiro, eu quero validar que os splits foram processados corretamente pelo Asaas, para garantir conformidade nos repasses.

#### Acceptance Criteria

1. WHEN pagamento com split for processado THEN deve registrar valores calculados internamente
2. WHEN executar conciliação THEN deve consultar API Asaas para verificar repasses reais
3. WHEN encontrar divergência THEN deve registrar em audit_logs e notificar administradores
4. WHEN conciliação for executada THEN deve rodar automaticamente via job diário
5. WHEN split estiver correto THEN deve marcar transação como conciliada