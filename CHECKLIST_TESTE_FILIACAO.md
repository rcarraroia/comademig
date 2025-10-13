# ✅ CHECKLIST DE TESTE - CORREÇÃO DE FILIAÇÃO

## 🎯 OBJETIVO
Testar se a correção do erro 400 na filiação funcionou.

---

## 📋 PREPARAÇÃO

- [ ] Servidor de desenvolvimento rodando (`npm run dev`)
- [ ] Navegador aberto (Chrome/Edge recomendado)
- [ ] DevTools aberto (F12)
- [ ] Aba Console visível
- [ ] Aba Network visível
- [ ] Console limpo (Ctrl+L)

---

## 🧪 TESTE 1: FILIAÇÃO COM FORMATAÇÃO

### Dados para Preencher

```
✅ Nome Completo: TESTE DEBUG
✅ CPF: 111.444.777-35 (COM pontos e traços)
✅ Telefone: (31) 98765-4321 (COM parênteses e traços)
✅ Email: teste.debug@teste.com
✅ CEP: 30130-100 (COM traço)
✅ Endereço: Rua Teste
✅ Número: 123
✅ Complemento: (deixar vazio)
✅ Bairro: Centro
✅ Cidade: Belo Horizonte
✅ Estado: MG
✅ Igreja: Igreja Teste
✅ Cargo na Igreja: (deixar vazio)
✅ Tempo de Ministério: (deixar vazio)
✅ Senha: Teste123
✅ Confirmar Senha: Teste123
✅ Método de Pagamento: PIX
✅ Aceitar Termos: ✓
✅ Aceitar Privacidade: ✓
```

### Executar

- [ ] Acessar: http://localhost:8080/filiacao
- [ ] Selecionar tipo de membro
- [ ] Clicar "Prosseguir com a Filiação"
- [ ] Preencher formulário com dados acima
- [ ] Clicar "Finalizar Filiação"

### Verificar Console

Procurar por:

- [ ] `🧹 DADOS LIMPOS (sem formatação):`
- [ ] CPF limpo: `11144477735` (sem pontos/traços)
- [ ] Telefone limpo: `31987654321` (sem parênteses/traços)
- [ ] CEP limpo: `30130100` (sem traço)

- [ ] `📤 BODY COMPLETO ENVIADO À EDGE FUNCTION:`
- [ ] JSON com dados limpos

- [ ] `📥 RESPOSTA DA EDGE FUNCTION:`
- [ ] `"success": true`
- [ ] `"customer_id": "cus_..."`
- [ ] `"message": "Cliente criado com sucesso"`

### Verificar Network Tab

- [ ] Procurar requisição `asaas-create-customer`
- [ ] Status: **201 Created** ✅
- [ ] Payload contém dados limpos (sem formatação)
- [ ] Response contém `success: true`

### Resultado Esperado

- [ ] ✅ Mensagem de sucesso na tela
- [ ] ✅ Redirecionamento para dashboard
- [ ] ✅ Sem erros no console
- [ ] ✅ Status 201 no Network

---

## 🧪 TESTE 2: FILIAÇÃO SEM FORMATAÇÃO

### Dados para Preencher

```
✅ Nome Completo: TESTE SEM FORMATACAO
✅ CPF: 11144477735 (SEM pontos e traços)
✅ Telefone: 31987654321 (SEM parênteses e traços)
✅ Email: teste.sem.formatacao@teste.com
✅ CEP: 30130100 (SEM traço)
✅ (resto igual ao teste 1)
```

### Executar

- [ ] Repetir passos do Teste 1
- [ ] Usar dados sem formatação

### Resultado Esperado

- [ ] ✅ Deve funcionar igual ao Teste 1
- [ ] ✅ Status 201 Created
- [ ] ✅ Cliente criado com sucesso

---

## 🧪 TESTE 3: CPF INVÁLIDO (Deve Falhar)

### Dados para Preencher

```
✅ CPF: 111.111.111-11 (CPF inválido - todos dígitos iguais)
✅ (resto igual ao teste 1)
```

### Executar

- [ ] Repetir passos do Teste 1
- [ ] Usar CPF inválido

### Resultado Esperado

- [ ] ❌ Deve rejeitar no formulário OU
- [ ] ❌ Deve retornar erro 400 com mensagem clara
- [ ] ❌ Mensagem: "CPF/CNPJ deve ter formato válido"

---

## 📊 RESULTADOS

### ✅ SUCESSO (Todos os testes passaram)

**Teste 1:** [ ] Passou  
**Teste 2:** [ ] Passou  
**Teste 3:** [ ] Passou (rejeitou CPF inválido)

**Ação:** Marcar correção como concluída ✅

---

### ⚠️ FALHA PARCIAL (Alguns testes falharam)

**Teste 1:** [ ] Passou / [ ] Falhou  
**Teste 2:** [ ] Passou / [ ] Falhou  
**Teste 3:** [ ] Passou / [ ] Falhou

**Ação:** Copiar logs e me enviar para análise

---

### ❌ FALHA TOTAL (Nenhum teste passou)

**Erro observado:**
```
(Copiar mensagem de erro aqui)
```

**Status HTTP:** ___

**Ação:** Copiar TODOS os logs e Network tab

---

## 📤 INFORMAÇÕES PARA ENVIAR (Se houver falha)

### Console Logs

```
(Colar aqui TODOS os logs que começam com 📤 e 📥)
```

### Network - Payload

```json
(Colar aqui o JSON do Payload da requisição)
```

### Network - Response

```json
(Colar aqui o JSON da Response)
```

### Status HTTP

```
Status: ___
```

### Screenshot

```
(Se possível, anexar screenshot do erro)
```

---

## 🎯 CRITÉRIOS DE SUCESSO

Para considerar a correção bem-sucedida:

1. ✅ Teste 1 (com formatação) deve passar
2. ✅ Teste 2 (sem formatação) deve passar
3. ✅ Teste 3 (CPF inválido) deve rejeitar
4. ✅ Status HTTP 201 Created
5. ✅ Cliente criado no Asaas
6. ✅ Filiação completada
7. ✅ Sem erros no console

---

## ⏱️ TEMPO ESTIMADO

- Preparação: 2 minutos
- Teste 1: 3 minutos
- Teste 2: 2 minutos
- Teste 3: 2 minutos
- **Total: ~10 minutos**

---

## 📞 SUPORTE

Se precisar de ajuda:

1. Copiar logs completos
2. Copiar Network tab (Payload + Response)
3. Descrever o que aconteceu
4. Me enviar para análise

**NÃO** tente múltiplas vezes se falhar (evitar criar múltiplos usuários).

---

**Data:** 13/10/2025  
**Versão:** 1.0  
**Status:** PRONTO PARA TESTE ✅
