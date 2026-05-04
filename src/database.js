const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'salonbot.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

let db;
function getDB() {
  if (!db) db = new Database(DB_PATH);
  return db;
}

function initDB() {
  const database = getDB();
  database.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      dono TEXT NOT NULL,
      whatsapp TEXT,
      instance TEXT UNIQUE,
      servicos TEXT DEFAULT '[]',
      horario TEXT DEFAULT '',
      status TEXT DEFAULT 'ativo',
      mensagens INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS conversas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      sender_nome TEXT DEFAULT '',
      role TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS agendamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      cliente_nome TEXT DEFAULT '',
      cliente_numero TEXT NOT NULL,
      servico TEXT DEFAULT '',
      data_hora TEXT DEFAULT '',
      status TEXT DEFAULT 'pendente',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);
  console.log('✅ Banco de dados pronto');
  return database;
}

function listarClientes() {
  return getDB().prepare('SELECT * FROM clientes ORDER BY created_at DESC').all().map(parseCliente);
}
function buscarClientePorId(id) {
  const row = getDB().prepare('SELECT * FROM clientes WHERE id = ?').get(id);
  return row ? parseCliente(row) : null;
}
function buscarClientePorInstancia(instance) {
  const row = getDB().prepare('SELECT * FROM clientes WHERE instance = ?').get(instance);
  return row ? parseCliente(row) : null;
}
function criarCliente(cliente) {
  getDB().prepare(`
    INSERT INTO clientes (id, nome, dono, whatsapp, instance, servicos, horario, status)
    VALUES (@id, @nome, @dono, @whatsapp, @instance, @servicos, @horario, @status)
  `).run({ ...cliente, servicos: JSON.stringify(cliente.servicos || []) });
  return buscarClientePorId(cliente.id);
}
function atualizarStatusCliente(id, status) {
  getDB().prepare('UPDATE clientes SET status = ? WHERE id = ?').run(status, id);
}
function incrementarMensagens(clientId) {
  getDB().prepare('UPDATE clientes SET mensagens = mensagens + 1 WHERE id = ?').run(clientId);
}
function deletarCliente(id) {
  getDB().prepare('DELETE FROM clientes WHERE id = ?').run(id);
  getDB().prepare('DELETE FROM conversas WHERE client_id = ?').run(id);
  getDB().prepare('DELETE FROM agendamentos WHERE client_id = ?').run(id);
}
function parseCliente(row) {
  return { ...row, servicos: JSON.parse(row.servicos || '[]') };
}
function buscarHistorico(clientId, sender, limite = 20) {
  return getDB().prepare(`
    SELECT role, message FROM conversas
    WHERE client_id = ? AND sender = ?
    ORDER BY id DESC LIMIT ?
  `).all(clientId, sender, limite).reverse();
}
function salvarMensagem(clientId, sender, senderNome, role, message) {
  getDB().prepare(`
    INSERT INTO conversas (client_id, sender, sender_nome, role, message)
    VALUES (?, ?, ?, ?, ?)
  `).run(clientId, sender, senderNome || '', role, message);
}
function salvarAgendamento(clientId, clienteNumero, clienteNome, servico, dataHora) {
  getDB().prepare(`
    INSERT INTO agendamentos (client_id, cliente_numero, cliente_nome, servico, data_hora)
    VALUES (?, ?, ?, ?, ?)
  `).run(clientId, clienteNumero, clienteNome, servico, dataHora);
}
function listarAgendamentos(clientId) {
  return getDB().prepare('SELECT * FROM agendamentos WHERE client_id = ? ORDER BY created_at DESC').all(clientId);
}

module.exports = {
  initDB, listarClientes, buscarClientePorId, buscarClientePorInstancia,
  criarCliente, atualizarStatusCliente, incrementarMensagens, deletarCliente,
  buscarHistorico, salvarMensagem, salvarAgendamento, listarAgendamentos,
};
