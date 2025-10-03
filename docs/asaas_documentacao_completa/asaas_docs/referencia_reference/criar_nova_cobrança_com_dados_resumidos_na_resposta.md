# Criar nova cobrança com dados resumidos na resposta

# Criar nova cobrança com dados resumidos na resposta

customer

string

required

Identificador único do cliente no Asaas

billingType

string

enum

required

Forma de pagamento

Allowed:

`UNDEFINED``BOLETO``CREDIT_CARD``PIX`

value

number

required

Valor da cobrança

dueDate

date

required

Data de vencimento da cobrança

description

string

Descrição da cobrança (máx. 500 caracteres)

daysAfterDueDateToRegistrationCancellation

int32

Dias após o vencimento para cancelamento do registro (somente para boleto bancário)

externalReference

string

Campo livre para busca

installmentCount

int32

Número de parcelas (somente no caso de cobrança parcelada)

totalValue

number

Informe o valor total de uma cobrança que será parcelada (somente no caso de cobrança parcelada). Caso enviado este campo o installmentValue não é necessário, o cálculo por parcela será automático.

installmentValue

number

Valor de cada parcela (somente no caso de cobrança parcelada). Envie este campo em caso de querer definir o valor de cada parcela.

discount

object

Informações de desconto

discount object

interest

object

Informações de juros para pagamento após o vencimento

interest object

fine

object

Informações de multa para pagamento após o vencimento

fine object

postalService

boolean

Define se a cobrança será enviada via Correios

split

array of objects

Configurações do split

ADD object

callback

object

Informações de redirecionamento automático após pagamento do link de pagamento

callback object

# 

200

OK

# 

400

Bad Request

# 

401

Unauthorized

Updated 16 days ago

Did this page help you?

Yes

No

ShellNodeRubyPHPPython

xxxxxxxxxx

curl \--request POST \\

     \--url https://api-sandbox.asaas.com/v3/lean/payments \\

     \--header \'accept: application/json\' \\

     \--header \'content-type: application/json\' \\

     \--data \'

{

  "billingType": "UNDEFINED"

}

\'

Click `Try It!` to start a request and see the response here! Or choose an example:

application/json

200400401