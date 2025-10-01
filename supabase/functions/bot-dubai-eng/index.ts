import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN_ENG');
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
  created_at?: string;
}

// No need for in-memory mapping - we'll use database IDs directly

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

async function sendTelegramPhoto(
  chatId: number, 
  photoUrl: string, 
  caption: string, 
  replyMarkup?: any
) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
  
  try {
    console.log(`Sending photo to chat ${chatId}, URL: ${photoUrl.substring(0, 100)}...`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: caption,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });

    const result = await response.json();
    
    if (!result.ok) {
      console.error('Telegram photo API error:', JSON.stringify(result));
      // Fallback to text message if photo fails
      console.log('Falling back to text message');
      return sendTelegramMessage(chatId, caption, replyMarkup);
    }
    
    console.log('Photo sent successfully');
    return result;
  } catch (error) {
    console.error('Error sending photo:', error);
    // Fallback to text message if photo fails
    return sendTelegramMessage(chatId, caption, replyMarkup);
  }
}

async function deleteTelegramMessage(chatId: number, messageId: number) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`;
  
  try {
    console.log(`Deleting message ${messageId} from chat ${chatId}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
      }),
    });

    const result = await response.json();
    
    if (!result.ok) {
      console.error('Failed to delete message:', JSON.stringify(result));
    } else {
      console.log('Message deleted successfully');
    }
    
    return result;
  } catch (error) {
    console.error('Error deleting message:', error);
    return null;
  }
}

