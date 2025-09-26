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
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
        type: string;
      };
    };
    data?: string;
  };
}

async function sendTelegramMessage(chatId: number, text: string, options: any = {}) {
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
      disable_web_page_preview: true,
      ...options
    }),
  });

  return response.json();
}

async function editTelegramMessage(chatId: number, messageId: number, text: string, options: any = {}) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...options
    }),
  });

  return response.json();
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text || '',
      show_alert: false
    }),
  });

  return response.json();
}

function getMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🔍 Поиск недвижимости", callback_data: "search_menu" },
        { text: "💰 Оценка стоимости", callback_data: "valuation_menu" }
      ],
      [
        { text: "📊 Рыночная аналитика", callback_data: "analytics_menu" },
        { text: "⚙️ Настройки", callback_data: "settings_menu" }
      ],
      [
        { text: "📞 Контакты", callback_data: "contacts" },
        { text: "❓ Помощь", callback_data: "help" }
      ]
    ]
  };
}

function getSearchMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🏢 Квартиры", callback_data: "search_apartment" },
        { text: "🏘️ Виллы", callback_data: "search_villa" }
      ],
      [
        { text: "🏠 Таунхаусы", callback_data: "search_townhouse" },
        { text: "🏬 Коммерческая", callback_data: "search_commercial" }
      ],
      [
        { text: "💸 Продажа", callback_data: "search_sale" },
        { text: "🏠 Аренда", callback_data: "search_rent" }
      ],
      [
        { text: "🎯 Премиум районы", callback_data: "search_premium" },
        { text: "💎 Новостройки", callback_data: "search_new" }
      ],
      [
        { text: "⬅️ Назад", callback_data: "main_menu" }
      ]
    ]
  };
}

function getPriceRangeKeyboard(purpose: string) {
  const baseData = `price_${purpose}`;
  return {
    inline_keyboard: [
      [
        { text: "💸 до 500K", callback_data: `${baseData}_0_500000` },
        { text: "💰 500K-1M", callback_data: `${baseData}_500000_1000000` }
      ],
      [
        { text: "💎 1M-2M", callback_data: `${baseData}_1000000_2000000` },
        { text: "🏰 2M-5M", callback_data: `${baseData}_2000000_5000000` }
      ],
      [
        { text: "👑 5M+", callback_data: `${baseData}_5000000_0` },
        { text: "🔍 Любая цена", callback_data: `${baseData}_0_0` }
      ],
      [
        { text: "⬅️ Назад", callback_data: "search_menu" }
      ]
    ]
  };
}

function getLocationKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🏙️ Downtown", callback_data: "location_downtown" },
        { text: "🌊 Marina", callback_data: "location_marina" }
      ],
      [
        { text: "🏖️ JBR", callback_data: "location_jbr" },
        { text: "🌴 Palm Jumeirah", callback_data: "location_palm" }
      ],
      [
        { text: "💼 Business Bay", callback_data: "location_business_bay" },
        { text: "🏔️ Emirates Hills", callback_data: "location_emirates_hills" }
      ],
      [
        { text: "🏘️ JVC", callback_data: "location_jvc" },
        { text: "🏗️ City Walk", callback_data: "location_city_walk" }
      ],
      [
        { text: "📍 Все районы", callback_data: "location_all" },
        { text: "⬅️ Назад", callback_data: "search_menu" }
      ]
    ]
  };
}

function getValuationMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🔍 Найти по ID", callback_data: "valuation_by_id" },
        { text: "📝 Описать объект", callback_data: "valuation_describe" }
      ],
      [
        { text: "📊 Сравнить районы", callback_data: "compare_areas" },
        { text: "📈 Тренды цен", callback_data: "price_trends" }
      ],
      [
        { text: "⬅️ Назад", callback_data: "main_menu" }
      ]
    ]
  };
}

function getAnalyticsMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📈 Топ районы", callback_data: "analytics_top_areas" },
        { text: "💹 Рост цен", callback_data: "analytics_price_growth" }
      ],
      [
        { text: "🏗️ Новые проекты", callback_data: "analytics_new_projects" },
        { text: "💼 Инвестиции", callback_data: "analytics_investment" }
      ],
      [
        { text: "📊 Отчеты", callback_data: "analytics_reports" },
        { text: "🎯 ROI калькулятор", callback_data: "roi_calculator" }
      ],
      [
        { text: "⬅️ Назад", callback_data: "main_menu" }
      ]
    ]
  };
}

async function callPropertySearchAPI(searchParams: any): Promise<any> {
  try {
    console.log('Calling property search API with params:', searchParams);
    
    const response = await supabase.functions.invoke('property-search', {
      body: searchParams
    });

    if (response.error) {
      console.error('Property search API error:', response.error);
      return { success: false, error: response.error.message };
    }

    return response.data;
  } catch (error) {
    console.error('Error calling property search API:', error);
    return { success: false, error: 'Failed to search properties' };
  }
}

async function callAVMValuationAPI(propertyDetails: any): Promise<any> {
  try {
    console.log('Calling AVM valuation API');
    
    const response = await supabase.functions.invoke('avm-valuation', {
      body: { property_details: propertyDetails }
    });

    if (response.error) {
      console.error('AVM valuation API error:', response.error);
      return { success: false, error: response.error.message };
    }

    return response.data;
  } catch (error) {
    console.error('Error calling AVM valuation API:', error);
    return { success: false, error: 'Failed to get property valuation' };
  }
}

