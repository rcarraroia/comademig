# 🤖 Como Configurar Supabase CLI Automaticamente via Kiro AI

## 📋 Guia Completo para Replicar em Outros Projetos

Este documento descreve o processo completo de como o Kiro AI configurou automaticamente o Supabase CLI no projeto COMADEMIG, permitindo que você replique em outros projetos.

---

## 🎯 Objetivo

Permitir que o Kiro AI execute operações no Supabase diretamente via CLI, sem necessidade de intervenção manual para cada migração ou deploy.

---

## 📝 Pré-requisitos

### O que o Kiro AI precisa ter acesso:
- ✅ Executar comandos PowerShell/CMD no Windows
- ✅ Instalar pacotes via gerenciadores (Scoop, NPM)
- ✅ Acesso ao Access Token do Supabase (fornecido pelo usuário)

### O que o usuário precisa fornecer:
- ✅ Access Token do Supabase (gerado em https://supabase.com/dashboard/account/tokens)
- ✅ Project Reference ID (ex: `amkelczfwazutrciqtlk`)

---

## 🚀 Processo de Configuração Automática

### Passo 1: Verificar se CLI já está instalado

```powershell
# Comando executado pelo Kiro
where supabase
```

**Resultado esperado:**
- Se instalado: Retorna caminho do executável
- Se não instalado: Retorna erro (Exit Code 1)

---

### Passo 2: Instalar Scoop (se necessário)

```powershell
# Comando executado pelo Kiro
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
irm get.scoop.sh | iex
```

**Por que Scoop?**
- ✅ Gerenciador de pacotes oficial recomendado pelo Supabase
- ✅ Instalação limpa e versionada
- ✅ Fácil atualização e remoção
- ❌ NPM não suporta instalação global do Supabase CLI

**Resultado esperado:**
```
Scoop was installed successfully!
```

---

### Passo 3: Adicionar bucket do Supabase

```powershell
# Comando executado pelo Kiro
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
```

**Resultado esperado:**
```
Checking repo... OK
```

---

### Passo 4: Instalar Supabase CLI

```powershell
# Comando executado pelo Kiro
scoop install supabase
```

**Resultado esperado:**
```
'supabase' (2.51.0) was installed successfully!
```

**Nota:** Pode instalar dependências como 7zip automaticamente.

---

### Passo 5: Verificar instalação

```powershell
# Comando executado pelo Kiro
supabase --version
```

**Resultado esperado:**
```
2.51.0
```

---

### Passo 6: Fazer login (REQUER INTERAÇÃO DO USUÁRIO)

**⚠️ PONTO CRÍTICO: Este passo requer o Access Token do usuário**

#### Como o usuário obtém o Access Token:

1. Acessar: https://supabase.com/dashboard/account/tokens
2. Clicar em "Generate new token"
3. Dar um nome (ex: "Kiro CLI")
4. Copiar o token gerado (formato: `sbp_xxxxx...`)

#### Como o Kiro executa o login:

```powershell
# Comando executado pelo Kiro (com token fornecido pelo usuário)
echo "sbp_1e3bae2619e156a77c61847293b10dd5d27c16d6" | supabase login
```

**Resultado esperado:**
```
You are now logged in. Happy coding!
```

**⚠️ IMPORTANTE:**
- O token é sensível e dá acesso a TODOS os projetos do usuário
- Nunca commitar o token no Git
- Nunca compartilhar o token publicamente
- O Kiro AI usa o token apenas para configuração inicial

---

### Passo 7: Linkar ao projeto

```powershell
# Comando executado pelo Kiro
supabase link --project-ref amkelczfwazutrciqtlk
```

**Como obter o Project Reference ID:**
- Dashboard do Supabase > Project Settings > General > Reference ID
- Ou extrair da URL do projeto: `https://supabase.com/dashboard/project/[PROJECT_REF]`

**Resultado esperado:**
```
Initialising login role...
Connecting to remote database...
Finished supabase link.
```

---

### Passo 8: Verificar configuração completa

```powershell
# Comandos de verificação executados pelo Kiro

# 1. Verificar projetos disponíveis
supabase projects list

# 2. Verificar migrações
supabase migration list

# 3. Verificar Edge Functions
supabase functions list

# 4. Testar execução de SQL
supabase db execute "SELECT COUNT(*) FROM profiles"
```

---

## 📄 Script de Teste Automático

O Kiro criou um script PowerShell para testar toda a configuração:

```powershell
# Arquivo: test_supabase_cli.ps1

# Testa:
# 1. Instalação do CLI
# 2. Autenticação
# 3. Link com projeto
# 4. Conexão com banco
# 5. Listagem de migrações
# 6. Listagem de functions

# Executar:
.\test_supabase_cli.ps1
```

---

## 🔧 Comandos Disponíveis Após Configuração

### Gerenciamento de Migrações
```powershell
# Criar nova migração
supabase migration new nome_descritivo

# Aplicar migrações pendentes
supabase db push

# Ver histórico
supabase migration list

# Reverter
supabase migration repair
```

### Execução de SQL
```powershell
# Query direta
supabase db execute "SELECT * FROM tabela LIMIT 5"

# Executar arquivo
supabase db execute -f script.sql

# Dump do banco
supabase db dump --schema public -f backup.sql
```

### Edge Functions
```powershell
# Deploy
supabase functions deploy nome-function

# Logs em tempo real
supabase functions logs nome-function --tail

# Listar
supabase functions list
```

### Secrets
```powershell
# Definir
supabase secrets set CHAVE=valor

# Listar (sem mostrar valores)
supabase secrets list

# Remover
supabase secrets unset CHAVE
```

---

## 📋 Checklist para Replicar em Outro Projeto

### Preparação (Usuário):
- [ ] Obter Access Token em https://supabase.com/dashboard/account/tokens
- [ ] Identificar Project Reference ID do projeto
- [ ] Ter PowerShell com permissões de execução

### Execução (Kiro AI):
- [ ] Verificar se CLI já está instalado
- [ ] Instalar Scoop (se necessário)
- [ ] Adicionar bucket do Supabase
- [ ] Instalar Supabase CLI
- [ ] Verificar versão instalada
- [ ] Fazer login com Access Token fornecido
- [ ] Linkar ao projeto específico
- [ ] Verificar migrações existentes
- [ ] Verificar Edge Functions
- [ ] Testar execução de SQL
- [ ] Criar script de teste
- [ ] Documentar configuração

### Validação:
- [ ] `supabase --version` retorna versão
- [ ] `supabase projects list` mostra projetos
- [ ] `supabase migration list` mostra migrações
- [ ] `supabase functions list` mostra functions
- [ ] Executar `test_supabase_cli.ps1` com sucesso

---

## 🔒 Segurança e Boas Práticas

### ✅ O que fazer:
- Gerar Access Token específico para o CLI
- Dar nome descritivo ao token (ex: "Kiro CLI - Projeto X")
- Revogar token se não for mais necessário
- Usar tokens diferentes para projetos diferentes (opcional)

### ❌ O que NÃO fazer:
- Nunca commitar Access Token no Git
- Nunca compartilhar token publicamente
- Nunca usar JWT Secret do projeto (é diferente!)
- Nunca usar service_role key para o CLI

### 🔐 Diferença entre tokens:

| Token | Onde encontrar | Para que serve | Usar no CLI? |
|-------|---------------|----------------|--------------|
| Access Token | Account > Access Tokens | Autenticar CLI | ✅ SIM |
| JWT Secret | Project > API Settings | Assinar tokens JWT | ❌ NÃO |
| Anon Key | Project > API Settings | Frontend público | ❌ NÃO |
| Service Role | Project > API Settings | Backend privado | ❌ NÃO |

---

## 🐛 Troubleshooting

### Erro: "supabase não é reconhecido"
**Solução:**
```powershell
# Reiniciar PowerShell
# Ou adicionar ao PATH manualmente
$env:PATH += ";$HOME\scoop\shims"
```

### Erro: "Failed to authenticate"
**Causa:** Token incorreto ou expirado
**Solução:**
1. Verificar se é o Access Token (não JWT Secret)
2. Gerar novo token
3. Fazer logout e login novamente:
```powershell
supabase logout
supabase login
```

### Erro: "Project not found"
**Causa:** Project Reference ID incorreto
**Solução:**
1. Verificar ID em Project Settings > General
2. Tentar linkar novamente:
```powershell
supabase link --project-ref [ID_CORRETO]
```

### Erro: NPM não funciona
**Causa:** Supabase CLI não suporta instalação global via NPM
**Solução:** Usar Scoop (método recomendado)

---

## 📊 Comparação: Antes vs Depois

### ANTES (sem CLI):
```
1. Kiro cria script SQL
2. Kiro salva em arquivo
3. Kiro pede para usuário copiar
4. Usuário abre Dashboard
5. Usuário cola no Editor SQL
6. Usuário executa manualmente
7. Usuário confirma sucesso
8. Kiro prossegue
```
**Tempo:** ~5-10 minutos por migração

### DEPOIS (com CLI):
```
1. Kiro analisa banco
2. Kiro cria migração via CLI
3. Kiro aplica automaticamente
4. Kiro verifica resultado
5. Kiro documenta
```
**Tempo:** ~30 segundos por migração

---

## 🎯 Benefícios da Configuração Automática

### Para o Kiro AI:
- ✅ Execução direta de migrações
- ✅ Deploy automático de functions
- ✅ Gerenciamento de secrets
- ✅ Logs em tempo real
- ✅ Verificação automática de resultados

### Para o Desenvolvedor:
- ✅ Menos intervenção manual
- ✅ Processo mais rápido
- ✅ Menos erros humanos
- ✅ Histórico versionado
- ✅ Rollback facilitado

### Para o Projeto:
- ✅ Migrações versionadas no Git
- ✅ Processo padronizado
- ✅ Auditoria completa
- ✅ Reprodutibilidade
- ✅ CI/CD facilitado

---

## 📚 Arquivos de Referência

Após configuração, os seguintes arquivos são criados/atualizados:

1. **`setup_supabase_cli.md`**
   - Guia de instalação manual (backup)
   - Comandos úteis
   - Troubleshooting

2. **`test_supabase_cli.ps1`**
   - Script de verificação automática
   - Testes de conectividade

3. **`.kiro/steering/supabase-execution-rules.md`**
   - Regras atualizadas com CLI
   - Protocolo de execução
   - Comandos disponíveis

4. **`CLI_CONFIGURADO_SUCESSO.md`**
   - Documentação do que foi configurado
   - Status da instalação
   - Capacidades disponíveis

5. **`.kiro/steering/como-configurar-supabase-cli-automaticamente.md`** (este arquivo)
   - Guia completo de replicação
   - Processo passo a passo

---

## 🔄 Replicação em Novo Projeto

### Passo a Passo Rápido:

1. **Usuário fornece:**
   - Access Token do Supabase
   - Project Reference ID

2. **Kiro executa:**
```powershell
# Verificar instalação
where supabase

# Se não instalado:
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
irm get.scoop.sh | iex
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Configurar
echo "[ACCESS_TOKEN]" | supabase login
supabase link --project-ref [PROJECT_REF]

# Verificar
supabase projects list
supabase migration list
supabase functions list
```

3. **Validar:**
```powershell
.\test_supabase_cli.ps1
```

**Tempo total:** ~5 minutos

---

## ✅ Conclusão

Este processo permite que o Kiro AI configure automaticamente o Supabase CLI em qualquer projeto, necessitando apenas:

1. Access Token do usuário (fornecido uma vez)
2. Project Reference ID
3. Permissões para executar comandos PowerShell

Após configuração, o Kiro AI pode gerenciar completamente o banco de dados e Edge Functions sem intervenção manual, acelerando drasticamente o desenvolvimento.

---

## 📞 Suporte

**Documentação oficial:**
- Supabase CLI: https://supabase.com/docs/reference/cli
- Scoop: https://scoop.sh

**Arquivos de referência neste projeto:**
- `.kiro/steering/supabase-execution-rules.md`
- `setup_supabase_cli.md`
- `CLI_CONFIGURADO_SUCESSO.md`
