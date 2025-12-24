import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('VIETNAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const GROUP_CHAT_ID = -1003589064021;
const MONITORED_CHANNELS: number[] = [-1003589064021];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// User context for step-by-step viewing
interface UserContext {
  filters: {
    district?: string;
    pets_allowed?: boolean;
    rental_period?: string;
    bedrooms?: number;
    price_range?: 'low' | 'mid' | 'high';
  };
  searchResults?: any[];
  currentIndex?: number;
  totalCount?: number;
}

const userContexts: Map<number, UserContext> = new Map();

function getOrCreateContext(userId: number): UserContext {
  if (!userContexts.has(userId)) {
    userContexts.set(userId, { filters: {} });
  }
  return userContexts.get(userId)!;
}

function invalidateSearch(ctx: UserContext) {
  ctx.searchResults = undefined;
  ctx.currentIndex = undefined;
  ctx.totalCount = undefined;
}

// District name translations (both ways)
const DISTRICT_TRANSLATIONS: Record<string, string[]> = {
  'Район 1': ['District 1', 'Quận 1', 'Q1', 'D1'],
  'Район 2': ['District 2', 'Quận 2', 'Q2', 'D2', 'Thao Dien', 'Thảo Điền'],
  'Район 3': ['District 3', 'Quận 3', 'Q3', 'D3'],
  'Район 4': ['District 4', 'Quận 4', 'Q4', 'D4'],
  'Район 5': ['District 5', 'Quận 5', 'Q5', 'D5'],
  'Район 6': ['District 6', 'Quận 6', 'Q6', 'D6'],
  'Район 7': ['District 7', 'Quận 7', 'Q7', 'D7', 'Phu My Hung'],
  'Район 8': ['District 8', 'Quận 8', 'Q8', 'D8'],
  'Район 9': ['District 9', 'Quận 9', 'Q9', 'D9'],
  'Район 10': ['District 10', 'Quận 10', 'Q10', 'D10'],
  'Район 11': ['District 11', 'Quận 11', 'Q11', 'D11'],
  'Район 12': ['District 12', 'Quận 12', 'Q12', 'D12'],
  'Бинь Тхань': ['Binh Thanh', 'Bình Thạnh'],
  'Го Вап': ['Go Vap', 'Gò Vấp'],
  'Фу Нхуан': ['Phu Nhuan', 'Phú Nhuận'],
  'Тан Бинь': ['Tan Binh', 'Tân Bình'],
  'Тан Фу': ['Tan Phu', 'Tân Phú'],
  'Тху Дык': ['Thu Duc', 'Thủ Đức', 'Thu Thiem', 'Thủ Thiêm'],
  'Бинь Тан': ['Binh Tan', 'Bình Tân'],
};

// Convert any district name to Russian
function toRussianDistrict(name: string | null | undefined): string {
  if (!name) return 'HCMC';

  // Check if already Russian
  for (const [russian, variants] of Object.entries(DISTRICT_TRANSLATIONS)) {
    if (name === russian) return russian;
    for (const variant of variants) {
      if (name.toLowerCase().includes(variant.toLowerCase())) {
        return russian;
      }
    }
  }

  // Check for Quận/District X pattern
  const match = name.match(/(?:Qu[aậ]n|District|Q|D)\s*(\d+)/i);
  if (match) return `Район ${match[1]}`;

  return name;
}

function buildDistrictOrConditions(district: string) {
  // Include the Russian name itself + all known variants; filter will match DB values like "District 9" / "Quận 9".
  const variants = [district, ...(DISTRICT_TRANSLATIONS[district] || [])]
    .map(v => v?.trim())
    .filter(Boolean);

  // PostgREST OR syntax: "col.ilike.%value%" separated by commas
  return variants.map(v => `district.ilike.%${v}%`).join(',');
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name: string; username?: string };
    chat: { id: number; type: string };
    text?: string;
    date: number;
  };
  callback_query?: {
    id: string;
    from: { id: number; first_name: string; username?: string };
    message: { message_id: number; chat: { id: number } };
    data: string;
  };
}

// ============= TELEGRAM API FUNCTIONS =============

async function sendTelegramMessage(chatId: number | string, text: string, options: any = {}) {
  if (!TELEGRAM_BOT_TOKEN) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...options })
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

async function sendTelegramPhoto(chatId: number | string, photoUrl: string, caption?: string, options: any = {}) {
  if (!TELEGRAM_BOT_TOKEN) return { ok: false };
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
  const truncatedCaption = caption && caption.length > 1000 ? caption.substring(0, 1000) + '...' : caption;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: chatId, 
        photo: photoUrl, 
        caption: truncatedCaption, 
        parse_mode: 'HTML',
        ...options 
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending photo:', error);
    return { ok: false };
  }
}