async function handleCallbackQuery(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const userId = callbackQuery.from.id;

  console.log('Handling callback query:', data);

  try {
    if (data === 'main_menu') {
      await editTelegramMessage(chatId, messageId, 
        `🏗️ <b>Dubai Invest Bot - Главное меню</b>\n\nВыберите действие:`, {
        reply_markup: getMainMenuKeyboard()
      });
    }
    
    else if (data === 'search_menu') {
      await editTelegramMessage(chatId, messageId,
        `🔍 <b>Поиск недвижимости</b>\n\nВыберите тип поиска:`, {
        reply_markup: getSearchMenuKeyboard()
      });
    }
    
    else if (data.startsWith('search_')) {
      const searchType = data.replace('search_', '');
      
      if (searchType === 'apartment' || searchType === 'villa' || searchType === 'townhouse') {
        // Store search context and show price menu
        await editTelegramMessage(chatId, messageId,
          `🏠 <b>Поиск: ${getPropertyTypeEmoji(searchType)} ${getPropertyTypeName(searchType)}</b>\n\nВыберите ценовой диапазон:`, {
          reply_markup: getPriceRangeKeyboard(`${searchType}_sale`)
        });
      } else if (searchType === 'sale' || searchType === 'rent') {
        await editTelegramMessage(chatId, messageId,
          `${searchType === 'sale' ? '💸' : '🏠'} <b>${searchType === 'sale' ? 'Продажа' : 'Аренда'} недвижимости</b>\n\nВыберите ценовой диапазон:`, {
          reply_markup: getPriceRangeKeyboard(searchType)
        });
      } else if (searchType === 'premium') {
        // Search premium areas
        const searchResult = await callPropertySearchAPI({
          telegram_user_id: userId,
          query: 'premium properties',
          location: 'emirates hills,palm jumeirah,downtown',
          min_price: 2000000,
          limit: 5
        });
        
        await handleSearchResults(chatId, messageId, searchResult, 'Премиум недвижимость');
      }
    }
    
    else if (data.startsWith('price_')) {
      const parts = data.split('_');
      const searchType = parts[1];
      const purpose = parts[2] || 'sale';
      const minPrice = parseInt(parts[3]) || 0;
      const maxPrice = parseInt(parts[4]) || 0;
      
      const searchParams: any = {
        telegram_user_id: userId,
        query: `${searchType} properties`,
        purpose: purpose === 'sale' ? 'for-sale' : 'for-rent',
        limit: 5
      };
      
      if (minPrice > 0) searchParams.min_price = minPrice;
      if (maxPrice > 0) searchParams.max_price = maxPrice;
      if (searchType !== 'sale' && searchType !== 'rent') {
        searchParams.property_type = searchType;
      }
      
      const searchResult = await callPropertySearchAPI(searchParams);
      await handleSearchResults(chatId, messageId, searchResult, 
        `${getPropertyTypeName(searchType)} ${formatPriceRange(minPrice, maxPrice)}`);
    }
    
    else if (data.startsWith('location_')) {
      const location = data.replace('location_', '');
      if (location === 'all') {
        await editTelegramMessage(chatId, messageId,
          `📍 <b>Поиск по всем районам</b>\n\nВыберите ценовой диапазон:`, {
          reply_markup: getPriceRangeKeyboard('all_sale')
        });
      } else {
        const searchResult = await callPropertySearchAPI({
          telegram_user_id: userId,
          query: `properties in ${location}`,
          location: location.replace('_', ' '),
          limit: 5
        });
        
        await handleSearchResults(chatId, messageId, searchResult, 
          `Недвижимость в ${location.replace('_', ' ')}`);
      }
    }
    
    else if (data === 'valuation_menu') {
      await editTelegramMessage(chatId, messageId,
        `💰 <b>Оценка недвижимости</b>\n\nВыберите способ оценки:`, {
        reply_markup: getValuationMenuKeyboard()
      });
    }
    
    else if (data === 'valuation_by_id') {
      await editTelegramMessage(chatId, messageId,
        `🔍 <b>Оценка по ID объекта</b>\n\n` +
        `Отправьте ID объекта из поиска для получения автоматической оценки.\n\n` +
        `📝 Формат: просто отправьте ID (например: B-AS-136099)`, {
        reply_markup: {
          inline_keyboard: [[{ text: "⬅️ Назад", callback_data: "valuation_menu" }]]
        }
      });
    }
    
    else if (data === 'analytics_menu') {
      await editTelegramMessage(chatId, messageId,
        `📊 <b>Рыночная аналитика</b>\n\nВыберите тип анализа:`, {
        reply_markup: getAnalyticsMenuKeyboard()
      });
    }
    
    else if (data === 'analytics_top_areas') {
      await generateAnalyticsReport(chatId, messageId, 'top_areas');
    }
    
    else if (data === 'help') {
      await editTelegramMessage(chatId, messageId,
        `❓ <b>Помощь по использованию бота</b>\n\n` +
        `🔍 <b>Поиск недвижимости:</b>\n` +
        `• Используйте кнопки меню для быстрого поиска\n` +
        `• Или отправьте текстом: "Ищу квартиру в Marina до 1.5M"\n\n` +
        `💰 <b>Оценка стоимости:</b>\n` +
        `• Найдите объект через поиск и используйте его ID\n` +
        `• Или отправьте: "оцени B-AS-136099"\n\n` +
        `📊 <b>Аналитика:</b>\n` +
        `• Получайте отчеты по районам и трендам\n` +
        `• Сравнивайте инвестиционную привлекательность\n\n` +
        `💡 <b>Советы:</b>\n` +
        `• Задавайте вопросы на русском языке\n` +
        `• Используйте конкретные параметры в запросах`, {
        reply_markup: {
          inline_keyboard: [[{ text: "⬅️ Назад", callback_data: "main_menu" }]]
        }
      });
    }

    await answerCallbackQuery(callbackQuery.id);
    
  } catch (error) {
    console.error('Error handling callback query:', error);
    await answerCallbackQuery(callbackQuery.id, 'Произошла ошибка');
  }
}

