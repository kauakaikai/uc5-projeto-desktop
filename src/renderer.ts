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


const appElement = document.getElementById('app') as HTMLDivElement

appElement.innerHTML = `
  <h1>PetCare</h1>
  <p>Teste da Fase 2 - IPC de clientes</p>
  <button id="btn-criar">Criar cliente de teste</button>
  <button id="btn-listar">Listar clientes</button>
  <ul id="lista-clientes"></ul>
  <p id="status">Aguardando interação...</p>
`

const botaoCriar = document.getElementById('btn-criar') as HTMLButtonElement
const botaoListar = document.getElementById('btn-listar') as HTMLButtonElement
const listaClientes = document.getElementById('lista-clientes') as HTMLUListElement
const status = document.getElementById('status') as HTMLParagraphElement

botaoCriar.addEventListener('click', async () => {
  try {
    const cliente = await window.api.clientes.criar({
      nome: 'Cliente de teste',
      telefone: '(85) 99999-0000',
      email: 'teste@example.com',
    })
    status.textContent = `Cliente criado: #${cliente.id} - ${cliente.nome}`
  } catch (erro) {
    status.textContent = 'Erro ao criar cliente.'
    console.error(erro)
  }
})

botaoListar.addEventListener('click', async () => {
  try {
    const clientes = await window.api.clientes.listar()
    listaClientes.innerHTML = clientes
      .map((c) => `<li>#${c.id} - ${c.nome} (${c.email})</li>`)
      .join('')
    status.textContent = `${clientes.length} cliente(s) carregado(s).`
  } catch (erro) {
    status.textContent = 'Erro ao listar clientes.'
    console.error(erro)
  }
})

export {}