import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Target } from "lucide-react";

const MarketAnalytics = () => {
  const marketData = [
    {
      title: "Средняя цена за кв.м",
      value: "15,240 AED",
      change: "+8.5%",
      trend: "up",
      icon: DollarSign
    },
    {
      title: "Объем транзакций",
      value: "12,450",
      change: "+15.2%", 
      trend: "up",
      icon: Activity
    },
    {
      title: "Время продажи",
      value: "45 дней",
      change: "-12%",
      trend: "down",
      icon: Target
    },
    {
      title: "ROI годовой",
      value: "14.8%",
      change: "+2.1%",
      trend: "up", 
      icon: BarChart3
    }
  ];

  const topLocations = [
    { name: "Downtown Dubai", growth: "+18.5%", avgPrice: "18,500 AED/кв.м" },
    { name: "Dubai Marina", growth: "+12.3%", avgPrice: "14,200 AED/кв.м" },
    { name: "Palm Jumeirah", growth: "+22.1%", avgPrice: "25,800 AED/кв.м" },
    { name: "Business Bay", growth: "+9.8%", avgPrice: "12,900 AED/кв.м" }
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
            Аналитика
            <span className="block bg-gradient-to-r from-dubai-gold to-dubai-gold-light bg-clip-text text-transparent">
              Рынка
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Актуальные данные и инсайты для принятия обоснованных инвестиционных решений
          </p>
        </div>

        {/* Market Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {marketData.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={index} className="gradient-card border-dubai-gold/20 hover:shadow-card transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <Icon className="w-6 h-6 text-dubai-gold" />
                    <div className={`flex items-center text-sm ${
                      metric.trend === 'up' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {metric.trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                      {metric.change}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">{metric.value}</div>
                  <div className="text-sm text-muted-foreground">{metric.title}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Market Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Locations */}
          <Card className="glass-dark border-dubai-gold/20">
            <CardHeader>
              <CardTitle className="text-2xl font-display flex items-center">
                <TrendingUp className="w-6 h-6 text-dubai-gold mr-3" />
                Топ Районы по Росту
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topLocations.map((location, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-dubai-blue-lighter/50 hover:bg-dubai-blue-lighter transition-colors">
                  <div>
                    <div className="font-semibold text-foreground">{location.name}</div>
                    <div className="text-sm text-muted-foreground">{location.avgPrice}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">{location.growth}</div>
                    <div className="text-xs text-muted-foreground">за год</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Market Forecast */}
          <Card className="glass-dark border-dubai-gold/20">
            <CardHeader>
              <CardTitle className="text-2xl font-display flex items-center">
                <Activity className="w-6 h-6 text-dubai-gold mr-3" />
                Прогноз на 2024
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Рост цен</span>
                  <span className="text-xl font-bold text-green-400">+12-15%</span>
                </div>
                <div className="w-full bg-dubai-blue-lighter rounded-full h-2">
                  <div className="bg-gradient-to-r from-dubai-gold to-dubai-gold-light h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Активность рынка</span>
                  <span className="text-xl font-bold text-dubai-gold">Высокая</span>
                </div>
                <div className="w-full bg-dubai-blue-lighter rounded-full h-2">
                  <div className="bg-gradient-to-r from-dubai-gold to-dubai-gold-light h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Доходность</span>
                  <span className="text-xl font-bold text-green-400">14-18%</span>
                </div>
                <div className="w-full bg-dubai-blue-lighter rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-400 to-green-300 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-dubai-gold/10 border border-dubai-gold/20">
                <div className="text-sm text-muted-foreground mb-2">💡 AI Рекомендация</div>
                <div className="text-foreground font-semibold">
                  Оптимальное время для инвестиций в элитную недвижимость Downtown Dubai и Palm Jumeirah
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