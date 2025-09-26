import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const TELEGRAM_BOT_TOKEN = Deno.env.get('DUBAI_TELEGRAM_BOT_TOKEN');
const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

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
            content: `Ты эксперт по недвижимости в Дубае с интегрированной системой поиска и оценки. Отвечай на русском языке. 
            
            ВАЖНО: У тебя есть доступ к реальной базе данных недвижимости и системе автоматической оценки (AVM).
            
            Помогай пользователям с:
            - Поиском недвижимости для покупки и аренды
            - Автоматической оценкой стоимости объектов
            - Анализом рынка недвижимости
            - Советами по инвестициям
            - Информацией о районах Дубая
            - Ценовыми трендами
            
            Для поиска объектов говори пользователям использовать фразы типа:
            - "Ищу квартиру в Marina до 1M"
            - "Найди виллу на продажу от 2M до 5M" 
            - "Покажи апартаменты в аренду 2 спальни"
            
            Для оценки объектов: "оцени [ID объекта]"
            
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
🏗️ <b>Добро пожаловать в Dubai Invest Bot!</b>

Я ваш персональный консультант по недвижимости в Дубае с доступом к реальной базе данных и системой автоматической оценки. 

💼 <b>Мои возможности:</b>
• 🔍 Поиск недвижимости для покупки и аренды
• 💰 Автоматическая оценка стоимости (AVM)
• 📊 Анализ рынка и трендов в реальном времени
• 💡 Советы по инвестициям
• 📍 Информация о районах Дубая

🎯 <b>Примеры команд:</b>
• "Ищу квартиру в Marina до 1.5M"
• "Найди виллу 4 спальни на продажу"
• "Покажи апартаменты в аренду JBR"

✨ Просто опишите что ищете, и я найду подходящие варианты с актуальными ценами!
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