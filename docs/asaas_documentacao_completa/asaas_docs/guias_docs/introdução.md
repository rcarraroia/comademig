# Introdução

# Introdução

Um Webhook é uma forma automatizada de enviar informações entre sistemas quando certos eventos ocorrem. Quando você ativa um Webhook, ele passará a enviar requisições `POST` para o endereço configurado sempre que determinado evento acontecer. Essa requisição incluirá informações sobre o evento e o recurso envolvido.

# 

Por que usar Webhooks?

Se você deseja que os dados de pagamento ou informações de clientes estejam sempre sincronizados com sua aplicação, os Webhooks são a melhor solução. Eles funcionam como uma "API reversa", onde o Asaas realizará uma chamada HTTP REST na sua aplicação.

Para habilitar o recebimento de eventos de webhooks você precisa configurar a URL que receberá os eventos, o que pode ser feito via interface, acessando a [aplicação web](), ou [via API](). É possível cadastrar até 10 URLs de webhooks diferentes, e em cada uma você define quais eventos quer receber.

# 

Habilitando um Webhook

Para ativar os Webhooks você deve acessar a área de Integrações do Asaas, na aba de Webhooks, e informar a URL da sua aplicação que deve receber o POST do Asaas. Você também pode configurar Webhooks via API. Confira os guias:

*   [Criar novo Webhook pela aplicação web]()
*   [Criar novo Webhook pela API]()

# 

Boas práticas no uso de Webhooks

Utilize estas práticas para garantir que sua integração com Webhooks seja segura e funcione adequadamente.

Os webhooks garantem a entrega "_at least once_" (ao menos uma entrega). Isso significa que seu endpoint pode receber ocasionalmente o mesmo evento de webhook mais de uma vez. Você pode ignorar eventos duplicados utilizando [idempotência](). Uma maneira de fazer isso é registrando os eventos que já foram processados e ignorá-los caso sejam enviados novamente. Cada evento enviado pelos Webhooks possui um ID próprio, que se repete caso se trate do mesmo evento.

Configure apenas os tipos de eventos necessários para sua aplicação em cada Webhook. Receber tipos de eventos adicionais (ou todos os tipos de eventos) sobrecarrega seu servidor e não é recomendável.

Você pode encontrar problemas de escalabilidade se optar por eventos síncronos ou ter problemas de sobrecarregamento no host em caso de picos de eventos em endpoints, por isso é melhor implementar o processamento da fila de eventos de forma assíncrona.

Para impedir que a sua aplicação receba requisições de outras origens, você tem a opção de utilizar um token para autenticar as requisições vindas do Asaas. Este token pode ser informado na configuração do Webhook. O token informado será enviado em todas as notificações no header `asaas-access-token`.

Para que o Asaas considere a notificação como processada com sucesso, o status HTTP da resposta deve ser maior ou igual a `200` e menor que 300. A sincronização é feita toda vez que há uma mudança em um evento, e caso seu sistema falhe em responder sucesso 15 vezes consecutivas, a fila de sincronização será interrompida. Novas notificações continuam sendo geradas e incluídas na fila de sincronia, porém não são enviadas para a sua aplicação. Após certificar-se que seu sistema responderá uma resposta de sucesso para o Asaas, basta reativar fila de sincronia acessando a área Minha Conta, aba Integração. Todos os eventos pendentes serão processados em ordem cronológica.

Se a sua aplicação retornar qualquer resposta HTTP que não é da família 200, a sua [fila de eventos será interrompida]() e você receberá um e-mail de comunicação do Asaas para deixá-lo ciente disso. Fique atento para evitar ter problemas de sincronização de eventos.

> ❗️
> 
> *   O Asaas guarda eventos de Webhooks por **14 dias**. Você receberá um e-mail caso haja algum problema de comunicação e seus Webhooks pararem de funcionar.
> *   Caso sua fila seja pausada, é de extrema importância que você resolva qualquer problema em até **14 dias** para evitar perder informações importantes.
> *   **Os eventos que estiverem mais de 14 dias parados na fila serão excluídos permanentemente.**

Updated 23 days ago

Did this page help you?

Yes

No

Ask AI