async function handleSearchResults(chatId: number, messageId: number, searchResult: any, title: string) {
  if (searchResult.success && searchResult.properties && searchResult.properties.length > 0) {
    let response = `🏠 <b>${title}</b>\n\n📋 Найдено ${searchResult.count} объектов:\n\n`;
    
    searchResult.properties.forEach((property: any, index: number) => {
      response += `${index + 1}. <b>${property.title}</b>\n`;
      response += `💰 ${property.price.toLocaleString()} AED\n`;
      response += `📍 ${property.location_area}\n`;
      response += `🏠 ${property.property_type} • ${property.bedrooms}BR\n`;
      response += `🆔 <code>${property.external_id}</code>\n\n`;
    });

    response += `💡 <i>Для оценки объекта нажмите "💰 Оценка" и используйте ID</i>`;
    
    await editTelegramMessage(chatId, messageId, response, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "💰 Оценка стоимости", callback_data: "valuation_menu" },
            { text: "📊 Аналитика", callback_data: "analytics_menu" }
          ],
          [
            { text: "🔍 Новый поиск", callback_data: "search_menu" },
            { text: "🏠 Главное меню", callback_data: "main_menu" }
          ]
        ]
      }
    });
  } else {
    await editTelegramMessage(chatId, messageId,
      `😔 <b>${title}</b>\n\nПо вашим критериям ничего не найдено.\n\n` +
      `💡 Попробуйте:\n` +
      `• Изменить ценовой диапазон\n` +
      `• Выбрать другой район\n` +
      `• Уточнить тип недвижимости`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔍 Новый поиск", callback_data: "search_menu" },
            { text: "🏠 Главное меню", callback_data: "main_menu" }
          ]
        ]
      }
    });
  }
}

async function generateAnalyticsReport(chatId: number, messageId: number, reportType: string) {
  await editTelegramMessage(chatId, messageId,
    `📊 <b>Генерирую аналитический отчет...</b>\n\n⏳ Пожалуйста, подождите`, {
    reply_markup: { inline_keyboard: [] }
  });

  if (reportType === 'top_areas') {
    // Get top performing areas
    const { data: areas, error } = await supabase
      .from('property_listings')
      .select('location_area, price, area_sqft')
      .not('location_area', 'is', null)
      .gt('price', 0)
      .gt('area_sqft', 0)
      .limit(100);

    if (areas && !error) {
      // Calculate average price per sqft by area
      const areaStats: any = {};
      areas.forEach(property => {
        const area = property.location_area;
        const pricePerSqft = property.price / property.area_sqft;
        
        if (!areaStats[area]) {
          areaStats[area] = { prices: [], count: 0 };
        }
        areaStats[area].prices.push(pricePerSqft);
        areaStats[area].count++;
      });

      const topAreas = Object.entries(areaStats)
        .filter(([area, stats]: [string, any]) => stats.count >= 3)
        .map(([area, stats]: [string, any]) => {
          const avgPrice = stats.prices.reduce((a: number, b: number) => a + b, 0) / stats.prices.length;
          return { area, avgPrice: Math.round(avgPrice), count: stats.count };
        })
        .sort((a, b) => b.avgPrice - a.avgPrice)
        .slice(0, 8);

      let report = `📈 <b>Топ районы по цене за кв.ft</b>\n\n`;
      topAreas.forEach((item, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        report += `${medal} <b>${item.area}</b>\n`;
        report += `💰 ${item.avgPrice.toLocaleString()} AED/кв.ft\n`;
        report += `📊 ${item.count} объектов\n\n`;
      });

      await editTelegramMessage(chatId, messageId, report, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "📊 Другие отчеты", callback_data: "analytics_menu" },
              { text: "🏠 Главное меню", callback_data: "main_menu" }
            ]
          ]
        }
      });
    } else {
      await editTelegramMessage(chatId, messageId,
        `❌ <b>Ошибка генерации отчета</b>\n\nПопробуйте позже`, {
        reply_markup: {
          inline_keyboard: [[{ text: "⬅️ Назад", callback_data: "analytics_menu" }]]
        }
      });
    }
  }
}

function getPropertyTypeEmoji(type: string): string {
  switch (type) {
    case 'apartment': return '🏢';
    case 'villa': return '🏘️';
    case 'townhouse': return '🏠';
    case 'commercial': return '🏬';
    default: return '🏠';
  }
}

