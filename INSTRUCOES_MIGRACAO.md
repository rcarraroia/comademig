# 🚨 INSTRUÇÕES OBRIGATÓRIAS - EXECUÇÃO MANUAL NECESSÁRIA

## ⚠️ ATENÇÃO: MIGRAÇÃO SQL DEVE SER EXECUTADA MANUALMENTE

### 📋 SCRIPT CRIADO MAS NÃO EXECUTADO AUTOMATICAMENTE

Foi criado o script de migração: `supabase/migrations/20250908000001_add_service_fields_to_asaas_cobrancas.sql`

**VOCÊ DEVE:**

1. **Copiar o script SQL** do arquivo de migração
2. **Abrir o Editor SQL** no painel do Supabase (https://supabase.com/dashboard)
3. **Colar e executar** o script manualmente
4. **Confirmar** que a execução foi bem-sucedida
5. **Validar** que as novas colunas foram criadas

### 🔧 O QUE O SCRIPT FAZ:

- ✅ Adiciona coluna `service_type` à tabela `asaas_cobrancas`
- ✅ Adiciona coluna `service_data` (JSONB) à tabela `asaas_cobrancas`
- ✅ Cria índices para performance
- ✅ Atualiza registros existentes
- ✅ Cria funções auxiliares e view
- ✅ Adiciona validações de dados

### 📊 VERIFICAÇÃO PÓS-EXECUÇÃO:

Após executar o script, você deve ver:
- Novas colunas criadas
- Índices criados
- Estatísticas de migração
- Distribuição por tipo de serviço

### 🧪 PRÓXIMO PASSO:

Após confirmar que a migração foi executada com sucesso, execute:

```bash
python test_corrected_edge_function.py
```

Este teste validará se:
- ✅ Edge function aceita novos campos
- ✅ Diferentes tipos de serviço funcionam
- ✅ Validações estão funcionando
- ✅ QR Code PIX é gerado
- ✅ Dados são salvos corretamente

---

**⚠️ NÃO PROSSIGA SEM EXECUTAR A MIGRAÇÃO PRIMEIRO!**