import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BayutProperty {
  id: number;
  title: string;
  coverPhoto?: {
    url: string;
  };
  photos?: Array<{
    url: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const bayutApiKey = Deno.env.get('BAYUT_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting Bayut image matching process...');

    // Получаем объекты без изображений из scraped_properties
    const { data: propertiesWithoutImages, error: fetchError } = await supabase
      .from('scraped_properties')
      .select('id, title, property_type, location_area, bedrooms, price')
      .or('images.is.null,images.eq.{}')
      .limit(50);

    if (fetchError) {
      console.error('Error fetching properties:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${propertiesWithoutImages?.length || 0} properties without images`);

    let matched = 0;
    let processed = 0;

    for (const property of propertiesWithoutImages || []) {
      try {
        processed++;
        console.log(`Processing ${processed}/${propertiesWithoutImages?.length}: ${property.title}`);

        // Поиск в Bayut API по заголовку
        const searchParams = new URLSearchParams({
          'hitsPerPage': '5',
          'page': '0',
          'lang': 'en',
          'sort': 'city-level-score',
          'hasPhoto': 'true',
          'query': property.title.split(' ').slice(0, 3).join(' '), // Первые 3 слова для поиска
        });

        if (property.location_area) {
          searchParams.append('locationExternalIDs', '5002'); // Dubai ID
        }

        const bayutResponse = await fetch(`https://bayut.p.rapidapi.com/properties/list?${searchParams}`, {
          headers: {
            'X-RapidAPI-Key': bayutApiKey,
            'X-RapidAPI-Host': 'bayut.p.rapidapi.com'
          }
        });

        if (!bayutResponse.ok) {
          console.log(`Bayut API error for ${property.title}: ${bayutResponse.status}`);
          continue;
        }

        const bayutData = await bayutResponse.json();
        const bayutProperties: BayutProperty[] = bayutData.hits || [];

        // Ищем наиболее подходящий объект
        let bestMatch: BayutProperty | null = null;
        let bestScore = 0;

        for (const bayutProp of bayutProperties) {
          if (!bayutProp.coverPhoto && (!bayutProp.photos || bayutProp.photos.length === 0)) {
            continue;
          }

          let score = 0;
          
          // Проверяем схожесть заголовков
          const titleSimilarity = calculateSimilarity(
            property.title.toLowerCase(),
            bayutProp.title.toLowerCase()
          );
          score += titleSimilarity * 0.6;

          // Бонус за наличие изображений
          if (bayutProp.photos && bayutProp.photos.length > 0) {
            score += 0.4;
          } else if (bayutProp.coverPhoto) {
            score += 0.2;
          }

          if (score > bestScore && score > 0.3) { // Минимальный порог схожести
            bestScore = score;
            bestMatch = bayutProp;
          }
        }

        if (bestMatch) {
          // Собираем изображения
          const images: string[] = [];
          
          if (bestMatch.coverPhoto?.url) {
            images.push(bestMatch.coverPhoto.url);
          }
          
          if (bestMatch.photos) {
            bestMatch.photos.forEach(photo => {
              if (photo.url && !images.includes(photo.url)) {
                images.push(photo.url);
              }
            });
          }

          if (images.length > 0) {
            // Обновляем объект с найденными изображениями
            const { error: updateError } = await supabase
              .from('scraped_properties')
              .update({ 
                images: images.slice(0, 10), // Максимум 10 изображений
                updated_at: new Date().toISOString()
              })
              .eq('id', property.id);

            if (updateError) {
              console.error(`Error updating property ${property.id}:`, updateError);
            } else {
              matched++;
              console.log(`✅ Matched "${property.title}" with ${images.length} images (score: ${bestScore.toFixed(2)})`);
            }
          }
        } else {
          console.log(`❌ No match found for "${property.title}"`);
        }

        // Небольшая задержка чтобы не превысить лимиты API
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`Error processing property ${property.id}:`, error);
      }
    }

    const result = {
      success: true,
      processed,
      matched,
      matchRate: processed > 0 ? Math.round((matched / processed) * 100) : 0,
      message: `Processed ${processed} properties, matched ${matched} with Bayut images (${Math.round((matched / processed) * 100)}% success rate)`
    };

    console.log('Matching completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in match-bayut-images:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to match properties with Bayut images'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Функция для вычисления схожести строк
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(' ').filter(word => word.length > 2);
  const words2 = str2.split(' ').filter(word => word.length > 2);
  
  let matches = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1.includes(word2) || word2.includes(word1)) {
        matches++;
        break;
      }
    }
  }
  
  return matches / Math.max(words1.length, words2.length);
}