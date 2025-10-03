# Security

# Security

# 

Receiving critical action error. What to do?

When making some calls, such as transfers, for example, you may encounter a “Critical authorization enabled” error:

JSON

`   {    "errors":        [        {          "code": "invalid_action",            "description": "Your account has critical authorization enabled. To perform this action, enter the confirmation code."        }      ]  }   `

All transfers made on Asaas, except for White Label accounts, must be approved via SMS token or APP token. However, if you need a more automatic way to make transfers, it is possible to replace the token with other security features.

It is possible to fix IPs in Asaas so that only [these IPs use our API](). If any other IP tries, you will receive an error saying that it is not considered safe. With this, the authentication token can be safely removed.

Another option is to configure an authentication webhook, [as stated in our documentation]().

You can ask your account manager to disable critical authorization in production (by enabling one of the security features mentioned above) or contact support to disable it in Sandbox.

Updated 23 days ago

Did this page help you?

Yes

No

Ask AI