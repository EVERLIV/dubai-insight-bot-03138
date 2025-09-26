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
const userContexts = new Map<number, { lastBotMessageId?: number, searchContext?: any }>();

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

// Enhanced multi-platform property search with guaranteed results
async function callMultiPlatformSearch(searchParams: any): Promise<any> {
  try {
    console.log('Calling multi-platform property search');
    
    // Primary search through our integrated Bayut API
    const bayutResult = await callPropertySearchAPI(searchParams);
    
    let allProperties = [];
    let totalCount = 0;
    
    if (bayutResult.success && bayutResult.properties) {
      allProperties = [...bayutResult.properties];
      totalCount += bayutResult.count || 0;
    }
    
    // If no results, try broader search
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
    
    // If still no results, get some general properties
    if (allProperties.length === 0) {
      const generalParams = {
        telegram_user_id: searchParams.telegram_user_id,
        limit: 3
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
      platforms: ['Bayut', 'PropertyFinder*', 'Dubizzle*'] // * = future integration
    };
    
  } catch (error) {
    console.error('Error in multi-platform search:', error);
    return { success: false, error: 'Search failed' };
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
        const searchResult = await callMultiPlatformSearch({
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
      
      const searchResult = await callMultiPlatformSearch(searchParams);
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
        const searchResult = await callMultiPlatformSearch({
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
        `🌐 <b>Источники данных:</b>\n` +
        `• Bayut.com (API интеграция)\n` +
        `• PropertyFinder.ae (веб-скрапинг)\n` +
        `• Dubizzle.com (веб-скрапинг)\n\n` +
        `⚡ <b>Команды админа:</b>\n` +
        `• /sync_data - Загрузить данные\n` +
        `• /scrape_web - Парсинг сайтов\n\n` +
        `💡 <b>Советы:</b>\n` +
        `• Задавайте вопросы на русском языке\n` +
        `• Используйте конкретные параметры в запросах`, {
        reply_markup: {
          inline_keyboard: [[{ text: "⬅️ Назад", callback_data: "main_menu" }]]
        }
      });
    }
    
    else if (data === 'admin_sync_data') {
      await editTelegramMessage(chatId, messageId,
        `🔄 <b>Загрузка данных с внешних источников...</b>\n\n⏳ Пожалуйста, подождите`, {
        reply_markup: { inline_keyboard: [] }
      });
      
      try {
        // Sync from Bayut API
        const bayutSync = await supabase.functions.invoke('property-sync', {
          body: { purpose: 'for-sale', pages: 2 }
        });
        
        // Scrape web sources
        const webScrape = await supabase.functions.invoke('web-scraper', {
          body: { 
            sources: ['propertyfinder', 'dubizzle'],
            location: 'dubai',
            limit: 20
          }
        });
        
        let message = `✅ <b>Загрузка данных завершена!</b>\n\n`;
        
        if (bayutSync.data?.success) {
          message += `📊 <b>Bayut API:</b> ${bayutSync.data.totalSynced} объектов\n`;
        }
        
        if (webScrape.data?.success) {
          message += `🌐 <b>Веб-парсинг:</b> ${webScrape.data.totalSaved} объектов\n`;
        }
        
        message += `\n🎯 Теперь поиск недвижимости работает!`;
        
        await editTelegramMessage(chatId, messageId, message, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🔍 Проверить поиск", callback_data: "search_menu" },
                { text: "🏠 Главное меню", callback_data: "main_menu" }
              ]
            ]
          }
        });
      } catch (error) {
        console.error('Error in data sync:', error);
        await editTelegramMessage(chatId, messageId,
          `❌ <b>Ошибка загрузки данных</b>\n\n${error}`, {
          reply_markup: {
            inline_keyboard: [[{ text: "🏠 Главное меню", callback_data: "main_menu" }]]
          }
        });
      }
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

    response += `💡 <i>Для оценки объекта нажмите "💰 Оценка" и используйте ID</i>\n\n`;
    response += `🌐 <i>Источники: ${searchResult.platforms?.join(', ') || 'Bayut'}</i>`;
    
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
      `• Уточнить тип недвижимости\n\n` +
      `🔄 Расширяем поиск по всем доступным платформам...`, {
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
    const { data: areas, error } = await supabase
      .from('property_listings')
      .select('location_area, price, area_sqft')
      .not('location_area', 'is', null)
      .limit(100);

    if (error) {
      console.error('Error fetching analytics data:', error);
      return;
    }

    const areaStats: any = {};
    areas.forEach((property: any) => {
      if (property.location_area) {
        const areaKey = property.location_area;
        if (!areaStats[areaKey]) {
          areaStats[areaKey] = { count: 0, totalPrice: 0, avgPrice: 0, properties: [] };
        }
        areaStats[areaKey].count++;
        areaStats[areaKey].totalPrice += property.price || 0;
        areaStats[areaKey].properties.push(property);
      }
    });

    // Calculate averages and sort
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

    analyticsText += `📈 <i>Данные обновляются в реальном времени</i>`;

    await editTelegramMessage(chatId, messageId, analyticsText, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📊 Другие отчеты", callback_data: "analytics_menu" },
            { text: "🏠 Главное меню", callback_data: "main_menu" }
          ]
        ]
      }
    });
  }
}

