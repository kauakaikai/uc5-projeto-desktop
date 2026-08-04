import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL não definida. Copie .env.example para .env e preencha com a string de conexão do seu banco.'
  )
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, 
})

export async function fecharConexao(): Promise<void> {
  await pool.end()
}