# 🚀 Guia de Instalação e Configuração do Supabase CLI

## 📦 Passo 1: Instalação do Supabase CLI

### Opção A: Via Scoop (Recomendado para Windows)
```powershell
# Instalar Scoop se não tiver
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Instalar Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Opção B: Via NPM (se preferir)
```powershell
npm install -g supabase
```

### Opção C: Download Direto
1. Baixar de: https://github.com/supabase/cli/releases
2. Extrair para uma pasta (ex: C:\supabase)
3. Adicionar ao PATH do Windows

## 🔑 Passo 2: Obter Access Token do Supabase

1. Acesse: https://supabase.com/dashboard/account/tokens
2. Clique em "Generate new token"
3. Dê um nome: "COMADEMIG CLI"
4. Copie o token gerado

## 🔗 Passo 3: Login no Supabase CLI

```powershell
# Fazer login com o token
supabase login

# Quando solicitado, cole o Access Token que você gerou
```

## 🔧 Passo 4: Vincular ao Projeto

```powershell
# Listar seus projetos
supabase projects list

# Vincular ao projeto COMADEMIG
supabase link --project-ref amkelczfwazutrciqtlk
```

## ✅ Passo 5: Verificar Configuração

```powershell
# Verificar status
supabase status

# Testar conexão
supabase db dump --schema public
```

## 📝 Passo 6: Configurar Variáveis de Ambiente (Opcional)

Criar arquivo `.env.local` na raiz do projeto:

```env
SUPABASE_URL=https://amkelczfwazutrciqtlk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MzU5NzcsImV4cCI6MjA1MTUxMTk3N30.Uw-Uw-Uw-Uw-Uw-Uw-Uw-Uw-Uw-Uw-Uw-Uw-Uw
SUPABASE_SERVICE_ROLE_KEY=[sua_service_role_key]
```

## 🎯 Comandos Úteis Após Configuração

### Gerenciar Migrações
```powershell
# Criar nova migração
supabase migration new nome_da_migracao

# Aplicar migrações pendentes
supabase db push

# Ver histórico de migrações
supabase migration list

# Reverter última migração
supabase migration repair
```

### Gerenciar Banco de Dados
```powershell
# Executar SQL diretamente
supabase db execute "SELECT * FROM profiles LIMIT 5"

# Fazer dump do banco
supabase db dump -f backup.sql

# Resetar banco local (cuidado!)
supabase db reset
```

### Gerenciar Edge Functions
```powershell
# Listar functions
supabase functions list

# Deploy de function
supabase functions deploy nome_da_function

# Ver logs de function
supabase functions logs nome_da_function
```

### Gerenciar Secrets
```powershell
# Listar secrets
supabase secrets list

# Definir secret
supabase secrets set ASAAS_API_KEY=seu_valor_aqui

# Remover secret
supabase secrets unset ASAAS_API_KEY
```

## 🔍 Verificação de Instalação

Execute este comando para verificar se tudo está funcionando:

```powershell
supabase --version
supabase projects list
supabase link --project-ref amkelczfwazutrciqtlk
supabase db dump --schema public --data-only --table profiles | Select-Object -First 10
```

## ⚠️ Troubleshooting

### Erro: "supabase não é reconhecido"
- Reinicie o PowerShell após instalação
- Verifique se está no PATH: `$env:PATH`

### Erro: "Failed to authenticate"
- Verifique se o Access Token está correto
- Tente fazer logout e login novamente: `supabase logout` e `supabase login`

### Erro: "Project not found"
- Verifique o project-ref: `amkelczfwazutrciqtlk`
- Confirme que você tem acesso ao projeto no dashboard

## 📚 Documentação Oficial
- CLI Reference: https://supabase.com/docs/reference/cli
- Getting Started: https://supabase.com/docs/guides/cli
