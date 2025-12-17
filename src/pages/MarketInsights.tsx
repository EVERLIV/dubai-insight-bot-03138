import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Activity, 
  DollarSign, 
  MapPin, 
  Building2,
  CheckCircle,
  Phone,
  Mail,
  Star,
  Calendar,
  Users,
  Target,
  Zap,
  Database,
  Landmark,
  FileText,
  Search
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const MarketInsights = () => {
  const [activeInsight, setActiveInsight] = useState(0);
  const [marketData, setMarketData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const insights = [
    {
      title: "Market Trend Analysis",
      description: "Real-time price movements and market sentiment analysis",
      features: [
        "Daily price index tracking",
        "Supply & demand dynamics", 
        "Seasonal pattern analysis",
        "Predictive trend modeling"
      ],
      icon: TrendingUp
    },
    {
      title: "Investment Analytics", 
      description: "ROI calculations and investment performance metrics",
      features: [
        "Rental yield analysis",
        "Capital appreciation forecasts",
        "Risk assessment models",
        "Portfolio optimization"
      ],
      icon: BarChart3
    },
    {
      title: "Location Intelligence",
      description: "Micro-market analysis and area-specific insights",
      features: [
        "Infrastructure development impact",
        "Demographic trend analysis",
        "Transportation connectivity",
        "Future development plans"
      ],
      icon: MapPin
    },
    {
      title: "Market Reports",
      description: "Comprehensive quarterly and annual market reports",
      features: [
        "Executive market summaries",
        "Sector-specific analysis",
        "Regulatory impact assessment",
        "Strategic recommendations"
      ],
      icon: PieChart
    }
  ];

  const partners = [
    { name: "GSO Vietnam", type: "Data Partner", icon: Database },
    { name: "CBRE Vietnam", type: "Analytics Partner", icon: TrendingUp },
    { name: "Savills Vietnam", type: "Market Intelligence", icon: Building2 },
    { name: "HCMC Land Dept", type: "Official Data", icon: Landmark },
    { name: "JLL Vietnam", type: "Research Partner", icon: Search },
    { name: "Knight Frank", type: "Market Research", icon: FileText }
  ];

  const marketMetrics = [
    { label: "Market Cap", value: "VND 850T", change: "+15.2%" },
    { label: "Transaction Volume", value: "32,450", change: "+12.8%" },
    { label: "Avg. Price Growth", value: "18.5%", change: "+3.2%" },
    { label: "Foreign Investment", value: "45%", change: "+8.1%" }
  ];

  // Sample chart data
  const priceData = [
    { month: 'Jan', price: 85, volume: 2800 },
    { month: 'Feb', price: 92, volume: 3100 },
    { month: 'Mar', price: 98, volume: 3400 },
    { month: 'Apr', price: 105, volume: 3800 },
    { month: 'May', price: 102, volume: 3600 },
    { month: 'Jun', price: 112, volume: 4100 }
  ];

  const districtData = [
    { area: 'District 1', growth: 22.5, transactions: 980 },
    { area: 'District 2', growth: 28.2, transactions: 1240 },
    { area: 'District 7', growth: 19.8, transactions: 850 },
    { area: 'Binh Thanh', growth: 16.5, transactions: 720 },
    { area: 'Thu Duc', growth: 32.1, transactions: 1580 }
  ];

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('deepseek-market-analysis', {
        body: { type: 'market_analysis', region: 'hcmc' }
      });

      if (data?.success) {
        setMarketData(data.data);
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      {/* Professional Hero Section */}
      <div className="bg-gray-900 text-white py-20 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-16 bg-amber-500"></div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Market Intelligence & Analytics
                </h1>
                <p className="text-xl text-gray-300 max-w-3xl">
                  Professional real estate market analysis powered by AI algorithms, 
                  comprehensive data analytics, and institutional-grade research for strategic investment decisions.
                </p>
              </div>
            </div>
            
            {/* Director's Signature Effect */}
            <div className="mt-12 relative">
              <div className="bg-white/10 border border-white/20 p-8 max-w-2xl">
                <div className="relative">
                  <p className="text-lg italic text-gray-200 leading-relaxed">
                    "Data-driven insights are the foundation of successful real estate investment. 
                    Our analytics platform combines traditional market research with cutting-edge 
                    AI to deliver actionable intelligence for every investment decision."
                  </p>
                  {/* Hand-written signature effect */}
                  <div className="mt-6 relative">
                    <div className="text-2xl font-light text-amber-400 transform rotate-1 inline-block">
                      Dr. Tran Minh Duc
                    </div>
                    <div className="text-sm text-gray-400 mt-1">Chief Market Analyst</div>
                    {/* Hand-drawn line effect */}
                    <div className="absolute -bottom-2 left-0 w-32 h-0.5 bg-amber-400 transform rotate-2 opacity-60"></div>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-2 -right-2 w-4 h-4 border-2 border-amber-400 rotate-45"></div>
              <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-amber-400"></div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          
          {/* Real-time Market Metrics */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-emerald-600"></div>
                <h2 className="text-2xl font-bold text-gray-900">Live Market Indicators</h2>
              </div>
              <Button 
                onClick={fetchMarketData}
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Activity className="w-4 h-4 mr-2" />
                {isLoading ? 'Updating...' : 'Refresh Data'}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {marketMetrics.map((metric, index) => (
                <div key={index} className="bg-white border border-gray-200 p-6 text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                  <div className="text-sm text-gray-600 mb-2">{metric.label}</div>
                  <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                    {metric.change}
                  </Badge>
                </div>
              ))}
            </div>

            {/* AI Market Analysis */}
            {marketData && (
              <Card className="border-gray-200 mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-600" />
                    AI Market Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Market Summary</h4>
                      <p className="text-gray-600 text-sm mb-4">{marketData.summary}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Avg Price/Sqm:</span>
                          <span className="font-semibold">VND {Math.round(marketData.keyMetrics?.avgPricePerSqm || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Price Growth:</span>
                          <span className="font-semibold text-green-600">+{(marketData.keyMetrics?.priceGrowth || 0).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Average ROI:</span>
                          <span className="font-semibold">{(marketData.keyMetrics?.roi || 0).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Investment Recommendation</h4>
                      <p className="text-sm text-gray-600">{marketData.forecast?.recommendation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Market Charts */}
          <div className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Price Trend Analysis (Million VND/sqm)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={priceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`VND ${value}M`, 'Price per Sqm']} />
                    <Line type="monotone" dataKey="price" stroke="#059669" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">District Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={districtData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="area" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, 'Growth Rate']} />
                    <Bar dataKey="growth" fill="#059669" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Insights Services */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-emerald-600"></div>
              <h2 className="text-2xl font-bold text-gray-900">Analytics Services</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
              {insights.map((insight, index) => (
                <button
                  key={index}
                  onClick={() => setActiveInsight(index)}
                  className={`p-4 border text-left transition-all ${
                    activeInsight === index
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-600'
                  }`}
                >
                  <insight.icon className={`w-6 h-6 mb-3 ${
                    activeInsight === index ? 'text-emerald-600' : 'text-gray-600'
                  }`} />
                  <h3 className="font-semibold text-sm mb-2">{insight.title}</h3>
                  <p className="text-xs text-gray-600">{insight.description}</p>
                </button>
              ))}
            </div>

            {/* Active Insight Details */}
            <Card className="border-gray-200">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      {React.createElement(insights[activeInsight].icon, { 
                        className: "w-8 h-8 text-emerald-600" 
                      })}
                      <h3 className="text-2xl font-bold text-gray-900">
                        {insights[activeInsight].title}
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                      {insights[activeInsight].description}
                    </p>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Calendar className="w-4 h-4 mr-2" />
                      Subscribe to Reports
                    </Button>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Analytics Features</h4>
                    <div className="space-y-3">
                      {insights[activeInsight].features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Research Partners Section */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-emerald-600"></div>
              <h2 className="text-2xl font-bold text-gray-900">Our Research Partners</h2>
            </div>
            
            <div className="bg-white border border-gray-200 p-8">
              <p className="text-gray-600 mb-8 max-w-3xl">
                We collaborate with leading data providers and research institutions 
                to ensure our market analysis is based on the most comprehensive and 
                accurate information available in the market.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {partners.map((partner, index) => (
                  <div key={index} className="border border-gray-200 p-4 text-center hover:border-emerald-600 transition-colors">
                    <partner.icon className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-sm text-gray-900 mb-1">{partner.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {partner.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="bg-gray-900 text-white p-8 border border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Access Professional Market Intelligence</h3>
                <p className="text-gray-300 mb-6">
                  Subscribe to our premium market analytics platform and get exclusive access 
                  to institutional-grade research reports and real-time market data.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Phone className="w-4 h-4 mr-2" />
                    +84 28 1234 5680
                  </Button>
                  <Button variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                    <Mail className="w-4 h-4 mr-2" />
                    research@saigonproperties.vn
                  </Button>
                </div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <Star className="w-5 h-5 text-yellow-400" />
                  <Star className="w-5 h-5 text-yellow-400" />
                  <Star className="w-5 h-5 text-yellow-400" />
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-sm text-gray-300">
                  Trusted by 200+ institutional investors
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MarketInsights;
