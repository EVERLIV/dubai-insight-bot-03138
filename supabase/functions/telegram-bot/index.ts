import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
  };
}

async function sendTelegramMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    }),
  });

  return response.json();
}

async function setupBotCommands() {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMyCommands`;
  
  const commands = [
    {
      command: "start",
      description: "Начать работу с ботом"
    },
    {
      command: "help", 
      description: "Помощь и инструкции"
    },
    {
      command: "search",
      description: "Поиск недвижимости"
    },
    {
      command: "analytics",
      description: "Аналитика рынка"
    },
    {
      command: "roi",
      description: "ROI калькулятор"
    },
    {
      command: "news",
      description: "Новости рынка"
    }
  ];

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        commands: commands
      }),
    });
    
    const result = await response.json();
    console.log('Bot commands setup:', result);
  } catch (error) {
    console.error('Error setting up bot commands:', error);
  }
}

async function generateAIResponse(userQuery: string): Promise<string> {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `Ты эксперт по недвижимости в Дубае. Отвечай на русском языке. 
            Помогай пользователям с:
            - Поиском недвижимости для покупки и аренды
            - Анализом рынка недвижимости
            - Советами по инвестициям
            - Информацией о районах Дубая
            - Ценовыми трендами
            
            Давай конкретные, полезные советы. Будь дружелюбным и профессиональным.`
          },
          {
            role: 'user',
            content: userQuery
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Извините, не смог обработать ваш запрос.';
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    return 'Произошла ошибка при обработке запроса. Попробуйте позже.';
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update: TelegramUpdate = await req.json();
    console.log('Received update:', update);

    if (!update.message?.text) {
      return new Response('OK', { status: 200 });
    }

    const { message } = update;
    const userQuery = message.text;
    const chatId = message.chat.id;

    if (!userQuery) {
      return new Response('OK', { status: 200 });
    }

    // Setup bot commands on first request (optional optimization)
    await setupBotCommands();

    // Handle commands
    if (userQuery === '/start') {
      const welcomeMessage = `
🏗️ <b>Добро пожаловать в Dubai Invest!</b>

Я ваш персональный консультант по недвижимости в Дубае. 

💼 <b>Я могу помочь вам с:</b>
• Поиском недвижимости для покупки
• Арендой жилья
• Анализом рынка и трендов
• Советами по инвестициям
• Информацией о районах

✨ Просто напишите мне ваш вопрос, и я дам подробный ответ!

<i>Например: "Ищу квартиру в центре Дубая до $200k" или "Какие районы лучше для инвестиций?"</i>

📋 <b>Доступные команды:</b>
/help - помощь и инструкции
/search - поиск недвижимости  
/analytics - аналитика рынка
/roi - ROI калькулятор
/news - новости рынка
      `;
      
      await sendTelegramMessage(chatId, welcomeMessage);
      return new Response('OK', { status: 200 });
    }

    if (userQuery === '/help') {
      const helpMessage = `
📚 <b>Помощь - Dubai Invest Bot</b>

<b>Доступные команды:</b>

🏠 <b>/search</b> - Поиск недвижимости
Поможет найти объекты по вашим критериям

📊 <b>/analytics</b> - Аналитика рынка
Получить актуальную аналитику рынка недвижимости

💰 <b>/roi</b> - ROI калькулятор
Рассчитать доходность инвестиций

📰 <b>/news</b> - Новости рынка
Последние новости рынка недвижимости Дубая

💬 <b>Или просто напишите свой вопрос</b>
Например: "Ищу квартиру в Marina" или "Какие цены на студии?"
      `;
      
      await sendTelegramMessage(chatId, helpMessage);
      return new Response('OK', { status: 200 });
    }

    if (userQuery === '/search') {
      const searchMessage = `
🔍 <b>Поиск недвижимости в Дубае</b>

Расскажите мне, что вы ищете:

📝 <b>Укажите:</b>
• Тип объекта (квартира, вилла, студия)
• Район или локация
• Бюджет
• Количество комнат
• Цель (покупка/аренда)

💡 <b>Примеры запросов:</b>
"Ищу 2-комнатную квартиру в Marina до $150k"
"Студия в аренду в центре до 50k AED/год"
"Вилла для покупки в Emirates Hills"

✨ Просто напишите ваши требования!
      `;
      
      await sendTelegramMessage(chatId, searchMessage);
      return new Response('OK', { status: 200 });
    }

    if (userQuery === '/analytics') {
      const analyticsMessage = `
📊 <b>Аналитика рынка недвижимости Дубая</b>

Выберите тип аналитики:

📈 <b>Доступные отчеты:</b>
• Ценовые тренды по районам
• Анализ доходности
• Прогнозы рынка на 2025 год
• Сравнение районов
• Динамика цен

💡 <b>Примеры запросов:</b>
"Покажи тренды цен в Downtown"
"Анализ доходности в Business Bay"
"Прогноз роста цен на 2025"

✨ Напишите, какую аналитику вас интересует!
      `;
      
      await sendTelegramMessage(chatId, analyticsMessage);
      return new Response('OK', { status: 200 });
    }

    if (userQuery === '/roi') {
      const roiMessage = `
💰 <b>ROI Калькулятор недвижимости</b>

Рассчитаю доходность ваших инвестиций!

📝 <b>Для расчета укажите:</b>
• Стоимость объекта
• Месячная арендная плата
• Дополнительные расходы (по желанию)

💡 <b>Пример:</b>
"Объект за $200,000, аренда $1,500/месяц"
"Квартира $150k, доход 8000 AED/месяц"

📊 <b>Получите:</b>
• Годовую доходность (ROI)
• Срок окупаемости
• Чистую прибыль
• Сравнение с рынком

✨ Напишите данные для расчета!
      `;
      
      await sendTelegramMessage(chatId, roiMessage);
      return new Response('OK', { status: 200 });
    }

    if (userQuery === '/news') {
      const newsMessage = `
📰 <b>Новости рынка недвижимости Дубая</b>

Получите актуальные новости и аналитику!

📋 <b>Доступно:</b>
• Последние новости рынка
• Изменения в законодательстве
• Новые проекты и застройщики
• Экономические тренды
• Инвестиционные возможности

💡 <b>Примеры запросов:</b>
"Последние новости недвижимости"
"Новые проекты в 2025"
"Изменения цен на рынке"

✨ Напишите, какие новости вас интересуют!
      `;
      
      await sendTelegramMessage(chatId, newsMessage);
      return new Response('OK', { status: 200 });
    }

    // Generate AI response for other messages
    const aiResponse = await generateAIResponse(userQuery);
    await sendTelegramMessage(chatId, aiResponse);

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing telegram webhook:', error);
    return new Response('Error', { status: 500 });
  }
});