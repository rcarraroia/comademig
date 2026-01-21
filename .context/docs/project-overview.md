---
type: doc
name: project-overview
description: High-level overview of the project, its purpose, and key components
category: overview
generated: 2026-01-20
status: unfilled
scaffoldVersion: "2.0.0"
---
## Project Overview

O projeto Comademig é uma plataforma completa para gestão de convenções e serviços eclesiásticos. Ele resolve o problema da desburocratização de solicitações de certificados, regularizações e pagamentos para membros e administradores da convenção.

## Codebase Reference

> **Detailed Analysis**: Para contagens completas de símbolos, camadas de arquitetura e gráficos de dependência, consulte [`codebase-map.json`](./codebase-map.json).

## Quick Facts

- Root: `e:/PROJETOS SITE/repositorios/comademig`
- Languages: TypeScript, React, SQL
- Full analysis: [`codebase-map.json`](./codebase-map.json)

## Entry Points

- `npm run dev` — Servidor de desenvolvimento Vite.
- `src/main.tsx` — Ponto de entrada do React.

## File Structure & Code Organization

- `src/` — Código fonte TypeScript/React.
- `supabase/` — Migrações e configurações do banco de dados.
- `public/` — Ativos estáticos.

## Technology Stack Summary

O projeto utiliza uma stack moderna focada em performance e escalabilidade:
- **Frontend**: Vite, React, TanStack Query, shadcn-ui, Tailwind CSS.
- **Backend/DB**: Supabase (Postgres, Auth, Storage).
- **Pagamentos**: Integração com Asaas (PIX e Cartão).

## Core Framework Stack

- **React + Vite**: Build rápido e interface reativa.
- **Supabase**: Backend-as-a-Service para Auth e Persistência.
- **TanStack Query**: Gerenciamento de estado asíncrono e cache.

## UI & Interaction Libraries

- **shadcn-ui + Tailwind**: Design system premium e responsivo.
- **Lucide React**: Biblioteca de ícones.

## Getting Started Checklist

1. Instalar dependências com `npm install`.
2. Configurar variáveis de ambiente no `.env`.
3. Iniciar o projeto com `npm run dev`.

## Related Resources

- [architecture.md](./architecture.md)
- [development-workflow.md](./development-workflow.md)
- [tooling.md](./tooling.md)
- [codebase-map.json](./codebase-map.json)
