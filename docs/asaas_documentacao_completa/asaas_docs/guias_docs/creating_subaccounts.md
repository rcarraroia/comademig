# Creating subaccounts

# Creating subaccounts

Creating subaccounts allows you to create Asaas accounts for your partners or clients linked to a root account, enabling them to use all Asaas functionalities through our website, mobile app, or via an integrated platform developed by you.

When a subaccount is created, you will receive:

*   The **API key** (`apiKey`) of the subaccount — required for integration.
*   The **`walletId`** — used if you plan to work with [Payment Split]() or [Transfers between Asaas accounts]().

Although subaccounts inherit fee settings and management from the root account, certain configurations must be set individually for each subaccount, such as webhooks, tax information for invoicing, and other operational settings.

> 📘
> 
> The creation of subaccounts incurs a fee for each account created. You can check applicable fees in [Account Settings > Fees]().

> **POST** `/v3/accounts`  
> [See the complete reference for this endpoint]()

JSON

`   {     "name": "Subaccount created via API",     "email": "companyemail@gmail.com",     "cpfCnpj": "66625514000140",     "birthDate": "1994-05-16",     "companyType": "MEI",     "phone": "11 32300606",     "mobilePhone": "11 988451155",     "address": "Av. Rolf Wiest",     "addressNumber": "277",     "complement": "Room 502",     "province": "Bom Retiro",     "postalCode": "89223005" }   `

> 🚧
> 
> *   In the Sandbox environment, you can create up to **20 subaccounts per day**. If this daily limit is reached, an error notification will be returned.
> *   All communications for Sandbox subaccounts will be sent to the root account’s email address. The subaccount owner will also receive notifications.

All subsequent API calls — such as document submission — must be made using the API key of the created subaccount.  
This key is returned in the response to the account creation request and must be stored at that time, as **it cannot be retrieved later**.

Updated 23 days ago

Did this page help you?

Yes

No

Ask AI