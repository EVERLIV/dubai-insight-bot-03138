import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
    message: any;
    data: string;
  };
}

interface Property {
  id: string;
  title: string;
  price: number;
  location_area: string;
  property_type: string;
  purpose: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqft?: number;
  source_name?: string;
  source_category?: string;
  images?: string[];
  agent_name?: string;
  agent_phone?: string;
  housing_status?: string;
  unique_id?: string;
}

// Generate unique 5-digit property ID
function generatePropertyID(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// Store property ID mapping in memory (for demo purposes)
const propertyIdMapping = new Map<string, Property>();

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: any) {
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
      reply_markup: replyMarkup,
    }),
  });

  return response.json();
}

// Search properties in database
async function searchProperties(query: string): Promise<Property[]> {
  try {
    // Parse search query for parameters
    const searchParams = parseSearchQuery(query);
    
    // Search in both API and scraped properties
    const { data: apiData, error: apiError } = await supabase.rpc('search_properties', {
      search_purpose: searchParams.purpose,
      min_price_param: searchParams.minPrice,
      max_price_param: searchParams.maxPrice,
      property_type_param: searchParams.propertyType,
      location_param: searchParams.location,
      min_bedrooms_param: searchParams.bedrooms,
      max_bedrooms_param: null,
      housing_status_param: null,
      limit_param: 5
    });

    const { data: scrapedData, error: scrapedError } = await supabase.rpc('search_scraped_properties', {
      search_purpose: searchParams.purpose,
      min_price_param: searchParams.minPrice,
      max_price_param: searchParams.maxPrice,
      property_type_param: searchParams.propertyType,
      location_param: searchParams.location,
      min_bedrooms_param: searchParams.bedrooms,
      max_bedrooms_param: null,
      source_type_param: null,
      housing_status_param: null,
      limit_param: 8
    });

    if (apiError) console.error('API search error:', apiError);
    if (scrapedError) console.error('Scraped search error:', scrapedError);

    // Combine results with preference for API data
    const apiResults = (apiData || []).map((item: any) => ({
      ...item,
      source_category: 'api'
    }));

    const scrapedResults = (scrapedData || []).map((item: any) => ({
      ...item,
      source_category: 'scraped'
    }));

    const allResults = [...apiResults, ...scrapedResults];

    // Generate unique IDs and store mapping
    allResults.forEach(property => {
      if (!property.unique_id) {
        const uniqueId = generatePropertyID();
        property.unique_id = uniqueId;
        propertyIdMapping.set(uniqueId, property);
      }
    });

    return allResults.slice(0, 10); // Limit to 10 results
  } catch (error) {
    console.error('Error searching properties:', error);
    return [];
  }
}

