// Скрипт для настройки Telegram webhook
// Запустите этот скрипт в браузере или Node.js после добавления токена

const TELEGRAM_BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN_ENG'; // Замените на ваш токен
const WEBHOOK_URL = 'https://qnmyostnzwlnauxhsgfw.supabase.co/functions/v1/bot-dubai-eng';

async function setupWebhook() {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        allowed_updates: ['message', 'callback_query']
      }),
    });

    const result = await response.json();
    console.log('Webhook setup result:', result);
    
    if (result.ok) {
      console.log('✅ Webhook успешно установлен!');
      console.log('URL:', WEBHOOK_URL);
    } else {
      console.log('❌ Ошибка установки webhook:', result.description);
    }
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

// Функция для проверки статуса webhook
async function checkWebhook() {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
    const result = await response.json();
    console.log('Webhook info:', result);
  } catch (error) {
    console.error('❌ Ошибка проверки webhook:', error);
  }
}

// Раскомментируйте нужную функцию:
// setupWebhook();
// checkWebhook();

console.log(`
ИНСТРУКЦИЯ ПО НАСТРОЙКЕ TELEGRAM БОТА:

1. Замените YOUR_TELEGRAM_BOT_TOKEN_ENG на ваш реальный токен бота
2. Запустите setupWebhook() для установки webhook
3. Проверьте результат с помощью checkWebhook()

URL для webhook: ${WEBHOOK_URL}
`);