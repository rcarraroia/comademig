# Inventário de Funcionalidades, Módulos e Componentes

## Funcionalidades Identificadas (Baseado nas Rotas do `App.tsx`)

### Páginas Públicas:
- **Página Inicial (`/`, `/home`):** Exibe o conteúdo principal do site.
- **Sobre (`/sobre`):** Informações sobre a organização.
- **Liderança (`/lideranca`):** Detalhes sobre a liderança.
- **Notícias (`/noticias`):** Listagem de notícias.
- **Eventos (`/eventos`):** Listagem de eventos.
- **Multimídia (`/multimidia`):** Conteúdo multimídia.
- **Contato (`/contato`):** Formulário de contato.
- **Filiação (`/filiacao`):** Página para filiação.
- **Autenticação (`/auth`):** Login e registro de usuários.
- **Checkout (`/checkout`):** Processo de finalização de compra/inscrição.
- **Pagamento Sucesso (`/pagamento-sucesso`):** Confirmação de pagamento.
- **Validar Carteira (`/validar-carteira/:numeroCarteira`):** Validação de carteira digital.
- **Validar Certificado (`/validar-certificado/:numeroCertificado`):** Validação de certificado.
- **Validar Certidão (`/validar-certidao/:numeroProtocolo`):** Validação de certidão.
- **Página Não Encontrada (`*`):** Página de erro 404.

### Páginas Protegidas (Dashboard):
- **Dashboard Principal (`/dashboard`):** Visão geral do usuário logado.
- **Perfil (`/dashboard/perfil`):** Gerenciamento do perfil do usuário.
- **Meus Dados (`/dashboard/meus-dados`):** Edição de informações pessoais.
- **Carteira Digital (`/dashboard/carteira-digital`):** Acesso à carteira digital do usuário.
- **Comunicação (`/dashboard/comunicacao`):** Ferramentas de comunicação.
- **Dashboard de Comunicação (`/dashboard/comunicacao-dashboard`):** Visão específica da comunicação.
- **Eventos (Dashboard) (`/dashboard/eventos`):** Gerenciamento de eventos pelo usuário.
- **Certidões (`/dashboard/certidoes`):** Solicitação e acompanhamento de certidões.
- **Financeiro (`/dashboard/financeiro`):** Informações financeiras do usuário.
- **Regularização (`/dashboard/regularizacao`):** Processo de regularização.
- **Checkout Regularização (`/dashboard/checkout-regularizacao`):** Finalização da regularização.
- **Suporte (`/dashboard/suporte`):** Canal de suporte.
- **Afiliados (`/dashboard/afiliados`):** Gerenciamento de afiliados.

### Páginas de Administração (Protegidas):
- **Administração de Usuários (`/dashboard/admin/usuarios`):** Gerenciamento de usuários.
- **Administração de Suporte (`/dashboard/admin/suporte`):** Gerenciamento de tickets de suporte.
- **Gerenciamento de Conteúdo (`/dashboard/admin/content`):** Gerenciamento geral de conteúdo.
- **Notificações (`/dashboard/notifications`):** Gerenciamento de notificações.
- **Edição de Conteúdo (`/dashboard/admin/content/:pageName/edit`):** Edição de conteúdo por página.
- **Editor de Conteúdo da Home (`/dashboard/admin/content/home-editor`):** Edição de conteúdo da página inicial.
- **Editor de Conteúdo Sobre (`/dashboard/admin/content/sobre-editor`):** Edição de conteúdo da página Sobre.
- **Editor de Conteúdo Liderança (`/dashboard/admin/content/lideranca-editor`):** Edição de conteúdo da página Liderança.
- **Editor de Conteúdo Eventos (`/dashboard/admin/content/eventos-editor`):** Edição de conteúdo da página Eventos.
- **Editor de Conteúdo Multimídia (`/dashboard/admin/content/multimidia-editor`):** Edição de conteúdo da página Multimídia.
- **Editor de Conteúdo Notícias (`/dashboard/admin/content/noticias-editor`):** Edição de conteúdo da página Notícias.
- **Perfil Público (`/dashboard/perfil-publico/:userId?`):** Visualização de perfil público.
- **Perfil Completo (`/dashboard/perfil-completo`):** Visualização completa do perfil.

