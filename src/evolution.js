const axios = require('axios');

const api = axios.create({
  baseURL: process.env.EVOLUTION_API_URL,
  headers: {
    'apikey': process.env.EVOLUTION_API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

async function criarInstancia(instanceName) {
  const res = await api.post('/instance/create', {
    instanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS',
  });
  return res.data;
}
async function obterQRCode(instanceName) {
  const res = await api.get(`/instance/connect/${instanceName}`);
  return res.data;
}
async function statusInstancia(instanceName) {
  const res = await api.get(`/instance/connectionState/${instanceName}`);
  return res.data;
}
async function deletarInstancia(instanceName) {
  const res = await api.delete(`/instance/delete/${instanceName}`);
  return res.data;
}
async function enviarMensagem(instanceName, numero, texto) {
  const numeroFormatado = numero.includes('@') ? numero : `${numero}@s.whatsapp.net`;
  const res = await api.post(`/message/sendText/${instanceName}`, {
    number: numeroFormatado, text: texto,
  });
  return res.data;
}
async function configurarWebhook(instanceName, webhookUrl) {
  const res = await api.post(`/webhook/set/${instanceName}`, {
    webhook: {
      enabled: true, url: webhookUrl,
      webhookByEvents: false, webhookBase64: false,
      events: ['MESSAGES_UPSERT'],
    },
  });
  return res.data;
}

module.exports = {
  criarInstancia, obterQRCode, statusInstancia,
  deletarInstancia, enviarMensagem, configurarWebhook,
};