async function sendTelegramMediaGroup(chatId: number | string, images: string[], caption?: string) {
  if (!TELEGRAM_BOT_TOKEN || !images.length) return { ok: false };
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMediaGroup`;
  const truncatedCaption = caption && caption.length > 1000 ? caption.substring(0, 1000) + '...' : caption;
  
  const media = images.slice(0, 10).map((img, idx) => ({
    type: 'photo',
    media: img,
    caption: idx === 0 ? truncatedCaption : undefined,
    parse_mode: idx === 0 ? 'HTML' : undefined
  }));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, media })
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending media group:', error);
    return { ok: false };
  }
}

async function editTelegramMessage(chatId: number, messageId: number, text: string, options: any = {}) {
  if (!TELEGRAM_BOT_TOKEN) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML', ...options })
    });
  } catch (error) {
    console.error('Error editing message:', error);
  }
}

async function deleteTelegramMessage(chatId: number, messageId: number) {
  if (!TELEGRAM_BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId })
    });
  } catch {}
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  if (!TELEGRAM_BOT_TOKEN) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text })
    });
  } catch {}
}

// ============= DATABASE FUNCTIONS =============

// Get real districts from database with counts
async function getRealDistricts(): Promise<{ name: string; count: number }[]> {
  const { data, error } = await supabase
    .from('property_listings')
    .select('district')
    .eq('purpose', 'for-rent')
    .not('district', 'is', null);

  if (error || !data) return [];

  // Count by district and convert to Russian
  const counts: Record<string, number> = {};
  for (const row of data) {
    const russian = toRussianDistrict(row.district);
    counts[russian] = (counts[russian] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// Count properties with filters
async function countPropertiesWithFilters(filters: UserContext['filters']): Promise<number> {
  let query = supabase
    .from('property_listings')
    .select('id', { count: 'exact', head: true })
    .eq('purpose', 'for-rent');

  if (filters.district) {
    query = query.or(buildDistrictOrConditions(filters.district));
  }
  if (filters.bedrooms) query = query.eq('bedrooms', filters.bedrooms);
  if (filters.pets_allowed !== undefined) query = query.eq('pets_allowed', filters.pets_allowed);
  if (filters.rental_period && filters.rental_period !== 'both') {
    query = query.or(`rental_period.eq.${filters.rental_period},rental_period.eq.both`);
  }
  if (filters.price_range === 'low') query = query.lte('price', 8000000);
  else if (filters.price_range === 'mid') query = query.gt('price', 8000000).lte('price', 15000000);
  else if (filters.price_range === 'high') query = query.gt('price', 15000000);

  const { count } = await query;
  return count || 0;
}

// Search properties with filters
async function searchPropertiesWithFilters(filters: UserContext['filters'], limit = 50): Promise<any[]> {
  let query = supabase
    .from('property_listings')
    .select('*')
    .eq('purpose', 'for-rent')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters.district) {
    query = query.or(buildDistrictOrConditions(filters.district));
  }
  if (filters.bedrooms) query = query.eq('bedrooms', filters.bedrooms);
  if (filters.pets_allowed !== undefined) query = query.eq('pets_allowed', filters.pets_allowed);
  if (filters.rental_period && filters.rental_period !== 'both') {
    query = query.or(`rental_period.eq.${filters.rental_period},rental_period.eq.both`);
  }
  if (filters.price_range === 'low') query = query.lte('price', 8000000);
  else if (filters.price_range === 'mid') query = query.gt('price', 8000000).lte('price', 15000000);
  else if (filters.price_range === 'high') query = query.gt('price', 15000000);

  const { data, error } = await query;
  if (error) {
    console.error('Search error:', error);
    return [];
  }
  return data || [];
}

// Get average price for district
async function getDistrictAvgPrice(district: string, bedrooms?: number): Promise<number | null> {
  let query = supabase
    .from('property_listings')
    .select('price')
    .eq('purpose', 'for-rent')
    .not('price', 'is', null);

  query = query.or(buildDistrictOrConditions(district));

  if (bedrooms) query = query.eq('bedrooms', bedrooms);

  const { data } = await query;
  if (!data || data.length === 0) return null;

  const prices = data.map(p => p.price).filter(p => p > 0);
  if (prices.length === 0) return null;
  return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
}

// ============= AI FUNCTIONS =============

async function generatePriceInsight(property: any, avgPrice: number | null): Promise<string> {
  if (!property.price || !avgPrice) {
    return '📊 Недостаточно данных для анализа цены';
  }

  const diff = ((property.price - avgPrice) / avgPrice * 100).toFixed(0);
  const isAbove = property.price > avgPrice;
  
  // Simple analysis without AI call for speed
  if (!OPENAI_API_KEY) {
    if (Math.abs(Number(diff)) < 5) {
      return `📊 <b>Цена в рынке</b> — соответствует средней по району (${formatPrice(avgPrice)})`;
    } else if (isAbove) {
      return `📊 <b>Выше рынка на ${diff}%</b> — средняя по району: ${formatPrice(avgPrice)}`;
    } else {
      return `📊 <b>Ниже рынка на ${Math.abs(Number(diff))}%</b> — хорошая цена! Средняя: ${formatPrice(avgPrice)}`;
    }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Ты эксперт по недвижимости Вьетнама. Дай краткий анализ цены (1-2 предложения на русском). Используй эмодзи.' 
          },
          { 
            role: 'user', 
            content: `Квартира: ${property.title}, ${property.bedrooms || '?'} спальни, ${property.area_sqft || '?'}m², район ${toRussianDistrict(property.district)}.
Цена: ${formatPrice(property.price)} (${isAbove ? 'выше' : 'ниже'} средней на ${Math.abs(Number(diff))}%, средняя: ${formatPrice(avgPrice)}).
Почему такая цена? Стоит ли?` 
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      }),
    });

    if (!response.ok) throw new Error('AI request failed');
    const data = await response.json();
    return `📊 ${data.choices?.[0]?.message?.content || 'Анализ недоступен'}`;
  } catch (error) {
    console.error('AI insight error:', error);
    if (Math.abs(Number(diff)) < 5) {
      return `📊 <b>Цена в рынке</b> — соответствует средней по району`;
    } else if (isAbove) {
      return `📊 <b>Выше рынка на ${diff}%</b>`;
    } else {
      return `📊 <b>Ниже рынка на ${Math.abs(Number(diff))}%</b> — хорошая цена!`;
    }
  }
}

// ============= FORMATTING FUNCTIONS =============

function formatPrice(price: number | null): string {
  if (!price) return 'По запросу';
  if (price >= 1000000) {
    return (price / 1000000).toFixed(1) + 'M ₫';
  }
  return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
}

function formatBedrooms(bedrooms: number | null | undefined): string {
  if (!bedrooms) return 'Студия';
  if (bedrooms === 1) return '1 спальня';
  if (bedrooms <= 4) return `${bedrooms} спальни`;
  return `${bedrooms} спален`;
}

function getFilterSummary(filters: UserContext['filters']): string {
  const parts: string[] = [];
  if (filters.district) parts.push(`📍 ${filters.district}`);
  if (filters.bedrooms) parts.push(`🛏 ${formatBedrooms(filters.bedrooms)}`);
  if (filters.price_range) {
    if (filters.price_range === 'low') parts.push('💵 до 8M');
    else if (filters.price_range === 'mid') parts.push('💰 8-15M');
    else parts.push('💎 от 15M');
  }
  if (filters.pets_allowed !== undefined) parts.push(filters.pets_allowed ? '🐾 С питомцами' : '🚫 Без питомцев');
  if (filters.rental_period) parts.push(filters.rental_period === 'short-term' ? '⏱️ Краткосрочно' : '📅 Долгосрочно');
  return parts.length > 0 ? parts.join(' | ') : 'Все варианты';
}

// ============= KEYBOARD GENERATORS =============

function getMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🔍 Найти квартиру', callback_data: 'search_start' }],
      [{ text: '📋 Все объявления', callback_data: 'all_listings' }],
      [{ text: '📍 По районам', callback_data: 'districts_menu' }],
      [{ text: '📱 Наш канал', url: 'https://t.me/renthcm' }]
    ]
  };
}

function getFilterMenuKeyboard(ctx: UserContext, count: number) {
  const f = ctx.filters;
  return {
    inline_keyboard: [
      [{ text: `📍 Район: ${f.district || 'Все'}`, callback_data: 'filter_district' }],
      [{ text: `🛏 Спальни: ${f.bedrooms ? formatBedrooms(f.bedrooms) : 'Любые'}`, callback_data: 'filter_bedrooms' }],
      [{ text: `💰 Бюджет: ${f.price_range === 'low' ? 'до 8M' : f.price_range === 'mid' ? '8-15M' : f.price_range === 'high' ? 'от 15M' : 'Любой'}`, callback_data: 'filter_price' }],
      [{ text: `🐾 Питомцы: ${f.pets_allowed === true ? 'Да' : f.pets_allowed === false ? 'Нет' : 'Любые'}`, callback_data: 'filter_pets' }],
      [{ text: `📅 Срок: ${f.rental_period === 'short-term' ? 'Кратко' : f.rental_period === 'long-term' ? 'Долго' : 'Любой'}`, callback_data: 'filter_period' }],
      [
        { text: `🏠 Найдено: ${count}`, callback_data: 'show_count' },
        { text: '🗑 Сброс', callback_data: 'filter_reset' }
      ],
      [{ text: count > 0 ? '▶️ Начать просмотр' : '❌ Нет вариантов', callback_data: count > 0 ? 'start_viewing' : 'no_results' }],
      [{ text: '🔙 Главное меню', callback_data: 'back_main' }]
    ]
  };
}

function getPropertyViewKeyboard(ctx: UserContext, propertyId: number) {
  const current = (ctx.currentIndex || 0) + 1;
  const total = ctx.totalCount || 0;
  const hasNext = current < total;
  const hasPrev = current > 1;

  const nav: any[] = [];
  if (hasPrev) nav.push({ text: '⬅️ Пред.', callback_data: 'view_prev' });
  nav.push({ text: `${current}/${total}`, callback_data: 'show_position' });
  if (hasNext) nav.push({ text: 'След. ➡️', callback_data: 'view_next' });

  return {
    inline_keyboard: [
      nav,
      [{ text: '🖼 Все фото', callback_data: `gallery_${propertyId}` }],
      [{ text: '📞 Контакты', callback_data: `contact_${propertyId}` }],
      [{ text: '🔧 Фильтры', callback_data: 'filter_menu' }, { text: '🏠 Меню', callback_data: 'back_main' }]
    ]
  };
}

// ============= DISPLAY FUNCTIONS =============

async function displayPropertyWithPhotos(chatId: number, property: any, ctx: UserContext, messageId?: number) {
  const district = toRussianDistrict(property.district || property.location_area);
  const avgPrice = await getDistrictAvgPrice(district, property.bedrooms);
  const priceInsight = await generatePriceInsight(property, avgPrice);

  const images = (property.images || []).filter((img: string) => img && img.startsWith('http'));
  
  const caption = `🏠 <b>${property.title}</b>

💰 <b>${formatPrice(property.price)}</b>
📍 ${district}
🛏 ${formatBedrooms(property.bedrooms)} | 🚿 ${property.bathrooms || '?'} ванн.
📐 ${property.area_sqft ? property.area_sqft + ' m²' : 'N/A'}
🏢 ${property.property_type || 'Квартира'}

${property.pets_allowed === true ? '🐾 Можно с питомцами' : property.pets_allowed === false ? '🚫 Без питомцев' : ''}
${property.rental_period === 'short-term' ? '⏱️ Краткосрочная аренда' : property.rental_period === 'long-term' ? '📅 Долгосрочная аренда' : ''}

${priceInsight}

🆔 <code>${property.id}</code>`;

  const keyboard = getPropertyViewKeyboard(ctx, property.id);

  // Delete previous message if editing
  if (messageId) {
    await deleteTelegramMessage(chatId, messageId);
  }

  // Send with photos
  if (images.length >= 2) {
    // Send media group (up to 6 photos)
    const photoImages = images.slice(0, 6);
    const result = await sendTelegramMediaGroup(chatId, photoImages, caption);

    if (result?.ok) {
      // Send navigation buttons as separate message (always)
      await sendTelegramMessage(chatId, '👆 Выберите действие:', { reply_markup: keyboard });
    } else {
      // Fallback to single photo without buttons, then buttons separately
      await sendTelegramPhoto(chatId, images[0], caption);
      await sendTelegramMessage(chatId, '👆 Выберите действие:', { reply_markup: keyboard });
    }
  } else if (images.length === 1) {
    // Always keep buttons on a text message (so we can edit it reliably)
    await sendTelegramPhoto(chatId, images[0], caption);
    await sendTelegramMessage(chatId, '👆 Выберите действие:', { reply_markup: keyboard });
  } else {
    // No photos
    await sendTelegramMessage(chatId, caption + '\n\n📷 Фото не загружены');
    await sendTelegramMessage(chatId, '👆 Выберите действие:', { reply_markup: keyboard });
  }
}

// ============= HANDLER FUNCTIONS =============

async function handleStart(chatId: number, userName: string) {
  const ctx = getOrCreateContext(chatId);
  ctx.filters = {};
  ctx.searchResults = undefined;
  ctx.currentIndex = undefined;
  
  await sendTelegramMessage(chatId, `
🏠 <b>RentHCM — Аренда квартир в Хошимине</b>

Привет, ${userName}! 👋

🌟 <b>Бесплатный сервис</b> для русскоязычного комьюнити

💡 <b>Что мы делаем:</b>
• Сводим напрямую с владельцами
• Никаких комиссий и накруток
• Честные цены от источника

Нажмите <b>"Найти квартиру"</b> чтобы начать поиск!
`, { reply_markup: getMainMenuKeyboard() });
}

async function handleCallback(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const userId = callbackQuery.from.id;

  await answerCallbackQuery(callbackQuery.id);
  
  const ctx = getOrCreateContext(userId);

  // ===== MAIN NAVIGATION =====
  
  if (data === 'back_main') {
    ctx.filters = {};
    ctx.searchResults = undefined;
    await editTelegramMessage(chatId, messageId, `
🏠 <b>RentHCM</b>

Выберите действие:
`, { reply_markup: getMainMenuKeyboard() });
    return;
  }

  // ===== SEARCH START =====
  
  if (data === 'search_start' || data === 'filter_menu') {
    const count = await countPropertiesWithFilters(ctx.filters);
    await editTelegramMessage(chatId, messageId, `
🔍 <b>Поиск квартиры</b>

Настройте фильтры и нажмите "Начать просмотр"

<b>Текущие фильтры:</b>
${getFilterSummary(ctx.filters)}
`, { reply_markup: getFilterMenuKeyboard(ctx, count) });
    return;
  }

  // ===== DISTRICT FILTER =====
  
  if (data === 'filter_district') {
    const districts = await getRealDistricts();
    
    const rows: any[][] = [];
    for (let i = 0; i < districts.length; i += 2) {
      const row: any[] = [];
      const d1 = districts[i];
      row.push({
        text: `${d1.name === ctx.filters.district ? '✅ ' : ''}${d1.name} (${d1.count})`,
        callback_data: `set_district_${d1.name}`
      });
      if (districts[i + 1]) {
        const d2 = districts[i + 1];
        row.push({
          text: `${d2.name === ctx.filters.district ? '✅ ' : ''}${d2.name} (${d2.count})`,
          callback_data: `set_district_${d2.name}`
        });
      }
      rows.push(row);
    }
    rows.push([{ text: '❌ Все районы', callback_data: 'set_district_all' }]);
    rows.push([{ text: '🔙 Назад к фильтрам', callback_data: 'filter_menu' }]);

    await editTelegramMessage(chatId, messageId, `
📍 <b>Выберите район:</b>

Показаны районы с доступными квартирами
`, { reply_markup: { inline_keyboard: rows } });
    return;
  }

  if (data.startsWith('set_district_')) {
    const district = data.replace('set_district_', '');
    ctx.filters.district = district === 'all' ? undefined : district;
    invalidateSearch(ctx);

    const count = await countPropertiesWithFilters(ctx.filters);
    await editTelegramMessage(chatId, messageId, `
🔍 <b>Поиск квартиры</b>

<b>Текущие фильтры:</b>
${getFilterSummary(ctx.filters)}
`, { reply_markup: getFilterMenuKeyboard(ctx, count) });
    return;
  }

  // ===== BEDROOMS FILTER =====
  
  if (data === 'filter_bedrooms') {
    await editTelegramMessage(chatId, messageId, `
🛏 <b>Количество спален:</b>

Текущее: ${ctx.filters.bedrooms ? formatBedrooms(ctx.filters.bedrooms) : 'Любое'}
`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: ctx.filters.bedrooms === 0 ? '✅ Студия' : 'Студия', callback_data: 'set_bed_0' },
            { text: ctx.filters.bedrooms === 1 ? '✅ 1' : '1', callback_data: 'set_bed_1' },
            { text: ctx.filters.bedrooms === 2 ? '✅ 2' : '2', callback_data: 'set_bed_2' }
          ],
          [
            { text: ctx.filters.bedrooms === 3 ? '✅ 3' : '3', callback_data: 'set_bed_3' },
            { text: ctx.filters.bedrooms === 4 ? '✅ 4+' : '4+', callback_data: 'set_bed_4' }
          ],
          [{ text: '❌ Любое', callback_data: 'set_bed_all' }],
          [{ text: '🔙 Назад', callback_data: 'filter_menu' }]
        ]
      }
    });
    return;
  }

  if (data.startsWith('set_bed_')) {
    const bed = data.replace('set_bed_', '');
    ctx.filters.bedrooms = bed === 'all' ? undefined : parseInt(bed);
    invalidateSearch(ctx);

    const count = await countPropertiesWithFilters(ctx.filters);
    await editTelegramMessage(chatId, messageId, `
🔍 <b>Поиск квартиры</b>

<b>Текущие фильтры:</b>
${getFilterSummary(ctx.filters)}
`, { reply_markup: getFilterMenuKeyboard(ctx, count) });
    return;
  }

  // ===== PRICE FILTER =====
  
  if (data === 'filter_price') {
    await editTelegramMessage(chatId, messageId, `
💰 <b>Бюджет (VND/месяц):</b>

Текущий: ${ctx.filters.price_range === 'low' ? 'до 8M' : ctx.filters.price_range === 'mid' ? '8-15M' : ctx.filters.price_range === 'high' ? 'от 15M' : 'Любой'}
`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: ctx.filters.price_range === 'low' ? '✅ До 8M ₫' : '💵 До 8M ₫', callback_data: 'set_price_low' }],
          [{ text: ctx.filters.price_range === 'mid' ? '✅ 8-15M ₫' : '💰 8-15M ₫', callback_data: 'set_price_mid' }],
          [{ text: ctx.filters.price_range === 'high' ? '✅ От 15M ₫' : '💎 От 15M ₫', callback_data: 'set_price_high' }],
          [{ text: '❌ Любая цена', callback_data: 'set_price_all' }],
          [{ text: '🔙 Назад', callback_data: 'filter_menu' }]
        ]
      }
    });
    return;
  }

  if (data.startsWith('set_price_')) {
    const price = data.replace('set_price_', '');
    ctx.filters.price_range = price === 'all' ? undefined : price as 'low' | 'mid' | 'high';
    invalidateSearch(ctx);

    const count = await countPropertiesWithFilters(ctx.filters);
    await editTelegramMessage(chatId, messageId, `
🔍 <b>Поиск квартиры</b>

<b>Текущие фильтры:</b>
${getFilterSummary(ctx.filters)}
`, { reply_markup: getFilterMenuKeyboard(ctx, count) });
    return;
  }

  // ===== PETS FILTER =====
  
  if (data === 'filter_pets') {
    await editTelegramMessage(chatId, messageId, `
🐾 <b>Можно с питомцами?</b>

Текущее: ${ctx.filters.pets_allowed === true ? 'Да' : ctx.filters.pets_allowed === false ? 'Нет' : 'Любые'}
`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: ctx.filters.pets_allowed === true ? '✅ Да, с питомцами' : '🐾 Да, с питомцами', callback_data: 'set_pets_yes' }],
          [{ text: ctx.filters.pets_allowed === false ? '✅ Нет питомцев' : '🚫 Нет питомцев', callback_data: 'set_pets_no' }],
          [{ text: '❌ Не важно', callback_data: 'set_pets_all' }],
          [{ text: '🔙 Назад', callback_data: 'filter_menu' }]
        ]
      }
    });
    return;
  }

  if (data.startsWith('set_pets_')) {
    const pets = data.replace('set_pets_', '');
    ctx.filters.pets_allowed = pets === 'all' ? undefined : pets === 'yes';
    invalidateSearch(ctx);

    const count = await countPropertiesWithFilters(ctx.filters);
    await editTelegramMessage(chatId, messageId, `
🔍 <b>Поиск квартиры</b>

<b>Текущие фильтры:</b>
${getFilterSummary(ctx.filters)}
`, { reply_markup: getFilterMenuKeyboard(ctx, count) });
    return;
  }

  // ===== RENTAL PERIOD FILTER =====
  
  if (data === 'filter_period') {
    await editTelegramMessage(chatId, messageId, `
📅 <b>Срок аренды:</b>

Текущий: ${ctx.filters.rental_period === 'short-term' ? 'Краткосрочная' : ctx.filters.rental_period === 'long-term' ? 'Долгосрочная' : 'Любой'}
`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: ctx.filters.rental_period === 'short-term' ? '✅ Краткосрочная' : '⏱️ Краткосрочная (<6 мес)', callback_data: 'set_period_short' }],
          [{ text: ctx.filters.rental_period === 'long-term' ? '✅ Долгосрочная' : '📅 Долгосрочная (6+ мес)', callback_data: 'set_period_long' }],
          [{ text: '❌ Любой срок', callback_data: 'set_period_all' }],
          [{ text: '🔙 Назад', callback_data: 'filter_menu' }]
        ]
      }
    });
    return;
  }

  if (data.startsWith('set_period_')) {
    const period = data.replace('set_period_', '');
    ctx.filters.rental_period = period === 'all' ? undefined : period === 'short' ? 'short-term' : 'long-term';
    invalidateSearch(ctx);

    const count = await countPropertiesWithFilters(ctx.filters);
    await editTelegramMessage(chatId, messageId, `
🔍 <b>Поиск квартиры</b>

<b>Текущие фильтры:</b>
${getFilterSummary(ctx.filters)}
`, { reply_markup: getFilterMenuKeyboard(ctx, count) });
    return;
  }

  // ===== FILTER RESET =====
  
  if (data === 'filter_reset') {
    ctx.filters = {};
    invalidateSearch(ctx);

    const count = await countPropertiesWithFilters(ctx.filters);
    await editTelegramMessage(chatId, messageId, `
🔍 <b>Поиск квартиры</b>

✅ Фильтры сброшены

<b>Текущие фильтры:</b>
${getFilterSummary(ctx.filters)}
`, { reply_markup: getFilterMenuKeyboard(ctx, count) });
    return;
  }

  // ===== START VIEWING =====
  
  if (data === 'start_viewing') {
    const results = await searchPropertiesWithFilters(ctx.filters);
    
    if (results.length === 0) {
      await editTelegramMessage(chatId, messageId, `
❌ <b>Ничего не найдено</b>

Попробуйте изменить фильтры
`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔧 Изменить фильтры', callback_data: 'filter_menu' }],
            [{ text: '🗑 Сбросить все', callback_data: 'filter_reset' }],
            [{ text: '🏠 Главное меню', callback_data: 'back_main' }]
          ]
        }
      });
      return;
    }

    ctx.searchResults = results;
    ctx.currentIndex = 0;
    ctx.totalCount = results.length;

    // Log search
    await supabase.from('search_history').insert({
      telegram_user_id: userId,
      query: JSON.stringify(ctx.filters),
      results_count: results.length,
      filters: ctx.filters
    });

    await displayPropertyWithPhotos(chatId, results[0], ctx, messageId);
    return;
  }

  // ===== NAVIGATION =====
  
  if (data === 'view_next') {
    if (!ctx.searchResults || ctx.searchResults.length === 0) {
      // Reload search results if lost
      const results = await searchPropertiesWithFilters(ctx.filters);
      if (results.length === 0) {
        await sendTelegramMessage(chatId, '❌ Результаты поиска устарели. Начните поиск заново.', {
          reply_markup: { inline_keyboard: [[{ text: '🔍 Новый поиск', callback_data: 'search_start' }], [{ text: '🏠 Меню', callback_data: 'back_main' }]] }
        });
        return;
      }
      ctx.searchResults = results;
      ctx.totalCount = results.length;
      ctx.currentIndex = 0;
    }
    
    const nextIndex = (ctx.currentIndex || 0) + 1;
    if (nextIndex < ctx.searchResults.length) {
      ctx.currentIndex = nextIndex;
      await displayPropertyWithPhotos(chatId, ctx.searchResults[nextIndex], ctx, messageId);
    } else {
      await sendTelegramMessage(chatId, '✅ Это последний вариант в списке', {
        reply_markup: { inline_keyboard: [[{ text: '🔧 Фильтры', callback_data: 'filter_menu' }], [{ text: '🏠 Меню', callback_data: 'back_main' }]] }
      });
    }
    return;
  }

  if (data === 'view_prev') {
    if (!ctx.searchResults || ctx.searchResults.length === 0) {
      await sendTelegramMessage(chatId, '❌ Результаты поиска устарели. Начните поиск заново.', {
        reply_markup: { inline_keyboard: [[{ text: '🔍 Новый поиск', callback_data: 'search_start' }], [{ text: '🏠 Меню', callback_data: 'back_main' }]] }
      });
      return;
    }
    
    const prevIndex = (ctx.currentIndex || 0) - 1;
    if (prevIndex >= 0) {
      ctx.currentIndex = prevIndex;
      await displayPropertyWithPhotos(chatId, ctx.searchResults[prevIndex], ctx, messageId);
    } else {
      await sendTelegramMessage(chatId, '✅ Это первый вариант в списке');
    }
    return;
  }

  // ===== GALLERY =====
  
  if (data.startsWith('gallery_')) {
    const propertyId = data.replace('gallery_', '');
    const { data: p } = await supabase
      .from('property_listings')
      .select('id, title, images')
      .eq('id', propertyId)
      .single();
    
    if (p && p.images) {
      const images = (p.images as string[]).filter((img: string) => img && img.startsWith('http'));
      
      if (images.length > 0) {
        await sendTelegramMessage(chatId, `📸 <b>${p.title}</b>\n\nЗагружаю ${images.length} фото...`);
        
        // Send all photos as media group
        for (let i = 0; i < images.length; i += 10) {
          const batch = images.slice(i, i + 10);
          await sendTelegramMediaGroup(chatId, batch);
        }
        
        await sendTelegramMessage(chatId, `✅ Загружено ${images.length} фото`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 К объявлению', callback_data: `detail_${propertyId}` }],
              [{ text: '🏠 Главное меню', callback_data: 'back_main' }]
            ]
          }
        });
      }
    }
    return;
  }

  // ===== CONTACT =====
  
  if (data.startsWith('contact_')) {
    const propertyId = data.replace('contact_', '');
    const { data: p } = await supabase
      .from('property_listings')
      .select('agent_name, agent_phone, title')
      .eq('id', propertyId)
      .single();

    if (p) {
      await sendTelegramMessage(chatId, `
📞 <b>Контакты</b>

🏠 ${p.title}

${p.agent_name ? `👤 Агент: ${p.agent_name}` : ''}
${p.agent_phone ? `📱 Телефон: ${p.agent_phone}` : '📱 Телефон: по запросу'}

💡 <b>Совет:</b> Упомяните что нашли объявление через RentHCM
`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 К объявлению', callback_data: `detail_${propertyId}` }],
            [{ text: '🏠 Главное меню', callback_data: 'back_main' }]
          ]
        }
      });
    }
    return;
  }

  // ===== PROPERTY DETAIL =====
  
  if (data.startsWith('detail_')) {
    const propertyId = data.replace('detail_', '');
    const { data: property } = await supabase
      .from('property_listings')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (property) {
      // Reset context for single property view
      ctx.searchResults = [property];
      ctx.currentIndex = 0;
      ctx.totalCount = 1;
      await displayPropertyWithPhotos(chatId, property, ctx, messageId);
    }
    return;
  }

  // ===== ALL LISTINGS =====
  
  if (data === 'all_listings') {
    ctx.filters = {};
    const results = await searchPropertiesWithFilters({}, 50);
    
    if (results.length === 0) {
      await editTelegramMessage(chatId, messageId, '❌ Пока нет объявлений', {
        reply_markup: { inline_keyboard: [[{ text: '🏠 Главное меню', callback_data: 'back_main' }]] }
      });
      return;
    }

    ctx.searchResults = results;
    ctx.currentIndex = 0;
    ctx.totalCount = results.length;

    await displayPropertyWithPhotos(chatId, results[0], ctx, messageId);
    return;
  }

  // ===== DISTRICTS MENU =====
  
  if (data === 'districts_menu') {
    const districts = await getRealDistricts();
    
    const rows: any[][] = [];
    for (let i = 0; i < Math.min(districts.length, 10); i += 2) {
      const row: any[] = [];
      const d1 = districts[i];
      row.push({ text: `${d1.name} (${d1.count})`, callback_data: `quick_district_${d1.name}` });
      if (districts[i + 1]) {
        const d2 = districts[i + 1];
        row.push({ text: `${d2.name} (${d2.count})`, callback_data: `quick_district_${d2.name}` });
      }
      rows.push(row);
    }
    rows.push([{ text: '🔍 Подробный поиск', callback_data: 'search_start' }]);
    rows.push([{ text: '🏠 Главное меню', callback_data: 'back_main' }]);

    await editTelegramMessage(chatId, messageId, `
📍 <b>Районы Хошимина</b>

Выберите район для просмотра квартир:
`, { reply_markup: { inline_keyboard: rows } });
    return;
  }

  if (data.startsWith('quick_district_')) {
    const district = data.replace('quick_district_', '');
    ctx.filters = { district };
    
    const results = await searchPropertiesWithFilters(ctx.filters);
    
    if (results.length === 0) {
      await editTelegramMessage(chatId, messageId, `❌ В районе ${district} нет квартир`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📍 Другие районы', callback_data: 'districts_menu' }],
            [{ text: '🏠 Главное меню', callback_data: 'back_main' }]
          ]
        }
      });
      return;
    }

    ctx.searchResults = results;
    ctx.currentIndex = 0;
    ctx.totalCount = results.length;

    await displayPropertyWithPhotos(chatId, results[0], ctx, messageId);
    return;
  }

  // Fallback
  console.log('Unhandled callback:', data);
}

// ============= AUTO-IMPORT FUNCTIONS =============

function isPropertyListing(text: string): boolean {
  const indicators = [
    /\d+\s*(triệu|tr|million|usd|\$)/i,
    /\d+\s*(m2|m²|sqm)/i,
    /\d+\s*(pn|phòng ngủ|bedroom|br)/i,
    /(cho thuê|for rent|căn hộ|apartment|studio|villa)/i,
  ];
  return indicators.filter(r => r.test(text)).length >= 2 && text.length > 50;
}

async function parsePropertyListing(text: string): Promise<any | null> {
  if (!OPENAI_API_KEY) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `Parse Vietnamese property listings. Extract: title, price (VND number), location_area, district (e.g. "District 1"), property_type, bedrooms, bathrooms, area_sqft, agent_phone, pets_allowed (boolean if mentioned), rental_period ("short-term" or "long-term" if mentioned). Return JSON.` },
          { role: 'user', content: text }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'extract_property',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                price: { type: ['number', 'null'] },
                location_area: { type: ['string', 'null'] },
                district: { type: ['string', 'null'] },
                property_type: { type: ['string', 'null'] },
                bedrooms: { type: ['integer', 'null'] },
                bathrooms: { type: ['integer', 'null'] },
                area_sqft: { type: ['integer', 'null'] },
                agent_phone: { type: ['string', 'null'] },
                pets_allowed: { type: ['boolean', 'null'] },
                rental_period: { type: ['string', 'null'] }
              },
              required: ['title']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'extract_property' } }
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      return JSON.parse(toolCall.function.arguments);
    }
    return null;
  } catch (error) {
    console.error('Parse error:', error);
    return null;
  }
}

async function autoImportProperty(text: string, chatId: number, messageId: number): Promise<boolean> {
  const parsed = await parsePropertyListing(text);
  if (!parsed?.title) return false;

  const { data: existing } = await supabase
    .from('property_listings')
    .select('id')
    .eq('source_name', 'telegram')
    .ilike('title', `%${parsed.title.slice(0, 30)}%`)
    .limit(1);

  if (existing?.length) return false;

  const { data, error } = await supabase
    .from('property_listings')
    .insert({
      title: parsed.title,
      price: parsed.price,
      location_area: parsed.location_area,
      district: parsed.district,
      property_type: parsed.property_type,
      purpose: 'for-rent',
      bedrooms: parsed.bedrooms,
      bathrooms: parsed.bathrooms,
      area_sqft: parsed.area_sqft,
      agent_phone: parsed.agent_phone,
      pets_allowed: parsed.pets_allowed,
      rental_period: parsed.rental_period,
      images: [],
      source_name: 'telegram',
      source_category: 'auto-import',
      housing_status: 'secondary',
      external_id: `tg_${chatId}_${messageId}`
    })
    .select('id')
    .single();

  if (error) return false;

  console.log('Auto-imported:', data.id);
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMessageReaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId, reaction: [{ type: 'emoji', emoji: '✅' }] })
    });
  } catch {}
  return true;
}

// ============= MESSAGE HANDLER =============

async function handleMessage(message: any) {
  const chatId = message.chat.id;
  const text = message.text || '';
  const userName = message.from?.first_name || 'User';
  const chatType = message.chat.type;

  // Auto-import from monitored channels
  if ((chatType === 'channel' || chatType === 'supergroup' || chatType === 'group') && MONITORED_CHANNELS.includes(chatId)) {
    if (isPropertyListing(text)) {
      await autoImportProperty(text, chatId, message.message_id);
    }
    return;
  }

  // Private messages
  if (chatType === 'private') {
    if (text.startsWith('/start') || text.startsWith('/help')) {
      await handleStart(chatId, userName);
    } else if (text.startsWith('/search')) {
      const ctx = getOrCreateContext(chatId);
      const count = await countPropertiesWithFilters(ctx.filters);
      await sendTelegramMessage(chatId, `
🔍 <b>Поиск квартиры</b>

Настройте фильтры:

<b>Текущие фильтры:</b>
${getFilterSummary(ctx.filters)}
`, { reply_markup: getFilterMenuKeyboard(ctx, count) });
    } else if (text.startsWith('/all')) {
      const ctx = getOrCreateContext(chatId);
      ctx.filters = {};
      const results = await searchPropertiesWithFilters({}, 50);
      
      if (results.length === 0) {
        await sendTelegramMessage(chatId, '❌ Пока нет объявлений');
        return;
      }

      ctx.searchResults = results;
      ctx.currentIndex = 0;
      ctx.totalCount = results.length;

      await displayPropertyWithPhotos(chatId, results[0], ctx);
    } else if (text.startsWith('/about')) {
      await sendTelegramMessage(chatId, `
🏠 <b>О проекте RentHCM</b>

🌟 <b>Бесплатный сервис</b> для русскоязычного комьюнити во Вьетнаме

💡 <b>Наша миссия:</b>
• Сводим напрямую с владельцами
• Никаких комиссий
• Честные цены

📱 Канал: @renthcm
`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 Наш канал', url: 'https://t.me/renthcm' }],
            [{ text: '🏠 Главное меню', callback_data: 'back_main' }]
          ]
        }
      });
    } else if (text.startsWith('/districts')) {
      const districts = await getRealDistricts();
      const rows: any[][] = [];
      for (let i = 0; i < Math.min(districts.length, 12); i += 3) {
        const row: any[] = [];
        for (let j = 0; j < 3 && i + j < districts.length; j++) {
          const d = districts[i + j];
          row.push({ text: `${d.name} (${d.count})`, callback_data: `quick_district_${d.name}` });
        }
        rows.push(row);
      }
      rows.push([{ text: '🏠 Главное меню', callback_data: 'back_main' }]);
      await sendTelegramMessage(chatId, '📍 <b>Выберите район:</b>', {
        reply_markup: { inline_keyboard: rows }
      });
    } else {
      // Default: show main menu
      await handleStart(chatId, userName);
    }
  }
}

// ============= MAIN HANDLER =============

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return new Response(JSON.stringify({ error: 'Bot not configured' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const url = new URL(req.url);

    // Admin action: send group message
    if (url.searchParams.get('action') === 'send_group_message') {
      const { message, type } = await req.json();
      if (!message) {
        return new Response(JSON.stringify({ error: 'Message required' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      const emoji = type === 'new_listing' ? '🏠' : type === 'alert' ? '⚠️' : type === 'promo' ? '🎉' : 'ℹ️';
      const result = await sendTelegramMessage(GROUP_CHAT_ID, `${emoji} <b>RentHCM</b>\n\n${message}`);
      return new Response(JSON.stringify({ ok: true, result }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Handle Telegram update
    const update: TelegramUpdate = await req.json();
    console.log('Update:', JSON.stringify(update));

    if (update.callback_query) {
      await handleCallback(update.callback_query);
    } else if (update.message) {
      await handleMessage(update.message);
    }

    return new Response(JSON.stringify({ ok: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
