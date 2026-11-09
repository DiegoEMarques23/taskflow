const STATUS = {
  'a-fazer': 'A fazer',
  'em-andamento': 'Em andamento',
  'concluida': 'Concluída',
};
const PRIORIDADES = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };
const PESO_PRIORIDADE = { alta: 0, media: 1, baixa: 2 };

const TAREFAS_INICIAIS = [
  { id: 't1', titulo: 'Estudar para a prova de HTML', descricao: 'Revisar tags semânticas, formulários e tabelas.', prioridade: 'alta', prazo: '2026-11-10', status: 'a-fazer' },
  { id: 't2', titulo: 'Comprar material de estudo', descricao: '', prioridade: 'baixa', prazo: '2026-11-15', status: 'a-fazer' },
  { id: 't3', titulo: 'Montar a estrutura do Task Flow', descricao: 'Criar o HTML semântico e o CSS do projeto.', prioridade: 'media', prazo: '2026-11-08', status: 'em-andamento' },
  { id: 't4', titulo: 'Criar repositório no GitHub', descricao: 'Repositório com GitHub Pages ativado.', prioridade: 'media', prazo: '2026-10-03', status: 'concluida' },
];

let tarefas = TAREFAS_INICIAIS.slice();

// ----- Listagem -----
const listas = {
  'a-fazer': document.getElementById('lista-a-fazer'),
  'em-andamento': document.getElementById('lista-em-andamento'),
  'concluida': document.getElementById('lista-concluida'),
};

// Etapas aplicadas à lista antes de exibi-la.
// Pesquisa, filtro e ordenação se registram aqui nos próximos commits.
const etapasDaLista = [];

function obterTarefasVisiveis() {
  return etapasDaLista.reduce((lista, etapa) => etapa(lista), tarefas.slice());
}

function formatarData(iso) {
  if (!iso) return 'Sem prazo';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function criarCartao(tarefa) {
  const cartao = document.createElement('article');
  cartao.className = 'cartao';

  const titulo = document.createElement('h4');
  titulo.textContent = tarefa.titulo;

  const info = document.createElement('ul');
  const itemPrioridade = document.createElement('li');
  const etiqueta = document.createElement('strong');
  etiqueta.className = `prioridade prioridade--${tarefa.prioridade}`;
  etiqueta.textContent = PRIORIDADES[tarefa.prioridade];
  itemPrioridade.append('Prioridade: ', etiqueta);
  const itemPrazo = document.createElement('li');
  itemPrazo.textContent = `Prazo: ${formatarData(tarefa.prazo)}`;
  info.append(itemPrioridade, itemPrazo);

  const acoes = document.createElement('div');
  acoes.className = 'acoes';
  [['detalhes', 'Ver detalhes'], ['editar', 'Editar'], ['excluir', 'Excluir']].forEach(([acao, texto]) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.dataset.acao = acao;
    botao.dataset.id = tarefa.id;
    botao.textContent = texto;
    acoes.append(botao);
  });

  cartao.append(titulo, info, acoes);
  return cartao;
}

function renderizar() {
  const visiveis = obterTarefasVisiveis();
  Object.keys(listas).forEach((status) => {
    const lista = listas[status];
    lista.replaceChildren();
    const doStatus = visiveis.filter((tarefa) => tarefa.status === status);
    if (doStatus.length === 0) {
      const vazio = document.createElement('p');
      vazio.className = 'vazio';
      vazio.textContent = 'Nenhuma tarefa aqui.';
      lista.append(vazio);
    } else {
      doStatus.forEach((tarefa) => lista.append(criarCartao(tarefa)));
    }
  });
}

renderizar();


// ----- Cadastro -----
const form = document.getElementById('form-tarefa');
const campoTitulo = document.getElementById('titulo');
const campoDescricao = document.getElementById('descricao');
const campoPrioridade = document.getElementById('prioridade');
const campoPrazo = document.getElementById('prazo');
const campoStatus = document.getElementById('status');
const caixaMensagem = document.getElementById('mensagem');
let temporizadorMensagem;

