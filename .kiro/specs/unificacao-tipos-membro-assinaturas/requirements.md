# Requirements Document

## Introduction

Este documento define os requisitos para a unificação do sistema de tipos de membro e assinaturas do COMADEMIG. O objetivo é eliminar a redundância e inconsistência de dados, unificando a definição de Cargo/Tipo de Membro e seu Plano Financeiro/Assinatura em um único fluxo de cadastro transacional e atômico.

Atualmente, o sistema possui dois formulários separados (um para tipos de membro e outro para planos de assinatura) que geram risco de desvinculação e inconsistência de dados. A solução proposta unifica esses processos em uma única operação transacional.

## Requirements

### Requirement 1: Formulário Administrativo Unificado

**User Story:** Como administrador do sistema, eu quero criar tipos de membro com seus planos financeiros associados em um único formulário, para que eu possa garantir a consistência dos dados e eliminar a redundância de cadastros.

#### Acceptance Criteria

1. WHEN o administrador acessa a tela de tipos de membro THEN o sistema SHALL exibir um formulário unificado contendo seções para dados do cargo e configuração financeira
2. WHEN o administrador preenche o nome do tipo de membro THEN o sistema SHALL validar que o nome é único no banco de dados
3. WHEN o administrador preenche o título do plano THEN o sistema SHALL validar que o título é único no banco de dados
4. WHEN o administrador informa o valor da contribuição THEN o sistema SHALL validar que o valor é no mínimo R$ 25,00
5. WHEN o administrador seleciona a frequência de cobrança THEN o sistema SHALL aceitar apenas as opções 'Mensal' ou 'Anual'
6. WHEN o administrador submete o formulário com dados válidos THEN o sistema SHALL executar uma transação atômica criando o tipo de membro, plano de assinatura e relacionamento entre eles
7. IF qualquer etapa da transação falhar THEN o sistema SHALL fazer rollback de todas as operações e exibir mensagem de erro apropriada

### Requirement 2: Integração com Gateway de Pagamento

**User Story:** Como administrador do sistema, eu quero que os planos criados sejam automaticamente registrados no gateway de pagamento, para que os usuários possam efetuar pagamentos sem configuração adicional.

#### Acceptance Criteria

1. WHEN um novo tipo de membro com plano é criado THEN o sistema SHALL registrar o plano no gateway Asaas automaticamente
2. WHEN o gateway retorna o ID do plano THEN o sistema SHALL armazenar este ID na tabela subscription_plans
3. IF a criação do plano no gateway falhar THEN o sistema SHALL fazer rollback da transação completa e exibir erro específico
4. WHEN o plano é criado com sucesso THEN o sistema SHALL confirmar a criação tanto no banco local quanto no gateway

### Requirement 3: Interface Pública Simplificada

**User Story:** Como usuário interessado em se filiar, eu quero selecionar apenas o tipo de membro desejado e ver automaticamente o plano financeiro associado, para que eu tenha uma experiência mais simples e clara no processo de filiação.

#### Acceptance Criteria

1. WHEN o usuário acessa a página de filiação THEN o sistema SHALL exibir um dropdown com todos os tipos de membro ativos
2. WHEN o usuário seleciona um tipo de membro THEN o sistema SHALL exibir automaticamente o resumo de cobrança com título do plano e valor
3. WHEN o usuário confirma a seleção THEN o sistema SHALL armazenar todos os dados unificados (tipo de membro + plano) no estado da aplicação
4. WHEN o usuário prossegue para o checkout THEN o sistema SHALL enviar os dados do plano já definido, sem permitir alteração
5. WHEN o sistema busca tipos de membro THEN o sistema SHALL retornar dados desnormalizados incluindo informações financeiras

### Requirement 4: Validações e Regras de Negócio

**User Story:** Como administrador do sistema, eu quero que o sistema aplique validações rigorosas nos dados de entrada, para que eu possa manter a integridade e consistência dos dados cadastrais e financeiros.

#### Acceptance Criteria

1. WHEN o nome do tipo de membro é informado THEN o sistema SHALL verificar unicidade na tabela member_types
2. WHEN o título do plano é informado THEN o sistema SHALL verificar unicidade na tabela subscription_plans
3. WHEN o valor da contribuição é informado THEN o sistema SHALL validar que é maior ou igual a R$ 25,00
4. WHEN a frequência de cobrança é selecionada THEN o sistema SHALL aceitar apenas 'Mensal' ou 'Anual'
5. WHEN dados obrigatórios estão ausentes THEN o sistema SHALL exibir mensagens de erro específicas para cada campo
6. WHEN há tentativa de duplicação THEN o sistema SHALL exibir mensagem informando qual campo possui valor duplicado

### Requirement 5: Reestruturação do Menu Administrativo

**User Story:** Como administrador do sistema, eu quero que o menu administrativo reflita a nova estrutura unificada, para que eu possa navegar de forma intuitiva entre as funcionalidades de gestão.

#### Acceptance Criteria

1. WHEN o administrador acessa o painel administrativo THEN o sistema SHALL exibir o menu "Tipos de Membro" como tela principal para criação unificada
2. WHEN o administrador acessa o menu de assinaturas THEN o sistema SHALL renomear para "Gateway de Pagamento" focado em monitoramento e configuração técnica
3. WHEN o administrador clica em "Tipos de Membro" THEN o sistema SHALL exibir a listagem com opção de criar novo tipo unificado
4. WHEN o administrador visualiza tipos existentes THEN o sistema SHALL exibir tanto dados do cargo quanto informações financeiras associadas

### Requirement 6: Compatibilidade com Dados Existentes

**User Story:** Como administrador do sistema, eu quero que os tipos de membro e planos já cadastrados continuem funcionando normalmente, para que não haja interrupção no serviço durante a transição.

#### Acceptance Criteria

1. WHEN o sistema é atualizado THEN todos os tipos de membro existentes SHALL continuar funcionando
2. WHEN o sistema é atualizado THEN todos os planos de assinatura existentes SHALL continuar funcionando
3. WHEN usuários existentes fazem login THEN o sistema SHALL reconhecer seus tipos de membro e planos corretamente
4. WHEN novos cadastros são feitos THEN o sistema SHALL usar o novo fluxo unificado
5. WHEN dados legados são acessados THEN o sistema SHALL apresentá-los de forma consistente com a nova interface

### Requirement 7: Transações Atômicas e Integridade

**User Story:** Como desenvolvedor do sistema, eu quero que todas as operações de criação sejam transacionais e atômicas, para que eu possa garantir a integridade dos dados mesmo em caso de falhas.

#### Acceptance Criteria

1. WHEN uma criação unificada é iniciada THEN o sistema SHALL iniciar uma transação no PostgreSQL
2. WHEN todas as inserções são bem-sucedidas THEN o sistema SHALL fazer commit da transação
3. IF qualquer inserção falhar THEN o sistema SHALL fazer rollback completo da transação
4. WHEN a transação é concluída THEN o sistema SHALL confirmar que todas as três tabelas foram atualizadas corretamente
5. WHEN há erro de conectividade THEN o sistema SHALL tratar o erro e manter a consistência dos dados