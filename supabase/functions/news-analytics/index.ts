import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

interface NewsArticle {
  title: string;
  content: string;
  url: string;
  published_date: string;
  source: string;
  impact_score?: number;
  categories: string[];
}

interface MarketAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  impact_factors: string[];
  price_prediction: 'increase' | 'decrease' | 'stable';
  confidence: number;
  summary: string;
  key_events: string[];
}

// Fetch Dubai real estate news from multiple sources
async function fetchRealEstateNews(): Promise<{ success: boolean; articles?: NewsArticle[]; error?: string }> {
  const newsArticles: NewsArticle[] = [];
  
  try {
    // Search for Dubai real estate news
    const searchQueries = [
      'Dubai real estate market 2025',
      'Dubai property prices trend',
      'UAE real estate investment news',
      'Dubai property market analysis'
    ];

    for (const query of searchQueries) {
      try {
        // Simulate news fetching (in real implementation, you'd use news APIs like NewsAPI, Google News, etc.)
        const mockNews = await generateMockRealEstateNews(query);
        newsArticles.push(...mockNews);
      } catch (error) {
        console.error(`Error fetching news for query "${query}":`, error);
        continue;
      }
    }

    console.log(`Fetched ${newsArticles.length} news articles`);
    return { success: true, articles: newsArticles };
    
  } catch (error) {
    console.error('Error fetching real estate news:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Generate mock news data (replace with real news API integration)
async function generateMockRealEstateNews(query: string): Promise<NewsArticle[]> {
  const mockArticles: NewsArticle[] = [
    {
      title: "Dubai Property Prices Rise 15% in Q1 2025 Amid Strong Investor Demand",
      content: "Dubai's real estate market continues its upward trajectory with property prices increasing by 15% in the first quarter of 2025. Key growth drivers include international investor confidence, new infrastructure projects, and the upcoming Expo legacy developments.",
      url: "https://example-news.com/dubai-property-rise-2025",
      published_date: new Date().toISOString(),
      source: "Gulf News",
      categories: ["market-trends", "price-increase", "investor-demand"]
    },
    {
      title: "New Metro Line Extension Boosts Property Values in JVC and Dubai South",
      content: "The announcement of the new Dubai Metro Blue Line extension connecting Jumeirah Village Circle to Dubai South has led to immediate property value increases of up to 12% in affected areas.",
      url: "https://example-news.com/metro-line-property-boost",
      published_date: new Date(Date.now() - 24*60*60*1000).toISOString(),
      source: "Emirates Business",
      categories: ["infrastructure", "transportation", "area-development"]
    },
    {
      title: "UAE Central Bank Maintains Positive Mortgage Rates for Q2 2025",
      content: "The UAE Central Bank has maintained favorable mortgage rates for the second quarter of 2025, supporting continued growth in residential property purchases by both nationals and expatriates.",
      url: "https://example-news.com/mortgage-rates-q2-2025",
      published_date: new Date(Date.now() - 2*24*60*60*1000).toISOString(),
      source: "The National",
      categories: ["mortgage-rates", "banking", "government-policy"]
    }
  ];

  return mockArticles.filter(article => 
    article.title.toLowerCase().includes(query.split(' ')[0].toLowerCase()) ||
    article.content.toLowerCase().includes(query.split(' ')[0].toLowerCase())
  );
}

// Analyze news impact on real estate market using AI
async function analyzeMarketImpact(articles: NewsArticle[]): Promise<MarketAnalysis> {
  if (!DEEPSEEK_API_KEY || articles.length === 0) {
    return {
      sentiment: 'neutral',
      impact_factors: ['Limited data available'],
      price_prediction: 'stable',
      confidence: 0.3,
      summary: 'Insufficient data for comprehensive analysis',
      key_events: []
    };
  }

  try {
    const newsContent = articles.map(article => 
      `Title: ${article.title}\nContent: ${article.content}\nSource: ${article.source}`
    ).join('\n\n---\n\n');

    const prompt = `
    Analyze the following Dubai real estate news articles and provide market insights for 2025:

    ${newsContent}

    Based on these news articles from 2025, provide a JSON response with the following structure:
    {
      "sentiment": "positive|negative|neutral", 
      "impact_factors": ["factor1", "factor2", ...],
      "price_prediction": "increase|decrease|stable",
      "confidence": 0.0-1.0,
      "summary": "Brief market summary in Russian for 2025",
      "key_events": ["event1", "event2", ...]
    }

    Focus on factors that directly impact Dubai real estate prices in 2025 such as:
    - Government policies and regulations for 2025
    - Infrastructure developments planned/completed in 2025
    - Economic indicators for current year 2025
    - International investment trends in 2025
    - Supply and demand dynamics in 2025
    - Interest rates and financing conditions in 2025

    Ensure all analysis reflects current 2025 market conditions and trends.
    `;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a Dubai real estate market analyst. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    try {
      const analysis = JSON.parse(analysisText);
      return analysis;
    } catch (parseError) {
      console.error('Failed to parse AI analysis:', parseError);
      return {
        sentiment: 'neutral',
        impact_factors: articles.map(a => a.title),
        price_prediction: 'stable',
        confidence: 0.6,
        summary: 'Автоматический анализ на основе последних новостей рынка недвижимости',
        key_events: articles.slice(0, 3).map(a => a.title)
      };
    }
  } catch (error) {
    console.error('Error in AI market analysis:', error);
    return {
      sentiment: 'neutral',
      impact_factors: ['Ошибка анализа'],
      price_prediction: 'stable',
      confidence: 0.3,
      summary: 'Не удалось провести полный анализ рынка',
      key_events: []
    };
  }
}

// Save market analysis to database
async function saveMarketAnalysis(analysis: MarketAnalysis, articles: NewsArticle[]) {
  try {
    const { error } = await supabase
      .from('market_analysis')
      .insert({
        analysis_date: new Date().toISOString(),
        sentiment: analysis.sentiment,
        impact_factors: analysis.impact_factors,
        price_prediction: analysis.price_prediction,
        confidence_score: analysis.confidence,
        summary: analysis.summary,
        key_events: analysis.key_events,
        news_articles: articles,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving market analysis:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error in saveMarketAnalysis:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action = 'analyze_market' } = await req.json().catch(() => ({}));
    
    console.log('News analytics request:', { action });
    
    if (action === 'analyze_market') {
      // Fetch latest real estate news
      const newsResult = await fetchRealEstateNews();
      
      if (!newsResult.success || !newsResult.articles) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch news articles'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Analyze market impact
      const marketAnalysis = await analyzeMarketImpact(newsResult.articles);
      
      // Save analysis to database
      await saveMarketAnalysis(marketAnalysis, newsResult.articles);
      
      const response = {
        success: true,
        market_analysis: marketAnalysis,
        news_articles: newsResult.articles,
        analysis_timestamp: new Date().toISOString()
      };

      console.log('Market analysis completed:', response);
      
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in news analytics:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});