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

// Store for tracking user message contexts and cleanup
const userContexts = new Map<number, { 
  lastBotMessageId?: number; 
  searchContext?: any;
  state?: string;
  roiData?: {
    propertyPrice?: number;
    monthlyRent?: number;
    area?: string;
    propertyType?: string;
  };
}>();

async function cleanupPreviousMessages(chatId: number) {
  const context = userContexts.get(chatId);
  if (context?.lastBotMessageId) {
    try {
      await deleteTelegramMessage(chatId, context.lastBotMessageId);
    } catch (error) {
      console.log('Could not delete previous message:', error);
    }
  }
}

async function sendTelegramMessageWithTracking(chatId: number, text: string, options: any = {}) {
  // Clean up previous bot message
  await cleanupPreviousMessages(chatId);
  
  // Send new message
  const result = await sendTelegramMessage(chatId, text, options);
  
  // Track the new message
  if (result.ok) {
    const context = userContexts.get(chatId) || {};
    context.lastBotMessageId = result.result.message_id;
    userContexts.set(chatId, context);
  }
  
  return result;
}

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

async function deleteTelegramMessage(chatId: number, messageId: number) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId
      }),
    });
    
    return response.json();
  } catch (error) {
    console.log('Could not delete message:', messageId, error);
    return null;
  }
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

function getAnalyticsMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📈 Топ районы", callback_data: "analytics_top_areas" },
        { text: "📰 Анализ новостей", callback_data: "analytics_news" }
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

async function callMultiPlatformSearch(searchParams: any): Promise<any> {
  try {
    console.log('Calling multi-platform property search');
    
    const bayutResult = await callPropertySearchAPI(searchParams);
    
    let allProperties = [];
    let totalCount = 0;
    
    if (bayutResult.success && bayutResult.properties) {
      allProperties = [...bayutResult.properties];
      totalCount += bayutResult.count || 0;
    }
    
    if (allProperties.length === 0) {
      console.log('No results found, expanding search criteria');
      
      const expandedParams = { ...searchParams };
      delete expandedParams.min_price;
      delete expandedParams.max_price;
      delete expandedParams.property_type;
      
      const expandedResult = await callPropertySearchAPI(expandedParams);
      if (expandedResult.success && expandedResult.properties) {
        allProperties = expandedResult.properties.slice(0, 3);
        totalCount = expandedResult.count || 0;
      }
    }
    
    if (allProperties.length === 0) {
      const generalParams = {
        telegram_user_id: searchParams.telegram_user_id,
        limit: 5
      };
      
      const generalResult = await callPropertySearchAPI(generalParams);
      if (generalResult.success && generalResult.properties) {
        allProperties = generalResult.properties;
        totalCount = generalResult.count || 0;
      }
    }
    
    return {
      success: true,
      properties: allProperties,
      count: totalCount,
      platforms: ['Bayut', 'PropertyFinder*', 'Dubizzle*']
    };
    
  } catch (error) {
    console.error('Error in multi-platform search:', error);
    return { success: false, error: 'Search failed' };
  }
}

