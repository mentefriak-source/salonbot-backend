const express = require('express');
const router = express.Router();
const db = require('./database');
const bot = require('./bot');
const evolution = require('./evolution');

router.post('/:instanceName', async (req, res) => {
  res.sendStatus(200);
  const { instanceName } = req.params;
  const payload = req.body;
  try {
    if (payload.event !== 'messages.upsert') return;
    const data = payload.data;
    if (!data || !data.message) return;
    if (data.key?.fromMe) return;
    const sender = data.key?.remoteJid || '';
    if (sender.endsWith('@g.us') || sender.endsWith('@broadcast')) return;
    const mensagemTexto =
      data.message?.conversation ||
      data.message?.extendedTextMessage?.text || null;
    if (!mensagemTexto) return;
    const cliente = db.buscarClientePorInstancia(instanceName);
    if (!cliente || cliente.status !== 'ativo') return;
    const numeroLimpo = sender.replace('@s.whatsapp.net', '');
    const senderNome = data.pushName || '';
    console.log(`📩 [${cliente.nome}] ${senderNome}: "${mensagemTexto}"`);
    const resposta = await bot.processarMensagem(cliente, numeroLimpo, senderNome, mensagemTexto);
    await evolution.enviarMensagem(instanceName, sender, resposta);
    console.log(`✅ [${cliente.nome}] Resposta enviada`);
  } catch (err) {
    console.error('Erro webhook:', err.message);
  }
});

module.exports = router;
