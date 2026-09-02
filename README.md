# 🐾 PetCare

Sistema desktop de gestão para clínica veterinária: cadastro de tutores, dos pets de
cada tutor e do histórico de consultas. Desenvolvido em **Electron + Vite +
TypeScript**, com banco de dados **PostgreSQL**, como Projeto Integrador da UC5
(Desenvolver Aplicações Desktop) - SENAC RN, Mossoró.

## Funcionalidades

- Cadastro, edição e exclusão de **clientes (tutores)**
- Cadastro, edição e exclusão de **pets**, vinculados a um tutor
- Registro de **consultas** (data, hora, sintomas e valor), vinculadas a um pet
- Busca de pets por nome do pet ou do tutor, com filtro por espécie
- Funciona sem conexão com o banco: mostra aviso amigável em vez de travar

## Stack

| Peça | Papel |
|---|---|
| Electron | Runtime desktop (processo Main em Node.js, Renderer em Chromium) |
| Vite | Servidor de desenvolvimento e build do Renderer |
| TypeScript | Modo `strict` ligado, sem `any` |
| PostgreSQL (`pg`) | Banco de dados relacional |
| `electron-builder` | Geração do instalador Windows (NSIS, per-user, sem UAC) |

## Requisitos

- Node.js 20 ou superior e npm
- Um banco PostgreSQL acessível (local ou na nuvem, ex: [Neon](https://neon.tech))

## Configuração do banco

1. Crie um arquivo `.env` na raiz do projeto (use `.env.example` como modelo):
   ```
   DATABASE_URL=postgresql://usuario:senha@host:5432/nome_do_banco?sslmode=require
   ```
2. Aplique o schema no seu banco (cria as tabelas `clientes`, `pets` e `consultas`,
   já com as chaves estrangeiras):
   ```bash
   psql "$DATABASE_URL" -f sql/schema.sql
   ```

## Rodando em desenvolvimento

```bash
npm install
npm run dev
```

## Gerando o instalador

```bash
npm run build
```

Isso confere os tipos, compila o Renderer, e gera o instalador Windows em
`release/PetCare Setup <versão>.exe`. O instalador não pede administrador
(per-user, sem UAC) e cria atalho na área de trabalho e no menu Iniciar.

> O arquivo `.env` **não** é distribuído dentro do instalador. Quem for rodar o
> PetCare já instalado precisa da sua própria `DATABASE_URL` configurada.

## Estrutura

```text
src/
  main.ts         processo Main: cria a BrowserWindow, o menu e os canais IPC
  preload.ts      ponte entre os processos, via contextBridge
  renderer.ts     código da interface (sem innerHTML - createElement/textContent)
  connection.ts   conexão única com o PostgreSQL (Pool)
  db.ts           funções de acesso ao banco (clientes, pets, consultas)
  types.ts        tipos compartilhados entre Main e Renderer
  style.css       estilos da página
index.html        estrutura fixa das telas (abas de Clientes, Pets, Consultas e Busca)
sql/schema.sql    criação das tabelas e chaves estrangeiras
vite.config.ts    configuração do Vite e dos pontos de entrada do Electron
```

## Segurança

- `contextIsolation: true` e `nodeIntegration: false` - o Renderer nunca tem acesso
  direto ao Node.js, só às funções expostas pelo `preload.ts` via `contextBridge`.
- Todas as consultas SQL usam parâmetros (`$1`, `$2`...) - nunca concatenação de texto.
- Nenhum SQL nem credencial trafega pelo Renderer; quem fala com o banco é sempre o
  processo Main.

## Autoria

Desenvolvido por Kauã, como Projeto Integrador da UC5 do SENAC RN - Mossoró, turma
2025.20.95.1, sob orientação do instrutor Thiago.