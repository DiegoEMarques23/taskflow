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