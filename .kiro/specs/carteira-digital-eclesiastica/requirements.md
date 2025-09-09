# Requirements Document

## Introduction

O sistema de Carteira Digital Eclesiástica é uma funcionalidade que permite aos membros da igreja visualizar, gerenciar e compartilhar sua identificação eclesiástica de forma digital. O sistema inclui geração de QR Code, download de PDF, sincronização automática de foto de perfil e validação via URL.

## Requirements

### Requirement 1

**User Story:** Como um membro da igreja, eu quero visualizar minha carteira digital de identificação eclesiástica, para que eu possa ter acesso rápido às minhas informações de membro.

#### Acceptance Criteria

1. WHEN o usuário acessa a página de carteira digital THEN o sistema SHALL exibir as informações do membro (nome, cargo, foto, data de cadastro)
2. WHEN o usuário não possui foto de perfil THEN o sistema SHALL exibir um avatar padrão com as iniciais do nome
3. IF o usuário possui foto de perfil THEN o sistema SHALL sincronizar automaticamente a foto na carteira

### Requirement 2

**User Story:** Como um membro da igreja, eu quero gerar um QR Code da minha carteira, para que outras pessoas possam validar minha identificação rapidamente.

#### Acceptance Criteria

1. WHEN o usuário clica no botão "Ver QR Code" THEN o sistema SHALL gerar um QR Code único contendo a URL de validação
2. WHEN o QR Code é gerado THEN o sistema SHALL exibir o código em um modal com opções de compartilhamento
3. WHEN o usuário fecha o modal THEN o sistema SHALL manter o QR Code válido para uso posterior

### Requirement 3

**User Story:** Como um membro da igreja, eu quero baixar minha carteira em formato PDF, para que eu possa ter uma versão física ou digital para arquivo.

#### Acceptance Criteria

1. WHEN o usuário clica no botão "Baixar PDF" THEN o sistema SHALL gerar um PDF da carteira com todas as informações
2. WHEN o PDF é gerado THEN o sistema SHALL incluir a foto do usuário, informações pessoais e QR Code
3. WHEN o download é iniciado THEN o sistema SHALL fornecer feedback visual do progresso

### Requirement 4

**User Story:** Como um administrador ou membro, eu quero validar a autenticidade de uma carteira digital via URL ou QR Code, para que eu possa verificar se a identificação é legítima.

#### Acceptance Criteria

1. WHEN alguém acessa a URL de validação THEN o sistema SHALL exibir as informações públicas do membro
2. WHEN a URL contém um ID válido THEN o sistema SHALL mostrar status "Válido" com informações do membro
3. WHEN a URL contém um ID inválido THEN o sistema SHALL mostrar status "Inválido" com mensagem de erro
4. WHEN a validação é bem-sucedida THEN o sistema SHALL exibir nome, cargo e foto do membro

### Requirement 5

**User Story:** Como um usuário, eu quero que minha foto de perfil seja sincronizada automaticamente com a carteira, para que eu não precise atualizar manualmente em múltiplos locais.

#### Acceptance Criteria

1. WHEN o usuário atualiza sua foto de perfil THEN o sistema SHALL automaticamente refletir a mudança na carteira digital
2. WHEN o usuário remove sua foto de perfil THEN o sistema SHALL voltar a exibir o avatar com iniciais
3. WHEN há erro no carregamento da foto THEN o sistema SHALL usar o avatar padrão como fallback

### Requirement 6

**User Story:** Como um usuário, eu quero ter feedback visual das ações na carteira digital, para que eu saiba quando operações estão sendo processadas.

#### Acceptance Criteria

1. WHEN o usuário clica em "Sincronizar Foto" THEN o sistema SHALL exibir um indicador de carregamento
2. WHEN a sincronização é concluída THEN o sistema SHALL mostrar uma mensagem de sucesso
3. WHEN há erro em qualquer operação THEN o sistema SHALL exibir uma mensagem de erro clara
4. WHEN o PDF está sendo gerado THEN o sistema SHALL mostrar progresso da operação