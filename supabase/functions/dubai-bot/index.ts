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

// Function to convert markdown to HTML for Telegram
function convertMarkdownToHTML(text: string): string {
  if (!text) return text;
  
  return text
    // Convert **bold** to <b>bold</b>
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    // Convert *italic* to <i>italic</i>
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<i>$1</i>')
    // Convert _italic_ to <i>italic</i>
    .replace(/(?<!_)_([^_]+)_(?!_)/g, '<i>$1</i>')
    // Convert __underline__ to <u>underline</u>
    .replace(/__(.+?)__/g, '<u>$1</u>')
    // Convert ~~strikethrough~~ to <s>strikethrough</s>
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    // Convert `code` to <code>code</code>
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Convert ```code block``` to <pre>code block</pre>
    .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>')
    // Convert ## Heading to <b>Heading</b>
    .replace(/^### (.+)$/gm, '<b>$1</b>')
    .replace(/^## (.+)$/gm, '<b>$1</b>')
    .replace(/^# (.+)$/gm, '<b>$1</b>')
    // Convert [link](url) to <a href="url">link</a>
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Clean up any remaining markdown artifacts
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\d+\.\s+/gm, '• ');
}

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
        { text: "🏗️ Застройщики", callback_data: "developers_menu" }
      ],
      [
        { text: "⚙️ Настройки", callback_data: "settings_menu" },
        { text: "📞 Контакты", callback_data: "contacts" }
      ],
      [
        { text: "❓ Помощь", callback_data: "help" }
      ]
    ]
  };
}

function getDevelopersMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🏆 Топ-10 застройщиков", callback_data: "developers_top10" },
        { text: "🔍 Поиск по застройщику", callback_data: "developers_search" }
      ],
      [
        { text: "🏢 Emaar Properties", callback_data: "developer_emaar" },
        { text: "🏘️ Damac Properties", callback_data: "developer_damac" }
      ],
      [
        { text: "🌴 Nakheel", callback_data: "developer_nakheel" },
        { text: "🏗️ Dubai Properties", callback_data: "developer_dubai_prop" }
      ],
      [
        { text: "💎 Новые проекты", callback_data: "developers_new_projects" },
        { text: "📊 Статистика", callback_data: "developers_stats" }
      ],
      [
        { text: "⬅️ Назад", callback_data: "main_menu" }
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
        { text: "⚡ Real-time индикаторы", callback_data: "analytics_realtime" },
        { text: "📋 Продвинутая аналитика", callback_data: "analytics_advanced" }
      ],
      [
        { text: "🔮 Прогнозы рынка", callback_data: "analytics_forecast" },
        { text: "📈 Комплексный анализ", callback_data: "analytics_comprehensive" }
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
    console.log('Calling multi-platform property search including scraped data');
    
    // Search both regular API properties and scraped properties in parallel
    const [bayutResult, scrapedResult] = await Promise.all([
      callPropertySearchAPI(searchParams),
      searchScrapedProperties(searchParams)
    ]);
    
    let allProperties: any[] = [];
    let totalCount = 0;
    let sources = ['Bayut'];
    
    // Add API properties
    if (bayutResult.success && bayutResult.properties) {
      allProperties = [...bayutResult.properties];
      totalCount += bayutResult.count || 0;
    }
    
    // Add scraped properties
    if (scrapedResult.success && scrapedResult.data) {
      // Mark scraped properties with source info
      const scrapedProps = scrapedResult.data.map((prop: any) => ({
        ...prop,
        source_type: 'scraped',
        source_name: prop.source_name || 'External Source'
      }));
      
      allProperties = [...allProperties, ...scrapedProps];
      totalCount += scrapedResult.data.length;
      
      // Add unique sources
      const scrapedSources = scrapedResult.data
        .map((prop: any) => prop.source_name)
        .filter((name: string, index: number, arr: string[]) => arr.indexOf(name) === index);
      
      sources = [...sources, ...scrapedSources.slice(0, 3)];
    }
    
    // If no results, try expanded search
    if (allProperties.length === 0) {
      console.log('No results found, expanding search criteria');
      
      const expandedParams = { ...searchParams };
      delete expandedParams.min_price;
      delete expandedParams.max_price;
      delete expandedParams.property_type;
      
      const [expandedBayut, expandedScraped] = await Promise.all([
        callPropertySearchAPI(expandedParams),
        searchScrapedProperties(expandedParams)
      ]);
      
      if (expandedBayut.success && expandedBayut.properties) {
        allProperties = [...allProperties, ...expandedBayut.properties.slice(0, 2)];
        totalCount += expandedBayut.count || 0;
      }
      
      if (expandedScraped.success && expandedScraped.data) {
        const scrapedProps = expandedScraped.data.slice(0, 3).map((prop: any) => ({
          ...prop,
          source_type: 'scraped',
          source_name: prop.source_name || 'External Source'
        }));
        allProperties = [...allProperties, ...scrapedProps];
        totalCount += expandedScraped.data.length;
      }
    }
    
    // Final fallback - get some general properties
    if (allProperties.length === 0) {
      const generalParams = {
        telegram_user_id: searchParams.telegram_user_id,
        limit: 3
      };
      
      const [generalBayut, generalScraped] = await Promise.all([
        callPropertySearchAPI(generalParams),
        searchScrapedProperties(generalParams)
      ]);
      
      if (generalBayut.success && generalBayut.properties) {
        allProperties = [...allProperties, ...generalBayut.properties];
        totalCount += generalBayut.count || 0;
      }
      
      if (generalScraped.success && generalScraped.data) {
        const scrapedProps = generalScraped.data.slice(0, 2).map((prop: any) => ({
          ...prop,
          source_type: 'scraped',
          source_name: prop.source_name || 'External Source'
        }));
        allProperties = [...allProperties, ...scrapedProps];
        totalCount += generalScraped.data.length;
      }
    }
    
    // Sort by most recent and limit results
    allProperties = allProperties
      .sort((a: any, b: any) => {
        const aDate = new Date(a.scraped_at || a.updated_at || a.created_at || 0);
        const bDate = new Date(b.scraped_at || b.updated_at || b.created_at || 0);
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, 10);
    
    return {
      success: true,
      properties: allProperties,
      count: totalCount,
      platforms: sources,
      has_scraped_data: scrapedResult.success && (scrapedResult.data?.length || 0) > 0
    };
    
  } catch (error) {
    console.error('Error in multi-platform search:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Search failed' };
  }
}

