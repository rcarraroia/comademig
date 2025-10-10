# Requirements Document

## Introduction

Este documento define os requisitos para a refatoração e correção de três módulos críticos do sistema COMADEMIG: Suporte (Tickets), Afiliados e Split de Pagamentos. O objetivo é corrigir problemas existentes, completar implementações parciais e criar um sistema de split genérico e escalável que permita configuração centralizada de repasses para múltiplos beneficiários.

Os três módulos apresentam diferentes níveis de maturidade:
- **Suporte**: Implementado mas com inconsistências que impedem funcionamento correto
- **Afiliados**: Parcialmente implementado, necessita conclusão e painel administrativo
- **Split de Pagamentos**: Implementado incorretamente (divisão única ao invés de tripla) e sem interface de gestão

## Requirements

### Requirement 1: Correção do Módulo de Suporte

**User Story:** Como usuário do sistema, quero criar tickets de suporte que sejam corretamente salvos no banco de dados e visíveis tanto no meu painel quanto no painel administrativo, para que eu possa receber atendimento adequado.

#### Acceptance Criteria

1. WHEN um usuário cria um ticket THEN o sistema SHALL salvar o ticket na tabela `support_tickets` com todos os campos obrigatórios preenchidos
2. WHEN um ticket é criado THEN o sistema SHALL exibir o ticket na lista de tickets do usuário em `/dashboard/suporte`
3. WHEN um ticket é criado THEN o sistema SHALL exibir o ticket no painel administrativo em `/admin/support`
4. WHEN um usuário ou admin envia uma mensagem THEN o sistema SHALL salvar a mensagem na tabela `support_messages` vinculada ao ticket correto
5. IF existir o hook `useSuporteTickets.ts` THEN o sistema SHALL eliminar este hook e garantir que todos os componentes usem apenas `useSupport.ts`
6. WHEN um admin responde a um ticket THEN a mensagem SHALL ser visível ao usuário em tempo real
7. WHEN um ticket é atualizado THEN o sistema SHALL manter todas as funcionalidades existentes (categorias, notas internas, estatísticas)

### Requirement 2: Implementação Completa do Módulo de Afiliados - Painel do Usuário

**User Story:** Como afiliado do programa, quero visualizar meu desempenho, indicações e comissões em um dashboard completo, para que eu possa acompanhar meus ganhos e otimizar minhas indicações.

#### Acceptance Criteria

1. WHEN um afiliado acessa `/dashboard/afiliados` THEN o sistema SHALL exibir um dashboard com saldo acumulado, ganhos pendentes, confirmados e pagos
2. WHEN o dashboard é carregado THEN o sistema SHALL exibir gráficos de desempenho mostrando dados do mês atual e histórico
3. WHEN um afiliado visualiza suas indicações THEN o sistema SHALL exibir uma lista com nome/identificação do indicado, data da indicação e status da conversão (em aberto, pago, cancelado)
4. WHEN um afiliado acessa o histórico de comissões THEN o sistema SHALL exibir valor recebido, status (pendente, pago, cancelado) e data da liberação
5. WHEN um usuário deseja se tornar afiliado THEN o sistema SHALL exigir informação do Wallet ID do Asaas antes de ativar
6. WHEN um cadastro de afiliado é criado THEN o status SHALL ser "pendente" aguardando aprovação do admin
7. WHEN um afiliado ativo acessa ferramentas de divulgação THEN o sistema SHALL exibir link exclusivo do afiliado e QR Code com link de indicação
8. IF o afiliado não informou Wallet ID THEN o sistema SHALL impedir ativação e exibir mensagem clara

### Requirement 3: Implementação Completa do Módulo de Afiliados - Painel Admin

**User Story:** Como administrador, quero gerenciar afiliados, indicações e comissões através de um painel completo, para que eu possa controlar o programa de afiliados de forma eficiente.

#### Acceptance Criteria

1. WHEN um admin acessa a gestão de afiliados THEN o sistema SHALL permitir aprovar, suspender ou banir afiliados
2. WHEN um admin visualiza um afiliado THEN o sistema SHALL exibir dados cadastrais completos incluindo Wallet ID
3. WHEN um admin acessa gestão de indicações THEN o sistema SHALL exibir lista de todos os indicados com status da conversão
4. WHEN um admin aplica filtros THEN o sistema SHALL permitir filtrar por afiliado, status e período
5. WHEN um admin acessa gestão de comissões THEN o sistema SHALL exibir lista de comissões geradas com opção de aprovação manual quando necessário
6. WHEN um admin visualiza histórico THEN o sistema SHALL exibir repasses automáticos via Asaas
7. WHEN um admin acessa relatórios THEN o sistema SHALL exibir afiliados mais ativos, total de indicações e conversões, e volume financeiro movimentado
8. WHEN um admin acessa configurações do programa THEN o sistema SHALL permitir configurar percentual de comissão, regras de elegibilidade e bonificações extras

### Requirement 4: Criação do Módulo Genérico de Split de Pagamentos

**User Story:** Como super administrador, quero configurar de forma centralizada como os pagamentos são divididos entre múltiplos beneficiários, para que eu possa gerenciar repasses de forma transparente e escalável.

#### Acceptance Criteria

