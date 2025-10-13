# 🚀 INSTRUÇÕES - PRÓXIMOS PASSOS

## ⚠️ AÇÃO IMEDIATA NECESSÁRIA

### 1️⃣ Configurar Secrets no Supabase (5 minutos)

**Passo a passo:**

1. Acesse o painel do Supabase:
   ```
   https://supabase.com/dashboard/project/amkelczfwazutrciqtlk/settings/functions
   ```

2. Clique em **"Add new secret"** ou **"Environment Variables"**

3. Adicione as seguintes variáveis:

   ```env
   Nome: ASAAS_API_KEY
   Valor: $aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjAzMDJhMTdhLTkyYTItNDI1MS1iODk4LTZmZTYxZTkyNzA3Yzo6JGFhY2hfOWNlYTMzMjUtMWJjYi00OTliLTliZWQtMmYzZDlhNzM4MWRj
   ```

   ```env
   Nome: ASAAS_WEBHOOK_TOKEN
   Valor: webhook_prod_36a882b2b9ff39b4106009bd1c554a00901d507ee3758dce
   ```

   ```env
   Nome: ASAAS_BASE_URL
   Valor: https://api.asaas.com/v3
   ```

   ```env
   Nome: ASAAS_ENVIRONMENT
   Valor: production
   ```

4. Clique em **"Save"** ou **"Add"**

5. **Reinicie as Edge Functions** (se houver opção)

---

### 2️⃣ Testar Fluxo de Filiação (10 minutos)

**Teste 1: Usuário NÃO logado (criar nova conta)**

1. Abra o navegador em modo anônimo
2. Acesse: `http://localhost:8080/filiacao`
3. Selecione um tipo de membro
4. Clique em "Prosseguir com a Filiação"
5. Verifique que aparece o alert azul: "✅ Criação de Nova Conta"
6. Preencha o formulário com dados de teste
7. Verifique que:
   - Nova conta é criada
   - Cliente Asaas é criado
   - Assinatura é criada
   - Redirecionamento para dashboard funciona

**Teste 2: Usuário JÁ logado**

1. Faça login com: `rcnaturopata@gmail.com`
2. Acesse: `http://localhost:8080/filiacao`
3. Selecione um tipo de membro
4. Clique em "Prosseguir com a Filiação"
5. Verifique que aparece o alert amarelo: "⚠️ ATENÇÃO: Você já está logado"
6. Teste o botão "clique aqui para sair"
7. Verifique que:
   - Logout funciona
   - Página recarrega
   - Agora aparece o alert azul (nova conta)

**Teste 3: Usuário com filiação existente**

1. Faça login com conta que já tem filiação ativa
2. Acesse: `http://localhost:8080/filiacao`
3. Tente prosseguir com nova filiação
4. Verifique que aparece erro: "Você já possui uma filiação ativa"

---

### 3️⃣ Verificar Logs das Edge Functions (5 minutos)

**No terminal:**

```bash
# Verificar se Edge Functions estão rodando
supabase functions list

# Ver logs em tempo real
supabase functions logs asaas-create-customer --tail

# Ver logs de outra função
supabase functions logs asaas-create-subscription --tail
```

**O que procurar nos logs:**
- ✅ Mensagens de sucesso ao criar cliente
- ✅ Mensagens de sucesso ao criar assinatura
- ❌ Erros de "ASAAS_API_KEY não configurada"
- ❌ Erros de autenticação com Asaas

---

## 📋 CHECKLIST DE VALIDAÇÃO

Marque conforme for completando:

### Configuração:
- [ ] Secrets configurados no Supabase
- [ ] Edge Functions reiniciadas
- [ ] Logs verificados (sem erros de API Key)

### Testes:
- [ ] Teste 1: Nova conta criada com sucesso
- [ ] Teste 2: Logout funciona corretamente
- [ ] Teste 3: Erro de filiação existente funciona
- [ ] Cliente Asaas criado (verificar no painel Asaas)
- [ ] Assinatura criada (verificar no painel Asaas)

