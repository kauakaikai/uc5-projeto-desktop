import { app, BrowserWindow, ipcMain, Menu, MenuItemConstructorOptions } from 'electron'
import path from 'path'
import * as db from './db'
import { fecharConexao } from './connection'
import { NovoCliente, NovoPet, NovaConsulta } from './types'

let mainWindow: BrowserWindow | null = null
let simularFalhaConexao = false

function verificarSimulacaoDeFalha() {
  if (simularFalhaConexao) {
    throw new Error('Falha de conexao com o banco de dados (simulacao ativada no menu Exibir).')
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    center: true,
    title: 'PetCare - Gestão de Clínica Veterinária',
    show: false, 
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'right' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function createMenu() {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Novo cadastro',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu-novo-cadastro')
          },
        },
        { type: 'separator' },
        { label: 'Sair', role: 'quit' },
      ],
    },
    {
      label: 'Exibir',
      submenu: [
        { label: 'Recarregar', role: 'reload' },
        { label: 'Console (DevTools)', role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Testes',
      submenu: [
        {
          label: 'Simular falha de conexão com o banco',
          type: 'checkbox',
          checked: false,
          click: (menuItem) => {
            simularFalhaConexao = menuItem.checked
            console.log(
              `Simulação de falha de conexão: ${simularFalhaConexao ? 'ATIVADA' : 'desativada'}`
            )
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
  createWindow()
  createMenu()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', async () => {
  console.log('PetCare vai encerrar agora. Fechando conexao com o banco...')
  await fecharConexao()
})

// Aba de Clientes

ipcMain.handle('clientes:listar', async () => {
  try {
    verificarSimulacaoDeFalha()
    return await db.listarClientes()
  } catch (erro) {
    console.error('[IPC clientes:listar]', erro)
    throw new Error('Nao foi possível carregar os clientes.')
  }
})

ipcMain.handle('clientes:criar', async (_evento, dados: NovoCliente) => {
  try {
    verificarSimulacaoDeFalha()
    return await db.criarCliente(dados)
  } catch (erro) {
    console.error('[IPC clientes:criar]', erro)
    throw new Error('Nao foi possível criar o cliente.')
  }
})

ipcMain.handle('clientes:atualizar', async (_evento, id: number, dados: NovoCliente) => {
  try {
    verificarSimulacaoDeFalha()
    return await db.atualizarCliente(id, dados)
  } catch (erro) {
    console.error('[IPC clientes:atualizar]', erro)
    throw new Error('Nao foi possível atualizar o cliente.')
  }
})

ipcMain.handle('clientes:excluir', async (_evento, id: number) => {
  try {
    verificarSimulacaoDeFalha()
    return await db.excluirCliente(id)
  } catch (erro) {
    console.error('[IPC clientes:excluir]', erro)
    throw new Error(erro instanceof Error ? erro.message : 'Nao foi possível excluir o cliente.')
  }
})

// Aba de Pets

ipcMain.handle('pets:listarPorCliente', async (_evento, idCliente: number) => {
  try {
    verificarSimulacaoDeFalha()
    return await db.listarPetsPorCliente(idCliente)
  } catch (erro) {
    console.error('[IPC pets:listarPorCliente]', erro)
    throw new Error('Nao foi possível carregar os pets deste cliente.')
  }
})

ipcMain.handle('pets:criar', async (_evento, dados: NovoPet) => {
  try {
    verificarSimulacaoDeFalha()
    return await db.criarPet(dados)
  } catch (erro) {
    console.error('[IPC pets:criar]', erro)
    throw new Error(erro instanceof Error ? erro.message : 'Nao foi possível criar o pet.')
  }
})

ipcMain.handle('pets:atualizar', async (_evento, id: number, dados: NovoPet) => {
  try {
    verificarSimulacaoDeFalha()
    return await db.atualizarPet(id, dados)
  } catch (erro) {
    console.error('[IPC pets:atualizar]', erro)
    throw new Error('Nao foi possível atualizar o pet.')
  }
})

ipcMain.handle('pets:excluir', async (_evento, id: number) => {
  try {
    verificarSimulacaoDeFalha()
    return await db.excluirPet(id)
  } catch (erro) {
    console.error('[IPC pets:excluir]', erro)
    throw new Error(erro instanceof Error ? erro.message : 'Nao foi possível excluir o pet.')
  }
})

ipcMain.handle('pets:buscar', async (_evento, termo: string) => {
  try {
    verificarSimulacaoDeFalha()
    return await db.buscarPets(termo)
  } catch (erro) {
    console.error('[IPC pets:buscar]', erro)
    throw new Error('Nao foi possível realizar a busca.')
  }
})

// Aba de Consultas

ipcMain.handle('consultas:listarPorPet', async (_evento, idPet: number) => {
  try {
    verificarSimulacaoDeFalha()
    return await db.listarConsultasPorPet(idPet)
  } catch (erro) {
    console.error('[IPC consultas:listarPorPet]', erro)
    throw new Error('Nao foi possível carregar as consultas deste pet.')
  }
})

ipcMain.handle('consultas:criar', async (_evento, dados: NovaConsulta) => {
  try {
    verificarSimulacaoDeFalha()
    return await db.criarConsulta(dados)
  } catch (erro) {
    console.error('[IPC consultas:criar]', erro)
    throw new Error(erro instanceof Error ? erro.message : 'Nao foi possível criar a consulta.')
  }
})

ipcMain.handle('consultas:atualizar', async (_evento, id: number, dados: NovaConsulta) => {
  try {
    verificarSimulacaoDeFalha()
    return await db.atualizarConsulta(id, dados)
  } catch (erro) {
    console.error('[IPC consultas:atualizar]', erro)
    throw new Error('Nao foi possível atualizar a consulta.')
  }
})

ipcMain.handle('consultas:excluir', async (_evento, id: number) => {
  try {
    verificarSimulacaoDeFalha()
    return await db.excluirConsulta(id)
  } catch (erro) {
    console.error('[IPC consultas:excluir]', erro)
    throw new Error('Nao foi possível excluir a consulta.')
  }
})