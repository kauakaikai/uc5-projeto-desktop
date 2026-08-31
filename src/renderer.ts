import './style.css'
import { Cliente, NovoCliente, Pet, NovoPet, Consulta, NovaConsulta, PetComTutor } from './types'

declare global {
  interface Window {
    api: {
      clientes: {
        listar: () => Promise<Cliente[]>
        criar: (dados: NovoCliente) => Promise<Cliente>
        atualizar: (id: number, dados: NovoCliente) => Promise<Cliente>
        excluir: (id: number) => Promise<void>
      }
      pets: {
        listarPorCliente: (idCliente: number) => Promise<Pet[]>
        criar: (dados: NovoPet) => Promise<Pet>
        atualizar: (id: number, dados: NovoPet) => Promise<Pet>
        excluir: (id: number) => Promise<void>
        buscar: (termo: string) => Promise<PetComTutor[]>
      }
      consultas: {
        listarPorPet: (idPet: number) => Promise<Consulta[]>
        criar: (dados: NovaConsulta) => Promise<Consulta>
        atualizar: (id: number, dados: NovaConsulta) => Promise<Consulta>
        excluir: (id: number) => Promise<void>
      }
    }
  }
}

type Aba = 'clientes' | 'pets' | 'consultas' | 'busca'

let abaAtual: Aba = 'clientes'
let clienteSelecionadoId: number | null = null 
let petSelecionadoId: number | null = null 
let clienteEmEdicao: Cliente | null = null
let petEmEdicao: Pet | null = null
let consultaEmEdicao: Consulta | null = null

function iniciarNavegacao() {
  document.querySelectorAll<HTMLButtonElement>('#nav button').forEach((botao) => {
    botao.addEventListener('click', () => {
      abaAtual = botao.dataset.aba as Aba
      renderizarAba()
    })
  })
}

let statusTimeoutId: number | undefined

function definirStatus(mensagem: string, erro = false) {
  const status = document.getElementById('status') as HTMLParagraphElement
  status.textContent = mensagem
  status.classList.toggle('status-erro', erro)

  if (statusTimeoutId !== undefined) {
    window.clearTimeout(statusTimeoutId)
  }

  statusTimeoutId = window.setTimeout(() => {
    status.textContent = ''
    status.classList.remove('status-erro')
  }, 2000)
}

function mensagemDeErro(erro: unknown, mensagemPadrao: string): string {
  if (!(erro instanceof Error)) return mensagemPadrao
  const partes = erro.message.split('Error: ')
  const mensagemLimpa = partes[partes.length - 1].trim()
  return mensagemLimpa || mensagemPadrao
}

function renderizarAba() {
  document.querySelectorAll<HTMLButtonElement>('#nav button').forEach((botao) => {
    botao.classList.toggle('ativo', botao.dataset.aba === abaAtual)
  })

  document.querySelectorAll<HTMLElement>('.secao-aba').forEach((secao) => {
    secao.style.display = secao.id === `secao-${abaAtual}` ? 'block' : 'none'
  })

  if (abaAtual === 'clientes') renderClientes()
  if (abaAtual === 'pets') renderPets()
  if (abaAtual === 'consultas') renderConsultas()
}

// Aba de Clientes

