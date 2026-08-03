import { contextBridge, ipcRenderer } from 'electron'
import { Cliente, NovoCliente, Pet, NovoPet, Consulta, NovaConsulta, PetComTutor } from './types'


contextBridge.exposeInMainWorld('api', {
  clientes: {
    listar: (): Promise<Cliente[]> => ipcRenderer.invoke('clientes:listar'),
    criar: (dados: NovoCliente): Promise<Cliente> => ipcRenderer.invoke('clientes:criar', dados),
    atualizar: (id: number, dados: NovoCliente): Promise<Cliente> =>
      ipcRenderer.invoke('clientes:atualizar', id, dados),
    excluir: (id: number): Promise<void> => ipcRenderer.invoke('clientes:excluir', id),
  },
  pets: {
    listarPorCliente: (idCliente: number): Promise<Pet[]> =>
      ipcRenderer.invoke('pets:listarPorCliente', idCliente),
    criar: (dados: NovoPet): Promise<Pet> => ipcRenderer.invoke('pets:criar', dados),
    atualizar: (id: number, dados: NovoPet): Promise<Pet> =>
      ipcRenderer.invoke('pets:atualizar', id, dados),
    excluir: (id: number): Promise<void> => ipcRenderer.invoke('pets:excluir', id),
    buscar: (termo: string): Promise<PetComTutor[]> => ipcRenderer.invoke('pets:buscar', termo),
  },
  consultas: {
    listarPorPet: (idPet: number): Promise<Consulta[]> =>
      ipcRenderer.invoke('consultas:listarPorPet', idPet),
    criar: (dados: NovaConsulta): Promise<Consulta> => ipcRenderer.invoke('consultas:criar', dados),
    atualizar: (id: number, dados: NovaConsulta): Promise<Consulta> =>
      ipcRenderer.invoke('consultas:atualizar', id, dados),
    excluir: (id: number): Promise<void> => ipcRenderer.invoke('consultas:excluir', id),
  },
})