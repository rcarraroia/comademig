# Relatório de Análise: Unificação de Tipos de Membro e Assinaturas

**Data:** 03/10/2025
**Autor:** Kilo Code

## 1. Resumo Executivo

A análise comparativa entre as especificações de design e a implementação atual do sistema de unificação de tipos de membro e assinaturas revelou **falhas críticas e estruturais** que são a causa direta dos problemas relatados.

O problema central é uma **migração de banco de dados conflitante** (`..._member_types_final.sql`, de agosto/2025) que foi aplicada *após* a implementação da lógica principal, alterando nomes de colunas e regras de negócio. Essa alteração quebrou a comunicação entre o frontend, a `Edge Function` e o banco de dados.

**Em resumo:**

1.  **Formulário de Filiação:** Não exibe os planos porque a consulta que busca os dados (`useMemberTypeWithPlan`) falha ao tentar acessar uma coluna (`plan_title`) que foi renomeada para `name`.
2.  **Painel Administrativo:** Os menus continuam separados porque o **formulário unificado para criação de tipos de membro nunca foi implementado**. A funcionalidade no painel de administração está incompleta.
3.  **Lógica de Negócio:** A `Edge Function` responsável pela criação unificada está **inoperante**, pois tenta usar nomes de colunas e valores que não existem mais no banco de dados. Além disso, a integração com o gateway de pagamento (Asaas) e o gerenciamento de transações atômicas, ambos requisitos-chave, não foram implementados conforme o design.

---

## 2. Análise Detalhada por Componente

### 2.1. O que foi Proposto (Design)

*   **Backend:** Uma `Edge Function` (`create-unified-member-type`) orquestraria uma transação atômica:
    1.  Criaria um plano no gateway Asaas.
    2.  Iniciaria uma transação no PostgreSQL.
    3.  Inseriria dados nas tabelas `member_types`, `subscription_plans` e `member_type_subscriptions`.
    4.  Faria `commit` ou `rollback` de todas as operações.
*   **Frontend (Admin):** Um novo formulário unificado (`UnifiedMemberTypeForm.tsx`) permitiria ao administrador criar um tipo de membro e seu plano financeiro em uma única tela. O menu seria reorganizado para refletir essa unificação.
*   **Frontend (Público):** A página de filiação usaria um hook (`useMemberTypeWithPlan`) para buscar os tipos de membro já com seus planos associados, exibindo um seletor simples para o usuário com o preço visível.

### 2.2. O que foi Implementado (Realidade) e Onde Estão os Erros

#### **Banco de Dados (A Causa Raiz)**

*   **ERRO GRAVE:** A migração `20250827000022_member_types_final.sql` alterou a estrutura da tabela `subscription_plans`:
    *   A coluna `plan_title` (VARCHAR) foi **renomeada para `name`** (VARCHAR).
    *   Os valores da coluna `recurrence` foram alterados de `'Mensal' | 'Anual'` para `'monthly' | 'semestral' | 'annual'`.
    *   A restrição de preço mínimo (`>= 25.00`) foi afrouxada para `>= 0`.
*   **Consequência:** Essa mudança tornou o esquema do banco de dados incompatível com a `Edge Function` e o hook do frontend, que foram escritos com base na estrutura antiga.

#### **Backend (`Edge Function`)**

*   **ERRO:** A função está quebrada. Ela tenta inserir dados na coluna `plan_title` e usar os valores `Mensal`/`Anual`, ambos inexistentes no esquema atual, gerando falhas.
*   **NÃO IMPLEMENTADO:** A integração com o gateway Asaas, um requisito crítico, **não existe** no código da função.
*   **IMPLEMENTAÇÃO FRÁGIL:** A transação atômica foi simulada com um `try/catch` que tenta fazer um "rollback manual" com comandos `DELETE`. Isso não garante atomicidade e é uma prática de alto risco. A abordagem correta seria uma função `RPC` do Supabase.

#### **Frontend (Painel Administrativo)**

*   **NÃO IMPLEMENTADO:** O formulário unificado (`UnifiedMemberTypeForm.tsx`) e a lógica de criação de tipos de membro **não foram encontrados no código**. O que existe é uma página de gerenciamento de usuários (`UserManagement.tsx`) que não tem relação com a funcionalidade e opera com dados fictícios.
*   **Consequência:** Como a tela principal da funcionalidade não foi criada, os menus de "Tipos de Membro" e "Assinaturas" nunca foram unificados.

#### **Frontend (Página de Filiação)**

*   **ERRO:** O hook `useMemberTypeWithPlan` tenta buscar os dados usando a consulta: `...subscription_plans(id, plan_title, price, ...)`
*   **Consequência:** Como `plan_title` não existe mais, a consulta retorna `undefined` para este campo. O componente `MemberTypeSelector`, por sua vez, recebe essa informação e, como `plan_title` está vazio, ele **não renderiza o preço do plano no seletor**, causando o problema visual que você observou.

---

## 3. Conclusão e Recomendações

A implementação atual está em um estado **quebrado e incompleto**. A funcionalidade de unificação foi parcialmente desenvolvida, mas uma alteração posterior e conflitante no banco de dados a tornou inoperante, e a parte administrativa crucial nunca foi finalizada.

**Para corrigir o sistema, é necessário um plano de refatoração que alinhe o banco de dados, o backend e o frontend com um único design consistente.**

Eu posso elaborar um plano de ação detalhado para corrigir esses problemas, que incluiria:

1.  **Corrigir o Schema do Banco de Dados:** Padronizar os nomes de colunas e valores.
2.  **Refatorar a Edge Function:** Implementar a lógica transacional correta via RPC e adicionar a integração com o Asaas.
3.  **Corrigir o Hook do Frontend:** Ajustar a consulta para corresponder ao schema do banco de dados.
4.  **Implementar o Formulário Administrativo:** Criar o componente que falta para o gerenciamento unificado.
5.  **Reorganizar o Menu Administrativo.**

Estou à disposição para discutir os próximos passos e iniciar o processo de correção.