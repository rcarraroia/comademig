# Requirements Document - Integração Completa API Asaas

## Introduction

Este documento especifica os requisitos para implementar a integração completa e funcional com a API do Asaas no sistema COMADEMIG. A implementação atual está apenas simulada (30% completa) e precisa ser transformada em uma integração real que permita processamento de pagamentos, gestão de clientes, webhooks e todas as funcionalidades necessárias para operação comercial.

## Requirements

### Requirement 1 - Configuração Base da API Asaas

**User Story:** Como administrador do sistema, eu quero configurar as credenciais e ambiente da API Asaas, para que o sistema possa se comunicar com o gateway de pagamento.

#### Acceptance Criteria

1. WHEN o sistema é configurado THEN SHALL existir variáveis de ambiente para ASAAS_API_KEY, ASAAS_ENVIRONMENT, ASAAS_WEBHOOK_TOKEN e ASAAS_BASE_URL
2. WHEN o ambiente é sandbox THEN SHALL usar a URL https://api-sandbox.asaas.com/v3
3. WHEN o ambiente é production THEN SHALL usar a URL https://api.asaas.com/v3
4. WHEN as credenciais são inválidas THEN SHALL retornar erro 401 com mensagem clara
5. WHEN o sistema inicia THEN SHALL validar conectividade com a API Asaas

### Requirement 2 - Estrutura de Banco de Dados Completa

**User Story:** Como desenvolvedor, eu quero que todas as tabelas necessárias existam no banco de dados, para que o sistema possa armazenar dados de pagamentos corretamente.

#### Acceptance Criteria

1. WHEN o sistema é implantado THEN SHALL existir a tabela asaas_cobrancas com todos os campos necessários
2. WHEN uma cobrança é criada THEN SHALL ser salva com service_type e service_data
3. WHEN um webhook é recebido THEN SHALL ser armazenado na tabela asaas_webhooks
4. WHEN um split é configurado THEN SHALL ser salvo na tabela asaas_splits
5. WHEN dados são consultados THEN SHALL respeitar políticas RLS configuradas

### Requirement 3 - Gestão de Clientes Asaas

**User Story:** Como sistema, eu quero criar e gerenciar clientes no Asaas automaticamente, para que cada usuário tenha um customer_id válido para cobranças.

#### Acceptance Criteria

1. WHEN um usuário faz primeira compra THEN SHALL criar cliente no Asaas automaticamente
2. WHEN cliente já existe THEN SHALL reutilizar customer_id existente
3. WHEN dados do cliente são atualizados THEN SHALL sincronizar com Asaas
4. WHEN CPF/CNPJ é inválido THEN SHALL retornar erro de validação
5. WHEN cliente é criado THEN SHALL salvar customer_id no perfil do usuário

### Requirement 4 - Processamento de Cobranças PIX

**User Story:** Como usuário, eu quero pagar via PIX, para que possa realizar pagamentos instantâneos com desconto.

#### Acceptance Criteria

1. WHEN usuário escolhe PIX THEN SHALL gerar QR Code válido via API Asaas
2. WHEN cobrança PIX é criada THEN SHALL aplicar desconto de 5%
3. WHEN QR Code é gerado THEN SHALL retornar código copia-e-cola
4. WHEN pagamento PIX é confirmado THEN SHALL receber webhook de confirmação
5. WHEN PIX expira THEN SHALL permitir gerar novo código

### Requirement 5 - Processamento de Cartão de Crédito

**User Story:** Como usuário, eu quero pagar com cartão de crédito, para que tenha flexibilidade de pagamento.

#### Acceptance Criteria

1. WHEN usuário informa dados do cartão THEN SHALL tokenizar via API Asaas
2. WHEN cartão é válido THEN SHALL processar pagamento imediatamente
3. WHEN cartão é recusado THEN SHALL retornar erro específico
4. WHEN pagamento é aprovado THEN SHALL confirmar via webhook
5. WHEN é assinatura THEN SHALL salvar token para cobrança recorrente

### Requirement 6 - Processamento de Boleto Bancário

**User Story:** Como usuário, eu quero pagar via boleto bancário, para que possa pagar em bancos ou lotéricas.

#### Acceptance Criteria

1. WHEN usuário escolhe boleto THEN SHALL gerar boleto via API Asaas
2. WHEN boleto é gerado THEN SHALL retornar linha digitável e URL do PDF
3. WHEN boleto é pago THEN SHALL receber confirmação via webhook
4. WHEN boleto vence THEN SHALL permitir gerar segunda via
5. WHEN boleto é cancelado THEN SHALL atualizar status no sistema

### Requirement 7 - Sistema de Webhooks

**User Story:** Como sistema, eu quero receber notificações automáticas do Asaas, para que possa atualizar status de pagamentos em tempo real.

#### Acceptance Criteria

