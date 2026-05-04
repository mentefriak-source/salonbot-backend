const express = require('express');
const router = express.Router();
const db = require('./database');
const evolution = require('./evolution');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'barbi2026';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

function auth(req, res, next) {
  const senha = req.headers['x-admin-password'];
  if (senha !== ADMIN_PASSWORD) return res.status(401).json({ erro: 'Não autorizado' });
  next();
}

router.use(auth);

router.get('/clientes', (req, res) => {
  res.json(db.listarClientes());
});

router.post('/clientes', async (req, res) => {
  try {
    const { nome, dono, whatsapp, servicos, horario } = req.body;
    if (!nome || !dono) return res.status(400).json({ erro: 'Nome e dono obrigatórios' });
    const id = `salon_${Date.now()}`;
    const instanceName = `salonbot_${id}`;
    const cliente = db.criarCliente({ id, nome, dono, whatsapp, servicos, horario, instance: instanceName, status: 'ativo' });
    try {
      await evolution.criarInstancia(instanceName);
      await evolution.configurarWebhook(instanceName, `${SERVER_URL}/webhook/${instanceName}`);
    } catch (e) {
      console.warn('Evolution erro:', e.message);
    }
    res.status(201).json(cliente);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.patch('/clientes/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['ativo', 'pausado'].includes(status)) return res.status(400).json({ erro: 'Status inválido' });
  db.atualizarStatusCliente(req.params.id, status);
  res.json({ ok: true, status });
});

router.delete('/clientes/:id', async (req, res) => {
  const cliente = db.buscarClientePorId(req.params.id);
  if (!cliente) return res.status(404).json({ erro: 'Não encontrado' });
  try { await evolution.deletarInstancia(cliente.instance); } catch {}
  db.deletarCliente(req.params.id);
  res.json({ ok: true });
});

router.get('/clientes/:id/qrcode', async (req, res) => {
  const cliente = db.buscarClientePorId(req.params.id);
  if (!cliente) return res.status(404).json({ erro: 'Não encontrado' });
  try {
    const qr = await evolution.obterQRCode(cliente.instance);
    res.json(qr);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.get('/clientes/:id/agendamentos', (req, res) => {
  res.json(db.listarAgendamentos(req.params.id));
});

module.exports = router;
