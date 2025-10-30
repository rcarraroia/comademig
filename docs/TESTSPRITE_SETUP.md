# Configuração do TestSprite

## O que é o TestSprite?

TestSprite é uma plataforma de testes automatizados com IA que pode:
- Gerar planos de teste automaticamente
- Escrever código de teste
- Executar casos de teste
- Fornecer relatórios detalhados de testes
- Completar um ciclo completo de testes em 10-20 minutos

## Integração via MCP Server

O TestSprite pode ser integrado ao projeto através do MCP (Model Context Protocol) Server, permitindo que a IA gere e execute testes diretamente no seu ambiente de desenvolvimento.

## Como Conectar o TestSprite ao Projeto

Para conectar o TestSprite ao projeto comademig, você precisa adicionar o MCP server usando o comando do Claude Code CLI:

```bash
claude mcp add TestSprite --env API_KEY=sk-user-P0h_pDoANG5z9a4SzZFdxk9Mmhb-KpgQQqeva4-hlkOcVWYcU4ljQkRX3NbMlkq1Vt6P9LtHPyCTaseHXe91_PpcOHwTizuKNGiEdTBQXB-uHTo0pMfT4e1rsMdA0huUKkY -- npx @testsprite/testsprite-mcp@latest
```

### Pré-requisitos

- Node.js >= 22
- Conta TestSprite (gratuita disponível)
- API Key do TestSprite (já fornecida acima)

## Verificação da Instalação

Após executar o comando, você deve:
1. Ver um ponto verde no ícone do TestSprite MCP server
2. As ferramentas do TestSprite estarão disponíveis para uso

## Recursos do TestSprite

### Web Portal
- Interface visual para gerenciamento de testes
- Dashboard com métricas e relatórios
- Gestão de API Keys em Settings

### MCP Server
- Integração com IDE (VS Code, Cursor, etc.)
- Geração automática de testes
- Execução de testes via AI

## Próximos Passos

Após conectar o TestSprite:
1. O TestSprite poderá analisar o código do projeto
2. Gerar testes automaticamente baseado na estrutura do código
3. Executar testes e fornecer relatórios detalhados
4. Sugerir melhorias nos testes existentes

## Documentação Oficial

- Docs: https://docs.testsprite.com
- Installation: https://docs.testsprite.com/mcp/installation
- API Keys: https://docs.testsprite.com/web-portal/api-keys
- Quickstart: https://docs.testsprite.com/mcp/quickstart

## Informações do Projeto Comademig

O projeto já possui:
- Vitest configurado para testes unitários
- Alguns testes existentes em `src/__tests__/`
- Categorias de testes: componentes, integração, performance, segurança
- Scripts npm para executar testes (adicionados): `npm test`, `npm run test:run`, `npm run test:coverage`

O TestSprite pode complementar e expandir essa infraestrutura de testes existente.
