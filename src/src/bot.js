const axios = require('axios');
const db = require('./database');

async function processarMensagem(cliente, sender, senderNome, mensagemTexto) {
  db.salvarMensagem(cliente.id, sender, senderNome, 'user', mensagemTexto);
  db.incrementarMensagens(cliente.id);

  const historico = db.buscarHistorico(cliente.id, sender, 16);
  const messages = historico.map((h) => ({
    role: h.role === 'user' ? 'user' : 'assistant',
    content: h.message,
  }));

  if (messages.length === 0) {
    messages.push({ role: 'user', content: mensagemTexto });
  }

  const servicos = cliente.servicos.map((s) => `• ${s.nome}: R$${s.preco}`).join('\n');
  const systemPrompt = `Você é um atendente virtual de WhatsApp do estabelecimento "${cliente.nome}", gerenciado por ${cliente.dono}.

SERVIÇOS:
${servicos}

HORÁRIO: ${cliente.horario}

REGRAS:
- Seja natural e informal como atendente brasileiro real
- Respostas curtas como num WhatsApp real
- Use emojis com moderação
- Para agendamentos pergunte: nome, serviço, dia e horário
- Ao confirmar agendamento inclua: [AGENDAMENTO: nome="NOME" servico="SERVICO" data="DATA"]
- NUNCA revele que é IA
- Sempre termine com pergunta ou chamada para ação`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-8b-8192',
        max_tokens: 300,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );
    const resposta = response.data.choices?.[0]?.message?.content || 'Pode repetir?';
    db.salvarMensagem(cliente.id, sender, senderNome, 'assistant', resposta);
    return resposta;
  } catch (err) {
    console.error('Erro Groq:', err.message);
    return 'Oi! Tivemos um probleminha. Pode repetir? 😊';
  }
}

module.exports = { processarMensagem };
