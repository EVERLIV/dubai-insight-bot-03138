import Hero from "@/components/Hero";
import PropertySearch from "@/components/PropertySearch";
import MarketAnalytics from "@/components/MarketAnalytics";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import RealtimeMarketIndicators from "@/components/RealtimeMarketIndicators";
import Developers from "@/components/Developers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Activity, Search, TrendingUp, Building2 } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Hero />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Professional PropTech Platform</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Комплексная платформа для анализа рынка недвижимости Дубая с real-time данными, 
            продвинутой аналитикой и инструментами для профессионалов рынка
          </p>
        </div>

        <Tabs defaultValue="search" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Поиск объектов
            </TabsTrigger>
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Real-time индикаторы
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Продвинутая аналитика
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Рыночные данные
            </TabsTrigger>
            <TabsTrigger value="developers" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Застройщики
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-6 w-6" />
                  Поиск недвижимости
                </CardTitle>
                <CardDescription>
                  Найдите идеальную недвижимость с помощью интеллектуального поиска
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PropertySearch />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="realtime" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-6 w-6" />
                  Real-time Market Indicators
                </CardTitle>
                <CardDescription>
                  Индикаторы рынка в реальном времени для принятия быстрых решений
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RealtimeMarketIndicators />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Продвинутая аналитика
                </CardTitle>
                <CardDescription>
                  Глубокий анализ рынка для профессиональных инвесторов и девелоперов
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdvancedAnalytics />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="market" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  Рыночные данные
                </CardTitle>
                <CardDescription>
                  Традиционная аналитика и обзоры рынка недвижимости
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MarketAnalytics />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="developers" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-6 w-6" />
                  Застройщики Дубая
                </CardTitle>
                <CardDescription>
                  Топ-10 ведущих застройщиков с лучшими онлайн-платформами и сервисами
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Developers />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Stats Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-card rounded-lg border">
            <div className="text-3xl font-bold text-primary">2.8M+</div>
            <div className="text-sm text-muted-foreground">Объектов в базе</div>
          </div>
          <div className="text-center p-6 bg-card rounded-lg border">
            <div className="text-3xl font-bold text-green-600">98.5%</div>
            <div className="text-sm text-muted-foreground">Точность данных</div>
          </div>
          <div className="text-center p-6 bg-card rounded-lg border">
            <div className="text-3xl font-bold text-blue-600">24/7</div>
            <div className="text-sm text-muted-foreground">Обновление данных</div>
          </div>
          <div className="text-center p-6 bg-card rounded-lg border">
            <div className="text-3xl font-bold text-purple-600">15k+</div>
            <div className="text-sm text-muted-foreground">Профессиональных пользователей</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;