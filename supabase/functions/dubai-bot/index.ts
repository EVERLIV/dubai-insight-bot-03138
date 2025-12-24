import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
// Updated: 2025-12-24 - Improved search UX with step-by-step viewing and AI price analysis

const TELEGRAM_BOT_TOKEN = Deno.env.get('DUBAI_TELEGRAM_BOT_TOKEN');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
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
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<i>$1</i>')
    .replace(/(?<!_)_([^_]+)_(?!_)/g, '<i>$1</i>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>')
    .replace(/^### (.+)$/gm, '<b>$1</b>')
    .replace(/^## (.+)$/gm, '<b>$1</b>')
    .replace(/^# (.+)$/gm, '<b>$1</b>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\d+\.\s+/gm, '• ');
}

// User context for tracking search state and pagination
interface UserContext {
  lastBotMessageId?: number;
  state?: string;
  searchFilters?: {
    purpose?: string;
    property_type?: string;
    housing_status?: string;
    location?: string;
    min_bedrooms?: number;
    max_bedrooms?: number;
  };
  searchResults?: any[];
  currentPropertyIndex?: number;
  totalCount?: number;
  roiData?: {
    propertyPrice?: number;
    monthlyRent?: number;
    area?: string;
    propertyType?: string;
  };
}

const userContexts = new Map<number, UserContext>();

// ============= TELEGRAM API FUNCTIONS =============

async function sendTelegramMessage(chatId: number, text: string, options: any = {}) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
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

async function sendTelegramPhoto(chatId: number, photoUrl: string, caption: string, options: any = {}) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption: caption,
      parse_mode: 'HTML',
      ...options
    }),
  });

  return response.json();
}

async function sendTelegramMediaGroup(chatId: number, media: any[]) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMediaGroup`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      media: media
    }),
  });

  return response.json();
}

async function deleteTelegramMessage(chatId: number, messageId: number) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`;
  
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId
      }),
    });
  } catch (error) {
    console.log('Could not delete message:', messageId);
  }
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text || '',
      show_alert: false
    }),
  });
}

// ============= DATABASE FUNCTIONS =============

