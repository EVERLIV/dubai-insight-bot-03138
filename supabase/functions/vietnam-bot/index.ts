import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('VIETNAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

// Public group/channel ID for automated notifications
const GROUP_CHAT_ID = -1003589064021;

// Monitored channels for auto-import (add channel IDs here)
const MONITORED_CHANNELS: number[] = [
  -1003589064021, // Main group
  // Add more channel IDs to monitor
];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

// Send message to Telegram
async function sendTelegramMessage(chatId: number | string, text: string, options: any = {}) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('VIETNAM_BOT_TOKEN not configured');
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        ...options
      })
    });

    const result = await response.json();
    console.log('Message sent:', result.ok);
    return result;
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Delete message
async function deleteTelegramMessage(chatId: number, messageId: number) {
  if (!TELEGRAM_BOT_TOKEN) return;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`;
  
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId
      })
    });
  } catch (error) {
    console.error('Error deleting message:', error);
  }
}

// Answer callback query
async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  if (!TELEGRAM_BOT_TOKEN) return;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
  
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text
      })
    });
  } catch (error) {
    console.error('Error answering callback:', error);
  }
}

// Search properties
async function searchProperties(query: string, purpose: string = 'for-rent', limit: number = 5) {
  console.log('Searching properties:', { query, purpose, limit });

  const { data, error } = await supabase.rpc('search_properties_unified', {
    p_query: query,
    p_purpose: purpose,
    p_limit: limit
  });

  if (error) {
    console.error('Search error:', error);
    return [];
  }

  return data || [];
}

// Format property for display
function formatProperty(property: any, index: number): string {
  const price = property.price 
    ? new Intl.NumberFormat('vi-VN').format(property.price) + ' VND'
    : 'Price on request';

  return `
<b>${index}. ${property.title}</b>

💰 <b>Price:</b> ${price}
📍 <b>Location:</b> ${property.location_area || 'Ho Chi Minh City'}
🛏 <b>Bedrooms:</b> ${property.bedrooms || 'N/A'}
🚿 <b>Bathrooms:</b> ${property.bathrooms || 'N/A'}
📐 <b>Area:</b> ${property.area_sqft ? property.area_sqft + ' m²' : 'N/A'}

ID: <code>${property.id}</code>
`;
}

// Handle /start command
async function handleStart(chatId: number, userName: string) {
  const welcomeText = `
🏠 <b>Welcome to Saigon Properties Bot!</b>

Hello ${userName}! I'm your real estate assistant for Ho Chi Minh City, Vietnam.

<b>What I can do:</b>
🔍 Search rental properties
📊 Get market insights
💰 Property valuations
📍 District information

<b>Commands:</b>
/search - Search properties
/rent - View rental listings
/districts - Popular districts
/help - Get help

Just type what you're looking for, like:
<i>"2 bedroom apartment in District 1"</i>
<i>"studio near Bitexco"</i>
`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🔍 Search Rentals', callback_data: 'search_rent' },
        { text: '🏠 All Listings', callback_data: 'all_listings' }
      ],
      [
        { text: '📍 Districts', callback_data: 'districts' },
        { text: '📊 Market Info', callback_data: 'market_info' }
      ]
    ]
  };

  await sendTelegramMessage(chatId, welcomeText, { reply_markup: keyboard });

  // Log user
  await supabase.from('user_preferences').upsert({
    telegram_user_id: chatId,
    preferences: { language: 'en', location: 'hcmc' },
    updated_at: new Date().toISOString()
  }, { onConflict: 'telegram_user_id' });
}

// Handle search
async function handleSearch(chatId: number, query: string) {
  await sendTelegramMessage(chatId, '🔍 Searching properties...');

  const properties = await searchProperties(query, 'for-rent', 5);

  // Log search
  await supabase.from('search_history').insert({
    telegram_user_id: chatId,
    query,
    results_count: properties.length,
    filters: { purpose: 'for-rent' }
  });

  if (properties.length === 0) {
    await sendTelegramMessage(chatId, `
❌ <b>No properties found</b>

Try different search terms like:
• "apartment District 1"
• "2 bedroom Thao Dien"
• "studio near center"
`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔄 Try Again', callback_data: 'search_rent' }]
        ]
      }
    });
    return;
  }

  let resultText = `✅ <b>Found ${properties.length} properties:</b>\n`;
  
  properties.forEach((prop: any, idx: number) => {
    resultText += formatProperty(prop, idx + 1);
  });

  const buttons = properties.slice(0, 5).map((prop: any, idx: number) => ({
    text: `📋 #${idx + 1}`,
    callback_data: `detail_${prop.id}`
  }));

  await sendTelegramMessage(chatId, resultText, {
    reply_markup: {
      inline_keyboard: [
        buttons,
        [{ text: '🔍 New Search', callback_data: 'search_rent' }]
      ]
    }
  });
}

