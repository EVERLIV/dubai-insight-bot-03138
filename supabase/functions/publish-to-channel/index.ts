import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const botToken = Deno.env.get('VIETNAM_BOT_TOKEN');
const CHANNEL_ID = Deno.env.get('TELEGRAM_CHANNEL_ID') || '@saigon_realty_vn'; // Default channel

interface NewsArticle {
  id: number;
  original_title: string;
  original_content: string | null;
  original_url: string | null;
  translated_title: string | null;
  translated_content: string | null;
  full_content: string | null;
  relevance_score: number | null;
  is_posted: boolean;
  images: string[] | null;
  telegraph_url: string | null;
}

// Send message to Telegram channel
async function sendToChannel(text: string, parseMode: string = 'HTML'): Promise<boolean> {
  if (!botToken) {
    console.error('No bot token configured');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHANNEL_ID,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: false,
      }),
    });

    const result = await response.json();
    
    if (!result.ok) {
      console.error('Telegram error:', result);
      return false;
    }
    
    console.log('Message sent to channel:', result.result?.message_id);
    return true;
  } catch (error) {
    console.error('Error sending to channel:', error);
    return false;
  }
}

// Send photo with caption to channel
async function sendPhotoToChannel(photoUrl: string, caption: string): Promise<boolean> {
  if (!botToken) {
    console.error('No bot token configured');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHANNEL_ID,
        photo: photoUrl,
        caption: caption.slice(0, 1024), // Telegram caption limit
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();
    
    if (!result.ok) {
      console.error('Telegram photo error:', result);
      return false;
    }
    
    console.log('Photo sent to channel:', result.result?.message_id);
    return true;
  } catch (error) {
    console.error('Error sending photo:', error);
    return false;
  }
}

// Format news article for Telegram (with Telegraph link for long content)
function formatNewsPost(article: NewsArticle): { text: string; hasPhoto: boolean; photoUrl: string | null } {
  const title = article.translated_title || article.original_title;
  const content = article.translated_content || article.original_content || '';
  const hasTelegraph = !!article.telegraph_url;
  const hasImages = article.images && article.images.length > 0;
  
  let post = `📰 <b>${escapeHtml(title)}</b>\n\n`;
  
  if (hasTelegraph) {
    // Short engaging preview + Telegraph link
    const preview = content.slice(0, 400);
    post += `${escapeHtml(preview)}...\n\n`;
    post += `📖 ${article.telegraph_url}\n\n`;
  } else {
    // Full content (truncated)
    const truncatedContent = content.length > 900 
      ? content.substring(0, 900) + '...' 
      : content;
    post += `${escapeHtml(truncatedContent)}\n\n`;
  }
  
  if (article.original_url) {
    post += `🔗 ${article.original_url}\n\n`;
  }
  
  post += `#новости #вьетнам #сайгон`;
  
  return {
    text: post,
    hasPhoto: !!(hasImages),
    photoUrl: hasImages ? article.images![0] : null,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, article_id } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Publish specific article
    if (action === 'publish_article' && article_id) {
      const { data: article, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('id', article_id)
        .single();

      if (error || !article) {
        throw new Error('Article not found');
      }

      const { text, hasPhoto, photoUrl } = formatNewsPost(article as NewsArticle);
      const success = hasPhoto && photoUrl 
        ? await sendPhotoToChannel(photoUrl, text)
        : await sendToChannel(text);

      if (success) {
        await supabase
          .from('news_articles')
          .update({ is_posted: true })
          .eq('id', article_id);

        return new Response(JSON.stringify({
          success: true,
          message: 'Опубликовано в канал',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        throw new Error('Failed to send to channel');
      }
    }

    // Auto-publish best unpublished article
    if (action === 'auto_publish') {
      // Get best unpublished article (highest relevance, translated)
      const { data: articles, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('is_posted', false)
        .eq('is_processed', true)
        .not('translated_title', 'is', null)
        .order('relevance_score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!articles || articles.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Нет новых статей для публикации',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const article = articles[0] as NewsArticle;
      const { text, hasPhoto, photoUrl } = formatNewsPost(article);
      const success = hasPhoto && photoUrl 
        ? await sendPhotoToChannel(photoUrl, text)
        : await sendToChannel(text);

      if (success) {
        await supabase
          .from('news_articles')
          .update({ is_posted: true })
          .eq('id', article.id);

        return new Response(JSON.stringify({
          success: true,
          message: 'Автоматически опубликовано',
          article_id: article.id,
          title: article.translated_title || article.original_title,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        throw new Error('Failed to send to channel');
      }
    }

    // Morning digest - generate and publish
    if (action === 'morning_digest') {
      console.log('Generating morning digest...');
      
      // Call generate-channel-content function
      const generateResponse = await fetch(`${supabaseUrl}/functions/v1/generate-channel-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({ postType: 'morning_digest' }),
      });

      if (!generateResponse.ok) {
        throw new Error('Failed to generate morning digest');
      }

      const generateData = await generateResponse.json();
      
      if (!generateData.success || !generateData.content) {
        throw new Error('No content generated');
      }

      console.log('Morning digest generated, publishing...');
      
      // Send to channel (plain text, no HTML)
      const success = await sendToChannel(generateData.content, 'Markdown');

      if (success) {
        // Save to channel_posts
        await supabase.from('channel_posts').insert({
          post_type: 'morning_digest',
          title: 'Утренний дайджест ' + new Date().toLocaleDateString('ru'),
          content: generateData.content,
          status: 'published',
          published_at: new Date().toISOString(),
          ai_generated: true,
        });

        return new Response(JSON.stringify({
          success: true,
          message: 'Утренний дайджест опубликован',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        throw new Error('Failed to send morning digest to channel');
      }
    }

    // Get publishing stats
    if (action === 'stats') {
      const { count: totalCount } = await supabase
        .from('news_articles')
        .select('*', { count: 'exact', head: true });

      const { count: postedCount } = await supabase
        .from('news_articles')
        .select('*', { count: 'exact', head: true })
        .eq('is_posted', true);

      const { count: pendingCount } = await supabase
        .from('news_articles')
        .select('*', { count: 'exact', head: true })
        .eq('is_posted', false)
        .eq('is_processed', true);

      return new Response(JSON.stringify({
        success: true,
        stats: {
          total: totalCount || 0,
          posted: postedCount || 0,
          pending: pendingCount || 0,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in publish-to-channel:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
