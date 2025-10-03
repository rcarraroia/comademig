# Estornos

# Estornos

Após uma cobrança ter estornos, o atributo `refunds` é retornado no objeto da mesma. Um exemplo retornado:

```json
{
  "refunds": [
    {
      "dateCreated": "2022-02-21 10:28:40",
      "status": "DONE",
      "value": 2.00,
      "description": "Pagamento a mais",
      "transactionReceiptUrl": "https://www.asaas.com/comprovantes/6677732109104548",
    }
  ]
}
```

Os status disponíveis no retorno do campo `refunds` são:

*   `PENDING`, `CANCELLED` e `DONE`