1. WHEN o sistema processa um pagamento de filiação THEN o sistema SHALL dividir automaticamente em 40% COMADEMIG, 40% RENUM e 20% Afiliado
2. WHEN o sistema processa um pagamento de serviços (certidões, regularização, outros) THEN o sistema SHALL dividir automaticamente em 60% COMADEMIG e 40% RENUM
3. WHEN o sistema processa um pagamento de publicidade THEN o sistema SHALL atribuir 100% para COMADEMIG (configuração inicial ajustável)
4. IF o beneficiário é do tipo "Fixo" (COMADEMIG, RENUM) THEN o sistema SHALL usar configuração estática
5. IF o beneficiário é do tipo "Dinâmico" (Afiliado) THEN o sistema SHALL buscar o Wallet ID do afiliado indicador
6. WHEN um pagamento é criado THEN o sistema SHALL consultar o módulo de split para obter percentuais corretos
7. WHEN percentuais são enviados ao Asaas THEN o sistema SHALL criar múltiplos splits (um para cada beneficiário)
8. WHEN a soma dos percentuais é calculada THEN o sistema SHALL validar que totaliza exatamente 100%

### Requirement 5: Interface de Gestão de Split - Super Admin

**User Story:** Como super administrador, quero uma interface exclusiva para gerenciar categorias de receita e beneficiários, para que eu possa configurar e auditar o sistema de split de pagamentos.

#### Acceptance Criteria

1. WHEN um super admin acessa `/admin/split-management` THEN o sistema SHALL exibir interface de gestão de split
2. IF o usuário não é super admin THEN o sistema SHALL negar acesso à página de gestão de split
3. WHEN um super admin cria uma categoria de receita THEN o sistema SHALL permitir definir nome, descrição e beneficiários
4. WHEN um super admin adiciona um beneficiário THEN o sistema SHALL permitir definir nome/identificação, tipo (Fixo ou Dinâmico) e percentual
5. WHEN um super admin edita percentuais THEN o sistema SHALL validar que a soma totaliza 100% antes de salvar
6. WHEN um super admin visualiza histórico THEN o sistema SHALL exibir log de todas as alterações de configuração
7. WHEN um super admin acessa relatórios THEN o sistema SHALL exibir quanto foi enviado para cada beneficiário por período
8. WHEN uma cobrança é gerada THEN o sistema SHALL registrar qual configuração de split foi aplicada para auditoria

### Requirement 6: Correção da Estrutura de Banco de Dados

**User Story:** Como desenvolvedor, quero que a estrutura do banco de dados suporte corretamente a divisão tripla de pagamentos, para que o sistema funcione conforme as regras de negócio.

#### Acceptance Criteria

1. WHEN a migração é executada THEN a tabela `asaas_splits` SHALL ter campo `recipient_type` com valores permitidos (comademig, renum, affiliate)
2. WHEN a migração é executada THEN a tabela `asaas_splits` SHALL ter campo `recipient_name` para identificação do beneficiário
3. WHEN a migração é executada THEN a tabela `asaas_splits` SHALL ter campo `recipient_wallet_id` que pode ser NULL para COMADEMIG
4. WHEN um pagamento é processado THEN o sistema SHALL permitir múltiplos registros na tabela `asaas_splits` para o mesmo `payment_id`
5. WHEN a tabela `affiliate_referrals` é criada THEN o sistema SHALL ter campos para affiliate_id, referred_user_id, referral_code, status e conversion_date
6. WHEN tipos TypeScript são atualizados THEN o arquivo `types.ts` SHALL incluir todas as tabelas de suporte, afiliados e split

### Requirement 7: Integração e Fluxo Completo

**User Story:** Como usuário do sistema, quero que todo o fluxo desde a indicação até o pagamento de comissões funcione de forma automática e integrada, para que não haja necessidade de processos manuais.

#### Acceptance Criteria

1. WHEN um usuário se cadastra com código de afiliado THEN o sistema SHALL registrar a indicação na tabela `affiliate_referrals`
2. WHEN um pagamento é criado para usuário indicado THEN o sistema SHALL automaticamente configurar split com os percentuais corretos
3. WHEN um pagamento é confirmado via webhook THEN o sistema SHALL processar automaticamente os splits para todos os beneficiários
4. WHEN splits são processados THEN o sistema SHALL criar transferências no Asaas para RENUM e Afiliado (COMADEMIG recebe direto)
5. WHEN uma comissão é paga THEN o sistema SHALL registrar em `affiliate_commissions` com status "paid"
6. WHEN um afiliado recebe comissão THEN o sistema SHALL enviar notificação informando o valor
7. WHEN um erro ocorre no processamento THEN o sistema SHALL registrar em logs e permitir reprocessamento manual pelo admin

### Requirement 8: Políticas de Segurança e Acesso

**User Story:** Como administrador de sistema, quero que os dados sejam protegidos por políticas RLS adequadas, para que usuários vejam apenas informações autorizadas.

#### Acceptance Criteria

1. WHEN políticas RLS são criadas para `support_tickets` THEN usuários SHALL ver apenas seus próprios tickets
2. WHEN políticas RLS são criadas para `support_tickets` THEN admins e super admins SHALL ver todos os tickets
3. WHEN políticas RLS são criadas para `support_messages` THEN usuários SHALL ver apenas mensagens de seus tickets
4. WHEN políticas RLS são criadas para `affiliates` THEN usuários SHALL ver apenas seu próprio cadastro de afiliado
5. WHEN políticas RLS são criadas para `affiliate_commissions` THEN afiliados SHALL ver apenas suas próprias comissões
6. WHEN políticas RLS são criadas para `asaas_splits` THEN apenas admins e super admins SHALL ter acesso de leitura
7. WHEN políticas RLS são criadas para configurações de split THEN apenas super admins SHALL ter acesso de leitura e escrita
8. WHEN políticas RLS são criadas para `affiliate_referrals` THEN afiliados SHALL ver apenas suas próprias indicações
