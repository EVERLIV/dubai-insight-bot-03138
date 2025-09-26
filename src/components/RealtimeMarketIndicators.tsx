import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle,
  DollarSign,
  Users,
  Building,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MarketIndicator {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  status: 'normal' | 'warning' | 'critical';
  lastUpdate: string;
}

interface NewsAlert {
  id: string;
  title: string;
  impact: 'high' | 'medium' | 'low';
  timestamp: string;
  source: string;
}

export default function RealtimeMarketIndicators() {
  const [indicators, setIndicators] = useState<MarketIndicator[]>([]);
  const [newsAlerts, setNewsAlerts] = useState<NewsAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize real-time data
  useEffect(() => {
    const initializeData = () => {
      const mockIndicators: MarketIndicator[] = [
        {
          id: '1',
          title: 'Индекс цен Dubai',
          value: '1,247.8',
          change: 15.7,
          changePercent: 1.28,
          trend: 'up',
          status: 'normal',
          lastUpdate: new Date().toLocaleTimeString('ru-RU')
        },
        {
          id: '2',
          title: 'Объем транзакций',
          value: '2,847',
          change: -43,
          changePercent: -1.49,
          trend: 'down',
          status: 'normal',
          lastUpdate: new Date().toLocaleTimeString('ru-RU')
        },
        {
          id: '3',
          title: 'Средняя доходность',
          value: '7.2%',
          change: 0.3,
          changePercent: 4.35,
          trend: 'up',
          status: 'normal',
          lastUpdate: new Date().toLocaleTimeString('ru-RU')
        },
        {
          id: '4',
          title: 'Время на рынке (дни)',
          value: '32',
          change: -2,
          changePercent: -5.88,
          trend: 'down',
          status: 'warning',
          lastUpdate: new Date().toLocaleTimeString('ru-RU')
        },
        {
          id: '5',
          title: 'Новые листинги',
          value: '189',
          change: 23,
          changePercent: 13.86,
          trend: 'up',
          status: 'normal',
          lastUpdate: new Date().toLocaleTimeString('ru-RU')
        },
        {
          id: '6',
          title: 'Активность инвесторов',
          value: '84%',
          change: 12,
          changePercent: 16.67,
          trend: 'up',
          status: 'normal',
          lastUpdate: new Date().toLocaleTimeString('ru-RU')
        }
      ];

      const mockNews: NewsAlert[] = [
        {
          id: '1',
          title: 'Новые визовые правила ОАЭ стимулируют рынок недвижимости',
          impact: 'high',
          timestamp: '15:30',
          source: 'Emirates Business'
        },
        {
          id: '2',
          title: 'Запуск нового проекта в Business Bay',
          impact: 'medium',
          timestamp: '14:45',
          source: 'Property Week'
        },
        {
          id: '3',
          title: 'Процентные ставки остаются стабильными',
          impact: 'low',
          timestamp: '13:20',
          source: 'Gulf News'
        }
      ];

      setIndicators(mockIndicators);
      setNewsAlerts(mockNews);
      setLastUpdate(new Date().toLocaleString('ru-RU'));
      setIsConnected(true);
      setIsLoading(false);
    };

    initializeData();

    // Simulate real-time updates
    const interval = setInterval(() => {
      setIndicators(prev => prev.map(indicator => ({
        ...indicator,
        change: indicator.change + (Math.random() - 0.5) * 2,
        changePercent: indicator.changePercent + (Math.random() - 0.5) * 0.5,
        lastUpdate: new Date().toLocaleTimeString('ru-RU')
      })));
      setLastUpdate(new Date().toLocaleString('ru-RU'));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchLatestData = async () => {
    setIsLoading(true);
    try {
      // Call market data service
      const { data } = await supabase.functions.invoke('market-data-analytics', {
        body: { 
          type: 'realtime_indicators',
          region: 'dubai'
        }
      });
      
      if (data) {
        console.log('Real-time data updated:', data);
      }
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      setIsConnected(false);
    }
    setIsLoading(false);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: 'normal' | 'warning' | 'critical') => {
    const colors = {
      normal: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge variant="secondary" className={colors[status]}>
        {status === 'normal' ? 'Норма' : 
         status === 'warning' ? 'Внимание' : 'Критично'}
      </Badge>
    );
  };

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with connection status */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            Real-time Market Indicators
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
          </h3>
          <p className="text-muted-foreground">
            Индикаторы рынка в реальном времени • Последнее обновление: {lastUpdate}
          </p>
        </div>
        <Button 
          onClick={fetchLatestData} 
          variant="outline"
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {/* Main indicators grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {indicators.map((indicator) => (
          <Card key={indicator.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    {indicator.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold">{indicator.value}</span>
                    {getTrendIcon(indicator.trend)}
                  </div>
                </div>
                {getStatusBadge(indicator.status)}
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className={`flex items-center gap-1 ${
                  indicator.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <span>{indicator.changePercent >= 0 ? '+' : ''}{indicator.change}</span>
                  <span>({indicator.changePercent >= 0 ? '+' : ''}{indicator.changePercent.toFixed(2)}%)</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {indicator.lastUpdate}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* News alerts and market events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Новости рынка
            </CardTitle>
            <CardDescription>
              Последние события, влияющие на рынок недвижимости
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {newsAlerts.map((news) => (
                <div 
                  key={news.id} 
                  className={`p-3 rounded-lg border-l-4 ${getImpactColor(news.impact)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm mb-1">{news.title}</h5>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{news.source}</span>
                        <span>•</span>
                        <span>{news.timestamp}</span>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`ml-2 ${
                        news.impact === 'high' ? 'border-red-500 text-red-700' :
                        news.impact === 'medium' ? 'border-yellow-500 text-yellow-700' :
                        'border-blue-500 text-blue-700'
                      }`}
                    >
                      {news.impact === 'high' ? 'Высокое влияние' :
                       news.impact === 'medium' ? 'Среднее влияние' :
                       'Низкое влияние'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Активность рынка
            </CardTitle>
            <CardDescription>
              Ключевые метрики активности за последний час
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600 p-1 bg-blue-100 rounded" />
                  <div>
                    <p className="font-medium">Активные пользователи</p>
                    <p className="text-sm text-muted-foreground">В данный момент</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">1,247</p>
                  <p className="text-xs text-green-600">+8.5%</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Building className="h-8 w-8 text-green-600 p-1 bg-green-100 rounded" />
                  <div>
                    <p className="font-medium">Просмотры объектов</p>
                    <p className="text-sm text-muted-foreground">За последний час</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">3,892</p>
                  <p className="text-xs text-green-600">+12.3%</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-purple-600 p-1 bg-purple-100 rounded" />
                  <div>
                    <p className="font-medium">Запросы цен</p>
                    <p className="text-sm text-muted-foreground">За последний час</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">284</p>
                  <p className="text-xs text-blue-600">+5.2%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}