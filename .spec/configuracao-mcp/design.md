# Design - Configuração de Servidores MCP

## Arquitetura
A configuração é baseada no arquivo `mcp_config.json` localizado em `c:\Users\Rennum\.gemini\antigravity\mcp_config.json`. 

## Alterações Propostas
Adicionar novas chaves ao objeto `mcpServers`.

### Estrutura do JSON
```json
{
  "mcpServers": {
    "supabase-mcp-server": { ... },
    "vercel": {
       "url": "https://mcp.vercel.com",
       "type": "http",
       "autoApprove": [ ... ]
    },
    "langchain-docs": { ... },
    "power-postman-postman": { ... },
    "power-stripe-stripe": { ... },
    "asaas": { ... }
  }
}
```

## Segurança
- O token do Postman (`PMAK-6963f...`) será armazenado diretamente no arquivo de configuração, conforme solicitado/fornecido.