## Módulos e Componentes Identificados (Baseado na Estrutura de Pastas `src/`)

### Módulos Principais:
- `components/`: Componentes reutilizáveis da UI.
- `contexts/`: Contextos React para gerenciamento de estado (ex: `AuthContext`).
- `hooks/`: Hooks personalizados.
- `integrations/`: Integrações com serviços externos.
- `lib/`: Funções utilitárias e configurações de bibliotecas (ex: Supabase).
- `pages/`: Páginas da aplicação.
- `utils/`: Utilitários gerais.

### Componentes por Categoria:
- `AuthRedirect.tsx`
- `ProtectedRoute.tsx`
- `Footer.tsx`
- `Header.tsx`
- `Layout.tsx`
- `admin/`: Componentes relacionados à administração.
- `affiliates/`: Componentes relacionados a afiliados.
- `auth/`: Componentes de autenticação.
- `carteira/`: Componentes da carteira digital.
- `certidoes/`: Componentes de certidões.
- `common/`: Componentes de uso comum.
- `communication/`: Componentes de comunicação.
- `dashboard/`: Componentes do dashboard.
- `events/`: Componentes de eventos.
- `feedback/`: Componentes de feedback.
- `forms/`: Componentes de formulários.
- `payments/`: Componentes de pagamentos.
- `suporte/`: Componentes de suporte.
- `ui/`: Componentes de UI (Shadcn UI).

## Funcionalidades Pendentes (A Serem Identificadas na Análise de Código)

*Esta seção será preenchida após a análise detalhada do código e comparação com os requisitos esperados.*



## Potenciais Bugs, Erros e Inconsistências Identificados

### Segurança:
- **Chaves Supabase Hardcoded:** O arquivo `src/integrations/supabase/client.ts` possui `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` (chave `anon`) hardcoded. Embora a chave `anon` seja pública, é uma má prática de segurança mantê-la diretamente no código-fonte, especialmente se o projeto for de código aberto ou se houver planos de usar chaves mais sensíveis no futuro. O ideal é usar variáveis de ambiente (`.env`).

### Código (Análise Inicial):
- **Tratamento de Erros no Login (`Auth.tsx`):** O componente `Auth.tsx` utiliza `try-catch` para `signIn`, mas o `error.message` pode não ser amigável para o usuário final. É importante garantir que as mensagens de erro sejam claras e úteis.
- **Redirecionamento Pós-Login (`Auth.tsx`):** O `useEffect` em `Auth.tsx` redireciona para `/dashboard` se o usuário já estiver logado. Isso é um comportamento esperado, mas a lógica de redirecionamento após um login bem-sucedido também deve ser consistente (atualmente, é feito dentro do `onSubmit`).

### Banco de Dados (Análise Inicial):
- **Consistência de Dados:** As tabelas `profiles` e `eventos` parecem ter campos relevantes para suas funcionalidades. A presença de `CHECK constraints` e `FOREIGN KEY constraints` é um bom sinal de que há alguma validação e integridade de dados sendo aplicada. No entanto, uma análise mais aprofundada dos dados reais e das políticas de RLS (Row Level Security) seria necessária para garantir a consistência e segurança completas.

## Funcionalidades Pendentes (A Serem Identificadas na Análise de Código)

*Esta seção será preenchida após a análise detalhada do código e comparação com os requisitos esperados.*



### Análise de Código Detalhada (Continuação):

- **Validação de Entrada de Dados:**
    - O `Auth.tsx` utiliza `required` nos campos de email e senha, mas validações mais robustas (e.g., formato de email, complexidade de senha) são provavelmente tratadas pelo Supabase Auth. É importante verificar se há validações adicionais no frontend para melhorar a experiência do usuário e reduzir requisições inválidas ao backend.
    - Para a tabela `profiles`, o banco de dados já possui `CHECK constraints` para `cpf` e `status`, o que é excelente para garantir a integridade dos dados. No entanto, é crucial que essas validações sejam replicadas ou tratadas no frontend para fornecer feedback imediato ao usuário.