// Funções executadas sempre que os dados mudam (ex.: salvar no localStorage)
const aoAlterarDados = [];

function notificarAlteracao() {
  aoAlterarDados.forEach((funcao) => funcao());
  renderizar();
}

function mostrarMensagem(texto, tipo) {
  caixaMensagem.textContent = texto;
  caixaMensagem.className = `mensagem mensagem--${tipo}`;
  caixaMensagem.hidden = false;
  clearTimeout(temporizadorMensagem);
  temporizadorMensagem = setTimeout(() => {
    caixaMensagem.hidden = true;
  }, 4000);
}

function lerFormulario() {
  return {
    titulo: campoTitulo.value.trim(),
    descricao: campoDescricao.value.trim(),
    prioridade: campoPrioridade.value,
    prazo: campoPrazo.value,
    status: campoStatus.value,
  };
}

function validar(dados) {
  if (dados.titulo.length < 3) {
    return 'Informe um título com pelo menos 3 caracteres.';
  }
  return '';
}

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function criarTarefa(dados) {
  tarefas.push({ id: gerarId(), ...dados });
  return 'Tarefa salva com sucesso!';
}

// O que o formulário faz ao ser enviado: criar uma tarefa (a edição troca isso depois)
let acaoDoFormulario = criarTarefa;

function tratarEnvio(evento) {
  evento.preventDefault();
  const dados = lerFormulario();
  const erro = validar(dados);
  if (erro) {
    mostrarMensagem(erro, 'erro');
    campoTitulo.focus();
    return;
  }

  const texto = acaoDoFormulario(dados);
  notificarAlteracao();
  form.reset();
  mostrarMensagem(texto, 'sucesso');
}

form.addEventListener('submit', tratarEnvio);


// ----- Persistência (localStorage) -----
const CHAVE_STORAGE = 'taskflow:tarefas';

function salvarTarefas() {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(tarefas));
}

function carregarTarefas() {
  try {
    const salvo = localStorage.getItem(CHAVE_STORAGE);
    if (salvo !== null) {
      const lista = JSON.parse(salvo);
      if (Array.isArray(lista)) return lista;
    }
  } catch (erro) {
    console.error('Não foi possível ler o localStorage:', erro);
  }
  return TAREFAS_INICIAIS.slice();
}

aoAlterarDados.push(salvarTarefas);
tarefas = carregarTarefas();
renderizar();


// ----- Detalhes -----
const detalhesVazio = document.getElementById('detalhes-vazio');
const detalhesConteudo = document.getElementById('detalhes-conteudo');
let detalheId = null;

function limparDetalhes() {
  detalheId = null;
  detalhesConteudo.hidden = true;
  detalhesVazio.hidden = false;
}

function mostrarDetalhes(id) {
  const tarefa = tarefas.find((item) => item.id === id);
  if (!tarefa) {
    limparDetalhes();
    return;
  }
  detalheId = id;
  document.getElementById('det-titulo').textContent = tarefa.titulo;
  document.getElementById('det-descricao').textContent = tarefa.descricao || 'Sem descrição';
  document.getElementById('det-prioridade').textContent = PRIORIDADES[tarefa.prioridade];
  document.getElementById('det-prazo').textContent = formatarData(tarefa.prazo);
  document.getElementById('det-status').textContent = STATUS[tarefa.status];
  detalhesVazio.hidden = true;
  detalhesConteudo.hidden = false;
}

// Botões dos cartões: cada recurso registra a sua ação aqui (detalhes, editar, excluir)
const acoesDosCartoes = {};

acoesDosCartoes.detalhes = (id) => {
  mostrarDetalhes(id);
  document.getElementById('detalhes').scrollIntoView({ behavior: 'smooth' });
};

