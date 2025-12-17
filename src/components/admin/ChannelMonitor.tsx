import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Send, Calendar, Sparkles, MapPin, Newspaper, Clock, 
  MessageSquare, RefreshCw, Building, Utensils, DollarSign, 
  FileText, Dumbbell, Radio, Globe, Languages, ExternalLink
} from 'lucide-react';

interface ChannelPost {
  id: number;
  post_type: string;
  title: string;
  content: string;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  ai_generated: boolean;
  created_at: string;
}

interface DistrictReview {
  id: number;
  district: string;
  description: string;
  avg_rent_1br: number;
  avg_rent_2br: number;
  infrastructure_score: number;
  expat_friendly_score: number;
  nightlife_score: number;
  family_score: number;
}

interface ContentSchedule {
  id: number;
  day_of_week: number | null;
  post_time: string;
  post_type: string;
  template: string;
  is_active: boolean;
}

interface NewsArticle {
  id: number;
  original_title: string;
  original_content: string | null;
  original_url: string | null;
  translated_title: string | null;
  translated_content: string | null;
  relevance_score: number | null;
  is_processed: boolean;
  is_posted: boolean;
  published_date: string | null;
  created_at: string;
}

const NEWS_CATEGORIES = [
  { value: 'tin-tuc-24h', label: 'Последние новости' },
  { value: 'bat-dong-san', label: 'Недвижимость' },
  { value: 'kinh-doanh', label: 'Бизнес' },
  { value: 'doi-song', label: 'Жизнь' },
  { value: 'du-lich', label: 'Туризм' },
];

const POST_TYPE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  morning_digest: { icon: Newspaper, label: 'Утренний дайджест', color: 'bg-yellow-500' },
  district_review: { icon: MapPin, label: 'Район дня', color: 'bg-blue-500' },
  evening_entertainment: { icon: Utensils, label: 'Куда пойти', color: 'bg-purple-500' },
  apartment_week: { icon: Building, label: 'Квартира недели', color: 'bg-green-500' },
  prices_update: { icon: DollarSign, label: 'Цены', color: 'bg-orange-500' },
  visa_guide: { icon: FileText, label: 'Визы/документы', color: 'bg-red-500' },
  sport_fitness: { icon: Dumbbell, label: 'Спорт/фитнес', color: 'bg-pink-500' },
  news: { icon: Newspaper, label: 'Новости', color: 'bg-gray-500' },
};

