# Requirements Document

## Introduction

Este documento especifica os requisitos para implementar um sistema completo de gerenciamento de conteúdo dinâmico para o site COMADEMIG. O sistema permitirá que administradores gerenciem todo o conteúdo do site através de um painel administrativo, sem necessidade de alterações no código.

Atualmente, o sistema possui 9 problemas críticos que impedem o gerenciamento eficiente do conteúdo, incluindo seções invisíveis na Home, páginas com conteúdo hardcoded (Notícias, Multimídia, Privacidade, Termos) e falta de editores no painel administrativo.

## Glossary

- **Content Management System (CMS)**: Sistema de gerenciamento de conteúdo que permite criar, editar e publicar conteúdo digital
- **Admin Panel**: Painel administrativo onde administradores gerenciam o conteúdo do site
- **Dynamic Content**: Conteúdo armazenado em banco de dados e renderizado dinamicamente
- **Hardcoded Content**: Conteúdo fixo no código-fonte que requer alterações de código para ser modificado
- **Home Page**: Página inicial do site COMADEMIG
- **Content Editor**: Interface de edição de conteúdo no painel administrativo
- **Supabase**: Plataforma Backend-as-a-Service utilizada para banco de dados
- **LGPD**: Lei Geral de Proteção de Dados brasileira
- **RLS (Row Level Security)**: Sistema de segurança do Supabase para controle de acesso a dados

## Requirements

### Requirement 1: Corrigir Exibição de Destaques e Notícias na Home

**User Story:** Como visitante do site, eu quero visualizar os destaques da convenção e notícias recentes na página inicial, para que eu possa me manter informado sobre as atividades da COMADEMIG.

#### Acceptance Criteria

1. WHEN THE Home Page carrega, THE System SHALL exibir a seção "Destaques da Convenção" com todos os destaques cadastrados no banco de dados
2. WHEN THE Home Page carrega, THE System SHALL exibir a seção "Notícias Recentes" com as 3 notícias mais recentes cadastradas no banco de dados
3. WHEN um destaque possui imagem, THE System SHALL exibir a imagem do destaque corretamente
4. WHEN uma notícia possui imagem, THE System SHALL exibir a imagem da notícia corretamente
5. WHEN o admin cadastra um novo destaque no painel, THE System SHALL exibir o destaque na Home em até 30 segundos

### Requirement 2: Implementar Rodapé Dinâmico na Home

**User Story:** Como visitante do site, eu quero visualizar informações de contato atualizadas no rodapé da página inicial, para que eu possa entrar em contato com a COMADEMIG facilmente.

#### Acceptance Criteria

1. WHEN THE Home Page carrega, THE System SHALL exibir um rodapé com dados de contato do banco de dados
2. WHEN o rodapé é renderizado, THE System SHALL exibir endereço completo (rua, cidade, estado, CEP)
3. WHEN o rodapé é renderizado, THE System SHALL exibir todos os telefones cadastrados ordenados por ordem
4. WHEN o rodapé é renderizado, THE System SHALL exibir todos os e-mails cadastrados ordenados por ordem
5. WHEN o rodapé é renderizado, THE System SHALL exibir horário de funcionamento com dias, horário e observações
6. WHEN o admin atualiza dados de contato, THE System SHALL refletir as mudanças no rodapé em até 30 segundos

### Requirement 3: Implementar Sistema de Gerenciamento de Notícias

**User Story:** Como administrador, eu quero gerenciar notícias através do painel administrativo, para que eu possa publicar e atualizar notícias sem depender de um desenvolvedor.

#### Acceptance Criteria

1. WHEN THE Admin acessa o painel de gerenciamento de conteúdo, THE System SHALL exibir a página "Notícias" como implementada
2. WHEN THE Admin clica em "Editar" na página Notícias, THE System SHALL abrir o editor de notícias
3. WHEN THE Admin cria uma nova notícia, THE System SHALL salvar título, resumo, conteúdo completo, autor, data, categoria e imagem no banco de dados
4. WHEN THE Admin publica uma notícia, THE System SHALL exibir a notícia na página /noticias em até 30 segundos
5. WHEN um visitante acessa /noticias, THE System SHALL exibir todas as notícias ativas ordenadas por data de publicação
6. WHEN um visitante clica em uma notícia, THE System SHALL exibir a página individual da notícia com conteúdo completo
7. WHERE a notícia possui imagem, THE System SHALL fazer upload da imagem para o Supabase Storage

### Requirement 4: Implementar Sistema de Gerenciamento de Multimídia

**User Story:** Como administrador, eu quero gerenciar vídeos e álbuns de fotos através do painel administrativo, para que eu possa compartilhar conteúdo multimídia dos eventos da COMADEMIG.

#### Acceptance Criteria

