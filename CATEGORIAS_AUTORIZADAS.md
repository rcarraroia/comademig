# ✅ CATEGORIAS AUTORIZADAS - DEFINITIVO

**Data:** 2025-10-19  
**Status:** APROVADO PELO USUÁRIO

---

## 🎯 CATEGORIAS AUTORIZADAS

### APENAS 2 CATEGORIAS:

1. ✅ **certidao** - Certidões
2. ✅ **regularizacao** - Regularização

---

## ❌ CATEGORIAS NÃO AUTORIZADAS

### NÃO INCLUIR:

- ❌ **filiacao** - Tem módulo próprio
- ❌ **evento** - Módulo de assinaturas
- ❌ **taxa_anual** - Módulo de assinaturas
- ❌ **outros** - Será deletada

---

## 📝 SQL DE CRIAÇÃO

```sql
-- APENAS 2 CATEGORIAS AUTORIZADAS
INSERT INTO service_categories (code, name, description) VALUES
  ('certidao', 'Certidões', 'Emissão de certidões e documentos'),
  ('regularizacao', 'Regularização', 'Regularização de situação cadastral');
```

---

## 🎯 REGRA

**Se precisar de mais categorias no futuro:**
- Usuário cria via interface admin
- Não incluir automaticamente

---

**APROVADO** ✅
