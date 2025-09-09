# Relatório de Auditoria: Menu 'Gerenciar Conteúdo'

## 1. Introdução

Este relatório detalha a auditoria focada no menu 'Gerenciar Conteúdo' e seus submenus no painel administrativo do sistema COMADEMIG. O objetivo é identificar e documentar problemas relacionados à edição, criação, exclusão e navegação de conteúdo, que impactam diretamente as páginas do frontend.

## 2. Metodologia

A auditoria foi realizada através da navegação manual pelo painel administrativo, com foco nos seguintes pontos:

- **Identificação e Acesso:** Localização do menu 'Gerenciar Conteúdo' e acesso a cada um de seus submenus.
- **Edição de Conteúdo:** Tentativa de editar o conteúdo existente em cada submenu, verificando a persistência dos dados e a exibição de mensagens de sucesso/erro.
- **Criação de Conteúdo:** Tentativa de criar novos conteúdos, verificando a funcionalidade dos formulários e o salvamento dos dados.
- **Exclusão de Conteúdo:** Tentativa de excluir conteúdos existentes, verificando a remoção dos dados e a exibição de mensagens de sucesso/erro.
- **Navegação (Botão Voltar):** Teste do botão 'Voltar' dentro dos submenus para identificar erros 404 ou comportamentos inesperados.

## 3. Detalhamento da Auditoria

### 3.1. Acesso ao Menu 'Gerenciar Conteúdo'

- **Localização:** O menu 'Gerenciar Conteúdo' não é diretamente visível no menu lateral principal do dashboard. Ele é acessado através do link 'Acessar' no card 'Gerenciar Conteúdo' na seção 'Acesso Rápido' do dashboard.
- **Status:** Funcionando.
- **Observações:** O acesso ao menu 'Gerenciar Conteúdo' foi realizado com sucesso a partir do dashboard.





### 3.2. Edição de Conteúdo - Submenu Início

- **Localização:** `Gerenciar Conteúdo` > `Início` > Botão `Editar`
- **Status:** Funcionando (parcialmente).
- **Observações:** Foi possível editar o campo "Título Principal" e salvar as alterações. Uma mensagem de sucesso "Conteúdo da página inicial atualizado com sucesso!" foi exibida. No entanto, ao navegar para a página inicial do site (`https://comademig.vercel.app/home`), a alteração **não foi refletida**. Isso indica que a edição está funcionando no painel administrativo, mas a atualização do conteúdo no frontend não está ocorrendo, ou o frontend está exibindo conteúdo estático.

**Problema:** Alterações no painel administrativo não são refletidas no frontend.
**Passos para Reproduzir:**
1. Acessar o dashboard e navegar para `Gerenciar Conteúdo`.
2. Clicar em `Editar` para o submenu `Início`.
3. Alterar o campo `Título Principal`.
4. Clicar em `Salvar Alterações`.
5. Navegar para `https://comademig.vercel.app/home` e verificar se a alteração foi aplicada.



