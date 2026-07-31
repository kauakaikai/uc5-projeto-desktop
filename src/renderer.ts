import './style.css'

declare global {
  interface Window {
    api: {
      ping: () => Promise<string>;
    };
  }
}

const appElement = document.getElementById('app') as HTMLDivElement

appElement.innerHTML = `
  <h1>Projeto Integrador</h1>
  <button id="btn-ping">Enviar Ping IPC</button>
  <p id="resposta">Aguardando interação...</p>
`

const button = document.getElementById('btn-ping') as HTMLButtonElement
const resposta = document.getElementById('resposta') as HTMLParagraphElement

button.addEventListener('click', async () => {
  resposta.textContent = 'Enviando ping...'
  try {
    const retorno = await window.api.ping()
    resposta.textContent = `Resposta: ${retorno}`
  } catch (erro) {
    resposta.textContent = 'Erro ao enviar IPC.'
    console.error(erro)
  }
})

// Necessario para que o TypeScript trate este arquivo como modulo ES,
// tornando o 'declare global {}' acima valido.
export {}
