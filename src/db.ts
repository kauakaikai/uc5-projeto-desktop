import { Cliente, NovoCliente, Pet, NovoPet, Consulta, NovaConsulta, PetComTutor } from './types'

let clientes: Cliente[] = []
let pets: Pet[] = []
let consultas: Consulta[] = []

let proximoIdCliente = 1
let proximoIdPet = 1
let proximoIdConsulta = 1

// Aba para Clientes

export async function listarClientes(): Promise<Cliente[]> {
    return clientes
}

export async function criarCliente(dados: NovoCliente): Promise<Cliente> {
    const cliente: Cliente = { id: proximoIdCliente++, ...dados }
    clientes.push(cliente)
    return cliente
}

export async function atualizarCliente(id: number, dados: NovoCliente): Promise<Cliente> {
    const indice = clientes.findIndex((c) => c.id === id)
    if (indice === -1) {
        throw new Error(`Cliente ${id} não encontrado`)
    }
    clientes[indice] = { id, ...dados }
    return clientes[indice]
}

export async function excluirCliente(id: number): Promise<void> {
    const temPet = pets.some((p) => p.id_cliente === id)
    if (temPet) {
        throw new Error("Não é possível excluir um cliente com pets cadastrados")
    }
    clientes = clientes.filter((c) => c.id !== id)
}

// Aba de Pets

export async function listarPetsPorCliente(idCliente: number): Promise<Pet[]> {
    return pets.filter((p) => p.id_cliente === idCliente)
}

export async function criarPet(dados: NovoPet): Promise<Pet> {
    const clienteExiste = clientes.some((c) => c.id === dados.id_cliente)
    if (!clienteExiste) {
        throw new Error("Tutor informado não existe")
    }
    const pet: Pet = {id: proximoIdPet++, ...dados}
    pets.push(pet)
    return pet
}

export async function atualizarPet(id: number, dados: NovoPet): Promise<Pet> {
    const indice = pets.findIndex((p) => p.id === id)
    if (indice === -1) {
        throw new Error(`Pet ${id} não encontrado`)
    }
    pets[indice] = {id, ...dados}
    return pets[indice]
}

export async function excluirPet(id: number): Promise<void> {
    const temConsulta = consultas.some((c) => c.id_pet === id)
    if (temConsulta) {
        throw new Error("Não é possível excluir um pet com consultas registradas")
    }
    pets = pets.filter((p) => p.id !== id)
}

// Aba de Buscas
export async function buscarPets(termo: string): Promise<PetComTutor[]> {
    const termoBusca = termo.trim().toLowerCase()
    if (!termoBusca) return []

    return pets
        .filter((pet) => {
            const cliente = clientes.find((c) => c.id === pet.id_cliente)
            const nomePet = pet.nome.toLowerCase()
            const nomeCliente = cliente?.nome.toLowerCase() ?? ''
      return nomePet.includes(termoBusca) || nomeCliente.includes(termoBusca)
    })
    .map((pet) => {
      const cliente = clientes.find((c) => c.id === pet.id_cliente)
      return { ...pet, nome_cliente: cliente?.nome ?? '(tutor não encontrado)' }
    })
}

// Aba de Consultas
export async function listarConsultasPorPet(idPet: number): Promise<Consulta[]> {
    return consultas.filter((c) => c.id_pet === idPet)
}

export async function criarConsulta(dados: NovaConsulta): Promise<Consulta> {
    const petExiste = pets.some((p) => p.id === dados.id_pet)
    if (!petExiste) {
        throw new Error("Pet informado não existe")
    }
    const consulta: Consulta = { id: proximoIdConsulta++, ...dados }
    consultas.push(consulta)
    return consulta
}

export async function atualizarConsulta(id: number, dados: NovaConsulta): Promise<Consulta> {
    const indice = consultas.findIndex((c) => c.id === id)
    if (indice === -1) {
        throw new Error(`Consulta ${id} não encontrada`)
    }
    consultas[indice] = { id, ...dados}
    return consultas[indice]
}

export async function excluirConsulta(id: number): Promise<void> {
    consultas = consultas.filter((c) => c.id !== id)
}