// Handle callback queries
async function handleCallback(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;

  await answerCallbackQuery(callbackQuery.id);
  await deleteTelegramMessage(chatId, messageId);

  if (data === 'search_rent') {
    await sendTelegramMessage(chatId, `
🔍 <b>Property Search</b>

What are you looking for? Type your search:

Examples:
• <i>apartment District 2</i>
• <i>3 bedroom villa Thao Dien</i>
• <i>studio near center</i>
`);
  } else if (data === 'all_listings') {
    await handleSearch(chatId, '');
  } else if (data === 'districts') {
    await sendTelegramMessage(chatId, `
📍 <b>Popular Districts in Ho Chi Minh City</b>

🏙 <b>District 1</b> - City center, business hub
🌿 <b>District 2 (Thu Duc)</b> - Expat area, Thao Dien
🏢 <b>District 3</b> - Central, good restaurants
🎭 <b>District 7</b> - Phu My Hung, modern area
🏫 <b>Binh Thanh</b> - Near center, affordable

Select a district to search:
`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'District 1', callback_data: 'district_1' },
            { text: 'District 2', callback_data: 'district_2' }
          ],
          [
            { text: 'District 3', callback_data: 'district_3' },
            { text: 'District 7', callback_data: 'district_7' }
          ],
          [{ text: '🔙 Back', callback_data: 'back_main' }]
        ]
      }
    });
  } else if (data === 'market_info') {
    await sendTelegramMessage(chatId, `
📊 <b>Ho Chi Minh City Market Overview</b>

🏠 <b>Rental Market:</b>
• Studio: 8-15M VND/month
• 1BR: 12-25M VND/month
• 2BR: 18-40M VND/month
• 3BR: 30-80M VND/month

📈 <b>Trends:</b>
• High demand in District 2, 7
• Growing expat community
• New developments in Thu Duc

💡 <b>Tips:</b>
• Negotiate for long-term leases
• Check included utilities
• Visit during different times
`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔍 Search Now', callback_data: 'search_rent' }],
          [{ text: '🔙 Back', callback_data: 'back_main' }]
        ]
      }
    });
  } else if (data.startsWith('district_')) {
    const district = data.replace('district_', 'District ');
    await handleSearch(chatId, district);
  } else if (data.startsWith('detail_')) {
    const propertyId = data.replace('detail_', '');
    const { data: property } = await supabase
      .from('property_listings')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (property) {
      const price = property.price 
        ? new Intl.NumberFormat('vi-VN').format(property.price) + ' VND'
        : 'Price on request';

      await sendTelegramMessage(chatId, `
🏠 <b>${property.title}</b>

💰 <b>Price:</b> ${price}
📍 <b>Location:</b> ${property.location_area || 'Ho Chi Minh City'}
🏢 <b>Type:</b> ${property.property_type || 'Apartment'}
🛏 <b>Bedrooms:</b> ${property.bedrooms || 'N/A'}
🚿 <b>Bathrooms:</b> ${property.bathrooms || 'N/A'}
📐 <b>Area:</b> ${property.area_sqft ? property.area_sqft + ' m²' : 'N/A'}

📞 Contact our agent for viewing!
`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📞 Contact Agent', callback_data: 'contact_agent' }],
            [{ text: '🔍 More Properties', callback_data: 'search_rent' }],
            [{ text: '🔙 Back', callback_data: 'back_main' }]
          ]
        }
      });
    }
  } else if (data === 'contact_agent') {
    await sendTelegramMessage(chatId, `
📞 <b>Contact Our Team</b>

🌐 Website: saigon-properties.vn
📱 WhatsApp: +84 xxx xxx xxx
📧 Email: info@saigonproperties.vn

Our agents speak:
🇻🇳 Vietnamese
🇬🇧 English
🇷🇺 Russian
`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Back', callback_data: 'back_main' }]
        ]
      }
    });
  } else if (data === 'back_main') {
    await handleStart(chatId, 'User');
  }
}

