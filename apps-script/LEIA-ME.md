# Finanças da Casa: como ligar ao Google

Faça uma vez só, no computador, com a **sua conta Google principal**. Ela será a dona da planilha com os dados e sempre terá acesso.

Dica: faça tudo numa **janela anônima** do navegador, entrando só nessa conta. Assim o Google não mistura com as suas outras contas.

## Parte 1: o botão "Fazer login com o Google"

1. Entre em https://console.cloud.google.com e crie um projeto chamado **Financas Casa**.
2. No menu, vá em **APIs e serviços → Tela de permissão OAuth** (pode aparecer como "Google Auth Platform") e clique em **Começar**:
   - Nome do app: **Finanças da Casa**
   - E-mail de suporte: o seu
   - Público: **Externo**
   - Contato: o seu e-mail
3. Em **Público**, clique em **Publicar aplicativo**. Sem isso, só e-mails de teste conseguem entrar.
4. Em **Clientes**, clique em **Criar cliente**:
   - Tipo: **Aplicativo da Web**
   - Nome: **Finanças da Casa**
   - Origens JavaScript autorizadas: `https://jonathantecnologia1.github.io`
5. Clique em **Criar** e copie o **ID do cliente**. Ele termina em `.apps.googleusercontent.com`.

## Parte 2: a ponte com a planilha (Apps Script)

1. Entre em https://script.google.com e clique em **Novo projeto**. Dê o nome **Finanças da Casa**.
2. Apague o que estiver escrito e cole todo o conteúdo do arquivo `apps-script/financas.gs`.
   Em **Configurações do projeto** (⚙️), marque **Mostrar arquivo de manifesto "appsscript.json" no editor**. Abra esse arquivo, apague tudo e cole o conteúdo de `apps-script/appsscript.json`.
3. Na linha `const CLIENT_ID = "COLE_AQUI.apps.googleusercontent.com";`, troque pelo ID do cliente da Parte 1. Clique no disquete para salvar.
4. No menu de cima, escolha a função **instalar** e clique em **Executar**.
   - O Google vai pedir permissão. Clique em **Avançado → Acessar Finanças da Casa** e depois em **Permitir**.
   - O aviso "app não verificado" aparece porque o código é seu e não passou pela loja do Google. É seguro.
   - Isso cria no seu Drive a planilha particular **Finanças da Casa (dados)**, com as abas **Pessoas** e **Dados**.
5. Clique em **Implantar → Nova implantação**:
   - Na engrenagem, escolha **App da Web**.
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**. Quem controla o acesso é o login do Google: só entra quem está na aba Pessoas.
6. Clique em **Implantar** e copie o **URL do app da Web**. Ele termina em `/exec`.

## Parte 3: colocar no site

No arquivo `config.js`, preencha as duas linhas:

```js
API: "URL do app da Web (/exec)",
CLIENT_ID: "ID do cliente (.apps.googleusercontent.com)"
```

Depois, publique com `git add -A; git commit -m "Liga o site à planilha"; git push`.

## Parte 4: quem pode entrar

Abra a planilha **Finanças da Casa (dados)** no seu Drive, aba **Pessoas**, e coloque um e-mail Google por linha (coluna A) e o nome que aparece no site (coluna B). Vale na hora, sem publicar nada.

## Parte 5: trazer os dados atuais

Abra https://jonathantecnologia1.github.io/financas-casa/importar.html, entre com Google, escolha o `dados.json` e toque em **Importar**. Depois pode apagar o `importar.html`.

## Depois

- **Se mudar o código do Apps Script**: vá em **Implantar → Gerenciar implantações → lápis → Versão: Nova versão → Implantar**. O endereço continua o mesmo.
- A aba **Dados** guarda os lançamentos. Não edite à mão; use o site.
