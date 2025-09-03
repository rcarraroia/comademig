# Implementation Plan - CMS Gerenciador de Conteúdo

## Visão Geral
Este plano implementa os editores de conteúdo restantes para completar o sistema CMS da COMADEMIG. O editor da página inicial (Home) já está funcionando e servirá como base para os demais.

## Tasks

- [x] 1. Criar componente de upload de imagens reutilizável



  - Implementar componente `ImageUpload` com validação de formato e tamanho
  - Adicionar preview de imagem e indicador de loading
  - Integrar com Supabase Storage usando estrutura de pastas organizada
  - Implementar tratamento de erros específicos para upload
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2. Implementar editor da página Sobre



  - [x] 2.1 Criar hook `useAboutContent` com estrutura de dados específica


    - Definir interface `AboutContentData` com campos missão, visão e história
    - Implementar fallback para conteúdo padrão quando não há customização
    - Adicionar cache e invalidação automática
    - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.2 Criar componente `AboutContentEdit` com formulário completo


    - Implementar campos para título e descrição geral
    - Criar seções editáveis para missão, visão e história
    - Adicionar validação de campos obrigatórios
    - Integrar com hook de mutação para salvamento
    - _Requirements: 2.2, 2.3, 2.4, 2.6_

  - [x] 2.3 Integrar editor com página pública Sobre


    - Atualizar componente da página Sobre para usar `useAboutContent`
    - Implementar fallback gracioso para conteúdo padrão
    - Adicionar indicadores visuais para administradores
    - Testar fluxo completo de edição e visualização
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 3. Implementar editor da página Liderança



  - [x] 3.1 Criar hook `useLeadershipContent` com gerenciamento de lista de líderes


    - Definir interface `LeadershipContentData` com array de líderes
    - Implementar estrutura para dados de cada líder (nome, cargo, foto, contatos)
    - Adicionar ordenação automática por campo `ordem`
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3, 5.4_

  - [x] 3.2 Criar componente `LeadershipContentEdit` com gerenciamento dinâmico


    - Implementar formulário para informações gerais da página
    - Criar interface para adicionar/remover/editar líderes
    - Integrar componente `ImageUpload` para fotos dos líderes
    - Adicionar validação de campos obrigatórios e formatos de contato
    - _Requirements: 2.2, 2.3, 2.4, 2.6, 5.5_

  - [x] 3.3 Integrar editor com página pública Liderança


    - Atualizar componente da página Liderança para usar `useLeadershipContent`
    - Implementar renderização dinâmica da lista de líderes
    - Adicionar tratamento para lista vazia
    - Testar responsividade e layout em diferentes dispositivos
    - _Requirements: 9.1, 9.2, 11.1, 11.2, 11.3_

- [x] 4. Implementar editor da página Contato



  - [x] 4.1 Criar hook `useContactContent` com estrutura de informações de contato


    - Definir interface `ContactContentData` com endereço, telefones e emails
    - Implementar arrays dinâmicos para múltiplos telefones e emails
    - Adicionar validação de formatos (CEP, telefone, email)
    - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 4.2 Criar componente `ContactContentEdit` com formulários dinâmicos


    - Implementar campos para informações gerais e endereço
    - Criar interface para gerenciar múltiplos telefones com tipos
    - Criar interface para gerenciar múltiplos emails com tipos
    - Adicionar campos para horário de funcionamento
    - _Requirements: 2.2, 2.3, 2.4, 2.6_

  - [x] 4.3 Integrar editor com página pública Contato



    - Atualizar componente da página Contato para usar `useContactContent`
    - Implementar renderização dinâmica de telefones e emails
    - Adicionar formatação automática de telefones e CEP
    - Testar integração com mapas se existir
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 5. Melhorar sistema de navegação e UX dos editores



  - [x] 5.1 Atualizar lista de gerenciamento de conteúdo




    - Adicionar links para todos os novos editores
    - Implementar indicadores de status (customizado/padrão) para cada página
    - Adicionar preview rápido do conteúdo atual
    - Melhorar layout responsivo da lista
    - _Requirements: 2.1, 9.1, 9.2, 11.1, 11.2_

  - [x] 5.2 Implementar componentes compartilhados para consistência


    - Criar `ContentFormLayout` como layout padrão para editores
    - Implementar `SaveButton` com estados de loading e feedback
    - Criar `ContentPreview` para visualização das alterações
    - Padronizar estilos e comportamentos entre editores
    - _Requirements: 2.5, 2.6, 11.4, 11.5_