// Parse natural language search query
function parseSearchQuery(query: string): any {
  const lowerQuery = query.toLowerCase();
  
  const params: any = {
    purpose: null,
    propertyType: null,
    location: null,
    bedrooms: null,
    minPrice: null,
    maxPrice: null
  };

  // Parse purpose (rent/sale)
  if (lowerQuery.includes('аренд') || lowerQuery.includes('rent')) {
    params.purpose = 'for-rent';
  } else if (lowerQuery.includes('купить') || lowerQuery.includes('покупк') || lowerQuery.includes('sale')) {
    params.purpose = 'for-sale';
  }

  // Parse property type
  if (lowerQuery.includes('студи') || lowerQuery.includes('studio')) {
    params.propertyType = 'Studio';
  } else if (lowerQuery.includes('квартир') || lowerQuery.includes('apartment')) {
    params.propertyType = 'Apartment';
  } else if (lowerQuery.includes('вилл') || lowerQuery.includes('villa')) {
    params.propertyType = 'Villa';
  } else if (lowerQuery.includes('таунхаус') || lowerQuery.includes('townhouse')) {
    params.propertyType = 'Townhouse';
  } else if (lowerQuery.includes('пентхаус') || lowerQuery.includes('penthouse')) {
    params.propertyType = 'Penthouse';
  }

  // Parse location
  const locations = [
    'marina', 'марина', 'downtown', 'даунтаун', 'jbr', 'business bay', 'бизнес бей',
    'palm jumeirah', 'палм джумейра', 'jlt', 'emirates hills', 'dubai hills'
  ];
  
  for (const location of locations) {
    if (lowerQuery.includes(location.toLowerCase())) {
      params.location = location.includes('marina') ? 'Dubai Marina' : 
                       location.includes('downtown') ? 'Downtown Dubai' :
                       location.includes('jbr') ? 'JBR' :
                       location.includes('business') ? 'Business Bay' :
                       location.includes('palm') ? 'Palm Jumeirah' :
                       location.includes('jlt') ? 'JLT' :
                       location.includes('emirates') ? 'Emirates Hills' :
                       location.includes('dubai hills') ? 'Dubai Hills' : location;
      break;
    }
  }

  // Parse bedrooms
  const bedroomMatch = lowerQuery.match(/(\d+)\s*(комнат|br|bedroom)/);
  if (bedroomMatch) {
    params.bedrooms = parseInt(bedroomMatch[1]);
  }

  // Parse price range
  const priceMatch = lowerQuery.match(/(\d+)[k|к]\s*(aed|eur|usd|\$|€)/);
  if (priceMatch) {
    const amount = parseInt(priceMatch[1]) * 1000;
    if (params.purpose === 'for-rent') {
      params.maxPrice = amount * 1.2; // Allow 20% buffer for rent
    } else {
      params.maxPrice = amount * 1.1; // Allow 10% buffer for purchase
    }
  }

  return params;
}

// Format property for display
function formatPropertyDisplay(property: Property): string {
  const priceDisplay = property.price ? 
    `${property.price.toLocaleString()} AED` : 'Цена по запросу';
  
  const bedroomsDisplay = property.bedrooms !== undefined ? 
    `${property.bedrooms} спален` : '';
  
  const areaDisplay = property.area_sqft ? 
    `${property.area_sqft} кв.фт` : '';

  const sourceDisplay = property.source_category === 'api' ? '✅ Верифицировано' : '📋 Проверяется';

  return `
🏢 <b>${property.title}</b>
💰 ${priceDisplay}
📍 ${property.location_area || 'Дубай'}
🏠 ${property.property_type || 'Недвижимость'}
${bedroomsDisplay ? `🛏️ ${bedroomsDisplay}` : ''}
${areaDisplay ? `📐 ${areaDisplay}` : ''}
${sourceDisplay}

🆔 <b>ID: ${property.unique_id}</b>
<i>Введите ID для подробной информации</i>
  `.trim();
}