// Get real districts from database
async function getRealDistricts(): Promise<{ district: string; count: number }[]> {
  try {
    const { data, error } = await supabase
      .from('property_listings')
      .select('location_area')
      .not('location_area', 'is', null);
    
    if (error) {
      console.error('Error fetching districts:', error);
      return [];
    }

    // Count properties per district
    const districtCounts: { [key: string]: number } = {};
    data.forEach((row: any) => {
      const district = row.location_area;
      if (district) {
        districtCounts[district] = (districtCounts[district] || 0) + 1;
      }
    });

    return Object.entries(districtCounts)
      .map(([district, count]) => ({ district, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error in getRealDistricts:', error);
    return [];
  }
}

// Count properties with current filters
async function countPropertiesWithFilters(filters: any): Promise<number> {
  try {
    let query = supabase.from('property_listings').select('id', { count: 'exact', head: true });
    
    if (filters.purpose) {
      query = query.eq('purpose', filters.purpose);
    }
    if (filters.property_type) {
      query = query.ilike('property_type', `%${filters.property_type}%`);
    }
    if (filters.housing_status) {
      query = query.eq('housing_status', filters.housing_status);
    }
    if (filters.location) {
      query = query.ilike('location_area', `%${filters.location}%`);
    }
    if (filters.min_bedrooms !== undefined) {
      query = query.gte('bedrooms', filters.min_bedrooms);
    }
    if (filters.max_bedrooms !== undefined) {
      query = query.lte('bedrooms', filters.max_bedrooms);
    }

    const { count, error } = await query;
    
    if (error) {
      console.error('Error counting properties:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in countPropertiesWithFilters:', error);
    return 0;
  }
}

// Search properties with filters
async function searchPropertiesWithFilters(filters: any, limit: number = 50): Promise<any[]> {
  try {
    let query = supabase.from('property_listings').select('*');
    
    if (filters.purpose) {
      query = query.eq('purpose', filters.purpose);
    }
    if (filters.property_type) {
      query = query.ilike('property_type', `%${filters.property_type}%`);
    }
    if (filters.housing_status) {
      query = query.eq('housing_status', filters.housing_status);
    }
    if (filters.location) {
      query = query.ilike('location_area', `%${filters.location}%`);
    }
    if (filters.min_bedrooms !== undefined) {
      query = query.gte('bedrooms', filters.min_bedrooms);
    }
    if (filters.max_bedrooms !== undefined) {
      query = query.lte('bedrooms', filters.max_bedrooms);
    }

    // Prioritize properties with images
    query = query.order('created_at', { ascending: false }).limit(limit);

    const { data, error } = await query;
    
    if (error) {
      console.error('Error searching properties:', error);
      return [];
    }

    // Sort: properties with images first
    const sorted = (data || []).sort((a: any, b: any) => {
      const aHasImages = a.images && a.images.length > 0;
      const bHasImages = b.images && b.images.length > 0;
      if (aHasImages && !bHasImages) return -1;
      if (!aHasImages && bHasImages) return 1;
      return 0;
    });

    return sorted;
  } catch (error) {
    console.error('Error in searchPropertiesWithFilters:', error);
    return [];
  }
}

// Get average price for district
async function getDistrictAvgPrice(district: string, purpose: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('property_listings')
      .select('price')
      .ilike('location_area', `%${district}%`)
      .eq('purpose', purpose)
      .not('price', 'is', null);
    
    if (error || !data || data.length === 0) return null;
    
    const prices = data.map((p: any) => p.price).filter((p: number) => p > 0);
    if (prices.length === 0) return null;
    
    return prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
  } catch (error) {
    console.error('Error getting district avg price:', error);
    return null;
  }
}

// ============= AI PRICE ANALYSIS =============

async function generatePriceInsight(property: any, avgDistrictPrice: number | null): Promise<string> {
  if (!OPENAI_API_KEY || !avgDistrictPrice || !property.price) {
    // Fallback without AI
    if (avgDistrictPrice && property.price) {
      const diff = ((property.price - avgDistrictPrice) / avgDistrictPrice) * 100;
      if (diff > 10) {
        return `📈 Цена на ${Math.abs(diff).toFixed(0)}% выше средней по району (${avgDistrictPrice.toLocaleString()} AED)`;
      } else if (diff < -10) {
        return `📉 Цена на ${Math.abs(diff).toFixed(0)}% ниже средней по району (${avgDistrictPrice.toLocaleString()} AED) — выгодное предложение!`;
      } else {
        return `⚖️ Цена в рамках рынка по району (±10% от средней ${avgDistrictPrice.toLocaleString()} AED)`;
      }
    }
    return '';
  }

  try {
    const diff = ((property.price - avgDistrictPrice) / avgDistrictPrice) * 100;
    const prompt = `Ты эксперт по недвижимости Дубая. Дай краткий инсайт (2-3 предложения) о цене объекта:
    
Объект: ${property.title}
Цена: ${property.price.toLocaleString()} AED
Район: ${property.location_area}
Средняя цена по району: ${avgDistrictPrice.toLocaleString()} AED
Разница: ${diff > 0 ? '+' : ''}${diff.toFixed(1)}%
Тип: ${property.property_type || 'Квартира'}
Спальни: ${property.bedrooms || 'не указано'}

Объясни почему цена выше/ниже рынка и стоит ли это внимания инвестору. Кратко и по делу.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Ты эксперт по недвижимости Дубая. Отвечай кратко, по-русски, без эмодзи.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content || '';
    
    const emoji = diff > 10 ? '📈' : diff < -10 ? '📉' : '⚖️';
    return `${emoji} <b>AI-анализ цены:</b>\n${insight}`;
  } catch (error) {
    console.error('Error generating price insight:', error);
    // Fallback
    const diff = ((property.price - avgDistrictPrice) / avgDistrictPrice) * 100;
    if (diff > 10) {
      return `📈 Цена на ${Math.abs(diff).toFixed(0)}% выше средней по району`;
    } else if (diff < -10) {
      return `📉 Цена на ${Math.abs(diff).toFixed(0)}% ниже средней — выгодное предложение!`;
    }
    return `⚖️ Цена в рамках рынка по району`;
  }
}

// ============= KEYBOARD GENERATORS =============

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

function getSearchMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🏠 Аренда", callback_data: "filter_purpose_rent" },
        { text: "💰 Покупка", callback_data: "filter_purpose_sale" }
      ],
      [
        { text: "⬅️ Назад", callback_data: "main_menu" }
      ]
    ]
  };
}

function getPropertyTypeKeyboard(purpose: string) {
  return {
    inline_keyboard: [
      [
        { text: "🏢 Квартира", callback_data: `filter_type_${purpose}_apartment` },
        { text: "🏘️ Вилла", callback_data: `filter_type_${purpose}_villa` }
      ],
      [
        { text: "🏠 Таунхаус", callback_data: `filter_type_${purpose}_townhouse` },
        { text: "📦 Студия", callback_data: `filter_type_${purpose}_studio` }
      ],
      [
        { text: "🔍 Любой тип", callback_data: `filter_type_${purpose}_any` }
      ],
      [
        { text: "⬅️ Назад", callback_data: "search_menu" }
      ]
    ]
  };
}

function getBedroomsKeyboard(purpose: string, propertyType: string) {
  const base = `filter_beds_${purpose}_${propertyType}`;
  return {
    inline_keyboard: [
      [
        { text: "🛏️ Студия", callback_data: `${base}_0` },
        { text: "🛏️ 1 спальня", callback_data: `${base}_1` }
      ],
      [
        { text: "🛏️ 2 спальни", callback_data: `${base}_2` },
        { text: "🛏️ 3 спальни", callback_data: `${base}_3` }
      ],
      [
        { text: "🛏️ 4+ спальни", callback_data: `${base}_4` },
        { text: "🔍 Любое кол-во", callback_data: `${base}_any` }
      ],
      [
        { text: "⬅️ Назад", callback_data: `filter_purpose_${purpose === 'rent' ? 'rent' : 'sale'}` }
      ]
    ]
  };
}

async function getDistrictKeyboard(purpose: string, propertyType: string, bedrooms: string): Promise<any> {
  const districts = await getRealDistricts();
  const base = `filter_district_${purpose}_${propertyType}_${bedrooms}`;
  
  // Take top 6 districts with most properties
  const topDistricts = districts.slice(0, 6);
  
  const keyboard: any[][] = [];
  
  // Create rows of 2 buttons each
  for (let i = 0; i < topDistricts.length; i += 2) {
    const row = [];
    row.push({ 
      text: `📍 ${topDistricts[i].district} (${topDistricts[i].count})`, 
      callback_data: `${base}_${encodeURIComponent(topDistricts[i].district).slice(0, 30)}` 
    });
    if (topDistricts[i + 1]) {
      row.push({ 
        text: `📍 ${topDistricts[i + 1].district} (${topDistricts[i + 1].count})`, 
        callback_data: `${base}_${encodeURIComponent(topDistricts[i + 1].district).slice(0, 30)}` 
      });
    }
    keyboard.push(row);
  }
  
  // Add "Any district" and back buttons
  keyboard.push([{ text: "🌍 Любой район", callback_data: `${base}_any` }]);
  keyboard.push([{ text: "⬅️ Назад", callback_data: `filter_type_${purpose}_${propertyType}` }]);
  
  return { inline_keyboard: keyboard };
}

function getStartViewingKeyboard(count: number) {
  return {
    inline_keyboard: [
      [{ text: `🎬 Начать просмотр (${count} вариантов)`, callback_data: "start_viewing" }],
      [{ text: "🔍 Изменить фильтры", callback_data: "search_menu" }],
      [{ text: "🏠 Главное меню", callback_data: "main_menu" }]
    ]
  };
}

function getPropertyViewKeyboard(currentIndex: number, totalCount: number) {
  const buttons: any[][] = [];
  
  if (currentIndex < totalCount - 1) {
    buttons.push([{ text: `➡️ Следующий вариант (${currentIndex + 2}/${totalCount})`, callback_data: "next_property" }]);
  }
  if (currentIndex > 0) {
    buttons.push([{ text: `⬅️ Предыдущий вариант`, callback_data: "prev_property" }]);
  }
  
  buttons.push([
    { text: "🔍 Новый поиск", callback_data: "search_menu" },
    { text: "🏠 Меню", callback_data: "main_menu" }
  ]);
  
  return { inline_keyboard: buttons };
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
        { text: "💎 Новые проекты", callback_data: "developers_new_projects" }
      ],
      [
        { text: "⬅️ Назад", callback_data: "main_menu" }
      ]
    ]
  };
}

// ============= PROPERTY DISPLAY FUNCTIONS =============

async function displayPropertyWithPhotos(chatId: number, property: any, currentIndex: number, totalCount: number) {
  const purpose = property.purpose === 'for-sale' ? 'Продажа' : 'Аренда';
  const avgPrice = await getDistrictAvgPrice(property.location_area, property.purpose);
  const priceInsight = await generatePriceInsight(property, avgPrice);
  
  // Build property description
  let description = `🏢 <b>${property.title}</b>\n\n`;
  description += `💰 <b>Цена:</b> ${property.price?.toLocaleString() || 'По запросу'} AED\n`;
  description += `📍 <b>Район:</b> ${property.location_area || 'Не указан'}\n`;
  description += `🎯 <b>Назначение:</b> ${purpose}\n`;
  
  if (property.property_type) {
    description += `🏠 <b>Тип:</b> ${property.property_type}\n`;
  }
  if (property.bedrooms !== undefined && property.bedrooms !== null) {
    description += `🛏️ <b>Спальни:</b> ${property.bedrooms}\n`;
  }
  if (property.bathrooms) {
    description += `🚿 <b>Ванные:</b> ${property.bathrooms}\n`;
  }
  if (property.area_sqft) {
    description += `📐 <b>Площадь:</b> ${property.area_sqft} кв.ft\n`;
  }
  if (property.housing_status) {
    const statusText = property.housing_status === 'primary' ? 'Первичное' : 'Вторичное';
    description += `🏗️ <b>Рынок:</b> ${statusText}\n`;
  }
  
  description += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  
  // Add AI price insight
  if (priceInsight) {
    description += `\n${priceInsight}\n`;
  }
  
  description += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  description += `\n📋 <b>Объект ${currentIndex + 1} из ${totalCount}</b>`;
  
  if (property.agent_name) {
    description += `\n👨‍💼 Агент: ${property.agent_name}`;
  }
  if (property.agent_phone) {
    description += `\n📞 ${property.agent_phone}`;
  }
  
  description += `\n🆔 <code>${property.id}</code>`;

  // Send photos if available
  const images = property.images || [];
  const validImages = images.filter((img: string) => img && img.startsWith('http')).slice(0, 6);
  
  if (validImages.length > 0) {
    try {
      if (validImages.length === 1) {
        // Single photo with caption
        await sendTelegramPhoto(chatId, validImages[0], description, {
          reply_markup: getPropertyViewKeyboard(currentIndex, totalCount)
        });
      } else {
        // Multiple photos as media group
        const media = validImages.map((url: string, index: number) => ({
          type: 'photo',
          media: url,
          caption: index === 0 ? description : undefined,
          parse_mode: index === 0 ? 'HTML' : undefined
        }));
        
        await sendTelegramMediaGroup(chatId, media);
        
        // Send navigation buttons separately
        await sendTelegramMessage(chatId, `📸 <b>${validImages.length} фото</b> — Объект ${currentIndex + 1}/${totalCount}`, {
          reply_markup: getPropertyViewKeyboard(currentIndex, totalCount)
        });
      }
    } catch (error) {
      console.error('Error sending photos:', error);
      // Fallback to text only
      await sendTelegramMessage(chatId, description + `\n\n⚠️ Фото недоступны`, {
        reply_markup: getPropertyViewKeyboard(currentIndex, totalCount)
      });
    }
  } else {
    // No photos available
    await sendTelegramMessage(chatId, description + `\n\n📷 Фото не загружены`, {
      reply_markup: getPropertyViewKeyboard(currentIndex, totalCount)
    });
  }
}

// ============= CALLBACK HANDLERS =============

async function handleCallbackQuery(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const userId = callbackQuery.from.id;

  console.log('Handling callback query:', data);

  try {
    // Main menu
    if (data === 'main_menu') {
      await editTelegramMessage(chatId, messageId, 
        `🏗️ <b>Dubai Invest Bot - Главное меню</b>\n\nВыберите действие:`, {
        reply_markup: getMainMenuKeyboard()
      });
    }
    
    // Search menu
    else if (data === 'search_menu') {
      // Reset search context
      const context = userContexts.get(chatId) || {};
      context.searchFilters = {};
      context.searchResults = [];
      context.currentPropertyIndex = 0;
      userContexts.set(chatId, context);
      
      await editTelegramMessage(chatId, messageId,
        `🔍 <b>Поиск недвижимости</b>\n\n📊 В базе: реальные объекты из Дубая\n\nВыберите назначение:`, {
        reply_markup: getSearchMenuKeyboard()
      });
    }
    
    // Filter: Purpose
    else if (data === 'filter_purpose_rent') {
      const context = userContexts.get(chatId) || {};
      context.searchFilters = { purpose: 'for-rent' };
      userContexts.set(chatId, context);
      
      await editTelegramMessage(chatId, messageId,
        `🏠 <b>Аренда недвижимости</b>\n\nВыберите тип объекта:`, {
        reply_markup: getPropertyTypeKeyboard('rent')
      });
    }
    
    else if (data === 'filter_purpose_sale') {
      const context = userContexts.get(chatId) || {};
      context.searchFilters = { purpose: 'for-sale' };
      userContexts.set(chatId, context);
      
      await editTelegramMessage(chatId, messageId,
        `💰 <b>Покупка недвижимости</b>\n\nВыберите тип объекта:`, {
        reply_markup: getPropertyTypeKeyboard('sale')
      });
    }
    
    // Filter: Property type
    else if (data.startsWith('filter_type_')) {
      const parts = data.split('_');
      const purpose = parts[2]; // rent or sale
      const propertyType = parts[3]; // apartment, villa, etc.
      
      const context = userContexts.get(chatId) || {};
      context.searchFilters = {
        ...context.searchFilters,
        property_type: propertyType === 'any' ? undefined : propertyType
      };
      userContexts.set(chatId, context);
      
      const typeText = propertyType === 'any' ? 'любого типа' : 
                       propertyType === 'apartment' ? 'квартиры' :
                       propertyType === 'villa' ? 'виллы' :
                       propertyType === 'townhouse' ? 'таунхаусы' :
                       propertyType === 'studio' ? 'студии' : propertyType;
      
      await editTelegramMessage(chatId, messageId,
        `🛏️ <b>Выбрано: ${typeText}</b>\n\nСколько спален?`, {
        reply_markup: getBedroomsKeyboard(purpose, propertyType)
      });
    }
    
    // Filter: Bedrooms
    else if (data.startsWith('filter_beds_')) {
      const parts = data.split('_');
      const purpose = parts[2];
      const propertyType = parts[3];
      const bedrooms = parts[4];
      
      const context = userContexts.get(chatId) || {};
      if (bedrooms !== 'any') {
        const bedroomsNum = parseInt(bedrooms);
        if (bedroomsNum === 4) {
          context.searchFilters = { ...context.searchFilters, min_bedrooms: 4 };
        } else {
          context.searchFilters = { ...context.searchFilters, min_bedrooms: bedroomsNum, max_bedrooms: bedroomsNum };
        }
      }
      userContexts.set(chatId, context);
      
      // Show loading
      await editTelegramMessage(chatId, messageId,
        `📍 <b>Загружаю районы...</b>\n\n⏳ Подождите`, {
        reply_markup: { inline_keyboard: [] }
      });
      
      // Get districts keyboard
      const districtKeyboard = await getDistrictKeyboard(purpose, propertyType, bedrooms);
      
      await editTelegramMessage(chatId, messageId,
        `📍 <b>Выберите район</b>\n\nВ скобках — количество объектов:`, {
        reply_markup: districtKeyboard
      });
    }
    
    // Filter: District and show count
    else if (data.startsWith('filter_district_')) {
      const parts = data.split('_');
      const purpose = parts[2];
      const propertyType = parts[3];
      const bedrooms = parts[4];
      const district = decodeURIComponent(parts.slice(5).join('_'));
      
      const context = userContexts.get(chatId) || {};
      if (district !== 'any') {
        context.searchFilters = { ...context.searchFilters, location: district };
      }
      userContexts.set(chatId, context);
      
      // Show loading
      await editTelegramMessage(chatId, messageId,
        `🔍 <b>Ищу подходящие варианты...</b>\n\n⏳ Подождите`, {
        reply_markup: { inline_keyboard: [] }
      });
      
      // Count matching properties
      const count = await countPropertiesWithFilters(context.searchFilters!);
      context.totalCount = count;
      
      // Get actual properties
      const properties = await searchPropertiesWithFilters(context.searchFilters!, 50);
      context.searchResults = properties;
      context.currentPropertyIndex = 0;
      userContexts.set(chatId, context);
      
      if (count === 0) {
        await editTelegramMessage(chatId, messageId,
          `😔 <b>Ничего не найдено</b>\n\nПо вашим критериям объектов нет.\n\n💡 Попробуйте изменить фильтры.`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔍 Изменить фильтры", callback_data: "search_menu" }],
              [{ text: "🏠 Главное меню", callback_data: "main_menu" }]
            ]
          }
        });
      } else {
        // Build filter summary
        const purposeText = context.searchFilters?.purpose === 'for-sale' ? 'Покупка' : 'Аренда';
        const typeText = context.searchFilters?.property_type || 'Любой тип';
        const bedsText = context.searchFilters?.min_bedrooms !== undefined ? 
          `${context.searchFilters.min_bedrooms}${context.searchFilters.min_bedrooms === 4 ? '+' : ''} спален` : 'Любое кол-во';
        const districtText = context.searchFilters?.location || 'Любой район';
        
        await editTelegramMessage(chatId, messageId,
          `✅ <b>Найдено ${count} вариантов!</b>\n\n` +
          `📋 <b>Ваши фильтры:</b>\n` +
          `• 🎯 ${purposeText}\n` +
          `• 🏠 ${typeText}\n` +
          `• 🛏️ ${bedsText}\n` +
          `• 📍 ${districtText}\n\n` +
          `Нажмите кнопку ниже для пошагового просмотра каждого варианта с фото и AI-анализом цены.`, {
          reply_markup: getStartViewingKeyboard(count)
        });
      }
    }
    
    // Start viewing properties one by one
    else if (data === 'start_viewing') {
      const context = userContexts.get(chatId);
      if (!context || !context.searchResults || context.searchResults.length === 0) {
        await sendTelegramMessage(chatId, '❌ Нет результатов поиска. Начните новый поиск.', {
          reply_markup: getMainMenuKeyboard()
        });
        return;
      }
      
      context.currentPropertyIndex = 0;
      userContexts.set(chatId, context);
      
      // Delete the filter summary message
      try {
        await deleteTelegramMessage(chatId, messageId);
      } catch (e) {}
      
      // Display first property with photos
      await displayPropertyWithPhotos(chatId, context.searchResults[0], 0, context.searchResults.length);
    }
    
    // Next property
    else if (data === 'next_property') {
      const context = userContexts.get(chatId);
      if (!context || !context.searchResults) {
        await sendTelegramMessage(chatId, '❌ Сессия истекла. Начните новый поиск.', {
          reply_markup: getMainMenuKeyboard()
        });
        return;
      }
      
      const nextIndex = (context.currentPropertyIndex || 0) + 1;
      if (nextIndex >= context.searchResults.length) {
        await sendTelegramMessage(chatId, '✅ Вы просмотрели все варианты!', {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔍 Новый поиск", callback_data: "search_menu" }],
              [{ text: "🏠 Главное меню", callback_data: "main_menu" }]
            ]
          }
        });
        return;
      }
      
      context.currentPropertyIndex = nextIndex;
      userContexts.set(chatId, context);
      
      await displayPropertyWithPhotos(chatId, context.searchResults[nextIndex], nextIndex, context.searchResults.length);
    }
    
    // Previous property
    else if (data === 'prev_property') {
      const context = userContexts.get(chatId);
      if (!context || !context.searchResults) {
        await sendTelegramMessage(chatId, '❌ Сессия истекла. Начните новый поиск.', {
          reply_markup: getMainMenuKeyboard()
        });
        return;
      }
      
      const prevIndex = Math.max(0, (context.currentPropertyIndex || 0) - 1);
      context.currentPropertyIndex = prevIndex;
      userContexts.set(chatId, context);
      
      await displayPropertyWithPhotos(chatId, context.searchResults[prevIndex], prevIndex, context.searchResults.length);
    }
    
    // Analytics menu
    else if (data === 'analytics_menu') {
      await editTelegramMessage(chatId, messageId,
        `📊 <b>Рыночная аналитика</b>\n\nВыберите тип анализа:`, {
        reply_markup: getAnalyticsMenuKeyboard()
      });
    }
    
    // Developers menu
    else if (data === 'developers_menu') {
      await editTelegramMessage(chatId, messageId,
        `🏗️ <b>Застройщики Дубая</b>\n\nВыберите действие:`, {
        reply_markup: getDevelopersMenuKeyboard()
      });
    }
    
    // Analytics: Top areas
    else if (data === 'analytics_top_areas') {
      await generateAnalyticsReport(chatId, messageId);
    }
    
    // Analytics: News
    else if (data === 'analytics_news') {
      await generateNewsAnalytics(chatId, messageId);
    }
    
    // Analytics: Investment
    else if (data === 'analytics_investment') {
      await generateInvestmentAnalysis(chatId, messageId);
    }
    
    // ROI Calculator
    else if (data === 'roi_calculator') {
      await editTelegramMessage(chatId, messageId,
        `🎯 <b>ROI Калькулятор</b>\n\nРассчитайте доходность инвестиций.\n\nВведите стоимость объекта в AED:`, {
        reply_markup: {
          inline_keyboard: [[{ text: "⬅️ Назад", callback_data: "analytics_menu" }]]
        }
      });
      
      const context = userContexts.get(chatId) || {};
      context.state = 'roi_enter_price';
      context.roiData = {};
      userContexts.set(chatId, context);
    }
    
    // Developers top 10
    else if (data === 'developers_top10') {
      await generateDevelopersTop10(chatId, messageId);
    }
    
    // Developer details
    else if (data.startsWith('developer_')) {
      const developerId = data.replace('developer_', '');
      await generateDeveloperDetails(chatId, messageId, developerId);
    }
    
    // Help
    else if (data === 'help') {
      await editTelegramMessage(chatId, messageId,
        `❓ <b>Помощь</b>\n\n` +
        `🔍 <b>Поиск:</b> Используйте фильтры для поиска\n` +
        `📊 <b>Аналитика:</b> Анализ рынка и районов\n` +
        `🎯 <b>ROI:</b> Расчёт доходности\n\n` +
        `💡 Или просто напишите что ищете!`, {
        reply_markup: { inline_keyboard: [[{ text: "⬅️ Назад", callback_data: "main_menu" }]] }
      });
    }
    
    // Contacts
    else if (data === 'contacts') {
      await editTelegramMessage(chatId, messageId,
        `📞 <b>Контакты</b>\n\n` +
        `🌐 Наш сайт: dubaiinvest.bot\n` +
        `📧 Email: info@dubaiinvest.bot\n` +
        `📱 WhatsApp: +971-XXX-XXXX`, {
        reply_markup: { inline_keyboard: [[{ text: "⬅️ Назад", callback_data: "main_menu" }]] }
      });
    }
    
    // Settings
    else if (data === 'settings_menu') {
      await editTelegramMessage(chatId, messageId,
        `⚙️ <b>Настройки</b>\n\nНастройки профиля и уведомлений`, {
        reply_markup: { inline_keyboard: [[{ text: "⬅️ Назад", callback_data: "main_menu" }]] }
      });
    }
    
    // Valuation
    else if (data === 'valuation_menu') {
      await editTelegramMessage(chatId, messageId,
        `💰 <b>Оценка стоимости</b>\n\nАвтоматическая оценка недвижимости (AVM)\n\nФункция в разработке...`, {
        reply_markup: { inline_keyboard: [[{ text: "⬅️ Назад", callback_data: "main_menu" }]] }
      });
    }

    await answerCallbackQuery(callbackQuery.id);
    
  } catch (error) {
    console.error('Error handling callback query:', error);
    await answerCallbackQuery(callbackQuery.id, 'Произошла ошибка');
  }
}

// ============= ANALYTICS FUNCTIONS =============

async function generateAnalyticsReport(chatId: number, messageId: number) {
  await editTelegramMessage(chatId, messageId,
    `📊 <b>Генерирую аналитику...</b>\n\n⏳ Подождите`, {
    reply_markup: { inline_keyboard: [] }
  });

  try {
    const districts = await getRealDistricts();
    const topDistricts = districts.slice(0, 5);
    
    let analyticsText = `📊 <b>Топ-5 районов по количеству объектов</b>\n\n`;
    
    topDistricts.forEach((d, index) => {
      analyticsText += `${index + 1}. <b>${d.district}</b>\n`;
      analyticsText += `📋 Объектов: ${d.count}\n\n`;
    });

    analyticsText += `📈 <i>Данные из реальной базы недвижимости</i>`;

    await editTelegramMessage(chatId, messageId, analyticsText, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📊 Аналитика", callback_data: "analytics_menu" }],
          [{ text: "🏠 Главное меню", callback_data: "main_menu" }]
        ]
      }
    });
  } catch (error) {
    console.error('Error in analytics:', error);
    await editTelegramMessage(chatId, messageId,
      `❌ <b>Ошибка</b>\n\n${error}`, {
      reply_markup: { inline_keyboard: [[{ text: "📊 Аналитика", callback_data: "analytics_menu" }]] }
    });
  }
}

async function generateNewsAnalytics(chatId: number, messageId: number) {
  await editTelegramMessage(chatId, messageId,
    `📰 <b>Анализ новостей рынка</b>\n\n` +
    `📈 Тренд: Позитивный\n` +
    `💡 Рынок Дубая продолжает рост\n\n` +
    `🕐 <i>Обновлено: ${new Date().toLocaleString('ru-RU')}</i>`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📊 Аналитика", callback_data: "analytics_menu" }],
        [{ text: "🏠 Главное меню", callback_data: "main_menu" }]
      ]
    }
  });
}

async function generateInvestmentAnalysis(chatId: number, messageId: number) {
  await editTelegramMessage(chatId, messageId,
    `💼 <b>Инвестиционный анализ</b>\n\n` +
    `📊 <b>Рекомендации 2025:</b>\n\n` +
    `1. 🏢 Business Bay — доходность 7-9%\n` +
    `2. 🌊 Dubai Marina — стабильность\n` +
    `3. 🏗️ Dubai Hills — рост цен\n\n` +
    `💡 Лучшее время для инвестиций!`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📊 Аналитика", callback_data: "analytics_menu" }],
        [{ text: "🏠 Главное меню", callback_data: "main_menu" }]
      ]
    }
  });
}

async function generateDevelopersTop10(chatId: number, messageId: number) {
  const developersText = `🏆 <b>Топ-5 застройщиков Дубая</b>\n\n` +
    `<b>1. Emaar Properties</b>\n` +
    `🌐 emaar.com\n` +
    `🏗️ Burj Khalifa, Dubai Mall, Downtown\n\n` +
    `<b>2. Damac Properties</b>\n` +
    `🌐 damac.com\n` +
    `🏗️ DAMAC Hills, AKOYA Oxygen\n\n` +
    `<b>3. Nakheel</b>\n` +
    `🌐 nakheel.com\n` +
    `🏗️ Palm Jumeirah, Deira Islands\n\n` +
    `<b>4. Dubai Properties</b>\n` +
    `🌐 dubaiproperties.ae\n` +
    `🏗️ Business Bay, JBR\n\n` +
    `<b>5. Meraas</b>\n` +
    `🌐 meraas.com\n` +
    `🏗️ Bluewaters, City Walk`;

  await editTelegramMessage(chatId, messageId, developersText, {
    reply_markup: getDevelopersMenuKeyboard()
  });
}

async function generateDeveloperDetails(chatId: number, messageId: number, developerId: string) {
  const developers: any = {
    emaar: {
      name: "Emaar Properties",
      founded: "1997",
      website: "emaar.com",
      projects: "Burj Khalifa, Dubai Mall, Downtown Dubai, Dubai Marina",
      description: "Крупнейший застройщик ОАЭ, создатель знаковых проектов"
    },
    damac: {
      name: "Damac Properties",
      founded: "2002",
      website: "damac.com",
      projects: "DAMAC Hills, AKOYA, Trump International Golf Club",
      description: "Роскошная недвижимость и гольф-сообщества"
    },
    nakheel: {
      name: "Nakheel",
      founded: "2000",
      website: "nakheel.com",
      projects: "Palm Jumeirah, Deira Islands, The World",
      description: "Создатель искусственных островов"
    },
    dubai_prop: {
      name: "Dubai Properties",
      founded: "2004",
      website: "dubaiproperties.ae",
      projects: "Business Bay, JBR, IMPZ",
      description: "Часть Dubai Holding Group"
    }
  };

  const dev = developers[developerId];
  if (!dev) {
    await editTelegramMessage(chatId, messageId, '❌ Застройщик не найден', {
      reply_markup: getDevelopersMenuKeyboard()
    });
    return;
  }

  await editTelegramMessage(chatId, messageId,
    `🏢 <b>${dev.name}</b>\n\n` +
    `📅 Основан: ${dev.founded}\n` +
    `🌐 Сайт: ${dev.website}\n\n` +
    `🏗️ <b>Проекты:</b>\n${dev.projects}\n\n` +
    `📝 ${dev.description}`, {
    reply_markup: getDevelopersMenuKeyboard()
  });
}

// ============= ROI CALCULATOR =============

function calculateROI(price: number, monthlyRent: number) {
  const annualRent = monthlyRent * 12;
  const grossYield = (annualRent / price) * 100;
  const expenses = annualRent * 0.15; // 15% на расходы
  const netRent = annualRent - expenses;
  const netYield = (netRent / price) * 100;
  const paybackYears = price / netRent;
  
  return {
    grossYield: grossYield.toFixed(2),
    netYield: netYield.toFixed(2),
    annualRent: annualRent.toLocaleString(),
    paybackYears: paybackYears.toFixed(1)
  };
}

// ============= MAIN HANDLER =============

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update = await req.json();
    console.log('Received update:', JSON.stringify(update, null, 2));

    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return new Response('OK', { headers: corsHeaders });
    }

    if (!update.message) {
      return new Response('OK', { headers: corsHeaders });
    }

    const chatId = update.message.chat.id;
    const text = update.message.text || '';

    if (text === '/start') {
      await sendTelegramMessage(chatId,
        `🏗️ <b>Добро пожаловать в Dubai Invest Bot!</b>\n\n` +
        `Я помогу найти недвижимость в Дубае.\n\n` +
        `💼 <b>Возможности:</b>\n` +
        `• 🔍 Поиск с фильтрами и фото\n` +
        `• 📊 AI-анализ цен по районам\n` +
        `• 💰 ROI калькулятор\n` +
        `• 🏗️ Информация о застройщиках\n\n` +
        `🎯 Используйте меню ниже!`, {
        reply_markup: getMainMenuKeyboard()
      });
      return new Response('OK', { headers: corsHeaders });
    }

    // Handle ROI input
    const context = userContexts.get(chatId);
    if (context?.state === 'roi_enter_price') {
      const price = parseFloat(text.replace(/[^\d.]/g, ''));
      if (isNaN(price) || price <= 0) {
        await sendTelegramMessage(chatId, '❌ Введите корректную цену в AED');
        return new Response('OK', { headers: corsHeaders });
      }
      
      context.roiData!.propertyPrice = price;
      context.state = 'roi_enter_rent';
      userContexts.set(chatId, context);
      
      await sendTelegramMessage(chatId,
        `💰 Стоимость: ${price.toLocaleString()} AED\n\n` +
        `Теперь введите месячную аренду в AED:`);
      return new Response('OK', { headers: corsHeaders });
    }
    
    if (context?.state === 'roi_enter_rent') {
      const rent = parseFloat(text.replace(/[^\d.]/g, ''));
      if (isNaN(rent) || rent <= 0) {
        await sendTelegramMessage(chatId, '❌ Введите корректную аренду в AED');
        return new Response('OK', { headers: corsHeaders });
      }
      
      const price = context.roiData!.propertyPrice!;
      const roi = calculateROI(price, rent);
      
      context.state = undefined;
      context.roiData = undefined;
      userContexts.set(chatId, context);
      
      await sendTelegramMessage(chatId,
        `🎯 <b>Расчёт ROI</b>\n\n` +
        `💰 Стоимость: ${price.toLocaleString()} AED\n` +
        `📅 Аренда/месяц: ${rent.toLocaleString()} AED\n\n` +
        `━━━━━━━━━━━━━━\n\n` +
        `📈 <b>Валовая доходность:</b> ${roi.grossYield}%\n` +
        `📊 <b>Чистая доходность:</b> ${roi.netYield}%\n` +
        `💵 <b>Годовой доход:</b> ${roi.annualRent} AED\n` +
        `⏱️ <b>Окупаемость:</b> ${roi.paybackYears} лет`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🎯 Ещё расчёт", callback_data: "roi_calculator" }],
            [{ text: "🏠 Главное меню", callback_data: "main_menu" }]
          ]
        }
      });
      return new Response('OK', { headers: corsHeaders });
    }

    // Default response
    await sendTelegramMessage(chatId,
      `👋 Используйте меню для навигации!`, {
      reply_markup: getMainMenuKeyboard()
    });

    return new Response('OK', { headers: corsHeaders });

  } catch (error) {
    console.error('Error processing update:', error);
    return new Response('Error', { status: 500, headers: corsHeaders });
  }
});