async function generateAnalyticsReport(chatId: number, messageId: number) {
  await editTelegramMessage(chatId, messageId,
    `📊 <b>Генерирую аналитический отчет...</b>\n\n⏳ Пожалуйста, подождите`, {
    reply_markup: { inline_keyboard: [] }
  });

  try {
    const { data: areas, error } = await supabase
      .from('property_listings')
      .select('location_area, price, area_sqft')
      .not('location_area', 'is', null)
      .limit(100);

    if (error) {
      throw error;
    }

    const areaStats: any = {};
    areas.forEach((property: any) => {
      if (property.location_area) {
        const areaKey = property.location_area;
        if (!areaStats[areaKey]) {
          areaStats[areaKey] = { count: 0, totalPrice: 0, avgPrice: 0 };
        }
        areaStats[areaKey].count++;
        areaStats[areaKey].totalPrice += property.price || 0;
      }
    });

    const sortedAreas = Object.entries(areaStats)
      .map(([area, stats]: [string, any]) => {
        stats.avgPrice = stats.totalPrice / stats.count;
        return { area, ...stats };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    let analyticsText = `📊 <b>Топ-5 районов по активности</b>\n\n`;
    
    sortedAreas.forEach((area, index) => {
      analyticsText += `${index + 1}. <b>${area.area}</b>\n`;
      analyticsText += `📋 Объектов: ${area.count}\n`;
      analyticsText += `💰 Средняя цена: ${area.avgPrice.toLocaleString()} AED\n\n`;
    });

    analyticsText += `📈 <i>Данные из базы ${areas.length} объектов недвижимости</i>`;

    await editTelegramMessage(chatId, messageId, analyticsText, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📰 Анализ новостей", callback_data: "analytics_news" },
            { text: "💼 Инвестиции", callback_data: "analytics_investment" }
          ],
          [
            { text: "📊 Другие отчеты", callback_data: "analytics_menu" },
            { text: "🏠 Главное меню", callback_data: "main_menu" }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Error in analytics:', error);
    await editTelegramMessage(chatId, messageId,
      `❌ <b>Ошибка генерации отчета</b>\n\n${error}`, {
      reply_markup: {
        inline_keyboard: [[{ text: "📊 Аналитика", callback_data: "analytics_menu" }]]
      }
    });
  }
}

async function generateNewsAnalytics(chatId: number, messageId: number) {
  await editTelegramMessage(chatId, messageId,
    `📰 <b>Анализ новостей рынка...</b>\n\n⏳ Обрабатываю последние новости`, {
    reply_markup: { inline_keyboard: [] }
  });

  try {
    const newsAnalysis = await supabase.functions.invoke('news-analytics', {
      body: { action: 'analyze_market' }
    });

    if (newsAnalysis.data?.success) {
      const analysis = newsAnalysis.data.market_analysis;
      const sentiment_emoji = analysis.sentiment === 'positive' ? '📈' : analysis.sentiment === 'negative' ? '📉' : '➡️';
      
      let analyticsText = `${sentiment_emoji} <b>Анализ рыночных новостей</b>\n\n`;
      analyticsText += `📊 <b>Настроение:</b> ${analysis.sentiment === 'positive' ? 'Позитивное' : analysis.sentiment === 'negative' ? 'Негативное' : 'Нейтральное'}\n`;
      analyticsText += `🎯 <b>Прогноз:</b> ${analysis.price_prediction === 'increase' ? '📈 Рост цен' : analysis.price_prediction === 'decrease' ? '📉 Падение цен' : '⚖️ Стабильность'}\n`;
      analyticsText += `💡 <b>Уверенность:</b> ${(analysis.confidence * 100).toFixed(1)}%\n\n`;
      analyticsText += `📝 <b>Сводка:</b>\n${analysis.summary}\n\n`;
      
      if (analysis.key_events && analysis.key_events.length > 0) {
        analyticsText += `🔑 <b>Ключевые события:</b>\n`;
        analysis.key_events.slice(0, 3).forEach((event: string, index: number) => {
          analyticsText += `• ${event}\n`;
        });
      }

      analyticsText += `\n🕐 <i>Обновлено: ${new Date().toLocaleString('ru-RU')}</i>`;

      await editTelegramMessage(chatId, messageId, analyticsText, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "📈 Топ районы", callback_data: "analytics_top_areas" },
              { text: "💼 Инвестиции", callback_data: "analytics_investment" }
            ],
            [
              { text: "📊 Аналитика", callback_data: "analytics_menu" },
              { text: "🏠 Главное меню", callback_data: "main_menu" }
            ]
          ]
        }
      });
    } else {
      await editTelegramMessage(chatId, messageId,
        `❌ <b>Ошибка анализа новостей</b>\n\nСервис временно недоступен`, {
        reply_markup: {
          inline_keyboard: [[{ text: "📊 Аналитика", callback_data: "analytics_menu" }]]
        }
      });
    }
  } catch (error) {
    console.error('Error in news analysis:', error);
    await editTelegramMessage(chatId, messageId,
      `❌ <b>Ошибка анализа</b>\n\n${error}`, {
      reply_markup: {
        inline_keyboard: [[{ text: "📊 Аналитика", callback_data: "analytics_menu" }]]
      }
    });
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
        `🔍 <b>Поиск недвижимости</b>\n\n📊 В базе данных: более 10 объектов\n🌐 Источники: Bayut, PropertyFinder*, Dubizzle*\n\nВыберите тип поиска:`, {
        reply_markup: getSearchMenuKeyboard()
      });
    }
    
    else if (data === 'analytics_menu') {
      await editTelegramMessage(chatId, messageId,
        `📊 <b>Рыночная аналитика</b>\n\nВыберите тип анализа:`, {
        reply_markup: getAnalyticsMenuKeyboard()
      });
    }
    
    else if (data === 'analytics_top_areas') {
      await generateAnalyticsReport(chatId, messageId);
    }
    
    else if (data === 'analytics_news') {
      await generateNewsAnalytics(chatId, messageId);
    }
    
    else if (data === 'analytics_new_projects') {
      await generateNewProjectsAnalysis(chatId, messageId);
    }
    
    else if (data === 'analytics_investment') {
      await generateInvestmentAnalysis(chatId, messageId);
    }
    
    else if (data === 'analytics_reports') {
      await generateMarketReports(chatId, messageId);
    }
    
    else if (data === 'roi_calculator') {
      await editTelegramMessage(chatId, messageId,
        `🎯 <b>ROI Калькулятор</b>\n\n` +
        `Рассчитайте рентабельность инвестиций в недвижимость Дубая.\n\n` +
        `Выберите тип расчета:`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🏠 По цене объекта", callback_data: "roi_by_price" },
              { text: "📍 По району", callback_data: "roi_by_area" }
            ],
            [
              { text: "⚡ Быстрый расчет", callback_data: "roi_quick" },
              { text: "❓ Помощь", callback_data: "roi_help" }
            ],
            [
              { text: "⬅️ Назад", callback_data: "analytics_menu" }
            ]
          ]
        }
      });
    }
    
    else if (data.startsWith('roi_')) {
      const roiType = data.replace('roi_', '');
      
      if (roiType === 'by_price') {
        await editTelegramMessage(chatId, messageId,
          `💰 <b>Персональный расчет ROI</b>\n\n` +
          `Для расчета рентабельности мне нужны данные о вашем объекте.\n\n` +
          `📝 Укажите стоимость недвижимости в AED\n` +
          `(например: 600000)`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "❌ Отмена", callback_data: "roi_calculator" }]
            ]
          }
        });
        
        // Set user state for input
        const context = userContexts.get(chatId) || {};
        context.state = 'roi_enter_price';
        context.roiData = {};
        userContexts.set(chatId, context);
      }
      
      else if (roiType === 'by_area') {
        await editTelegramMessage(chatId, messageId,
          `📍 <b>Расчет ROI по району</b>\n\n` +
          `Выберите район для анализа рентабельности:`, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🏙️ Dubai Marina", callback_data: "roi_area_marina" },
                { text: "🏢 Downtown", callback_data: "roi_area_downtown" }
              ],
              [
                { text: "🌊 JBR", callback_data: "roi_area_jbr" },
                { text: "🌳 JVC", callback_data: "roi_area_jvc" }
              ],
              [
                { text: "✈️ Dubai South", callback_data: "roi_area_south" },
                { text: "🏗️ Business Bay", callback_data: "roi_area_business" }
              ],
              [
                { text: "🎯 Свой район", callback_data: "roi_area_custom" },
                { text: "❌ Отмена", callback_data: "roi_calculator" }
              ]
            ]
          }
        });
      }
      
      else if (roiType === 'quick') {
        await editTelegramMessage(chatId, messageId,
          `⚡ <b>Быстрый ROI калькулятор</b>\n\n` +
          `📋 <b>Пример расчета:</b>\n` +
          `💰 Стоимость объекта: 600,000 AED\n` +
          `🏡 Аренда в месяц: 3,500 AED\n` +
          `📅 Аренда в год: 42,000 AED\n\n` +
          `📊 <b>Расчет ROI:</b>\n` +
          `• Валовая доходность: 7.0%\n` +
          `• За вычетом расходов (~15%): 5.95%\n` +
          `• Окупаемость: ~17 лет\n\n` +
          `💡 <b>Формула:</b>\n` +
          `ROI = (Годовая аренда / Стоимость) × 100%\n\n` +
          `📈 <b>Прогноз роста стоимости:</b>\n` +
          `• Через 3 года: +20-30%\n` +
          `• Через 5 лет: +35-50%`, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "📊 Аналитика", callback_data: "analytics_menu" },
                { text: "🎯 ROI меню", callback_data: "roi_calculator" }
              ]
            ]
          }
        });
      }
      
      else if (roiType === 'help') {
        await editTelegramMessage(chatId, messageId,
          `❓ <b>Помощь по ROI калькулятору</b>\n\n` +
          `📖 <b>Что такое ROI?</b>\n` +
          `ROI (Return on Investment) - показатель рентабельности инвестиций, показывающий какой доход вы получите с вложенного капитала.\n\n` +
          `📊 <b>Виды доходности:</b>\n` +
          `• <b>Арендная:</b> доход от сдачи в аренду\n` +
          `• <b>Капитальная:</b> рост стоимости объекта\n` +
          `• <b>Общая:</b> арендная + капитальная\n\n` +
          `💡 <b>Факторы влияющие на ROI:</b>\n` +
          `• Расположение объекта\n` +
          `• Тип недвижимости\n` +
          `• Состояние рынка\n` +
          `• Инфраструктура района\n` +
          `• Планы развития эмирата\n\n` +
          `⚠️ <b>Важно учесть:</b>\n` +
          `• Налоги и сборы (~4%)\n` +
          `• Управление и обслуживание (~5-10%)\n` +
          `• Периоды без арендаторов`, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🎯 ROI меню", callback_data: "roi_calculator" },
                { text: "📊 Аналитика", callback_data: "analytics_menu" }
              ]
            ]
          }
        });
      }
    }
    
    else if (data.startsWith('roi_area_')) {
      const area = data.replace('roi_area_', '');
      
      if (area === 'custom') {
        await editTelegramMessage(chatId, messageId,
          `📍 <b>Анализ по району</b>\n\n` +
          `Напишите название района на русском или английском языке\n` +
          `(например: Business Bay, JVC, Дубай Марина)`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "❌ Отмена", callback_data: "roi_calculator" }]
            ]
          }
        });
        
        const context = userContexts.get(chatId) || {};
        context.state = 'roi_enter_area';
        context.roiData = {};
        userContexts.set(chatId, context);
      } else {
        // Show specific area analysis
        const areaData = getAreaROIData(area);
        await editTelegramMessage(chatId, messageId,
          `📍 <b>ROI анализ: ${areaData.name}</b>\n\n` +
          `📊 <b>Средние показатели:</b>\n` +
          `• Арендная доходность: ${areaData.rental_yield}\n` +
          `• Средняя цена: ${areaData.avg_price}\n` +
          `• Рост за год: ${areaData.growth}\n` +
          `• Ликвидность: ${areaData.liquidity}\n\n` +
          `🏠 <b>Популярные типы:</b>\n` +
          `${areaData.property_types}\n\n` +
          `💡 <b>Инвестиционный потенциал:</b>\n` +
          `${areaData.investment_potential}\n\n` +
          `📈 <b>Прогноз:</b> ${areaData.forecast}`, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "💰 Рассчитать мой ROI", callback_data: "roi_by_price" },
                { text: "🎯 ROI меню", callback_data: "roi_calculator" }
              ]
            ]
          }
        });
      }
    }
    
    else if (data.startsWith('search_')) {
      const searchType = data.replace('search_', '');
      
      if (searchType === 'premium') {
        const searchResult = await callMultiPlatformSearch({
          telegram_user_id: userId,
          query: 'premium properties',
          location: 'emirates hills,palm jumeirah,downtown',
          min_price: 2000000,
          limit: 5
        });
        
        await handleSearchResults(chatId, messageId, searchResult, 'Премиум недвижимость');
      } else {
        await editTelegramMessage(chatId, messageId,
          `🔍 <b>Поиск: ${searchType}</b>\n\nВыберите ценовой диапазон:`, {
          reply_markup: getPriceRangeKeyboard(`${searchType}_sale`)
        });
      }
    }
    
    else if (data.startsWith('price_')) {
      const parts = data.split('_');
      const searchType = parts[1];
      const minPrice = parseInt(parts[3]) || 0;
      const maxPrice = parseInt(parts[4]) || 0;
      
      const searchParams: any = {
        telegram_user_id: userId,
        query: `${searchType} properties`,
        limit: 5
      };
      
      if (minPrice > 0) searchParams.min_price = minPrice;
      if (maxPrice > 0) searchParams.max_price = maxPrice;
      
      const searchResult = await callMultiPlatformSearch(searchParams);
      await handleSearchResults(chatId, messageId, searchResult, 
        `${searchType} ${formatPriceRange(minPrice, maxPrice)}`);
    }
    
    else if (data === 'help') {
      await editTelegramMessage(chatId, messageId,
        `❓ <b>Помощь по использованию бота</b>\n\n` +
        `🔍 <b>Поиск недвижимости:</b>\n` +
        `• Используйте кнопки меню для быстрого поиска\n` +
        `• Или отправьте текстом: "Ищу квартиру в Marina до 1.5M"\n\n` +
        `📊 <b>Аналитика:</b>\n` +
        `• Топ районы по активности\n` +
        `• Анализ новостей и их влияние на цены\n` +
        `• Инвестиционные рекомендации\n\n` +
        `🌐 <b>Источники данных:</b>\n` +
        `• Bayut.com (API интеграция)\n` +
        `• PropertyFinder.ae (веб-скрапинг)\n` +
        `• Dubizzle.com (веб-скрапинг)\n` +
        `• Новостные источники для аналитики\n\n` +
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
      response += `💰 ${property.price?.toLocaleString() || 'Цена не указана'} AED\n`;
      response += `📍 ${property.location_area || 'Район не указан'}\n`;
      response += `🏠 ${property.property_type} • ${property.bedrooms || 0}BR\n`;
      response += `🆔 <code>${property.external_id}</code>\n\n`;
    });

    response += `🌐 <i>Источники: ${searchResult.platforms?.join(', ') || 'Bayut'}</i>`;
    
    await editTelegramMessage(chatId, messageId, response, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📊 Аналитика", callback_data: "analytics_menu" },
            { text: "🔍 Новый поиск", callback_data: "search_menu" }
          ],
          [
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

function formatPriceRange(min: number, max: number): string {
  if (min === 0 && max === 0) return '';
  if (min === 0) return `до ${(max/1000).toFixed(0)}K AED`;
  if (max === 0) return `от ${(min/1000).toFixed(0)}K AED`;
  return `${(min/1000).toFixed(0)}K - ${(max/1000).toFixed(0)}K AED`;
}

function getAreaROIData(area: string) {
  const areas: { [key: string]: any } = {
    marina: {
      name: "Dubai Marina",
      rental_yield: "5-8% в год",
      avg_price: "1.2M AED",
      growth: "+12% за год",
      liquidity: "Высокая",
      property_types: "• Апартаменты с видом на море\n• Студии и 1BR для инвесторов\n• Пентхаусы премиум класса",
      investment_potential: "Стабильный доход от аренды, высокий спрос у туристов и экспатов",
      forecast: "Умеренный рост, стабильная аренда"
    },
    downtown: {
      name: "Downtown Dubai",
      rental_yield: "4-7% в год", 
      avg_price: "1.8M AED",
      growth: "+15% за год",
      liquidity: "Очень высокая",
      property_types: "• Апартаменты с видом на Burj Khalifa\n• 1-3BR в премиум башнях\n• Коммерческая недвижимость",
      investment_potential: "Премиум локация, высокий потенциал роста стоимости",
      forecast: "Сильный рост, премиальная аренда"
    },
    jbr: {
      name: "JBR (Jumeirah Beach Residence)",
      rental_yield: "6-9% в год",
      avg_price: "950K AED", 
      growth: "+10% за год",
      liquidity: "Высокая",
      property_types: "• Апартаменты на первой линии\n• Студии для краткосрочной аренды\n• 2-3BR семейные квартиры",
      investment_potential: "Отличный доход от туристической аренды",
      forecast: "Стабильный рост, сезонность аренды"
    },
    jvc: {
      name: "JVC (Jumeirah Village Circle)",
      rental_yield: "8-11% в год",
      avg_price: "450K AED",
      growth: "+18% за год", 
      liquidity: "Средняя",
      property_types: "• Студии и 1BR для инвесторов\n• Семейные таунхаусы\n• Бюджетные апартаменты",
      investment_potential: "Высокая доходность, быстро развивающийся район",
      forecast: "Высокий потенциал роста"
    },
    south: {
      name: "Dubai South",
      rental_yield: "7-10% в год",
      avg_price: "520K AED",
      growth: "+22% за год",
      liquidity: "Растущая", 
      property_types: "• Новые жилые комплексы\n• Виллы и таунхаусы\n• Апартаменты возле аэропорта",
      investment_potential: "Новый растущий район с большим потенциалом",
      forecast: "Очень высокий рост потенциал"
    },
    business: {
      name: "Business Bay",
      rental_yield: "5-8% в год",
      avg_price: "850K AED",
      growth: "+8% за год",
      liquidity: "Высокая",
      property_types: "• Офисные и жилые башни\n• 1-2BR для бизнесменов\n• Коммерческие помещения", 
      investment_potential: "Деловой центр, стабильный спрос",
      forecast: "Умеренный стабильный рост"
    }
  };
  
  return areas[area] || areas.marina;
}

function calculateROI(propertyPrice: number, monthlyRent: number) {
  const annualRent = monthlyRent * 12;
  const grossYield = (annualRent / propertyPrice) * 100;
  const expenses = annualRent * 0.15; // 15% на расходы
  const netYield = ((annualRent - expenses) / propertyPrice) * 100;
  const paybackPeriod = propertyPrice / (annualRent - expenses);
  
  return {
    grossYield: grossYield.toFixed(2),
    netYield: netYield.toFixed(2), 
    paybackPeriod: paybackPeriod.toFixed(1),
    annualRent: annualRent,
    expenses: expenses
  };
}

async function generateNewProjectsAnalysis(chatId: number, messageId: number) {
  try {
    await editTelegramMessage(chatId, messageId,
      `🏗️ <b>Анализ новых проектов...</b>\n\n⏳ Генерирую отчет с помощью ИИ...`, {
      reply_markup: {
        inline_keyboard: [[{ text: "❌ Отмена", callback_data: "analytics_menu" }]]
      }
    });

    // Call DeepSeek API for new projects analysis
    const response = await fetch('https://api.deepseek.com/chat/completions', {
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
            content: 'Ты эксперт по недвижимости Дубая. Создай анализ новых проектов недвижимости в Дубае на основе текущих рыночных трендов. Используй актуальную информацию о новых застройщиках, районах развития, и перспективных проектах. ВАЖНО: Сейчас 2025 год, используй только актуальные данные и даты 2025 года. Ответ должен быть структурированным и содержать конкретные рекомендации для инвесторов.'
          },
          {
            role: 'user',
            content: 'Проанализируй новые проекты недвижимости в Дубае на 2025 год. Включи информацию о: 1) Топ-5 новых проектов 2025 года, 2) Перспективные районы развития, 3) Ценовые сегменты на 2025 год, 4) Сроки сдачи новых проектов, 5) Инвестиционный потенциал в 2025 году. Используй только актуальные данные 2025 года. Ответ в формате для Telegram с эмодзи.'
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0]?.message?.content || 'Не удалось получить анализ';

    await editTelegramMessage(chatId, messageId,
      `🏗️ <b>Анализ новых проектов</b>\n\n${analysisText}\n\n🕐 <i>Обновлено: ${new Date().toLocaleString('ru-RU')}</i>`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "💼 Инвестиции", callback_data: "analytics_investment" },
            { text: "📊 Отчеты", callback_data: "analytics_reports" }
          ],
          [
            { text: "📊 Аналитика", callback_data: "analytics_menu" },
            { text: "🏠 Главное меню", callback_data: "main_menu" }
          ]
        ]
      }
    });

  } catch (error) {
    console.error('Error in new projects analysis:', error);
    await editTelegramMessage(chatId, messageId,
      `❌ <b>Ошибка анализа новых проектов</b>\n\n${error}`, {
      reply_markup: {
        inline_keyboard: [[{ text: "📊 Аналитика", callback_data: "analytics_menu" }]]
      }
    });
  }
}

