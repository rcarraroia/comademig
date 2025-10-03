# Encerrar garantia da cobrança na Conta Escrow

# Encerrar garantia da cobrança na Conta Escrow

POST https://api-sandbox.asaas.com/v3/escrow/{id}/finish

## Guia de Contas escrow

[Confira o guia de contas escrow para mais informações.](https://docs.asaas.com/docs/conta-escrow)

### Path Params

| Parâmetro | Tipo   | Obrigatório | Descrição                                                              |
| :-------- | :----- | :---------- | :--------------------------------------------------------------------- |
| id        | string | required    | Identificador único da garantia da cobrança na Conta Escrow do Asaas |

### Responses

*   **200 OK**
*   **400 Bad Request**
*   **401 Unauthorized**
*   **404 Not found**