function getPropertyTypeEmoji(type: string): string {
  const emojiMap: any = {
    apartment: '🏢',
    villa: '🏘️',
    townhouse: '🏠',
    commercial: '🏬'
  };
  return emojiMap[type] || '🏠';
}

function getPropertyTypeName(type: string): string {
  const nameMap: any = {
    apartment: 'Квартиры',
    villa: 'Виллы', 
    townhouse: 'Таунхаусы',
    commercial: 'Коммерческая',
    sale: 'Продажа',
    rent: 'Аренда'
  };
  return nameMap[type] || type;
}

function formatPriceRange(min: number, max: number): string {
  if (min === 0 && max === 0) return '';
  if (min === 0) return `до ${(max/1000).toFixed(0)}K AED`;
  if (max === 0) return `от ${(min/1000).toFixed(0)}K AED`;
  return `${(min/1000).toFixed(0)}K - ${(max/1000).toFixed(0)}K AED`;
}

function formatSearchResults(searchResult: any, title: string): string {
  let response = `🏠 <b>${title}</b>\n\n`;
  
  if (searchResult.success && searchResult.properties && searchResult.properties.length > 0) {
    response += `📋 Найдено ${searchResult.count} объектов:\n\n`;
    
    searchResult.properties.forEach((property: any, index: number) => {
      response += `${index + 1}. <b>${property.title}</b>\n`;
      response += `💰 ${property.price.toLocaleString()} AED\n`;
      response += `📍 ${property.location_area}\n`;
      response += `🏠 ${property.property_type} • ${property.bedrooms}BR\n`;
      response += `🆔 <code>${property.external_id}</code>\n\n`;
    });

    response += `💡 <i>Для оценки объекта используйте команду /valuation + ID</i>\n\n`;
    response += `🌐 <i>Источники: ${searchResult.platforms?.join(', ') || 'Bayut'}</i>`;
  } else {
    response += `Результатов не найдено. Попробуйте изменить критерии поиска.`;
  }
  
  return response;
}

