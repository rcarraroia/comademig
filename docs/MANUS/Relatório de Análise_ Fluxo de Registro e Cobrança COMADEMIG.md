# Relatório de Análise: Fluxo de Registro e Cobrança COMADEMIG

**Data:** 15 de Outubro de 2025
**Autor:** Manus AI

## 1. Introdução

Este relatório apresenta uma análise detalhada do fluxo de registro de novos membros e da cobrança de assinaturas do projeto COMADEMIG, conforme solicitado. A análise abrangeu o código-fonte do repositório GitHub, a estrutura do banco de dados Supabase e a lógica de integração com o gateway de pagamentos Asaas. O objetivo foi identificar as causas dos problemas relatados no processo de registro e cobrança, com foco específico na integração do split de pagamentos e do programa de afiliados.

**Nenhuma alteração, correção ou implementação foi realizada no código ou no banco de dados.** A tarefa concentrou-se exclusivamente na identificação e documentação dos problemas existentes.

## 2. Resumo Executivo dos Problemas

A análise revelou múltiplos problemas críticos e de alta prioridade que impedem o funcionamento correto do fluxo de registro e cobrança. A causa raiz dos problemas reside em uma combinação de erros lógicos na integração com o Asaas, inconsistências na estrutura do banco de dados e a ausência de componentes essenciais, como webhooks para sincronização de status.

Os problemas mais graves, que resultam diretamente na falha do processo, são:

1.  **Configuração Incorreta do Split de Pagamentos:** A lógica para dividir o pagamento da assinatura entre a COMADEMIG, a RENUM e o Afiliado está sendo executada de forma incorreta, utilizando um endpoint e um ID de referência errados na API do Asaas. Isso impede que qualquer divisão de pagamento seja, de fato, configurada na assinatura.
2.  **Ausência de Webhooks:** O sistema não possui a capacidade de receber notificações automáticas do Asaas (webhooks) sobre o status dos pagamentos. Como resultado, mesmo que um usuário pague a assinatura, o sistema COMADEMIG não é notificado e o status do membro permanece como "pendente" indefinidamente.
3.  **Inconsistência Crítica no Banco de Dados:** Existem duas tabelas distintas para armazenar assinaturas (`user_subscriptions` e `asaas_subscriptions`). A lógica de programação salva dados em ambas, criando duplicidade e dificultando a validação do status real de um membro.

Esses três pontos, combinados, criam um cenário onde o registro não é concluído com sucesso, o split de pagamentos não funciona e o programa de afiliados não é efetivado. A tabela abaixo resume os principais problemas identificados, classificados por prioridade.

| Prioridade | Problema                                                    | Impacto no Negócio                                                                                             | Categoria          |
| :--------- | :---------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- | :----------------- |
| **Crítico**  | Split de pagamentos não é configurado na assinatura         | A RENUM e os afiliados não recebem suas comissões. O modelo de negócio principal está quebrado.                | Integração (Asaas) |
| **Crítico**  | Webhooks para confirmação de pagamento não implementados    | Usuários pagam, mas suas contas não são ativadas no sistema, gerando insatisfação e suporte manual.           | Arquitetura        |
| **Crítico**  | Duplicidade de tabelas de assinatura (`user_subscriptions` vs `asaas_subscriptions`) | Inconsistência de dados, impossibilidade de saber o status real da assinatura de um membro.                     | Banco de Dados     |
| **Alto**     | Validação de método de pagamento restritiva no backend      | Usuários são impedidos de pagar com PIX em planos mensais/semestrais, mesmo que o frontend permita.          | Lógica de Negócio  |
| **Alto**     | Políticas de segurança (RLS) excessivamente permissivas     | Risco de segurança, onde um usuário autenticado poderia, teoricamente, modificar dados de outros usuários. | Segurança          |
| **Médio**    | Falta de transações atômicas no fluxo de registro         | Falhas em etapas intermediárias podem deixar dados inconsistentes (ex: usuário criado no Auth, mas sem assinatura). | Arquitetura        |
| **Médio**    | Múltiplas migrações de banco de dados conflitantes          | Risco de o estado do banco de dados estar inconsistente, dificultando futuras manutenções.                    | Banco de Dados     |

## 3. Análise Detalhada dos Problemas

A seguir, cada problema identificado é detalhado tecnicamente.

### 3.1. Falha na Configuração do Split de Pagamentos (Crítico)

O sistema tenta configurar o split de pagamentos após a criação da assinatura, o que é uma abordagem incorreta segundo a documentação do Asaas. Para assinaturas, o split deve ser definido no momento da sua criação.

