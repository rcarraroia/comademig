# Requirements Document - CMS Gerenciador de Conteúdo

## Introduction

O sistema de Gerenciamento de Conteúdo (CMS) da COMADEMIG permite que administradores editem dinamicamente o conteúdo das páginas públicas do site. Atualmente o sistema está parcialmente implementado com inconsistências e funcionalidades incompletas que precisam ser corrigidas e padronizadas.

## Requirements

### Requirement 1 - Sistema de Hooks Unificado

**User Story:** Como desenvolvedor, eu quero um sistema de hooks consistente para gerenciar conteúdo, para que todas as páginas funcionem de forma padronizada.

#### Acceptance Criteria

1. WHEN uma página pública é carregada THEN o sistema SHALL usar hooks específicos (useHomeContent, useAboutContent, etc.)
2. WHEN não há conteúdo customizado THEN o sistema SHALL exibir conteúdo padrão definido nos hooks
3. WHEN há conteúdo customizado THEN o sistema SHALL exibir o conteúdo da base de dados
4. WHEN há erro no carregamento THEN o sistema SHALL exibir fallback gracioso
5. WHEN há loading THEN o sistema SHALL exibir indicador de carregamento

### Requirement 2 - Editores de Conteúdo Funcionais

**User Story:** Como administrador, eu quero editar o conteúdo de todas as páginas públicas através de interfaces intuitivas, para que eu possa manter o site atualizado.

#### Acceptance Criteria

1. WHEN acesso o menu "Gerenciar Conteúdo" THEN o sistema SHALL exibir lista de todas as páginas editáveis
2. WHEN clico em "Editar" de uma página THEN o sistema SHALL abrir o editor específico da página
3. WHEN edito conteúdo THEN o sistema SHALL salvar as alterações na base de dados
4. WHEN salvo alterações THEN o sistema SHALL invalidar cache e atualizar a página pública
5. WHEN há erro no salvamento THEN o sistema SHALL exibir mensagem de erro clara
6. WHEN salvo com sucesso THEN o sistema SHALL exibir confirmação e redirecionar

### Requirement 3 - Editor da Página Inicial (Home)

**User Story:** Como administrador, eu quero editar todos os elementos da página inicial, para que eu possa manter o conteúdo atualizado e relevante.

#### Acceptance Criteria

1. WHEN edito o banner principal THEN o sistema SHALL permitir alterar título, subtítulo, texto e link do botão
2. WHEN edito cards de ação THEN o sistema SHALL permitir alterar título, descrição e link dos 4 cards
3. WHEN gerencio destaques THEN o sistema SHALL permitir adicionar/remover/editar eventos com imagens
4. WHEN gerencio notícias THEN o sistema SHALL permitir adicionar/remover/editar notícias com imagens e datas
5. WHEN edito seção missão THEN o sistema SHALL permitir alterar título, subtítulo, texto e link do botão
6. WHEN faço upload de imagem THEN o sistema SHALL validar formato e tamanho (máx 5MB)

### Requirement 4 - Editor da Página Sobre

**User Story:** Como administrador, eu quero editar o conteúdo da página "Sobre", para que eu possa manter as informações institucionais atualizadas.

#### Acceptance Criteria

1. WHEN edito informações gerais THEN o sistema SHALL permitir alterar título e descrição
2. WHEN edito missão THEN o sistema SHALL permitir alterar título e texto da missão
3. WHEN edito visão THEN o sistema SHALL permitir alterar título e texto da visão
4. WHEN edito história THEN o sistema SHALL permitir alterar título e texto da história
5. WHEN salvo alterações THEN o sistema SHALL atualizar a página pública imediatamente

### Requirement 5 - Editor da Página Liderança

**User Story:** Como administrador, eu quero gerenciar a lista de líderes da organização, para que eu possa manter as informações de liderança atualizadas.

#### Acceptance Criteria

1. WHEN edito informações gerais THEN o sistema SHALL permitir alterar título e descrição
2. WHEN adiciono líder THEN o sistema SHALL permitir inserir nome, cargo, foto, telefone e email
3. WHEN removo líder THEN o sistema SHALL remover da lista com confirmação
4. WHEN edito líder THEN o sistema SHALL permitir alterar todas as informações
5. WHEN faço upload de foto THEN o sistema SHALL redimensionar e otimizar automaticamente