- **Tratamento de Erros:**
    - Em `useAuthActions.ts`, os blocos `try-catch` capturam erros e os retornam. No entanto, o tratamento desses erros no lado do componente (e.g., `Auth.tsx`) poderia ser mais granular, exibindo mensagens específicas para diferentes tipos de erro (e.g., email já cadastrado, senha fraca).
    - A falta de tratamento de erros explícito em algumas chamadas assíncronas (e.g., `fetchProfile` em `useAuthState.ts` onde `error.code !== 'PGRST116'` é ignorado) pode levar a estados inconsistentes na UI ou a falhas silenciosas.

- **Consistência de Dados:**
    - A tabela `profiles` tem um `FOREIGN KEY` para `auth.users(id)`, o que garante que cada perfil esteja associado a um usuário autenticado. Isso é fundamental para a integridade do sistema.
    - A tabela `eventos` possui `organizador_id` referenciando `auth.users(id)`, o que é uma boa prática para associar eventos a usuários específicos. A validação `check_data_valida` (`data_fim >= data_inicio`) é um bom exemplo de regra de negócio aplicada no banco de dados.

- **Lógica de Negócio (Observações Iniciais):**
    - O sistema parece ter um fluxo de autenticação e gerenciamento de perfil bem definido. As funcionalidades de eventos, certidões, financeiro e suporte indicam um sistema abrangente para uma comunidade ou organização.
    - A presença de rotas de administração e gerenciamento de conteúdo sugere que o sistema é projetado para ser dinâmico e gerenciável por usuários com permissões elevadas.

## Funcionalidades Pendentes (A Serem Identificadas na Análise de Código)

*Esta seção será preenchida após a análise detalhada do código e comparação com os requisitos esperados.*



### Gerenciamento de Usuários (Admin):
- **Funcionalidade:** Permite aos administradores visualizar, filtrar, editar e gerenciar usuários do sistema.
- **Componentes Envolvidos:**
    - `UserManagement.tsx`: Componente principal para a interface de gerenciamento de usuários.
    - `LoadingSpinner.tsx`: Componente de carregamento.
    - `UserActionsMenu.tsx`: Menu de ações para cada usuário (editar, visualizar, etc.).
    - `EditUserModal.tsx`: Modal para edição de dados do usuário.
    - `ViewUserModal.tsx`: Modal para visualização detalhada dos dados do usuário.
- **Integração com Banco de Dados:** Utiliza o hook `useAdminData` para buscar e manipular dados da tabela `profiles` no Supabase.
- **Validações e Lógica:** Filtros por nome, igreja, CPF e status. Exibição de estatísticas rápidas de usuários (total, ativos, pendentes, suspensos).

## Funcionalidades Pendentes (A Serem Identificadas na Análise de Código)

*Esta seção será preenchida após a análise detalhada do código e comparação com os requisitos esperados.*



### Dashboard de Eventos:
- **Funcionalidade:** Permite aos usuários visualizar eventos disponíveis, gerenciar suas inscrições, acessar certificados e registrar presença.
- **Componentes Envolvidos:**
    - `EventsList.tsx`: Lista de eventos disponíveis.
    - `MyEventsList.tsx`: Lista de eventos nos quais o usuário está inscrito.
    - `MeusCertificados.tsx`: Exibe os certificados do usuário.
    - `ErrorMessage.tsx`: Componente para exibir mensagens de erro.
- **Integração com Banco de Dados:** Utiliza o hook `useEventos` para buscar eventos e inscrições no Supabase. Funções para `inscreverEvento` e `cancelarInscricao`.
- **Validações e Lógica:** Filtragem de eventos por termo de busca. Abas para organizar a visualização (Todos os Eventos, Minhas Inscrições, Meus Certificados, Presença).
- **Potenciais Melhorias/Bugs:**
    - **Registro de Presença:** A aba 'Presença' atualmente exibe apenas um botão para 'Abrir Scanner' e um texto explicativo. A funcionalidade de scanner de QR Code para registro de presença ainda não está implementada no frontend, necessitando de desenvolvimento adicional.
    - **Tratamento de Erros:** Embora haja um `ErrorMessage` genérico, o tratamento de erros específicos para `inscreverEvento` e `cancelarInscricao` poderia ser mais detalhado para fornecer feedback mais preciso ao usuário (e.g., evento lotado, inscrição já existente).

