CREATE TABLE IF NOT EXISTS clientes (
  id       SERIAL PRIMARY KEY,
  nome     TEXT NOT NULL,
  telefone TEXT,
  email    TEXT
);

CREATE TABLE IF NOT EXISTS pets (
  id         SERIAL PRIMARY KEY,
  nome       TEXT NOT NULL,
  especie    TEXT NOT NULL,
  raca       TEXT,
  id_cliente INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS consultas (
  id                  SERIAL PRIMARY KEY,
  id_pet              INTEGER NOT NULL REFERENCES pets(id) ON DELETE RESTRICT,
  data                DATE NOT NULL,
  hora                TIME NOT NULL,
  descricao_sintomas  TEXT,
  valor               NUMERIC(10,2) NOT NULL
);