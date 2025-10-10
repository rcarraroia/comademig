# 🚀 Guia de Criação de Subcontas Sandbox

## 📋 O que este script faz?

Cria automaticamente 2 subcontas no Asaas Sandbox:

1. **RENUM** - Para receber 40% do split de pagamentos
2. **Beatriz Carraro** - Afiliada de teste para simular comissões (20%)

## 🔧 Pré-requisitos

- Ter criado conta no Asaas Sandbox (https://sandbox.asaas.com)
- Ter gerado a chave de API Sandbox
- Ter configurado a chave no Supabase

## 💻 Como Executar

### Windows (PowerShell)

```powershell
# 1. Abrir PowerShell na pasta do projeto

# 2. Executar o script
.\scripts\criar-subcontas-sandbox.ps1 -ApiKey "sua_chave_sandbox_aqui"
```

**Exemplo:**
```powershell
.\scripts\criar-subcontas-sandbox.ps1 -ApiKey "$aact_hmlg_abc123xyz789"
```

### Linux/Mac (Bash)

```bash
# 1. Dar permissão de execução
chmod +x scripts/criar-subcontas-sandbox.sh

# 2. Definir a chave de API
export ASAAS_API_KEY_SANDBOX="sua_chave_sandbox_aqui"

# 3. Executar o script
./scripts/criar-subcontas-sandbox.sh
```

**Exemplo:**
```bash
export ASAAS_API_KEY_SANDBOX="$aact_hmlg_abc123xyz789"
./scripts/criar-subcontas-sandbox.sh
```

## 📤 Saída do Script

O script irá:

1. ✅ Criar subconta RENUM
2. ✅ Criar subconta Beatriz Carraro
3. ✅ Salvar dados em `.env.subcontas-sandbox`
4. ✅ Exibir Wallet IDs para configuração

### Exemplo de Saída:

```
========================================
  Criação de Subcontas - Asaas Sandbox
========================================

📋 Subcontas que serão criadas:
1. RENUM (para receber 40% do split)
2. Beatriz Carraro (afiliada de teste)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣  Criando Subconta: RENUM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Subconta RENUM criada com sucesso!

📋 Dados da RENUM:
   ID: acc_xxxxxxxxxx
   Wallet ID: wal_xxxxxxxxxx
   API Key: $aact_hmlg_yyyyyyyy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2️⃣  Criando Subconta: Beatriz Carraro
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Subconta Beatriz Carraro criada com sucesso!

📋 Dados da Beatriz Carraro:
   ID: acc_yyyyyyyyyy
   Wallet ID: wal_yyyyyyyyyy
   API Key: $aact_hmlg_zzzzzzzz

========================================
✅ Processo Concluído!
========================================

📄 Dados salvos em: .env.subcontas-sandbox

🔐 IMPORTANTE - Adicione no Supabase:

1. Acesse: Supabase → Settings → Edge Functions → Secrets
2. Adicione a variável:

   Key:   RENUM_WALLET_ID
   Value: wal_xxxxxxxxxx

📝 Para testes de afiliados:
   Use o Wallet ID da Beatriz: wal_yyyyyyyyyy

🎉 Pronto para testes!
```

## 📝 Arquivo Gerado: `.env.subcontas-sandbox`

O script cria um arquivo com todos os dados:

```env
# Subconta RENUM - Sandbox
RENUM_ID=acc_xxxxxxxxxx
RENUM_WALLET_ID=wal_xxxxxxxxxx
RENUM_API_KEY=$aact_hmlg_yyyyyyyy

# Subconta Beatriz Carraro (Afiliada) - Sandbox
BEATRIZ_ID=acc_yyyyyyyyyy
BEATRIZ_WALLET_ID=wal_yyyyyyyyyy
BEATRIZ_API_KEY=$aact_hmlg_zzzzzzzz
```

**⚠️ IMPORTANTE:** Não commite este arquivo! Ele contém chaves sensíveis.

## 🔐 Próximos Passos

### 1. Adicionar Wallet ID da RENUM no Supabase

1. Acesse: https://supabase.com
2. Selecione seu projeto
3. Vá em: **Settings → Edge Functions → Secrets**
4. Clique em **"Add new secret"**
5. Adicione:
   ```
   Key: RENUM_WALLET_ID
   Value: [copiar do arquivo .env.subcontas-sandbox]
   ```
6. Clique em **"Save"**

### 2. Registrar Beatriz como Afiliada no Sistema

Você precisará:

1. Criar um usuário no sistema para Beatriz
2. Cadastrá-la como afiliada
3. Usar o `BEATRIZ_WALLET_ID` no cadastro
4. Gerar código de indicação para ela

### 3. Testar Split de Pagamentos

Após implementar as correções, você poderá testar:

**Cenário 1: Filiação com Afiliado**
```
Pagamento: R$ 1.000,00
Split:
- COMADEMIG: R$ 400,00 (40%)
- RENUM: R$ 400,00 (40%)
- Beatriz: R$ 200,00 (20%)
```

**Cenário 2: Serviço sem Afiliado**
```
Pagamento: R$ 500,00
Split:
- COMADEMIG: R$ 300,00 (60%)
- RENUM: R$ 200,00 (40%)
```

## 🧪 Dados de Teste Criados

### RENUM
- **Nome:** RENUM
- **Email:** renum+sandbox@comademig.org.br
- **CPF:** 12345678901
- **Telefone:** (31) 99999-0001
- **Tipo:** Associação

### Beatriz Carraro (Afiliada)
- **Nome:** Beatriz Carraro
- **Email:** beatriz.carraro+sandbox@comademig.org.br
- **CPF:** 98765432100
- **Telefone:** (31) 99999-0002
- **Tipo:** Pessoa Física

## ❓ Troubleshooting

### Erro: "access_token not found"
- Verifique se você passou a chave de API corretamente
- Certifique-se de que a chave começa com `$aact_hmlg_`

### Erro: "invalid_access_token"
- A chave de API está incorreta ou expirada
- Gere uma nova chave no painel do Asaas Sandbox

### Erro: "CPF já cadastrado"
- As subcontas já foram criadas anteriormente
- Você pode usar os dados existentes
- Ou alterar os CPFs no script e executar novamente

### Script não executa no PowerShell
```powershell
# Permitir execução de scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📚 Referências

- [Documentação Asaas - Subcontas](https://docs.asaas.com/reference/criar-subconta)
- [Documentação Asaas - Split de Pagamentos](https://docs.asaas.com/docs/split-de-pagamentos)
- [Guia de Configuração Sandbox](../docs/GUIA_CONFIGURACAO_SANDBOX_ASAAS.md)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique se a chave de API está correta
2. Confirme que está usando o ambiente sandbox
3. Consulte os logs de erro exibidos pelo script
4. Verifique o arquivo `.env.subcontas-sandbox` gerado

---

**Última atualização:** 09/01/2025  
**Versão:** 1.0
