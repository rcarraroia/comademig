# Autenticação

# Autenticação

A autenticação em nossa API é feita através do uso de uma **chave de API**. É através desta chave que nosso sistema identifica a sua conta e permite a comunicação conosco em nome da conta em questão.

Caso a chave de API seja inválida, não seja informada ou o header esteja incorreto, nossa API retornará `HTTP 401`.

A segurança da chave de API é de responsabilidade do cliente. Para reforçar sua segurança, recomendamos que você utilize também os demais mecanismos de proteção disponíveis. Considere definir endereços IP autorizados para adicionar uma camada extra de segurança. Para mais detalhes, consulte as medidas de segurança na documentação: [Mecanismos adicionais de segurança]().

> 🚧
> 
> *   Após a geração da chave de API em nossa interface, armazene-a diretamente em seu cofre de chaves, evitando que seja exposta em mensagens de qualquer tipo ou emails. **Nunca deixe a chave de API diretamente no código fonte de seus sistemas.**
> *   **Não informe sua chave de API em atendimentos, a terceiros ou exponha no front-end da sua aplicação.** Garanta que sua aplicação não exponha a chave em logs de sistema.
> *   Caso seu time de desenvolvimento utilize a **chave de API de Produção** nos ambientes de desenvolvimento ou homologação durante os testes finais da integração, é essencial renová-la antes da entrada em produção, garantindo que o menor número de pessoas possível tenha acesso a ela.
> *   Utilize pelo menos um dos mecanismos adicionais de segurança [descritos aqui]().
> *   A chave de API é irrecuperável, caso seja perdida, é necessário a geração de uma nova.

JSON

`   "Content-Type": "application/json", "User-Agent": "nome_da_sua_aplicação", "access_token": "sua_api_key"   `

> 🚧
> 
> É obrigatório enviar o `User-Agent` no header de todas as requisições em novas contas raiz criadas a partir de **13/06/2024**. Sugerimos enviar o nome da sua aplicação caso o seu framework não adicione um User-Agent padrão.
> 
> O User-Agent é um cabeçalho que ajuda a identificar sua aplicação nas requisições à API. Personalizar esse valor facilita rastrear a origem das chamadas.
> 
> Saiba mais sobre como definir seu User-Agent aqui: [Como posso definir meu user-agent?]()

> 📘
> 
> As Chaves de API são distintas entre os ambientes de Sandbox e Produção, portanto lembre-se de alterá-la quando mudar a URL.

> ❗️
> 
> **Caso seja utilizada a chave de produção, obterá o erro[401 Unauthorized]().**
> 
> Todos os endpoints da documentação apontam para nosso Sandbox, o ambiente de testes do Asaas. Antes de começar você deve [criar uma conta de testes]() e usar sua chave de API para testes.

Para obter sua Chave de API [acesse a área de integrações]() em nossa **interface web**. Pelo aplicativo não tem a opção de gerar chave. Além disso, apenas usuários do tipo administrador, tem permissão para gerar a chave.

> 🔒
> 
> *   Você pode criar até **10** chaves de API para uma conta Asaas.
> *   As chaves podem ser nomeadas, para facilitar a identificação.
> *   É possível definir uma data de expiração para cada chave.
> *   Você pode desabilitar/habilitar uma chave a qualquer momento, sem de fato inválida-la.
> *   Caso a chave seja **excluída**, não é possível restaura-la.

Após a criação da conta e geração da chave de API, utilize a URL específica para cada ambiente em suas chamadas, conforme listado abaixo:

| Ambiente | URL |
| --- | --- |
| Produção | [https://api.asaas.com/v3]() |
| Sandbox | [https://api-sandbox.asaas.com/v3]() |

*   Durante o desenvolvimento da integração, teste as requisições em nosso ambiente de Sandbox utilizando dados fictícios e direcionando as requisições para o domínio “[https://api-sandbox.asaas.com/v3]()", alterando para produção apenas após a validação de todas as funcionalidades.

  

# 

Armazenamento seguro para a Chave de API

A **Chave de API** do Asaas segue o modelo de chave “irrecuperável”, isto é, ela **será exibida apenas uma vez quando criada**. Sendo assim, você precisará copiá-la e salvá-la de modo seguro antes de sair da área de integrações.

*   Nunca armazene chaves de API em texto claro dentro do código-fonte ou em arquivos de configuração acessíveis ao público.
    
*   Utilize mecanismos de segurança, como variáveis de ambiente ou arquivos de configuração protegidos, para armazenar as chaves de API de forma segura.
    
*   Utilize serviços de gerenciamento de segredos para armazenar e gerenciar as chaves de API de forma centralizada e segura, como AWS Secrets Manager, Google Cloud Secret Manager e Azure Key Vault, por exemplo.
    

# 

Transmissão segura da sua Chave de API

*   Utilize exclusivamente protocolos de comunicação seguros, como HTTPS, evitando métodos não criptografados, como HTTP.

Atualmente nossos sistemas em produção aceitam TLS 1.2 e 1.3 para comunicação. Mas recomendamos o uso do TLS 1.3.

# 

Controle de acesso e rotação de chave

*   O acesso à Chave de API deve ser concedido apenas a usuários ou sistemas autorizados que realmente necessitam de acesso aos recursos protegidos.
*   Estabeleça um processo de monitoramento dos logs a fim de rastrear a origem e propósito das requisições, de modo a detectar atividades suspeitas ou uso indevido de sua Chave de API. Ferramentas como SIEM, Splunk, ELK Stack, AWS CloudWatch ou Azure Monitor podem auxiliar no processo.
*   Estabeleça uma política de rotação regular das chaves de API para reduzir o impacto em caso de comprometimento ou vazamento.
*   O armazenamento e segurança da chave apikey é de inteira responsabilidade do cliente, visto que o Asaas não detém dessa informação armazenada em nenhum local de nosso banco.

# 

Erros de autenticação

Uma resposta `401 Unauthorized` indica que sua requisição não pôde ser autenticada. Para te ajudar a diagnosticar o problema rapidamente, nossa API retorna um corpo de erro com uma mensagem específica para cada cenário.

Abaixo estão as causas mais comuns e as mensagens de erro correspondentes:

JSON

`{   "errors": [     {       "code": "invalid_environment",       "description": "A chave de API informada não pertence a este ambiente"     }   ] }`

Verifique se você está usando sua chave de Produção (`$aact_prod_`...) nos endpoints de produção (`api.asaas.com`) e sua chave de Sandbox (`$aact_hmlg_`...) nos endpoints de Sandbox (`api-sandbox.asaas.com`).

JSON

`{   "errors": [     {       "code": "access_token_not_found",       "description": "O cabeçalho de autenticação 'access_token' é obrigatório e não foi encontrado na requisição"     }   ] }`

Garanta que o cabeçalho `access_token` está sendo enviado corretamente em todas as suas requisições.

JSON

`{   "errors": [     {       "code": "invalid_access_token_format",       "description": "O valor fornecido não parece ser uma chave de API válida do Asaas. Verifique o formato da sua chave"     }   ] }`

Verifique se você não copiou espaços extras ou caracteres a mais. Chaves de produção começam com `$aact_prod_` e as de Sandbox com `$aact_hmlg_`.

JSON

`{   "errors": [     {       "code": "invalid_access_token",       "description": "A chave de API fornecida é inválida"     }   ] }`

Confirme se o valor da chave de API que você está enviando está correto e se ela não foi desabilitada, expirada ou excluída no seu painel Asaas.

Updated 23 days ago

Did this page help you?

Yes

No

Ask AI