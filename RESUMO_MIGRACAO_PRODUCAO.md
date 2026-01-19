# 🚀 RESUMO EXECUTIVO: Migração para Produção

**Sistema**: COMADEMIG  
**Data**: 2025-11-28  
**Tempo estimado**: 30-60 minutos

---

## 📋 CHECKLIST RÁPIDO

### ANTES DE COMEÇAR:
- [ ] Conta Asaas aprovada para produção
- [ ] Acesso ao Dashboard Supabase
- [ ] Acesso ao Dashboard Vercel
- [ ] Backup das configurações atuais

### PASSO A PASSO:

#### 1️⃣ OBTER CREDENCIAIS ASAAS (5 min)
```
Dashboard Asaas > Configurações > API > Gerar nova chave
Copiar: API Key de produção ($aact_prod_...)
Copiar: Wallet ID (para splits)
```

#### 2️⃣ CONFIGURAR SUPABASE (10 min)
```powershell
# Executar script automatizado
.\scripts\configure_production.ps1
```

**OU manualmente:**
```powershell
supabase secrets set ASAAS_API_KEY="$aact_prod_..." --project-ref amkelczfwazutrciqtlk
supabase secrets set ASAAS_BASE_URL="https://api.asaas.com/v3" --project-ref amkelczfwazutrciqtlk
supabase secrets set ASAAS_ENVIRONMENT="production" --project-ref amkelczfwazutrciqtlk
supabase secrets set ASAAS_WEBHOOK_TOKEN="$(openssl rand -hex 32)" --project-ref amkelczfwazutrciqtlk
```

#### 3️⃣ REDEPLOY EDGE FUNCTIONS (5 min)
```powershell
supabase functions deploy --project-ref amkelczfwazutrciqtlk
```

#### 4️⃣ CONFIGURAR VERCEL (5 min)
```
Dashboard Vercel > Settings > Environment Variables

Adicionar (Production):
- VITE_ASAAS_ENVIRONMENT = production
- VITE_ASAAS_BASE_URL = https://api.asaas.com/v3

Redeploy: Deployments > Redeploy
```

#### 5️⃣ CONFIGURAR WEBHOOK ASAAS (5 min)
```
Dashboard Asaas > Webhooks > Adicionar

URL: https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook
Token: (copiar do output do script)
Eventos: Todos relacionados a PAYMENT_*
```

#### 6️⃣ TESTAR (10-20 min)
```powershell
# Verificar configuração
python scripts/verify_production_config.py

# Monitorar logs
supabase functions logs asaas-webhook --project-ref amkelczfwazutrciqtlk --tail
```

---

## ⚠️ AVISOS IMPORTANTES

### 🔴 CRÍTICO:
- **Cobranças em produção são REAIS**
- **Teste com valores mínimos primeiro** (R$ 0,01)
- **Monitore logs constantemente**
- **Tenha plano de rollback pronto**

### 🟡 ATENÇÃO:
- Webhooks devem ser HTTPS
- Token deve ser forte (32+ caracteres)
- Backup de configurações antes de mudar
- Testar em horário de baixo movimento

---

## 🔄 ROLLBACK RÁPIDO

Se algo der errado:

```powershell
# Executar script de rollback
.\scripts\rollback_to_sandbox.ps1
```

**OU manualmente:**
```powershell
supabase secrets set ASAAS_API_KEY="$aact_hmlg_..." --project-ref amkelczfwazutrciqtlk
supabase secrets set ASAAS_BASE_URL="https://sandbox.asaas.com/api/v3" --project-ref amkelczfwazutrciqtlk
supabase secrets set ASAAS_ENVIRONMENT="sandbox" --project-ref amkelczfwazutrciqtlk
supabase functions deploy --project-ref amkelczfwazutrciqtlk
```

---

## 📊 MONITORAMENTO

### Logs essenciais:
```powershell
# Edge Functions
supabase functions logs asaas-webhook --tail

# Vercel
vercel logs --follow
```

### Métricas a observar:
- Taxa de sucesso de cobranças (> 95%)
- Tempo de resposta (< 3s)
- Erros de webhook (< 1%)
- Falhas de pagamento

---

## 📁 ARQUIVOS CRIADOS

- `GUIA_MIGRACAO_SANDBOX_PARA_PRODUCAO.md` - Guia completo detalhado
- `scripts/configure_production.ps1` - Script automatizado de configuração
- `scripts/rollback_to_sandbox.ps1` - Script de rollback
- `scripts/verify_production_config.py` - Verificação de configuração

---

## 🎯 PRÓXIMOS PASSOS APÓS PRODUÇÃO

1. **Monitorar por 24h** - Verificar logs e métricas
2. **Testar fluxos críticos** - Pagamento, webhook, splits
3. **Documentar incidentes** - Registrar problemas encontrados
4. **Ajustar alertas** - Configurar notificações de erro
5. **Treinar equipe** - Ensinar procedimentos de suporte

---

## 📞 CONTATOS DE EMERGÊNCIA

**Supabase Support**: https://supabase.com/dashboard/support  
**Asaas Support**: suporte@asaas.com  
**Vercel Support**: https://vercel.com/support

---

## ✅ VALIDAÇÃO FINAL

Antes de considerar migração completa:

- [ ] Criar cliente funciona
- [ ] Gerar cobrança funciona
- [ ] Webhook é recebido e processado
- [ ] Dados são salvos corretamente
- [ ] Splits de afiliados funcionam
- [ ] Logs sem erros críticos
- [ ] Performance aceitável (< 3s)
- [ ] Equipe treinada
- [ ] Documentação atualizada
- [ ] Plano de rollback testado

---

**BOA SORTE! 🚀**

**Lembre-se: Teste bem, monitore constantemente, e tenha sempre um plano B!**
