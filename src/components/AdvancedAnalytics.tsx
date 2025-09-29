import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Building, 
  DollarSign, 
  Users, 
  BarChart3,
  Activity,
  AlertCircle,
  Clock,
  MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MarketData {
  timestamp: string;
  avgPrice: number;
  avgRent: number;
  transactions: number;
  inventory: number;
}

interface DistrictData {
  name: string;
  priceGrowth: number;
  avgPrice: number;
  rentYield: number;
  transactions: number;
}

interface PropertyTypeData {
  type: string;
  count: number;
  avgPrice: number;
  color: string;
}

export default function AdvancedAnalytics() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [districtData, setDistrictData] = useState<DistrictData[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Mock data generation for demonstration
  useEffect(() => {
    const generateMockData = () => {
      const mockMarketData: MarketData[] = [];
      const dates = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        dates.push(date);
      }

      dates.forEach((date, index) => {
        mockMarketData.push({
          timestamp: date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }),
          avgPrice: 950000 + Math.random() * 200000 + (index * 15000),
          avgRent: 85000 + Math.random() * 20000 + (index * 2000),
          transactions: 450 + Math.random() * 150,
          inventory: 2800 - (index * 50) + Math.random() * 200
        });
      });

      const mockDistrictData: DistrictData[] = [
        { name: 'Downtown Dubai', priceGrowth: 8.5, avgPrice: 1250000, rentYield: 7.2, transactions: 156 },
        { name: 'Dubai Marina', priceGrowth: 6.8, avgPrice: 1180000, rentYield: 6.8, transactions: 143 },
        { name: 'Business Bay', priceGrowth: 12.3, avgPrice: 950000, rentYield: 8.1, transactions: 189 },
        { name: 'JBR', priceGrowth: 5.9, avgPrice: 1350000, rentYield: 6.5, transactions: 98 },
        { name: 'DIFC', priceGrowth: 9.7, avgPrice: 1450000, rentYield: 6.9, transactions: 87 },
        { name: 'Dubai Hills', priceGrowth: 15.2, avgPrice: 1100000, rentYield: 7.8, transactions: 203 }
      ];

      const mockPropertyTypes: PropertyTypeData[] = [
        { type: 'Квартиры', count: 1250, avgPrice: 980000, color: '#3b82f6' },
        { type: 'Пентхаусы', count: 180, avgPrice: 2850000, color: '#ef4444' },
        { type: 'Виллы', count: 320, avgPrice: 2200000, color: '#10b981' },
        { type: 'Студии', count: 890, avgPrice: 650000, color: '#f59e0b' },
        { type: 'Таунхаусы', count: 260, avgPrice: 1750000, color: '#8b5cf6' }
      ];

      setMarketData(mockMarketData);
      setDistrictData(mockDistrictData);
      setPropertyTypes(mockPropertyTypes);
      setLastUpdate(new Date().toLocaleString('ru-RU'));
      setIsLoading(false);
    };

    generateMockData();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      // Call DeepSeek market data analysis function
      const { data, error } = await supabase.functions.invoke('deepseek-market-analysis', {
        body: { 
          type: 'market_analysis',
          region: 'dubai'
        }
      });
      
      if (error) throw error;
      
      if (data?.data) {
        const analysis = data.data;
        
        // Update market data with real DeepSeek analysis
        const dates = [];
        for (let i = 11; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          dates.push(date);
        }

        const realMarketData = dates.map((date, index) => ({
          timestamp: date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }),
          avgPrice: analysis.keyMetrics.avgPricePerSqm * (0.85 + (index * 0.02)) + Math.random() * 50000,
          avgRent: analysis.keyMetrics.avgPricePerSqm * 0.08 * (0.9 + (index * 0.015)),
          transactions: analysis.keyMetrics.transactionVolume * (0.8 + Math.random() * 0.4),
          inventory: 2800 - (index * 50) + Math.random() * 200
        }));

        setMarketData(realMarketData);
        setDistrictData(analysis.districts);
        setLastUpdate(new Date().toLocaleString('ru-RU'));
        
        console.log('Advanced analytics updated with DeepSeek data:', analysis);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
    setIsLoading(false);
  };

  const totalValue = propertyTypes.reduce((sum, type) => sum + (type.count * type.avgPrice), 0);
  const totalTransactions = districtData.reduce((sum, district) => sum + district.transactions, 0);
  const avgGrowth = districtData.reduce((sum, district) => sum + district.priceGrowth, 0) / districtData.length;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-20"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground mt-2">
            Comprehensive analysis of Dubai real estate market
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Обновлено: {lastUpdate}
          </div>
          <Button onClick={refreshData} variant="outline" disabled={isLoading}>
            <Activity className="h-4 w-4 mr-2" />
            Обновить данные
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Общий объем рынка</p>
                <p className="text-2xl font-bold">
                  ${(totalValue / 1000000000).toFixed(1)}B
                </p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +{avgGrowth.toFixed(1)}% yearly
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transactions/month</p>
                <p className="text-2xl font-bold">{totalTransactions.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +12.5% monthly
                </p>
              </div>
              <BarChart3 className="h-12 w-12 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Yield</p>
                <p className="text-2xl font-bold">7.2%</p>
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                  <Activity className="h-3 w-3" />
                  Stable
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Properties</p>
                <p className="text-2xl font-bold">{propertyTypes.reduce((sum, type) => sum + type.count, 0).toLocaleString()}</p>
                <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                  <Building className="h-3 w-3" />
                  On Market
                </p>
              </div>
              <Building className="h-12 w-12 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="market-trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="market-trends">Market Trends</TabsTrigger>
          <TabsTrigger value="districts">District Analysis</TabsTrigger>
          <TabsTrigger value="property-types">Property Types</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasts</TabsTrigger>
        </TabsList>

        <TabsContent value="market-trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Average Price Dynamics
                </CardTitle>
                <CardDescription>
                  Real estate price changes over the last year
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={marketData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Average Price']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="avgPrice" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Transaction Volume
                </CardTitle>
                <CardDescription>
                  Number of deals by month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={marketData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="transactions" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="districts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                District Rating by Price Growth
              </CardTitle>
              <CardDescription>
                Comparative analysis of key Dubai districts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {districtData
                  .sort((a, b) => b.priceGrowth - a.priceGrowth)
                  .map((district, index) => (
                  <div key={district.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <h4 className="font-semibold">{district.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Average Price: ${district.avgPrice.toLocaleString()}</span>
                          <span>Yield: {district.rentYield}%</span>
                          <span>Transactions: {district.transactions}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center gap-1 ${
                        district.priceGrowth > 10 ? 'text-green-600' : 
                        district.priceGrowth > 5 ? 'text-blue-600' : 'text-orange-600'
                      }`}>
                        {district.priceGrowth > 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="font-semibold">+{district.priceGrowth}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">yearly</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="property-types" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribution by Type</CardTitle>
                <CardDescription>
                  Share of different property types in the market
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={propertyTypes as any}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {propertyTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Prices by Type</CardTitle>
                <CardDescription>
                  Comparison of costs for different property types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {propertyTypes
                    .sort((a, b) => b.avgPrice - a.avgPrice)
                    .map((type) => (
                    <div key={type.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: type.color }}
                        />
                        <span className="font-medium">{type.type}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${type.avgPrice.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{type.count} properties</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                2025 Forecast
              </CardTitle>
              <CardDescription>
                AI-powered Dubai real estate market forecasting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border rounded-lg">
                  <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h4 className="font-semibold text-lg mb-2">Price Growth</h4>
                  <p className="text-3xl font-bold text-green-600">+8.5%</p>
                  <p className="text-sm text-muted-foreground mt-2">Expected growth by end of 2025</p>
                </div>
                
                <div className="text-center p-6 border rounded-lg">
                  <BarChart3 className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h4 className="font-semibold text-lg mb-2">Transaction Volume</h4>
                  <p className="text-3xl font-bold text-blue-600">+15%</p>
                  <p className="text-sm text-muted-foreground mt-2">Activity increase</p>
                </div>
                
                <div className="text-center p-6 border rounded-lg">
                  <DollarSign className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h4 className="font-semibold text-lg mb-2">Yield</h4>
                  <p className="text-3xl font-bold text-purple-600">7.8%</p>
                  <p className="text-sm text-muted-foreground mt-2">Market average</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <h5 className="font-semibold mb-2">Key Growth Factors:</h5>
                <ul className="space-y-1 text-sm">
                  <li>• Expo 2030 and infrastructure projects</li>
                  <li>• Attracting foreign investment</li>
                  <li>• Development of new districts and projects</li>
                  <li>• Stable economic policy of the UAE</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}