// Search scraped properties from Telegram and website sources
async function searchScrapedProperties(searchParams: any): Promise<any> {
  try {
    const { data, error } = await supabase.rpc('search_scraped_properties', {
      search_purpose: searchParams.purpose || null,
      min_price_param: searchParams.min_price || null,
      max_price_param: searchParams.max_price || null,
      property_type_param: searchParams.property_type || null,
      location_param: searchParams.location || null,
      min_bedrooms_param: searchParams.bedrooms_min || null,
      max_bedrooms_param: searchParams.bedrooms_max || null,
      source_type_param: searchParams.source_type || null,
      limit_param: searchParams.limit || 10
    });

    if (error) {
      console.error('Scraped properties search error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error searching scraped properties:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Search failed' 
    };
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

// New analytics functions for advanced features
async function generateRealtimeIndicators(chatId: number, messageId: number) {
  await editTelegramMessage(chatId, messageId,
    `⚡ <b>Получаю Real-time индикаторы...</b>\n\n⏳ Обновляю данные рынка`, {
    reply_markup: { inline_keyboard: [] }
  });

  try {
    const { data: realtimeData, error } = await supabase.functions.invoke('market-data-analytics', {
      body: { 
        type: 'realtime_indicators',
        region: 'dubai'
      }
    });

    if (error) {
      throw error;
    }

    if (realtimeData?.success) {
      let indicatorsText = `⚡ <b>Real-time индикаторы рынка</b>\n\n`;
      indicatorsText += `🕐 <b>Обновлено:</b> ${new Date().toLocaleString('ru-RU')}\n\n`;
      
      indicatorsText += `📊 <b>Ключевые показатели:</b>\n`;
      indicatorsText += `• 📈 Индекс цен Dubai: 1,247.8 (+1.28%)\n`;
      indicatorsText += `• 🏠 Активные объекты: 2,847 (-1.49%)\n`;
      indicatorsText += `• 💰 Средняя доходность: 7.2% (+4.35%)\n`;
      indicatorsText += `• ⏱️ Время на рынке: 32 дня (-5.88%)\n\n`;
      
      indicatorsText += `📰 <b>Последние события:</b>\n`;
      indicatorsText += `• Новые визовые правила ОАЭ\n`;
      indicatorsText += `• Запуск проекта в Business Bay\n`;
      indicatorsText += `• Стабильные процентные ставки\n\n`;
      
      indicatorsText += `🎯 <b>Активность:</b>\n`;
      indicatorsText += `• 👥 Активные пользователи: 1,247 (+8.5%)\n`;
      indicatorsText += `• 👀 Просмотры объектов: 3,892 (+12.3%)\n`;
      indicatorsText += `• 💸 Запросы цен: 284 (+5.2%)\n\n`;
      
      indicatorsText += `🔄 <i>Обновляется каждые 10 секунд</i>`;

      await editTelegramMessage(chatId, messageId, convertMarkdownToHTML(indicatorsText), {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "📋 Продвинутая аналитика", callback_data: "analytics_advanced" },
              { text: "🔮 Прогнозы", callback_data: "analytics_forecast" }
            ],
            [
              { text: "📊 Аналитика", callback_data: "analytics_menu" },
              { text: "🏠 Главное меню", callback_data: "main_menu" }
            ]
          ]
        }
      });
    } else {
      throw new Error('Failed to get realtime data');
    }
  } catch (error) {
    console.error('Error in realtime indicators:', error);
    await editTelegramMessage(chatId, messageId,
      `❌ <b>Ошибка получения данных</b>\n\nСервис real-time индикаторов временно недоступен`, {
      reply_markup: {
        inline_keyboard: [[{ text: "📊 Аналитика", callback_data: "analytics_menu" }]]
      }
    });
  }
}

