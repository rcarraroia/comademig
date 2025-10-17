# Confirmar recebimento em dinheiro

# Confirmar recebimento em dinheiro

**URL:** https://docs.asaas.com/reference/confirmar-recebimento-em-dinheiro

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
Confirmar recebimento em dinheiro
POST
https://api-sandbox.asaas.com/v3/payments/{id}/receiveInCash

Quando um cliente fizer o pagamento de uma cobrança diretamente para você, sem que esse pagamento seja processado pelo Asaas, utilize este método para definir a cobrança como recebida em dinheiro. Esta opção serve para manter seu histórico consistente no sistema, mas não gera saldo ou faz qualquer alteração financeira em sua conta.

Ao confirmar um recebimento em dinheiro de uma cobrança que possua uma negativação em andamento uma taxa de ativação de serviço de negativação poderá ser cobrada. Verifique essa taxa no campo receivedInCashFeeValue localizada no retorno do objeto de negativação.

Path Params
id
string
required

Identificador único da cobrança no Asaas

Body Params
paymentDate
date

Data em que o cliente efetuou o pagamento

value
number

Valor pago pelo cliente

notifyCustomer
boolean

Enviar ou não notificação de pagamento confirmado para o cliente

false
true
false
Responses
200

OK

400

Bad Request

401

Unauthorized

404

Not found

Updated 28 days ago

Obter QR Code para pagamentos via Pix
Desfazer confirmação de recebimento em dinheiro
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
Examples
1
curl --request POST \
2
     --url https://api-sandbox.asaas.com/v3/payments/id/receiveInCash \
3
     --header 'accept: application/json' \
4
     --header 'content-type: application/json'
Try It!
RESPONSE
Examples
Click Try It! to start a request and see the response here! Or choose an example:
application/json
200
400
401