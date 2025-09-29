import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, 
  Building, MapPin, AlertCircle, RefreshCw, Home
} from "lucide-react";
import { useState, useEffect } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
}

const MetricCard = ({ title, value, change, trend }: MetricCardProps) => (
  <div className="bg-white border border-gray-200 p-4 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{title}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`flex items-center gap-1 ${trend === 'up' ? 'text-green-700' : 'text-red-700'}`}>
        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span className="text-xs font-semibold">{change > 0 ? '+' : ''}{change}%</span>
      </div>
    </div>
  </div>
);

interface DistrictRowProps {
  name: string;
  avgPrice: number;
  growth: number;
  rank: number;
}

const DistrictRow = ({ name, avgPrice, growth, rank }: DistrictRowProps) => (
  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 bg-blue-900 text-white text-xs font-bold flex items-center justify-center">
        {rank}
      </div>
      <div>
        <div className="font-semibold text-sm text-gray-900">{name}</div>
        <div className="text-xs text-gray-600">${avgPrice.toLocaleString()}</div>
      </div>
    </div>
    <div className={`text-sm font-bold ${growth > 10 ? 'text-green-700' : growth > 5 ? 'text-blue-900' : 'text-orange-600'}`}>
      +{growth}%
    </div>
  </div>
);

interface PropertyTypeRowProps {
  type: string;
  avgPrice: number;
  count: number;
  color: string;
}

const PropertyTypeRow = ({ type, avgPrice, count, color }: PropertyTypeRowProps) => (
  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-3 h-3" style={{ backgroundColor: color }} />
      <div>
        <div className="font-semibold text-sm text-gray-900">{type}</div>
        <div className="text-xs text-gray-600">{count} properties</div>
      </div>
    </div>
    <div className="text-sm font-bold text-gray-900">${(avgPrice / 1000).toFixed(0)}K</div>
  </div>
);

export default function CompactAnalytics() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());

  const metrics = [
    { title: "Total Market Value", value: "$2.8B", change: 8.5, trend: 'up' as const },
    { title: "Average Price", value: "$1.2M", change: 12.3, trend: 'up' as const },
    { title: "Monthly Transactions", value: "2,467", change: 15.7, trend: 'up' as const },
    { title: "Average Yield", value: "7.2%", change: -2.1, trend: 'down' as const },
  ];

  const districts = [
    { name: "Downtown Dubai", avgPrice: 1850000, growth: 18.5, rank: 1 },
    { name: "Palm Jumeirah", avgPrice: 2580000, growth: 16.2, rank: 2 },
    { name: "Dubai Hills", avgPrice: 1100000, growth: 15.2, rank: 3 },
    { name: "Business Bay", avgPrice: 950000, growth: 12.3, rank: 4 },
    { name: "Dubai Marina", avgPrice: 1180000, growth: 8.7, rank: 5 },
  ];

  const propertyTypes = [
    { type: "Apartments", avgPrice: 980000, count: 1250, color: "#1e40af" },
    { type: "Penthouses", avgPrice: 2850000, count: 180, color: "#dc2626" },
    { type: "Villas", avgPrice: 2200000, count: 320, color: "#059669" },
    { type: "Studios", avgPrice: 650000, count: 890, color: "#d97706" },
    { type: "Townhouses", avgPrice: 1750000, count: 260, color: "#7c3aed" },
  ];

  const chartData = [
    { month: "Jan", price: 1150000, volume: 245 },
    { month: "Feb", price: 1180000, volume: 267 },
    { month: "Mar", price: 1205000, volume: 289 },
    { month: "Apr", price: 1235000, volume: 312 },
    { month: "May", price: 1268000, volume: 298 },
    { month: "Jun", price: 1290000, volume: 334 },
  ];

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLastUpdate(new Date().toLocaleTimeString());
    }, 1500);
  };

  return (
    <div className="bg-white border border-gray-200">
      <div className="p-6">
        {/* Professional Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-6 bg-blue-900"></div>
              <h2 className="text-xl font-bold text-gray-900">Real-Time Market Intelligence</h2>
            </div>
            <p className="text-sm text-gray-600">
              Professional analytics dashboard • Updated {lastUpdate}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Property Types Distribution */}
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Property Distribution</h3>
            </div>
            <div className="space-y-2">
              {propertyTypes.map((type, index) => (
                <PropertyTypeRow key={index} {...type} />
              ))}
            </div>
          </div>

          {/* Price Chart */}
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Price Trends</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={propertyTypes} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="type" 
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip 
                  formatter={(value: number) => [`$${(value / 1000).toFixed(0)}K`, 'Avg Price']}
                  labelFormatter={(label) => `Type: ${label}`}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #d1d5db',
                    borderRadius: '0'
                  }}
                />
                <Bar dataKey="avgPrice" fill="#1e40af" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Districts */}
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Top Districts</h3>
            </div>
            <div className="space-y-2">
              {districts.slice(0, 5).map((district, index) => (
                <DistrictRow key={index} {...district} />
              ))}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Price Trends Chart */}
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">6-Month Price Trends</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  formatter={(value: number) => [`$${(value / 1000).toFixed(0)}K`, 'Avg Price']}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #d1d5db',
                    borderRadius: '0'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#1e40af" 
                  fill="#1e40af" 
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Market Performance Indicators */}
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Market Performance</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">Market Activity</span>
                  <span className="font-bold text-green-700">High</span>
                </div>
                <div className="w-full bg-gray-200 h-2">
                  <div className="bg-green-700 h-2" style={{ width: '85%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">Investment Interest</span>
                  <span className="font-bold text-blue-900">Very High</span>
                </div>
                <div className="w-full bg-gray-200 h-2">
                  <div className="bg-blue-900 h-2" style={{ width: '92%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">Market Liquidity</span>
                  <span className="font-bold text-orange-600">Medium</span>
                </div>
                <div className="w-full bg-gray-200 h-2">
                  <div className="bg-orange-600 h-2" style={{ width: '68%' }}></div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-900 text-white">
                <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">💡 Professional Analysis</div>
                <div className="text-sm font-medium leading-relaxed">
                  Strong fundamentals indicate sustained growth momentum across premium segments. 
                  Institutional opportunities remain favorable with selective allocation strategies.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}