### Requirement 6 - Editor da Página Contato

**User Story:** Como administrador, eu quero editar as informações de contato, para que os visitantes tenham acesso às informações corretas.

#### Acceptance Criteria

1. WHEN edito informações gerais THEN o sistema SHALL permitir alterar título e descrição
2. WHEN edito endereço THEN o sistema SHALL permitir alterar rua, cidade, estado e CEP
3. WHEN gerencio telefones THEN o sistema SHALL permitir adicionar/remover/editar telefones com tipos
4. WHEN gerencio emails THEN o sistema SHALL permitir adicionar/remover/editar emails com tipos
5. WHEN edito horário THEN o sistema SHALL permitir alterar dias e horários de funcionamento

### Requirement 7 - Sistema de Upload de Imagens

**User Story:** Como administrador, eu quero fazer upload de imagens para o conteúdo, para que eu possa enriquecer visualmente as páginas.

#### Acceptance Criteria

1. WHEN faço upload THEN o sistema SHALL validar formato (jpg, png, webp)
2. WHEN faço upload THEN o sistema SHALL validar tamanho máximo (5MB)
3. WHEN upload é válido THEN o sistema SHALL armazenar no Supabase Storage
4. WHEN upload é concluído THEN o sistema SHALL retornar URL pública
5. WHEN há erro THEN o sistema SHALL exibir mensagem específica do erro

### Requirement 8 - Cache e Performance

**User Story:** Como usuário, eu quero que as páginas carreguem rapidamente, para que eu tenha uma boa experiência de navegação.

#### Acceptance Criteria

1. WHEN conteúdo é carregado THEN o sistema SHALL usar cache do TanStack Query
2. WHEN conteúdo é atualizado THEN o sistema SHALL invalidar cache automaticamente
3. WHEN há cache válido THEN o sistema SHALL servir conteúdo do cache
4. WHEN cache expira THEN o sistema SHALL revalidar em background
5. WHEN há erro de rede THEN o sistema SHALL usar cache stale como fallback

### Requirement 9 - Indicadores Visuais para Administradores

**User Story:** Como administrador, eu quero ver indicadores visuais nas páginas públicas, para que eu saiba quais páginas têm conteúdo customizado.

#### Acceptance Criteria

1. WHEN sou administrador logado THEN o sistema SHALL exibir badge "Conteúdo Personalizado" em páginas customizadas
2. WHEN sou administrador logado THEN o sistema SHALL exibir badge "Conteúdo Padrão" em páginas não customizadas
3. WHEN clico no badge THEN o sistema SHALL redirecionar para o editor da página
4. WHEN não sou administrador THEN o sistema SHALL ocultar todos os badges
5. WHEN há erro no carregamento THEN o sistema SHALL exibir badge de erro apenas para admins

### Requirement 10 - Validação e Tratamento de Erros

**User Story:** Como administrador, eu quero receber feedback claro sobre erros, para que eu possa corrigir problemas rapidamente.

#### Acceptance Criteria

1. WHEN há erro de validação THEN o sistema SHALL exibir mensagem específica do campo
2. WHEN há erro de rede THEN o sistema SHALL exibir opção de tentar novamente
3. WHEN há erro de permissão THEN o sistema SHALL redirecionar para login
4. WHEN há erro de servidor THEN o sistema SHALL exibir mensagem técnica para admins
5. WHEN operação é bem-sucedida THEN o sistema SHALL exibir confirmação clara

### Requirement 11 - Responsividade e Usabilidade

**User Story:** Como administrador, eu quero usar os editores em qualquer dispositivo, para que eu possa gerenciar conteúdo de qualquer lugar.

#### Acceptance Criteria

1. WHEN uso em mobile THEN o sistema SHALL adaptar interface para tela pequena
2. WHEN uso em tablet THEN o sistema SHALL otimizar layout para toque
3. WHEN uso em desktop THEN o sistema SHALL aproveitar espaço disponível
4. WHEN navego entre abas THEN o sistema SHALL manter estado dos formulários
5. WHEN há mudanças não salvas THEN o sistema SHALL avisar antes de sair da página