async function performPropertySearch(
  chatId: number, 
  purpose: string, 
  propertyType?: string, 
  housingStatus?: string,
  limit: number = 5, // Reduced to 5 since we're sending with photos
  headerText?: string
): Promise<void> {
  console.log(`Searching for: purpose=${purpose}, type=${propertyType}, status=${housingStatus}`);
  
  const { data: searchResponse, error: searchError } = await supabase.functions.invoke('property-search', {
    body: {
      telegram_user_id: chatId,
      purpose: purpose,
      property_type: propertyType,
      housing_status: housingStatus,
      limit: limit
    }
  });

  if (searchError) {
    console.error('Property search API error:', searchError);
    await sendTelegramMessage(chatId, 
      '❌ Search error. Please try again later.',
      {
        inline_keyboard: [
          [{ text: '🔍 New Search', callback_data: 'search_menu' }],
          [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
        ]
      }
    );
    return;
  }

  const properties = searchResponse?.properties || [];
  console.log(`Processing ${properties.length} properties for display`);
  
  if (properties.length > 0) {
    // Send header message
    await sendTelegramMessage(chatId, 
      `${headerText || '🏠 <b>Search Results</b>'}\n\n📋 Found ${properties.length} properties:`
    );

    // Send each property as a separate message with photo
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      console.log(`Processing property ${i + 1}/${properties.length}:`, property.title);
      console.log(`Property database ID: ${property.id}`);
      console.log(`Property has unique_id?: ${property.unique_id}`);

      const caption = formatPropertyDisplay(property);
      console.log(`Caption length: ${caption.length}, first 200 chars:`, caption.substring(0, 200));
      
      const photoUrl = property.images && property.images.length > 0 
        ? property.images[0] 
        : 'https://via.placeholder.com/800x600.png?text=No+Image+Available';

      console.log(`Callback data will be: view_${property.id}`);
      
      // Use database ID directly in callback
      await sendTelegramPhoto(
        chatId,
        photoUrl,
        caption,
        {
          inline_keyboard: [
            [{ text: '📊 View Details', callback_data: `view_${property.id}` }]
          ]
        }
      );

      // Small delay between messages to avoid flooding
      if (i < properties.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log('All properties sent successfully');

    // Send final menu message
    await sendTelegramMessage(chatId, 
      '🔍 What would you like to do next?',
      {
        inline_keyboard: [
          [
            { text: '📊 Analytics', callback_data: 'analytics_menu' },
            { text: '🔍 New Search', callback_data: 'search_menu' }
          ],
          [
            { text: '🏠 Main Menu', callback_data: 'main_menu' }
          ]
        ]
      }
    );
  } else {
    await sendTelegramMessage(chatId, 
      '❌ No properties found matching your criteria.\n\n💡 Try changing search parameters.',
      {
        inline_keyboard: [
          [
            { text: '🔍 New Search', callback_data: 'search_menu' },
            { text: '🏠 Main Menu', callback_data: 'main_menu' }
          ]
        ]
      }
    );
  }
}

async function searchProperties(query: string): Promise<Property[]> {
  try {
    console.log('Searching properties with query:', query);
    
    const searchParams = parseSearchQuery(query);
    console.log('Parsed search params:', searchParams);
    
    const { data: response, error } = await supabase.functions.invoke('property-search', {
      body: {
        telegram_user_id: 0,
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

    return data || [];
  } catch (error) {
    console.error('Error searching properties:', error);
    return [];
  }
}

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
  if (lowerQuery.includes('rent') || lowerQuery.includes('rental')) {
    params.purpose = 'for-rent';
  } else if (lowerQuery.includes('buy') || lowerQuery.includes('purchase') || lowerQuery.includes('sale')) {
    params.purpose = 'for-sale';
  }

  // Parse property type
  if (lowerQuery.includes('studio')) {
    params.propertyType = 'Studio';
  } else if (lowerQuery.includes('apartment') || lowerQuery.includes('flat')) {
    params.propertyType = 'Apartment';
  } else if (lowerQuery.includes('villa')) {
    params.propertyType = 'Villa';
  } else if (lowerQuery.includes('townhouse')) {
    params.propertyType = 'Townhouse';
  } else if (lowerQuery.includes('penthouse')) {
    params.propertyType = 'Penthouse';
  }

  // Parse location
  const locations = [
    'marina', 'downtown', 'jbr', 'business bay', 'palm jumeirah', 'jlt', 'emirates hills', 'dubai hills'
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
  const bedroomMatch = lowerQuery.match(/(\d+)\s*(br|bedroom|bed)/);
  if (bedroomMatch) {
    params.bedrooms = parseInt(bedroomMatch[1]);
  }

  // Parse price range
  const priceMatch = lowerQuery.match(/(\d+)[k]\s*(aed|eur|usd|\$|€)/);
  if (priceMatch) {
    const amount = parseInt(priceMatch[1]) * 1000;
    if (params.purpose === 'for-rent') {
      params.maxPrice = amount * 1.2;
    } else {
      params.maxPrice = amount * 1.1;
    }
  }

  return params;
}

function formatPropertyDisplay(property: Property): string {
  const priceDisplay = property.price ? 
    `${property.price.toLocaleString()} AED` : 'Price on request';
  
  const bedroomsDisplay = property.bedrooms !== undefined ? 
    `${property.bedrooms}BR` : '';
  
  const areaDisplay = property.area_sqft ? 
    `${property.area_sqft} sq.ft` : '';

  const sourceDisplay = property.source_category === 'api' ? '💡 Bayut API' : '📋 Verifying';
  
  const imageDisplay = property.images && property.images.length > 0 ? 
    `📸 ${property.images.length} photos` : '📸 No photos';
  
  // Format date
  const dateDisplay = property.created_at 
    ? `📅 ${new Date(property.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
    : '';

  const purposeDisplay = property.purpose === 'for-sale' ? 'Sale' : 'Rent';
  const statusDisplay = property.housing_status === 'primary' ? '🆕 Primary' : '🏗️ Secondary';

  return `
🏢 <b>${property.title}</b>
💰 ${priceDisplay}
📍 ${property.location_area || 'Dubai'}
🏠 ${property.property_type || 'Property'} • ${bedroomsDisplay}
🎯 Purpose: ${purposeDisplay} • ${statusDisplay}
${imageDisplay}
${areaDisplay ? `📐 ${areaDisplay}` : ''}
${dateDisplay}
${sourceDisplay}
  `.trim();
}

async function getPropertyDetails(propertyId: string): Promise<string> {
  try {
    // Fetch property from database
    console.log(`Fetching property details for ID: ${propertyId}`);
    
    const { data: property, error } = await supabase
      .from('property_listings')
      .select('*')
      .eq('id', propertyId)
      .maybeSingle();
    
    if (error) {
      console.error('Database error:', error);
      return '❌ Error loading property details. Please try again.';
    }
    
    if (!property) {
      console.log('Property not found in database');
      return '❌ Property not found. Please search again.';
    }

    console.log('Property found:', property.title);
    
    const districtAnalysis = await getDistrictAnalysis(property.location_area);
    const investmentMetrics = calculateInvestmentMetrics(property);
    const aiDescription = await generatePropertyAnalysis(property);

    return `
🏢 <b>DETAILED INFORMATION</b>
━━━━━━━━━━━━━━━━━━━━━━━━

<b>${property.title}</b>

💰 <b>PRICE:</b> ${property.price?.toLocaleString() || 'On request'} AED
📍 <b>AREA:</b> ${property.location_area || 'Dubai'}
🏠 <b>TYPE:</b> ${property.property_type || 'Property'}
🎯 <b>PURPOSE:</b> ${property.purpose === 'for-rent' ? 'Rent' : 'Sale'}

${property.bedrooms !== undefined ? `🛏️ <b>BEDROOMS:</b> ${property.bedrooms}\n` : ''}${property.bathrooms ? `🚿 <b>BATHROOMS:</b> ${property.bathrooms}\n` : ''}${property.area_sqft ? `📐 <b>AREA:</b> ${property.area_sqft} sq.ft\n` : ''}
${property.housing_status ? `🏗️ <b>STATUS:</b> ${property.housing_status === 'primary' ? 'New construction' : 'Secondary market'}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━

📊 <b>INVESTMENT ANALYSIS</b>
${investmentMetrics}

━━━━━━━━━━━━━━━━━━━━━━━━

🏙️ <b>AREA ANALYSIS</b>
${districtAnalysis}

━━━━━━━━━━━━━━━━━━━━━━━━

🤖 <b>AI PROPERTY ANALYSIS</b>
${aiDescription}

━━━━━━━━━━━━━━━━━━━━━━━━

${property.agent_name ? `👨‍💼 <b>AGENT:</b> ${property.agent_name}\n` : ''}${property.agent_phone ? `📞 <b>PHONE:</b> ${property.agent_phone}\n` : ''}
🆔 <b>ID:</b> ${property.id}
📊 <b>SOURCE:</b> ${property.source_name || 'Database'}
    `.trim();

  } catch (error) {
    console.error('Error in getPropertyDetails:', error);
    return '❌ Error loading property details. Please try again.';
  }
}

function calculateInvestmentMetrics(property: Property): string {
  if (!property.price) {
    return 'Data for calculation unavailable';
  }

  const price = property.price;
  
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
💹 <b>Estimated yield:</b> ${roi.toFixed(1)}% per year
💰 <b>Potential rent:</b> ${estimatedMonthlyRent.toLocaleString()} AED/month
⏱️ <b>Payback period:</b> ${paybackPeriod.toFixed(1)} years
📈 <b>Annual income:</b> ${annualRent.toLocaleString()} AED
    `.trim();
  } else {
    const monthlyRent = price;
    const annualRent = monthlyRent * 12;
    const estimatedValue = annualRent / 0.07; // Assume 7% yield
    
    return `
💰 <b>Monthly rent:</b> ${monthlyRent.toLocaleString()} AED
📈 <b>Annual cost:</b> ${annualRent.toLocaleString()} AED
💎 <b>Estimated property value:</b> ${estimatedValue.toLocaleString()} AED
📊 <b>Price/income ratio:</b> ${(estimatedValue / annualRent).toFixed(1)}
    `.trim();
  }
}

async function getDistrictAnalysis(district: string): Promise<string> {
  const districtInfo: { [key: string]: string } = {
    'Dubai Marina': `
🌊 <b>Prestigious waterfront district</b>
• High-rise towers and yacht clubs
• Developed infrastructure
• Projected growth: +12-15% per year
• Average yield: 6.5-7.5%
• Ideal for short-term rental investments`,
    
    'Downtown Dubai': `
🏙️ <b>City business center</b>
• Near Burj Khalifa and Dubai Mall
• Premium location
• Projected growth: +18-22% per year  
• Average yield: 6-7%
• High value growth potential`,
    
    'Business Bay': `
💼 <b>Fast-growing business district</b>
• New towers and offices
• Excellent transport accessibility
• Projected growth: +15-20% per year
• Average yield: 7.5-9%
• Best choice for high returns`,
    
    'JBR': `
🏖️ <b>Tourist beachfront district</b>
• Directly by the sea
• Tourist zone
• Projected growth: +10-14% per year
• Average yield: 7-8%
• Ideal for short-term tourist rentals`,
    
    'Palm Jumeirah': `
🌴 <b>Exclusive artificial island</b>
• Unique location
• Luxury real estate
• Projected growth: +20-25% per year
• Average yield: 5.5-6.5%
• Maximum prestige and growth potential`
  };

  return districtInfo[district] || `
📍 <b>${district}</b>
• Developing Dubai district
• Good growth prospects
• Projected growth: +10-15% per year
• Average yield: 6.5-8%
• Stable investment opportunities`;
}

async function generatePropertyAnalysis(property: Property): Promise<string> {
  try {
    if (!DEEPSEEK_API_KEY) {
      return generateFallbackAnalysis(property);
    }

    const prompt = `Analyze this Dubai property for investment:
    - Type: ${property.property_type}
    - Area: ${property.location_area}
    - Price: ${property.price} AED
    - Bedrooms: ${property.bedrooms || 'Studio'}
    - Purpose: ${property.purpose}
    - Status: ${property.housing_status}
    
    Provide brief analysis covering:
    1. Investment potential (2-3 sentences)
    2. Market positioning (2-3 sentences)
    3. Recommendation (1-2 sentences)
    
    Keep response under 150 words, professional tone.`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      return generateFallbackAnalysis(property);
    }

    const data = await response.json();
    return data.choices[0].message.content || generateFallbackAnalysis(property);
  } catch (error) {
    console.error('Error generating AI analysis:', error);
    return generateFallbackAnalysis(property);
  }
}

function generateFallbackAnalysis(property: Property): string {
  const location = property.location_area || 'Dubai';
  const type = property.property_type || 'property';
  
  return `This ${type.toLowerCase()} in ${location} represents a solid investment opportunity in Dubai's dynamic real estate market. The area shows consistent growth trends with strong rental demand. Property characteristics align well with current market preferences, offering good potential for both capital appreciation and rental income. Recommended for investors seeking stable returns in a prime Dubai location.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update: TelegramUpdate = await req.json();
    console.log('Received Telegram update:', JSON.stringify(update));

    if (!TELEGRAM_BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN_ENG not configured');
      return new Response(JSON.stringify({ error: 'Bot token not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const text = message.text || '';
      const userName = message.from.first_name;

      if (text === '/start') {
        await sendTelegramMessage(chatId, 
          `🏠 <b>Welcome to Dubai Real Estate Bot!</b>\n\nHello ${userName}! I'm your personal assistant for Dubai real estate.\n\n🔍 <b>What I can do:</b>\n• Search properties by your criteria\n• Provide detailed property information\n• Market analysis and investment advice\n• District analytics and forecasts\n\n💡 Use the menu below or send me a message like:\n"2BR apartment in Marina for rent"\n"Villa in Downtown for sale under 2M AED"`,
          {
            inline_keyboard: [
              [
                { text: '🔍 Search Properties', callback_data: 'search_menu' },
                { text: '📊 Market Analytics', callback_data: 'analytics_menu' }
              ],
              [
                { text: '💎 Premium Properties', callback_data: 'premium_properties' },
                { text: 'ℹ️ Help', callback_data: 'help' }
              ]
            ]
          }
        );
      } else if (text.match(/^\d{5}$/)) {
        // Property ID lookup
        const propertyDetails = await getPropertyDetails(text);
        await sendTelegramMessage(chatId, propertyDetails, {
          inline_keyboard: [
            [
              { text: '🔍 New Search', callback_data: 'search_menu' },
              { text: '📊 Analytics', callback_data: 'analytics_menu' }
            ],
            [
              { text: '🏠 Main Menu', callback_data: 'main_menu' }
            ]
          ]
        });
      } else {
        // Natural language search
        const properties = await searchProperties(text);
        
        if (properties.length > 0) {
          let responseText = `🔍 <b>Search Results</b>\n\nFound ${properties.length} properties for "${text}":\n\n`;
          properties.forEach((property, index) => {
            responseText += `${index + 1}. ${formatPropertyDisplay(property)}\n\n`;
          });
          responseText += '\n💡 Data from Bayut API\n\n📝 Send property ID (5 digits) for details';
          
          await sendTelegramMessage(chatId, responseText, {
            inline_keyboard: [
              [
                { text: '📊 Analytics', callback_data: 'analytics_menu' },
                { text: '🔍 New Search', callback_data: 'search_menu' }
              ],
              [
                { text: '🏠 Main Menu', callback_data: 'main_menu' }
              ]
            ]
          });
        } else {
          await sendTelegramMessage(chatId, 
            '❌ No properties found.\n\n💡 Try different search terms like:\n• "2BR Marina apartment rent"\n• "Villa Downtown sale"\n• "Studio JBR"',
            {
              inline_keyboard: [
                [
                  { text: '🔍 Search Menu', callback_data: 'search_menu' },
                  { text: '🏠 Main Menu', callback_data: 'main_menu' }
                ]
              ]
            }
          );
        }
      }
    } else if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const chatId = callbackQuery.message.chat.id;
      const messageId = callbackQuery.message.message_id;
      const data = callbackQuery.data;

      // Delete the old message first
      await deleteTelegramMessage(chatId, messageId);

      // Handle "View Details" button for specific property
      if (data.startsWith('view_')) {
        const propertyId = data.replace('view_', '');
        console.log(`View details requested for property ID: ${propertyId}`);
        
        // Fetch property from database
        const { data: property, error } = await supabase
          .from('property_listings')
          .select('*')
          .eq('id', propertyId)
          .maybeSingle();
        
        if (property && !error) {
          const detailsText = await getPropertyDetails(propertyId);
          const photoUrl = property.images && property.images.length > 0 
            ? property.images[0] 
            : 'https://via.placeholder.com/800x600.png?text=No+Image+Available';

          await sendTelegramPhoto(
            chatId,
            photoUrl,
            detailsText,
            {
              inline_keyboard: [
                [
                  { text: '🔍 New Search', callback_data: 'search_menu' },
                  { text: '📊 Analytics', callback_data: 'analytics_menu' }
                ],
                [
                  { text: '🏠 Main Menu', callback_data: 'main_menu' }
                ]
              ]
            }
          );
        } else {
          await sendTelegramMessage(chatId, 
            '❌ Property not found. Please search again.',
            {
              inline_keyboard: [
                [{ text: '🔍 Search Menu', callback_data: 'search_menu' }],
                [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
              ]
            }
          );
        }
      } else {
        switch (data) {
          case 'main_menu':
            await sendTelegramMessage(chatId, 
              '🏠 <b>Dubai Real Estate Bot</b>\n\nMain Menu:',
              {
                inline_keyboard: [
                  [
                    { text: '🔍 Search Properties', callback_data: 'search_menu' },
                    { text: '📊 Market Analytics', callback_data: 'analytics_menu' }
                  ],
                  [
                    { text: '💎 Premium Properties', callback_data: 'premium_properties' },
                    { text: 'ℹ️ Help', callback_data: 'help' }
                  ]
                ]
              }
            );
            break;

        case 'search_menu':
          await sendTelegramMessage(chatId, 
            '🔍 <b>Property Search</b>\n\nChoose search type:',
            {
              inline_keyboard: [
                [
                  { text: '🏠 For Sale', callback_data: 'search_sale' },
                  { text: '🏡 For Rent', callback_data: 'search_rent' }
                ],
                [
                  { text: '🆕 New Projects', callback_data: 'search_primary' },
                  { text: '🏗️ Ready Properties', callback_data: 'search_secondary' }
                ],
                [
                  { text: '🏠 Main Menu', callback_data: 'main_menu' }
                ]
              ]
            }
          );
          break;

        case 'search_sale':
          await performPropertySearch(chatId, 'for-sale', undefined, undefined, 5, '🏠 <b>Properties for Sale</b>');
          break;

        case 'search_rent':
          await performPropertySearch(chatId, 'for-rent', undefined, undefined, 5, '🏡 <b>Properties for Rent</b>');
          break;

        case 'search_primary':
          await performPropertySearch(chatId, 'for-sale', undefined, 'primary', 5, '🆕 <b>New Projects</b>');
          break;

        case 'search_secondary':
          await performPropertySearch(chatId, 'for-sale', undefined, 'secondary', 5, '🏗️ <b>Ready Properties</b>');
          break;
          await performPropertySearch(chatId, 'for-sale', undefined, 'secondary', 10, '🏗️ <b>Ready Properties</b>');
          break;

        case 'analytics_menu':
          await sendTelegramMessage(chatId, 
            '📊 <b>Market Analytics</b>\n\nChoose analysis type:',
            {
              inline_keyboard: [
                [
                  { text: '🏙️ District Analysis', callback_data: 'district_analysis' },
                  { text: '📈 Price Trends', callback_data: 'price_trends' }
                ],
                [
                  { text: '💰 Investment ROI', callback_data: 'roi_analysis' },
                  { text: '🔮 Market Forecast', callback_data: 'market_forecast' }
                ],
                [
                  { text: '🏠 Main Menu', callback_data: 'main_menu' }
                ]
              ]
            }
          );
          break;

        case 'district_analysis':
          await sendTelegramMessage(chatId, '⏳ Generating district analysis...');
          try {
            const { data: analysisData, error: analysisError } = await supabase.functions.invoke('deepseek-market-analysis', {
              body: {
                type: 'district_info',
                region: 'Dubai',
                district: 'Downtown Dubai'
              }
            });

            if (analysisError || !analysisData?.success) {
              throw new Error('Failed to get analysis');
            }

            const analysis = analysisData.data;
            let responseText = `🏙️ <b>District Analysis - Dubai</b>\n\n`;
            responseText += `📊 ${analysis.summary}\n\n`;
            responseText += `<b>Key Metrics:</b>\n`;
            responseText += `💰 Avg Price: ${analysis.keyMetrics.avgPricePerSqm.toFixed(0)} AED/sqm\n`;
            responseText += `📈 Price Growth: ${analysis.keyMetrics.priceGrowth.toFixed(1)}%\n`;
            responseText += `📊 Transaction Volume: ${analysis.keyMetrics.transactionVolume.toFixed(0)}\n`;
            responseText += `💹 ROI: ${analysis.keyMetrics.roi.toFixed(1)}%\n`;
            responseText += `⏱️ Time on Market: ${analysis.keyMetrics.timeOnMarket.toFixed(0)} days\n\n`;
            
            responseText += `<b>Top Districts:</b>\n`;
            analysis.districts.slice(0, 3).forEach((district: any, index: number) => {
              responseText += `\n${index + 1}. <b>${district.name}</b>\n`;
              responseText += `   📈 Growth: ${district.growth.toFixed(1)}%\n`;
              responseText += `   💰 Avg: ${district.avgPrice.toFixed(0)} AED/sqm\n`;
              responseText += `   💹 Yield: ${district.rentYield.toFixed(1)}%\n`;
            });

            await sendTelegramMessage(chatId, responseText, {
              inline_keyboard: [
                [
                  { text: '📈 Price Trends', callback_data: 'price_trends' },
                  { text: '🔮 Forecast', callback_data: 'market_forecast' }
                ],
                [
                  { text: '📊 Analytics Menu', callback_data: 'analytics_menu' },
                  { text: '🏠 Main Menu', callback_data: 'main_menu' }
                ]
              ]
            });
          } catch (error) {
            console.error('District analysis error:', error);
            await sendTelegramMessage(chatId, '❌ Error generating analysis. Please try again.', {
              inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
            });
          }
          break;

        case 'price_trends':
          await sendTelegramMessage(chatId, '⏳ Analyzing price trends...');
          try {
            const { data: trendsData, error: trendsError } = await supabase.functions.invoke('deepseek-market-analysis', {
              body: {
                type: 'price_trends',
                region: 'Dubai',
                timeframe: '12months'
              }
            });

            if (trendsError || !trendsData?.success) {
              throw new Error('Failed to get trends');
            }

            const trends = trendsData.data;
            let responseText = `📈 <b>Price Trends - Dubai</b>\n\n`;
            responseText += `${trends.summary}\n\n`;
            responseText += `<b>Current Market:</b>\n`;
            responseText += `📊 Avg Price: ${trends.keyMetrics.avgPricePerSqm.toFixed(0)} AED/sqm\n`;
            responseText += `📈 YoY Growth: ${trends.keyMetrics.priceGrowth.toFixed(1)}%\n`;
            responseText += `💹 Expected ROI: ${trends.keyMetrics.roi.toFixed(1)}%\n\n`;
            
            responseText += `<b>Top Growing Districts:</b>\n`;
            const sortedDistricts = [...trends.districts].sort((a: any, b: any) => b.growth - a.growth);
            sortedDistricts.slice(0, 3).forEach((district: any, index: number) => {
              responseText += `${index + 1}. ${district.name}: +${district.growth.toFixed(1)}%\n`;
            });

            await sendTelegramMessage(chatId, responseText, {
              inline_keyboard: [
                [
                  { text: '🏙️ Districts', callback_data: 'district_analysis' },
                  { text: '💰 ROI Analysis', callback_data: 'roi_analysis' }
                ],
                [
                  { text: '📊 Analytics Menu', callback_data: 'analytics_menu' },
                  { text: '🏠 Main Menu', callback_data: 'main_menu' }
                ]
              ]
            });
          } catch (error) {
            console.error('Price trends error:', error);
            await sendTelegramMessage(chatId, '❌ Error generating trends. Please try again.', {
              inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
            });
          }
          break;

        case 'roi_analysis':
          await sendTelegramMessage(chatId, '⏳ Calculating investment returns...');
          try {
            const { data: roiData, error: roiError } = await supabase.functions.invoke('deepseek-market-analysis', {
              body: {
                type: 'investment_forecast',
                region: 'Dubai',
                timeframe: '12months'
              }
            });

            if (roiError || !roiData?.success) {
              throw new Error('Failed to get ROI analysis');
            }

            const roi = roiData.data;
            let responseText = `💰 <b>Investment ROI Analysis - Dubai</b>\n\n`;
            responseText += `${roi.summary}\n\n`;
            responseText += `<b>Investment Metrics:</b>\n`;
            responseText += `💹 Expected ROI: ${roi.keyMetrics.roi.toFixed(1)}%\n`;
            responseText += `📈 Price Growth: ${roi.keyMetrics.priceGrowth.toFixed(1)}%\n`;
            responseText += `⏱️ Avg Time to Sell: ${roi.keyMetrics.timeOnMarket.toFixed(0)} days\n\n`;
            
            responseText += `<b>Best ROI Districts:</b>\n`;
            const sortedByYield = [...roi.districts].sort((a: any, b: any) => b.rentYield - a.rentYield);
            sortedByYield.slice(0, 3).forEach((district: any, index: number) => {
              responseText += `${index + 1}. ${district.name}: ${district.rentYield.toFixed(1)}% yield\n`;
            });

            responseText += `\n<b>Forecast:</b>\n${roi.forecast.recommendation}`;

            await sendTelegramMessage(chatId, responseText, {
              inline_keyboard: [
                [
                  { text: '🔮 Market Forecast', callback_data: 'market_forecast' },
                  { text: '📈 Price Trends', callback_data: 'price_trends' }
                ],
                [
                  { text: '📊 Analytics Menu', callback_data: 'analytics_menu' },
                  { text: '🏠 Main Menu', callback_data: 'main_menu' }
                ]
              ]
            });
          } catch (error) {
            console.error('ROI analysis error:', error);
            await sendTelegramMessage(chatId, '❌ Error generating ROI analysis. Please try again.', {
              inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
            });
          }
          break;

        case 'market_forecast':
          await sendTelegramMessage(chatId, '⏳ Generating market forecast...');
          try {
            const { data: forecastData, error: forecastError } = await supabase.functions.invoke('deepseek-market-analysis', {
              body: {
                type: 'market_analysis',
                region: 'Dubai'
              }
            });

            if (forecastError || !forecastData?.success) {
              throw new Error('Failed to get forecast');
            }

            const forecast = forecastData.data;
            let responseText = `🔮 <b>Market Forecast - Dubai</b>\n\n`;
            responseText += `${forecast.summary}\n\n`;
            responseText += `<b>12-Month Forecast:</b>\n`;
            responseText += `📈 Expected Growth: ${forecast.forecast.priceGrowthForecast.toFixed(1)}%\n`;
            responseText += `💹 Expected ROI: ${forecast.forecast.roi.toFixed(1)}%\n`;
            responseText += `📊 Market Activity: ${forecast.forecast.marketActivity}\n\n`;
            
            responseText += `<b>Key Metrics:</b>\n`;
            responseText += `💰 Current Avg Price: ${forecast.keyMetrics.avgPricePerSqm.toFixed(0)} AED/sqm\n`;
            responseText += `📊 Monthly Transactions: ${forecast.keyMetrics.transactionVolume.toFixed(0)}\n\n`;
            
            responseText += `<b>Investment Recommendation:</b>\n${forecast.forecast.recommendation}`;

            await sendTelegramMessage(chatId, responseText, {
              inline_keyboard: [
                [
                  { text: '🏙️ District Analysis', callback_data: 'district_analysis' },
                  { text: '💰 ROI Analysis', callback_data: 'roi_analysis' }
                ],
                [
                  { text: '📊 Analytics Menu', callback_data: 'analytics_menu' },
                  { text: '🏠 Main Menu', callback_data: 'main_menu' }
                ]
              ]
            });
          } catch (error) {
            console.error('Market forecast error:', error);
            await sendTelegramMessage(chatId, '❌ Error generating forecast. Please try again.', {
              inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
            });
          }
          break;

        case 'premium_properties':
          await performPropertySearch(chatId, 'for-sale', 'Villa', undefined, 3, '💎 <b>Premium Villas</b>');
          break;

        case 'help':
          await sendTelegramMessage(chatId, 
            'ℹ️ <b>How to use the bot:</b>\n\n🔍 <b>Search examples:</b>\n• "2BR Marina apartment rent"\n• "Villa Downtown sale under 3M"\n• "Studio JBR"\n• "Townhouse Business Bay"\n\n🆔 <b>Property details:</b>\nSend 5-digit property ID for full information\n\n📊 <b>Analytics:</b>\nUse menu buttons for market analysis\n\n💡 <b>Tips:</b>\n• Include area name for better results\n• Specify rent/sale purpose\n• Mention price range if needed',
            {
              inline_keyboard: [
                [
                  { text: '🔍 Start Search', callback_data: 'search_menu' },
                  { text: '🏠 Main Menu', callback_data: 'main_menu' }
                ]
              ]
            }
          );
          break;

        default:
          await sendTelegramMessage(chatId, 
            '❌ Unknown command. Please use the menu.',
            {
              inline_keyboard: [
                [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
              ]
            }
          );
          break;
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error handling Telegram update:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});