1. WHEN webhook é recebido THEN SHALL validar token de autenticação
2. WHEN evento é PAYMENT_RECEIVED THEN SHALL atualizar status da cobrança
3. WHEN evento é PAYMENT_OVERDUE THEN SHALL marcar como vencido
4. WHEN webhook falha THEN SHALL tentar reprocessar até 3 vezes
5. WHEN webhook é processado THEN SHALL marcar como processed=true

### Requirement 8 - Filiação com Pagamento Real

**User Story:** Como usuário, eu quero me filiar à COMADEMIG com pagamento real, para que minha filiação seja processada corretamente.

#### Acceptance Criteria

1. WHEN usuário completa filiação THEN SHALL criar cobrança no Asaas
2. WHEN pagamento é confirmado THEN SHALL ativar assinatura
3. WHEN é pagamento recorrente THEN SHALL criar assinatura no Asaas
4. WHEN filiação é aprovada THEN SHALL enviar email de confirmação
5. WHEN pagamento falha THEN SHALL manter status pendente

### Requirement 9 - Sistema de Certidões Funcional

**User Story:** Como usuário, eu quero solicitar certidões com pagamento real, para que possa obter documentos oficiais.

#### Acceptance Criteria

1. WHEN usuário solicita certidão THEN SHALL calcular valor correto
2. WHEN pagamento é confirmado THEN SHALL criar solicitação com status "pago"
3. WHEN certidão é processada THEN SHALL notificar usuário
4. WHEN PDF é gerado THEN SHALL disponibilizar para download
5. WHEN há erro no pagamento THEN SHALL permitir nova tentativa

### Requirement 10 - Sistema de Regularização Funcional

**User Story:** Como usuário, eu quero regularizar minha igreja com pagamento real, para que possa obter documentação necessária.

#### Acceptance Criteria

1. WHEN usuário seleciona serviços THEN SHALL calcular valor total
2. WHEN todos serviços são selecionados THEN SHALL aplicar desconto de 15%
3. WHEN pagamento é confirmado THEN SHALL criar solicitação
4. WHEN serviços são processados THEN SHALL notificar conclusão
5. WHEN há combo completo THEN SHALL aplicar desconto automaticamente

### Requirement 11 - Sistema de Split para Afiliados

**User Story:** Como afiliado, eu quero receber comissões automaticamente, para que seja incentivado a indicar novos clientes.

#### Acceptance Criteria

1. WHEN pagamento tem afiliado THEN SHALL configurar split no Asaas
2. WHEN pagamento é confirmado THEN SHALL dividir valor automaticamente
3. WHEN comissão é creditada THEN SHALL notificar afiliado
4. WHEN há erro no split THEN SHALL registrar para reprocessamento
5. WHEN afiliado é inválido THEN SHALL processar sem split

### Requirement 12 - Dashboard Financeiro

**User Story:** Como administrador, eu quero visualizar dados financeiros em tempo real, para que possa acompanhar performance do sistema.

#### Acceptance Criteria

1. WHEN acesso dashboard THEN SHALL mostrar receita total do mês
2. WHEN há pagamentos pendentes THEN SHALL exibir lista atualizada
3. WHEN há splits processados THEN SHALL mostrar comissões pagas
4. WHEN há erros THEN SHALL destacar problemas que precisam atenção
5. WHEN dados são filtrados THEN SHALL aplicar filtros corretamente

### Requirement 13 - Tratamento de Erros e Recuperação

**User Story:** Como sistema, eu quero tratar erros graciosamente, para que usuários tenham boa experiência mesmo quando há problemas.

#### Acceptance Criteria

1. WHEN API Asaas está indisponível THEN SHALL mostrar mensagem amigável
2. WHEN pagamento falha THEN SHALL sugerir métodos alternativos
3. WHEN webhook falha THEN SHALL tentar reprocessar automaticamente
4. WHEN há erro de validação THEN SHALL mostrar campos específicos
5. WHEN sistema recupera THEN SHALL processar pendências automaticamente

### Requirement 14 - Segurança e Auditoria

**User Story:** Como administrador, eu quero que todas as transações sejam seguras e auditáveis, para que o sistema seja confiável.

#### Acceptance Criteria

1. WHEN webhook é recebido THEN SHALL validar assinatura/token
2. WHEN dados sensíveis são armazenados THEN SHALL criptografar
3. WHEN transação ocorre THEN SHALL registrar log de auditoria
4. WHEN há tentativa de fraude THEN SHALL bloquear e alertar
5. WHEN dados são acessados THEN SHALL respeitar permissões RLS

### Requirement 15 - Testes e Validação

**User Story:** Como desenvolvedor, eu quero que o sistema seja testável, para que possa validar funcionalidades em ambiente seguro.

#### Acceptance Criteria

1. WHEN em ambiente sandbox THEN SHALL usar dados de teste
2. WHEN testa pagamento THEN SHALL usar cartões de teste do Asaas
3. WHEN testa webhook THEN SHALL simular eventos corretamente
4. WHEN valida integração THEN SHALL verificar todos os fluxos
5. WHEN há erro em teste THEN SHALL reportar detalhes específicos