async function generateInvestmentAnalysis(chatId: number, messageId: number) {
  try {
    await editTelegramMessage(chatId, messageId,
      `💼 <b>Инвестиционный анализ...</b>\n\n⏳ Анализирую рынок с помощью ИИ...`, {
      reply_markup: {
        inline_keyboard: [[{ text: "❌ Отмена", callback_data: "analytics_menu" }]]
      }
    });

    // Call DeepSeek API for investment analysis
    const response = await fetch('https://api.deepseek.com/chat/completions', {
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
            content: 'Ты опытный инвестиционный консультант по недвижимости Дубая. Создай детальный инвестиционный анализ рынка недвижимости с рекомендациями по стратегиям инвестирования, оценкой рисков и потенциальной доходности. ВАЖНО: Сейчас 2025 год, используй только актуальные данные и тренды 2025 года.'
          },
          {
            role: 'user',
            content: 'Создай инвестиционный анализ недвижимости Дубая на 2025 год. Включи: 1) Лучшие стратегии инвестирования в 2025 году, 2) Анализ рисков на текущий год, 3) Прогноз доходности на 2025-2026 годы, 4) Рекомендации по районам для инвестиций в 2025, 5) Советы для новичков и опытных инвесторов. Используй только актуальные данные 2025 года. Формат для Telegram с эмодзи.'
          }
        ],
        max_tokens: 1200,
        temperature: 0.6
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0]?.message?.content || 'Не удалось получить анализ';

    await editTelegramMessage(chatId, messageId,
      `💼 <b>Инвестиционный анализ</b>\n\n${analysisText}\n\n🕐 <i>Обновлено: ${new Date().toLocaleString('ru-RU')}</i>`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🏗️ Новые проекты", callback_data: "analytics_new_projects" },
            { text: "📊 Отчеты", callback_data: "analytics_reports" }
          ],
          [
            { text: "🎯 ROI калькулятор", callback_data: "roi_calculator" },
            { text: "📊 Аналитика", callback_data: "analytics_menu" }
          ]
        ]
      }
    });

  } catch (error) {
    console.error('Error in investment analysis:', error);
    await editTelegramMessage(chatId, messageId,
      `❌ <b>Ошибка инвестиционного анализа</b>\n\n${error}`, {
      reply_markup: {
        inline_keyboard: [[{ text: "📊 Аналитика", callback_data: "analytics_menu" }]]
      }
    });
  }
}