// Check if message looks like a property listing
function isPropertyListing(text: string): boolean {
  const indicators = [
    /\d+\s*(triệu|tr|million|usd|\$)/i,
    /\d+\s*(m2|m²|sqm|square)/i,
    /\d+\s*(pn|phòng ngủ|bedroom|br|bed)/i,
    /(cho thuê|for rent|rent|căn hộ|apartment|studio|villa)/i,
    /(quận|district|thảo điền|thao dien|phú mỹ hưng|binh thanh)/i,
  ];
  
  const matches = indicators.filter(regex => regex.test(text)).length;
  return matches >= 2 && text.length > 50;
}

// Parse property listing with AI
async function parsePropertyListing(text: string): Promise<any | null> {
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY not configured');
    return null;
  }

  const systemPrompt = `You are a real estate listing parser for Ho Chi Minh City, Vietnam.
Extract property information from Telegram messages. Return JSON with:
- title: Property title in English
- price: Monthly rent in VND (number). Convert: 15 triệu = 15000000, $800 = 20000000
- location_area: District/area (e.g., "District 1", "Thao Dien")
- property_type: Apartment, Studio, Villa, House, Room
- bedrooms: Number (integer)
- bathrooms: Number (integer)
- area_sqft: Area in m² (integer)
- agent_phone: Phone if found
If field not found, use null. Be accurate with price conversion.`;

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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Parse this Telegram listing:\n\n${text}` }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'extract_property',
            description: 'Extract property details',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                price: { type: ['number', 'null'] },
                location_area: { type: ['string', 'null'] },
                property_type: { type: ['string', 'null'] },
                bedrooms: { type: ['integer', 'null'] },
                bathrooms: { type: ['integer', 'null'] },
                area_sqft: { type: ['integer', 'null'] },
                agent_phone: { type: ['string', 'null'] }
              },
              required: ['title']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'extract_property' } }
      }),
    });

    if (!response.ok) {
      console.error('AI parse error:', response.status);
      return null;
    }

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

// Auto-import property from channel message
async function autoImportProperty(text: string, chatId: number, messageId: number): Promise<boolean> {
  console.log('Auto-importing property from channel:', chatId);
  
  const parsed = await parsePropertyListing(text);
  if (!parsed || !parsed.title) {
    console.log('Failed to parse property');
    return false;
  }

  // Check for duplicates
  const { data: existing } = await supabase
    .from('property_listings')
    .select('id')
    .eq('source_name', 'telegram')
    .ilike('title', `%${parsed.title.slice(0, 30)}%`)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log('Property already exists, skipping');
    return false;
  }

  // Save to database
  const { data, error } = await supabase
    .from('property_listings')
    .insert({
      title: parsed.title,
      price: parsed.price,
      location_area: parsed.location_area,
      property_type: parsed.property_type,
      purpose: 'for-rent',
      bedrooms: parsed.bedrooms,
      bathrooms: parsed.bathrooms,
      area_sqft: parsed.area_sqft,
      agent_phone: parsed.agent_phone,
      images: [],
      source_name: 'telegram',
      source_category: 'auto-import',
      housing_status: 'secondary',
      external_id: `tg_${chatId}_${messageId}`
    })
    .select('id')
    .single();

  if (error) {
    console.error('Save error:', error);
    return false;
  }

  console.log('Auto-imported property:', data.id, parsed.title);
  
  // React to the message to indicate it was imported
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMessageReaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        reaction: [{ type: 'emoji', emoji: '✅' }]
      })
    });
  } catch (e) {
    // Reaction failed, not critical
  }

  return true;
}

// Handle text messages
async function handleMessage(message: any) {
  const chatId = message.chat.id;
  const text = message.text || '';
  const userName = message.from?.first_name || 'User';
  const chatType = message.chat.type;
  const messageId = message.message_id;

  console.log('Received message:', { chatId, chatType, textLength: text.length });

  // Check if this is from a monitored channel/group
  if ((chatType === 'channel' || chatType === 'supergroup' || chatType === 'group') && 
      MONITORED_CHANNELS.includes(chatId)) {
    // Check if it looks like a property listing
    if (isPropertyListing(text)) {
      console.log('Detected property listing in monitored channel');
      await autoImportProperty(text, chatId, messageId);
      return; // Don't process further
    }
  }

  // Regular bot commands (private chat)
  if (chatType === 'private') {
    if (text.startsWith('/start')) {
      await handleStart(chatId, userName);
    } else if (text.startsWith('/help')) {
      await handleStart(chatId, userName);
    } else if (text.startsWith('/search') || text.startsWith('/rent')) {
      await sendTelegramMessage(chatId, `
