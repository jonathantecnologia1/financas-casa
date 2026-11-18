// FINANÇAS DA CASA: ponte entre o site (index.html) e uma planilha particular no seu Google Drive.
// Este arquivo NÃO roda no GitHub: ele é colado em script.google.com (passo a passo em apps-script/LEIA-ME.md).
//
// Onde ficam os dados: na planilha "Finanças da Casa (dados)", criada sozinha no seu Drive pela função instalar().
//  - Aba "Pessoas": os e-mails Google de quem pode entrar (e o nome que aparece no site).
//  - Aba "Dados":   os lançamentos e o orçamento. Não edite essa aba à mão.
// A planilha não é pública: os e-mails e os valores não aparecem para ninguém de fora.

// Código do cliente do "Fazer login com o Google" (Google Cloud). Não é segredo: pode ficar aqui.
const CLIENT_ID = "COLE_AQUI.apps.googleusercontent.com";
const COLECOES = ["lancamentos", "config"];

// Rode esta função UMA vez pelo editor (botão "Executar"): ela pede as permissões e cria a planilha de dados.
function instalar() {
  Logger.log("Pronto! Planilha de dados: " + planilha().getUrl());
}

function doPost(e) {
  let resposta;
  try {
    const pedido = JSON.parse(e.postData.contents);
    const eu = quemEstaUsando(pedido.token);
    if (pedido.acao === "dados") resposta = dados(pedido, eu);
    else if (pedido.acao === "gravar") resposta = gravar(pedido.ops || []);
    else throw falha("Ação desconhecida.");
  } catch (err) {
    resposta = { erro: err.message, codigo: err.codigo || "" };
  }
  return ContentService.createTextOutput(JSON.stringify(resposta)).setMimeType(ContentService.MimeType.JSON);
}

function falha(mensagem, codigo) {
  const e = new Error(mensagem);
  e.codigo = codigo || "";
  return e;
}

// ---------------------------------------------------------------------------
// QUEM ESTÁ USANDO: confere o login do Google e a lista da aba Pessoas.
function quemEstaUsando(token) {
  if (!token) throw falha("Entre com sua conta Google.", "entrar");
  const cache = CacheService.getScriptCache();
  const chave = "t" + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token));
  let email, nomeGoogle;
  try { ({ email, nomeGoogle } = JSON.parse(cache.get(chave)) || {}); } catch (e) {}
  if (!email) {
    const r = UrlFetchApp.fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(token), { muteHttpExceptions: true });
    const info = JSON.parse(r.getContentText() || "{}");
    if (r.getResponseCode() !== 200 || info.aud !== CLIENT_ID || String(info.email_verified) !== "true") {
      throw falha("Sua entrada expirou. Entre de novo.", "entrar");
    }
    email = String(info.email).toLowerCase();
    nomeGoogle = info.given_name || info.name || "";
    const segundosRestantes = Math.floor(Number(info.exp) - Date.now() / 1000);
    if (segundosRestantes > 5) cache.put(chave, JSON.stringify({ email, nomeGoogle }), Math.min(600, segundosRestantes));
  }
  const pessoa = lerPessoas().find((p) => p.email === email);
  const dono = Session.getEffectiveUser().getEmail().toLowerCase();
  if (pessoa) return { email, nome: pessoa.nome || nomeGoogle };
  if (email === dono) return { email, nome: nomeGoogle };
  throw falha("O e-mail " + email + " ainda não tem acesso. Peça para incluírem você na lista.", "sem-acesso");
}

function lerPessoas() {
  const linhas = planilha().getSheetByName("Pessoas").getDataRange().getValues().slice(1);
  return linhas
    .map((l) => ({ email: String(l[0] || "").trim().toLowerCase(), nome: String(l[1] || "").trim() }))
    .filter((p) => p.email);
}

// ---------------------------------------------------------------------------
// PLANILHA DE DADOS (particular)
function planilha() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty("DADOS_ID");
  if (id) return SpreadsheetApp.openById(id);

  const ss = SpreadsheetApp.create("Finanças da Casa (dados)");
  const pessoas = ss.getSheets()[0].setName("Pessoas");
  pessoas.appendRow(["E-mail", "Nome"]);
  pessoas.appendRow([Session.getEffectiveUser().getEmail(), ""]);
  pessoas.setFrozenRows(1);
  const aba = ss.insertSheet("Dados");
  aba.getRange("A:C").setNumberFormat("@"); // tudo como texto, sem o Sheets converter datas e números
  aba.appendRow(["Coleção", "ID", "Conteúdo (não editar)"]);
  aba.setFrozenRows(1);
  props.setProperty("DADOS_ID", ss.getId());
  return ss;
}

function abaDados() {
  return planilha().getSheetByName("Dados");
}

function lerLinhas() {
  const aba = abaDados();
  const n = aba.getLastRow() - 1;
  if (n < 1) return [];
  return aba.getRange(2, 1, n, 3).getValues().filter((l) => l[0] && l[1]);
}

function versaoAtual() {
  return PropertiesService.getScriptProperties().getProperty("VERSAO") || "0";
}

// Devolve tudo (lançamentos, orçamento e nomes). Se nada mudou desde a última vez, devolve só "mudou: false".
function dados(pedido, eu) {
  const versao = versaoAtual();
  const base = { eu: { id: eu.email, nome: eu.nome }, versao };
  if (pedido.versao && pedido.versao === versao) return Object.assign(base, { mudou: false });
  const docs = {};
  COLECOES.forEach((c) => (docs[c] = {}));
  lerLinhas().forEach(([colecao, id, json]) => {
    try { docs[colecao][id] = JSON.parse(json); } catch (e) {}
  });
  const nomes = {};
  lerPessoas().forEach((p) => (nomes[p.email] = p.nome || p.email.split("@")[0]));
  return Object.assign(base, { mudou: true, docs, nomes });
}

// Aplica uma lista de alterações: [{op: "set" | "update" | "delete", col, id, data}]
function gravar(ops) {
  const trava = LockService.getScriptLock();
  trava.waitLock(20000);
  try {
    const mapa = new Map();
    lerLinhas().forEach(([c, id, json]) => mapa.set(c + "/" + id, [c, id, json]));
    ops.forEach((o) => {
      if (COLECOES.indexOf(o.col) < 0 || !o.id || String(o.id).length > 120) throw falha("Alteração inválida.");
      const chave = o.col + "/" + o.id;
      if (o.op === "delete") mapa.delete(chave);
      else if (o.op === "set") mapa.set(chave, [o.col, String(o.id), JSON.stringify(o.data || {})]);
      else if (o.op === "update") {
        const antes = mapa.has(chave) ? JSON.parse(mapa.get(chave)[2]) : {};
        mapa.set(chave, [o.col, String(o.id), JSON.stringify(Object.assign(antes, o.data || {}))]);
      } else throw falha("Alteração inválida.");
    });
    const aba = abaDados();
    const ultima = aba.getLastRow();
    if (ultima > 1) aba.getRange(2, 1, ultima - 1, 3).clearContent();
    const linhas = Array.from(mapa.values());
    if (linhas.length) aba.getRange(2, 1, linhas.length, 3).setNumberFormat("@").setValues(linhas);
    const versao = String(Date.now());
    PropertiesService.getScriptProperties().setProperty("VERSAO", versao);
    return { ok: true, versao };
  } finally {
    trava.releaseLock();
  }
}
