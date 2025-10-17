# Recuperar uma única cobrança

# Recuperar uma única cobrança

**URL:** https://docs.asaas.com/reference/recuperar-uma-unica-cobranca

---

Jump to Content
Discord
Status
Log In
v3
Home
Guias / Guides
Referência / Reference
Changelog
Breaking changes
Sugestões
Search
CTRL-K
JUMP TO
CTRL-/
SELECT YOUR LANGUAGE
Português 🇧🇷
English 🇺🇸
INTRODUÇÃO
Comece por aqui
Como testar as chamadas aqui na documentação
Autenticação
Códigos HTTP das respostas
Listagem e paginação
Limites da API
Guia de Webhooks
Guia de Sandbox
ASAAS
Cobranças
Criar nova cobrança
POST
Listar cobranças
GET
Criar cobrança com cartão de crédito
POST
Capturar cobrança com Pré-Autorização
POST
Pagar uma cobrança com cartão de crédito
POST
Recuperar informações de pagamento de uma cobrança
GET
Informações sobre visualização da cobrança
GET
Recuperar uma única cobrança
GET
Atualizar cobrança existente
PUT
Excluir cobrança
DEL
Restaurar cobrança removida
POST
Recuperar status de uma cobrança
GET
Obter linha digitável do boleto
GET
Obter QR Code para pagamentos via Pix
GET
Guia de cobranças
Confirmar recebimento em dinheiro
POST
Desfazer confirmação de recebimento em dinheiro
POST
Simulador de vendas
POST
Recuperar garantia da cobrança na Conta Escrow
GET
Recuperando limites de cobranças
GET
Ações em sandbox
Cobranças com dados resumidos
Cartão de crédito
Estornos
Splits
Conta Escrow
Documentos de cobranças
Clientes
Notificações
Parcelamentos
Assinaturas
Pix
Transações Pix
Pix Recorrente
Link de pagamentos
Checkout
Transferências
Antecipações
Negativações
Pagamento de contas
Recargas de celular
Consulta Serasa
Extrato
Informações financeiras
Informações e personalização da conta
Notas fiscais
Informações fiscais
Configurações de Webhooks
Subcontas Asaas
Envio de documentos White Label
Chargeback
ENGLISH REFERENCE
Getting started
How to test API calls in our documentation
HTTP response codes
Listing and Pagination
API limits
Webhooks guide
Sandbox guide
Payment
Sandbox Actions
Payment with summary data
Credit Card
Payment Refund
Payment Split
Escrow Account
Payment Document
Customer
Notification
Installment
Subscription
Pix
Pix Transaction
Recurring Pix
Payment Link
Checkout
Transfer
Anticipation
Payment Dunning
Bill
Mobile Phone Recharge
Credit Bureau Report
Financial Transaction
Finance
Account info
Invoice
Fiscal Info
Webhook
Subaccount
Account Document
Chargeback
Powered by 
Ask AI
Recuperar uma única cobrança
GET
https://api-sandbox.asaas.com/v3/payments/{id}

Para recuperar uma cobrança específica é necessário que você tenha o ID que o Asaas retornou no momento da criação dela.

❗️
Evite fazer polling

Polling é a prática de realizar sucessivas requisições GET para verificar status de cobranças. É considerado uma má prática devido ao alto consumo de recursos que ocasiona. Recomendamos que você utilize nossos Webhooks para receber mudanças de status de cobranças e manter sua aplicação atualizada.

Realizar muitas requisições pode levar ao bloqueio da sua chave de API por abuso.

Leia mais: Pooling vs. Webhooks

Path Params
id
string
required

Identificador único da cobrança no Asaas

Responses
200

OK

400

Bad Request

401

Unauthorized

403

Forbidden. Ocorre quando o body da requisição está preenchido, chamadas de método GET precisam ter um body vazio.

404

Not found

Updated 28 days ago

Informações sobre visualização da cobrança
Atualizar cobrança existente
Did this page help you?
Yes
No
LANGUAGE
Shell
Node
Ruby
PHP
Python
CREDENTIALS
HEADER
Header
cURL Request
1
curl --request GET \
2
     --url https://api-sandbox.asaas.com/v3/payments/id \
3
     --header 'accept: application/json'
Try It!
RESPONSE
Examples
Click Try It! to start a request and see the response here! Or choose an example:
application/json
200
400
401