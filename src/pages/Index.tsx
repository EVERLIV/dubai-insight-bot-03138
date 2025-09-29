import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MarketAnalytics from "@/components/MarketAnalytics";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import RealtimeMarketIndicators from "@/components/RealtimeMarketIndicators";
import { 
  ArrowRight, TrendingUp, BarChart3, FileText, Building2, 
  MapPin, Clock, Shield, Zap, Users, Star, CheckCircle,
  Target, Globe, Smartphone, Brain, PieChart, Activity,
  Crown, Sparkles, ChevronRight, Play, Award, Database,
  Search, Bell, Calculator, Newspaper
} from "lucide-react";

// Import generated images
import heroImage from "@/assets/hero-luxury-apartment.jpg";
import luxuryVilla from "@/assets/luxury-villa.jpg";
import penthouseImage from "@/assets/penthouse-terrace.jpg";
import analyticsImage from "@/assets/analytics-dashboard.jpg";
import modernBuilding from "@/assets/modern-building.jpg";

export default function Index() {
  const [email, setEmail] = useState('');

  const handleRegister = () => {
    // In a real app, this would handle registration
    alert('Registration feature coming soon! Thank you for your interest.');
  };

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms analyze market trends, property values, and investment opportunities in real-time.",
      image: analyticsImage
    },
    {
      icon: TrendingUp,
      title: "Investment Intelligence", 
      description: "Get comprehensive ROI calculations, cash flow projections, and risk assessments for every property.",
      image: penthouseImage
    },
    {
      icon: FileText,
      title: "Professional Reports",
      description: "Generate detailed investment reports with market analysis, comparable properties, and forecasting.",
      image: luxuryVilla
    },
    {
      icon: Database,
      title: "3000+ Properties Monthly",
      description: "Access our constantly updated database with new listings from multiple verified sources every day.",
      image: modernBuilding
    }
  ];

  const benefits = [
    {
      icon: Search,
      title: "Quick Access to New Deals",
      description: "Be the first to discover premium properties as they hit the market with our real-time notifications."
    },
    {
      icon: Calculator,
      title: "Price Analysis Before Purchase", 
      description: "Get instant property valuations and market comparisons to make informed buying decisions."
    },
    {
      icon: MapPin,
      title: "District Analysis",
      description: "Comprehensive neighborhood insights including infrastructure, amenities, and growth potential."
    },
    {
      icon: Newspaper,
      title: "Real Estate News Portal",
      description: "Stay updated with the latest market news, regulations, and investment opportunities."
    }
  ];

  const stats = [
    { number: "3,000+", label: "Properties Added Monthly", icon: Building2 },
    { number: "50+", label: "Data Sources", icon: Database },
    { number: "95%", label: "Accuracy Rate", icon: Target },
    { number: "24/7", label: "Market Monitoring", icon: Clock }
  ];

  const testimonials = [
    {
      name: "Ahmed Al-Mansouri",
      role: "Real Estate Investor",
      content: "This platform helped me identify undervalued properties in Business Bay. I've made 3 successful investments with 15%+ ROI.",
      rating: 5
    },
    {
      name: "Sarah Thompson", 
      role: "Property Developer",
      content: "The AI analysis is incredibly accurate. It saved me from a bad investment and pointed me to a goldmine in JVC.",
      rating: 5
    },
    {
      name: "Omar Hassan",
      role: "Investment Advisor", 
      content: "My clients love the detailed reports. It's become an essential tool for our real estate advisory services.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-6 text-center text-white">
          <Badge className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm">
            <Crown className="w-4 h-4 mr-2" />
            Premium Real Estate Intelligence
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
            Discover Dubai's
            <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Hidden Gems
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
            AI-powered real estate analysis with 3,000+ properties added monthly. 
            Make smarter investment decisions with professional-grade market intelligence.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-none outline-none text-white placeholder-white/70 w-64"
              />
            </div>
            <Button 
              onClick={handleRegister}
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
            >
              Register for Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Instant Access</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Free Forever Plan</span>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-6 h-6 text-white rotate-90" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Powerful Features for
              <span className="block text-primary">Smart Investors</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to make informed real estate investment decisions, 
              powered by cutting-edge AI and comprehensive market data.
            </p>
          </div>

          <div className="space-y-20">
            {features.map((feature, index) => (
              <div key={index} className={`flex flex-col lg:flex-row items-center gap-12 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                <div className="flex-1">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <Button variant="outline" size="lg">
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-80 object-cover rounded-2xl shadow-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get the competitive edge with features designed for serious real estate professionals and investors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mb-4">
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Live Market Analytics Section */}
      <MarketAnalytics />

      {/* Advanced Analytics Demo */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Real-Time Market Intelligence
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See our advanced analytics in action. Get instant insights on market trends, 
              property valuations, and investment opportunities.
            </p>
          </div>
          <AdvancedAnalytics />
        </div>
      </section>

      {/* Real-time Indicators */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container mx-auto px-6">
          <RealtimeMarketIndicators />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Trusted by Real Estate Professionals
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join thousands of investors who are making smarter decisions with our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
              Ready to Start Investing Smarter?
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Join thousands of successful investors who trust our AI-powered platform 
              to find the best real estate opportunities in Dubai.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button 
                onClick={handleRegister}
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
              >
                <Crown className="w-5 h-5 mr-2" />
                Register for Free
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>No Setup Fees</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Bank-Level Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}