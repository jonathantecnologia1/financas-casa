# Finanças da Casa – versão para hospedar

Arquivos:
- index.html – o sistema
- firebase-config.js – configuração do seu projeto Firebase (preencher)
- firestore.rules – quem pode acessar (preencher os e-mails)
- importar.html – traz os lançamentos que já existem (usar uma vez)
- dados.json – os lançamentos atuais exportados

## 1. Criar o banco (Firebase, plano gratuito)
1. Acesse console.firebase.google.com e crie um projeto (o Google Analytics pode ficar desligado).
2. Build > Firestore Database > Criar banco de dados > região southamerica-east1 (São Paulo) > modo de produção.
3. Build > Authentication > Começar > Método de login > Google > Ativar.
4. Configurações do projeto (engrenagem) > Seus apps > ícone Web (</>) > registre o app.
   Copie o objeto firebaseConfig para dentro do firebase-config.js.

## 2. Liberar os e-mails da casa
1. Edite firestore.rules e coloque os e-mails Google de quem vai usar.
2. No console: Firestore Database > Regras > cole o conteúdo do arquivo > Publicar.
   Para incluir alguém depois, é só adicionar o e-mail e publicar de novo.

## 3. Hospedar (GitHub Pages)
1. Crie um repositório, por exemplo financas-casa, e envie os arquivos (index.html, firebase-config.js, importar.html).
   Não suba o dados.json num repositório público: ele tem os seus lançamentos.
2. Settings > Pages > Branch main / root > Save. O endereço será https://SEU-USUARIO.github.io/financas-casa/
3. No Firebase: Authentication > Configurações > Domínios autorizados > adicionar SEU-USUARIO.github.io

## 4. Trazer os dados atuais
1. Abra https://SEU-USUARIO.github.io/financas-casa/importar.html
2. Entre com Google, escolha o dados.json (do seu computador ou celular) e toque em Importar.
3. Depois disso pode apagar o importar.html do repositório.

## 5. Usar no celular
Abra o endereço no navegador, entre com Google e use "Adicionar à Tela de Início" para virar um ícone de app.
Para sair da conta, toque no nome "Casa" no topo.