## Funcionalidades Pendentes (A Serem Identificadas na Análise de Código)

*Esta seção será preenchida após a análise detalhada do código e comparação com os requisitos esperados.*



### Filiação:
- **Funcionalidade:** Permite que novos membros se filiem à COMADEMIG, incluindo um processo de pagamento e a possibilidade de indicação por afiliados.
- **Componentes Envolvidos:**
    - `PaymentForm.tsx`: Formulário para coletar dados de pagamento e usuário.
- **Integração com Banco de Dados/Serviços Externos:**
    - Utiliza o hook `useAsaasPayments` para interagir com a API da Asaas (gateway de pagamento).
    - Busca informações de afiliados através de códigos de referência na URL, interagindo com a tabela `affiliates` no banco de dados.
- **Validações e Lógica:**
    - Exibe informações de afiliação se um código de referência válido for encontrado na URL.
    - Apresenta os benefícios da filiação e o valor da taxa.
    - Oferece um desconto para pagamentos via PIX.
- **Potenciais Melhorias/Bugs:**
    - **Segurança da Integração Asaas:** É crucial verificar como as credenciais da Asaas são gerenciadas no `useAsaasPayments` e se a comunicação com a API da Asaas é segura (e.g., HTTPS, validação de certificados).
    - **Tratamento de Erros de Pagamento:** O `handlePaymentSuccess` apenas loga o sucesso. É importante ter um tratamento robusto para falhas de pagamento, incluindo feedback claro para o usuário e mecanismos de retentativa ou notificação.
    - **Validação de Dados do Formulário:** O `PaymentForm` deve ter validações robustas para os dados do usuário (CPF, nome, etc.) antes de enviar para o gateway de pagamento.

## Funcionalidades Pendentes (A Serem Identificadas na Análise de Código)

*Esta seção será preenchida após a análise detalhada do código e comparação com os requisitos esperados.*



### Análise de Segurança Detalhada:

- **Chaves Supabase Hardcoded (Reiteração):** Conforme identificado anteriormente, as chaves `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` estão hardcoded em `src/integrations/supabase/client.ts`. Embora a chave `anon` seja de baixo risco, a prática de hardcoding é desaconselhada. Recomenda-se o uso de variáveis de ambiente (`.env`) para todas as chaves, mesmo as públicas, para facilitar a gestão e evitar exposição acidental de chaves mais sensíveis no futuro.

