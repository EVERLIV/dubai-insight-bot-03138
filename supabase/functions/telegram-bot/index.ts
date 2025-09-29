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
    console.log('Searching properties with query:', query);
    
    // Parse search query for parameters
    const searchParams = parseSearchQuery(query);
    console.log('Parsed search params:', searchParams);
    
// Use the property-search edge function for better results
    const { data: response, error } = await supabase.functions.invoke('property-search', {
      body: {
        telegram_user_id: 0, // Default user ID for telegram searches
        purpose: searchParams.purpose,
        min_price: searchParams.minPrice,
        max_price: searchParams.maxPrice,
        property_type: searchParams.propertyType,
        location: searchParams.location,
        min_bedrooms: searchParams.bedrooms,
        max_bedrooms: null,
        limit: 10,
        query: query
      }
    });

    if (error) {
      console.error('Property search API error:', error);
      return [];
    }

    const data = response?.properties || [];


    console.log(`Found ${data?.length || 0} properties`);

    // Generate unique IDs and store mapping
    const results = (data || []).map((property: any) => {
      const uniqueId = generatePropertyID();
      const propertyWithId = {
        ...property,
        unique_id: uniqueId
      };
      propertyIdMapping.set(uniqueId, propertyWithId);
      return propertyWithId;
    });

    return results;
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
    `${property.bedrooms}BR` : '';
  
  const areaDisplay = property.area_sqft ? 
    `${property.area_sqft} кв.фт` : '';

  const sourceDisplay = property.source_category === 'api' ? '✅ Bayut API' : '📋 Проверяется';
  
  const imageDisplay = property.images && property.images.length > 0 ? 
    `📸 ${property.images.length} фото` : '';

  const purposeDisplay = property.purpose === 'for-sale' ? 'Продажа' : 'Аренда';
  const statusDisplay = property.housing_status === 'primary' ? '🆕 Первичное' : '🏗️ Вторичное';

  return `
🏢 <b>${property.title}</b>
💰 ${priceDisplay}
📍 ${property.location_area || 'Дубай'}
🏠 ${property.property_type || 'Тип не указан'} • ${bedroomsDisplay}
🎯 Назначение: ${purposeDisplay} • ${statusDisplay}
${imageDisplay}
${areaDisplay ? `📐 ${areaDisplay}` : ''}
${sourceDisplay}
🆔 <b>ID: ${property.unique_id}</b>
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
    console.log('Bot commands setup result:', result);
  } catch (error) {
    console.error('Error setting up bot commands:', error);
  }
}

async function handleCallbackQuery(update: TelegramUpdate) {
  if (!update.callback_query) return;

  const chatId = update.callback_query.message.chat.id;
  const data = update.callback_query.data;

  console.log(`Handling callback query: ${data}`);

  if (data === 'main_menu') {
    await sendTelegramMessage(chatId, 
      '🏗️ <b>Dubai Invest Bot - Главное меню</b>\n\nВыберите действие:',
      {
        inline_keyboard: [
          [
            { text: '🔍 Поиск недвижимости', callback_data: 'search_menu' },
            { text: '💰 Оценка стоимости', callback_data: 'valuation_menu' }
          ],
          [
            { text: '📊 Рыночная аналитика', callback_data: 'analytics_menu' },
            { text: '🏗️ Застройщики', callback_data: 'developers_menu' }
          ],
          [
            { text: '⚙️ Настройки', callback_data: 'settings_menu' },
            { text: '📞 Контакты', callback_data: 'contacts' }
          ],
          [
            { text: '❓ Помощь', callback_data: 'help' }
          ]
        ]
      }
    );
  } else if (data === 'search_menu') {
    await sendTelegramMessage(chatId, 
      '🔍 <b>Поиск недвижимости</b>\n\n' +
      '💬 <b>Просто напишите что ищете!</b>\n\n' +
      '📝 Примеры запросов:\n' +
      '• "2 комнаты в Marina для аренды"\n' +
      '• "квартира в Downtown до 2 млн AED"\n' +
      '• "студия в JBR для покупки"\n' +
      '• "вилла в Palm Jumeirah"\n' +
      '• "пентхаус в Business Bay"\n\n' +
      '🔍 Или выберите готовый фильтр:',
      {
        inline_keyboard: [
          [
            { text: '🏠 Квартиры для аренды', callback_data: 'quick_search_rent_apt' },
            { text: '🏢 Квартиры для покупки', callback_data: 'quick_search_buy_apt' }
          ],
          [
            { text: '🏖️ Недвижимость у моря', callback_data: 'quick_search_waterfront' },
            { text: '🏙️ В центре города', callback_data: 'quick_search_downtown' }
          ],
          [
            { text: '💬 Включить чат поиск', callback_data: 'enable_search_chat' }
          ],
          [
            { text: '🔙 Назад', callback_data: 'main_menu' }
          ]
        ]
      }
    );
  } else if (data === 'enable_search_chat') {
    await sendTelegramMessage(chatId,
      '💬 <b>Чат поиск включен!</b>\n\n' +
      '🔍 Теперь просто напишите что ищете и я найду подходящие варианты.\n\n' +
      '📝 <b>Примеры запросов:</b>\n' +
      '• "2 комнаты в Marina для аренды"\n' +
      '• "квартира в Downtown до 2 млн AED"\n' +
      '• "студия в JBR"\n' +
      '• "вилла в Emirates Hills"\n' +
      '• "пентхаус с видом на море"\n\n' +
      '🆔 <b>Детальная информация:</b>\n' +
      'Введите 5-значный ID объекта для получения полного анализа\n\n' +
      '✨ <b>Начните писать ваш запрос прямо сейчас!</b>',
      {
        inline_keyboard: [
          [
            { text: '🏠 Главное меню', callback_data: 'main_menu' }
          ]
        ]
      }
    );
  } else if (data === 'search_sale') {
    console.log('Searching for properties for sale');
    // Call property-search for sale properties
    const { data: searchResponse, error: searchError } = await supabase.functions.invoke('property-search', {
      body: {
        telegram_user_id: update.callback_query.from.id,
        purpose: 'for-sale',
        limit: 10
      }
    });

    console.log('Search response received:', searchResponse?.properties?.length, 'properties');

    if (searchError) {
      console.error('Property search API error:', searchError);
      await sendTelegramMessage(chatId, 
        '❌ Ошибка поиска. Попробуйте позже.',
        {
          inline_keyboard: [
            [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
          ]
        }
      );
      return;
    }

    const properties = searchResponse?.properties || [];
    if (properties.length > 0) {
      const propertiesWithIds = properties.map((property: any) => {
        const uniqueId = generatePropertyID();
        const propertyWithId = { ...property, unique_id: uniqueId };
        propertyIdMapping.set(uniqueId, propertyWithId);
        return propertyWithId;
      });

      let responseText = `🏠 <b>Недвижимость на продажу</b>\n\n📋 Найдено ${propertiesWithIds.length} объектов:\n\n`;
      propertiesWithIds.forEach((property: Property, index: number) => {
        responseText += `${index + 1}. ${formatPropertyDisplay(property)}\n\n`;
      });
      responseText += '\n💡 Данные с Bayut API';
      
      await sendTelegramMessage(chatId, responseText, {
        inline_keyboard: [
          [
            { text: '📊 Аналитика', callback_data: 'analytics_menu' },
            { text: '🔍 Новый поиск', callback_data: 'search_menu' }
          ],
          [
            { text: '🏠 Главное меню', callback_data: 'main_menu' }
          ]
        ]
      });
    } else {
      await sendTelegramMessage(chatId, 
        '❌ Недвижимость для продажи не найдена.',
        {
          inline_keyboard: [
            [
              { text: '🔍 Попробовать еще', callback_data: 'search_menu' },
              { text: '🏠 Главное меню', callback_data: 'main_menu' }
            ]
          ]
        }
      );
    }
  } else if (data === 'search_rent') {
    console.log('Searching for properties for rent');
    // Call property-search for rent properties
    const { data: searchResponse, error: searchError } = await supabase.functions.invoke('property-search', {
      body: {
        telegram_user_id: update.callback_query.from.id,
        purpose: 'for-rent',
        limit: 10
      }
    });

    if (searchError) {
      console.error('Property search API error:', searchError);
      await sendTelegramMessage(chatId, 
        '❌ Ошибка поиска. Попробуйте позже.',
        {
          inline_keyboard: [
            [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
          ]
        }
      );
      return;
    }

    const properties = searchResponse?.properties || [];
    if (properties.length > 0) {
      const propertiesWithIds = properties.map((property: any) => {
        const uniqueId = generatePropertyID();
        const propertyWithId = { ...property, unique_id: uniqueId };
        propertyIdMapping.set(uniqueId, propertyWithId);
        return propertyWithId;
      });

      let responseText = `🏠 <b>Недвижимость в аренду</b>\n\n📋 Найдено ${propertiesWithIds.length} объектов:\n\n`;
      propertiesWithIds.forEach((property: Property, index: number) => {
        responseText += `${index + 1}. ${formatPropertyDisplay(property)}\n\n`;
      });
      responseText += '\n💡 Данные с Bayut API';
      
      await sendTelegramMessage(chatId, responseText, {
        inline_keyboard: [
          [
            { text: '📊 Аналитика', callback_data: 'analytics_menu' },
            { text: '🔍 Новый поиск', callback_data: 'search_menu' }
          ],
          [
            { text: '🏠 Главное меню', callback_data: 'main_menu' }
          ]
        ]
      });
    } else {
      await sendTelegramMessage(chatId, 
        '❌ Недвижимость для аренды не найдена.',
        {
          inline_keyboard: [
            [
              { text: '🔍 Попробовать еще', callback_data: 'search_menu' },
              { text: '🏠 Главное меню', callback_data: 'main_menu' }
            ]
          ]
        }
      );
    }
  } else if (data === 'quick_search_rent_apt') {
    // Call property-search for rent apartments
    const { data: searchResponse } = await supabase.functions.invoke('property-search', {
      body: {
        telegram_user_id: update.callback_query.from.id,
        purpose: 'for-rent',
        property_type: 'Apartment',
        limit: 5
      }
    });

    const properties = searchResponse?.properties || [];
    if (properties.length > 0) {
      const propertiesWithIds = properties.map((property: any) => {
        const uniqueId = generatePropertyID();
        const propertyWithId = { ...property, unique_id: uniqueId };
        propertyIdMapping.set(uniqueId, propertyWithId);
        return propertyWithId;
      });

      let responseText = `🏠 <b>Квартиры для аренды</b>\n\n📋 Найдено ${propertiesWithIds.length} объектов:\n\n`;
      propertiesWithIds.forEach((property: Property, index: number) => {
        responseText += `${index + 1}. ${formatPropertyDisplay(property)}\n\n`;
      });
      responseText += '\n💡 Данные с Bayut API';
      
      await sendTelegramMessage(chatId, responseText, {
        inline_keyboard: [
          [{ text: '🔍 Искать еще', callback_data: 'search_menu' }],
          [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
        ]
      });
    }
  } else if (data === 'quick_search_buy_apt') {
    // Call property-search for buy apartments
    const { data: searchResponse } = await supabase.functions.invoke('property-search', {
      body: {
        telegram_user_id: update.callback_query.from.id,
        purpose: 'for-sale',
        property_type: 'Apartment',
        limit: 5
      }
    });

    const properties = searchResponse?.properties || [];
    if (properties.length > 0) {
      const propertiesWithIds = properties.map((property: any) => {
        const uniqueId = generatePropertyID();
        const propertyWithId = { ...property, unique_id: uniqueId };
        propertyIdMapping.set(uniqueId, propertyWithId);
        return propertyWithId;
      });

      let responseText = `🏢 <b>Квартиры для покупки</b>\n\n📋 Найдено ${propertiesWithIds.length} объектов:\n\n`;
      propertiesWithIds.forEach((property: Property, index: number) => {
        responseText += `${index + 1}. ${formatPropertyDisplay(property)}\n\n`;
      });
      responseText += '\n💡 Данные с Bayut API';
      
      await sendTelegramMessage(chatId, responseText, {
        inline_keyboard: [
          [{ text: '🔍 Искать еще', callback_data: 'search_menu' }],
          [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
        ]
      });
    }
  } else if (data === 'quick_search_waterfront') {
    // Call property-search for waterfront properties
    const { data: searchResponse } = await supabase.functions.invoke('property-search', {
      body: {
        telegram_user_id: update.callback_query.from.id,
        location: 'JBR',
        limit: 5
      }
    });

    const properties = searchResponse?.properties || [];
    if (properties.length > 0) {
      const propertiesWithIds = properties.map((property: any) => {
        const uniqueId = generatePropertyID();
        const propertyWithId = { ...property, unique_id: uniqueId };
        propertyIdMapping.set(uniqueId, propertyWithId);
        return propertyWithId;
      });

      let responseText = `🏖️ <b>Недвижимость у моря</b>\n\n📋 Найдено ${propertiesWithIds.length} объектов:\n\n`;
      propertiesWithIds.forEach((property: Property, index: number) => {
        responseText += `${index + 1}. ${formatPropertyDisplay(property)}\n\n`;
      });
      responseText += '\n💡 Данные с Bayut API';
      
      await sendTelegramMessage(chatId, responseText, {
        inline_keyboard: [
          [{ text: '🔍 Искать еще', callback_data: 'search_menu' }],
          [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
        ]
      });
    }
  } else if (data === 'quick_search_downtown') {
    // Call property-search for downtown properties
    const { data: searchResponse } = await supabase.functions.invoke('property-search', {
      body: {
        telegram_user_id: update.callback_query.from.id,
        location: 'Downtown',
        limit: 5
      }
    });

    const properties = searchResponse?.properties || [];
    if (properties.length > 0) {
      const propertiesWithIds = properties.map((property: any) => {
        const uniqueId = generatePropertyID();
        const propertyWithId = { ...property, unique_id: uniqueId };
        propertyIdMapping.set(uniqueId, propertyWithId);
        return propertyWithId;
      });

      let responseText = `🏙️ <b>Недвижимость в центре</b>\n\n📋 Найдено ${propertiesWithIds.length} объектов:\n\n`;
      propertiesWithIds.forEach((property: Property, index: number) => {
        responseText += `${index + 1}. ${formatPropertyDisplay(property)}\n\n`;
      });
      responseText += '\n💡 Данные с Bayut API';
      
      await sendTelegramMessage(chatId, responseText, {
        inline_keyboard: [
          [{ text: '🔍 Искать еще', callback_data: 'search_menu' }],
          [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
        ]
      });
    }
  } else if (data === 'help') {
    await sendTelegramMessage(chatId,
      '❓ <b>Помощь - Dubai Invest Bot</b>\n\n' +
      
      '🔍 <b>Поиск недвижимости:</b>\n' +
      '• Просто напишите что ищете текстом\n' +
      '• Используйте готовые фильтры в меню\n' +
      '• Примеры: "2BR Marina rent", "villa Downtown"\n\n' +
      
      '🆔 <b>Детальная информация:</b>\n' +
      '• Введите 5-значный ID объекта\n' +
      '• Получите полный анализ и прогноз\n\n' +
      
      '💰 <b>Оценка стоимости:</b>\n' +
      '• AVM система автоматической оценки\n' +
      '• Анализ рыночных трендов\n\n' +
      
      '📊 <b>Аналитика:</b>\n' +
      '• Рыночные тренды в реальном времени\n' +
      '• Прогнозы цен по районам\n\n' +
      
      '🏗️ <b>Застройщики:</b>\n' +
      '• Информация о топ девелоперах\n' +
      '• Новые проекты и акции\n\n' +
      
      '📞 <b>Поддержка:</b>\n' +
      'Если возникли вопросы - напишите @DubaiPropertySupport',
      {
        inline_keyboard: [
          [
            { text: '💬 Включить чат поиск', callback_data: 'enable_search_chat' }
          ],
          [
            { text: '🔍 Попробовать поиск', callback_data: 'search_menu' }
          ],
          [
            { text: '🏠 Главное меню', callback_data: 'main_menu' }
          ]
        ]
      }
    );
  }
}

async function handleMessage(update: TelegramUpdate) {
  const message = update.message;
  if (!message || !message.text) return;

  const chatId = message.chat.id;
  const messageText = message.text.trim();

  console.log(`Received message: ${messageText}`);

  // Handle commands
  if (messageText.startsWith('/')) {
    await handleCommand(chatId, messageText);
    return;
  }

  // Check if user entered a property ID
  if (/^\d{5}$/.test(messageText)) {
    const propertyDetails = await getPropertyDetails(messageText);
    await sendTelegramMessage(chatId, propertyDetails, {
      inline_keyboard: [
        [
          { text: '🔍 Новый поиск', callback_data: 'search_menu' },
          { text: '🏠 Главное меню', callback_data: 'main_menu' }
        ]
      ]
    });
    return;
  }

  // Handle natural language property search
  console.log('Processing natural language search query');
  const properties = await searchProperties(messageText);

  if (properties.length === 0) {
    await sendTelegramMessage(chatId, 
      '❌ По вашему запросу недвижимость не найдена.\n\n' +
      '💡 Попробуйте изменить параметры поиска:\n' +
      '• Укажите другой район (Marina, Downtown, JBR)\n' +
      '• Измените тип недвижимости (студия, квартира, вилла)\n' +
      '• Укажите другой бюджет или количество комнат\n\n' +
      '📝 Примеры запросов:\n' +
      '• "2 комнаты в Marina для аренды"\n' +
      '• "квартира в Downtown до 2 млн"\n' +
      '• "студия в JBR для покупки"\n' +
      '• "вилла в Palm Jumeirah"',
      {
        inline_keyboard: [
          [
            { text: '💬 Включить чат поиск', callback_data: 'enable_search_chat' }
          ],
          [
            { text: '🔍 Попробовать другой запрос', callback_data: 'search_menu' },
            { text: '💡 Примеры поиска', callback_data: 'search_examples' }
          ],
          [
            { text: '🏠 Главное меню', callback_data: 'main_menu' }
          ]
        ]
      }
    );
    return;
  }

  // Format and send results
  let responseText = `🔍 <b>Результаты поиска</b>\n\n📋 <b>Найдено ${properties.length} объектов:</b>\n\n`;
  
  properties.forEach((property, index) => {
    responseText += `${index + 1}. ${formatPropertyDisplay(property)}\n\n`;
  });

  responseText += '\n💡 Поиск по актуальной базе недвижимости Дубая';

  await sendTelegramMessage(chatId, responseText, {
    inline_keyboard: [
      [
        { text: '🔍 Искать еще', callback_data: 'search_menu' },
        { text: '📊 Аналитика', callback_data: 'analytics_menu' }
      ],
      [
        { text: '💬 Включить чат поиск', callback_data: 'enable_search_chat' }
      ],
      [
        { text: '🏠 Главное меню', callback_data: 'main_menu' }
      ]
    ]
  });
}

async function handleCommand(chatId: number, command: string) {
  if (command === '/start') {
    await sendTelegramMessage(chatId,
      '🏗️ <b>Добро пожаловать в Dubai Invest Bot!</b>\n\n' +
      'Я ваш персональный консультант по недвижимости в Дубае с доступом к реальной базе данных и системой автоматической оценки. \n\n' +
      '💼 <b>Мои возможности:</b>\n' +
      '• 🔍 Поиск недвижимости для покупки и аренды\n' +
      '• 💰 Автоматическая оценка стоимости (AVM)\n' +
      '• 📊 Анализ рынка и трендов в реальном времени\n' +
      '• 📰 Анализ новостей и их влияние на цены\n' +
      '• 💡 Советы по инвестициям\n' +
      '• 📍 Информация о районах Дубая\n' +
      '• 🏗️ Топ застройщиков и их проекты\n\n' +
      '🎯 <b>Используйте кнопки меню для быстрого доступа!</b>\n\n' +
      '✨ Или просто опишите что ищете текстом!',
      {
        inline_keyboard: [
          [
            { text: '🔍 Поиск недвижимости', callback_data: 'search_menu' },
            { text: '💰 Оценка стоимости', callback_data: 'valuation_menu' }
          ],
          [
            { text: '📊 Рыночная аналитика', callback_data: 'analytics_menu' },
            { text: '🏗️ Застройщики', callback_data: 'developers_menu' }
          ],
          [
            { text: '⚙️ Настройки', callback_data: 'settings_menu' },
            { text: '📞 Контакты', callback_data: 'contacts' }
          ],
          [
            { text: '❓ Помощь', callback_data: 'help' }
          ]
        ]
      }
    );
  } else if (command === '/help') {
    await sendTelegramMessage(chatId,
      '❓ <b>Помощь - Dubai Invest Bot</b>\n\n' +
      '💬 <b>Поиск недвижимости:</b>\n' +
      'Просто напишите что ищете. Примеры:\n' +
      '• "2 комнаты в Marina для аренды"\n' +
      '• "квартира в Downtown до 2 млн AED"\n' +
      '• "вилла в Palm Jumeirah"\n\n' +
      '🆔 <b>Детальная информация:</b>\n' +
      'Введите 5-значный ID объекта для полного анализа\n\n' +
      '📋 <b>Команды:</b>\n' +
      '/search - быстрый поиск\n' +
      '/analytics - аналитика рынка\n' +
      '/help - эта справка'
    );
  } else if (command === '/search') {
    await sendTelegramMessage(chatId,
      '🔍 <b>Поиск недвижимости</b>\n\n' +
      '💬 Просто напишите что ищете!\n\n' +
      'Примеры запросов:\n' +
      '• "2 комнаты в Marina для аренды"\n' +
      '• "квартира в Downtown до 2 млн"\n' +
      '• "студия в JBR"\n' +
      '• "вилла в Palm Jumeirah"\n\n' +
      'Или используйте быстрые кнопки ниже:',
      {
        inline_keyboard: [
          [
            { text: '🏠 Квартиры аренда', callback_data: 'search_rent' },
            { text: '🏢 Квартиры покупка', callback_data: 'search_sale' }
          ],
          [
            { text: '🏖️ У моря', callback_data: 'quick_search_waterfront' },
            { text: '🏙️ Центр города', callback_data: 'quick_search_downtown' }
          ],
          [
            { text: '🏠 Главное меню', callback_data: 'main_menu' }
          ]
        ]
      }
    );
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Setup bot commands on first run
    await setupBotCommands();

    const update: TelegramUpdate = await req.json();
    console.log('Received update:', JSON.stringify(update, null, 2));

    if (update.callback_query) {
      await handleCallbackQuery(update);
    } else if (update.message) {
      await handleMessage(update);
    }

    return new Response('OK', { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Error handling update:', error);
    return new Response('Error', { status: 500, headers: corsHeaders });
  }
});