# Análise dos Logs do Console - Sistema de Pagamentos Asaas

## 1. Introdução

Esta seção detalha a análise dos logs do console fornecidos, com o objetivo de identificar a causa raiz dos problemas no sistema de pagamentos Asaas, que afetam o formulário de filiação, o sistema de certidões e regularização, e o sistema de afiliados com split de pagamentos.

## 2. Erros Identificados

Com base nos logs fornecidos, os seguintes erros críticos foram observados:

### 2.1. Erro de Autorização (401) na Criação de Pagamento Asaas

- **Mensagem do Log:** `amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-create-payment:1 Failed to load resource: the server responded with a status of 401 ()`
- **Erro Detalhado:** `FunctionsHttpError: Edge Function returned a non-2xx status code`
- **Análise:** Este é o erro mais crítico relacionado à criação de pagamentos. O status `401 Unauthorized` indica que a requisição para a função Edge do Supabase (`asaas-create-payment`) não foi autenticada ou autorizada corretamente. Isso pode ser devido a:
    - **Chave de API Asaas Inválida/Ausente:** A função Edge pode estar tentando usar uma chave de API do Asaas que é inválida, expirada ou não está configurada corretamente no ambiente da função.
    - **Problema de Permissão da Função Edge:** A função Edge em si pode não ter as permissões necessárias para interagir com o serviço Asaas ou com outras partes do Supabase.
    - **Token de Autenticação Supabase Inválido:** Se a função Edge requer um token JWT do Supabase para autenticação interna, este token pode estar ausente, inválido ou expirado.
- **Impacto:** Este erro impede completamente a criação de pagamentos, afetando diretamente o formulário de filiação (que não consegue levar o filiado para o checkout) e os sistemas de certidões e regularização (que não conseguem gerar formas de pagamento).

### 2.2. Erro de Requisição Inválida (400) nas Consultas de Certidões e Regularização

- **Mensagem do Log:** `amkelczfwazutrciqtlk.supabase.co/rest/v1/solicitacoes_certidoes?select=*%2Cprofiles%28nome_completo%2Ccpf%2Ccargo%2Cigreja%29&status=in.%28pago%2Cem_analise%2Caprovada%2Crejeitada%2Centregue%29&order=created_at.desc:1 Failed to load resource: the server responded with a status of 400 ()`
- **Análise:** O status `400 Bad Request` indica que a requisição para a API REST do Supabase para as tabelas `solicitacoes_certidoes` e `solicitacoes_regularizacao` está malformada ou contém parâmetros inválidos. Isso pode ser causado por:
    - **Filtros de Status Inválidos:** O parâmetro `status=in.(pago,em_analise,aprovada,rejeitada,entregue)` pode conter valores de status que não são reconhecidos ou não existem na definição da tabela.
    - **Problemas na Seleção de Colunas:** A seleção de colunas (`select=*%2Cprofiles(nome_completo%2Ccpf%2Ccargo%2Cigreja)`) pode estar incorreta, especialmente na forma como as colunas relacionadas da tabela `profiles` estão sendo referenciadas.
    - **Regras de RLS (Row Level Security):** Embora o erro 400 geralmente aponte para uma requisição malformada, políticas de RLS mal configuradas também podem, em alguns casos, levar a erros inesperados se a consulta não estiver em conformidade com as regras.
- **Impacto:** Este erro impede a correta listagem e gerenciamento das solicitações de certidões e regularização, afetando a visualização do status e o fluxo de trabalho dessas funcionalidades.

### 2.3. Erro de Tipo (TypeError) na Renderização de Componentes

- **Mensagem do Log:** `index-B00NLduk.js:40 TypeError: Cannot read properties of undefined (reading 'status')`
- **Análise:** Este é um erro de JavaScript no frontend, indicando que o código está tentando acessar a propriedade `status` de um objeto que é `undefined`. Isso geralmente ocorre quando:
    - **Dados Inesperados da API:** A API (Supabase REST ou Edge Function) está retornando dados que não correspondem ao formato esperado pelo frontend, fazendo com que uma variável ou objeto seja `undefined` quando deveria conter dados.
    - **Lógica de Renderização Incorreta:** O componente React (ou similar) está tentando renderizar algo antes que os dados necessários estejam disponíveis ou antes que a lógica de tratamento de `undefined` seja aplicada.
- **Impacto:** Este erro causa falhas na renderização de partes da interface do usuário, resultando em uma experiência de usuário quebrada ou incompleta, especialmente em áreas que dependem do `status` de alguma entidade (como pagamentos, certidões ou regularizações).

## 3. Próximos Passos

Com base nesta análise, os próximos passos da auditoria se concentrarão em:

1.  **Testar o Formulário de Filiação:** Acessar a página de filiação e tentar simular o processo para verificar o comportamento do checkout e capturar logs mais específicos relacionados à criação de pagamentos.
2.  **Testar os Sistemas de Certidões e Regularização:** Acessar as páginas de certidões e regularização para observar o comportamento das listagens e tentar iniciar o processo de geração de pagamentos.
3.  **Investigar o Código:** Se os problemas persistirem, será necessário investigar o código-fonte da aplicação, especialmente as integrações com o Asaas e as chamadas às APIs do Supabase, para identificar a causa exata dos erros 401 e 400, e o `TypeError` no frontend.

Esta análise inicial dos logs fornece um roteiro claro para a depuração e correção dos problemas no sistema de pagamentos.



## 4. Teste do Formulário de Filiação