-   **Causa Técnica:** O hook `useFiliacaoPayment` primeiro cria a assinatura no Asaas e, em uma etapa separada, chama a Edge Function `asaas-configure-split`. Esta função, por sua vez, tenta adicionar o split a uma cobrança (`/payments/{id}/splits`), mas utiliza o ID da **assinatura**, não de uma cobrança. A API do Asaas rejeita essa requisição, pois o endpoint e o ID são incompatíveis.
-   **Impacto:** O split nunca é configurado. A RENUM e os afiliados não recebem os valores devidos, comprometendo o modelo financeiro da plataforma.

### 3.2. Ausência de Webhooks para Sincronização (Crítico)

O fluxo de registro define o status da assinatura do usuário como `pending` no banco de dados local. A ativação para o status `active` depende da confirmação do primeiro pagamento. O Asaas notifica essa confirmação através de webhooks.

-   **Causa Técnica:** Não há uma Edge Function ou endpoint no sistema para receber e processar esses webhooks do Asaas (como `PAYMENT_RECEIVED` ou `PAYMENT_CONFIRMED`).
-   **Impacto:** O sistema nunca sabe quando um pagamento é efetuado. Como resultado, a assinatura do usuário permanece `pending` para sempre, e ele não obtém o acesso devido, mesmo tendo pago.

### 3.3. Duplicidade e Inconsistência no Banco de Dados (Crítico)

Existem duas tabelas (`user_subscriptions` e `asaas_subscriptions`) que armazenam informações de assinatura, com estruturas e propósitos diferentes, mas ambas são populadas durante o fluxo de registro.

-   **Causa Técnica:** A Edge Function `asaas-create-subscription` insere um registro na tabela `asaas_subscriptions`. Posteriormente, o hook `useFiliacaoPayment` insere um registro na tabela `user_subscriptions`. As duas tabelas não são sincronizadas e contêm informações parcialmente redundantes.
-   **Impacto:** Gera um estado de dados inconsistente e torna extremamente difícil para o sistema ter uma fonte única e confiável sobre o status da assinatura de um usuário.

### 3.4. Integração do Programa de Afiliados (Parcialmente Implementado)

O sistema captura o código de referência de um afiliado, salva o registro do indicado e possui a lógica de comissionamento (20%) definida na Edge Function `asaas-configure-split`.

-   **Causa Técnica:** A funcionalidade é interrompida pela falha na configuração do split (problema 3.1). Como o split não é configurado na assinatura no Asaas, o afiliado nunca recebe a comissão.
-   **Impacto:** O programa de afiliados não é funcional, desincentivando a divulgação da plataforma.

### 3.5. Políticas de Segurança (RLS) Permissivas (Alto)

As políticas de segurança a nível de linha (RLS) em algumas tabelas, como `asaas_customers`, permitem que qualquer usuário autenticado realize operações de escrita e exclusão, quando deveriam ser restritas.

-   **Causa Técnica:** A política `"System can manage customers"` na tabela `asaas_customers` concede permissões para `auth.jwt() ->> 'role' = 'authenticated'`, em vez de restringir a `service_role`.
-   **Impacto:** Abre uma brecha de segurança que, embora possa ser de difícil exploração, viola o princípio do menor privilégio e expõe os dados dos usuários a modificações indevidas.

## 4. Conclusão e Recomendações

O sistema de registro e cobrança da COMADEMIG possui uma base funcional, com componentes de frontend bem estruturados e um fluxo de usuário claro. No entanto, a implementação da lógica de backend, especialmente na integração com o Asaas e na arquitetura do banco de dados, contém falhas críticas que impedem o funcionamento correto das funcionalidades de negócio mais importantes: a cobrança recorrente, o split de pagamentos e o programa de afiliados.

Não é recomendado realizar correções pontuais. Uma refatoração direcionada do fluxo de pagamento é necessária para garantir a robustez e a corretude do sistema. Com base na análise, a seguinte ordem de ações é recomendada para a correção dos problemas:

1.  **Unificar as Tabelas de Assinatura:** Decidir por uma única tabela (`user_subscriptions` parece ser a mais adequada) como a fonte da verdade e remover a outra, ajustando todo o código para usar apenas uma.
2.  **Refatorar a Criação de Assinatura:** Modificar a Edge Function `asaas-create-subscription` para que ela receba a configuração de split (incluindo o wallet ID do afiliado, se houver) e a envie no payload de criação da assinatura para o Asaas. A função `asaas-configure-split` deve ser descontinuada.
3.  **Implementar Webhooks do Asaas:** Criar uma nova Edge Function para receber eventos de pagamento do Asaas. Este webhook deve ser responsável por atualizar o status da assinatura em `user_subscriptions` de `pending` para `active` e registrar a transação de comissão.
4.  **Revisar e Corrigir as Políticas RLS:** Ajustar as políticas de segurança do banco de dados para garantir que apenas os papéis apropriados (como `service_role`) possam modificar dados sensíveis.

Ao seguir estes passos, o fluxo de registro e cobrança se tornará mais robusto, seguro e alinhado com as regras de negócio da plataforma.
