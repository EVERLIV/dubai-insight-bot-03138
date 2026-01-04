import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  images?: string[];
  fullContent?: string;
}

// Parse RSS feed from VNExpress - all categories
async function fetchVNExpressNews(category: string = 'all'): Promise<NewsItem[]> {
  const rssUrls: Record<string, string> = {
    'tin-tuc-24h': 'https://vnexpress.net/rss/tin-moi-nhat.rss',
    'bat-dong-san': 'https://vnexpress.net/rss/bat-dong-san.rss',
    'kinh-doanh': 'https://vnexpress.net/rss/kinh-doanh.rss',
    'doi-song': 'https://vnexpress.net/rss/doi-song.rss',
    'du-lich': 'https://vnexpress.net/rss/du-lich.rss',
    'thoi-su': 'https://vnexpress.net/rss/thoi-su.rss',
  };

  const allItems: NewsItem[] = [];
  
  // If 'all' - fetch from all categories
  const categoriesToFetch = category === 'all' 
    ? Object.keys(rssUrls) 
    : [category];
  
  for (const cat of categoriesToFetch) {
    const rssUrl = rssUrls[cat] || rssUrls['tin-tuc-24h'];
    console.log(`Fetching RSS from: ${rssUrl}`);
    
    try {
      const response = await fetch(rssUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' },
      });

      if (!response.ok) {
        console.error(`Failed to fetch RSS ${cat}: ${response.status}`);
        continue;
      }

      const xml = await response.text();
      const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      
      for (const itemXml of itemMatches.slice(0, 5)) {
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
          allItems.push({
            title: title.trim(),
            link: link.trim(),
            description: description.replace(/<[^>]*>/g, '').trim().slice(0, 500),
            pubDate: pubDate.trim(),
            images,
          });
        }
      }
    } catch (err) {
      console.error(`Error fetching ${cat}:`, err);
    }
  }

  // Remove duplicates by URL
  const uniqueItems = allItems.filter((item, index, self) => 
    index === self.findIndex(t => t.link === item.link)
  );

  console.log(`Parsed ${uniqueItems.length} unique news items from ${categoriesToFetch.length} categories`);
  return uniqueItems;
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
        waitFor: 2000,
      }),
    });

    if (!response.ok) {
      console.error('Firecrawl error:', response.status);
      return { content: '', images: [] };
    }

    const data = await response.json();
    let markdown = data.data?.markdown || '';
    const html = data.data?.html || '';
    
    // Clean up markdown - remove navigation and menu items
    markdown = cleanArticleContent(markdown);
    
    // If markdown is too short or contains mostly links, try extracting from HTML
    if (markdown.length < 200 || isNavigationContent(markdown)) {
      const extractedContent = extractArticleFromHtml(html);
      if (extractedContent.length > markdown.length) {
        markdown = extractedContent;
      }
    }
    
    // Extract images from HTML
    const images = extractArticleImages(html);

    console.log(`Scraped ${markdown.length} chars, ${images.length} images`);
    return { content: markdown, images };
  } catch (error) {
    console.error('Scrape error:', error);
    return { content: '', images: [] };
  }
}

// Check if content is navigation/menu
function isNavigationContent(content: string): boolean {
  const lines = content.split('\n').filter(l => l.trim());
  const linkLines = lines.filter(l => l.includes('[') && l.includes(']('));
  // If more than 60% of lines are links, it's probably navigation
  return linkLines.length > lines.length * 0.6;
}