// Get detailed property information by ID
async function getPropertyDetails(propertyId: string): Promise<string> {
  const property = propertyIdMapping.get(propertyId);
  
  if (!property) {
    return '❌ Объект с таким ID не найден. Проверьте правильность ввода.';
  }

  try {
    // Get district analysis
    const districtAnalysis = await getDistrictAnalysis(property.location_area);
    
    // Calculate investment metrics
    const investmentMetrics = calculateInvestmentMetrics(property);
    
    // Generate AI-powered description
    const aiDescription = await generatePropertyAnalysis(property);

    return `
🏢 <b>ДЕТАЛЬНАЯ ИНФОРМАЦИЯ</b>
━━━━━━━━━━━━━━━━━━━━━━━━

<b>${property.title}</b>

💰 <b>ЦЕНА:</b> ${property.price?.toLocaleString() || 'По запросу'} AED
📍 <b>РАЙОН:</b> ${property.location_area || 'Дубай'}
🏠 <b>ТИП:</b> ${property.property_type || 'Недвижимость'}
🎯 <b>НАЗНАЧЕНИЕ:</b> ${property.purpose === 'for-rent' ? 'Аренда' : 'Продажа'}

${property.bedrooms !== undefined ? `🛏️ <b>СПАЛЬНИ:</b> ${property.bedrooms}\n` : ''}${property.bathrooms ? `🚿 <b>ВАННЫЕ:</b> ${property.bathrooms}\n` : ''}${property.area_sqft ? `📐 <b>ПЛОЩАДЬ:</b> ${property.area_sqft} кв.фт\n` : ''}
${property.housing_status ? `🏗️ <b>СТАТУС:</b> ${property.housing_status === 'primary' ? 'Новостройка' : 'Вторичный рынок'}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━

📊 <b>ИНВЕСТИЦИОННЫЙ АНАЛИЗ</b>
${investmentMetrics}

━━━━━━━━━━━━━━━━━━━━━━━━

🏙️ <b>АНАЛИЗ РАЙОНА</b>
${districtAnalysis}

━━━━━━━━━━━━━━━━━━━━━━━━

🤖 <b>AI АНАЛИЗ ОБЪЕКТА</b>
${aiDescription}

━━━━━━━━━━━━━━━━━━━━━━━━

${property.agent_name ? `👨‍💼 <b>АГЕНТ:</b> ${property.agent_name}\n` : ''}${property.agent_phone ? `📞 <b>ТЕЛЕФОН:</b> ${property.agent_phone}\n` : ''}
🆔 <b>ID:</b> ${property.unique_id}
📊 <b>ИСТОЧНИК:</b> ${property.source_name || 'База данных'}
    `.trim();

  } catch (error) {
    console.error('Error getting property details:', error);
    return '❌ Ошибка при получении детальной информации. Попробуйте позже.';
  }
}

// Calculate investment metrics
function calculateInvestmentMetrics(property: Property): string {
  if (!property.price) {
    return 'Данные для расчета недоступны';
  }

  const price = property.price;
  
  // Estimate rental yield based on area and type
  let estimatedMonthlyRent = 0;
  
  if (property.purpose === 'for-sale') {
    // Estimate rental income based on Dubai market rates
    if (property.location_area?.includes('Marina')) {
      estimatedMonthlyRent = price * 0.006; // 7.2% annual yield
    } else if (property.location_area?.includes('Downtown')) {
      estimatedMonthlyRent = price * 0.0055; // 6.6% annual yield  
    } else if (property.location_area?.includes('Business Bay')) {
      estimatedMonthlyRent = price * 0.007; // 8.4% annual yield
    } else {
      estimatedMonthlyRent = price * 0.006; // 7.2% average yield
    }
    
    const annualRent = estimatedMonthlyRent * 12;
    const roi = (annualRent / price) * 100;
    const paybackPeriod = price / annualRent;
    
    return `
💹 <b>Расчетная доходность:</b> ${roi.toFixed(1)}% годовых
💰 <b>Потенциальная аренда:</b> ${estimatedMonthlyRent.toLocaleString()} AED/мес
⏱️ <b>Срок окупаемости:</b> ${paybackPeriod.toFixed(1)} лет
📈 <b>Годовой доход:</b> ${annualRent.toLocaleString()} AED
    `.trim();
  } else {
    // For rental properties, calculate as investment
    const monthlyRent = price;
    const annualRent = monthlyRent * 12;
    const estimatedValue = annualRent / 0.07; // Assume 7% yield
    
    return `
💰 <b>Месячная аренда:</b> ${monthlyRent.toLocaleString()} AED
📈 <b>Годовая стоимость:</b> ${annualRent.toLocaleString()} AED
💎 <b>Расчетная стоимость объекта:</b> ${estimatedValue.toLocaleString()} AED
📊 <b>Соотношение цена/доход:</b> ${(estimatedValue / annualRent).toFixed(1)}
    `.trim();
  }
}

// Get district analysis
async function getDistrictAnalysis(district: string): Promise<string> {
  const districtInfo: { [key: string]: string } = {
    'Dubai Marina': `
🌊 <b>Престижный морской район</b>
• Высотные башни и яхт-клубы
• Развитая инфраструктура
• Прогнозируемый рост: +12-15% в год
• Средняя доходность: 6.5-7.5%
• Идеально для инвестиций в краткосрочную аренду`,
    
    'Downtown Dubai': `
🏙️ <b>Деловой центр города</b>
• Рядом с Burj Khalifa и Dubai Mall
• Премиальная локация
• Прогнозируемый рост: +18-22% в год  
• Средняя доходность: 6-7%
• Высокий потенциал роста стоимости`,
    
    'Business Bay': `
💼 <b>Быстрорастущий бизнес-район</b>
• Новые башни и офисы
• Отличная транспортная доступность
• Прогнозируемый рост: +15-20% в год
• Средняя доходность: 7.5-9%
• Лучший выбор для высокой доходности`,
    
    'JBR': `
🏖️ <b>Туристический район у пляжа</b>
• Непосредственно у моря
• Туристическая зона
• Прогнозируемый рост: +10-14% в год
• Средняя доходность: 7-8%
• Идеально для краткосрочной аренды туристам`,
    
    'Palm Jumeirah': `
🌴 <b>Эксклюзивный искусственный остров</b>
• Уникальная локация
• Люксовая недвижимость
• Прогнозируемый рост: +20-25% в год
• Средняя доходность: 5.5-6.5%
• Максимальный престиж и потенциал роста`
  };

  return districtInfo[district] || `
📍 <b>${district}</b>
• Развивающийся район Дубая
• Хорошие перспективы роста
• Прогнозируемый рост: +10-15% в год
• Средняя доходность: 6.5-8%
• Стабильные инвестиционные возможности`;
}

// Generate AI-powered property analysis
async function generatePropertyAnalysis(property: Property): Promise<string> {
  try {
    const prompt = `Проанализируй недвижимость в Дубае:
Тип: ${property.property_type}
Район: ${property.location_area}
Цена: ${property.price} AED
Назначение: ${property.purpose}
Спальни: ${property.bedrooms || 'не указано'}

Дай краткий анализ (до 200 слов) с точки зрения инвестора: преимущества, риски, прогноз.`;

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
            content: 'Ты эксперт по недвижимости в Дубае. Давай краткие, профессиональные анализы объектов недвижимости.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Анализ временно недоступен';
  } catch (error) {
    console.error('Error generating AI analysis:', error);
    return 'Анализ временно недоступен';
  }
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
      description: "🔍 Поиск недвижимости"
    },
    {
      command: "analytics",
      description: "📊 Аналитика рынка"
    },
    {
      command: "roi",
      description: "💰 ROI калькулятор"
    },
    {
      command: "news",
      description: "📰 Новости рынка"
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

    // Handle callback queries (inline buttons)
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const chatId = callbackQuery.message.chat.id;
      const data = callbackQuery.data;

      if (data === 'search_more') {
        const searchMessage = `
🔍 <b>Новый поиск недвижимости</b>

Опишите что вы ищете:

💡 <b>Примеры запросов:</b>
• "студия в аренду в Marina до 60k"  
• "2 комнаты для покупки в Downtown"
• "вилла в Emirates Hills до 5M"
• "квартира в Business Bay"

✨ Просто напишите ваши требования!
        `;
        await sendTelegramMessage(chatId, searchMessage);
      }

      return new Response('OK', { status: 200 });
    }

    if (!update.message?.text) {
      return new Response('OK', { status: 200 });
    }

    const { message } = update;
    const userQuery = message.text;
    const chatId = message.chat.id;

    if (!userQuery) {
      return new Response('OK', { status: 200 });
    }

    // Setup bot commands on first request
    await setupBotCommands();

    // Check if it's a property ID (5 digits)
    const propertyIdMatch = userQuery.match(/^\s*(\d{5})\s*$/);
    if (propertyIdMatch) {
      const propertyId = propertyIdMatch[1];
      const detailedInfo = await getPropertyDetails(propertyId);
      await sendTelegramMessage(chatId, detailedInfo);
      return new Response('OK', { status: 200 });
    }

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

🔍 <b>Умный поиск:</b>
Просто напишите что ищете: "студия в Marina до 60k" или "2BR Downtown для покупки"

🆔 <b>Детальная информация:</b> 
Получите 5-значный ID объекта и введите его для полного анализа с прогнозами

✨ Начните с поиска или выберите команду из меню!

📋 <b>Доступные команды:</b>
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

<b>🔍 Умный поиск недвижимости:</b>
Просто опишите что ищете:
• "студия в аренду в Marina до 60k"
• "2 комнаты Downtown для покупки" 
• "вилла в Emirates Hills"

<b>🆔 Получение детальной информации:</b>
1. Найдите объект через поиск
2. Получите 5-значный ID
3. Введите ID для полного анализа

<b>📋 Команды бота:</b>
🔍 /search - Поиск недвижимости
📊 /analytics - Аналитика рынка
💰 /roi - ROI калькулятор  
📰 /news - Новости рынка

💡 <b>Совет:</b> Для лучших результатов указывайте район, тип объекта и бюджет
      `;
      
      await sendTelegramMessage(chatId, helpMessage);
      return new Response('OK', { status: 200 });
    }

    if (userQuery === '/search') {
      const searchMessage = `
🔍 <b>Поиск недвижимости в Дубае</b>

Опишите что вы ищете:

📝 <b>Укажите:</b>
• Тип объекта (квартира, вилла, студия)
• Район или локация
• Бюджет
• Количество комнат
• Цель (покупка/аренда)

💡 <b>Примеры запросов:</b>
"студия в аренду в Marina до 60k AED"
"2 комнаты для покупки в Downtown до 2M"
"вилла в Emirates Hills"
"квартира в Business Bay"

✨ Просто напишите ваши требования!
      `;
      
      await sendTelegramMessage(chatId, searchMessage);
      return new Response('OK', { status: 200 });
    }

    // Handle other commands (analytics, roi, news) as before...
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

    // Check if it's a property search query
    const searchKeywords = ['ищу', 'нужна', 'нужен', 'аренда', 'аренду', 'купить', 'покупка', 'студия', 'квартира', 'вилла', 'marina', 'downtown', 'business bay', 'jbr'];
    const isSearchQuery = searchKeywords.some(keyword => userQuery.toLowerCase().includes(keyword));

    if (isSearchQuery) {
      await sendTelegramMessage(chatId, '🔍 Ищу недвижимость по вашим критериям...');
      
      const properties = await searchProperties(userQuery);
      
      if (properties.length > 0) {
        let responseMessage = `
🎯 <b>Найдено ${properties.length} объектов по вашему запросу:</b>

━━━━━━━━━━━━━━━━━━━━━━━━
        `;

        properties.forEach((property, index) => {
          responseMessage += '\n' + formatPropertyDisplay(property);
          if (index < properties.length - 1) {
            responseMessage += '\n━━━━━━━━━━━━━━━━━━━━━━━━';
          }
        });

        responseMessage += `
        
💡 <b>Как получить детальную информацию:</b>
Введите любой ID из списка для получения полного анализа с прогнозом цен, рентабельности и описанием района.
        `;

        const keyboard = {
          inline_keyboard: [[
            {
              text: "🔍 Искать еще",
              callback_data: "search_more"
            }
          ]]
        };

        await sendTelegramMessage(chatId, responseMessage, keyboard);
      } else {
        const noResultsMessage = `
❌ <b>По вашему запросу ничего не найдено</b>

💡 <b>Попробуйте:</b>
• Упростить запрос
• Указать другой район
• Изменить бюджет или тип объекта

<b>Примеры успешных запросов:</b>
"студия в Marina"
"квартира Downtown"
"2 комнаты Business Bay"
        `;

        const keyboard = {
          inline_keyboard: [[
            {
              text: "🔍 Новый поиск",
              callback_data: "search_more"
            }
          ]]
        };

        await sendTelegramMessage(chatId, noResultsMessage, keyboard);
      }
      
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