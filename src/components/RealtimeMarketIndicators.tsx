import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  AlertTriangle, 
  Clock, 
  Users,
  BarChart3,
  Eye
} from "lucide-react";

interface MarketIndicator {
  id: string;
  title: string;
  value: string;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate real-time data updates
    const generateMockData = () => {
      const mockIndicators: MarketIndicator[] = [
        {
          id: '1',
          title: 'Average Property Price',
          value: '1.42M AED',
          change: 2.5,
          changePercent: 1.8,
          trend: 'up',
          status: 'normal',
          lastUpdate: new Date().toLocaleTimeString()
        },
        {
          id: '2',
          title: 'Daily Transaction Volume',
          value: '847',
          change: 12,
          changePercent: 8.7,
          trend: 'up',
          status: 'normal',
          lastUpdate: new Date().toLocaleTimeString()
        },
        {
          id: '3',
          title: 'Average Yield',
          value: '7.2%',
          change: 0.3,
          changePercent: 4.35,
          trend: 'up',
          status: 'normal',
          lastUpdate: new Date().toLocaleTimeString()
        },
        {
          id: '4',
          title: 'Time on Market (days)',
          value: '32',
          change: -2,
          changePercent: -5.88,
          trend: 'down',
          status: 'warning',
          lastUpdate: new Date().toLocaleTimeString()
        },
        {
          id: '5',
          title: 'New Listings',
          value: '189',
          change: 23,
          changePercent: 13.86,
          trend: 'up',
          status: 'normal',
          lastUpdate: new Date().toLocaleTimeString()
        },
        {
          id: '6',
          title: 'Investor Activity',
          value: '84%',
          change: 12,
          changePercent: 16.67,
          trend: 'up',
          status: 'normal',
          lastUpdate: new Date().toLocaleTimeString()
        }
      ];

      const mockNews: NewsAlert[] = [
        {
          id: '1',
          title: 'New UAE visa rules boost real estate market',
          impact: 'high',
          timestamp: '15:30',
          source: 'Emirates Business'
        },
        {
          id: '2',
          title: 'New project launch in Business Bay',
          impact: 'medium',
          timestamp: '14:45',
          source: 'Property Weekly'
        },
        {
          id: '3',
          title: 'Interest rates remain stable',
          impact: 'low',
          timestamp: '13:20',
          source: 'Financial Times'
        }
      ];

      setIndicators(mockIndicators);
      setNewsAlerts(mockNews);
      setIsLoading(false);
    };

    generateMockData();

    // Update indicators every 30 seconds
    const interval = setInterval(() => {
      if (!isLoading) {
        setIndicators(prev => prev.map(indicator => ({
          ...indicator,
          value: indicator.id === '2' ? `${Math.round(Math.random() * 200 + 150)}` : indicator.value,
          change: Math.round((Math.random() - 0.5) * 20 * 100) / 100,
          lastUpdate: new Date().toLocaleTimeString()
        })));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isLoading]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'border-red-600 bg-red-50';
      case 'warning': return 'border-orange-500 bg-orange-50';
      default: return 'border-green-600 bg-green-50';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'border-l-red-600 bg-red-50';
      case 'medium': return 'border-l-orange-500 bg-orange-50';
      default: return 'border-l-blue-600 bg-blue-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-700" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-700" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="bg-white border border-gray-200">
      <div className="p-6">
        {/* Professional Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-8 bg-blue-900"></div>
            <h2 className="text-2xl font-bold text-gray-900">
              Live Market Performance Indicators
            </h2>
          </div>
          <p className="text-gray-700 max-w-4xl">
            Real-time monitoring of key market metrics and performance indicators. 
            Professional-grade data updated every 15 minutes during market hours.
          </p>
        </div>

        {/* Real-time Indicators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {indicators.map((indicator) => (
            <div 
              key={indicator.id} 
              className={`bg-white border-2 p-4 transition-all hover:shadow-lg ${getStatusColor(indicator.status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getTrendIcon(indicator.trend)}
                  <h3 className="font-semibold text-sm text-gray-900">{indicator.title}</h3>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    indicator.status === 'critical' ? 'border-red-600 text-red-700' :
                    indicator.status === 'warning' ? 'border-orange-500 text-orange-700' :
                    'border-green-600 text-green-700'
                  }`}
                >
                  {indicator.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{indicator.value}</div>
                  <div className={`text-sm font-medium ${
                    indicator.trend === 'up' ? 'text-green-700' : 
                    indicator.trend === 'down' ? 'text-red-700' : 'text-gray-600'
                  }`}>
                    {indicator.change > 0 ? '+' : ''}{indicator.change} ({indicator.changePercent > 0 ? '+' : ''}{indicator.changePercent}%)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {indicator.lastUpdate}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* News and Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Market News */}
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Market News</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Latest events affecting the real estate market
            </p>
            <div className="space-y-3">
              {newsAlerts.map((news) => (
                <div 
                  key={news.id} 
                  className={`p-4 border-l-4 ${getImpactColor(news.impact)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-gray-900 mb-1">{news.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>{news.source}</span>
                        <span>•</span>
                        <span>{news.timestamp}</span>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`ml-2 text-xs ${
                        news.impact === 'high' ? 'border-red-600 text-red-700' :
                        news.impact === 'medium' ? 'border-orange-500 text-orange-700' :
                        'border-blue-600 text-blue-700'
                      }`}
                    >
                      {news.impact.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Market Activity Summary */}
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Market Activity</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Key activity metrics for the last hour
            </p>
            <div className="space-y-4">
              {/* Active Viewers */}
              <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-900 flex items-center justify-center">
                    <Eye className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Active Property Viewers</div>
                    <div className="text-xs text-gray-600">Currently browsing properties</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-900">1,247</div>
                  <div className="text-xs text-green-700 font-medium">+15.3%</div>
                </div>
              </div>

              {/* New Inquiries */}
              <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-700 flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">New Inquiries</div>
                    <div className="text-xs text-gray-600">Last 60 minutes</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-700">34</div>
                  <div className="text-xs text-green-700 font-medium">+8.9%</div>
                </div>
              </div>

              {/* Market Sentiment */}
              <div className="p-4 bg-gray-900 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4" />
                  <span className="font-semibold text-sm">Market Sentiment</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Bullish</span>
                    <span className="font-semibold">78%</span>
                  </div>
                  <div className="w-full bg-gray-700 h-2">
                    <div className="bg-green-500 h-2" style={{ width: '78%' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-300 mt-2">
                  Based on investor activity and market transactions
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}