// Clean article content from navigation elements
function cleanArticleContent(markdown: string): string {
  const lines = markdown.split('\n');
  const cleanedLines: string[] = [];
  let skipSection = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip navigation sections
    if (trimmed.match(/^\[.*\]\(https:\/\/vnexpress\.net\/(thoi-su|the-gioi|kinh-doanh|giai-tri|phap-luat|giao-duc|doi-song|du-lich|khoa-hoc|suc-khoe|oto-xe-may|the-thao|bat-dong-san|goc-nhin|vne-go)/)) {
      continue;
    }
    
    // Skip common navigation patterns
    if (trimmed === 'Показать больше' || 
        trimmed === 'Show more' ||
        trimmed.match(/^-\s*\[.*\]\(.*\)$/) ||
        trimmed.match(/^\[VnE-GO\]/) ||
        trimmed.match(/^\[Discover\]/) ||
        trimmed.match(/^\[Shorts\]/) ||
        trimmed.match(/^\[Подкасты\]/) ||
        trimmed.match(/^#+\s*\[/) ||
        (trimmed.startsWith('[') && trimmed.includes('](https://vnexpress.net') && trimmed.endsWith(')'))
       ) {
      continue;
    }
    
    // Skip sections that are just lists of links
    if (trimmed.startsWith('- [') && trimmed.includes('](')) {
      continue;
    }
    
    // Keep actual content
    if (trimmed.length > 0) {
      cleanedLines.push(line);
    }
  }
  
  // Join and clean up multiple empty lines
  return cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Extract article content from HTML more precisely
function extractArticleFromHtml(html: string): string {
  // Try to find article body in VNExpress HTML structure
  const articleBodyMatch = html.match(/<article[^>]*class="[^"]*fck_detail[^"]*"[^>]*>([\s\S]*?)<\/article>/i) ||
                          html.match(/<div[^>]*class="[^"]*fck_detail[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                          html.match(/<div[^>]*class="[^"]*article-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  
  if (!articleBodyMatch) {
    return '';
  }
  
  let content = articleBodyMatch[1];
  
  // Remove HTML tags but keep text
  content = content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, text) => `${'#'.repeat(parseInt(level))} ${text}\n`)
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return content;
}

// Extract article images (not icons/logos)
function extractArticleImages(html: string): string[] {
  const images: string[] = [];
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    const imgUrl = match[1];
    // Filter out icons, logos, tracking pixels
    if (imgUrl.startsWith('http') && 
        !imgUrl.includes('icon') && 
        !imgUrl.includes('logo') &&
        !imgUrl.includes('tracking') &&
        !imgUrl.includes('pixel') &&
        !imgUrl.includes('avatar') &&
        !imgUrl.includes('btn') &&
        (imgUrl.includes('.jpg') || imgUrl.includes('.jpeg') || imgUrl.includes('.png') || imgUrl.includes('.webp')) &&
        (imgUrl.includes('vnecdn') || imgUrl.includes('vnexpress'))
       ) {
      images.push(imgUrl);
    }
  }
  
  // Return unique images, max 5
  return [...new Set(images)].slice(0, 5);
}

// Translate text using OpenAI
async function translateToRussian(text: string, type: 'title' | 'content' | 'full'): Promise<string> {
  if (!openaiApiKey || !text) return text;

  const systemPrompts: Record<string, string> = {
    title: 'Ты профессиональный переводчик и редактор новостей. Переводи заголовки с вьетнамского на русский — делай их цепляющими и интригующими, но точно передавай суть. Отвечай только переводом.',
    content: 'Ты профессиональный переводчик и редактор новостей. Переводи текст с вьетнамского на русский, делая его живым и интересным для читателя. Передавай главную суть события, добавляй контекст если нужно. Пиши увлекательно, как для друга, который хочет узнать самое важное. Отвечай только переводом.',
    full: 'Ты профессиональный переводчик и редактор новостей. Переводи статью с вьетнамского на русский, сохраняя структуру. Пиши живым, увлекательным языком — передавай эмоции и контекст. Делай текст интересным для русскоязычного читателя во Вьетнаме. Отвечай только переводом.',
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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

        // Calculate relevance (for sorting, not filtering)
        const relevanceScore = calculateRelevanceScore(item.title, item.description);
        
        // Scrape full article if detailed mode (no relevance filter)
        let fullContent = item.description;
        let images = item.images || [];
        
        if (detailed && firecrawlApiKey) {
          const scraped = await scrapeFullArticle(item.link);
          if (scraped.content) {
            fullContent = scraped.content;
            images = [...new Set([...images, ...scraped.images])];
          }
          await new Promise(r => setTimeout(r, 1000)); // Rate limit
        }

        // Translate ALL articles (no relevance filter)
        let translatedTitle = item.title;
        let translatedContent = item.description;
        let translatedFullContent = '';
        
        if (translate) {
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
