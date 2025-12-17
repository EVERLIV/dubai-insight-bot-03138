import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  images?: string[];
  fullContent?: string;
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
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS: ${response.status}`);
  }

  const xml = await response.text();
  const items: NewsItem[] = [];
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  
  for (const itemXml of itemMatches.slice(0, 10)) {
    const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || 
                  itemXml.match(/<title>(.*?)<\/title>/)?.[1] || '';
    const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';
    const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
                        itemXml.match(/<description>(.*?)<\/description>/)?.[1] || '';
    const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
    
    // Extract image from description or enclosure
    const imgMatch = description.match(/<img[^>]+src="([^"]+)"/i) || 
                     itemXml.match(/<enclosure[^>]+url="([^"]+)"/i);
    const images = imgMatch ? [imgMatch[1]] : [];

    if (title && link) {
      items.push({
        title: title.trim(),
        link: link.trim(),
        description: description.replace(/<[^>]*>/g, '').trim().slice(0, 500),
        pubDate: pubDate.trim(),
        images,
      });
    }
  }

  console.log(`Parsed ${items.length} news items`);
  return items;
}

// Scrape full article with Firecrawl
async function scrapeFullArticle(url: string): Promise<{ content: string; images: string[] }> {
  if (!firecrawlApiKey) {
    console.log('No Firecrawl API key');
    return { content: '', images: [] };
  }

  try {
    console.log(`Scraping article: ${url}`);
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      }),
    });

    if (!response.ok) {
      console.error('Firecrawl error:', response.status);
      return { content: '', images: [] };
    }

    const data = await response.json();
    const markdown = data.data?.markdown || '';
    const html = data.data?.html || '';
    
    // Extract images from HTML
    const imgRegex = /<img[^>]+src="([^"]+)"/gi;
    const images: string[] = [];
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const imgUrl = match[1];
      if (imgUrl.startsWith('http') && !imgUrl.includes('icon') && !imgUrl.includes('logo')) {
        images.push(imgUrl);
      }
    }

    console.log(`Scraped ${markdown.length} chars, ${images.length} images`);
    return { content: markdown, images: images.slice(0, 5) };
  } catch (error) {
    console.error('Scrape error:', error);
    return { content: '', images: [] };
  }
}

// Translate text using Lovable AI
async function translateToRussian(text: string, type: 'title' | 'content' | 'full'): Promise<string> {
  if (!lovableApiKey || !text) return text;

  const systemPrompts: Record<string, string> = {
    title: 'Ты профессиональный переводчик с вьетнамского на русский. Переводи заголовки новостей кратко и понятно. Отвечай только переводом.',
    content: 'Ты профессиональный переводчик с вьетнамского на русский. Переводи текст кратко, сохраняя смысл. Отвечай только переводом.',
    full: 'Ты профессиональный переводчик с вьетнамского на русский. Переводи полный текст статьи, сохраняя структуру и форматирование (заголовки, абзацы). Отвечай только переводом.',
  };

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
          { role: 'system', content: systemPrompts[type] || systemPrompts.content },
          { role: 'user', content: `Переведи на русский:\n\n${text.slice(0, type === 'full' ? 8000 : 2000)}` }
        ],
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

// Create Telegraph page for long articles
async function createTelegraphPage(title: string, content: string, images: string[]): Promise<string | null> {
  try {
    // Create Telegraph account token (or use existing)
    const accountResponse = await fetch('https://api.telegra.ph/createAccount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        short_name: 'SaigonNews',
        author_name: 'Saigon Properties',
        author_url: 'https://t.me/saigon_realty_vn',
      }),
    });
    
    const accountData = await accountResponse.json();
    const accessToken = accountData.result?.access_token;
    
    if (!accessToken) {
      console.error('Failed to create Telegraph account');
      return null;
    }

    // Build content with images
    const nodes: any[] = [];
    
    // Add first image as header
    if (images.length > 0) {
      nodes.push({ tag: 'figure', children: [
        { tag: 'img', attrs: { src: images[0] } }
      ]});
    }
    
    // Split content into paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    let imageIndex = 1;
    
    for (const para of paragraphs) {
      if (para.startsWith('#')) {
        // Header
        const level = para.match(/^#+/)?.[0].length || 1;
        const text = para.replace(/^#+\s*/, '');
        nodes.push({ tag: level <= 2 ? 'h3' : 'h4', children: [text] });
      } else if (para.trim()) {
        nodes.push({ tag: 'p', children: [para] });
      }
      
      // Insert image every few paragraphs
      if (imageIndex < images.length && nodes.length % 4 === 0) {
        nodes.push({ tag: 'figure', children: [
          { tag: 'img', attrs: { src: images[imageIndex] } }
        ]});
        imageIndex++;
      }
    }
    
    // Add source link
    nodes.push({ tag: 'p', children: [
      { tag: 'i', children: ['Источник: VNExpress | @saigon_realty_vn'] }
    ]});

    // Create page
    const pageResponse = await fetch('https://api.telegra.ph/createPage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: accessToken,
        title: title.slice(0, 256),
        author_name: 'Saigon Properties',
        author_url: 'https://t.me/saigon_realty_vn',
        content: nodes,
        return_content: false,
      }),
    });

    const pageData = await pageResponse.json();
    console.log('Telegraph page created:', pageData.result?.url);
    return pageData.result?.url || null;
  } catch (error) {
    console.error('Telegraph error:', error);
    return null;
  }
}

// Calculate relevance score
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
    const { action, category, translate = true, limit = 5, detailed = true, article_id } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'fetch_and_translate') {
      console.log(`Starting news fetch: category=${category}, detailed=${detailed}`);
      
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
          console.log(`Article exists: ${item.title.slice(0, 40)}...`);
          continue;
        }

        // Calculate relevance
        const relevanceScore = calculateRelevanceScore(item.title, item.description);
        
        // Scrape full article if detailed mode and high relevance
        let fullContent = item.description;
        let images = item.images || [];
        
        if (detailed && relevanceScore >= 50 && firecrawlApiKey) {
          const scraped = await scrapeFullArticle(item.link);
          if (scraped.content) {
            fullContent = scraped.content;
            images = [...new Set([...images, ...scraped.images])];
          }
          await new Promise(r => setTimeout(r, 1000)); // Rate limit
        }

        // Translate
        let translatedTitle = item.title;
        let translatedContent = item.description;
        let translatedFullContent = '';
        
        if (translate && relevanceScore >= 50) {
          console.log(`Translating: ${item.title.slice(0, 40)}...`);
          translatedTitle = await translateToRussian(item.title, 'title');
          translatedContent = await translateToRussian(item.description, 'content');
          
          if (detailed && fullContent.length > 500) {
            translatedFullContent = await translateToRussian(fullContent, 'full');
          }
          await new Promise(r => setTimeout(r, 500));
        }

        // Create Telegraph page for detailed articles
        let telegraphUrl = null;
        if (detailed && translatedFullContent && images.length > 0) {
          telegraphUrl = await createTelegraphPage(translatedTitle, translatedFullContent, images);
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
            full_content: translatedFullContent || null,
            images: images,
            telegraph_url: telegraphUrl,
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
      }

      // Update source count
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

      return new Response(JSON.stringify({ success: true, articles }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'translate_article') {
      const { data: article } = await supabase
        .from('news_articles')
        .select('*')
        .eq('id', article_id)
        .single();

      if (!article) throw new Error('Article not found');

      // Scrape full content if not already done
      let fullContent = article.full_content || article.original_content || '';
      let images = article.images || [];
      
      if (!article.full_content && firecrawlApiKey && article.original_url) {
        const scraped = await scrapeFullArticle(article.original_url);
        if (scraped.content) {
          fullContent = scraped.content;
          images = [...new Set([...images, ...scraped.images])];
        }
      }

      const translatedTitle = await translateToRussian(article.original_title, 'title');
      const translatedContent = await translateToRussian(article.original_content || '', 'content');
      const translatedFullContent = fullContent ? await translateToRussian(fullContent, 'full') : '';

      // Create Telegraph page
      let telegraphUrl = null;
      if (translatedFullContent && images.length > 0) {
        telegraphUrl = await createTelegraphPage(translatedTitle, translatedFullContent, images);
      }

      const { data: updated, error } = await supabase
        .from('news_articles')
        .update({
          translated_title: translatedTitle,
          translated_content: translatedContent,
          full_content: translatedFullContent,
          images: images,
          telegraph_url: telegraphUrl,
          is_processed: true,
        })
        .eq('id', article_id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, article: updated }), {
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
