export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, quiz } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const quizBlock = quiz
    ? `\n\n🎯 <b>Результат квиза</b>\n` +
      `Цвет волос: ${quiz.hair}\n` +
      `Проблема: ${quiz.pain}\n` +
      `Приоритет: ${quiz.goal}\n` +
      `Рекомендация: ${quiz.method}\n` +
      `Скидка: ${quiz.offer}`
    : '';

  const text =
    `📩 <b>Новая заявка с сайта</b>\n\n` +
    `👤 Имя: ${name}\n` +
    `📞 Телефон: ${phone}` +
    quizBlock;

  const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });

  if (!tgRes.ok) {
    const err = await tgRes.text();
    console.error('Telegram error:', err);
    return res.status(500).json({ error: 'Telegram error' });
  }

  return res.status(200).json({ ok: true });
}
