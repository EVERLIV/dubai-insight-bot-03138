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
  FileText, Dumbbell, Radio
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
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState('district_review');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedToday: 0,
    scheduledPosts: 0,
    aiGenerated: 0,
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
      
      if (postsData) {
        setPosts(postsData as ChannelPost[]);
        
        const today = new Date().toISOString().split('T')[0];
        setStats({
          totalPosts: postsData.length,
          publishedToday: postsData.filter((p: any) => p.published_at?.startsWith(today)).length,
          scheduledPosts: postsData.filter((p: any) => p.status === 'scheduled').length,
          aiGenerated: postsData.filter((p: any) => p.ai_generated).length,
        });
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

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="generate">🤖 Генерация</TabsTrigger>
          <TabsTrigger value="posts">📋 Посты</TabsTrigger>
          <TabsTrigger value="districts">🗺️ Районы</TabsTrigger>
          <TabsTrigger value="schedule">⏰ Расписание</TabsTrigger>
        </TabsList>

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