🔍 <b>Property Search</b>

Type what you're looking for:
• Location (District 1, Thao Dien, etc.)
• Property type (apartment, villa, studio)
• Number of bedrooms
`);
    } else if (text.startsWith('/districts')) {
      await handleCallback({ 
        id: 'fake', 
        data: 'districts', 
        message: { chat: { id: chatId }, message_id: 0 } 
      });
    } else {
      // Treat as search query
      await handleSearch(chatId, text);
    }
  }
}

// Send notification to group
async function sendGroupNotification(message: string, type: string = 'info') {
  console.log('Sending group notification:', { message, type });
  
  const emoji = type === 'new_listing' ? '🏠' : 
                type === 'alert' ? '⚠️' : 
                type === 'promo' ? '🎉' : 'ℹ️';
  
  const formattedMessage = `${emoji} <b>Saigon Properties</b>\n\n${message}`;
  
  const result = await sendTelegramMessage(GROUP_CHAT_ID, formattedMessage);
  return result;
}

// Send new property notification
async function sendNewPropertyNotification(property: any) {
  const price = property.price 
    ? new Intl.NumberFormat('vi-VN').format(property.price) + ' VND'
    : 'Price on request';

  const message = `
🆕 <b>New Property Listed!</b>

<b>${property.title}</b>

💰 ${price}
📍 ${property.location_area || 'Ho Chi Minh City'}
🛏 ${property.bedrooms || 'N/A'} bedrooms
📐 ${property.area_sqft ? property.area_sqft + ' m²' : 'N/A'}

Contact us for details! 📞
`;

  return await sendTelegramMessage(GROUP_CHAT_ID, message);
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!TELEGRAM_BOT_TOKEN) {
      console.error('VIETNAM_BOT_TOKEN not set');
      return new Response(
        JSON.stringify({ error: 'Bot not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const contentType = req.headers.get('content-type') || '';

    // Handle API calls for sending group messages
    if (url.searchParams.get('action') === 'send_group_message') {
      const body = await req.json();
      const { message, type } = body;
      
      if (!message) {
        return new Response(
          JSON.stringify({ error: 'Message is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const result = await sendGroupNotification(message, type || 'info');
      console.log('Group message sent:', result);
      
      return new Response(
        JSON.stringify({ ok: true, result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle API call for new property notification
    if (url.searchParams.get('action') === 'notify_new_property') {
      const body = await req.json();
      const { property } = body;
      
      if (!property) {
        return new Response(
          JSON.stringify({ error: 'Property data is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const result = await sendNewPropertyNotification(property);
      console.log('Property notification sent:', result);
      
      return new Response(
        JSON.stringify({ ok: true, result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle Telegram webhook updates
    const update: TelegramUpdate = await req.json();
    console.log('Received update:', JSON.stringify(update));

    if (update.callback_query) {
      await handleCallback(update.callback_query);
    } else if (update.message) {
      await handleMessage(update.message);
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing update:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
