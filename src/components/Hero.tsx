import { Button } from "@/components/ui/button";
import { Building2, TrendingUp, MapPin } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700">
        <div className="absolute top-20 left-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-32 right-20 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-3 glass-dark rounded-2xl px-8 py-4 animate-glow">
            <Building2 className="w-8 h-8 text-amber-400" />
            <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
              Saigon Invest
            </h1>
          </div>
        </div>

        {/* Hero Title */}
        <h2 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 leading-tight">
          Smart Real Estate
          <span className="block bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 bg-clip-text text-transparent">
            Investments
          </span>
          in Ho Chi Minh City
        </h2>

        {/* Hero Description */}
        <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed">
          Personalized analytics, smart property matching, and market forecasts 
          for successful investments in premium Ho Chi Minh City real estate
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black hover:shadow-lg transition-all duration-300 hover:scale-105 px-8 py-6 text-lg font-semibold">
            <TrendingUp className="w-6 h-6 mr-2" />
            Find Properties
          </Button>
          <Button variant="outline" size="lg" className="glass-dark border-amber-400/30 text-white hover:bg-amber-400/10 px-8 py-6 text-lg">
            <MapPin className="w-6 h-6 mr-2" />
            Market Analytics
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="glass-dark rounded-2xl p-6 transition-smooth hover:scale-105">
            <div className="text-3xl font-bold text-amber-400 mb-2">2000+</div>
            <div className="text-gray-300">Properties Listed</div>
          </div>
          <div className="glass-dark rounded-2xl p-6 transition-smooth hover:scale-105">
            <div className="text-3xl font-bold text-amber-400 mb-2">95%</div>
            <div className="text-gray-300">Forecast Accuracy</div>
          </div>
          <div className="glass-dark rounded-2xl p-6 transition-smooth hover:scale-105">
            <div className="text-3xl font-bold text-amber-400 mb-2">24/7</div>
            <div className="text-gray-300">AI Consultant</div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-emerald-800 to-transparent" />
    </section>
  );
};

export default Hero;