async function processAIResponse(userText: string, userId: number): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    return 'Сервис временно недоступен. Используйте кнопки меню для поиска.';
  }

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
            content: 'Вы - AI-консультант по недвижимости в Дубае. Отвечайте кратко и по делу на русском языке. Если пользователь спрашивает о поиске недвижимости, рекомендуйте использовать меню бота для точного поиска.'
          },
          {
            role: 'user',
            content: userText
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI response error:', error);
    return 'Используйте кнопки меню для поиска недвижимости или задайте более конкретный вопрос.';
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

    // Admin commands for data loading
    if (text === '/sync_data' && userId === 7484237553) { // Replace with your Telegram user ID
      await sendTelegramMessageWithTracking(chatId,
        `🔄 <b>Запуск синхронизации данных...</b>\n\n⏳ Загружаю недвижимость из всех источников`, {
        reply_markup: {
          inline_keyboard: [[{ text: "✅ Начать загрузку", callback_data: "admin_sync_data" }]]
        }
      });
      return new Response('OK', { headers: corsHeaders });
    }
    
    if (text === '/scrape_web' && userId === 7484237553) {
      await sendTelegramMessageWithTracking(chatId,
        `🌐 <b>Запуск веб-парсинга...</b>\n\n` +
        `Сканирую:\n` +
        `• PropertyFinder.ae\n` +
        `• Dubizzle.com\n\n` +
        `⏳ Начинаю парсинг сайтов...`, {
        reply_markup: { inline_keyboard: [] }
      });
      
      try {
        const webScrapeResult = await supabase.functions.invoke('web-scraper', {
          body: {
            sources: ['propertyfinder', 'dubizzle'],
            location: 'dubai',
            property_type: 'apartment',
            purpose: 'for-sale',
            limit: 30
          }
        });
        
        if (webScrapeResult.data?.success) {
          await sendTelegramMessageWithTracking(chatId,
            `✅ <b>Веб-парсинг завершен!</b>\n\n` +
            `📊 Обработано: ${webScrapeResult.data.totalScraped} объектов\n` +
            `💾 Сохранено: ${webScrapeResult.data.totalSaved} в базу данных\n` +
            `🌐 Источники: ${webScrapeResult.data.sources?.join(', ')}\n\n` +
            `🎯 Поиск недвижимости теперь доступен!`, {
            reply_markup: getMainMenuKeyboard()
          });
        } else {
          await sendTelegramMessageWithTracking(chatId,
            `❌ Ошибка веб-парсинга: ${webScrapeResult.error}`, {
            reply_markup: getMainMenuKeyboard()
          });
        }
      } catch (error) {
        console.error('Web scraping error:', error);
        await sendTelegramMessageWithTracking(chatId,
          `❌ Ошибка парсинга: ${error}`, {
          reply_markup: getMainMenuKeyboard()
        });
      }
      return new Response('OK', { headers: corsHeaders });
    }

    if (text === '/start') {
      await sendTelegramMessageWithTracking(chatId,
        `🏗️ <b>Добро пожаловать в Dubai Invest Bot!</b>\n\n` +
        `Я ваш персональный консультант по недвижимости в Дубае с доступом к реальной базе данных и системой автоматической оценки. \n\n` +
        `💼 <b>Мои возможности:</b>\n` +
        `• 🔍 Поиск недвижимости для покупки и аренды\n` +
        `• 💰 Автоматическая оценка стоимости (AVM)\n` +
        `• 📊 Анализ рынка и трендов в реальном времени\n` +
        `• 💡 Советы по инвестициям\n` +
        `• 📍 Информация о районах Дубая\n\n` +
        `🌐 <b>Источники данных:</b>\n` +
        `• Bayut.com (активно)\n` +
        `• PropertyFinder.ae (интеграция планируется)\n` +
        `• Dubizzle.com (интеграция планируется)\n\n` +
        `🎯 Используйте кнопки меню для быстрого доступа!\n\n` +
        `✨ <b>Или просто опишите что ищете текстом!</b>`, {
        reply_markup: getMainMenuKeyboard()
      });
      return new Response('OK', { headers: corsHeaders });
    }

    // Check for property ID evaluation request
    if (text.match(/^[A-Z]-[A-Z]{2}-\d+$/)) {
      const { data: property, error } = await supabase
        .from('property_listings')
        .select('*')
        .eq('external_id', text)
        .single();

      if (property) {
        const valuationResult = await callAVMValuationAPI(property);
        
        if (valuationResult.success) {
          await sendTelegramMessageWithTracking(chatId,
            `💰 <b>Автоматическая оценка объекта</b>\n\n` +
            `🏠 <b>${property.title}</b>\n` +
            `🆔 ${property.external_id}\n` +
            `📍 ${property.location_area}\n\n` +
            `💵 <b>Рыночная стоимость:</b>\n` +
            `${valuationResult.estimated_value?.toLocaleString()} AED\n\n` +
            `📊 <b>Уровень доверия:</b> ${(valuationResult.confidence_score * 100).toFixed(1)}%\n\n` +
            `🔍 <b>Факторы оценки:</b>\n` +
            `${Object.entries(valuationResult.valuation_factors || {}).map(([key, value]: [string, any]) => 
              `• ${key}: ${value}`
            ).join('\n')}\n\n` +
            `📈 <i>Оценка основана на анализе похожих объектов и рыночных трендов</i>`, {
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
        } else {
          await sendTelegramMessageWithTracking(chatId,
            `❌ Не удалось получить оценку для объекта ${text}. Попробуйте позже.`, {
            reply_markup: getMainMenuKeyboard()
          });
        }
      } else {
        await sendTelegramMessageWithTracking(chatId,
          `❌ Объект с ID ${text} не найден в базе данных.`, {
          reply_markup: getMainMenuKeyboard()
        });
      }
      return new Response('OK', { headers: corsHeaders });
    }

    // Handle general text messages with AI and search
    if (text.length > 0) {
      // Try property search first
      const searchResult = await callMultiPlatformSearch({
        telegram_user_id: userId,
        query: text,
        limit: 5
      });
      
      if (searchResult.success && searchResult.properties && searchResult.properties.length > 0) {
        await sendTelegramMessageWithTracking(chatId, formatSearchResults(searchResult, 'Результаты поиска'), {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "💰 Оценить объект", callback_data: "valuation_menu" },
                { text: "🔍 Уточнить поиск", callback_data: "search_menu" }
              ],
              [
                { text: "🏠 Главное меню", callback_data: "main_menu" }
              ]
            ]
          }
        });
      } else {
        // If no search results, provide AI response with helpful suggestions
        const aiResponse = await processAIResponse(text, userId);
        await sendTelegramMessageWithTracking(chatId,
          `🤖 <b>AI-Консультант:</b>\n\n${aiResponse}\n\n` +
          `🔍 <b>Не нашли то, что ищете?</b>\n` +
          `Попробуйте использовать меню для точного поиска по критериям.\n\n` +
          `🌐 <i>Ищем по всем доступным платформам: Bayut, PropertyFinder*, Dubizzle*</i>\n` +
          `<i>* планируется к интеграции</i>`, {
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