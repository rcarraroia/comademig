# Fazer upload de documentos da cobrança

# Fazer upload de documentos da cobrança

Permite anexar um documento dentro da cobrança, que será disponibilizado ao pagador diretamente na fatura Asaas para download.

id

string

required

Identificador único da cobrança no Asaas

availableAfterPayment

boolean

required

true para disponibilizar o documento apenas após o pagamento

type

string

enum

required

Tipo de documento

Allowed:

`INVOICE``CONTRACT``MEDIA``DOCUMENT``SPREADSHEET``PROGRAM``OTHER`

file

file

required

Arquivo

# 

200

OK

# 

400

Bad Request

# 

401

Unauthorized

404

Not found

Updated 16 days ago

Did this page help you?

Yes

No

ShellNodeRubyPHPPython

xxxxxxxxxx

curl \--request POST \\

     \--url https://api-sandbox.asaas.com/v3/payments/id/documents \\

     \--header 'accept: application/json' \\

     \--header 'content-type: multipart/form-data' \\

     \--form availableAfterPayment\=true \\

     \--form type\=INVOICE

Click `Try It!` to start a request and see the response here! Or choose an example:

application/json

200400401