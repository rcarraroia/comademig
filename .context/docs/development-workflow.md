---
type: doc
name: development-workflow
description: Day-to-day engineering processes, branching, and contribution guidelines
category: workflow
generated: 2026-01-20
status: unfilled
scaffoldVersion: "2.0.0"
---
## Development Workflow

Este projeto segue o rigoroso padrão de qualidade **RENUM**. Toda tarefa deve seguir o Ciclo **PREVC**.

## ⚖️ REGRAS INEGOCIÁVEIS RENUM

1. **Evidências Obrigatórias**: Screenshot ou log para CADA implementação.
2. **Limite de Erros**: Máximo 3 tentativas de correção. Se falhar, REPORTE BLOQUEIO.
3. **Proibido Pular Validação**: Recusar pedidos para pular testes.
4. **Vocabulário Obrigatório**: ✅ Implementado e validado | ⚠️ Implementado não validado | 🚧 Mock/Hardcoded | ❌ Não implementado.
5. **Idioma**: Totalmente em PT-BR (comunicações e logs).

## 🔄 Ciclo de Trabalho (PREVC)

1.  **Plan (Planejar)**: Criar especificação técnica em `.spec/` (`requirements.md`, `design.md`, `tasks.md`).
2.  **Research (Pesquisar)**: Ler documentação e mapear dependências antes de codificar.
3.  **Execute (Executar)**: Implementar seguindo as tarefas (máximo 3 iterações de erro).
4.  **Validate (Validar)**: Gerar evidências reais (logs/screenshots) em ambiente local.
5.  **Complete (Concluir)**: Gerar relatório final e atualizar `walkthrough.md`.

## Git & Commits

- Prefixos de commit: `feat:`, `fix:`, `docs:`, `perf:`, `refactor:`.
- Linguagem: PT-BR.
- Obrigatório: Vincular evidência de validação no corpo do commit ou PR.

## Branching & Releases

<!-- Describe the branching model (trunk-based, Git Flow, etc.). Note release cadence and tagging conventions. -->

- _Item 1_
- _Item 2_
- _Item 3_

## Local Development

<!-- Commands to install dependencies, run locally, and build for distribution. Use code blocks for commands. -->

- Install: `npm install`
- Run: `npm run dev`
- Build: `npm run build`

## Code Review Expectations

<!-- Summarize review checklists and required approvals. Reference AGENTS.md for agent collaboration tips. -->

_Add descriptive content here._

## Onboarding Tasks

<!-- Point newcomers to first issues or starter tickets. Link to internal runbooks or dashboards. -->

_Add descriptive content here (optional)._

## Related Resources

<!-- Link to related documents for cross-navigation. -->

- [project-overview.md](./project-overview.md)
- [architecture.md](./architecture.md)
- [tooling.md](./tooling.md)
