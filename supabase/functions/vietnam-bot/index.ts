import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('VIETNAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const GROUP_CHAT_ID = -1003589064021;
const MONITORED_CHANNELS: number[] = [-1003589064021];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Districts list with Russian translations
const DISTRICTS = [
  'Район 1', 'Район 2', 'Район 3', 'Район 4', 'Район 5',
  'Район 6', 'Район 7', 'Район 8', 'Район 9', 'Район 10',
  'Район 11', 'Район 12', 'Бинь Тхань', 'Го Вап', 'Фу Нхуан',
  'Тан Бинь', 'Тан Фу', 'Тху Дык', 'Бинь Тан'
];

// District name translations
const DISTRICT_TO_RUSSIAN: Record<string, string> = {
  'District 1': 'Район 1', 'District 2': 'Район 2', 'District 3': 'Район 3',
  'District 4': 'Район 4', 'District 5': 'Район 5', 'District 6': 'Район 6',
  'District 7': 'Район 7', 'District 8': 'Район 8', 'District 9': 'Район 9',
  'District 10': 'Район 10', 'District 11': 'Район 11', 'District 12': 'Район 12',
  'Quận 1': 'Район 1', 'Quận 2': 'Район 2', 'Quận 3': 'Район 3',
  'Quận 4': 'Район 4', 'Quận 5': 'Район 5', 'Quận 6': 'Район 6',
  'Quận 7': 'Район 7', 'Quận 8': 'Район 8', 'Quận 9': 'Район 9',
  'Quận 10': 'Район 10', 'Quận 11': 'Район 11', 'Quận 12': 'Район 12',
  'Binh Thanh': 'Бинь Тхань', 'Bình Thạnh': 'Бинь Тхань',
  'Go Vap': 'Го Вап', 'Gò Vấp': 'Го Вап',
  'Phu Nhuan': 'Фу Нхуан', 'Phú Nhuận': 'Фу Нхуан',
  'Tan Binh': 'Тан Бинь', 'Tân Bình': 'Тан Бинь',
  'Tan Phu': 'Тан Фу', 'Tân Phú': 'Тан Фу',
  'Thu Duc': 'Тху Дык', 'Thủ Đức': 'Тху Дык',
  'Binh Tan': 'Бинь Тан', 'Bình Tân': 'Бинь Тан',
  'Thao Dien': 'Тхао Дьен', 'Thảo Điền': 'Тхао Дьен',
};

const RUSSIAN_TO_DB: Record<string, string> = {
  'Район 1': 'District 1', 'Район 2': 'District 2', 'Район 3': 'District 3',
  'Район 4': 'District 4', 'Район 5': 'District 5', 'Район 6': 'District 6',
  'Район 7': 'District 7', 'Район 8': 'District 8', 'Район 9': 'District 9',
  'Район 10': 'District 10', 'Район 11': 'District 11', 'Район 12': 'District 12',
  'Бинь Тхань': 'Binh Thanh', 'Го Вап': 'Go Vap', 'Фу Нхуан': 'Phu Nhuan',
  'Тан Бинь': 'Tan Binh', 'Тан Фу': 'Tan Phu', 'Тху Дык': 'Thu Duc', 'Бинь Тан': 'Binh Tan',
  'Тхао Дьен': 'Thao Dien',
};

// Convert district name to Russian
function toRussianDistrict(name: string | null | undefined): string {
  if (!name) return 'HCMC';
  // Check direct match
  if (DISTRICT_TO_RUSSIAN[name]) return DISTRICT_TO_RUSSIAN[name];
  // Check for Quận X pattern
  const qMatch = name.match(/Qu[aậ]n\s*(\d+)/i);
  if (qMatch) return `Район ${qMatch[1]}`;
  // Check for District X pattern
  const dMatch = name.match(/District\s*(\d+)/i);
  if (dMatch) return `Район ${dMatch[1]}`;
  return name;
}

// Convert Russian district to DB format
function fromRussianDistrict(name: string): string {
  return RUSSIAN_TO_DB[name] || name;
}

// User filter sessions (in-memory, resets on deploy)
const userFilters: Record<number, {
  district?: string;
  pets_allowed?: boolean;
  rental_period?: string;
  bedrooms?: number;
  price_range?: 'low' | 'high';
  offset?: number;
}> = {};

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

// Send single photo
async function sendTelegramPhoto(chatId: number | string, photoUrl: string, caption?: string, options: any = {}) {
  if (!TELEGRAM_BOT_TOKEN) return { ok: false };
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
  
  // Telegram caption limit is 1024 characters
  const truncatedCaption = caption && caption.length > 1000 ? caption.substring(0, 1000) + '...' : caption;
  
  console.log('Sending photo:', { chatId, photoUrl });
  
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
    const result = await response.json();
    console.log('Photo send result:', JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('Error sending photo:', error);
    return { ok: false };
  }
}

// Send media group (multiple photos)
async function sendTelegramMediaGroup(chatId: number | string, images: string[], caption?: string) {
  if (!TELEGRAM_BOT_TOKEN || !images.length) return { ok: false };
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMediaGroup`;
  
  // Telegram caption limit is 1024 characters
  const truncatedCaption = caption && caption.length > 1000 ? caption.substring(0, 1000) + '...' : caption;
  
  const media = images.slice(0, 10).map((img, idx) => ({
    type: 'photo',
    media: img,
    caption: idx === 0 ? truncatedCaption : undefined,
    parse_mode: idx === 0 ? 'HTML' : undefined
  }));

  console.log('Sending media group:', { chatId, imageCount: images.length });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, media })
    });
    const result = await response.json();
    console.log('Media group result:', JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('Error sending media group:', error);
    return { ok: false };
  }
}

// Compress image URL using Supabase transform or resize
function getCompressedImageUrl(photoUrl: string, maxWidth = 800): string {
  // If it's a Supabase storage URL, use built-in transformation
  if (photoUrl.includes('supabase.co/storage/v1/object/public/')) {
    // Add transformation parameters for compression
    const separator = photoUrl.includes('?') ? '&' : '?';
    return `${photoUrl}${separator}width=${maxWidth}&quality=75`;
  }
  return photoUrl;
}

// Download and send photo as file with compression
async function sendPhotoAsFile(chatId: number | string, photoUrl: string, caption?: string, options: any = {}) {
  if (!TELEGRAM_BOT_TOKEN) return { ok: false };
  
  try {
    // Use compressed version of the image
    const compressedUrl = getCompressedImageUrl(photoUrl, 800);
    console.log('Downloading compressed image:', compressedUrl);
    
    // Download the image
    const imageResponse = await fetch(compressedUrl);
    if (!imageResponse.ok) {
      console.error('Failed to download image:', compressedUrl, imageResponse.status);
      // Fallback to original URL
      const fallbackResponse = await fetch(photoUrl);
      if (!fallbackResponse.ok) {
        return { ok: false };
      }
      const imageBlob = await fallbackResponse.blob();
      return await sendBlobToTelegram(chatId, imageBlob, caption, options);
    }
    
    const imageBlob = await imageResponse.blob();
    console.log('Image size:', Math.round(imageBlob.size / 1024), 'KB');
    
    return await sendBlobToTelegram(chatId, imageBlob, caption, options);
  } catch (error) {
    console.error('Error sending photo as file:', error);
    return { ok: false };
  }
}

// Helper to send blob to Telegram
async function sendBlobToTelegram(chatId: number | string, imageBlob: Blob, caption?: string, options: any = {}) {
  const formData = new FormData();
  formData.append('chat_id', chatId.toString());
  formData.append('photo', imageBlob, 'photo.jpg');
  if (caption) {
    const truncatedCaption = caption.length > 1000 ? caption.substring(0, 1000) + '...' : caption;
    formData.append('caption', truncatedCaption);
    formData.append('parse_mode', 'HTML');
  }
  if (options.reply_markup) {
    formData.append('reply_markup', JSON.stringify(options.reply_markup));
  }
  
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  console.log('Photo sent, size:', Math.round(imageBlob.size / 1024), 'KB, result:', result.ok);
  return result;
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

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  if (!TELEGRAM_BOT_TOKEN) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text })
    });
  } catch (error) {}
}

// Search with filters - returns paginated results
async function searchWithFilters(filters: typeof userFilters[0], limit: number = 5, offset: number = 0) {
  console.log('Searching with filters:', filters, 'offset:', offset);
  
  // Convert Russian district to DB format
  const dbDistrict = filters.district ? fromRussianDistrict(filters.district) : undefined;

  let query = supabase
    .from('property_listings')
    .select('*', { count: 'exact' })
    .eq('purpose', 'for-rent')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (dbDistrict) {
    // Search for both English and Vietnamese district names
    query = query.or(`district.ilike.%${dbDistrict}%,location_area.ilike.%${dbDistrict}%,district.ilike.%${filters.district}%`);
  }
  if (filters.pets_allowed !== undefined) {
    query = query.eq('pets_allowed', filters.pets_allowed);
  }
  if (filters.rental_period && filters.rental_period !== 'both') {
    query = query.or(`rental_period.eq.${filters.rental_period},rental_period.eq.both`);
  }
  if (filters.bedrooms) {
    query = query.eq('bedrooms', filters.bedrooms);
  }
  if (filters.price_range === 'low') {
    query = query.lte('price', 10000000);
  } else if (filters.price_range === 'high') {
    query = query.gt('price', 10000000);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error('Search error:', error);
    return { data: [], count: 0 };
  }
  return { data: data || [], count: count || 0 };
}

// Format bedrooms to Russian format
function formatBedrooms(bedrooms: number | null | undefined): string {
  if (!bedrooms) return '?';
  if (bedrooms === 1) return '1-комн.';
  if (bedrooms === 2) return '2-комн.';
  if (bedrooms === 3) return '3-комн.';
  if (bedrooms === 4) return '4-комн.';
  return `${bedrooms}-комн.`;
}

// Format property - compact version for list
function formatPropertyCompact(p: any, idx: number): string {
  const price = p.price ? new Intl.NumberFormat('vi-VN').format(p.price) + ' ₫' : 'По запросу';
  const district = toRussianDistrict(p.district || p.location_area);
  
  return `<b>${idx}. ${p.title}</b>
💰 ${price} | 📍 ${district}
🛏 ${formatBedrooms(p.bedrooms)} | 📐 ${p.area_sqft ? p.area_sqft + 'm²' : '—'}`;
}

// Format property - old detailed format
function formatProperty(p: any, idx: number): string {
  const price = p.price ? new Intl.NumberFormat('vi-VN').format(p.price) + ' VND' : 'По запросу';
  const district = toRussianDistrict(p.district || p.location_area);
  const pets = p.pets_allowed === true ? '🐾 Можно' : p.pets_allowed === false ? '🚫 Нельзя' : '❓';
  const period = p.rental_period === 'short-term' ? '⏱️ Кратко' : p.rental_period === 'long-term' ? '📅 Долго' : '📅 Любой';
  
  return `
<b>${idx}. ${p.title}</b>
💰 ${price}
📍 ${district}
🛏 ${formatBedrooms(p.bedrooms)} | 🚿 ${p.bathrooms || '?'} ванн.
📐 ${p.area_sqft ? p.area_sqft + ' m²' : 'N/A'}
🐾 Животные: ${pets} | ${period}
ID: <code>${p.id}</code>
`;
}

// Build filter summary
function getFilterSummary(filters: typeof userFilters[0]): string {
  const parts: string[] = [];
  if (filters.district) parts.push(`📍 ${filters.district}`);
  if (filters.bedrooms) parts.push(`🛏 ${filters.bedrooms} спальни`);
  if (filters.price_range) parts.push(filters.price_range === 'low' ? '💰 до 10M' : '💰 от 10M');
  if (filters.pets_allowed !== undefined) parts.push(filters.pets_allowed ? '🐾 С животными' : '🚫 Без животных');
  if (filters.rental_period) parts.push(filters.rental_period === 'short-term' ? '⏱️ Кратко' : filters.rental_period === 'long-term' ? '📅 Долго' : '📅 Любая');
  return parts.length > 0 ? parts.join(' | ') : 'Фильтры не выбраны';
}

// Main filter menu
function getFilterMenuKeyboard(userId: number) {
  const f = userFilters[userId] || {};
  return {
    inline_keyboard: [
      [{ text: `📍 Район: ${f.district || 'Все'}`, callback_data: 'filter_district' }],
      [{ text: `🛏 Спальни: ${f.bedrooms || 'Любые'}`, callback_data: 'filter_bedrooms' }],
      [{ text: `💰 Цена: ${f.price_range === 'low' ? 'до 10M' : f.price_range === 'high' ? 'от 10M' : 'Любая'}`, callback_data: 'filter_price' }],
      [{ text: `🐾 Животные: ${f.pets_allowed === true ? 'Да' : f.pets_allowed === false ? 'Нет' : 'Любые'}`, callback_data: 'filter_pets' }],
      [{ text: `📅 Срок: ${f.rental_period === 'short-term' ? 'Кратко' : f.rental_period === 'long-term' ? 'Долго' : 'Любой'}`, callback_data: 'filter_period' }],
      [
        { text: '🔍 НАЙТИ', callback_data: 'filter_search' },
        { text: '🗑 Сброс', callback_data: 'filter_reset' }
      ],
      [{ text: '🔙 Главное меню', callback_data: 'back_main' }]
    ]
  };
}

// Handle /start
async function handleStart(chatId: number, userName: string) {
  userFilters[chatId] = {};
  
  await sendTelegramMessage(chatId, `
🏠 <b>RentHCM — Бесплатный сервис аренды в Хошимине</b>

Привет, ${userName}! 👋

🌟 <b>Мы — некоммерческий проект</b>, созданный для русскоязычного комьюнити во Вьетнаме.

💡 <b>Наша миссия:</b>
• Сводим вас напрямую с владельцами квартир и агентствами
• <b>Никаких комиссий</b> — мы не берём ни копейки
• <b>Честные цены</b> — без накруток и посредников
• Всё делаем на добровольной основе для удобства комьюнити

🤝 Мы просто помогаем людям найти жильё быстрее и проще!

<b>Команды:</b>
/search - 🔍 Детальный поиск с фильтрами
/all - 📋 Все объявления
/districts - 📍 Районы HCMC
/about - ℹ️ О проекте
/help - ❓ Помощь

📱 Канал: @renthcm
`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔍 Детальный поиск', callback_data: 'filter_menu' }],
        [{ text: '📋 Все объявления', callback_data: 'all_listings' }],
        [{ text: '📍 По районам', callback_data: 'districts' }],
        [{ text: '📱 Наш канал', url: 'https://t.me/renthcm' }]
      ]
    }
  });
}

// Handle callbacks
async function handleCallback(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const userId = callbackQuery.from.id;

  await answerCallbackQuery(callbackQuery.id);

  // Initialize filters if needed
  if (!userFilters[userId]) userFilters[userId] = {};
  const filters = userFilters[userId];

  // FILTER MENU
  if (data === 'filter_menu') {
    await editTelegramMessage(chatId, messageId, `
🔍 <b>Детальный поиск</b>

Настройте фильтры и нажмите "НАЙТИ"

<b>Текущие фильтры:</b>
${getFilterSummary(filters)}
`, { reply_markup: getFilterMenuKeyboard(userId) });
  }
  
  // DISTRICT SELECTION
  else if (data === 'filter_district') {
    const districtRows = [];
    for (let i = 0; i < DISTRICTS.length; i += 3) {
      districtRows.push(DISTRICTS.slice(i, i + 3).map(d => ({
        text: d === filters.district ? `✅ ${d}` : d,
        callback_data: `set_district_${d}`
      })));
    }
    districtRows.push([{ text: '❌ Все районы', callback_data: 'set_district_all' }]);
    districtRows.push([{ text: '🔙 Назад', callback_data: 'filter_menu' }]);

    await editTelegramMessage(chatId, messageId, `
📍 <b>Выберите район:</b>

Текущий: ${filters.district || 'Все'}
`, { reply_markup: { inline_keyboard: districtRows } });
  }
  else if (data.startsWith('set_district_')) {
    const district = data.replace('set_district_', '');
    filters.district = district === 'all' ? undefined : district;
    await editTelegramMessage(chatId, messageId, `
🔍 <b>Детальный поиск</b>

<b>Текущие фильтры:</b>
${getFilterSummary(filters)}
`, { reply_markup: getFilterMenuKeyboard(userId) });
  }

  // BEDROOMS SELECTION
  else if (data === 'filter_bedrooms') {
    await editTelegramMessage(chatId, messageId, `
🛏 <b>Количество спален:</b>

Текущее: ${filters.bedrooms || 'Любое'}
`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: filters.bedrooms === 1 ? '✅ 1' : '1', callback_data: 'set_bed_1' },
            { text: filters.bedrooms === 2 ? '✅ 2' : '2', callback_data: 'set_bed_2' },
            { text: filters.bedrooms === 3 ? '✅ 3' : '3', callback_data: 'set_bed_3' }
          ],
          [
            { text: filters.bedrooms === 4 ? '✅ 4' : '4', callback_data: 'set_bed_4' },
            { text: filters.bedrooms === 5 ? '✅ 5+' : '5+', callback_data: 'set_bed_5' }
          ],
          [{ text: '❌ Любое', callback_data: 'set_bed_all' }],
          [{ text: '🔙 Назад', callback_data: 'filter_menu' }]
        ]
      }
    });
  }
  else if (data.startsWith('set_bed_')) {
    const bed = data.replace('set_bed_', '');
    filters.bedrooms = bed === 'all' ? undefined : parseInt(bed);
    await editTelegramMessage(chatId, messageId, `
🔍 <b>Детальный поиск</b>

<b>Текущие фильтры:</b>
${getFilterSummary(filters)}
`, { reply_markup: getFilterMenuKeyboard(userId) });
  }

  // PRICE SELECTION
  else if (data === 'filter_price') {
    await editTelegramMessage(chatId, messageId, `
💰 <b>Ценовой диапазон:</b>

Текущий: ${filters.price_range === 'low' ? 'до 10M VND' : filters.price_range === 'high' ? 'от 10M VND' : 'Любой'}
`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: filters.price_range === 'low' ? '✅ До 10M VND' : '💵 До 10M VND', callback_data: 'set_price_low' }],
          [{ text: filters.price_range === 'high' ? '✅ От 10M VND' : '💰 От 10M VND', callback_data: 'set_price_high' }],
          [{ text: '❌ Любая цена', callback_data: 'set_price_all' }],
          [{ text: '🔙 Назад', callback_data: 'filter_menu' }]
        ]
      }
    });
  }
  else if (data.startsWith('set_price_')) {
    const price = data.replace('set_price_', '');
    filters.price_range = price === 'all' ? undefined : price as 'low' | 'high';
    await editTelegramMessage(chatId, messageId, `
🔍 <b>Детальный поиск</b>

<b>Текущие фильтры:</b>
${getFilterSummary(filters)}
`, { reply_markup: getFilterMenuKeyboard(userId) });
  }

  // PETS SELECTION
  else if (data === 'filter_pets') {
    await editTelegramMessage(chatId, messageId, `
🐾 <b>Животные разрешены?</b>

Текущее: ${filters.pets_allowed === true ? 'Да' : filters.pets_allowed === false ? 'Нет' : 'Любые'}
`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: filters.pets_allowed === true ? '✅ Да, с животными' : '🐾 Да, с животными', callback_data: 'set_pets_yes' }],
          [{ text: filters.pets_allowed === false ? '✅ Нет животных' : '🚫 Нет животных', callback_data: 'set_pets_no' }],
          [{ text: '❌ Не важно', callback_data: 'set_pets_all' }],
          [{ text: '🔙 Назад', callback_data: 'filter_menu' }]
        ]
      }
    });
  }
  else if (data.startsWith('set_pets_')) {
    const pets = data.replace('set_pets_', '');
    filters.pets_allowed = pets === 'all' ? undefined : pets === 'yes';
    await editTelegramMessage(chatId, messageId, `
🔍 <b>Детальный поиск</b>

<b>Текущие фильтры:</b>
${getFilterSummary(filters)}
`, { reply_markup: getFilterMenuKeyboard(userId) });
  }

  // RENTAL PERIOD SELECTION
  else if (data === 'filter_period') {
    await editTelegramMessage(chatId, messageId, `
📅 <b>Срок аренды:</b>

Текущий: ${filters.rental_period === 'short-term' ? 'Краткосрочная' : filters.rental_period === 'long-term' ? 'Долгосрочная' : 'Любой'}
`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: filters.rental_period === 'short-term' ? '✅ Краткосрочная (<6 мес)' : '⏱️ Краткосрочная (<6 мес)', callback_data: 'set_period_short' }],
          [{ text: filters.rental_period === 'long-term' ? '✅ Долгосрочная (6+ мес)' : '📅 Долгосрочная (6+ мес)', callback_data: 'set_period_long' }],
          [{ text: '❌ Любой срок', callback_data: 'set_period_all' }],
          [{ text: '🔙 Назад', callback_data: 'filter_menu' }]
        ]
      }
    });
  }
  else if (data.startsWith('set_period_')) {
    const period = data.replace('set_period_', '');
    filters.rental_period = period === 'all' ? undefined : period === 'short' ? 'short-term' : 'long-term';
    await editTelegramMessage(chatId, messageId, `
🔍 <b>Детальный поиск</b>

<b>Текущие фильтры:</b>
${getFilterSummary(filters)}
`, { reply_markup: getFilterMenuKeyboard(userId) });
  }

  // RESET FILTERS
  else if (data === 'filter_reset') {
    userFilters[userId] = {};
    await answerCallbackQuery(callbackQuery.id, '✅ Фильтры сброшены');
    await editTelegramMessage(chatId, messageId, `
🔍 <b>Детальный поиск</b>

<b>Текущие фильтры:</b>
${getFilterSummary(userFilters[userId])}
`, { reply_markup: getFilterMenuKeyboard(userId) });
  }

  // SEARCH WITH FILTERS - with pagination
  else if (data === 'filter_search' || data === 'load_more') {
    const isLoadMore = data === 'load_more';
    const offset = isLoadMore ? (filters.offset || 0) : 0;
    
    if (!isLoadMore) {
      await editTelegramMessage(chatId, messageId, '🔍 Ищу объявления по вашим фильтрам...');
    }
    
    const result = await searchWithFilters(filters, 5, offset);
    const properties = result.data;
    const totalCount = result.count;
    
    // Log search (only on first search)
    if (!isLoadMore) {
      await supabase.from('search_history').insert({
        telegram_user_id: userId,
        query: JSON.stringify(filters),
        results_count: totalCount,
        filters: filters
      });
    }

    if (properties.length === 0 && offset === 0) {
      await editTelegramMessage(chatId, messageId, `
❌ <b>Ничего не найдено</b>

По вашим фильтрам:
${getFilterSummary(filters)}

Попробуйте изменить параметры поиска.
`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔧 Изменить фильтры', callback_data: 'filter_menu' }],
            [{ text: '🗑 Сбросить и показать все', callback_data: 'filter_reset_search' }]
          ]
        }
      });
      return;
    }

    // Compact list format
    let text = `🏠 <b>${filters.district || 'Все районы'}</b> — ${totalCount} объявлений\n`;
    text += `Показано: ${offset + 1}-${offset + properties.length}\n\n`;
    
    properties.forEach((p: any, i: number) => {
      text += formatPropertyCompact(p, offset + i + 1) + '\n\n';
    });

    // Build keyboard with detail buttons
    const detailButtons = properties.map((p: any, i: number) => ({
      text: `👁 #${offset + i + 1}`,
      callback_data: `detail_${p.id}`
    }));

    // Split detail buttons into rows of 5
    const buttonRows: any[][] = [];
    for (let i = 0; i < detailButtons.length; i += 5) {
      buttonRows.push(detailButtons.slice(i, i + 5));
    }

    // Add "load more" button if there are more results
    const hasMore = offset + properties.length < totalCount;
    if (hasMore) {
      filters.offset = offset + 5;
      buttonRows.push([{ text: `⬇️ Ещё (${totalCount - offset - properties.length} осталось)`, callback_data: 'load_more' }]);
    }

    buttonRows.push([{ text: '🔧 Фильтры', callback_data: 'filter_menu' }, { text: '🔙 Меню', callback_data: 'back_main' }]);

    await editTelegramMessage(chatId, messageId, text, {
      reply_markup: { inline_keyboard: buttonRows }
    });
  }

  else if (data === 'filter_reset_search') {
    userFilters[userId] = {};
    await handleCallback({ ...callbackQuery, data: 'filter_search' });
  }

  // ALL LISTINGS
  else if (data === 'all_listings') {
    userFilters[userId] = {};
    await handleCallback({ ...callbackQuery, data: 'filter_search' });
  }

  // DISTRICTS QUICK SELECT
  else if (data === 'districts') {
    const rows = [
      [{ text: 'Район 1', callback_data: 'quick_d_Район 1' }, { text: 'Район 2', callback_data: 'quick_d_Район 2' }],
      [{ text: 'Район 7', callback_data: 'quick_d_Район 7' }, { text: 'Бинь Тхань', callback_data: 'quick_d_Бинь Тхань' }],
      [{ text: 'Тху Дык', callback_data: 'quick_d_Тху Дык' }, { text: 'Фу Нхуан', callback_data: 'quick_d_Фу Нхуан' }],
      [{ text: '🔍 Детальный поиск', callback_data: 'filter_menu' }],
      [{ text: '🔙 Назад', callback_data: 'back_main' }]
    ];
    await editTelegramMessage(chatId, messageId, `
📍 <b>Быстрый поиск по районам:</b>

Выберите район для поиска:
`, { reply_markup: { inline_keyboard: rows } });
  }

  else if (data.startsWith('quick_d_')) {
    const district = data.replace('quick_d_', '');
    userFilters[userId] = { district, offset: 0 };
    await handleCallback({ ...callbackQuery, data: 'filter_search' });
  }

  // PROPERTY DETAIL
  else if (data.startsWith('detail_')) {
    const propertyId = data.replace('detail_', '');
    console.log('Fetching property detail for ID:', propertyId);
    
    const { data: p, error: fetchError } = await supabase
      .from('property_listings')
      .select('*')
      .eq('id', propertyId)
      .single();

    console.log('Property fetch result:', { found: !!p, error: fetchError?.message, images: p?.images });

    if (p) {
      const price = p.price ? new Intl.NumberFormat('vi-VN').format(p.price) + ' ₫' : 'По запросу';
      const district = toRussianDistrict(p.district || p.location_area);
      const pets = p.pets_allowed === true ? '🐾 Можно с животными' : p.pets_allowed === false ? '🚫 Без животных' : '❓ Не указано';
      const period = p.rental_period === 'short-term' ? '⏱️ Краткосрочная' : p.rental_period === 'long-term' ? '📅 Долгосрочная' : '📅 Любой срок';

      // Get images first for the keyboard
      const rawImages = p.images || [];
      const images = rawImages.filter((img: string) => img && img.startsWith('http'));
      console.log('Processing images:', images.length);

      const detailText = `
🏠 <b>${p.title}</b>

💰 <b>Цена:</b> ${price}
📍 <b>Район:</b> ${district}
🏢 <b>Тип:</b> ${p.property_type || 'Квартира'}
🛏 <b>Спальни:</b> ${p.bedrooms || 'N/A'}
🚿 <b>Ванные:</b> ${p.bathrooms || 'N/A'}
📐 <b>Площадь:</b> ${p.area_sqft ? p.area_sqft + ' m²' : 'N/A'}

${pets}
${period}

${p.agent_name ? `👤 Агент: ${p.agent_name}` : ''}
${p.agent_phone ? `📞 Телефон: ${p.agent_phone}` : ''}`;

      const keyboard = {
        inline_keyboard: [
          ...(images.length > 1 ? [[{ text: `🖼 Все фото (${images.length})`, callback_data: `gallery_${propertyId}` }]] : []),
          [{ text: '📞 Связаться', callback_data: 'contact_agent' }],
          [{ text: '🔍 Ещё объявления', callback_data: 'filter_search' }],
          [{ text: '🔙 Главное меню', callback_data: 'back_main' }]
        ]
      };

      // Delete the old message
      try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, message_id: messageId })
        });
      } catch {}

      let photosSent = false;
      
      if (images.length > 0) {
        // Try sending first photo as file (more reliable)
        console.log('Trying to send photo as file');
        const photoResult = await sendPhotoAsFile(chatId, images[0], detailText, { reply_markup: keyboard });
        if (photoResult?.ok) {
          photosSent = true;
        }
      }
      
      // Final fallback: send text with image links
      if (!photosSent) {
        console.log('Sending text with image links as fallback');
        const imageLinks = images.length > 0 
          ? `\n\n📷 <b>Фото:</b>\n${images.map((img: string, i: number) => `<a href="${img}">Фото ${i + 1}</a>`).join(' | ')}`
          : '';
        await sendTelegramMessage(chatId, detailText + imageLinks, { reply_markup: keyboard });
      }
    } else {
      console.log('Property not found for ID:', propertyId);
    }
  }

  // GALLERY - Show all photos
  else if (data.startsWith('gallery_')) {
    const propertyId = data.replace('gallery_', '');
    console.log('Gallery requested for property:', propertyId);
    
    const { data: p } = await supabase
      .from('property_listings')
      .select('id, title, images')
      .eq('id', propertyId)
      .single();
    
    if (p && p.images) {
      const images = (p.images as string[]).filter((img: string) => img && img.startsWith('http'));
      
      if (images.length > 0) {
        // Send each photo individually as files
        await sendTelegramMessage(chatId, `📸 <b>Галерея: ${p.title}</b>\n\nЗагружаю ${images.length} фото...`);
        
        let sentCount = 0;
        for (const imageUrl of images.slice(0, 10)) { // Max 10 photos
          const result = await sendPhotoAsFile(chatId, imageUrl, sentCount === 0 ? `Фото 1/${images.length}` : `Фото ${sentCount + 1}/${images.length}`);
          if (result?.ok) sentCount++;
        }
        
        // Send back button
        await sendTelegramMessage(chatId, `✅ Загружено ${sentCount} из ${images.length} фото`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 К объявлению', callback_data: `detail_${propertyId}` }],
              [{ text: '🔙 Главное меню', callback_data: 'back_main' }]
            ]
          }
        });
      } else {
        await sendTelegramMessage(chatId, '📷 Фото отсутствуют', {
          reply_markup: {
            inline_keyboard: [[{ text: '🔙 Назад', callback_data: `detail_${propertyId}` }]]
          }
        });
      }
    }
  }

  else if (data === 'contact_agent') {
    await editTelegramMessage(chatId, messageId, `
📞 <b>Контакты</b>

🌐 Сайт: saigon-properties.vn
📱 WhatsApp: +84 xxx xxx xxx
📧 Email: info@saigonproperties.vn

Языки: 🇻🇳 🇬🇧 🇷🇺
`, {
      reply_markup: {
        inline_keyboard: [[{ text: '🔙 Назад', callback_data: 'back_main' }]]
      }
    });
  }

  else if (data === 'back_main') {
    await editTelegramMessage(chatId, messageId, `
🏠 <b>Saigon Properties Bot</b>

Выберите действие:
`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔍 Детальный поиск', callback_data: 'filter_menu' }],
          [{ text: '📋 Все объявления', callback_data: 'all_listings' }],
          [{ text: '📍 По районам', callback_data: 'districts' }]
        ]
      }
    });
  }
}

