# Solicitação Técnica de Correção Imediata

**Para:** Assistente de Programação Kiro
**De:** Arquiteto Kilo Code
**Assunto:** Finalização Urgente do Plano de Correção do Sistema de Membros e Assinaturas

Kiro,

A verificação da sua implementação do "Plano de Correção Final" revelou que a execução foi **parcial e inconsistente**. Embora partes do sistema tenham sido corrigidas, falhas críticas permanecem, deixando o projeto em um estado instável e com dívida técnica.

É mandatório que você finalize a implementação de forma completa e correta, sem desvios. As seguintes tarefas pendentes devem ser executadas imediatamente:

---

### **1. Tarefa Pendente: Conclusão da Fase 1 (Backend)**

**Problema:** A antiga e insegura Edge Function `create-unified-member-type` não foi removida.
**Risco:** Manter código obsoleto e inseguro no repositório, que pode ser acidentalmente invocado ou causar confusão em futuras manutenções.

**Ação Imediata e Categórica:**
*   Execute a remoção completa do diretório `supabase/functions/create-unified-member-type`. Não há margem para debate sobre esta ação. O código é obsoleto e deve ser eliminado.

---

### **2. Tarefa Pendente: Conclusão da Fase 3 (Página de Filiação)**

**Problema:** A correção da página de filiação foi feita de forma inconsistente. O hook `useMemberTypeWithPlan` e o componente `MemberTypeSelector` ainda mantêm referências à propriedade `plan_title`, que foi abolida do schema do banco de dados em favor de `name`.

**Risco:** Código inconsistente, difícil de manter e propenso a bugs. A lógica atual depende de um mapeamento (`plan_title: subscription?.name`) que serve como uma "gambiarra" em vez de uma solução correta.

**Ação Imediata e Categórica:**
*   **Refatore o hook `useMemberTypeWithPlan.ts`:**
    1.  Altere a interface `UnifiedMemberType` para remover a propriedade `plan_title` e adicionar `plan_name: string;`.
    2.  Na lógica de mapeamento do hook, atribua o valor de `subscription?.name` para a nova propriedade `plan_name`. Não deve haver mais nenhuma referência a `plan_title` neste arquivo.

*   **Refatore o componente `MemberTypeSelector.tsx`:**
    1.  Atualize o componente para consumir a nova propriedade `plan_name` vinda do hook.
    2.  Substitua todas as ocorrências de `type.plan_title` e `selectedTypeData.plan_title` por `type.plan_name` e `selectedTypeData.plan_name`.
    3.  Na lógica de exibição da recorrência, adicione o tratamento para o valor `'semestral'`, que está ausente.

---

### **Diretriz Final**

A execução destas tarefas não é opcional. Elas são a conclusão do plano que foi definido e aprovado. Execute estas correções exatamente como descrito para garantir que o sistema atinja um estado consistente, seguro e verdadeiramente completo.

Aguardamos a confirmação da finalização destas tarefas.