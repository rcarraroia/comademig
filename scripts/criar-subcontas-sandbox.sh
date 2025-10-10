#!/bin/bash

# Script para criar subcontas no Asaas Sandbox
# Execute este script após configurar a variável ASAAS_API_KEY_SANDBOX

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Criação de Subcontas - Asaas Sandbox${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Verificar se a chave de API foi fornecida
if [ -z "$ASAAS_API_KEY_SANDBOX" ]; then
    echo -e "${RED}❌ Erro: Variável ASAAS_API_KEY_SANDBOX não definida${NC}"
    echo ""
    echo "Execute o script assim:"
    echo "export ASAAS_API_KEY_SANDBOX='sua_chave_sandbox'"
    echo "./scripts/criar-subcontas-sandbox.sh"
    exit 1
fi

ASAAS_URL="https://api-sandbox.asaas.com/v3"

echo -e "${YELLOW}📋 Subcontas que serão criadas:${NC}"
echo "1. RENUM (para receber 40% do split)"
echo "2. Beatriz Carraro (afiliada de teste)"
echo ""
echo -e "${YELLOW}⏳ Aguarde...${NC}"
echo ""

# ========================================
# 1. Criar Subconta RENUM
# ========================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1️⃣  Criando Subconta: RENUM${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

RENUM_RESPONSE=$(curl -s --request POST \
  --url "${ASAAS_URL}/accounts" \
  --header "access_token: ${ASAAS_API_KEY_SANDBOX}" \
  --header "Content-Type: application/json" \
  --header "User-Agent: COMADEMIG-Setup" \
  --data '{
    "name": "RENUM",
    "email": "renum+sandbox@comademig.org.br",
    "cpfCnpj": "12345678901",
    "birthDate": "1990-01-01",
    "phone": "31999990001",
    "mobilePhone": "31999990001",
    "address": "Rua Teste RENUM",
    "addressNumber": "100",
    "province": "Centro",
    "postalCode": "30000000",
    "companyType": "ASSOCIATION",
    "incomeValue": 10000
  }')

# Verificar se houve erro
if echo "$RENUM_RESPONSE" | grep -q '"errors"'; then
    echo -e "${RED}❌ Erro ao criar subconta RENUM:${NC}"
    echo "$RENUM_RESPONSE" | jq '.'
    echo ""
else
    echo -e "${GREEN}✅ Subconta RENUM criada com sucesso!${NC}"
    echo ""
    
    # Extrair dados importantes
    RENUM_ID=$(echo "$RENUM_RESPONSE" | jq -r '.id')
    RENUM_WALLET_ID=$(echo "$RENUM_RESPONSE" | jq -r '.walletId')
    RENUM_API_KEY=$(echo "$RENUM_RESPONSE" | jq -r '.apiKey')
    
    echo -e "${GREEN}📋 Dados da RENUM:${NC}"
    echo "   ID: $RENUM_ID"
    echo "   Wallet ID: $RENUM_WALLET_ID"
    echo "   API Key: $RENUM_API_KEY"
    echo ""
    
    # Salvar em arquivo
    echo "# Subconta RENUM - Sandbox" > .env.subcontas-sandbox
    echo "RENUM_ID=$RENUM_ID" >> .env.subcontas-sandbox
    echo "RENUM_WALLET_ID=$RENUM_WALLET_ID" >> .env.subcontas-sandbox
    echo "RENUM_API_KEY=$RENUM_API_KEY" >> .env.subcontas-sandbox
    echo "" >> .env.subcontas-sandbox
fi

sleep 2

# ========================================
# 2. Criar Subconta Beatriz Carraro (Afiliada)
# ========================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2️⃣  Criando Subconta: Beatriz Carraro${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

BEATRIZ_RESPONSE=$(curl -s --request POST \
  --url "${ASAAS_URL}/accounts" \
  --header "access_token: ${ASAAS_API_KEY_SANDBOX}" \
  --header "Content-Type: application/json" \
  --header "User-Agent: COMADEMIG-Setup" \
  --data '{
    "name": "Beatriz Carraro",
    "email": "beatriz.carraro+sandbox@comademig.org.br",
    "cpfCnpj": "98765432100",
    "birthDate": "1995-05-15",
    "phone": "31999990002",
    "mobilePhone": "31999990002",
    "address": "Rua Teste Afiliado",
    "addressNumber": "200",
    "province": "Centro",
    "postalCode": "30000000",
    "companyType": "INDIVIDUAL",
    "incomeValue": 5000
  }')

# Verificar se houve erro
if echo "$BEATRIZ_RESPONSE" | grep -q '"errors"'; then
    echo -e "${RED}❌ Erro ao criar subconta Beatriz Carraro:${NC}"
    echo "$BEATRIZ_RESPONSE" | jq '.'
    echo ""
else
    echo -e "${GREEN}✅ Subconta Beatriz Carraro criada com sucesso!${NC}"
    echo ""
    
    # Extrair dados importantes
    BEATRIZ_ID=$(echo "$BEATRIZ_RESPONSE" | jq -r '.id')
    BEATRIZ_WALLET_ID=$(echo "$BEATRIZ_RESPONSE" | jq -r '.walletId')
    BEATRIZ_API_KEY=$(echo "$BEATRIZ_RESPONSE" | jq -r '.apiKey')
    
    echo -e "${GREEN}📋 Dados da Beatriz Carraro:${NC}"
    echo "   ID: $BEATRIZ_ID"
    echo "   Wallet ID: $BEATRIZ_WALLET_ID"
    echo "   API Key: $BEATRIZ_API_KEY"
    echo ""
    
    # Salvar em arquivo
    echo "# Subconta Beatriz Carraro (Afiliada) - Sandbox" >> .env.subcontas-sandbox
    echo "BEATRIZ_ID=$BEATRIZ_ID" >> .env.subcontas-sandbox
    echo "BEATRIZ_WALLET_ID=$BEATRIZ_WALLET_ID" >> .env.subcontas-sandbox
    echo "BEATRIZ_API_KEY=$BEATRIZ_API_KEY" >> .env.subcontas-sandbox
fi

sleep 1

# ========================================
# Resumo Final
# ========================================

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Processo Concluído!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ -f ".env.subcontas-sandbox" ]; then
    echo -e "${GREEN}📄 Dados salvos em: .env.subcontas-sandbox${NC}"
    echo ""
    echo -e "${YELLOW}🔐 IMPORTANTE - Adicione no Supabase:${NC}"
    echo ""
    echo "1. Acesse: Supabase → Settings → Edge Functions → Secrets"
    echo "2. Adicione a variável:"
    echo ""
    echo -e "   ${GREEN}Key:${NC}   RENUM_WALLET_ID"
    echo -e "   ${GREEN}Value:${NC} $RENUM_WALLET_ID"
    echo ""
    echo -e "${YELLOW}📝 Para testes de afiliados:${NC}"
    echo "   Use o Wallet ID da Beatriz: $BEATRIZ_WALLET_ID"
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}📋 Resumo das Subcontas:${NC}"
    cat .env.subcontas-sandbox
    echo ""
fi

echo -e "${GREEN}🎉 Pronto para testes!${NC}"
echo ""