async function renderClientes() {
  const conteudo = document.getElementById('secao-clientes') as HTMLElement
  conteudo.innerHTML = `
    <section class="painel">
      <h2>${clienteEmEdicao ? 'Editar cliente' : 'Novo cliente'}</h2>
      <form id="form-cliente" class="formulario">
        <label>Nome
          <input type="text" id="cliente-nome" required value="${clienteEmEdicao?.nome ?? ''}" />
        </label>
        <label>Telefone
          <input type="text" id="cliente-telefone" required value="${clienteEmEdicao?.telefone ?? ''}" />
        </label>
        <label>Email
          <input type="email" id="cliente-email" required value="${clienteEmEdicao?.email ?? ''}" />
        </label>
        <div class="acoes-formulario">
          <button type="submit">${clienteEmEdicao ? 'Salvar alterações' : 'Cadastrar'}</button>
          ${clienteEmEdicao ? '<button type="button" id="cancelar-edicao-cliente">Cancelar</button>' : ''}
        </div>
      </form>
    </section>
    <section class="painel">
      <h2>Clientes cadastrados</h2>
      <table class="tabela">
        <thead>
          <tr><th>Nome</th><th>Telefone</th><th>Email</th><th>Ações</th></tr>
        </thead>
        <tbody id="lista-clientes"></tbody>
      </table>
    </section>
  `

  const form = document.getElementById('form-cliente') as HTMLFormElement
  form.addEventListener('submit', salvarCliente)

  const botaoCancelar = document.getElementById('cancelar-edicao-cliente')
  botaoCancelar?.addEventListener('click', () => {
    clienteEmEdicao = null
    renderClientes()
  })

  await carregarClientes()
}

async function carregarClientes() {
  const corpoTabela = document.getElementById('lista-clientes') as HTMLTableSectionElement
  try {
    const clientes = await window.api.clientes.listar()
    corpoTabela.innerHTML = clientes
      .map(
        (cliente) => `
        <tr>
          <td>${cliente.nome}</td>
          <td>${cliente.telefone}</td>
          <td>${cliente.email}</td>
          <td>
            <button data-editar="${cliente.id}">Editar</button>
            <button data-excluir="${cliente.id}" class="botao-perigo">Excluir</button>
          </td>
        </tr>`
      )
      .join('')

    corpoTabela.querySelectorAll<HTMLButtonElement>('[data-editar]').forEach((botao) => {
      botao.addEventListener('click', () => {
        const id = Number(botao.dataset.editar)
        clienteEmEdicao = clientes.find((c) => c.id === id) ?? null
        renderClientes()
      })
    })

    corpoTabela.querySelectorAll<HTMLButtonElement>('[data-excluir]').forEach((botao) => {
      botao.addEventListener('click', () => excluirCliente(Number(botao.dataset.excluir)))
    })

    definirStatus(`${clientes.length} cliente(s) carregado(s).`)
  } catch (erro) {
    definirStatus('Não foi possível carregar os clientes.', true)
    console.error(erro)
  }
}

async function salvarCliente(evento: SubmitEvent) {
  evento.preventDefault()
  const dados: NovoCliente = {
    nome: (document.getElementById('cliente-nome') as HTMLInputElement).value,
    telefone: (document.getElementById('cliente-telefone') as HTMLInputElement).value,
    email: (document.getElementById('cliente-email') as HTMLInputElement).value,
  }

  const botaoSalvar = (evento.target as HTMLFormElement).querySelector(
    'button[type="submit"]'
  ) as HTMLButtonElement
  botaoSalvar.disabled = true
  botaoSalvar.textContent = 'Salvando...'

  try {
    if (clienteEmEdicao) {
      await window.api.clientes.atualizar(clienteEmEdicao.id, dados)
      definirStatus('Cliente atualizado com sucesso.')
    } else {
      await window.api.clientes.criar(dados)
      definirStatus('Cliente cadastrado com sucesso.')
    }
    clienteEmEdicao = null
    renderClientes()
  } catch (erro) {
    definirStatus(mensagemDeErro(erro, 'Erro ao salvar cliente.'), true)
    console.error(erro)
    botaoSalvar.disabled = false
    botaoSalvar.textContent = clienteEmEdicao ? 'Salvar alterações' : 'Cadastrar'
  }
}

async function excluirCliente(id: number) {
  try {
    await window.api.clientes.excluir(id)
    definirStatus('Cliente excluído.')
    await carregarClientes()
  } catch (erro) {
    definirStatus(mensagemDeErro(erro, 'Erro ao excluir cliente.'), true)
    console.error(erro)
  }
}

// Aba de Pets