Ao preencher o formulário de filiação com dados de teste e clicar em "Gerar Cobrança", o sistema exibiu a seguinte mensagem de erro:

**"Erro ao criar cobrança Edge Function returned a non-2xx status code"**

Este erro corrobora a análise inicial dos logs, confirmando que a função Edge responsável pela criação de pagamentos no Asaas está retornando um status de erro (provavelmente 401 Unauthorized, conforme visto nos logs). Isso impede que o processo de filiação avance para o checkout.

**Passos para Reproduzir:**
1. Navegar para `https://comademig.vercel.app/filiacao`.
2. Preencher todos os campos obrigatórios do formulário.
3. Clicar no botão "Gerar Cobrança".

**Observação:** O problema não está na validação do formulário em si, mas na comunicação com o gateway de pagamento via função Edge.



## 5. Análise dos Logs de Deploy do Vercel e Variáveis de Ambiente

### 5.1. Logs de Deploy

Os logs de deploy do Vercel (`pasted_content_2.txt`) indicam que o deploy foi concluído com sucesso. Não foram encontrados erros durante o processo de build que pudessem indicar problemas de integração com o Asaas ou com as funções Edge do Supabase. As mensagens de aviso sobre o tamanho dos *chunks* são relacionadas à otimização de performance do frontend, mas não são a causa dos problemas de pagamento.

### 5.2. Variáveis de Ambiente do Vercel

A imagem das variáveis de ambiente do Vercel (`pasted_file_kKIwWx_image.png`) mostra que as seguintes variáveis estão configuradas:

*   `VITE_SUPABASE_ANON_KEY`: Presente e configurada.
*   `VITE_SUPABASE_URL`: Presente e configurada para `https://amkelczfwazutrciqtlk.supabase.co`.

**Conclusão da Análise do Vercel:**

O ambiente de deploy do Vercel parece estar configurado corretamente em relação às variáveis básicas do Supabase. Isso sugere que o problema não está na implantação do frontend ou na conexão inicial com o Supabase, mas sim na lógica de backend (funções Edge do Supabase) ou na forma como as chaves de API do Asaas estão sendo gerenciadas/utilizadas por essas funções.



## 6. Análise do Código de Integração do Asaas

### 6.1. `src/components/payments/PaymentForm.tsx`

Este componente é responsável por renderizar o formulário de filiação e coletar os dados do cliente e da cobrança. Ele utiliza o hook `useAsaasPayments` para lidar com a lógica de criação de pagamentos. A submissão do formulário chama a função `createPayment` do hook.

### 6.2. `src/hooks/useAsaasPayments.ts`

Este hook é o ponto central da integração com o Asaas. A função `createPayment` é a mais relevante para o problema atual. Ela faz o seguinte:

1.  **Determina a Função Edge:** Verifica se há um `affiliateId` para decidir qual função Edge do Supabase invocar: `asaas-create-payment-with-split` (para pagamentos com split de afiliado) ou `asaas-create-payment` (para pagamentos normais).
2.  **Invoca a Função Edge:** Utiliza `supabase.functions.invoke()` para chamar a função Edge correspondente, passando os `paymentData` no corpo da requisição.
3.  **Tratamento de Erros:** Captura erros retornados pela função Edge e exibe uma mensagem de toast.

**Observações Críticas:**

*   O erro `FunctionsHttpError: Edge Function returned a non-2xx status code` (visto nos logs do console e reproduzido no teste do formulário de filiação) ocorre na linha onde `supabase.functions.invoke()` é chamado.
*   Isso significa que o problema não está no frontend (o formulário está enviando os dados corretamente), mas sim na **função Edge do Supabase** que está sendo invocada.
*   A causa mais provável para um erro `401 Unauthorized` (que é um tipo de `non-2xx status code`) em uma função que interage com uma API externa (Asaas) é a **falta ou invalidade da chave de API do Asaas** configurada no ambiente da função Edge.

## 7. Próximos Passos (Revisados)

Com base na análise do código, os próximos passos devem focar na investigação das funções Edge do Supabase:

1.  **Acessar o Projeto Supabase:** É fundamental ter acesso ao dashboard do Supabase para:
    *   Verificar as **variáveis de ambiente** configuradas para as funções Edge (`asaas-create-payment` e `asaas-create-payment-with-split`). A chave de API do Asaas (`ASAAS_API_KEY` ou similar) deve estar presente e correta.
    *   Inspecionar o **código-fonte** dessas funções Edge para garantir que estão lendo a chave de API corretamente e que a lógica de integração com o Asaas está implementada sem erros.
    *   Analisar os **logs de execução** das funções Edge no Supabase para obter mensagens de erro mais detalhadas que o `FunctionsHttpError` genérico.
2.  **Verificar Políticas de RLS:** Reconfirmar as políticas de Row Level Security (RLS) para as tabelas `solicitacoes_certidoes` e `solicitacoes_regularizacao` no Supabase, pois os erros 400 (`Bad Request`) podem estar relacionados a consultas que não atendem às regras de RLS ou a problemas na definição das políticas. Embora o erro 400 seja mais comum para requisições malformadas, uma RLS mal configurada pode, em alguns cenários, levar a esse tipo de resposta.

Sem acesso direto ao ambiente do Supabase, não consigo prosseguir com a depuração e identificação da causa raiz exata dos problemas de pagamento. As informações que você pode me fornecer sobre a configuração das funções Edge e as variáveis de ambiente no Supabase serão cruciais.

