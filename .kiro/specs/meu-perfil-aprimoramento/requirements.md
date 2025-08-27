# Requirements Document

## Introduction

O aprimoramento do menu "Meu Perfil" visa consolidar funcionalidades de perfil no painel administrativo, removendo redundâncias e implementando novas funcionalidades essenciais como perfil público e download de dados pessoais conforme LGPD.

## Requirements

### Requirement 1

**User Story:** Como um usuário do sistema, eu quero que o menu "Perfil" seja removido e seus itens sejam consolidados no menu "Meu Perfil", para que eu tenha uma navegação mais organizada e intuitiva.

#### Acceptance Criteria

1. WHEN o usuário acessa o painel administrativo THEN o sistema SHALL não exibir o menu "Perfil" na barra lateral
2. WHEN o usuário acessa o menu "Meu Perfil" THEN o sistema SHALL exibir os itens "Atividade Recente" e "Zona de Perigo" junto com os itens existentes
3. WHEN o layout do menu "Meu Perfil" é renderizado THEN o sistema SHALL manter o estilo e layout atual, apenas adicionando os novos itens

### Requirement 2

**User Story:** Como um membro da igreja, eu quero criar e gerenciar um perfil público, para que outras pessoas possam visualizar informações profissionais sobre mim de forma controlada.

#### Acceptance Criteria

1. WHEN o usuário acessa "Ver Perfil Público" THEN o sistema SHALL exibir uma interface de gerenciamento de perfil público
2. WHEN o usuário edita seu perfil público THEN o sistema SHALL permitir adicionar foto de perfil pública diferente da carteira
3. WHEN o usuário edita biografia THEN o sistema SHALL permitir escrever um texto descritivo sobre si mesmo
4. WHEN o usuário adiciona links sociais THEN o sistema SHALL permitir inserir URLs para redes sociais e contatos profissionais
5. WHEN o usuário clica em "Visualizar" THEN o sistema SHALL abrir a URL do perfil público em nova aba
6. IF o usuário não configurou perfil público THEN o sistema SHALL exibir opção para criar um novo perfil
7. WHEN o perfil público é salvo THEN o sistema SHALL gerar uma URL única e acessível publicamente

### Requirement 3

**User Story:** Como um usuário preocupado com privacidade, eu quero baixar todos os meus dados pessoais do sistema, para que eu possa ter controle sobre minhas informações conforme a LGPD.

#### Acceptance Criteria

1. WHEN o usuário clica em "Baixar Meus Dados" THEN o sistema SHALL gerar um arquivo com todos os dados pessoais do usuário
2. WHEN o arquivo é gerado THEN o sistema SHALL incluir nome, e-mail, informações da igreja, dados de cadastro e outras informações fornecidas
3. WHEN o download é iniciado THEN o sistema SHALL fornecer o arquivo em formato JSON ou CSV organizado e legível
4. WHEN o processo de download falha THEN o sistema SHALL exibir mensagem de erro clara e opção para tentar novamente
5. WHEN o arquivo é baixado THEN o sistema SHALL registrar a ação para auditoria de conformidade LGPD

### Requirement 4

**User Story:** Como um usuário do sistema, eu quero visualizar minha atividade recente no perfil, para que eu possa acompanhar minhas ações e interações no sistema.

#### Acceptance Criteria

1. WHEN o usuário acessa "Atividade Recente" THEN o sistema SHALL exibir uma lista cronológica das últimas ações do usuário
2. WHEN a atividade é carregada THEN o sistema SHALL mostrar data, hora, tipo de ação e descrição de cada atividade
3. WHEN não há atividade recente THEN o sistema SHALL exibir mensagem informativa sobre ausência de atividades
4. WHEN há muitas atividades THEN o sistema SHALL implementar paginação ou carregamento incremental

### Requirement 5

**User Story:** Como um usuário que precisa gerenciar configurações sensíveis, eu quero acessar a "Zona de Perigo" no meu perfil, para que eu possa realizar ações críticas como exclusão de conta de forma segura.

#### Acceptance Criteria

1. WHEN o usuário acessa "Zona de Perigo" THEN o sistema SHALL exibir ações críticas com avisos claros sobre consequências
2. WHEN o usuário tenta executar ação perigosa THEN o sistema SHALL solicitar confirmação adicional (senha ou código)
3. WHEN ação crítica é confirmada THEN o sistema SHALL executar a ação e fornecer feedback sobre o resultado
4. WHEN o usuário cancela ação crítica THEN o sistema SHALL retornar ao estado anterior sem executar a ação

### Requirement 6

**User Story:** Como um desenvolvedor do sistema, eu quero que todas as funcionalidades do perfil sejam responsivas e acessíveis, para que usuários em diferentes dispositivos tenham uma experiência consistente.

#### Acceptance Criteria

1. WHEN o usuário acessa qualquer seção do perfil em dispositivo móvel THEN o sistema SHALL adaptar o layout adequadamente
2. WHEN o usuário navega usando teclado THEN o sistema SHALL fornecer navegação acessível por teclas
3. WHEN o usuário usa leitor de tela THEN o sistema SHALL fornecer labels e descrições adequadas para acessibilidade
4. WHEN há erro em qualquer funcionalidade THEN o sistema SHALL exibir mensagens de erro claras e acionáveis