document.getElementById('colunas').addEventListener('click', (evento) => {
  const botao = evento.target.closest('button[data-acao]');
  if (!botao) return;
  const acao = acoesDosCartoes[botao.dataset.acao];
  if (acao) acao(botao.dataset.id);
});

// Mantém o painel de detalhes atualizado quando os dados mudam (edição ou exclusão)
aoAlterarDados.push(() => {
  if (detalheId) mostrarDetalhes(detalheId);
});


// ----- Edição -----
const botaoSalvar = document.getElementById('btn-salvar');
const botaoCancelar = document.getElementById('btn-cancelar');
const tituloCadastro = document.getElementById('titulo-cadastro');
let editandoId = null;

function iniciarEdicao(id) {
  const tarefa = tarefas.find((item) => item.id === id);
  if (!tarefa) return;
  editandoId = id;
  campoTitulo.value = tarefa.titulo;
  campoDescricao.value = tarefa.descricao;
  campoPrioridade.value = tarefa.prioridade;
  campoPrazo.value = tarefa.prazo;
  campoStatus.value = tarefa.status;

  // Ao enviar, o formulário atualiza esta tarefa em vez de criar outra
  acaoDoFormulario = (dados) => {
    Object.assign(tarefa, dados);
    return 'Tarefa atualizada com sucesso!';
  };

  tituloCadastro.textContent = 'Editar tarefa';
  botaoSalvar.textContent = 'Salvar alterações';
  botaoCancelar.hidden = false;
  campoPrazo.dispatchEvent(new Event('change'));
  document.getElementById('cadastro').scrollIntoView({ behavior: 'smooth' });
  campoTitulo.focus();
}

function sairDaEdicao() {
  editandoId = null;
  acaoDoFormulario = criarTarefa;
  tituloCadastro.textContent = 'Nova tarefa';
  botaoSalvar.textContent = 'Salvar tarefa';
  botaoCancelar.hidden = true;
}

form.addEventListener('reset', sairDaEdicao);
botaoCancelar.addEventListener('click', () => form.reset());
acoesDosCartoes.editar = iniciarEdicao;
document.getElementById('det-editar').addEventListener('click', () => {
  if (detalheId) iniciarEdicao(detalheId);
});


// ----- Exclusão -----
function excluirTarefa(id) {
  const tarefa = tarefas.find((item) => item.id === id);
  if (!tarefa) return;
  if (!confirm(`Excluir a tarefa "${tarefa.titulo}"?`)) return;

  tarefas = tarefas.filter((item) => item.id !== id);
  if (editandoId === id) form.reset();
  notificarAlteracao();
  mostrarMensagem('Tarefa excluída.', 'info');
}

acoesDosCartoes.excluir = excluirTarefa;
document.getElementById('det-excluir').addEventListener('click', () => {
  if (detalheId) excluirTarefa(detalheId);
});


// ----- Pesquisa -----
const formFiltros = document.getElementById('form-filtros');
const campoBusca = document.getElementById('busca');