- [x] 6. Implementar validações e tratamento de erros robusto


  - [x] 6.1 Adicionar validação de formulários com Zod


    - Criar schemas de validação para cada tipo de conteúdo
    - Implementar validação em tempo real nos formulários
    - Adicionar mensagens de erro específicas por campo
    - Integrar com React Hook Form para melhor UX
    - _Requirements: 10.1, 10.2_

  - [x] 6.2 Melhorar tratamento de erros de rede e servidor


    - Implementar retry automático para falhas temporárias
    - Adicionar fallback para modo offline
    - Criar mensagens de erro contextuais para diferentes cenários
    - Implementar logging de erros para debugging
    - _Requirements: 10.2, 10.3, 10.4_

- [x] 7. Adicionar indicadores visuais nas páginas públicas




  - [x] 7.1 Implementar badges de status para administradores




    - Criar componente `ContentStatusBadge` para páginas públicas
    - Adicionar lógica para detectar conteúdo customizado vs padrão
    - Implementar links diretos para editores a partir dos badges
    - Garantir que badges sejam visíveis apenas para admins
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 7.2 Integrar badges em todas as páginas públicas


    - Adicionar badges nas páginas Home, Sobre, Liderança e Contato
    - Implementar posicionamento consistente e não intrusivo
    - Adicionar animações sutis para melhor UX
    - Testar comportamento em diferentes tamanhos de tela
    - _Requirements: 9.5, 11.1, 11.2, 11.3_

- [x] 8. Otimizar performance e cache


  - [x] 8.1 Implementar estratégia de cache otimizada


    - Configurar tempos de cache apropriados para cada tipo de conteúdo
    - Implementar invalidação inteligente após mutações
    - Adicionar prefetch para conteúdo relacionado
    - Otimizar queries para reduzir latência
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 8.2 Otimizar carregamento de imagens


    - Implementar lazy loading para imagens nas páginas públicas
    - Adicionar compressão automática no upload
    - Implementar diferentes tamanhos de imagem conforme necessário
    - Adicionar fallbacks para imagens que falharam ao carregar
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 9. Testes e validação final



  - [x] 9.1 Criar testes unitários para hooks e componentes


    - Testar hooks de conteúdo com diferentes cenários
    - Testar componentes de formulário e validações
    - Testar sistema de upload de imagens
    - Implementar mocks para Supabase nas tests
    - _Requirements: Todos os requirements_

  - [x] 9.2 Realizar testes de integração end-to-end


    - Testar fluxo completo de edição para cada página
    - Validar persistência de dados e invalidação de cache
    - Testar comportamento em diferentes dispositivos
    - Verificar performance e tempos de carregamento
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 9.3 Validar segurança e permissões


    - Testar acesso apenas para usuários admin
    - Validar políticas RLS em diferentes cenários
    - Testar upload de arquivos maliciosos
    - Verificar sanitização de conteúdo dinâmico
    - _Requirements: 10.3, 10.4_

## Notas de Implementação

### Ordem de Prioridade
1. **Alta**: Tasks 1, 2, 3, 4 (editores principais)
2. **Média**: Tasks 5, 6, 7 (UX e validações)
3. **Baixa**: Tasks 8, 9 (otimizações e testes)

### Dependências
- Task 1 deve ser completada antes das tasks 2.2, 3.2
- Tasks 2, 3, 4 podem ser desenvolvidas em paralelo
- Task 5 depende da conclusão das tasks 2, 3, 4
- Tasks 6, 7, 8 podem ser desenvolvidas em paralelo após task 5

### Considerações Técnicas
- Reutilizar padrões estabelecidos no editor Home
- Manter consistência com sistema de design existente
- Garantir compatibilidade com estrutura atual do banco
- Implementar de forma incremental para facilitar testes

### Critérios de Aceitação
- Todos os editores funcionando sem erros
- Conteúdo sendo salvo e exibido corretamente
- Interface responsiva em todos os dispositivos
- Performance adequada (< 2s para carregamento)
- Cobertura de testes > 80%