const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export const ChannelMonitor = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<ChannelPost[]>([]);
  const [districts, setDistricts] = useState<DistrictReview[]>([]);
  const [schedule, setSchedule] = useState<ContentSchedule[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState('district_review');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedNewsCategory, setSelectedNewsCategory] = useState('bat-dong-san');
  const [translateNews, setTranslateNews] = useState(true);
  const [generatedContent, setGeneratedContent] = useState('');
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedToday: 0,
    scheduledPosts: 0,
    aiGenerated: 0,
    totalNews: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch posts
      const { data: postsData } = await supabase
        .from('channel_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      // Fetch news articles
      const { data: newsData } = await supabase
        .from('news_articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (postsData) {
        setPosts(postsData as ChannelPost[]);
        
        const today = new Date().toISOString().split('T')[0];
        setStats({
          totalPosts: postsData.length,
          publishedToday: postsData.filter((p: any) => p.published_at?.startsWith(today)).length,
          scheduledPosts: postsData.filter((p: any) => p.status === 'scheduled').length,
          aiGenerated: postsData.filter((p: any) => p.ai_generated).length,
          totalNews: newsData?.length || 0,
        });
      }
      
      if (newsData) {
        setNewsArticles(newsData as NewsArticle[]);
      }

      // Fetch districts
      const { data: districtsData } = await supabase
        .from('district_reviews')
        .select('*')
        .order('district');
      
      if (districtsData) setDistricts(districtsData as DistrictReview[]);

      // Fetch schedule
      const { data: scheduleData } = await supabase
        .from('content_schedule')
        .select('*')
        .order('post_time');
      
      if (scheduleData) setSchedule(scheduleData as ContentSchedule[]);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateContent = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-channel-content', {
        body: { 
          postType: selectedPostType,
          district: selectedDistrict || undefined,
        }
      });

      if (error) throw error;

      setGeneratedContent(data.content);
      toast({
        title: 'Контент сгенерирован',
        description: 'AI создал пост для канала',
      });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: 'Ошибка генерации',
        description: 'Не удалось сгенерировать контент',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const parseNews = async () => {
    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-vnexpress', {
        body: { 
          action: 'fetch_and_translate',
          category: selectedNewsCategory,
          translate: translateNews,
          limit: 5,
        }
      });

      if (error) throw error;

      toast({
        title: 'Новости загружены',
        description: `Получено ${data.fetched} новостей, сохранено ${data.saved}`,
      });
      
      fetchData();
    } catch (error) {
      console.error('Error parsing news:', error);
      toast({
        title: 'Ошибка парсинга',
        description: 'Не удалось загрузить новости',
        variant: 'destructive',
      });
    } finally {
      setIsParsing(false);
    }
  };

  const translateArticle = async (articleId: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('parse-vnexpress', {
        body: { 
          action: 'translate_article',
          article_id: articleId,
        }
      });

      if (error) throw error;

      toast({ title: 'Переведено!' });
      fetchData();
    } catch (error) {
      console.error('Error translating:', error);
      toast({
        title: 'Ошибка перевода',
        variant: 'destructive',
      });
    }
  };

  const publishToChannel = async (articleId: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('publish-to-channel', {
        body: { 
          action: 'publish_article',
          article_id: articleId,
        }
      });

      if (error) throw error;

      toast({ title: 'Опубликовано в канал!' });
      fetchData();
    } catch (error) {
      console.error('Error publishing:', error);
      toast({
        title: 'Ошибка публикации',
        description: 'Проверьте настройки канала',
        variant: 'destructive',
      });
    }
  };

  const autoPublish = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('publish-to-channel', {
        body: { action: 'auto_publish' }
      });

      if (error) throw error;

      if (data.success) {
        toast({ 
          title: 'Автопубликация', 
          description: data.title || 'Новость опубликована' 
        });
        fetchData();
      } else {
        toast({ 
          title: 'Нет новостей', 
          description: data.message,
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Error auto-publishing:', error);
      toast({
        title: 'Ошибка',
        variant: 'destructive',
      });
    }
  };

  const savePost = async (status: 'draft' | 'scheduled') => {
    if (!generatedContent) return;

    try {
      const { error } = await supabase.from('channel_posts').insert({
        post_type: selectedPostType,
        title: generatedContent.split('\n')[0].replace(/[🏠📰💰🍜🌅🌙🏋️📋💰📍]/g, '').trim().substring(0, 100),
        content: generatedContent,
        status,
        ai_generated: true,
        scheduled_at: status === 'scheduled' ? new Date(Date.now() + 3600000).toISOString() : null,
      });

      if (error) throw error;

      toast({
        title: status === 'draft' ? 'Сохранено в черновики' : 'Запланировано',
        description: 'Пост успешно сохранен',
      });
      
      setGeneratedContent('');
      fetchData();
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить пост',
        variant: 'destructive',
      });
    }
  };

  const publishPost = async (postId: number, content: string) => {
    try {
      toast({
        title: 'Публикация...',
        description: 'Отправляем в канал',
      });

      // Update post status if it's an existing post
      if (postId > 0) {
        await supabase
          .from('channel_posts')
          .update({ 
            status: 'published', 
            published_at: new Date().toISOString() 
          })
          .eq('id', postId);
      }

      toast({
        title: 'Готово',
        description: 'Пост готов к публикации. Скопируйте и отправьте в канал вручную.',
      });
      
      fetchData();
    } catch (error) {
      console.error('Error publishing:', error);
      toast({
        title: 'Ошибка публикации',
        variant: 'destructive',
      });
    }
  };

  const toggleSchedule = async (id: number, isActive: boolean) => {
    try {
      await supabase
        .from('content_schedule')
        .update({ is_active: isActive })
        .eq('id', id);
      
      fetchData();
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' VND';
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      scheduled: 'bg-yellow-500',
      published: 'bg-green-500',
      failed: 'bg-red-500',
    };
    return <Badge className={colors[status] || 'bg-gray-500'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.totalPosts}</span>
            </div>
            <p className="text-xs text-muted-foreground">Всего постов</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{stats.publishedToday}</span>
            </div>
            <p className="text-xs text-muted-foreground">Опубликовано сегодня</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">{stats.scheduledPosts}</span>
            </div>
            <p className="text-xs text-muted-foreground">В очереди</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-2xl font-bold">{stats.aiGenerated}</span>
            </div>
            <p className="text-xs text-muted-foreground">AI-контент</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="news" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="news">📰 Новости</TabsTrigger>
          <TabsTrigger value="generate">🤖 Генерация</TabsTrigger>
          <TabsTrigger value="posts">📋 Посты</TabsTrigger>
          <TabsTrigger value="districts">🗺️ Районы</TabsTrigger>
          <TabsTrigger value="schedule">⏰ Расписание</TabsTrigger>
        </TabsList>

        {/* News Parsing */}
        <TabsContent value="news" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Парсинг VNExpress
              </CardTitle>
              <CardDescription>
                Загрузка новостей с вьетнамских СМИ и AI-перевод на русский
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Категория</Label>
                  <Select value={selectedNewsCategory} onValueChange={setSelectedNewsCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NEWS_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>AI-перевод</Label>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch 
                      checked={translateNews} 
                      onCheckedChange={setTranslateNews} 
                    />
                    <span className="text-sm text-muted-foreground">
                      {translateNews ? 'Включен' : 'Выключен'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button 
                    onClick={parseNews} 
                    disabled={isParsing}
                    className="w-full"
                  >
                    {isParsing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Загрузка...
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4 mr-2" />
                        Загрузить новости
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Загруженные новости ({newsArticles.length})
                </CardTitle>
              </div>
              <Button onClick={autoPublish} variant="default" size="sm">
                <Send className="h-4 w-4 mr-2" />
                Автопубликация
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {newsArticles.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Новостей пока нет. Загрузите с VNExpress!
                    </p>
                  ) : (
                    newsArticles.map((article) => (
                      <Card key={article.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">
                                {article.translated_title || article.original_title}
                              </h4>
                              {article.translated_title && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  📝 {article.original_title}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {article.relevance_score && (
                                <Badge 
                                  variant={article.relevance_score >= 70 ? 'default' : 'outline'}
                                  className="text-xs"
                                >
                                  {article.relevance_score}%
                                </Badge>
                              )}
                              {article.is_processed ? (
                                <Badge className="bg-green-500 text-xs">
                                  <Languages className="h-3 w-3 mr-1" />
                                  RU
                                </Badge>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => translateArticle(article.id)}
                                >
                                  <Languages className="h-3 w-3 mr-1" />
                                  Перевести
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {article.translated_content && (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {article.translated_content}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {article.published_date 
                                ? new Date(article.published_date).toLocaleString('ru') 
                                : new Date(article.created_at).toLocaleString('ru')}
                            </span>
                            <div className="flex items-center gap-2">
                              {article.is_posted ? (
                                <Badge className="bg-green-500 text-xs">✓ В канале</Badge>
                              ) : article.is_processed ? (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => publishToChannel(article.id)}
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  В канал
                                </Button>
                              ) : null}
                              {article.original_url && (
                                <a 
                                  href={article.original_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="hover:text-primary"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const text = `📰 ${article.translated_title || article.original_title}\n\n${article.translated_content || article.original_content || ''}\n\n🔗 ${article.original_url || ''}`;
                                  navigator.clipboard.writeText(text);
                                  toast({ title: 'Скопировано!' });
                                }}
                              >
                                📋
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Content Generation */}
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Генератор контента
              </CardTitle>
              <CardDescription>
                Автоматическая генерация постов для Telegram канала
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Тип контента</Label>
                  <Select value={selectedPostType} onValueChange={setSelectedPostType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(POST_TYPE_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPostType === 'district_review' && (
                  <div className="space-y-2">
                    <Label>Район</Label>
                    <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите район" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((d) => (
                          <SelectItem key={d.id} value={d.district}>
                            {d.district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Button 
                onClick={generateContent} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Генерация...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Сгенерировать контент
                  </>
                )}
              </Button>

              {generatedContent && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Предпросмотр поста</Label>
                    <Textarea
                      value={generatedContent}
                      onChange={(e) => setGeneratedContent(e.target.value)}
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => savePost('draft')}>
                      💾 Черновик
                    </Button>
                    <Button variant="outline" onClick={() => savePost('scheduled')}>
                      ⏰ Запланировать
                    </Button>
                    <Button onClick={() => {
                      navigator.clipboard.writeText(generatedContent);
                      toast({ title: 'Скопировано!' });
                    }}>
                      📋 Копировать
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Posts List */}
        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle>История постов</CardTitle>
              <CardDescription>
                Все посты канала
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {posts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Постов пока нет. Создайте первый!
                    </p>
                  ) : (
                    posts.map((post) => {
                      const config = POST_TYPE_CONFIG[post.post_type];
                      const Icon = config?.icon || Newspaper;
                      
                      return (
                        <Card key={post.id} className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded ${config?.color || 'bg-gray-500'}`}>
                                  <Icon className="h-3 w-3 text-white" />
                                </div>
                                <span className="font-medium text-sm">{post.title}</span>
                                {post.ai_generated && (
                                  <Badge variant="outline" className="text-xs">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    AI
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {post.content.substring(0, 100)}...
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{new Date(post.created_at).toLocaleString('ru')}</span>
                                {getStatusBadge(post.status)}
                              </div>
                            </div>
                            <Button 
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(post.content);
                                toast({ title: 'Скопировано!' });
                              }}
                            >
                              📋
                            </Button>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Districts */}
        <TabsContent value="districts">
          <Card>
            <CardHeader>
              <CardTitle>База районов HCMC</CardTitle>
              <CardDescription>
                Данные для генерации обзоров
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {districts.map((district) => (
                  <Card key={district.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {district.district}
                        </h4>
                        <p className="text-sm text-muted-foreground">{district.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline">1BR: {formatPrice(district.avg_rent_1br)}</Badge>
                          <Badge variant="outline">2BR: {formatPrice(district.avg_rent_2br)}</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className="text-center p-1.5 bg-muted rounded">
                          <div className="font-bold">{district.infrastructure_score}</div>
                          <div className="text-muted-foreground text-[10px]">Инфра</div>
                        </div>
                        <div className="text-center p-1.5 bg-muted rounded">
                          <div className="font-bold">{district.expat_friendly_score}</div>
                          <div className="text-muted-foreground text-[10px]">Экспат</div>
                        </div>
                        <div className="text-center p-1.5 bg-muted rounded">
                          <div className="font-bold">{district.nightlife_score}</div>
                          <div className="text-muted-foreground text-[10px]">Ночь</div>
                        </div>
                        <div className="text-center p-1.5 bg-muted rounded">
                          <div className="font-bold">{district.family_score}</div>
                          <div className="text-muted-foreground text-[10px]">Семья</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Расписание публикаций</CardTitle>
              <CardDescription>
                Автоматическая публикация по расписанию
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedule.map((item) => {
                  const config = POST_TYPE_CONFIG[item.post_type];
                  const Icon = config?.icon || Clock;
                  
                  return (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded ${config?.color || 'bg-gray-500'}`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">{config?.label || item.post_type}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.day_of_week !== null 
                              ? `Каждый ${DAYS[item.day_of_week]}` 
                              : 'Ежедневно'} в {item.post_time}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={(checked) => toggleSchedule(item.id, checked)}
                        />
                        <span className="text-sm text-muted-foreground w-12">
                          {item.is_active ? 'Вкл' : 'Выкл'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChannelMonitor;
