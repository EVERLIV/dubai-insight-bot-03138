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

    // Handle start command
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
      `;
      
      await sendTelegramMessage(chatId, welcomeMessage);
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