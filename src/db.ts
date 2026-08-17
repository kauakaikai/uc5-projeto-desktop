import { pool } from './connection'
import { Cliente, NovoCliente, Pet, NovoPet, Consulta, NovaConsulta, PetComTutor } from './types'

// Aba de Clientes

export async function listarClientes(): Promise<Cliente[]> {
  const resultado = await pool.query<Cliente>('SELECT * FROM clientes ORDER BY nome')
  return resultado.rows
}

export async function criarCliente(dados: NovoCliente): Promise<Cliente> {
  const resultado = await pool.query<Cliente>(
    'INSERT INTO clientes (nome, telefone, email) VALUES ($1, $2, $3) RETURNING *',
    [dados.nome, dados.telefone, dados.email]
  )
  return resultado.rows[0]
}

export async function atualizarCliente(id: number, dados: NovoCliente): Promise<Cliente> {
  const resultado = await pool.query<Cliente>(
    'UPDATE clientes SET nome = $1, telefone = $2, email = $3 WHERE id = $4 RETURNING *',
    [dados.nome, dados.telefone, dados.email, id]
  )
  if (resultado.rows.length === 0) {
    throw new Error(`Cliente ${id} não encontrado.`)
  }
  return resultado.rows[0]
}

export async function excluirCliente(id: number): Promise<void> {
  const temPet = await pool.query('SELECT id FROM pets WHERE id_cliente = $1 LIMIT 1', [id])
  if ((temPet.rowCount ?? 0) > 0) {
    throw new Error('Não é possível excluir um cliente com pets cadastrados.')
  }
  await pool.query('DELETE FROM clientes WHERE id = $1', [id])
}

// Aba de Pets

export async function listarPetsPorCliente(idCliente: number): Promise<Pet[]> {
  const resultado = await pool.query<Pet>(
    'SELECT * FROM pets WHERE id_cliente = $1 ORDER BY nome',
    [idCliente]
  )
  return resultado.rows
}

export async function criarPet(dados: NovoPet): Promise<Pet> {
  const clienteExiste = await pool.query('SELECT id FROM clientes WHERE id = $1', [dados.id_cliente])
  if (clienteExiste.rowCount === 0) {
    throw new Error('Tutor informado não existe.')
  }
  const resultado = await pool.query<Pet>(
    'INSERT INTO pets (nome, especie, raca, id_cliente) VALUES ($1, $2, $3, $4) RETURNING *',
    [dados.nome, dados.especie, dados.raca, dados.id_cliente]
  )
  return resultado.rows[0]
}

export async function atualizarPet(id: number, dados: NovoPet): Promise<Pet> {
  const resultado = await pool.query<Pet>(
    'UPDATE pets SET nome = $1, especie = $2, raca = $3, id_cliente = $4 WHERE id = $5 RETURNING *',
    [dados.nome, dados.especie, dados.raca, dados.id_cliente, id]
  )
  if (resultado.rows.length === 0) {
    throw new Error(`Pet ${id} não encontrado.`)
  }
  return resultado.rows[0]
}

export async function excluirPet(id: number): Promise<void> {
  const temConsulta = await pool.query('SELECT id FROM consultas WHERE id_pet = $1 LIMIT 1', [id])
  if ((temConsulta.rowCount ?? 0) > 0) {
    throw new Error('Não é possível excluir um pet com consultas registradas.')
  }
  await pool.query('DELETE FROM pets WHERE id = $1', [id])
}

export async function buscarPets(termo: string): Promise<PetComTutor[]> {
  const termoBusca = termo.trim()
  if (termoBusca.length < 2) {
    throw new Error('Digite pelo menos 2 caracteres para buscar.')
  }

  const resultado = await pool.query<PetComTutor>(
    `SELECT pets.*, clientes.nome AS nome_cliente
     FROM pets
     JOIN clientes ON clientes.id = pets.id_cliente
     WHERE pets.nome ILIKE $1 OR clientes.nome ILIKE $1
     ORDER BY pets.nome`,
    [`%${termoBusca}%`]
  )
  return resultado.rows
}

// Aba de Consultas

export async function listarConsultasPorPet(idPet: number): Promise<Consulta[]> {
  const resultado = await pool.query<Consulta>(
    'SELECT * FROM consultas WHERE id_pet = $1 ORDER BY data DESC, hora DESC',
    [idPet]
  )
  return resultado.rows
}

export async function criarConsulta(dados: NovaConsulta): Promise<Consulta> {
  if (dados.valor < 0) {
    throw new Error('O valor da consulta não pode ser negativo.')
  }
  const petExiste = await pool.query('SELECT id FROM pets WHERE id = $1', [dados.id_pet])
  if (petExiste.rowCount === 0) {
    throw new Error('Pet informado não existe.')
  }
  const resultado = await pool.query<Consulta>(
    `INSERT INTO consultas (id_pet, data, hora, descricao_sintomas, valor)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [dados.id_pet, dados.data, dados.hora, dados.descricao_sintomas, dados.valor]
  )
  return resultado.rows[0]
}

export async function atualizarConsulta(id: number, dados: NovaConsulta): Promise<Consulta> {
  if (dados.valor < 0) {
    throw new Error('O valor da consulta não pode ser negativo.')
  }
  const resultado = await pool.query<Consulta>(
    `UPDATE consultas SET id_pet = $1, data = $2, hora = $3, descricao_sintomas = $4, valor = $5
     WHERE id = $6 RETURNING *`,
    [dados.id_pet, dados.data, dados.hora, dados.descricao_sintomas, dados.valor, id]
  )
  if (resultado.rows.length === 0) {
    throw new Error(`Consulta ${id} não encontrada.`)
  }
  return resultado.rows[0]
}

export async function excluirConsulta(id: number): Promise<void> {
  await pool.query('DELETE FROM consultas WHERE id = $1', [id])
}