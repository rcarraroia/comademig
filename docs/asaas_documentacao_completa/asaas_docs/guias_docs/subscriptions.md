# Subscriptions

# Subscriptions

# 

Can I create subscriptions with a free period?

If you work with a trial period (7 free days, for example), you can follow the same procedure and enter the date of the first charge in the `nextDueDate` field. Thus, if the card is validated upon creation, it will already be saved so that the first payment takes place on the day you inform.

However, if you create the subscription without card details and the payer later enters the card details, the amount will be deducted the moment he inserts the card, regardless of the nextDueDate.

# 

How do subscription notifications work?

Subscription billing notifications will be sent according to the notification settings defined in the client. However, there are some changes depending on the payment method, see below:

**When the payment method is Card**, even if all notifications are enabled in the payer's registration, they are only sent when there is confirmation of payment in the first charge (both for the customer and the payer) and/or when there is confirmation of Payment in future charges (only for the customer).

1.  Notification of charges before due date:  
    This notification will only be sent if the customer manually clicks the Resend E-mail/SMS/WhatsApp notification button and the charge must be in the awaiting payment status.
2.  Notification for overdue charges:  
    If this option is active, the system will only trigger a notification if payment fails.
3.  Other notifications, even if enabled, are not triggered.

**When the payment method is Boleto/Pix or Ask the Customer**, notifications are sent as configured, with the exception of Charge Generation Notice notifications, as in the subscription, charges are always generated 40 days in advance. If enabled, this notification will only be sent on the first charge. If the subscription is defined as Ask the Customer and is paid by Card, the next ones will be defined with the Card payment method, therefore, you will start following the notification rules for card subscriptions.

# 

How do I track subscription billing webhooks?

The signature is just a configuration of how we actually want the charge to be created. Asaas does not have its own webhooks for subscriptions, only for billing. Therefore, management must be carried out through [billing webhooks](). Whenever you create a new subscription, the first charge for it is automatically generated and we send a `PAYMENT_CREATED` webhook, which contains the `subscription` id. Any charge that is part of this subscription will contain the `subscription` attribute in the webhook's JSON, where you can link that such charge is part of a given subscription.

Updated 23 days ago

Did this page help you?

Yes

No

Ask AI