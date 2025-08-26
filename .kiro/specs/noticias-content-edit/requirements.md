# Requirements Document

## Introduction

Este documento define os requisitos para o desenvolvimento da interface de edição da página "Notícias" no painel administrativo. O módulo permitirá aos administradores gerenciar o conteúdo da página pública de notícias, incluindo notícia de destaque, lista de notícias secundárias e seção de newsletter. A interface deve integrar-se aos sistemas de rotas e banco de dados existentes sem criar duplicidade ou alterar a estrutura atual.

## Requirements

### Requirement 1

**User Story:** Como administrador do sistema, eu quero editar a notícia de destaque, para que eu possa controlar qual notícia principal aparece com maior visibilidade na página pública.

#### Acceptance Criteria

1. WHEN o administrador acessa a página de edição de notícias THEN o sistema SHALL exibir uma seção "Notícia de Destaque" com campos editáveis
2. WHEN o administrador preenche o campo "Título" THEN o sistema SHALL aceitar texto de até 200 caracteres
3. WHEN o administrador faz upload de uma imagem principal THEN o sistema SHALL validar o formato (JPG, PNG, WebP) e tamanho máximo de 5MB
4. WHEN o administrador edita o campo "Conteúdo" THEN o sistema SHALL permitir formatação de texto incluindo links para outras páginas do site
5. WHEN o administrador salva as alterações THEN o sistema SHALL persistir os dados no banco de dados e exibir mensagem de confirmação

### Requirement 2

**User Story:** Como administrador do sistema, eu quero gerenciar uma lista de notícias secundárias, para que eu possa manter o conteúdo da seção "Outras Notícias" atualizado.

#### Acceptance Criteria

1. WHEN o administrador acessa a seção "Outras Notícias" THEN o sistema SHALL exibir uma lista das notícias existentes com opção de editar cada uma
2. WHEN o administrador clica em "Adicionar Nova Notícia" THEN o sistema SHALL criar um novo formulário com todos os campos necessários
3. WHEN o administrador preenche os campos obrigatórios (título, imagem, data, autor, resumo, conteúdo) THEN o sistema SHALL validar cada campo antes de permitir o salvamento
4. WHEN o administrador seleciona "Remover" em uma notícia THEN o sistema SHALL solicitar confirmação antes de excluir permanentemente
5. WHEN o administrador edita uma notícia existente THEN o sistema SHALL carregar os dados atuais nos campos do formulário
6. IF o campo "Título da Notícia" estiver vazio THEN o sistema SHALL exibir erro de validação
7. IF o campo "Data da Publicação" contiver data inválida THEN o sistema SHALL exibir erro de formato

### Requirement 3

**User Story:** Como administrador do sistema, eu quero configurar diferentes tipos de mídia para as notícias, para que eu possa incluir tanto imagens quanto vídeos do YouTube nas publicações.

#### Acceptance Criteria

1. WHEN o administrador edita uma notícia THEN o sistema SHALL exibir um campo "Tipo de Mídia" com opções "Imagem" e "Vídeo"
2. IF o administrador seleciona "Imagem" como tipo de mídia THEN o sistema SHALL exibir apenas o campo de upload de imagem
3. IF o administrador seleciona "Vídeo" como tipo de mídia THEN o sistema SHALL exibir o campo "Link de Vídeo" para URL do YouTube
4. WHEN o administrador insere um link de vídeo THEN o sistema SHALL validar se é uma URL válida do YouTube
5. WHEN o tipo de mídia é alterado THEN o sistema SHALL limpar os campos do tipo anterior e mostrar os campos do novo tipo

### Requirement 4

**User Story:** Como administrador do sistema, eu quero editar a seção "Receba Nossas Notícias", para que eu possa personalizar o conteúdo da área de newsletter.

#### Acceptance Criteria

1. WHEN o administrador acessa a seção "Receba Nossas Notícias" THEN o sistema SHALL exibir campos editáveis para "Título Principal" e "Subtítulo"
2. WHEN o administrador edita o "Título Principal" THEN o sistema SHALL aceitar texto de até 100 caracteres
3. WHEN o administrador edita o "Subtítulo" THEN o sistema SHALL permitir texto multilinha de até 500 caracteres
4. WHEN o administrador salva as alterações THEN o sistema SHALL atualizar o conteúdo na página pública imediatamente

### Requirement 5

**User Story:** Como administrador do sistema, eu quero que as alterações sejam salvas de forma consistente, para que eu possa ter controle sobre quando as mudanças são aplicadas à página pública.

#### Acceptance Criteria

1. WHEN o administrador clica em "Salvar Alterações" THEN o sistema SHALL validar todos os campos obrigatórios antes de processar
2. IF algum campo obrigatório estiver vazio ou inválido THEN o sistema SHALL exibir mensagens de erro específicas e impedir o salvamento
3. WHEN o salvamento é bem-sucedido THEN o sistema SHALL exibir mensagem de confirmação e atualizar a página pública
4. IF ocorrer erro durante o salvamento THEN o sistema SHALL exibir mensagem de erro detalhada e manter os dados no formulário
5. WHEN o administrador navega para outra página sem salvar THEN o sistema SHALL alertar sobre alterações não salvas

### Requirement 6

**User Story:** Como administrador do sistema, eu quero que a interface seja integrada ao sistema existente, para que eu não precise de configurações adicionais ou alterações na estrutura atual.

#### Acceptance Criteria

1. WHEN a página de edição de notícias é acessada THEN o sistema SHALL utilizar as rotas existentes do painel administrativo
2. WHEN dados são salvos THEN o sistema SHALL utilizar a estrutura de banco de dados já estabelecida
3. WHEN a página é carregada THEN o sistema SHALL seguir o mesmo padrão visual das outras páginas de edição (Home, Sobre)
4. WHEN o administrador navega entre páginas THEN o sistema SHALL manter a consistência de navegação do painel administrativo
5. IF a página pública de notícias não existir THEN o sistema SHALL criar a estrutura necessária sem afetar outras funcionalidades