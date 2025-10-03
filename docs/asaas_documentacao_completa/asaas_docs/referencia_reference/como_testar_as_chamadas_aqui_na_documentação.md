# Como testar as chamadas aqui na documentação

# Como testar as chamadas aqui na documentação

Antes de realizar as chamadas em nossa documentação, você precisa de uma conta no ambiente Sandbox.

1.  Acesse: [https://sandbox.asaas.com]()
2.  Crie sua conta gratuitamente
3.  Dentro do Menu (o menu fica no bonequinho cinza no canto superior direito da tela), vá em Integrações > Chave da API
4.  Copie a sua **chave de API**

  

> ⚠️

**🔐 Segurança e boas práticas:**

A chave Sandbox é exclusiva para testes e pode ser usada sempre que você quiser simular integrações sem impactos reais. Essa sempre será a chave que utilizará para testes! No entanto, a chave de produção deve ser armazenada com segurança e jamais compartilhada publicamente.

Recomendamos seguir boas práticas de segurança para o armazenamento de chaves sensíveis. Confira nossos artigos sobre o tema:  
👉 [Como armazenar sua chave com segurança]()

1.  Na nossa documentação, escolha a rota que quer utilizar. Na lateral direita, abaixo de "Asaas", temos diversas abas onde pode selecionar a rota desejada:
    
2.  No topo da documentação interativa, no canto superior direito, localize o campo **Header** e cole sua chave de API
    

  

Quando você escolher qual chamada API que realizar, notará que alguns campos são obrigatórios:

*   Os campos obrigatórios têm “required” escrito ao lado
*   Leia as descrições ao lado de cada campo para saber o que preencher
*   Alguns campos contém exemplos que ajudam a entender o formato de preenchimento. Você pode utilizar a informação contida neles para preenchê-los, mas em campos do tipo **data** use **datas futuras** (maiores que o dia de hoje) e nos campos do tipo `id` , use `ids`da **sua conta em sandbox** (ex: `id` de um cliente que você tenha criado na sua conta sandbox, `id` de uma cobrança que tenha criado em sandbox)

  

> 💡

1.  Clique em **Try It!** após preencher os dados
2.  Veja a resposta exibida logo abaixo

A resposta traz:

*   **Status HTTP** (ex: `200 OK`, `400 Bad Request`, etc)
*   **Corpo JSON** com os dados do recurso

*   Para status diferentes de 200 (sucesso), consulte nossa documentação de códigos HTTP:  
    [https://docs.asaas.com/reference/codigos-http-das-respostas]()
*   Os erros geralmente vêm acompanhados de mensagens explicativas, mas o código já ajuda a identificar o problema junto da nossa documentação!

Quer começar testando sem complicação? Aqui estão algumas rotas úteis:

*   [Criar cliente]()
*   [Criar nova cobrança]()
*   [Consultar cobranças]()

Updated 23 days ago

Did this page help you?

Yes

No