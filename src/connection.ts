import { Pool, types } from 'pg'
import dotenv from 'dotenv'
import { app } from 'electron'
import path from 'path'

const caminhoEnv = app.isPackaged
  ? path.join(path.dirname(app.getPath('exe')), '.env')
  : path.join(process.cwd(), '.env')

dotenv.config({ path: caminhoEnv })

types.setTypeParser(1082, (valor) => valor)

types.setTypeParser(1700, (valor) => parseFloat(valor))

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL não definida. copie a string de conexão do seu banco para .env.'
  )
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, 
})

export async function fecharConexao(): Promise<void> {
  await pool.end()
}