# Overview

# Overview

Asaas enables companies (legal entities) to issue Service Invoices to their customers. It's possible to issue an Invoice linked to existing charges or as standalone invoices.

> 🚧
> 
> Before issuing an invoice, it's necessary to fill out the fiscal information in your account. [Check here how to set up this information.]()

Via API, there is a sequence of calls that need to be made in order:

1.  [List municipal settings]() — where it will be defined what the municipality related to your registration requires to be configured;
2.  [Create or update municipal settings]() — knowing what the municipality requires, in this call you will create or update the municipal settings;
3.  [List municipal services]() — before finally issuing an invoice, it's necessary to know what to inform in the call. For this, the call to list municipal services aims to bring the API's own Id for a specific service;
4.  [Schedule invoice]() — finally, with everything configured and the service listed, knowing which Id to use, this is the call to schedule the invoice;

To learn more about the **invoice product**, [click here]().

Updated 23 days ago

Did this page help you?

Yes

No

Ask AI