// Ignora maiúsculas e acentos ("agua" encontra "Água")
function normalizar(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

etapasDaLista.push((lista) => {
  const termo = normalizar(campoBusca.value.trim());
  return lista.filter((tarefa) => normalizar(tarefa.titulo).includes(termo));
});

campoBusca.addEventListener('input', renderizar);
formFiltros.addEventListener('submit', (evento) => evento.preventDefault());
document.getElementById('btn-aplicar').addEventListener('click', renderizar);


// ----- Filtro por prioridade -----
const campoFiltro = document.getElementById('filtro');

etapasDaLista.push((lista) => {
  const prioridade = campoFiltro.value;
  if (prioridade === '') return lista;
  return lista.filter((tarefa) => tarefa.prioridade === prioridade);
});

campoFiltro.addEventListener('change', renderizar);


// ----- Ordenação -----
const campoOrdem = document.getElementById('ordem');

function compararTarefas(criterio) {
  if (criterio === 'titulo') {
    return (a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR');
  }
  if (criterio === 'prioridade') {
    return (a, b) => PESO_PRIORIDADE[a.prioridade] - PESO_PRIORIDADE[b.prioridade];
  }
  // prazo: tarefas sem prazo vão para o fim
  return (a, b) => {
    if (!a.prazo && !b.prazo) return 0;
    if (!a.prazo) return 1;
    if (!b.prazo) return -1;
    return a.prazo.localeCompare(b.prazo);
  };
}

// A ordenação é a última etapa da lista
etapasDaLista.push((lista) => lista.sort(compararTarefas(campoOrdem.value)));

campoOrdem.addEventListener('change', renderizar);
renderizar();

// ----- API pública: feriados nacionais (BrasilAPI) -----
const URL_FERIADOS = 'https://brasilapi.com.br/api/feriados/v1/';
const listaFeriados = document.getElementById('lista-feriados');
const estadoFeriados = document.getElementById('feriados-estado');
const botaoRecarregar = document.getElementById('btn-recarregar-feriados');
const avisoPrazo = document.getElementById('aviso-prazo');
let feriados = [];

// Avisa quando o prazo escolhido no formulário cai em um feriado
function atualizarAvisoPrazo() {
  const feriado = feriados.find((item) => item.date === campoPrazo.value);
  if (feriado) {
    avisoPrazo.textContent = `Atenção: ${formatarData(feriado.date)} é feriado (${feriado.name}).`;
    avisoPrazo.hidden = false;
  } else {
    avisoPrazo.hidden = true;
  }
}

function renderizarFeriados() {
  listaFeriados.replaceChildren();
  feriados.forEach((feriado) => {
    const item = document.createElement('li');

    const texto = document.createElement('div');
    const nome = document.createElement('strong');
    nome.textContent = feriado.name;
    const data = document.createElement('div');
    data.className = 'data';
    data.textContent = formatarData(feriado.date);
    texto.append(nome, data);

    const botao = document.createElement('button');
    botao.type = 'button';
    botao.dataset.data = feriado.date;
    botao.dataset.nome = feriado.name;
    botao.textContent = 'Criar tarefa';

    item.append(texto, botao);
    listaFeriados.append(item);
  });
}

async function carregarFeriados() {
  estadoFeriados.textContent = 'Carregando feriados...';
  estadoFeriados.className = 'mensagem mensagem--info';
  estadoFeriados.hidden = false;
  botaoRecarregar.hidden = true;
  try {
    const resposta = await fetch(URL_FERIADOS + new Date().getFullYear());
    if (!resposta.ok) throw new Error(`Erro ${resposta.status}`);
    feriados = await resposta.json();
    renderizarFeriados();
    estadoFeriados.hidden = true;
    atualizarAvisoPrazo();
  } catch (erro) {
    console.error('Falha ao carregar feriados:', erro);
    estadoFeriados.textContent = 'Não foi possível carregar os feriados agora. Verifique a conexão e tente novamente.';
    estadoFeriados.className = 'mensagem mensagem--erro';
    botaoRecarregar.hidden = false;
  }
}

// Escolher um feriado preenche o formulário de cadastro com os dados da API
listaFeriados.addEventListener('click', (evento) => {
  const botao = evento.target.closest('button[data-data]');
  if (!botao) return;
  form.reset();
  campoTitulo.value = `Planejar atividades: ${botao.dataset.nome}`;
  campoPrazo.value = botao.dataset.data;
  campoPrazo.dispatchEvent(new Event('change'));
  document.getElementById('cadastro').scrollIntoView({ behavior: 'smooth' });
  campoTitulo.focus();
});

campoPrazo.addEventListener('change', atualizarAvisoPrazo);
form.addEventListener('reset', () => {
  avisoPrazo.hidden = true;
});
botaoRecarregar.addEventListener('click', carregarFeriados);

carregarFeriados();