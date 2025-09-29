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
    <section className="py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Compact Header - 24px bottom margin (large spacing between major sections) */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-display font-bold text-foreground mb-2">
            Market Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Real-time data and insights
          </p>
        </div>

        {/* Market Metrics - 12px gaps, 12px padding */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {marketData.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={index} className="border-dubai-gold/20 hover:shadow-sm transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-4 h-4 text-dubai-gold" />
                    <div className={`flex items-center text-xs ${
                      metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {metric.change}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-foreground">{metric.value}</div>
                  <div className="text-xs text-muted-foreground leading-tight">{metric.title}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Market Insights - Horizontal Layout for better space utilization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Top Locations - 12px padding */}
          <Card className="border-dubai-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center">
                <TrendingUp className="w-4 h-4 text-dubai-gold mr-2" />
                Top Growing Districts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              {topLocations.slice(0, 3).map((location, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-2 rounded bg-dubai-blue-lighter/30">
                  <div>
                    <div className="font-medium text-xs">{location.name}</div>
                    <div className="text-xs text-muted-foreground">{location.avgPrice}</div>
                  </div>
                  <div className="text-xs font-bold text-green-600">{location.growth}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Market Forecast - Compact metrics */}
          <Card className="border-dubai-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center">
                <Activity className="w-4 h-4 text-dubai-gold mr-2" />
                2024 Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Price Growth</span>
                  <span className="text-sm font-bold text-green-600">{forecast.priceGrowth}</span>
                </div>
                <div className="w-full bg-dubai-blue-lighter rounded-full h-1">
                  <div className="bg-gradient-to-r from-dubai-gold to-dubai-gold-light h-1 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Market Activity</span>
                  <span className="text-sm font-bold text-dubai-gold">{forecast.marketActivity}</span>
                </div>
                <div className="w-full bg-dubai-blue-lighter rounded-full h-1">
                  <div className="bg-gradient-to-r from-dubai-gold to-dubai-gold-light h-1 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs">ROI</span>
                  <span className="text-sm font-bold text-green-600">{forecast.roi}</span>
                </div>
                <div className="w-full bg-dubai-blue-lighter rounded-full h-1">
                  <div className="bg-gradient-to-r from-green-400 to-green-300 h-1 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendation - Compact */}
          <Card className="border-dubai-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">💡 AI Insight</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xs leading-relaxed text-foreground">
                {isLoading ? "Loading..." : "Strong growth momentum expected in Q4 2024, particularly in premium segments of Downtown Dubai and Palm Jumeirah."}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default MarketAnalytics;