// Check if property listing
function isPropertyListing(text: string): boolean {
  const indicators = [
    /\d+\s*(triệu|tr|million|usd|\$)/i,
    /\d+\s*(m2|m²|sqm)/i,
    /\d+\s*(pn|phòng ngủ|bedroom|br)/i,
    /(cho thuê|for rent|căn hộ|apartment|studio|villa)/i,
  ];
  return indicators.filter(r => r.test(text)).length >= 2 && text.length > 50;
}

// Parse listing with AI
async function parsePropertyListing(text: string): Promise<any | null> {
  if (!LOVABLE_API_KEY) return null;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
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

// Auto-import
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

// Handle messages
async function handleMessage(message: any) {
  const chatId = message.chat.id;
  const text = message.text || '';
  const userName = message.from?.first_name || 'User';
  const chatType = message.chat.type;

  if ((chatType === 'channel' || chatType === 'supergroup' || chatType === 'group') && MONITORED_CHANNELS.includes(chatId)) {
    if (isPropertyListing(text)) {
      await autoImportProperty(text, chatId, message.message_id);
    }
    return;
  }

  if (chatType === 'private') {
    if (text.startsWith('/start') || text.startsWith('/help')) {
      await handleStart(chatId, userName);
    } else if (text.startsWith('/search')) {
      await sendTelegramMessage(chatId, '🔍 <b>Детальный поиск</b>\n\nНастройте фильтры:', { reply_markup: getFilterMenuKeyboard(chatId) });
    } else if (text.startsWith('/all')) {
      userFilters[chatId] = { offset: 0 };
      const result = await searchWithFilters({}, 5, 0);
      if (result.data.length === 0) {
        await sendTelegramMessage(chatId, '❌ Пока нет объявлений');
        return;
      }
      let resultText = `📋 <b>Все объявления (${result.count}):</b>\n\n`;
      result.data.forEach((p: any, i: number) => {
        resultText += formatPropertyCompact(p, i + 1) + '\n\n';
      });
      
      const buttons = result.data.map((p: any, i: number) => ({
        text: `👁 #${i + 1}`,
        callback_data: `detail_${p.id}`
      }));
      
      const keyboard: any[][] = [];
      for (let i = 0; i < buttons.length; i += 5) {
        keyboard.push(buttons.slice(i, i + 5));
      }
      if (result.count > 5) {
        userFilters[chatId].offset = 5;
        keyboard.push([{ text: `⬇️ Ещё (${result.count - 5} осталось)`, callback_data: 'load_more' }]);
      }
      keyboard.push([{ text: '🔍 Детальный поиск', callback_data: 'filter_menu' }, { text: '🏠 Меню', callback_data: 'back_main' }]);
      
      await sendTelegramMessage(chatId, resultText, { reply_markup: { inline_keyboard: keyboard } });
    } else if (text.startsWith('/about')) {
      await sendTelegramMessage(chatId, `
🏠 <b>О проекте RentHCM</b>

🌟 <b>Мы — некоммерческий проект</b>, созданный для русскоязычного комьюнити во Вьетнаме.

💡 <b>Наша миссия:</b>
• Сводим вас напрямую с владельцами квартир и агентствами
• <b>Никаких комиссий</b> — мы не берём ни копейки
• <b>Честные цены</b> — без накруток и посредников
• Всё делаем на добровольной основе для удобства комьюнити

🤝 <b>Как это работает:</b>
Мы собираем актуальные объявления аренды в Хошимине и предоставляем удобный поиск. Вы связываетесь напрямую с владельцем или агентством — мы просто помогаем найти жильё быстрее!

📱 Канал: @renthcm
🌐 Сайт: в разработке

❤️ Спасибо, что пользуетесь нашим сервисом!
`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 Наш канал', url: 'https://t.me/renthcm' }],
            [{ text: '🏠 Главное меню', callback_data: 'back_main' }]
          ]
        }
      });
    } else if (text.startsWith('/districts')) {
      const districtRows = [];
      for (let i = 0; i < DISTRICTS.length; i += 3) {
        districtRows.push(DISTRICTS.slice(i, i + 3).map(d => ({
          text: d,
          callback_data: `set_district_${d}`
        })));
      }
      districtRows.push([{ text: '🏠 Главное меню', callback_data: 'back_main' }]);
      await sendTelegramMessage(chatId, '📍 <b>Выберите район:</b>', {
        reply_markup: { inline_keyboard: districtRows }
      });
    } else {
      // Text search
      const result = await searchWithFilters({ district: text }, 5, 0);
      if (result.data.length === 0) {
        await sendTelegramMessage(chatId, `❌ По запросу "${text}" ничего не найдено.\n\nПопробуйте детальный поиск:`, {
          reply_markup: { inline_keyboard: [[{ text: '🔍 Детальный поиск', callback_data: 'filter_menu' }]] }
        });
        return;
      }
      let resultText = `✅ <b>Найдено ${result.count}:</b>\n\n`;
      result.data.forEach((p: any, i: number) => {
        resultText += formatPropertyCompact(p, i + 1) + '\n\n';
      });
      
      const buttons = result.data.map((p: any, i: number) => ({
        text: `👁 #${i + 1}`,
        callback_data: `detail_${p.id}`
      }));
      
      await sendTelegramMessage(chatId, resultText, {
        reply_markup: {
          inline_keyboard: [
            buttons,
            [{ text: '🔍 Детальный поиск', callback_data: 'filter_menu' }],
            [{ text: '🏠 Главное меню', callback_data: 'back_main' }]
          ]
        }
      });
    }
  }
}

// Send group notification
async function sendGroupNotification(message: string, type: string = 'info') {
  const emoji = type === 'new_listing' ? '🏠' : type === 'alert' ? '⚠️' : type === 'promo' ? '🎉' : 'ℹ️';
  return await sendTelegramMessage(GROUP_CHAT_ID, `${emoji} <b>Saigon Properties</b>\n\n${message}`);
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return new Response(JSON.stringify({ error: 'Bot not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const url = new URL(req.url);

    if (url.searchParams.get('action') === 'send_group_message') {
      const { message, type } = await req.json();
      if (!message) return new Response(JSON.stringify({ error: 'Message required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const result = await sendGroupNotification(message, type);
      return new Response(JSON.stringify({ ok: true, result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const update: TelegramUpdate = await req.json();
    console.log('Update:', JSON.stringify(update));

    if (update.callback_query) {
      await handleCallback(update.callback_query);
    } else if (update.message) {
      await handleMessage(update.message);
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});