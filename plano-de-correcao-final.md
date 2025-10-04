# Relatório Final e Plano de Correção: Sistema de Membros e Assinaturas

**Data:** 03/10/2025
**Autor:** Kilo Code

## 1. Resumo da Análise

A investigação confirmou que o sistema de unificação de tipos de membro e assinaturas está **inoperante e incompleto** devido a uma série de falhas críticas:

1.  **Inconsistência no Banco de Dados:** Uma migração de banco de dados (`..._member_types_final.sql`) alterou nomes de colunas (`plan_title` -> `name`) e regras de negócio, tornando o schema incompatível com a lógica de backend e frontend existente.
2.  **Backend Quebrado e Inseguro:** A `Edge Function` (`create-unified-member-type`) está quebrada devido à inconsistência do banco de dados e implementa um padrão de transação simulada que é inseguro.
3.  **Funcionalidade Incompleta:** O formulário administrativo para a criação unificada de tipos de membro e planos nunca foi implementado.
4.  **Frontend com Falha:** A página de filiação não exibe os planos porque o hook de dados (`useMemberTypeWithPlan`) falha ao consultar a coluna renomeada no banco de dados.
5.  **Arquitetura Defasada:** A implementação atual não segue a nova e mais robusta arquitetura de integração com o Asaas, que é baseada em Edge Functions modulares.

## 2. Plano de Correção Proposto

Para resolver esses problemas de forma definitiva e alinhar o sistema com as melhores práticas e os requisitos mais recentes, proponho o seguinte plano de ação, dividido em fases. **Nenhuma dessas ações será executada sem sua aprovação explícita.**

---

### **Fase 1: Fundação e Correção do Backend**

O objetivo é consertar a base de dados e a lógica de negócio, garantindo consistência e segurança.

*   **Tarefa 1.1: Aplicar Migração de Estabilização do Schema**
    *   **O que será feito:** Criar e aplicar um novo arquivo de migração (`..._stabilize_member_and_plan_schema.sql`) que irá:
        *   Padronizar a coluna `plan_title` para `name` na tabela `subscription_plans`.
        *   Padronizar as `constraints` da coluna `recurrence` para aceitar `monthly`, `semestral`, `annual`.
        *   Garantir que a `constraint` de `price` seja `>= 0`.
    *   **Artefato:** O arquivo `supabase/migrations/20251003222500_stabilize_member_and_plan_schema.sql` que já foi rascunhado.

*   **Tarefa 1.2: Implementar Função RPC para Criação Atômica**
    *   **O que será feito:** Criar e aplicar um novo arquivo de migração (`..._create_rpc_for_unified_member_type.sql`) que definirá uma função PostgreSQL `create_unified_member_type_and_plan`.
    *   **Funcionalidade:** Esta função receberá os dados do tipo de membro e do plano e os inserirá nas três tabelas (`member_types`, `subscription_plans`, `member_type_subscriptions`) dentro de uma única transação atômica, garantindo a integridade dos dados.
    *   **Artefato:** O arquivo `supabase/migrations/20251003222600_create_rpc_for_unified_member_type.sql` que já foi rascunhado.

*   **Tarefa 1.3: Remover a Edge Function Obsoleta**
    *   **O que será feito:** Excluir o diretório e os arquivos da `Edge Function` `supabase/functions/create-unified-member-type`.
    *   **Justificativa:** Prevenir o uso de código quebrado, inseguro e obsoleto.

---

### **Fase 2: Refatoração e Melhoria do Painel Administrativo**

O foco é criar a interface que falta para o administrador e melhorar a usabilidade.

*   **Tarefa 2.1: Desenvolver o Formulário Unificado de Gestão**
    *   **O que será feito:** Criar um novo arquivo de componente, `src/pages/dashboard/MemberTypeManagement.tsx`, que conterá:
        *   Uma listagem dos tipos de membro existentes com seus planos associados.
        *   Um formulário unificado para criar e editar tipos de membro e planos, que chamará a nova função RPC `create_unified_member_type_and_plan`.

*   **Tarefa 2.2: Melhorar a UX/UI e Reorganizar o Menu**
    *   **O que será feito:**
        *   No menu administrativo, renomear "Tipos de Membro" para **"Gestão de Cargos e Planos"** e apontá-lo para a nova página.
        *   Remover o link antigo para "Planos de Assinatura".
        *   Adicionar um novo menu **"Financeiro (Asaas)"** para o futuro dashboard de pagamentos.

---

### **Fase 3: Correção e Melhoria da Página de Filiação (Pública)**

O objetivo é consertar a experiência do usuário final e integrar com a nova arquitetura de pagamentos.

*   **Tarefa 3.1: Corrigir o Hook de Dados `useMemberTypeWithPlan`**
    *   **O que será feito:** Editar o arquivo `src/hooks/useMemberTypeWithPlan.ts` e corrigir a consulta do Supabase para usar o nome de coluna correto (`name` em vez de `plan_title`).

*   **Tarefa 3.2: Refatorar o Seletor de Tipos de Membro**
    *   **O que será feito:** Simplificar o componente `src/components/public/MemberTypeSelector.tsx`, removendo a lógica duplicada e garantindo que ele exiba corretamente o preço do plano no seletor inicial.

*   **Tarefa 3.3: Integrar com o Novo Fluxo de Pagamento Asaas**
    *   **O que será feito:** Modificar o fluxo de filiação para que, ao clicar em "Prosseguir", ele chame as novas Edge Functions modulares da integração Asaas (ex: `asaas-create-customer`, `asaas-create-payment`), conforme especificado no design mais recente.

---

## 3. Próximos Passos

Este documento representa o plano de correção completo. Aguardo sua revisão e autorização para iniciar a execução da **Fase 1**. Uma vez que a base do backend esteja corrigida, poderemos prosseguir com as fases de frontend de forma segura e incremental.