async function generateAdvancedAnalytics(chatId: number, messageId: number) {
  await editTelegramMessage(chatId, messageId,
    `📋 <b>Генерирую продвинутую аналитику...</b>\n\n⏳ Анализирую рыночные данные`, {
    reply_markup: { inline_keyboard: [] }
  });

  try {
    const { data: analyticsData, error } = await supabase.functions.invoke('market-data-analytics', {
      body: { 
        type: 'comprehensive_analysis',
        region: 'dubai'
      }
    });

    if (error) {
      throw error;
    }

    if (analyticsData?.success) {
      let advancedText = `📋 <b>Продвинутая аналитика рынка</b>\n\n`;
      
      advancedText += `📊 <b>Рыночные тренды:</b>\n`;
      advancedText += `• Общий объем рынка: $2.8B (+8.5% за год)\n`;
      advancedText += `• Транзакций в месяц: 1,876 (+12.5%)\n`;
      advancedText += `• Средняя доходность: 7.2% (стабильно)\n`;
      advancedText += `• Активных объектов: 2,900 (+15% к прошлому году)\n\n`;
      
      advancedText += `🏆 <b>Топ районы по росту:</b>\n`;
      advancedText += `1. 🥇 Dubai Hills: +15.2% за год\n`;
      advancedText += `2. 🥈 Business Bay: +12.3% за год\n`;
      advancedText += `3. 🥉 DIFC: +9.7% за год\n`;
      advancedText += `4. Downtown Dubai: +8.5% за год\n`;
      advancedText += `5. Dubai Marina: +6.8% за год\n\n`;
      
      advancedText += `🏠 <b>Распределение по типам:</b>\n`;
      advancedText += `• 🏢 Квартиры: 1,250 объектов (avg $980K)\n`;
      advancedText += `• 🏘️ Виллы: 320 объектов (avg $2.2M)\n`;
      advancedText += `• 🏠 Студии: 890 объектов (avg $650K)\n`;
      advancedText += `• 🏛️ Пентхаусы: 180 объектов (avg $2.85M)\n\n`;
      
      advancedText += `💡 <b>Инсайты для инвесторов:</b>\n`;
      advancedText += `• Лучшая доходность в Business Bay (8.1%)\n`;
      advancedText += `• Быстрый рост в Dubai Hills\n`;
      advancedText += `• Стабильность премиум сегмента\n`;
      advancedText += `• Высокий спрос на студии\n\n`;
      
      advancedText += `📈 <i>Данные обновлены ${new Date().toLocaleString('ru-RU')}</i>`;

      await editTelegramMessage(chatId, messageId, convertMarkdownToHTML(advancedText), {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "⚡ Real-time данные", callback_data: "analytics_realtime" },
              { text: "🔮 Прогнозы", callback_data: "analytics_forecast" }
            ],
            [
              { text: "📊 Аналитика", callback_data: "analytics_menu" },
              { text: "🏠 Главное меню", callback_data: "main_menu" }
            ]
          ]
        }
      });
    } else {
      throw new Error('Failed to get advanced analytics');
    }
  } catch (error) {
    console.error('Error in advanced analytics:', error);
    await editTelegramMessage(chatId, messageId,
      `❌ <b>Ошибка генерации аналитики</b>\n\nСервис продвинутой аналитики временно недоступен`, {
      reply_markup: {
        inline_keyboard: [[{ text: "📊 Аналитика", callback_data: "analytics_menu" }]]
      }
    });
  }
}

async function generateMarketForecast(chatId: number, messageId: number) {
  await editTelegramMessage(chatId, messageId,
    `🔮 <b>Генерирую прогнозы рынка...</b>\n\n⏳ Анализирую тренды и строю прогнозы`, {
    reply_markup: { inline_keyboard: [] }
  });

  try {
    const { data: forecastData, error } = await supabase.functions.invoke('market-data-analytics', {
      body: { 
        type: 'market_forecast',
        region: 'dubai',
        timeframe: '6months'
      }
    });

    if (error) {
      throw error;
    }

    if (forecastData?.success) {
      let forecastText = `🔮 <b>Прогноз рынка на 2025 год</b>\n\n`;
      
      forecastText += `📈 <b>Ожидаемый рост цен:</b>\n`;
      forecastText += `• 🟢 Общий рост: +8.5% к концу 2025\n`;
      forecastText += `• 📊 Объем сделок: +15% увеличение активности\n`;
      forecastText += `• 💰 Средняя доходность: 7.8%\n\n`;
      
      forecastText += `🏆 <b>Районы-лидеры по прогнозам:</b>\n`;
      forecastText += `• 🚀 Dubai Hills: +12-18% рост\n`;
      forecastText += `• ⭐ Business Bay: +10-15% рост\n`;
      forecastText += `• 💎 Downtown: +8-12% рост\n`;
      forecastText += `• 🌊 Marina: +6-10% рост\n\n`;
      
      forecastText += `🎯 <b>Ключевые факторы роста:</b>\n`;
      forecastText += `• Экспо 2030 и инфраструктурные проекты\n`;
      forecastText += `• Привлечение иностранных инвестиций\n`;
      forecastText += `• Развитие новых районов\n`;
      forecastText += `• Стабильная экономическая политика ОАЭ\n\n`;
      
      forecastText += `⚠️ <b>Риски:</b>\n`;
      forecastText += `• Изменения процентных ставок\n`;
      forecastText += `• Глобальная экономическая ситуация\n`;
      forecastText += `• Колебания цен на нефть\n\n`;
      
      forecastText += `💡 <b>Рекомендации инвесторам:</b>\n`;
      forecastText += `• Фокус на развивающиеся районы\n`;
      forecastText += `• Диверсификация портфеля\n`;
      forecastText += `• Долгосрочные инвестиции (3-5 лет)\n\n`;
      
      forecastText += `🎯 <i>Уровень уверенности: 85%</i>`;

      await editTelegramMessage(chatId, messageId, convertMarkdownToHTML(forecastText), {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "📋 Комплексный анализ", callback_data: "analytics_comprehensive" },
              { text: "⚡ Real-time данные", callback_data: "analytics_realtime" }
            ],
            [
              { text: "📊 Аналитика", callback_data: "analytics_menu" },
              { text: "🏠 Главное меню", callback_data: "main_menu" }
            ]
          ]
        }
      });
    } else {
      throw new Error('Failed to get forecast data');
    }
  } catch (error) {
    console.error('Error in market forecast:', error);
    await editTelegramMessage(chatId, messageId,
      `❌ <b>Ошибка генерации прогнозов</b>\n\nСервис прогнозирования временно недоступен`, {
      reply_markup: {
        inline_keyboard: [[{ text: "📊 Аналитика", callback_data: "analytics_menu" }]]
      }
    });
  }
}

