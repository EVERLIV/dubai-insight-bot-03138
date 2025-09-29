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
  compact?: boolean;
}

const MetricCard = ({ title, value, change, trend, compact = false }: MetricCardProps) => (
  <Card className={`${compact ? 'p-3' : 'p-4'} hover:shadow-md transition-shadow`}>
    <CardContent className="p-0">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground font-medium`}>{title}</p>
          <p className={`${compact ? 'text-lg' : 'text-xl'} font-bold`}>{value}</p>
        </div>
        <div className={`flex items-center gap-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span className="text-xs font-medium">{change > 0 ? '+' : ''}{change}%</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

interface DistrictRowProps {
  name: string;
  avgPrice: number;
  growth: number;
  rank: number;
}

const DistrictRow = ({ name, avgPrice, growth, rank }: DistrictRowProps) => (
  <div className="flex items-center justify-between py-2 px-3 hover:bg-muted/30 rounded-lg transition-colors">
    <div className="flex items-center gap-3">
      <Badge variant="outline" className="w-6 h-6 text-xs rounded-full flex items-center justify-center">
        {rank}
      </Badge>
      <div>
        <div className="font-medium text-sm">{name}</div>
        <div className="text-xs text-muted-foreground">${avgPrice.toLocaleString()}</div>
      </div>
    </div>
    <div className={`text-sm font-semibold ${growth > 10 ? 'text-green-600' : growth > 5 ? 'text-blue-600' : 'text-orange-600'}`}>
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
  <div className="flex items-center justify-between py-2 px-3 hover:bg-muted/30 rounded-lg transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
      <div>
        <div className="font-medium text-sm">{type}</div>
        <div className="text-xs text-muted-foreground">{count} properties</div>
      </div>
    </div>
    <div className="text-sm font-semibold">${(avgPrice / 1000).toFixed(0)}K</div>
  </div>
);

export default function CompactAnalytics() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());

  const metrics = [
    { title: "Total Value", value: "$2.8B", change: 8.5, trend: 'up' as const },
    { title: "Avg. Price", value: "$1.2M", change: 12.3, trend: 'up' as const },
    { title: "Transactions", value: "2,467", change: 15.7, trend: 'up' as const },
    { title: "Yield", value: "7.2%", change: -2.1, trend: 'down' as const },
  ];

  const districts = [
    { name: "Downtown Dubai", avgPrice: 1850000, growth: 18.5, rank: 1 },
    { name: "Palm Jumeirah", avgPrice: 2580000, growth: 16.2, rank: 2 },
    { name: "Dubai Hills", avgPrice: 1100000, growth: 15.2, rank: 3 },
    { name: "Business Bay", avgPrice: 950000, growth: 12.3, rank: 4 },
    { name: "Dubai Marina", avgPrice: 1180000, growth: 8.7, rank: 5 },
  ];

  const propertyTypes = [
    { type: "Apartments", avgPrice: 980000, count: 1250, color: "#3b82f6" },
    { type: "Penthouses", avgPrice: 2850000, count: 180, color: "#ef4444" },
    { type: "Villas", avgPrice: 2200000, count: 320, color: "#10b981" },
    { type: "Studios", avgPrice: 650000, count: 890, color: "#f59e0b" },
    { type: "Townhouses", avgPrice: 1750000, count: 260, color: "#8b5cf6" },
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time market insights • Last updated {lastUpdate}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} compact />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution by Type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="w-5 h-5" />
              Distribution by Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {propertyTypes.map((type, index) => (
              <PropertyTypeRow key={index} {...type} />
            ))}
          </CardContent>
        </Card>

        {/* Average Price by Type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Average Price by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={propertyTypes} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="type" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(value: number) => [`$${(value / 1000).toFixed(0)}K`, 'Avg Price']}
                  labelFormatter={(label) => `Type: ${label}`}
                />
                <Bar dataKey="avgPrice" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Growing Districts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Top Growing Districts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {districts.map((district, index) => (
              <DistrictRow key={index} {...district} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Trends */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Price Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => [`$${(value / 1000).toFixed(0)}K`, 'Avg Price']}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Market Indicators */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Market Indicators
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Market Activity</span>
                <span className="font-semibold text-green-600">High</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Investment Interest</span>
                <span className="font-semibold text-blue-600">Very High</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Liquidity</span>
                <span className="font-semibold text-orange-600">Medium</span>
              </div>
              <Progress value={68} className="h-2" />
            </div>
            
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">💡 AI Insight</div>
              <div className="text-sm font-medium">
                Strong growth momentum expected in Q4 2024, particularly in premium segments.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}