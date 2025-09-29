import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const MarketAnalytics = () => {
  const [marketData, setMarketData] = useState([
    {
      title: "Average Price per sqm",
      value: "15,240 AED",
      change: "+8.5%",
      trend: "up",
      icon: DollarSign
    },
    {
      title: "Transaction Volume",
      value: "12,450",
      change: "+15.2%", 
      trend: "up",
      icon: Activity
    },
    {
      title: "Time on Market",
      value: "45 days",
      change: "-12%",
      trend: "down",
      icon: Target
    },
    {
      title: "Annual ROI",
      value: "14.8%",
      change: "+2.1%",
      trend: "up", 
      icon: BarChart3
    }
  ]);

  const [topLocations, setTopLocations] = useState([
    { name: "Downtown Dubai", growth: "+18.5%", avgPrice: "18,500 AED/sqm" },
    { name: "Dubai Marina", growth: "+12.3%", avgPrice: "14,200 AED/sqm" },
    { name: "Palm Jumeirah", growth: "+22.1%", avgPrice: "25,800 AED/sqm" },
    { name: "Business Bay", growth: "+9.8%", avgPrice: "12,900 AED/sqm" }
  ]);

  const [forecast, setForecast] = useState({
    priceGrowth: "+12-15%",
    marketActivity: "High",
    roi: "14-18%",
    recommendation: "Optimal time to invest in premium properties in Downtown Dubai and Palm Jumeirah"
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('deepseek-market-analysis', {
        body: { 
          type: 'market_analysis',
          region: 'dubai'
        }
      });
      
      if (error) throw error;
      
      if (data?.data) {
        const analysis = data.data;
        
        // Update market metrics
        setMarketData([
          {
            title: "Average Price per sqm",
            value: `${Math.round(analysis.keyMetrics.avgPricePerSqm).toLocaleString()} AED`,
            change: `+${analysis.keyMetrics.priceGrowth.toFixed(1)}%`,
            trend: analysis.keyMetrics.priceGrowth > 0 ? "up" : "down",
            icon: DollarSign
          },
          {
            title: "Transaction Volume",
            value: `${Math.round(analysis.keyMetrics.transactionVolume).toLocaleString()}`,
            change: "+15.2%", 
            trend: "up",
            icon: Activity
          },
          {
            title: "Time on Market",
            value: `${Math.round(analysis.keyMetrics.timeOnMarket)} days`,
            change: "-12%",
            trend: "down",
            icon: Target
          },
          {
            title: "Annual ROI",
            value: `${analysis.keyMetrics.roi.toFixed(1)}%`,
            change: "+2.1%",
            trend: "up", 
            icon: BarChart3
          }
        ]);

        // Update top locations
        setTopLocations(analysis.districts.map(district => ({
          name: district.name,
          growth: `+${district.growth.toFixed(1)}%`,
          avgPrice: `${Math.round(district.avgPrice).toLocaleString()} AED/sqm`
        })));

        // Update forecast
        setForecast({
          priceGrowth: `+${analysis.forecast.priceGrowthForecast.toFixed(0)}-${(analysis.forecast.priceGrowthForecast + 3).toFixed(0)}%`,
          marketActivity: analysis.forecast.marketActivity === "высокая" ? "High" : 
                          analysis.forecast.marketActivity === "средняя" ? "Medium" : "Low",
          roi: `${(analysis.forecast.roi - 2).toFixed(0)}-${analysis.forecast.roi.toFixed(0)}%`,
          recommendation: analysis.forecast.recommendation
        });
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
            Market
            <span className="block bg-gradient-to-r from-dubai-gold to-dubai-gold-light bg-clip-text text-transparent">
              Analytics
            </span>
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Real-time data and insights for making informed investment decisions
          </p>
        </div>

        {/* Market Metrics - Compact Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {marketData.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={index} className="gradient-card border-dubai-gold/20 hover:shadow-card transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <Icon className="w-5 h-5 text-dubai-gold" />
                    <div className={`flex items-center text-xs ${
                      metric.trend === 'up' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {metric.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {metric.change}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-foreground mb-1">{metric.value}</div>
                  <div className="text-xs text-muted-foreground">{metric.title}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Market Insights - Compact Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Locations */}
          <Card className="glass-dark border-dubai-gold/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display flex items-center">
                <TrendingUp className="w-5 h-5 text-dubai-gold mr-2" />
                Top Growing Districts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topLocations.map((location, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-dubai-blue-lighter/50 hover:bg-dubai-blue-lighter transition-colors">
                  <div>
                    <div className="font-semibold text-foreground text-sm">{location.name}</div>
                    <div className="text-xs text-muted-foreground">{location.avgPrice}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-green-400">{location.growth}</div>
                    <div className="text-xs text-muted-foreground">yearly</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Market Forecast */}
          <Card className="glass-dark border-dubai-gold/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display flex items-center">
                <Activity className="w-5 h-5 text-dubai-gold mr-2" />
                2024 Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-foreground text-sm">Price Growth</span>
                  <span className="text-lg font-bold text-green-400">{forecast.priceGrowth}</span>
                </div>
                <div className="w-full bg-dubai-blue-lighter rounded-full h-2">
                  <div className="bg-gradient-to-r from-dubai-gold to-dubai-gold-light h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-foreground text-sm">Market Activity</span>
                  <span className="text-lg font-bold text-dubai-gold">{forecast.marketActivity}</span>
                </div>
                <div className="w-full bg-dubai-blue-lighter rounded-full h-2">
                  <div className="bg-gradient-to-r from-dubai-gold to-dubai-gold-light h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-foreground text-sm">ROI</span>
                  <span className="text-lg font-bold text-green-400">{forecast.roi}</span>
                </div>
                <div className="w-full bg-dubai-blue-lighter rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-400 to-green-300 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-dubai-gold/10 border border-dubai-gold/20">
                <div className="text-xs text-muted-foreground mb-1">💡 AI Recommendation</div>
                <div className="text-foreground font-semibold text-sm">
                  {isLoading ? "Loading recommendations..." : forecast.recommendation}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default MarketAnalytics;