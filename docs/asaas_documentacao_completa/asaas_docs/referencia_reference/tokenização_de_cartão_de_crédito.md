# Tokenização de cartão de crédito

# Tokenização de cartão de crédito

Essa funcionalidade permite você cobrar de seus clientes recorrentemente sem a necessidade deles informarem todos os dados de cartão de crédito novamente. Tudo isso de forma segura por meio de um token.

> 🚧
> 
> *   A funcionalidade de tokenização está previamente habilitada em Sandbox e você já pode testá-la. Para uso em produção, é necessário solicitar a habilitação da funcionalidade ao seu gerente de contas. A habilitação da funcionalidade está sujeita a análise prévia, podendo ser aprovada ou negada de acordo com os riscos da operação.
> *   O token é armazenado por cliente, não podendo ser utilizado em transações de outros clientes.
> *   Ao habilitar a tokenização, também será ativado o retorno detalhado dos erros sobre as tentativas de transações recusadas.

customer

string

required

Identificador único do cliente no Asaas

creditCard

object

required

Informações do cartão de crédito

creditCard object

creditCardHolderInfo

object

required

Informações do titular do cartão de crédito

creditCardHolderInfo object

remoteIp

string

required

IP de onde o cliente está fazendo a compra. Não deve ser informado o IP do seu servidor.

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

     \--url https://api-sandbox.asaas.com/v3/creditCard/tokenizeCreditCard \\

     \--header 'accept: application/json' \\

     \--header 'content-type: application/json'

Click `Try It!` to start a request and see the response here! Or choose an example:

application/json

200400401