async function renderPets() {
  const conteudo = document.getElementById('secao-pets') as HTMLElement
  conteudo.innerHTML = `
    <section class="painel">
      <h2>Selecione o tutor</h2>
      <select id="seletor-cliente-pets"><option value="">Carregando...</option></select>
    </section>
    <section class="painel" id="area-pets" style="display:none">
      <h2 id="titulo-form-pet">${petEmEdicao ? 'Editar pet' : 'Novo pet'}</h2>
      <form id="form-pet" class="formulario">
        <label>Nome do pet
          <input type="text" id="pet-nome" required value="${petEmEdicao?.nome ?? ''}" />
        </label>
        <label>Espécie
          <input type="text" id="pet-especie" required placeholder="Cachorro, gato..." value="${petEmEdicao?.especie ?? ''}" />
        </label>
        <label>Raça
          <input type="text" id="pet-raca" required value="${petEmEdicao?.raca ?? ''}" />
        </label>
        <div class="acoes-formulario">
          <button type="submit">${petEmEdicao ? 'Salvar alterações' : 'Cadastrar pet'}</button>
          ${petEmEdicao ? '<button type="button" id="cancelar-edicao-pet">Cancelar</button>' : ''}
        </div>
      </form>
      <h2>Pets deste tutor</h2>
      <table class="tabela">
        <thead><tr><th>Nome</th><th>Espécie</th><th>Raça</th><th>Ações</th></tr></thead>
        <tbody id="lista-pets"></tbody>
      </table>
    </section>
  `

  const seletor = document.getElementById('seletor-cliente-pets') as HTMLSelectElement
  try {
    const clientes = await window.api.clientes.listar()
    if (clientes.length === 0) {
      seletor.innerHTML = '<option value="">Cadastre um cliente primeiro</option>'
      return
    }
    seletor.innerHTML =
      '<option value="">Selecione...</option>' +
      clientes.map((c) => `<option value="${c.id}">${c.nome}</option>`).join('')

    if (clienteSelecionadoId) {
      seletor.value = String(clienteSelecionadoId)
    }

    seletor.addEventListener('change', () => {
      clienteSelecionadoId = seletor.value ? Number(seletor.value) : null
      petEmEdicao = null
      alternarAreaPets()
    })

    alternarAreaPets()
  } catch (erro) {
    definirStatus('Não foi possível carregar os clientes.', true)
    console.error(erro)
  }
}

function alternarAreaPets() {
  const area = document.getElementById('area-pets') as HTMLElement
  area.style.display = clienteSelecionadoId ? 'block' : 'none'
  if (!clienteSelecionadoId) return

  const form = document.getElementById('form-pet') as HTMLFormElement
  form.addEventListener('submit', salvarPet)

  const botaoCancelar = document.getElementById('cancelar-edicao-pet')
  botaoCancelar?.addEventListener('click', () => {
    petEmEdicao = null
    renderPets()
  })

  carregarPets()
}

async function carregarPets() {
  if (!clienteSelecionadoId) return
  const corpoTabela = document.getElementById('lista-pets') as HTMLTableSectionElement
  try {
    const pets = await window.api.pets.listarPorCliente(clienteSelecionadoId)
    corpoTabela.innerHTML = pets
      .map(
        (pet) => `
        <tr>
          <td>${pet.nome}</td>
          <td>${pet.especie}</td>
          <td>${pet.raca}</td>
          <td>
            <button data-editar="${pet.id}">Editar</button>
            <button data-excluir="${pet.id}" class="botao-perigo">Excluir</button>
          </td>
        </tr>`
      )
      .join('')

    corpoTabela.querySelectorAll<HTMLButtonElement>('[data-editar]').forEach((botao) => {
      botao.addEventListener('click', () => {
        const id = Number(botao.dataset.editar)
        petEmEdicao = pets.find((p) => p.id === id) ?? null
        renderPets()
      })
    })

    corpoTabela.querySelectorAll<HTMLButtonElement>('[data-excluir]').forEach((botao) => {
      botao.addEventListener('click', () => excluirPet(Number(botao.dataset.excluir)))
    })

    definirStatus(`${pets.length} pet(s) carregado(s) para este tutor.`)
  } catch (erro) {
    definirStatus('Não foi possível carregar os pets.', true)
    console.error(erro)
  }
}

async function salvarPet(evento: SubmitEvent) {
  evento.preventDefault()
  if (!clienteSelecionadoId) return

  const dados: NovoPet = {
    nome: (document.getElementById('pet-nome') as HTMLInputElement).value,
    especie: (document.getElementById('pet-especie') as HTMLInputElement).value,
    raca: (document.getElementById('pet-raca') as HTMLInputElement).value,
    id_cliente: clienteSelecionadoId,
  }

  const botaoSalvar = (evento.target as HTMLFormElement).querySelector(
    'button[type="submit"]'
  ) as HTMLButtonElement
  botaoSalvar.disabled = true
  botaoSalvar.textContent = 'Salvando...'

  try {
    if (petEmEdicao) {
      await window.api.pets.atualizar(petEmEdicao.id, dados)
      definirStatus('Pet atualizado com sucesso.')
    } else {
      await window.api.pets.criar(dados)
      definirStatus('Pet cadastrado com sucesso.')
    }
    petEmEdicao = null
    renderPets()
  } catch (erro) {
    definirStatus(mensagemDeErro(erro, 'Erro ao salvar pet.'), true)
    console.error(erro)
    botaoSalvar.disabled = false
    botaoSalvar.textContent = petEmEdicao ? 'Salvar alterações' : 'Cadastrar pet'
  }
}

async function excluirPet(id: number) {
  try {
    await window.api.pets.excluir(id)
    definirStatus('Pet excluído.')
    await carregarPets()
  } catch (erro) {
    definirStatus(mensagemDeErro(erro, 'Erro ao excluir pet.'), true)
    console.error(erro)
  }
}

// Aba de Consultas

async function renderConsultas() {
  const conteudo = document.getElementById('secao-consultas') as HTMLElement
  conteudo.innerHTML = `
    <section class="painel">
      <h2>Selecione o tutor e o pet</h2>
      <label>Tutor
        <select id="seletor-cliente-consultas"><option value="">Carregando...</option></select>
      </label>
      <label>Pet
        <select id="seletor-pet-consultas" disabled><option value="">Selecione um tutor primeiro</option></select>
      </label>
    </section>
    <section class="painel" id="area-consultas" style="display:none">
      <h2>${consultaEmEdicao ? 'Editar consulta' : 'Nova consulta'}</h2>
      <form id="form-consulta" class="formulario">
        <label>Data
          <input type="date" id="consulta-data" required value="${consultaEmEdicao?.data ?? ''}" />
        </label>
        <label>Hora
          <input type="time" id="consulta-hora" required value="${consultaEmEdicao?.hora ?? ''}" />
        </label>
        <label>Sintomas / descrição
          <textarea id="consulta-sintomas" required>${consultaEmEdicao?.descricao_sintomas ?? ''}</textarea>
        </label>
        <label>Valor (R$)
          <input type="number" id="consulta-valor" step="0.01" min="0" required value="${consultaEmEdicao?.valor ?? ''}" />
        </label>
        <div class="acoes-formulario">
          <button type="submit">${consultaEmEdicao ? 'Salvar alterações' : 'Registrar consulta'}</button>
          ${consultaEmEdicao ? '<button type="button" id="cancelar-edicao-consulta">Cancelar</button>' : ''}
        </div>
      </form>
      <h2>Histórico de consultas</h2>
      <table class="tabela">
        <thead><tr><th>Data</th><th>Hora</th><th>Sintomas</th><th>Valor</th><th>Ações</th></tr></thead>
        <tbody id="lista-consultas"></tbody>
      </table>
    </section>
  `

  const seletorCliente = document.getElementById('seletor-cliente-consultas') as HTMLSelectElement
  const seletorPet = document.getElementById('seletor-pet-consultas') as HTMLSelectElement

  try {
    const clientes = await window.api.clientes.listar()
    seletorCliente.innerHTML =
      '<option value="">Selecione...</option>' +
      clientes.map((c) => `<option value="${c.id}">${c.nome}</option>`).join('')

    if (clienteSelecionadoId) seletorCliente.value = String(clienteSelecionadoId)

    seletorCliente.addEventListener('change', async () => {
      clienteSelecionadoId = seletorCliente.value ? Number(seletorCliente.value) : null
      petSelecionadoId = null
      consultaEmEdicao = null
      await atualizarSeletorPet()
      alternarAreaConsultas()
    })

    seletorPet.addEventListener('change', () => {
      petSelecionadoId = seletorPet.value ? Number(seletorPet.value) : null
      consultaEmEdicao = null
      alternarAreaConsultas()
    })

    if (clienteSelecionadoId) {
      await atualizarSeletorPet()
    }
    alternarAreaConsultas()
  } catch (erro) {
    definirStatus('Não foi possível carregar os clientes.', true)
    console.error(erro)
  }
}

async function atualizarSeletorPet() {
  const seletorPet = document.getElementById('seletor-pet-consultas') as HTMLSelectElement
  if (!clienteSelecionadoId) {
    seletorPet.innerHTML = '<option value="">Selecione um tutor primeiro</option>'
    seletorPet.disabled = true
    return
  }

  try {
    const pets = await window.api.pets.listarPorCliente(clienteSelecionadoId)
    if (pets.length === 0) {
      seletorPet.innerHTML = '<option value="">Este tutor não tem pets cadastrados</option>'
      seletorPet.disabled = true
      return
    }
    seletorPet.innerHTML =
      '<option value="">Selecione...</option>' +
      pets.map((p) => `<option value="${p.id}">${p.nome}</option>`).join('')
    seletorPet.disabled = false
    if (petSelecionadoId) seletorPet.value = String(petSelecionadoId)
  } catch (erro) {
    definirStatus('Não foi possível carregar os pets.', true)
    console.error(erro)
  }
}

function alternarAreaConsultas() {
  const area = document.getElementById('area-consultas') as HTMLElement
  area.style.display = petSelecionadoId ? 'block' : 'none'
  if (!petSelecionadoId) return

  const form = document.getElementById('form-consulta') as HTMLFormElement
  form.addEventListener('submit', salvarConsulta)

  const botaoCancelar = document.getElementById('cancelar-edicao-consulta')
  botaoCancelar?.addEventListener('click', () => {
    consultaEmEdicao = null
    renderConsultas()
  })

  carregarConsultas()
}

async function carregarConsultas() {
  if (!petSelecionadoId) return
  const corpoTabela = document.getElementById('lista-consultas') as HTMLTableSectionElement
  try {
    const consultas = await window.api.consultas.listarPorPet(petSelecionadoId)
    corpoTabela.innerHTML = consultas
      .map(
        (consulta) => `
        <tr>
          <td>${consulta.data}</td>
          <td>${consulta.hora}</td>
          <td>${consulta.descricao_sintomas}</td>
          <td>R$&nbsp;${Number(consulta.valor).toFixed(2)}</td>
          <td>
            <button data-editar="${consulta.id}">Editar</button>
            <button data-excluir="${consulta.id}" class="botao-perigo">Excluir</button>
          </td>
        </tr>`
      )
      .join('')

    corpoTabela.querySelectorAll<HTMLButtonElement>('[data-editar]').forEach((botao) => {
      botao.addEventListener('click', () => {
        const id = Number(botao.dataset.editar)
        consultaEmEdicao = consultas.find((c) => c.id === id) ?? null
        renderConsultas()
      })
    })

    corpoTabela.querySelectorAll<HTMLButtonElement>('[data-excluir]').forEach((botao) => {
      botao.addEventListener('click', () => excluirConsulta(Number(botao.dataset.excluir)))
    })

    definirStatus(`${consultas.length} consulta(s) no histórico deste pet.`)
  } catch (erro) {
    definirStatus('Não foi possível carregar as consultas.', true)
    console.error(erro)
  }
}

async function salvarConsulta(evento: SubmitEvent) {
  evento.preventDefault()
  if (!petSelecionadoId) return

  const dados: NovaConsulta = {
    id_pet: petSelecionadoId,
    data: (document.getElementById('consulta-data') as HTMLInputElement).value,
    hora: (document.getElementById('consulta-hora') as HTMLInputElement).value,
    descricao_sintomas: (document.getElementById('consulta-sintomas') as HTMLTextAreaElement).value,
    valor: Number((document.getElementById('consulta-valor') as HTMLInputElement).value),
  }

  if (Number.isNaN(dados.valor) || dados.valor < 0) {
    definirStatus('O valor da consulta precisa ser um número maior ou igual a zero.', true)
    return
  }

  const botaoSalvar = (evento.target as HTMLFormElement).querySelector(
    'button[type="submit"]'
  ) as HTMLButtonElement
  botaoSalvar.disabled = true
  botaoSalvar.textContent = 'Salvando...'

  try {
    if (consultaEmEdicao) {
      await window.api.consultas.atualizar(consultaEmEdicao.id, dados)
      definirStatus('Consulta atualizada com sucesso.')
    } else {
      await window.api.consultas.criar(dados)
      definirStatus('Consulta registrada com sucesso.')
    }
    consultaEmEdicao = null
    renderConsultas()
  } catch (erro) {
    definirStatus(mensagemDeErro(erro, 'Erro ao salvar consulta.'), true)
    console.error(erro)
    botaoSalvar.disabled = false
    botaoSalvar.textContent = consultaEmEdicao ? 'Salvar alterações' : 'Registrar consulta'
  }
}

async function excluirConsulta(id: number) {
  try {
    await window.api.consultas.excluir(id)
    definirStatus('Consulta excluída.')
    await carregarConsultas()
  } catch (erro) {
    definirStatus(mensagemDeErro(erro, 'Erro ao excluir consulta.'), true)
    console.error(erro)
  }
}

// Aba de Busca

function configurarBusca() {
  const form = document.getElementById('form-busca') as HTMLFormElement
  const campoTermo = document.getElementById('busca-termo') as HTMLInputElement
  const erroBusca = document.getElementById('erro-busca') as HTMLParagraphElement
  const statusBusca = document.getElementById('status-busca') as HTMLParagraphElement
  const listaResultados = document.getElementById('lista-resultados-busca') as HTMLUListElement
  const filtroEspecie = document.getElementById('filtro-especie') as HTMLInputElement

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault()

    erroBusca.textContent = ''
    statusBusca.textContent = ''
    listaResultados.replaceChildren()
    filtroEspecie.value = ''
    filtroEspecie.disabled = true

    try {
      const resultados = await window.api.pets.buscar(campoTermo.value)
      if (resultados.length === 0) {
        statusBusca.textContent = `Nenhum resultado encontrado para "${campoTermo.value.trim()}".`
        return
      }

      resultados.forEach((pet) => {
        const item = document.createElement('li')
        item.dataset.especie = pet.especie.toLowerCase()

        const nome = document.createElement('strong')
        nome.textContent = pet.nome

        const detalhes = document.createElement('span')
        detalhes.textContent = ` ${pet.especie}, ${pet.raca} — tutor: ${pet.nome_cliente}`

        item.appendChild(nome)
        item.appendChild(detalhes)
        listaResultados.appendChild(item)
      })

      filtroEspecie.disabled = false
      statusBusca.textContent = `${resultados.length} resultado(s) encontrado(s).`
    } catch (erro) {
      erroBusca.textContent =
        mensagemDeErro(erro, 'Não foi possível realizar a busca.')
      console.error(erro)
    }
  })

  filtroEspecie.addEventListener('input', () => {
    const termoFiltro = filtroEspecie.value.trim().toLowerCase()
    listaResultados.querySelectorAll<HTMLLIElement>('li').forEach((item) => {
      const especieDoItem = item.dataset.especie ?? ''
      item.style.display = especieDoItem.includes(termoFiltro) ? '' : 'none'
    })
  })
}

iniciarNavegacao()
configurarBusca()
renderizarAba()