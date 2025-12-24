import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postType, district } = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let systemPrompt = `Ты - контент-менеджер Telegram канала "Saigon Properties" для русскоязычных экспатов в Хошимине, Вьетнам.

Твоя задача - создавать информативные, полезные и вовлекающие посты.

Правила:
- Пиши на русском языке
- Используй эмодзи для структурирования
- Добавляй хэштеги в конце (#SaigonLife #HCM #Вьетнам и т.д.)
- Пост должен быть 200-400 слов
- Включай call-to-action в конце
- Будь дружелюбным и полезным
- Валюта - VND (вьетнамские донги)`;

    let userPrompt = '';
    let contextData: any = null;

    switch (postType) {
      case 'district_review':
        // Fetch district data
        if (district) {
          const { data: districtData } = await supabase
            .from('district_reviews')
            .select('*')
            .eq('district', district)
            .single();
          
          contextData = districtData;
        }

        // Also fetch properties in this district
        const { data: properties } = await supabase
          .from('property_listings')
          .select('*')
          .ilike('location_area', `%${district || ''}%`)
          .limit(5);

        userPrompt = `Создай пост "Район дня" для района ${district || 'District 2'} в Хошимине.

${contextData ? `Данные о районе:
- Описание: ${contextData.description}
- Средняя аренда 1BR: ${contextData.avg_rent_1br} VND
- Средняя аренда 2BR: ${contextData.avg_rent_2br} VND
- Инфраструктура: ${contextData.infrastructure_score}/10
- Для экспатов: ${contextData.expat_friendly_score}/10
- Ночная жизнь: ${contextData.nightlife_score}/10
- Для семей: ${contextData.family_score}/10` : ''}

${properties?.length ? `Примеры квартир в районе:
${properties.map(p => `- ${p.title}: ${p.price} VND, ${p.bedrooms}BR`).join('\n')}` : ''}

Структура поста:
1. 📍 Заголовок с названием района
2. 🏙 Краткое описание района
3. 💰 Цены на аренду
4. ✅ Плюсы района
5. ⚠️ Минусы/особенности
6. 🍜 Где поесть (2-3 места)
7. 💡 Лайфхак для новичков
8. Call-to-action`;
        break;

      case 'morning_digest':
        // Fetch weather data
        let weatherInfo = 'около 30°C, возможен дождь';
        try {
          const weatherResponse = await fetch(
            'https://api.open-meteo.com/v1/forecast?latitude=10.8231&longitude=106.6297&current=temperature_2m,weather_code&timezone=Asia/Ho_Chi_Minh'
          );
          if (weatherResponse.ok) {
            const weatherData = await weatherResponse.json();
            const temp = Math.round(weatherData.current?.temperature_2m || 30);
            const weatherCode = weatherData.current?.weather_code || 0;
            const weatherDesc = weatherCode >= 61 ? '🌧 дождь' : weatherCode >= 51 ? '🌦 облачно с прояснениями' : weatherCode >= 1 ? '⛅ переменная облачность' : '☀️ солнечно';
            weatherInfo = `${temp}°C, ${weatherDesc}`;
          }
        } catch (e) {
          console.log('Weather fetch failed, using default');
        }

        // Fetch latest translated news
        const { data: latestNews } = await supabase
          .from('news_articles')
          .select('translated_title, translated_content, original_url')
          .eq('is_processed', true)
          .not('translated_title', 'is', null)
          .order('created_at', { ascending: false })
          .limit(3);

        // Fetch featured property
        const { data: latestProperty } = await supabase
          .from('property_listings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const newsSection = latestNews?.length 
          ? latestNews.map((n, i) => `${i + 1}. ${n.translated_title}`).join('\n')
          : '- Новости о рынке недвижимости\n- Изменения в визовом режиме\n- Открытие новых заведений';

        userPrompt = `Создай утренний дайджест для Telegram канала.

ОБЯЗАТЕЛЬНО используй эти РЕАЛЬНЫЕ данные:

🌡 ПОГОДА в Хошимине сегодня: ${weatherInfo}

📰 НОВОСТИ ДНЯ (переведены с VNExpress):
${newsSection}

🏠 КВАРТИРА ДНЯ:
${latestProperty ? `- ${latestProperty.title}
- Цена: ${latestProperty.price?.toLocaleString()} VND/мес
- Район: ${latestProperty.location_area || 'HCMC'}
- Комнат: ${latestProperty.bedrooms || '?'} спальни, ${latestProperty.bathrooms || '?'} ванные
- Площадь: ${latestProperty.area_sqft || '?'} м²` : '- 2-комнатная в District 2, Thao Dien\n- $800/мес | 70м² | Бассейн'}

СТРУКТУРА ПОСТА:
🌅 Доброе утро, Вьетнам!

☀️ Погода в Хошимине: [используй реальные данные выше]

📰 Главное за сутки:
[перечисли 3 новости из данных выше, кратко своими словами]

🏠 Квартира дня:
[опиши квартиру из данных + добавь почему она выгодна]

💬 Вопросы по аренде? → @saigon_realty_bot

#SaigonMorning #HCM #Вьетнам #Экспаты`;
        break;

      case 'evening_entertainment':
        userPrompt = `Создай вечерний пост "Куда пойти сегодня" в Хошимине.

Структура:
1. 🌙 Заголовок
2. 🍺 Бары/пабы (2-3 места с адресами/районами)
3. 🍜 Рестораны (2-3 места)
4. 🎭 События/концерты (придумай актуальные)
5. 💡 Совет: как добраться (Grab/такси)
6. 📍 Укажи районы (District 1, District 2 и т.д.)
7. Call-to-action`;
        break;

      case 'apartment_week':
        const { data: featuredProperty } = await supabase
          .from('property_listings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        userPrompt = `Создай подробный обзор "Квартира недели".

${featuredProperty ? `Квартира:
- Название: ${featuredProperty.title}
- Цена: ${featuredProperty.price} VND/месяц
- Район: ${featuredProperty.location_area}
- Спальни: ${featuredProperty.bedrooms}
- Ванные: ${featuredProperty.bathrooms}
- Площадь: ${featuredProperty.area_sqft} м²
- Агент: ${featuredProperty.agent_name}` : 'Создай примерное описание квартиры в District 2'}

Структура:
1. 🏠 Заголовок
2. 💰 Цена и что включено
3. 📍 Район и инфраструктура рядом
4. ✅ Почему стоит рассмотреть
5. 📏 Расчет стоимости жизни в этом районе
6. 📞 Как связаться
7. Call-to-action`;
        break;

      case 'prices_update':
        userPrompt = `Создай пост "Актуальные цены в Хошимине" для экспатов.

Структура:
1. 💰 Заголовок
2. 🏠 Аренда жилья:
   - Студия: 6-10 млн VND
   - 1BR: 8-15 млн VND
   - 2BR: 12-25 млн VND
3. 🍜 Еда:
   - Фо/Бан Ми: 30-50к VND
   - Кафе (капучино): 40-60к VND
   - Ресторан: 200-400к VND
4. 🚕 Транспорт:
   - Grab 5км: 30-50к VND
   - Аренда байка: 3-5 млн VND/мес
5. 📱 Связь: SIM с интернетом 100-200к VND/мес
6. 💡 Совет по экономии
7. Call-to-action`;
        break;

      case 'visa_guide':
        userPrompt = `Создай пост-гайд по визам во Вьетнам для россиян.

Структура:
1. 📋 Заголовок
2. 🎫 Безвизовый режим (45 дней)
3. 📝 E-visa (90 дней)
4. 💼 Бизнес-виза
5. ⚠️ Важные нюансы:
   - Продление
   - Штрафы за просрочку
   - Визаран
6. 💡 Проверенные агентства
7. Call-to-action`;
        break;

      case 'sport_fitness':
        userPrompt = `Создай пост про спорт и фитнес в Хошимине.

Структура:
1. 🏋️ Заголовок
2. 🏢 Фитнес-клубы:
   - California Fitness: от 1.5 млн VND/мес
   - CitiGym: от 800к VND/мес
3. 🏃 Бесплатные активности:
   - Парк Thao Cam Vien
   - Набережная District 2
4. 🏊 Бассейны
5. 🧘 Йога студии
6. 💡 Совет для экспатов
7. Упомяни @HCM_Sport_Connect
8. Call-to-action`;
        break;

      default:
        userPrompt = `Создай информативный пост для экспатов в Хошимине на любую полезную тему.`;
    }

    console.log('Generating content for:', postType);

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated');
    }

    console.log('Content generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        content,
        postType,
        contextData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating content:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