- **Row Level Security (RLS) no Supabase:**
    - **`profiles`:** A política `"Users can view their own profile data"` permite que usuários autenticados (`auth.uid()`) visualizem apenas seus próprios perfis. A política `"Users can update their own profile data"` permite que usuários autenticados atualizem seus próprios perfis. Isso é fundamental para a privacidade e segurança dos dados do usuário.
    - **`eventos`:** A política `"Enable read access for all users"` permite que todos (incluindo não autenticados) leiam dados de eventos, o que é adequado para um site público. A política `"Allow authenticated users to insert events"` permite que usuários autenticados criem eventos, o que pode ser um risco se não houver validação adicional de permissões (e.g., apenas administradores ou organizadores podem criar eventos). A política `"Allow authenticated users to update their own events"` permite que usuários autenticados atualizem seus próprios eventos, o que é razoável.
    - **`inscricoes_eventos`:** As políticas `"Allow authenticated users to insert their own event registrations"` e `"Allow authenticated users to delete their own event registrations"` garantem que usuários só possam gerenciar suas próprias inscrições. A política `"Allow authenticated users to view their own event registrations"` permite a visualização das próprias inscrições.
    - **`financeiro`:** As políticas `"Allow authenticated users to view their own financial records"` e `"Allow authenticated users to insert their own financial records"` garantem que usuários só possam ver e criar seus próprios registros financeiros. A política `"Allow authenticated users to update their own financial records"` permite a atualização dos próprios registros.
    - **`mensagens`:** As políticas `"Allow authenticated users to send messages"` e `"Allow authenticated users to view their own messages"` controlam o envio e visualização de mensagens, garantindo que usuários só possam ver suas próprias mensagens e as que lhes são destinadas.
    - **`suporte`:** As políticas `"Allow authenticated users to create support tickets"` e `"Allow authenticated users to view their own support tickets"` permitem que usuários criem e visualizem seus próprios tickets de suporte.
    - **`noticias` e `multimidia`:** As políticas `"Enable read access for all users"` permitem que todos leiam notícias e conteúdo multimídia, o que é adequado para conteúdo público.
    - **`certidoes`:** As políticas `"Allow authenticated users to create their own certificates"` e `"Allow authenticated users to view their own certificates"` controlam a criação e visualização de certidões.
    - **`user_roles`:** A política `"Users can view their own roles"` permite que usuários vejam seus próprios papéis, mas não os de outros. Não há políticas para `INSERT`, `UPDATE` ou `DELETE` em `user_roles` para usuários comuns, o que é bom para a segurança. A função `make_user_admin` é `SECURITY DEFINER`, o que significa que ela é executada com os privilégios do criador, permitindo a modificação de `profiles` e `user_roles` de outros usuários, o que é esperado para uma função administrativa.

- **Validação de Dados no Banco de Dados:** A presença de `CHECK constraints` para `cpf`, `status`, `tipo_membro` na tabela `profiles` e `data_inicio`/`data_fim` na tabela `eventos` é uma excelente prática de segurança e integridade de dados. Isso garante que dados inválidos não sejam inseridos no banco de dados, mesmo que as validações do frontend falhem.

- **Funções de Gatilho (Triggers):**
    - `handle_new_user()`: Garante que um perfil seja criado automaticamente para cada novo usuário autenticado, preenchendo campos iniciais e definindo `status` como 'pendente' e `tipo_membro` como 'membro'. Isso é bom para a consistência inicial dos dados.
    - `handle_updated_at()`: Atualiza automaticamente o campo `updated_at` em várias tabelas, o que é útil para auditoria e rastreamento de modificações.

- **Vulnerabilidades Potenciais (Baseado na Análise Atual):**
    - **Exposição de Chaves de API (Asaas):** A análise do `Filiacao.tsx` indicou o uso de `useAsaasPayments`. É crucial verificar como as credenciais da Asaas são gerenciadas. Se as chaves secretas da Asaas estiverem expostas no frontend ou em código que possa ser acessado pelo cliente, isso representa uma grave vulnerabilidade de segurança. O ideal é que todas as operações com chaves secretas de gateways de pagamento sejam realizadas no backend (e.g., via Supabase Edge Functions ou um servidor Node.js/Python).
    - **Injeção de SQL/XSS:** Embora o Supabase e o React ajudem a mitigar muitas dessas vulnerabilidades, é importante garantir que todas as entradas do usuário sejam devidamente sanitizadas e validadas, tanto no frontend quanto no backend (especialmente em funções PL/pgSQL ou Edge Functions que interagem diretamente com o banco de dados).
    - **Controle de Acesso Fino para Criação de Eventos:** A política RLS para `eventos` permite que *qualquer* usuário autenticado insira eventos. Se apenas administradores ou usuários com um `tipo_membro` específico (e.g., 'pastor', 'moderador') devem criar eventos, essa política precisa ser mais restritiva, possivelmente usando uma função de segurança que verifique o `tipo_membro` do usuário autenticado.
    - **Rate Limiting e Proteção contra Brute Force:** Não foi possível verificar a implementação de rate limiting para tentativas de login ou outras operações sensíveis. Isso é importante para proteger contra ataques de força bruta e abuso de API.

## Funcionalidades Pendentes (A Serem Identificadas na Análise de Código)

*Esta seção será preenchida após a análise detalhada do código e comparação com os requisitos esperados.*

