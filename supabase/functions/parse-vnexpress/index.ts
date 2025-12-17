import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

// Parse RSS feed from VNExpress
async function fetchVNExpressNews(category: string = 'tin-tuc-24h'): Promise<NewsItem[]> {
  const rssUrls: Record<string, string> = {
    'tin-tuc-24h': 'https://vnexpress.net/rss/tin-moi-nhat.rss',
    'bat-dong-san': 'https://vnexpress.net/rss/bat-dong-san.rss',
    'kinh-doanh': 'https://vnexpress.net/rss/kinh-doanh.rss',
    'doi-song': 'https://vnexpress.net/rss/doi-song.rss',
    'du-lich': 'https://vnexpress.net/rss/du-lich.rss',
  };

  const rssUrl = rssUrls[category] || rssUrls['tin-tuc-24h'];
  
  console.log(`Fetching RSS from: ${rssUrl}`);
  
  const response = await fetch(rssUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS: ${response.status}`);
  }

  const xml = await response.text();
  console.log(`Received XML length: ${xml.length}`);
  
  // Simple XML parsing for RSS items
  const items: NewsItem[] = [];
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  
  for (const itemXml of itemMatches.slice(0, 10)) { // Limit to 10 items
    const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || 
                  itemXml.match(/<title>(.*?)<\/title>/)?.[1] || '';
    const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';
    const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
                        itemXml.match(/<description>(.*?)<\/description>/)?.[1] || '';
    const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';

    if (title && link) {
      items.push({
        title: title.trim(),
        link: link.trim(),
        description: description.replace(/<[^>]*>/g, '').trim().slice(0, 500),
        pubDate: pubDate.trim(),
      });
    }
  }

  console.log(`Parsed ${items.length} news items`);
  return items;
}

// Translate text using Lovable AI
async function translateToRussian(text: string, type: 'title' | 'content'): Promise<string> {
  if (!lovableApiKey) {
    console.log('No LOVABLE_API_KEY, returning original text');
    return text;
  }

  const systemPrompt = type === 'title' 
    ? 'Ты профессиональный переводчик с вьетнамского на русский. Переводи заголовки новостей кратко и понятно. Отвечай только переводом, без пояснений.'
    : 'Ты профессиональный переводчик с вьетнамского на русский. Переводи текст новостей грамотно, сохраняя смысл. Отвечай только переводом.';

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Переведи на русский: ${text}` }
        ],
        max_tokens: type === 'title' ? 200 : 1000,
      }),
    });

    if (!response.ok) {
      console.error('AI translation error:', response.status);
      return text;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

// Calculate relevance score for expats/real estate
function calculateRelevanceScore(title: string, description: string): number {
  const keywords = {
    high: ['bất động sản', 'căn hộ', 'nhà', 'thuê', 'mua', 'giá', 'quận', 'tp.hcm', 'sài gòn', 'expat', 'nước ngoài', 'visa', 'cư trú'],
    medium: ['đầu tư', 'kinh tế', 'việt nam', 'dự án', 'xây dựng', 'giao thông', 'metro', 'sân bay'],
    low: ['du lịch', 'ẩm thực', 'nhà hàng', 'quán', 'sự kiện', 'lễ hội'],
  };

  const text = (title + ' ' + description).toLowerCase();
  let score = 50;

  for (const keyword of keywords.high) {
    if (text.includes(keyword)) score += 15;
  }
  for (const keyword of keywords.medium) {
    if (text.includes(keyword)) score += 8;
  }
  for (const keyword of keywords.low) {
    if (text.includes(keyword)) score += 3;
  }

  return Math.min(100, score);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, category, translate = true, limit = 5 } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'fetch_and_translate') {
      console.log(`Starting news fetch for category: ${category}`);
      
      // Fetch news from VNExpress
      const newsItems = await fetchVNExpressNews(category);
      
      // Get or create news source
      const { data: source } = await supabase
        .from('news_sources')
        .upsert({
          source_name: `VNExpress - ${category}`,
          source_url: `https://vnexpress.net/rss/${category}.rss`,
          is_active: true,
          last_scraped_at: new Date().toISOString(),
        }, { onConflict: 'source_name' })
        .select()
        .single();

      const results = [];
      const itemsToProcess = newsItems.slice(0, limit);

      for (const item of itemsToProcess) {
        // Check if article already exists
        const { data: existing } = await supabase
          .from('news_articles')
          .select('id')
          .eq('original_url', item.link)
          .single();

        if (existing) {
          console.log(`Article already exists: ${item.title.slice(0, 50)}...`);
          continue;
        }

        // Calculate relevance
        const relevanceScore = calculateRelevanceScore(item.title, item.description);
        
        // Translate if enabled
        let translatedTitle = item.title;
        let translatedContent = item.description;
        
        if (translate && relevanceScore >= 50) {
          console.log(`Translating: ${item.title.slice(0, 50)}...`);
          translatedTitle = await translateToRussian(item.title, 'title');
          translatedContent = await translateToRussian(item.description, 'content');
        }

        // Save to database
        const { data: article, error } = await supabase
          .from('news_articles')
          .insert({
            source_id: source?.id,
            original_title: item.title,
            original_content: item.description,
            original_url: item.link,
            translated_title: translatedTitle,
            translated_content: translatedContent,
            published_date: item.pubDate ? new Date(item.pubDate).toISOString() : null,
            relevance_score: relevanceScore,
            is_processed: translate,
          })
          .select()
          .single();

        if (error) {
          console.error('Error saving article:', error);
        } else {
          results.push(article);
        }

        // Small delay between translations to avoid rate limiting
        if (translate) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Update source article count
      if (source) {
        await supabase
          .from('news_sources')
          .update({ 
            articles_count: (source.articles_count || 0) + results.length,
            last_scraped_at: new Date().toISOString()
          })
          .eq('id', source.id);
      }

      return new Response(JSON.stringify({
        success: true,
        fetched: newsItems.length,
        saved: results.length,
        articles: results,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_articles') {
      const { data: articles, error } = await supabase
        .from('news_articles')
        .select('*, news_sources(source_name)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        articles,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'translate_article') {
      const { article_id } = await req.json();
      
      const { data: article } = await supabase
        .from('news_articles')
        .select('*')
        .eq('id', article_id)
        .single();

      if (!article) {
        throw new Error('Article not found');
      }

      const translatedTitle = await translateToRussian(article.original_title, 'title');
      const translatedContent = await translateToRussian(article.original_content || '', 'content');

      const { data: updated, error } = await supabase
        .from('news_articles')
        .update({
          translated_title: translatedTitle,
          translated_content: translatedContent,
          is_processed: true,
        })
        .eq('id', article_id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        article: updated,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-vnexpress:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
