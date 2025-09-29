import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MarketAnalytics from "@/components/MarketAnalytics";
import CompactAnalytics from "@/components/CompactAnalytics";
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
      title: "AI-Powered Market Analysis",
      subtitle: "Advanced Intelligence Platform",
      description: "Our proprietary artificial intelligence system processes over 10,000 data points daily from Dubai's real estate market. The platform utilizes machine learning algorithms trained on 5+ years of market data to identify patterns, predict price movements, and assess investment opportunities with 95% accuracy.",
      details: [
        "Real-time market sentiment analysis from 50+ sources",
        "Predictive pricing models with 12-month forecasting",
        "Risk assessment algorithms for investment protection",
        "Automated property valuation using comparable sales data",
        "Market trend identification and opportunity alerts"
      ],
      metrics: [
        { label: "Data Points Analyzed Daily", value: "10,000+" },
        { label: "Prediction Accuracy", value: "95%" },
        { label: "Market Sources", value: "50+" }
      ],
      image: analyticsImage
    },
    {
      icon: TrendingUp,
      title: "Professional Investment Intelligence", 
      subtitle: "Comprehensive Financial Analysis",
      description: "Access institutional-grade investment analysis tools typically reserved for major real estate funds. Our platform provides detailed ROI calculations, cash flow projections, financing scenarios, and risk assessments for every property in our database.",
      details: [
        "IRR and NPV calculations with multiple scenarios",
        "Detailed cash flow projections for 10-year periods",
        "Financing optimization with 15+ bank partnerships",
        "Portfolio diversification recommendations",
        "Tax optimization strategies for UAE residents and non-residents"
      ],
      metrics: [
        { label: "Average Client ROI", value: "18.5%" },
        { label: "Bank Partners", value: "15+" },
        { label: "Analysis Parameters", value: "200+" }
      ],
      image: penthouseImage
    },
    {
      icon: FileText,
      title: "Institutional-Grade Reports",
      subtitle: "Professional Documentation",
      description: "Generate comprehensive investment reports that meet institutional standards. Our reports include market analysis, comparable property studies, legal due diligence summaries, and detailed financial projections used by major investment firms and high-net-worth individuals.",
      details: [
        "50-page detailed investment memorandums",
        "Legal compliance and regulatory analysis",
        "Market positioning and competitive landscape",
        "Exit strategy recommendations with timing",
        "Professional presentation materials for stakeholders"
      ],
      metrics: [
        { label: "Report Sections", value: "12+" },
        { label: "Data Visualizations", value: "25+" },
        { label: "Comparable Properties", value: "100+" }
      ],
      image: luxuryVilla
    },
    {
      icon: Database,
      title: "Comprehensive Market Database",
      subtitle: "Real-Time Property Intelligence",
      description: "Access the UAE's most comprehensive real estate database with over 3,000 new properties added monthly. Our system aggregates data from 50+ verified sources including developers, brokers, government records, and exclusive off-market opportunities.",
      details: [
        "Direct developer partnerships for pre-launch access",
        "Exclusive off-market opportunities from top brokers",
        "Government registry integration for ownership verification",
        "Price history tracking for all properties",
        "Automated alerts for new listings matching your criteria"
      ],
      metrics: [
        { label: "Monthly New Listings", value: "3,000+" },
        { label: "Verified Sources", value: "50+" },
        { label: "Database Properties", value: "150,000+" }
      ],
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
      
      {/* Hero Section - Reduced padding */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Luxury Dubai Apartment"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <Badge className="mb-3 bg-white/15 text-white border-white/20 backdrop-blur-sm text-xs px-3 py-1">
            <Crown className="w-3 h-3 mr-1.5" />
            Premium Real Estate Intelligence
          </Badge>
          
          <h1 className="text-3xl md:text-5xl font-display font-bold mb-3 leading-tight">
            Discover Dubai's
            <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Hidden Gems
            </span>
          </h1>
          
          <p className="text-base md:text-lg mb-4 max-w-2xl mx-auto leading-relaxed opacity-90">
            AI-powered real estate analysis with 3,000+ properties added monthly. 
            Make smarter investment decisions with professional-grade market intelligence.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-4">
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-none outline-none text-white placeholder-white/60 text-sm w-56"
              />
            </div>
            <Button 
              onClick={handleRegister}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-5 py-2 text-sm font-medium"
            >
              Register for Free
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-4 text-xs opacity-80">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span>Instant Access</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span>Free Forever Plan</span>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-5 h-5 text-white/60 rotate-90" />
        </div>
      </section>

      {/* Stats Section - Compact padding */}
      <section className="py-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-2">
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-xl font-bold text-gray-900 mb-1">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Professional Agency Style */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Professional Investment Solutions for
              <span className="block text-blue-900 mt-2">Institutional Clients</span>
            </h2>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed">
              Our agency provides institutional-grade real estate intelligence and investment solutions 
              trusted by family offices, investment funds, and high-net-worth individuals across the MENA region.
            </p>
          </div>

          <div className="space-y-20">
            {features.map((feature, index) => (
              <div key={index} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-start ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
                {/* Content Column */}
                <div className={`space-y-6 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-900 flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{feature.title}</h3>
                        <p className="text-sm font-semibold text-blue-900 uppercase tracking-wide">{feature.subtitle}</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 leading-relaxed text-base">
                      {feature.description}
                    </p>
                  </div>

                  {/* Key Features List */}
                  <div className="bg-gray-50 p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Key Capabilities:</h4>
                    <ul className="space-y-2">
                      {feature.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 bg-blue-900 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    {feature.metrics.map((metric, idx) => (
                      <div key={idx} className="text-center border border-gray-200 py-4 px-2">
                        <div className="text-2xl font-bold text-blue-900">{metric.value}</div>
                        <div className="text-xs text-gray-600 mt-1">{metric.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4">
                    <Button 
                      variant="outline" 
                      className="border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white px-6 py-2 h-10 font-semibold"
                    >
                      Learn More About This Solution
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                {/* Image Column */}
                <div className={`${index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
                  <div className="relative">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-80 object-cover shadow-lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-white/90 backdrop-blur-sm p-4">
                        <div className="text-sm font-semibold text-gray-900">{feature.title}</div>
                        <div className="text-xs text-gray-600">{feature.subtitle}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Agency Credentials Section */}
          <div className="mt-16 bg-gray-900 text-white p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4">Trusted by Leading Institutions</h3>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Our agency serves as the exclusive real estate intelligence partner for major investment firms, 
                family offices, and institutional investors throughout the Middle East and beyond.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-400">$2.5B+</div>
                <div className="text-sm text-gray-300">Assets Under Management</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400">150+</div>
                <div className="text-sm text-gray-300">Institutional Clients</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400">25+</div>
                <div className="text-sm text-gray-300">Countries Served</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400">98%</div>
                <div className="text-sm text-gray-300">Client Retention Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid - Compact */}
      <section className="py-6 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
              Why Choose Our Platform?
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Get the competitive edge with features designed for serious real estate professionals and investors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-4 hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mb-2">
                    <benefit.icon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-base font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Live Market Analytics Section */}
      <MarketAnalytics />

      {/* Advanced Analytics Demo - Compact */}
      <section className="py-6 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-4">
            <h2 className="text-xl md:text-2xl font-display font-bold mb-2">
              Real-Time Market Intelligence
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Comprehensive analytics dashboard with detailed market insights and forecasting.
            </p>
          </div>
          <CompactAnalytics />
        </div>
      </section>

      {/* Real-time Indicators - Compact */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="text-center mb-4">
            <h2 className="text-xl md:text-2xl font-display font-bold mb-2">
              Live Market Indicators
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Real-time tracking of key market metrics and performance indicators.
            </p>
          </div>
          <RealtimeMarketIndicators />
        </div>
      </section>

      {/* Testimonials - Compact */}
      <section className="py-6 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
              Trusted by Real Estate Professionals
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Join thousands of investors who are making smarter decisions with our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-4 hover:shadow-md transition-all duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Compact */}
      <section className="py-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
              Ready to Start Investing Smarter?
            </h2>
            <p className="text-base mb-4 max-w-2xl mx-auto opacity-90">
              Join thousands of successful investors who trust our AI-powered platform 
              to find the best real estate opportunities in Dubai.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-4">
              <Button 
                onClick={handleRegister}
                className="bg-white text-blue-600 hover:bg-gray-100 px-5 py-2 text-sm font-medium h-10"
              >
                <Crown className="w-4 h-4 mr-1.5" />
                Register for Free
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-blue-600 px-5 py-2 text-sm h-10"
              >
                <Play className="w-4 h-4 mr-1.5" />
                Watch Demo
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-6 text-xs opacity-80">
              <div className="flex items-center gap-1.5">
                <Award className="w-3 h-3" />
                <span>No Setup Fees</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                <span>Bank-Level Security</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3" />
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