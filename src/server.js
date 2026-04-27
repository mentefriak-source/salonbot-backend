require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./database');
const webhookRouter = require('./webhook');
const adminRouter = require('./admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', servico: 'SalonBot' });
});

app.use('/webhook', webhookRouter);
app.use('/admin', adminRouter);

app.get('/', (_req, res) => {
  res.json({ mensagem: '🤖 SalonBot está rodando!' });
});

initDB();

app.listen(PORT, () => {
  console.log(`✅ SalonBot rodando na porta ${PORT}`);
});
