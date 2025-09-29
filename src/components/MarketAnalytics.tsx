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
    <section className="py-12 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        {/* Professional Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-8 bg-blue-900"></div>
            <h2 className="text-2xl font-bold text-gray-900">
              Market Analytics Platform
            </h2>
          </div>
          <p className="text-gray-700 max-w-3xl">
            Professional-grade market intelligence with real-time data analysis and comprehensive 
            performance metrics for institutional decision-making.
          </p>
        </div>

        {/* Market Metrics - Professional Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {marketData.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="bg-white border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 bg-blue-900 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className={`flex items-center text-xs font-semibold ${
                    metric.trend === 'up' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {metric.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {metric.change}
                  </div>
                </div>
                <div className="text-xl font-bold text-gray-900 mb-1">{metric.value}</div>
                <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">{metric.title}</div>
              </div>
            );
          })}
        </div>

        {/* Market Insights - Professional Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Locations */}
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Top Performing Districts</h3>
            </div>
            <div className="space-y-3">
              {topLocations.slice(0, 3).map((location, index) => (
                <div key={index} className="flex items-center justify-between py-3 px-3 bg-gray-50 border border-gray-200">
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{location.name}</div>
                    <div className="text-xs text-gray-600">{location.avgPrice}</div>
                  </div>
                  <div className="text-sm font-bold text-green-700">{location.growth}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Market Forecast */}
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">2024 Market Forecast</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Price Growth</span>
                  <span className="text-lg font-bold text-green-700">{forecast.priceGrowth}</span>
                </div>
                <div className="w-full bg-gray-200 h-2">
                  <div className="bg-blue-900 h-2" style={{ width: '75%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Market Activity</span>
                  <span className="text-lg font-bold text-blue-900">{forecast.marketActivity}</span>
                </div>
                <div className="w-full bg-gray-200 h-2">
                  <div className="bg-blue-900 h-2" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">ROI Projection</span>
                  <span className="text-lg font-bold text-green-700">{forecast.roi}</span>
                </div>
                <div className="w-full bg-gray-200 h-2">
                  <div className="bg-green-700 h-2" style={{ width: '80%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Insight */}
          <div className="bg-gray-900 text-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-blue-500 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold">Professional Analysis</h3>
            </div>
            <div className="text-sm leading-relaxed text-gray-300">
              {isLoading ? "Generating analysis..." : "Current market conditions indicate strong fundamentals with sustained demand across premium segments. Institutional opportunities remain favorable with selective asset allocation strategies."}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Generated by AI Analysis</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketAnalytics;