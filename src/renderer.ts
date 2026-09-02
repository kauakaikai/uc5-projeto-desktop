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

function criarOpcao(valor: string, texto: string): HTMLOptionElement {
  const opcao = document.createElement('option')
  opcao.value = valor
  opcao.textContent = texto
  return opcao
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

function atualizarFormClientes() {
  const titulo = document.getElementById('titulo-form-cliente') as HTMLHeadingElement
  const nome = document.getElementById('cliente-nome') as HTMLInputElement
  const telefone = document.getElementById('cliente-telefone') as HTMLInputElement
  const email = document.getElementById('cliente-email') as HTMLInputElement
  const botaoSalvar = document.getElementById('botao-salvar-cliente') as HTMLButtonElement
  const botaoCancelar = document.getElementById('cancelar-edicao-cliente') as HTMLButtonElement

  titulo.textContent = clienteEmEdicao ? 'Editar cliente' : 'Novo cliente'
  nome.value = clienteEmEdicao?.nome ?? ''
  telefone.value = clienteEmEdicao?.telefone ?? ''
  email.value = clienteEmEdicao?.email ?? ''
  botaoSalvar.textContent = clienteEmEdicao ? 'Salvar alterações' : 'Cadastrar'
  botaoCancelar.hidden = !clienteEmEdicao
}

function iniciarFormClientes() {
  const form = document.getElementById('form-cliente') as HTMLFormElement
  form.addEventListener('submit', salvarCliente)

  const botaoCancelar = document.getElementById('cancelar-edicao-cliente') as HTMLButtonElement
  botaoCancelar.addEventListener('click', () => {
    clienteEmEdicao = null
    atualizarFormClientes()
  })
}

async function renderClientes() {
  atualizarFormClientes()
  await carregarClientes()
}

async function carregarClientes() {
  const corpoTabela = document.getElementById('lista-clientes') as HTMLTableSectionElement
  try {
    const clientes = await window.api.clientes.listar()
    corpoTabela.replaceChildren()

    clientes.forEach((cliente) => {
      const linha = document.createElement('tr')

      const celulaNome = document.createElement('td')
      celulaNome.textContent = cliente.nome

      const celulaTelefone = document.createElement('td')
      celulaTelefone.textContent = cliente.telefone

      const celulaEmail = document.createElement('td')
      celulaEmail.textContent = cliente.email

      const celulaAcoes = document.createElement('td')
      const botaoEditar = document.createElement('button')
      botaoEditar.textContent = 'Editar'
      botaoEditar.addEventListener('click', () => {
        clienteEmEdicao = cliente
        atualizarFormClientes()
      })

      const botaoExcluir = document.createElement('button')
      botaoExcluir.textContent = 'Excluir'
      botaoExcluir.classList.add('botao-perigo')
      botaoExcluir.addEventListener('click', () => excluirCliente(cliente.id))

      celulaAcoes.appendChild(botaoEditar)
      celulaAcoes.appendChild(botaoExcluir)

      linha.appendChild(celulaNome)
      linha.appendChild(celulaTelefone)
      linha.appendChild(celulaEmail)
      linha.appendChild(celulaAcoes)
      corpoTabela.appendChild(linha)
    })

    definirStatus(`${clientes.length} cliente(s) carregado(s).`)
  } catch (erro) {
    definirStatus('Não foi possível carregar os clientes.', true)
    console.error(erro)
  }
}

async function salvarCliente(evento: SubmitEvent) {
  evento.preventDefault()

  const nome = (document.getElementById('cliente-nome') as HTMLInputElement).value.trim()
  const telefone = (document.getElementById('cliente-telefone') as HTMLInputElement).value.trim()
  const email = (document.getElementById('cliente-email') as HTMLInputElement).value.trim()

  if (!nome || !telefone || !email) {
    definirStatus('Preencha todos os campos do cliente antes de salvar.', true)
    return
  }

  const dados: NovoCliente = { nome, telefone, email }

  const botaoSalvar = document.getElementById('botao-salvar-cliente') as HTMLButtonElement
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
    await renderClientes()
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

function atualizarFormPets() {
  const titulo = document.getElementById('titulo-form-pet') as HTMLHeadingElement
  const nome = document.getElementById('pet-nome') as HTMLInputElement
  const especie = document.getElementById('pet-especie') as HTMLInputElement
  const raca = document.getElementById('pet-raca') as HTMLInputElement
  const botaoSalvar = document.getElementById('botao-salvar-pet') as HTMLButtonElement
  const botaoCancelar = document.getElementById('cancelar-edicao-pet') as HTMLButtonElement

  titulo.textContent = petEmEdicao ? 'Editar pet' : 'Novo pet'
  nome.value = petEmEdicao?.nome ?? ''
  especie.value = petEmEdicao?.especie ?? ''
  raca.value = petEmEdicao?.raca ?? ''
  botaoSalvar.textContent = petEmEdicao ? 'Salvar alterações' : 'Cadastrar pet'
  botaoCancelar.hidden = !petEmEdicao
}

function iniciarFormPets() {
  const form = document.getElementById('form-pet') as HTMLFormElement
  form.addEventListener('submit', salvarPet)

  const botaoCancelar = document.getElementById('cancelar-edicao-pet') as HTMLButtonElement
  botaoCancelar.addEventListener('click', () => {
    petEmEdicao = null
    atualizarFormPets()
  })
}

function iniciarSeletorPets() {
  const seletor = document.getElementById('seletor-cliente-pets') as HTMLSelectElement
  seletor.addEventListener('change', () => {
    clienteSelecionadoId = seletor.value ? Number(seletor.value) : null
    petEmEdicao = null
    alternarAreaPets()
  })
}

async function renderPets() {
  const seletor = document.getElementById('seletor-cliente-pets') as HTMLSelectElement
  try {
    const clientes = await window.api.clientes.listar()
    seletor.replaceChildren()

    if (clientes.length === 0) {
      seletor.appendChild(criarOpcao('', 'Cadastre um cliente primeiro'))
      alternarAreaPets()
      return
    }

    seletor.appendChild(criarOpcao('', 'Selecione...'))
    clientes.forEach((cliente) => {
      seletor.appendChild(criarOpcao(String(cliente.id), cliente.nome))
    })

    if (clienteSelecionadoId) {
      seletor.value = String(clienteSelecionadoId)
    }

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

  atualizarFormPets()
  carregarPets()
}

async function carregarPets() {
  if (!clienteSelecionadoId) return
  const corpoTabela = document.getElementById('lista-pets') as HTMLTableSectionElement
  try {
    const pets = await window.api.pets.listarPorCliente(clienteSelecionadoId)
    corpoTabela.replaceChildren()

    pets.forEach((pet) => {
      const linha = document.createElement('tr')

      const celulaNome = document.createElement('td')
      celulaNome.textContent = pet.nome

      const celulaEspecie = document.createElement('td')
      celulaEspecie.textContent = pet.especie

      const celulaRaca = document.createElement('td')
      celulaRaca.textContent = pet.raca

      const celulaAcoes = document.createElement('td')
      const botaoEditar = document.createElement('button')
      botaoEditar.textContent = 'Editar'
      botaoEditar.addEventListener('click', () => {
        petEmEdicao = pet
        atualizarFormPets()
      })

      const botaoExcluir = document.createElement('button')
      botaoExcluir.textContent = 'Excluir'
      botaoExcluir.classList.add('botao-perigo')
      botaoExcluir.addEventListener('click', () => excluirPet(pet.id))

      celulaAcoes.appendChild(botaoEditar)
      celulaAcoes.appendChild(botaoExcluir)

      linha.appendChild(celulaNome)
      linha.appendChild(celulaEspecie)
      linha.appendChild(celulaRaca)
      linha.appendChild(celulaAcoes)
      corpoTabela.appendChild(linha)
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

  const nome = (document.getElementById('pet-nome') as HTMLInputElement).value.trim()
  const especie = (document.getElementById('pet-especie') as HTMLInputElement).value.trim()
  const raca = (document.getElementById('pet-raca') as HTMLInputElement).value.trim()

  if (!nome || !especie || !raca) {
    definirStatus('Preencha todos os campos do pet antes de salvar.', true)
    return
  }

  const dados: NovoPet = {
    nome,
    especie,
    raca,
    id_cliente: clienteSelecionadoId,
  }

  const botaoSalvar = document.getElementById('botao-salvar-pet') as HTMLButtonElement
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
    atualizarFormPets()
    await carregarPets()
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

function atualizarFormConsultas() {
  const titulo = document.getElementById('titulo-form-consulta') as HTMLHeadingElement
  const data = document.getElementById('consulta-data') as HTMLInputElement
  const hora = document.getElementById('consulta-hora') as HTMLInputElement
  const sintomas = document.getElementById('consulta-sintomas') as HTMLTextAreaElement
  const valor = document.getElementById('consulta-valor') as HTMLInputElement
  const botaoSalvar = document.getElementById('botao-salvar-consulta') as HTMLButtonElement
  const botaoCancelar = document.getElementById('cancelar-edicao-consulta') as HTMLButtonElement

  titulo.textContent = consultaEmEdicao ? 'Editar consulta' : 'Nova consulta'
  data.value = consultaEmEdicao?.data ?? ''
  hora.value = consultaEmEdicao?.hora ?? ''
  sintomas.value = consultaEmEdicao?.descricao_sintomas ?? ''
  valor.value = consultaEmEdicao ? String(consultaEmEdicao.valor) : ''
  botaoSalvar.textContent = consultaEmEdicao ? 'Salvar alterações' : 'Registrar consulta'
  botaoCancelar.hidden = !consultaEmEdicao
}

function iniciarFormConsultas() {
  const form = document.getElementById('form-consulta') as HTMLFormElement
  form.addEventListener('submit', salvarConsulta)

  const botaoCancelar = document.getElementById('cancelar-edicao-consulta') as HTMLButtonElement
  botaoCancelar.addEventListener('click', () => {
    consultaEmEdicao = null
    atualizarFormConsultas()
  })
}

function iniciarSeletoresConsultas() {
  const seletorCliente = document.getElementById('seletor-cliente-consultas') as HTMLSelectElement
  const seletorPet = document.getElementById('seletor-pet-consultas') as HTMLSelectElement

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
}

async function renderConsultas() {
  const seletorCliente = document.getElementById('seletor-cliente-consultas') as HTMLSelectElement

  try {
    const clientes = await window.api.clientes.listar()
    seletorCliente.replaceChildren()
    seletorCliente.appendChild(criarOpcao('', 'Selecione...'))
    clientes.forEach((cliente) => {
      seletorCliente.appendChild(criarOpcao(String(cliente.id), cliente.nome))
    })

    if (clienteSelecionadoId) seletorCliente.value = String(clienteSelecionadoId)

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
  seletorPet.replaceChildren()

  if (!clienteSelecionadoId) {
    seletorPet.appendChild(criarOpcao('', 'Selecione um tutor primeiro'))
    seletorPet.disabled = true
    return
  }

  try {
    const pets = await window.api.pets.listarPorCliente(clienteSelecionadoId)
    if (pets.length === 0) {
      seletorPet.appendChild(criarOpcao('', 'Este tutor não tem pets cadastrados'))
      seletorPet.disabled = true
      return
    }

    seletorPet.appendChild(criarOpcao('', 'Selecione...'))
    pets.forEach((pet) => {
      seletorPet.appendChild(criarOpcao(String(pet.id), pet.nome))
    })

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

  atualizarFormConsultas()
  carregarConsultas()
}

async function carregarConsultas() {
  if (!petSelecionadoId) return
  const corpoTabela = document.getElementById('lista-consultas') as HTMLTableSectionElement
  try {
    const consultas = await window.api.consultas.listarPorPet(petSelecionadoId)
    corpoTabela.replaceChildren()

    consultas.forEach((consulta) => {
      const linha = document.createElement('tr')

      const celulaData = document.createElement('td')
      celulaData.textContent = consulta.data

      const celulaHora = document.createElement('td')
      celulaHora.textContent = consulta.hora

      const celulaSintomas = document.createElement('td')
      celulaSintomas.textContent = consulta.descricao_sintomas

      const celulaValor = document.createElement('td')
      celulaValor.textContent = `R$ ${Number(consulta.valor).toFixed(2)}`

      const celulaAcoes = document.createElement('td')
      const botaoEditar = document.createElement('button')
      botaoEditar.textContent = 'Editar'
      botaoEditar.addEventListener('click', () => {
        consultaEmEdicao = consulta
        atualizarFormConsultas()
      })

      const botaoExcluir = document.createElement('button')
      botaoExcluir.textContent = 'Excluir'
      botaoExcluir.classList.add('botao-perigo')
      botaoExcluir.addEventListener('click', () => excluirConsulta(consulta.id))

      celulaAcoes.appendChild(botaoEditar)
      celulaAcoes.appendChild(botaoExcluir)

      linha.appendChild(celulaData)
      linha.appendChild(celulaHora)
      linha.appendChild(celulaSintomas)
      linha.appendChild(celulaValor)
      linha.appendChild(celulaAcoes)
      corpoTabela.appendChild(linha)
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

  const data = (document.getElementById('consulta-data') as HTMLInputElement).value.trim()
  const hora = (document.getElementById('consulta-hora') as HTMLInputElement).value.trim()
  const descricao_sintomas = (document.getElementById('consulta-sintomas') as HTMLTextAreaElement).value.trim()
  const valorTexto = (document.getElementById('consulta-valor') as HTMLInputElement).value.trim()

  if (!data || !hora || !descricao_sintomas || !valorTexto) {
    definirStatus('Preencha todos os campos da consulta antes de salvar.', true)
    return
  }

  const valor = Number(valorTexto)

  if (Number.isNaN(valor) || valor < 0) {
    definirStatus('O valor da consulta precisa ser um número maior ou igual a zero.', true)
    return
  }

  const dados: NovaConsulta = {
    id_pet: petSelecionadoId,
    data,
    hora,
    descricao_sintomas,
    valor,
  }

  const botaoSalvar = document.getElementById('botao-salvar-consulta') as HTMLButtonElement
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
    atualizarFormConsultas()
    await carregarConsultas()
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

    if (!campoTermo.value.trim()) {
      erroBusca.textContent = 'Digite um termo para realizar a busca.'
      return
    }

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
iniciarFormClientes()
iniciarFormPets()
iniciarSeletorPets()
iniciarFormConsultas()
iniciarSeletoresConsultas()
renderizarAba()