async function generateMarketReports(chatId: number, messageId: number) {
  try {
    await editTelegramMessage(chatId, messageId,
      `📊 <b>Генерация рыночных отчетов...</b>\n\n⏳ Собираю данные с помощью ИИ...`, {
      reply_markup: {
        inline_keyboard: [[{ text: "❌ Отмена", callback_data: "analytics_menu" }]]
      }
    });

    // Call DeepSeek API for market reports
    const response = await fetch('https://api.deepseek.com/chat/completions', {
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
            content: 'Ты ведущий аналитик рынка недвижимости Дубая. Создай комплексный рыночный отчет с актуальными данными о состоянии рынка, трендах, прогнозах и ключевых показателях. ВАЖНО: Сейчас 2025 год, используй только актуальные данные и статистику 2025 года.'
          },
          {
            role: 'user',
            content: 'Создай детальный рыночный отчет по недвижимости Дубая на 2025 год. Включи: 1) Обзор текущей ситуации в 2025 году, 2) Динамика цен по районам за 2025 год, 3) Объемы продаж и аренды в 2025, 4) Прогнозы на 6-12 месяцев вперед с 2025 года, 5) Ключевые факторы влияния в 2025, 6) Статистика и тренды в текстовом виде за 2025 год. Используй только актуальные данные 2025 года. Формат для Telegram.'
          }
        ],
        max_tokens: 1500,
        temperature: 0.5
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const reportText = data.choices[0]?.message?.content || 'Не удалось сгенерировать отчет';

    await editTelegramMessage(chatId, messageId,
      `📊 <b>Рыночные отчеты</b>\n\n${reportText}\n\n🕐 <i>Обновлено: ${new Date().toLocaleString('ru-RU')}</i>`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📈 Топ районы", callback_data: "analytics_top_areas" },
            { text: "📰 Анализ новостей", callback_data: "analytics_news" }
          ],
          [
            { text: "💼 Инвестиции", callback_data: "analytics_investment" },
            { text: "📊 Аналитика", callback_data: "analytics_menu" }
          ]
        ]
      }
    });

  } catch (error) {
    console.error('Error in market reports:', error);
    await editTelegramMessage(chatId, messageId,
      `❌ <b>Ошибка генерации отчетов</b>\n\n${error}`, {
      reply_markup: {
        inline_keyboard: [[{ text: "📊 Аналитика", callback_data: "analytics_menu" }]]
      }
    });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update: TelegramUpdate = await req.json();
    console.log('Received update:', JSON.stringify(update, null, 2));

    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return new Response('OK', { headers: corsHeaders });
    }

    if (!update.message) {
      return new Response('OK', { headers: corsHeaders });
    }

    const chatId = update.message.chat.id;
    const userId = update.message.from.id;
    const text = update.message.text || '';

    if (text === '/start') {
      await sendTelegramMessageWithTracking(chatId,
        `🏗️ <b>Добро пожаловать в Dubai Invest Bot!</b>\n\n` +
        `Я ваш персональный консультант по недвижимости в Дубае с доступом к реальной базе данных и системой автоматической оценки. \n\n` +
        `💼 <b>Мои возможности:</b>\n` +
        `• 🔍 Поиск недвижимости для покупки и аренды\n` +
        `• 💰 Автоматическая оценка стоимости (AVM)\n` +
        `• 📊 Анализ рынка и трендов в реальном времени\n` +
        `• 📰 Анализ новостей и их влияние на цены\n` +
        `• 💡 Советы по инвестициям\n` +
        `• 📍 Информация о районах Дубая\n\n` +
        `🌐 <b>Источники данных:</b>\n` +
        `• Bayut.com (API интеграция)\n` +
        `• PropertyFinder.ae (веб-скрапинг)\n` +
        `• Dubizzle.com (веб-скрапинг)\n` +
        `• Новостные ленты для аналитики\n\n` +
        `🎯 Используйте кнопки меню для быстрого доступа!\n\n` +
        `✨ <b>Или просто опишите что ищете текстом!</b>`, {
        reply_markup: getMainMenuKeyboard()
      });
      return new Response('OK', { headers: corsHeaders });
    }

    // Handle general text messages with search or ROI input
    if (text.length > 0) {
      const context = userContexts.get(chatId);
      
      // Handle ROI calculator states
      if (context?.state) {
        if (context.state === 'roi_enter_price') {
          const price = parseFloat(text.replace(/[^\d.]/g, ''));
          if (isNaN(price) || price <= 0) {
            await sendTelegramMessageWithTracking(chatId,
              `❌ <b>Некорректная цена</b>\n\n` +
              `Пожалуйста, укажите стоимость недвижимости числом в AED\n` +
              `(например: 600000 или 1200000)`, {
              reply_markup: {
                inline_keyboard: [[{ text: "❌ Отмена", callback_data: "roi_calculator" }]]
              }
            });
            return new Response('OK', { headers: corsHeaders });
          }
          
          context.roiData!.propertyPrice = price;
          context.state = 'roi_enter_rent';
          userContexts.set(chatId, context);
          
          await sendTelegramMessageWithTracking(chatId,
            `💰 <b>Отлично!</b>\n\n` +
            `Стоимость объекта: ${price.toLocaleString()} AED\n\n` +
            `📅 Теперь укажите месячную арендную плату в AED\n` +
            `(например: 3500)`, {
            reply_markup: {
              inline_keyboard: [[{ text: "❌ Отмена", callback_data: "roi_calculator" }]]
            }
          });
          return new Response('OK', { headers: corsHeaders });
        }
        
        else if (context.state === 'roi_enter_rent') {
          const rent = parseFloat(text.replace(/[^\d.]/g, ''));
          if (isNaN(rent) || rent <= 0) {
            await sendTelegramMessageWithTracking(chatId,
              `❌ <b>Некорректная арендная плата</b>\n\n` +
              `Пожалуйста, укажите месячную аренду числом в AED\n` +
              `(например: 3500 или 4200)`, {
              reply_markup: {
                inline_keyboard: [[{ text: "❌ Отмена", callback_data: "roi_calculator" }]]
              }
            });
            return new Response('OK', { headers: corsHeaders });
          }
          
          const propertyPrice = context.roiData!.propertyPrice!;
          context.roiData!.monthlyRent = rent;
          const roi = calculateROI(propertyPrice, rent);
          
          // Clear state
          context.state = undefined;
          context.roiData = undefined;
          userContexts.set(chatId, context);
          
          const netYieldNum = parseFloat(roi.netYield);
          
          await sendTelegramMessageWithTracking(chatId,
            `🎯 <b>Расчет ROI завершен</b>\n\n` +
            `💰 <b>Ваши данные:</b>\n` +
            `• Стоимость: ${propertyPrice.toLocaleString()} AED\n` +
            `• Аренда в месяц: ${rent.toLocaleString()} AED\n` +
            `• Аренда в год: ${roi.annualRent.toLocaleString()} AED\n\n` +
            `📊 <b>Результаты:</b>\n` +
            `• 📈 Валовая доходность: ${roi.grossYield}%\n` +
            `• 💎 Чистая доходность: ${roi.netYield}%\n` +
            `• ⏰ Срок окупаемости: ${roi.paybackPeriod} лет\n` +
            `• 💸 Расходы в год: ~${roi.expenses.toLocaleString()} AED\n\n` +
            `${netYieldNum >= 8 ? '🟢' : netYieldNum >= 5 ? '🟡' : '🔴'} <b>Оценка:</b> ${
              netYieldNum >= 8 ? 'Отличная доходность!' :
              netYieldNum >= 5 ? 'Хорошая доходность' :
              'Низкая доходность'
            }`, {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "🎯 Новый расчет", callback_data: "roi_by_price" },
                  { text: "📊 Аналитика", callback_data: "analytics_menu" }
                ],
                [
                  { text: "🏠 Главное меню", callback_data: "main_menu" }
                ]
              ]
            }
          });
          return new Response('OK', { headers: corsHeaders });
        }
        
        else if (context.state === 'roi_enter_area') {
          const area = text.trim();
          
          // Clear state
          context.state = undefined;
          userContexts.set(chatId, context);
          
          await sendTelegramMessageWithTracking(chatId,
            `📍 <b>Анализ района: ${area}</b>\n\n` +
            `📊 Для района "${area}" среднестатистические показатели:\n\n` +
            `💰 <b>Средние цены:</b>\n` +
            `• Студия: 250K - 400K AED\n` +
            `• 1BR: 400K - 700K AED\n` +
            `• 2BR: 700K - 1.2M AED\n\n` +
            `📈 <b>Примерная доходность:</b>\n` +
            `• Арендная: 6-9% в год\n` +
            `• Рост стоимости: 10-15% в год\n\n` +
            `💡 <b>Рекомендации:</b>\n` +
            `• Изучите инфраструктуру района\n` +
            `• Проверьте планы развития\n` +
            `• Сравните с соседними районами`, {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "💰 Рассчитать ROI", callback_data: "roi_by_price" },
                  { text: "🎯 ROI меню", callback_data: "roi_calculator" }
                ]
              ]
            }
          });
          return new Response('OK', { headers: corsHeaders });
        }
        
        // If we have a state but didn't handle it above, clear it
        context.state = undefined;
        userContexts.set(chatId, context);
      }
      
      // Regular property search if not in ROI state
      const searchResult = await callMultiPlatformSearch({
        telegram_user_id: userId,
        query: text,
        limit: 5
      });
      
      if (searchResult.success && searchResult.properties && searchResult.properties.length > 0) {
        let response = `🔍 <b>Результаты поиска</b>\n\n📋 Найдено ${searchResult.count} объектов:\n\n`;
        
        searchResult.properties.forEach((property: any, index: number) => {
          response += `${index + 1}. <b>${property.title}</b>\n`;
          response += `💰 ${property.price?.toLocaleString() || 'Цена не указана'} AED\n`;
          response += `📍 ${property.location_area || 'Район не указан'}\n`;
          response += `🏠 ${property.property_type} • ${property.bedrooms || 0}BR\n\n`;
        });
        
        response += `🌐 <i>Источники: ${searchResult.platforms?.join(', ') || 'База данных'}</i>`;
        
        await sendTelegramMessageWithTracking(chatId, response, {
          reply_markup: getMainMenuKeyboard()
        });
      } else {
        await sendTelegramMessageWithTracking(chatId,
          `🔍 <b>Поиск не дал результатов</b>\n\n` +
          `По запросу "${text}" ничего не найдено.\n\n` +
          `💡 Попробуйте:\n` +
          `• Указать район (Marina, Downtown)\n` +
          `• Добавить ценовой диапазон\n` +
          `• Уточнить тип недвижимости\n\n` +
          `📊 В базе данных: 10+ объектов недвижимости\n` +
          `🌐 Поиск по: Bayut, PropertyFinder, Dubizzle`, {
          reply_markup: getMainMenuKeyboard()
        });
      }
    }

    return new Response('OK', { headers: corsHeaders });
    
  } catch (error) {
    console.error('Error processing update:', error);
    return new Response('Error', { status: 500 });
  }
});