export interface Cliente {
    id: number
    nome: string
    telefone: string
    email: string
}

export type NovoCliente = Omit<Cliente, 'id'>

export interface Pet {
    id: number
    nome: string
    especie: string
    raca: string
    id_cliente: number
}

export type NovoPet = Omit<Pet, 'id'>

export interface Consulta {
    id: number
    id_pet: number
    data: string
    hora: string
    descricao_sintomas: string
    valor: number
}

export type NovaConsulta = Omit<Consulta, 'id'>

export interface PetComTutor extends Pet {
    nome_cliente: string
}