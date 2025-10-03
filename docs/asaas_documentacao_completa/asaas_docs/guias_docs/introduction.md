# Introduction

# Introduction

It is possible to request an advance payment in installments or a one-off charge. In cases of installments, where the payment method is by card, the advance payment may be made for the complete installment or for each installment individually, and when the payment method is by bank slip, the advance payment will be mandatory for each installment individually.

To request a single charge advance, enter the charge ID in the `payment` field. To request an advance payment in installments, enter the installment ID in the `installment` field.

> **POST`/v3/anticipations`**  
> [Check the complete reference of this endpoint]()

JSON

`   {   "payment": "pay_626366773834" }   `

To determine whether sending electronic invoices or service contracts is mandatory, check the `isDocumentationRequired` property returned in [simulation of anticipation]().

> 🚧
> 
> If the charge to be advanced has a defined payment split, it is necessary to observe the execution rules of [Split in advance charges]().

Updated 23 days ago

Did this page help you?

Yes

No

Ask AI