### Documentação:
- [ ] Leu `SEGURANCA_ASAAS_API_KEY.md`
- [ ] Leu `RELATORIO_CORRECOES_SEGURANCA_11_01_2025.md`
- [ ] Entendeu as mudanças implementadas

---

## 🆘 TROUBLESHOOTING

### Problema: "ASAAS_API_KEY não configurada"

**Solução:**
1. Verifique se adicionou os secrets no Supabase
2. Reinicie as Edge Functions
3. Aguarde 1-2 minutos para propagação
4. Teste novamente

### Problema: "Erro ao criar cliente no Asaas"

**Possíveis causas:**
1. API Key incorreta
2. Dados do formulário inválidos (CPF, email, etc.)
3. Cliente já existe no Asaas

**Solução:**
1. Verifique logs: `supabase functions logs asaas-create-customer`
2. Verifique se API Key está correta no Supabase
3. Teste com dados diferentes

### Problema: "Você já possui uma filiação ativa"

**Isso é esperado!** A verificação está funcionando.

**Se quiser testar novamente:**
1. Use outro email
2. Ou delete a filiação existente no banco de dados

### Problema: Logout não funciona

**Solução:**
1. Verifique console do navegador (F12)
2. Verifique se há erros JavaScript
3. Limpe cache do navegador
4. Teste em modo anônimo

---

## 📞 COMANDOS ÚTEIS

### Verificar Edge Functions:
```bash
supabase functions list
```

### Ver logs em tempo real:
```bash
supabase functions logs asaas-create-customer --tail
```

### Testar Edge Function diretamente:
```bash
curl -X POST https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-create-customer \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste",
    "email": "teste@teste.com",
    "cpfCnpj": "12345678900",
    "phone": "11987654321"
  }'
```

### Verificar tipos do Supabase:
```bash
npm run update-types
```

---

## 🎯 RESULTADO ESPERADO

Após completar todos os passos:

✅ **Segurança:**
- API Key não está mais exposta no navegador
- Todas as chamadas passam por Edge Functions
- Credenciais seguras no backend

✅ **Funcionalidade:**
- Usuários não logados podem criar conta
- Usuários logados são alertados
- Opção de logout disponível
- Verificação de filiação existente funciona

✅ **UX:**
- Mensagens claras e informativas
- Fluxo intuitivo
- Feedback visual adequado

---

## 📚 DOCUMENTAÇÃO ADICIONAL

Leia estes arquivos para mais detalhes:

1. **SEGURANCA_ASAAS_API_KEY.md**
   - Explicação completa do problema de segurança
   - Arquitetura segura implementada
   - Como usar hooks ao invés de API direta

2. **RELATORIO_CORRECOES_SEGURANCA_11_01_2025.md**
   - Relatório detalhado de todas as correções
   - Arquivos modificados
   - Métricas de sucesso

3. **RESUMO_CORRECOES_EXECUTADAS.md**
   - Resumo executivo
   - Estatísticas
   - Próximos passos

---

## ✅ QUANDO ESTIVER TUDO FUNCIONANDO

Marque este checklist final:

- [ ] Secrets configurados no Supabase
- [ ] Todos os 3 testes passaram
- [ ] Logs sem erros
- [ ] Cliente Asaas criado com sucesso
- [ ] Assinatura criada com sucesso
- [ ] Fluxo de filiação completo funciona

**Parabéns! O sistema está seguro e funcionando corretamente.**

---

## 🚀 MELHORIAS FUTURAS (OPCIONAL)

Quando tiver tempo:

1. **Atualizar tipos do Supabase:**
   ```bash
   npm run update-types
   ```

2. **Adicionar testes automatizados:**
   - Testes E2E do fluxo de filiação
   - Testes de segurança

3. **Configurar monitoramento:**
   - Alertas para falhas nas Edge Functions
   - Métricas de conversão

4. **Melhorar UX:**
   - Loading states mais detalhados
   - Validação em tempo real
   - Mensagens de erro mais específicas

---

**Boa sorte! Se tiver dúvidas, consulte a documentação criada.**

**Gerado por:** Kiro AI  
**Data:** 11/01/2025
