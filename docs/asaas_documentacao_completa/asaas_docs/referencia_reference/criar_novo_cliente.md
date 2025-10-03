# Criar novo cliente

# Criar novo cliente

Para que seja possível criar uma cobrança, antes é necessário criar o cliente ao qual ela irá pertencer. Você deve utilizar o ID retornado nesta requisição na criação da cobrança.

Caso você envie o `postalCode` do cliente, não é necessário enviar os atributos `city`, `province` e `address`, pois o Asaas preencherá estas informações automaticamente com base no CEP que você informou. Nestes casos basta enviar somente `postalCode` e `addressNumber`.

No campo `city` é retornado um identificador. Caso você queira obter o nome e demais informações da cidade você deve fazer a seguinte requisição utilizando esse identificador:  
`GET https://api.asaas.com/v3/cities/{city_id}`

> 🚧
> 
> O sistema permite a criação de clientes duplicados. Portanto, se você não quiser permitir é necessário implementar a validação antes de realizar a criação do cliente. Você pode consultar a existência do cliente no [Listar Clientes]().

> 📘
> 
> **Produção:** Caso seu cliente seja estrangeiro, será necessário entrar em contato com seu Gerente de Contas para que ele solicite a liberação em seu cadastro de criação de clientes estrangeiros.
> 
> **Sandbox:** Em sandbox é possível gerar clientes estrangeiros sem liberação prévia.

> 🚧
> 
> O envio e recebimento de notificações de email e SMS funcionam normalmente em Sandbox. **Portanto você não deve criar clientes com emails e celulares reais ou números aleatórios como (51) 9999-9999**. Para testar o recebimento de notificações você pode utilizar os seus próprios emails e celulares.

name

string

required

Nome do cliente

cpfCnpj

string

required

CPF ou CNPJ do cliente

email

string

Email do cliente

phone

string

Fone fixo

mobilePhone

string

Fone celular

address

string

Logradouro

addressNumber

string

Número do endereço

complement

string

Complemento do endereço (máx. 255 caracteres)

province

string

Bairro

postalCode

string

CEP do endereço

externalReference

string

Identificador do cliente no seu sistema

notificationDisabled

boolean

true para desabilitar o envio de notificações de cobrança

additionalEmails

string

Emails adicionais para envio de notificações de cobrança separados por ","

municipalInscription

string

Inscrição municipal do cliente

stateInscription

string

Inscrição estadual do cliente

observations

string

Observações adicionais

groupName

string

Nome do grupo ao qual o cliente pertence

company

string

Empresa

foreignCustomer

boolean

informe true caso seja pagador estrangeiro

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

     \--url https://api-sandbox.asaas.com/v3/customers \\

     \--header 'accept: application/json' \\

     \--header 'content-type: application/json'

Click `Try It!` to start a request and see the response here! Or choose an example:

application/json

200400401