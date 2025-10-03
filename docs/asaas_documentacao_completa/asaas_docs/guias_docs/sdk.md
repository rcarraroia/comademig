# SDK

# SDK

> 📘
> 
> O SDK do Asaas foi criado para facilitar a integração com a nossa API, reduzindo a complexidade de chamadas HTTP, tratamento de respostas e serialização de dados. Ele oferece uma maneira mais simples, segura e produtiva de trabalhar com os recursos da plataforma.

Embora a API RESTful do Asaas continue sendo a base de toda a comunicação, o SDK abstrai diversos detalhes técnicos para que você possa focar na lógica de negócio da sua aplicação.

Alguns benefícios do uso do SDK incluem:

*   **Uso de DTOs bem definidos**: você interage com objetos estruturados que representam exatamente os dados esperados e retornados pela API.
*   **Serviços organizados por domínio**: cada recurso da API (cobranças, clientes , notificações, etc.) é encapsulado por um serviço dedicado, com métodos claros e tipados.
*   **Menos código boilerplate**: o SDK lida com autenticação, construção de requisições, parâmetros, serialização e tratamento de erros.
*   **Suporte a chamadas síncronas e assíncronas**: é possível fazer chamadas de forma tradicional ou assíncrona.
*   **Validações embutidas**: parâmetros são validados antes do envio, prevenindo erros comuns de integração.
*   **Alinhado à API do Asaas**: o SDK é atualizado conforme a evolução da plataforma, incorporando novos recursos e melhorias.

Use o SDK quando quiser:

*   Reduzir o tempo e a complexidade da integração com o Asaas.
*   Trabalhar com tipos de dados seguros e estruturas bem definidas.
*   Minimizar erros de integração, como parâmetros incorretos ou problemas de serialização.
*   Melhorar a legibilidade e manutenção do seu código.

> 💡Você pode adotar o SDK de forma gradual, utilizando-o apenas em partes da sua aplicação, conforme fizer sentido para o seu projeto.

Atualmente, o SDK oficial do Asaas está disponível para Java:

*   [SDK Java](): Ideal para aplicações desenvolvidas com Java ou Kotlin.

Estamos trabalhando para disponibilizar SDKs oficiais para outras linguagens no futuro.

Updated 23 days ago

Did this page help you?

Yes

No

Ask AI