import { Button } from "@/components/ui/button";
import { Building2, TrendingUp, MapPin } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-dubai-blue via-dubai-blue-light to-dubai-blue-lighter">
        <div className="absolute top-20 left-10 w-32 h-32 bg-dubai-gold/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-32 right-20 w-48 h-48 bg-dubai-gold/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-3 glass-dark rounded-2xl px-8 py-4 animate-glow">
            <Building2 className="w-8 h-8 text-dubai-gold" />
            <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-dubai-gold to-dubai-gold-light bg-clip-text text-transparent">
              Dubai Invest
            </h1>
          </div>
        </div>

        {/* Hero Title */}
        <h2 className="text-5xl md:text-7xl font-display font-bold text-foreground mb-6 leading-tight">
          Интеллектуальные
          <span className="block bg-gradient-to-r from-dubai-gold via-dubai-gold-light to-dubai-gold bg-clip-text text-transparent">
            Инвестиции
          </span>
          в Недвижимость Дубая
        </h2>

        {/* Hero Description */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
          Персонализированная аналитика, умный подбор объектов и прогнозы рынка 
          для успешных инвестиций в элитную недвижимость Дубая
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <Button size="lg" className="gradient-gold hover:shadow-gold transition-all duration-300 hover:scale-105 px-8 py-6 text-lg font-semibold">
            <TrendingUp className="w-6 h-6 mr-2" />
            Найти Недвижимость
          </Button>
          <Button variant="outline" size="lg" className="glass-dark border-dubai-gold/30 hover:bg-dubai-gold/10 px-8 py-6 text-lg">
            <MapPin className="w-6 h-6 mr-2" />
            Аналитика Рынка
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="glass-dark rounded-2xl p-6 transition-smooth hover:scale-105">
            <div className="text-3xl font-bold text-dubai-gold mb-2">2000+</div>
            <div className="text-muted-foreground">Объектов в базе</div>
          </div>
          <div className="glass-dark rounded-2xl p-6 transition-smooth hover:scale-105">
            <div className="text-3xl font-bold text-dubai-gold mb-2">95%</div>
            <div className="text-muted-foreground">Точность прогнозов</div>
          </div>
          <div className="glass-dark rounded-2xl p-6 transition-smooth hover:scale-105">
            <div className="text-3xl font-bold text-dubai-gold mb-2">24/7</div>
            <div className="text-muted-foreground">AI-консультант</div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dubai-blue-light to-transparent" />
    </section>
  );
};

export default Hero;