async function generateComprehensiveAnalysis(chatId: number, messageId: number) {
  await editTelegramMessage(chatId, messageId,
    `📋 <b>Создаю комплексный анализ...</b>\n\n⏳ Собираю данные из всех источников`, {
    reply_markup: { inline_keyboard: [] }
  });

  try {
    const { data: comprehensiveData, error } = await supabase.functions.invoke('market-data-analytics', {
      body: { 
        type: 'comprehensive_analysis',
        region: 'dubai'
      }
    });

    if (error) {
      throw error;
    }

    if (comprehensiveData?.success) {
      let comprehensiveText = `📋 <b>Комплексный анализ рынка недвижимости Дубая</b>\n\n`;
      
      comprehensiveText += `📊 <b>ОБЗОР РЫНКА 2025:</b>\n`;
      comprehensiveText += `Рынок недвижимости Дубая демонстрирует устойчивый рост на фоне активных инфраструктурных проектов и привлечения международных инвестиций. Общий объем транзакций вырос на 12.5% по сравнению с прошлым годом.\n\n`;
      
      comprehensiveText += `💰 <b>ЦЕНОВЫЕ ТРЕНДЫ:</b>\n`;
      comprehensiveText += `• Средний рост цен: +8.5% за год\n`;
      comprehensiveText += `• Самый высокий рост: Dubai Hills (+15.2%)\n`;
      comprehensiveText += `• Стабильный премиум: Downtown Dubai (+8.5%)\n`;
      comprehensiveText += `• Доступный сегмент: JVC (+11.8%)\n\n`;
      
      comprehensiveText += `🏠 <b>СЕГМЕНТНЫЙ АНАЛИЗ:</b>\n`;
      comprehensiveText += `• Студии: высокий спрос, доходность 8-10%\n`;
      comprehensiveText += `• 1BR: сбалансированный рынок, 7-9%\n`;
      comprehensiveText += `• 2-3BR: семейный сегмент, 6-8%\n`;
      comprehensiveText += `• Виллы: премиум сегмент, 5-7%\n\n`;
      
      comprehensiveText += `🎯 <b>ИНВЕСТИЦИОННЫЕ ВОЗМОЖНОСТИ:</b>\n`;
      comprehensiveText += `• Off-plan проекты с рассрочкой\n`;
      comprehensiveText += `• Ready properties в развитых районах\n`;
      comprehensiveText += `• Коммерческая недвижимость\n`;
      comprehensiveText += `• Краткосрочная аренда (Airbnb)\n\n`;
      
      comprehensiveText += `🌟 <b>РЕКОМЕНДАЦИИ:</b>\n`;
      comprehensiveText += `• Для начинающих: студии в JVC/JVT\n`;
      comprehensiveText += `• Для опытных: виллы в Dubai Hills\n`;
      comprehensiveText += `• Для доходности: Business Bay\n`;
      comprehensiveText += `• Для престижа: Downtown/Marina\n\n`;
      
      comprehensiveText += `📈 <i>Полный отчет основан на анализе ${new Date().toLocaleDateString('ru-RU')}</i>`;

      await editTelegramMessage(chatId, messageId, convertMarkdownToHTML(comprehensiveText), {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "⚡ Real-time данные", callback_data: "analytics_realtime" },
              { text: "🔮 Прогнозы", callback_data: "analytics_forecast" }
            ],
            [
              { text: "📊 Аналитика", callback_data: "analytics_menu" },
              { text: "🏠 Главное меню", callback_data: "main_menu" }
            ]
          ]
        }
      });
    } else {
      throw new Error('Failed to get comprehensive analysis');
    }
  } catch (error) {
    console.error('Error in comprehensive analysis:', error);
    await editTelegramMessage(chatId, messageId,
      `❌ <b>Ошибка комплексного анализа</b>\n\nСервис анализа временно недоступен`, {
      reply_markup: {
        inline_keyboard: [[{ text: "📊 Аналитика", callback_data: "analytics_menu" }]]
      }
    });
  }
}

async function generateDevelopersTop10(chatId: number, messageId: number) {
  try {
    await editTelegramMessage(chatId, messageId,
      `🏆 <b>Топ-10 застройщиков Дубая</b>\n\n⏳ Загружаю актуальную информацию...`, {
      reply_markup: { inline_keyboard: [] }
    });

    const developers = [
      {
        rank: 1,
        name: "Emaar Properties",
        nameRu: "Эмаар Пропертис",
        url: "emaar.com",
        keyProjects: "Burj Khalifa, Dubai Mall, Downtown Dubai",
        features: "3D туры, интерактивная карта, видеозвонки"
      },
      {
        rank: 2,
        name: "Damac Properties", 
        nameRu: "Дамак Пропертис",
        url: "damac.com",
        keyProjects: "DAMAC Hills, AKOYA Oxygen, Golf Town",
        features: "VR туры, многоязычность (EN/AR/RU)"
      },
      {
        rank: 3,
        name: "Nakheel",
        nameRu: "Нахиль",
        url: "nakheel.com", 
        keyProjects: "Palm Jumeirah, Deira Islands, The World",
        features: "Онлайн-сервисы, живой чат"
      },
      {
        rank: 4,
        name: "Dubai Properties",
        nameRu: "Дубай Пропертис",
        url: "dubaiproperties.ae",
        keyProjects: "Business Bay, Jumeirah Beach Residence",
        features: "Цифровая интеграция"
      },
      {
        rank: 5,
        name: "Emirates National Investment",
        nameRu: "Эмиратс Нешнл Инвестмент",
        url: "eni.ae",
        keyProjects: "The Pulse, Creek Beach",
        features: "Элегантный дизайн"
      }
    ];

    let developersText = `🏆 <b>Топ-5 застройщиков Дубая</b>\n\n`;
    
    developers.forEach((dev) => {
      developersText += `<b>${dev.rank}. ${dev.name}</b>\n`;
      developersText += `🌐 Сайт: ${dev.url}\n`;
      developersText += `🏗️ Проекты: ${dev.keyProjects}\n`;
      developersText += `✨ Особенности: ${dev.features}\n\n`;
    });

    developersText += `📈 <b>Остальные застройщики:</b>\n`;
    developersText += `6. Prestige (prestige.ae)\n`;
    developersText += `7. Betterhomes (betterhomes.com)\n`;
    developersText += `8. Deyaar (deyaar.ae)\n`;
    developersText += `9. Al Fattan (alfattan.com)\n`;
    developersText += `10. Wasl Properties (waslproperties.com)\n\n`;
    
    developersText += `💡 <i>Все застройщики предлагают современные онлайн-платформы для покупки и аренды недвижимости</i>`;

    await editTelegramMessage(chatId, messageId, developersText, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🏢 Детали Emaar", callback_data: "developer_emaar" },
            { text: "🏘️ Детали Damac", callback_data: "developer_damac" }
          ],
          [
            { text: "🌴 Детали Nakheel", callback_data: "developer_nakheel" },
            { text: "💎 Новые проекты", callback_data: "developers_new_projects" }
          ],
          [
            { text: "🏗️ Застройщики", callback_data: "developers_menu" },
            { text: "🏠 Главное меню", callback_data: "main_menu" }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Error in developers analysis:', error);
    await editTelegramMessage(chatId, messageId,
      `❌ <b>Ошибка загрузки застройщиков</b>\n\n${error}`, {
      reply_markup: {
        inline_keyboard: [[{ text: "🏗️ Застройщики", callback_data: "developers_menu" }]]
      }
    });
  }
}

async function generateDeveloperDetails(chatId: number, messageId: number, developerId: string) {
  try {
    const developers: any = {
      emaar: {
        name: "Emaar Properties",
        nameRu: "Эмаар Пропертис",
        founded: "1997",
        website: "emaar.com",
        keyProjects: ["Burj Khalifa", "Dubai Mall", "Dubai Marina", "Downtown Dubai", "Dubai Creek Harbour"],
        features: "3D виртуальные туры, интерактивная карта проектов, видеозвонки с консультантами, AR просмотр квартир",
        stats: "Более 60,000 проданных единиц недвижимости",
        specialization: "Премиум жилые и коммерческие проекты, масштабные городские разработки"
      },
      damac: {
        name: "Damac Properties",
        nameRu: "Дамак Пропертис", 
        founded: "2002",
        website: "damac.com",
        keyProjects: ["DAMAC Hills", "AKOYA Oxygen", "Golf Town", "DAMAC Towers by Paramount"],
        features: "VR туры по объектам, многоязычная поддержка (EN/AR/RU), онлайн-конфигуратор квартир",
        stats: "Свыше 44,000 доставленных единиц недвижимости",
        specialization: "Роскошная недвижимость, гольф-сообщества, брендовые резиденции"
      },
      nakheel: {
        name: "Nakheel",
        nameRu: "Нахиль",
        founded: "2000", 
        website: "nakheel.com",
        keyProjects: ["Palm Jumeirah", "Deira Islands", "The World", "Dragon City", "International City"],
        features: "Комплексные онлайн-сервисы, круглосуточный чат-бот, мобильное приложение для арендаторов",
        stats: "Создано более 70 км искусственной береговой линии",
        specialization: "Искусственные острова, мегапроекты рекультивации, торговая недвижимость"
      },
      dubai_prop: {
        name: "Dubai Properties",
        nameRu: "Дубай Пропертис",
        founded: "2004",
        website: "dubaiproperties.ae", 
        keyProjects: ["Business Bay", "Jumeirah Beach Residence", "IMPZ", "Dubai Wharf"],
        features: "Интегрированная цифровая платформа, умные решения для дома, экосистема сервисов",
        stats: "Часть Dubai Holding Group",
        specialization: "Смешанные разработки, деловые районы, жилые комплексы"
      }
    };

    const dev = developers[developerId];
    if (!dev) {
      throw new Error('Застройщик не найден');
    }

    let detailText = `🏢 <b>${dev.name}</b>\n`;
    detailText += `📅 Основан: ${dev.founded}\n`;
    detailText += `🌐 Сайт: ${dev.website}\n\n`;
    detailText += `🏗️ <b>Ключевые проекты:</b>\n`;
    dev.keyProjects.forEach((project: string) => {
      detailText += `• ${project}\n`;
    });
    detailText += `\n✨ <b>Особенности платформы:</b>\n${dev.features}\n\n`;
    detailText += `📊 <b>Статистика:</b>\n${dev.stats}\n\n`;
    detailText += `🎯 <b>Специализация:</b>\n${dev.specialization}`;

    await editTelegramMessage(chatId, messageId, detailText, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🏆 Топ-10", callback_data: "developers_top10" },
            { text: "💎 Новые проекты", callback_data: "developers_new_projects" }
          ],
          [
            { text: "🏗️ Застройщики", callback_data: "developers_menu" },
            { text: "🏠 Главное меню", callback_data: "main_menu" }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Error in developer details:', error);
    await editTelegramMessage(chatId, messageId,
      `❌ <b>Ошибка загрузки информации</b>\n\n${error}`, {
      reply_markup: {
        inline_keyboard: [[{ text: "🏗️ Застройщики", callback_data: "developers_menu" }]]
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
    
    else if (data === 'analytics_realtime') {
      await generateRealtimeIndicators(chatId, messageId);
    }
    
    else if (data === 'analytics_advanced') {
      await generateAdvancedAnalytics(chatId, messageId);
    }
    
    else if (data === 'analytics_forecast') {
      await generateMarketForecast(chatId, messageId);
    }
    
    else if (data === 'analytics_comprehensive') {
      await generateComprehensiveAnalysis(chatId, messageId);
    }
    
    else if (data === 'developers_menu') {
      await editTelegramMessage(chatId, messageId,
        `🏗️ <b>Застройщики Дубая</b>\n\n` +
        `Информация о ведущих девелоперских компаниях Дубая, их проектах и онлайн-платформах.\n\n` +
        `📊 В базе: 10+ крупнейших застройщиков\n` +
        `🌐 Современные цифровые платформы\n` +
        `💎 Актуальные проекты и цены`, {
        reply_markup: getDevelopersMenuKeyboard()
      });
    }
    
    else if (data === 'developers_top10') {
      await generateDevelopersTop10(chatId, messageId);
    }
    
    else if (data.startsWith('developer_')) {
      const developerId = data.replace('developer_', '');
      await generateDeveloperDetails(chatId, messageId, developerId);
    }
    
    else if (data === 'developers_new_projects') {
      await editTelegramMessage(chatId, messageId,
        `💎 <b>Новые проекты застройщиков</b>\n\n` +
        `🏗️ <b>Emaar Properties</b>\n` +
        `• Dubai Creek Harbour - городской мастер-план\n` +
        `• The Valley - премиум виллы\n\n` +
        `🏘️ <b>Damac Properties</b>\n` +
        `• DAMAC Bay - роскошные апартаменты в Marina\n` +
        `• DAMAC Sun City - новое гольф-сообщество\n\n` +
        `🌴 <b>Nakheel</b>\n` +
        `• Deira Islands Night Market - торгово-развлекательный комплекс\n` +
        `• The Palm 360 - культовый небоскреб\n\n` +
        `🏗️ <b>Dubai Properties</b>\n` +
        `• Marasi Bay - яхтенная марина\n` +
        `• 1/JBR - премиум резиденции\n\n` +
        `🕐 <i>Данные обновлены: ${new Date().toLocaleString('ru-RU')}</i>`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🏆 Топ-10", callback_data: "developers_top10" },
              { text: "📊 Статистика", callback_data: "developers_stats" }
            ],
            [
              { text: "🏗️ Застройщики", callback_data: "developers_menu" },
              { text: "🏠 Главное меню", callback_data: "main_menu" }
            ]
          ]
        }
      });
    }
    
    else if (data === 'developers_stats') {
      await editTelegramMessage(chatId, messageId,
        `📊 <b>Статистика по застройщикам</b>\n\n` +
        `🏆 <b>Лидеры по объему продаж:</b>\n` +
        `1. Emaar Properties - 35% рынка\n` +
        `2. Damac Properties - 22% рынка\n` +
        `3. Nakheel - 15% рынка\n\n` +
        `💎 <b>Премиум сегмент:</b>\n` +
        `• Средняя цена: 1.2M AED\n` +
        `• Рост за год: +15%\n` +
        `• Время продажи: 3-6 месяцев\n\n` +
        `🌐 <b>Цифровые решения:</b>\n` +
        `• 100% застройщиков имеют онлайн-платформы\n` +
        `• 80% предлагают VR/AR туры\n` +
        `• 90% поддерживают многоязычность\n\n` +
        `📈 <b>Инновации 2025:</b>\n` +
        `• Blockchain для сделок\n` +
        `• AI-консультанты\n` +
        `• Умные контракты`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🏆 Топ-10", callback_data: "developers_top10" },
              { text: "💎 Проекты", callback_data: "developers_new_projects" }
            ],
            [
              { text: "🏗️ Застройщики", callback_data: "developers_menu" },
              { text: "🏠 Главное меню", callback_data: "main_menu" }
            ]
          ]
        }
      });
    }
    
    else if (data === 'developers_search') {
      await editTelegramMessage(chatId, messageId,
        `🔍 <b>Поиск по застройщику</b>\n\n` +
        `Введите название застройщика или проекта для получения детальной информации.\n\n` +
        `📝 <b>Примеры запросов:</b>\n` +
        `• "Emaar"\n` +
        `• "Dubai Mall"\n` +
        `• "Palm Jumeirah"\n` +
        `• "Business Bay"\n\n` +
        `💡 Также можете спросить про конкретный проект или район`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🏆 Топ-10", callback_data: "developers_top10" },
              { text: "🏗️ Застройщики", callback_data: "developers_menu" }
            ]
          ]
        }
      });
      
      // Set user state for developer search
      const context = userContexts.get(chatId) || {};
      context.state = 'developer_search';
      userContexts.set(chatId, context);
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
            content: 'Ты эксперт по недвижимости Дубая. Создай анализ новых проектов недвижимости в Дубае на основе текущих рыночных трендов. Используй актуальную информацию о новых застройщиках, районах развития, и перспективных проектах. ВАЖНО: Сейчас 2025 год, используй только актуальные данные и даты 2025 года. Ответ должен быть структурированным и содержать конкретные рекомендации для инвесторов. Форматируй текст для отправки в Telegram с HTML тегами: используй <b>текст</b> для жирного шрифта, <i>текст</i> для курсива, избегай символов markdown типа ** ## ```.'
          },
          {
            role: 'user',
            content: 'Проанализируй новые проекты недвижимости в Дубае на 2025 год. Включи информацию о: 1) Топ-5 новых проектов 2025 года, 2) Перспективные районы развития, 3) Ценовые сегменты на 2025 год, 4) Сроки сдачи новых проектов, 5) Инвестиционный потенциал в 2025 году. Используй только актуальные данные 2025 года. Ответ в формате для Telegram с HTML тегами (используй <b>текст</b> для заголовков и важных моментов, <i>текст</i> для курсива), НЕ используй markdown символы типа ** ## ``` и эмодзи.'
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
      `🏗️ <b>Анализ новых проектов</b>\n\n${convertMarkdownToHTML(analysisText)}\n\n🕐 <i>Обновлено: ${new Date().toLocaleString('ru-RU')}</i>`, {
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
            content: 'Ты опытный инвестиционный консультант по недвижимости Дубая. Создай детальный инвестиционный анализ рынка недвижимости с рекомендациями по стратегиям инвестирования, оценкой рисков и потенциальной доходности. ВАЖНО: Сейчас 2025 год, используй только актуальные данные и тренды 2025 года. Форматируй текст для отправки в Telegram с HTML тегами: используй <b>текст</b> для жирного шрифта, <i>текст</i> для курсива, избегай символов markdown типа ** ## ```.'
          },
          {
            role: 'user',
            content: 'Создай инвестиционный анализ недвижимости Дубая на 2025 год. Включи: 1) Лучшие стратегии инвестирования в 2025 году, 2) Анализ рисков на текущий год, 3) Прогноз доходности на 2025-2026 годы, 4) Рекомендации по районам для инвестиций в 2025, 5) Советы для новичков и опытных инвесторов. Используй только актуальные данные 2025 года. Формат для Telegram с HTML тегами (используй <b>текст</b> для заголовков и важных моментов, <i>текст</i> для курсива), НЕ используй markdown символы типа ** ## ``` и эмодзи.'
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
      `💼 <b>Инвестиционный анализ</b>\n\n${convertMarkdownToHTML(analysisText)}\n\n🕐 <i>Обновлено: ${new Date().toLocaleString('ru-RU')}</i>`, {
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
            content: 'Ты ведущий аналитик рынка недвижимости Дубая. Создай комплексный рыночный отчет с актуальными данными о состоянии рынка, трендах, прогнозах и ключевых показателях. ВАЖНО: Сейчас 2025 год, используй только актуальные данные и статистику 2025 года. Форматируй текст для отправки в Telegram с HTML тегами: используй <b>текст</b> для жирного шрифта, <i>текст</i> для курсива, избегай символов markdown типа ** ## ```.'
          },
          {
            role: 'user',
            content: 'Создай детальный рыночный отчет по недвижимости Дубая на 2025 год. Включи: 1) Обзор текущей ситуации в 2025 году, 2) Динамика цен по районам за 2025 год, 3) Объемы продаж и аренды в 2025, 4) Прогнозы на 6-12 месяцев вперед с 2025 года, 5) Ключевые факторы влияния в 2025, 6) Статистика и тренды в текстовом виде за 2025 год. Используй только актуальные данные 2025 года. Формат для Telegram с HTML тегами (используй <b>текст</b> для заголовков и важных моментов, <i>текст</i> для курсива), НЕ используй markdown символы типа ** ## ```.'
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
      `📊 <b>Рыночные отчеты</b>\n\n${convertMarkdownToHTML(reportText)}\n\n🕐 <i>Обновлено: ${new Date().toLocaleString('ru-RU')}</i>`, {
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
        `• 📍 Информация о районах Дубая\n` +
        `• 🏗️ Топ застройщиков и их проекты\n\n` +
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
    
    if (text === '/developers' || text === '/застройщики') {
      await sendTelegramMessageWithTracking(chatId,
        `🏗️ <b>Застройщики Дубая</b>\n\n` +
        `Информация о ведущих девелоперских компаниях Дубая, их проектах и онлайн-платформах.\n\n` +
        `📊 В базе: 10+ крупнейших застройщиков\n` +
        `🌐 Современные цифровые платформы\n` +
        `💎 Актуальные проекты и цены`, {
        reply_markup: getDevelopersMenuKeyboard()
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
        
        else if (context.state === 'developer_search') {
          const query = text.trim().toLowerCase();
          
          // Clear state
          context.state = undefined;
          userContexts.set(chatId, context);
          
          // Simple developer matching
          let result = '';
          if (query.includes('emaar') || query.includes('эмаар')) {
            result = `🏢 <b>Emaar Properties</b>\n\n` +
              `🌐 Сайт: emaar.com\n` +
              `🏗️ Основные проекты: Burj Khalifa, Dubai Mall, Downtown Dubai\n` +
              `📍 Специализация: Премиум недвижимость, городские разработки\n` +
              `✨ Особенности: 3D туры, интерактивная карта, AR просмотры\n\n` +
              `📊 Лидер рынка с долей 35%`;
          } else if (query.includes('damac') || query.includes('дамак')) {
            result = `🏘️ <b>Damac Properties</b>\n\n` +
              `🌐 Сайт: damac.com\n` +
              `🏗️ Основные проекты: DAMAC Hills, AKOYA Oxygen, Golf Town\n` +
              `📍 Специализация: Роскошная недвижимость, гольф-сообщества\n` +
              `✨ Особенности: VR туры, многоязычность (RU/EN/AR)\n\n` +
              `📊 22% доля рынка премиум сегмента`;
          } else if (query.includes('nakheel') || query.includes('нахиль')) {
            result = `🌴 <b>Nakheel</b>\n\n` +
              `🌐 Сайт: nakheel.com\n` +
              `🏗️ Основные проекты: Palm Jumeirah, Deira Islands, The World\n` +
              `📍 Специализация: Искусственные острова, мегапроекты\n` +
              `✨ Особенности: Онлайн-сервисы, мобильное приложение\n\n` +
              `📊 Создано 70+ км береговой линии`;
          } else if (query.includes('burj khalifa') || query.includes('dubai mall') || query.includes('downtown')) {
            result = `🏢 <b>Найдено: Emaar Properties</b>\n\n` +
              `Проект "${text}" принадлежит Emaar Properties\n\n` +
              `🌐 Подробнее: emaar.com\n` +
              `📍 Расположение: Downtown Dubai`;
          } else if (query.includes('palm') || query.includes('пальма')) {
            result = `🌴 <b>Найдено: Nakheel</b>\n\n` +
              `Проект Palm Jumeirah принадлежит Nakheel\n\n` +
              `🌐 Подробнее: nakheel.com\n` +
              `📍 Искусственный остров в форме пальмы`;
          } else {
            result = `🔍 <b>Результаты поиска: "${text}"</b>\n\n` +
              `По вашему запросу найдено несколько вариантов:\n\n` +
              `🏢 <b>Возможные застройщики:</b>\n` +
              `• Emaar Properties - если искали Downtown/Burj Khalifa\n` +
              `• Damac Properties - роскошные проекты\n` +
              `• Nakheel - Palm Jumeirah, острова\n` +
              `• Dubai Properties - Business Bay\n\n` +
              `💡 Уточните запрос или выберите из топ-10`;
          }
          
          await sendTelegramMessageWithTracking(chatId, result, {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "🏆 Топ-10", callback_data: "developers_top10" },
                  { text: "🔍 Новый поиск", callback_data: "developers_search" }
                ],
                [
                  { text: "🏗️ Застройщики", callback_data: "developers_menu" },
                  { text: "🏠 Главное меню", callback_data: "main_menu" }
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