function getPropertyTypeName(type: string): string {
  switch (type) {
    case 'apartment': return 'Квартиры';
    case 'villa': return 'Виллы';
    case 'townhouse': return 'Таунхаусы';
    case 'commercial': return 'Коммерческая';
    case 'sale': return 'Продажа';
    case 'rent': return 'Аренда';
    default: return type;
  }
}

function formatPriceRange(min: number, max: number): string {
  if (min === 0 && max === 0) return '';
  if (min === 0) return `до ${formatPrice(max)}`;
  if (max === 0) return `от ${formatPrice(min)}`;
  return `${formatPrice(min)} - ${formatPrice(max)}`;
}

function formatPrice(price: number): string {
  if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
  if (price >= 1000) return `${(price / 1000).toFixed(0)}K`;
  return price.toString();
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

    // Handle callback queries (inline buttons)
    if (update.callback_query) {
        await handleCallbackQuery(update.callback_query);
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

🎯 <b>Используйте кнопки меню для быстрого доступа!</b>

✨ Или просто опишите что ищете текстом!
      `;
      
      await sendTelegramMessage(chatId, welcomeMessage, {
        reply_markup: getMainMenuKeyboard()
      });
      return new Response('OK', { status: 200 });
    }

    // Check if it's a property ID for valuation
    if (userQuery.match(/^[A-Z0-9\-]+$/)) {
      const { data: property, error } = await supabase
        .from('property_listings')
        .select('*')
        .eq('external_id', userQuery)
        .maybeSingle();

      if (property && !error) {
        const valuationResult = await callAVMValuationAPI({
          property_type: property.property_type,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          area_sqft: property.area_sqft,
          location_area: property.location_area,
          purpose: property.purpose
        });

        if (valuationResult.success) {
          const valuation = valuationResult.valuation;
          const response = `📊 <b>Автоматическая оценка недвижимости</b>\n\n` +
                         `🏠 <b>${property.title}</b>\n` +
                         `💰 Оценочная стоимость: <b>${valuation.estimated_value.toLocaleString()} AED</b>\n` +
                         `📈 Уровень доверия: ${(valuation.confidence_score * 100).toFixed(0)}%\n` +
                         `📍 Район: ${property.location_area}\n` +
                         `📊 Сопоставимых объектов: ${valuation.valuation_factors.comparable_count}\n\n` +
                         `📈 <b>Рыночные тренды:</b>\n` +
                         `• Средняя цена за кв.ft: ${valuation.market_trends.average_price_per_sqft} AED\n` +
                         `• Тренд цен: ${valuation.market_trends.price_trend}\n` +
                         `• Активность рынка: ${valuation.market_trends.market_activity}\n\n` +
                         `${valuationResult.ai_enhanced ? '🤖 Оценка с использованием ИИ' : '📊 Статистическая оценка'}`;
          
          await sendTelegramMessage(chatId, response, {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "🔍 Найти похожие", callback_data: "search_menu" },
                  { text: "📊 Аналитика района", callback_data: "analytics_menu" }
                ],
                [
                  { text: "🏠 Главное меню", callback_data: "main_menu" }
                ]
              ]
            }
          });
          return new Response('OK', { status: 200 });
        }
      } else {
        await sendTelegramMessage(chatId, 
          `❌ Объект с ID "${userQuery}" не найден.\n\n💡 Используйте поиск для нахождения актуальных объектов.`, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🔍 Поиск недвижимости", callback_data: "search_menu" },
                { text: "🏠 Главное меню", callback_data: "main_menu" }
              ]
            ]
          }
        });
        return new Response('OK', { status: 200 });
      }
    }

    // Generate AI response for other messages  
    const aiResponse = await generateAIResponse(userQuery);
    await sendTelegramMessage(chatId, aiResponse, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔍 Поиск", callback_data: "search_menu" },
            { text: "💰 Оценка", callback_data: "valuation_menu" }
          ],
          [
            { text: "🏠 Главное меню", callback_data: "main_menu" }
          ]
        ]
      }
    });

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing telegram webhook:', error);
    return new Response('Error', { status: 500 });
  }
});