1. WHEN THE Admin acessa o painel de gerenciamento de conteúdo, THE System SHALL exibir a página "Multimídia" como implementada
2. WHEN THE Admin clica em "Editar" na página Multimídia, THE System SHALL abrir o editor de multimídia
3. WHEN THE Admin adiciona um vídeo, THE System SHALL salvar título, descrição, URL do YouTube, duração e categoria no banco de dados
4. WHEN THE Admin cria um álbum de fotos, THE System SHALL salvar título, descrição, data do evento e categoria no banco de dados
5. WHERE o admin adiciona fotos a um álbum, THE System SHALL fazer upload das fotos para o Supabase Storage
6. WHEN um visitante acessa /multimidia, THE System SHALL exibir todos os vídeos e álbuns ativos
7. WHEN um visitante clica em um vídeo, THE System SHALL reproduzir o vídeo do YouTube incorporado
8. WHEN um visitante clica em um álbum, THE System SHALL exibir todas as fotos do álbum

### Requirement 5: Implementar Sistema de Gerenciamento de Privacidade

**User Story:** Como administrador, eu quero gerenciar a Política de Privacidade através do painel administrativo, para que eu possa manter a conformidade com a LGPD e atualizar a política quando necessário.

#### Acceptance Criteria

1. WHEN THE Admin acessa o painel de gerenciamento de conteúdo, THE System SHALL exibir a página "Política de Privacidade" como implementada
2. WHEN THE Admin clica em "Editar" na Política de Privacidade, THE System SHALL abrir o editor de privacidade
3. WHEN THE Admin edita o conteúdo, THE System SHALL permitir adicionar, remover e reordenar seções
4. WHEN THE Admin salva alterações, THE System SHALL atualizar automaticamente a data de "última atualização"
5. WHEN um visitante acessa /privacidade, THE System SHALL exibir o conteúdo atualizado do banco de dados
6. WHEN THE Admin atualiza a política, THE System SHALL manter histórico de alterações através do campo last_updated_at

### Requirement 6: Implementar Sistema de Gerenciamento de Termos

**User Story:** Como administrador, eu quero gerenciar os Termos de Uso através do painel administrativo, para que eu possa atualizar os termos legais quando necessário sem depender de um desenvolvedor.

#### Acceptance Criteria

1. WHEN THE Admin acessa o painel de gerenciamento de conteúdo, THE System SHALL exibir a página "Termos de Uso" como implementada
2. WHEN THE Admin clica em "Editar" nos Termos de Uso, THE System SHALL abrir o editor de termos
3. WHEN THE Admin edita o conteúdo, THE System SHALL permitir adicionar, remover e reordenar seções
4. WHEN THE Admin salva alterações, THE System SHALL atualizar automaticamente a data de "última atualização"
5. WHEN um visitante acessa /termos, THE System SHALL exibir o conteúdo atualizado do banco de dados
6. WHEN THE Admin atualiza os termos, THE System SHALL manter histórico de alterações através do campo last_updated_at

### Requirement 7: Corrigir Rodapé Duplicado

**User Story:** Como visitante do site, eu quero visualizar um único rodapé nas páginas de Privacidade e Termos, para que eu tenha uma experiência visual consistente.

#### Acceptance Criteria

1. WHEN um visitante acessa /privacidade, THE System SHALL renderizar apenas um rodapé
2. WHEN um visitante acessa /termos, THE System SHALL renderizar apenas um rodapé
3. WHEN as páginas são carregadas, THE System SHALL aplicar espaçamento correto sem duplicação visual
4. WHEN inspecionado no navegador, THE System SHALL mostrar apenas um elemento Footer no DOM

### Requirement 8: Atualizar Painel de Gerenciamento de Conteúdo

**User Story:** Como administrador, eu quero visualizar o status de todas as páginas do site no painel de gerenciamento, para que eu possa identificar rapidamente quais páginas precisam de atenção.

#### Acceptance Criteria

1. WHEN THE Admin acessa /dashboard/content, THE System SHALL listar todas as 8 páginas gerenciáveis (Home, Sobre, Liderança, Contato, Notícias, Multimídia, Privacidade, Termos)
2. WHEN uma página possui conteúdo personalizado, THE System SHALL exibir badge "Personalizado" em verde
3. WHEN uma página usa conteúdo padrão, THE System SHALL exibir badge "Padrão" em cinza
4. WHEN THE Admin clica em "Editar", THE System SHALL abrir o editor correspondente da página
5. WHEN THE Admin clica em "Ver", THE System SHALL abrir a página pública em nova aba
6. WHEN o painel carrega, THE System SHALL exibir estatísticas: total de páginas, páginas personalizadas, páginas usando padrão

### Requirement 9: Garantir Segurança e Permissões

**User Story:** Como administrador do sistema, eu quero garantir que apenas usuários autorizados possam editar conteúdo, para que o site permaneça seguro e íntegro.

#### Acceptance Criteria

1. WHEN um usuário não autenticado tenta acessar editores, THE System SHALL redirecionar para a página de login
2. WHEN um usuário sem permissão de admin tenta acessar editores, THE System SHALL exibir mensagem de acesso negado
3. WHEN THE System salva conteúdo, THE System SHALL registrar o ID do usuário que fez a alteração no campo last_updated_by
4. WHEN THE System aplica políticas RLS, THE System SHALL permitir leitura pública de conteúdo mas restringir escrita apenas a admins
5. WHEN um admin faz upload de imagem, THE System SHALL validar tipo de arquivo (apenas imagens) e tamanho máximo (5MB)
