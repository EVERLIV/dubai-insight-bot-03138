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
  Search, Bell, Calculator, Newspaper, Calendar, Download
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
      title: "Exclusive Market Access",
      subtitle: "Off-Market Opportunities",
      description: "Gain privileged access to pre-launch developments and off-market properties through our network of developer partnerships and broker relationships. Receive priority notifications 48-72 hours before public listing.",
      keyPoints: [
        "Pre-launch developer allocations",
        "Exclusive broker network access",
        "Private investor opportunities",
        "Early-stage project investments"
      ]
    },
    {
      icon: Calculator,
      title: "Advanced Valuation Services", 
      subtitle: "Professional Property Assessment",
      description: "Our certified valuation experts provide comprehensive property assessments using multiple valuation methodologies including sales comparison, income capitalization, and cost approach analysis.",
      keyPoints: [
        "RICS-certified valuation reports",
        "Multiple valuation methodologies",
        "Market rental assessments",
        "Investment grade documentation"
      ]
    },
    {
      icon: MapPin,
      title: "District Intelligence Platform",
      subtitle: "Comprehensive Area Analysis",
      description: "Access detailed neighborhood analytics including infrastructure development plans, demographic trends, rental yields, capital appreciation patterns, and future development pipeline.",
      keyPoints: [
        "Government master plan analysis",
        "Infrastructure development tracking",
        "Demographic and economic indicators",
        "Transportation connectivity studies"
      ]
    },
    {
      icon: Newspaper,
      title: "Market Intelligence Service",
      subtitle: "Professional Research & Analysis",
      description: "Receive institutional-quality market research including quarterly reports, regulatory updates, policy analysis, and strategic investment recommendations from our research team.",
      keyPoints: [
        "Quarterly market research reports",
        "Regulatory and policy analysis",
        "Strategic investment recommendations",
        "Economic trend forecasting"
      ]
    }
  ];

  const stats = [
    { number: "3,000+", label: "Properties Added Monthly", icon: Building2 },
    { number: "50+", label: "Verified Data Sources", icon: Database },
    { number: "95%", label: "Prediction Accuracy", icon: Target },
    { number: "24/7", label: "Market Monitoring", icon: Clock }
  ];

  const testimonials = [
    {
      name: "Ahmed Al-Mansouri",
      role: "Managing Director, Al-Mansouri Investment Group",
      company: "AUM: $500M+",
      content: "The institutional-grade analysis and exclusive deal flow have been instrumental in our Dubai portfolio expansion. Their AI-driven insights identified opportunities that generated 22% IRR across our last three acquisitions.",
      rating: 5
    },
    {
      name: "Sarah Thompson", 
      role: "Head of Real Estate, Meridian Capital",
      company: "International Investment Fund",
      content: "Professional service that matches our institutional standards. The comprehensive due diligence reports and market intelligence have become essential tools for our MENA real estate investments.",
      rating: 5
    },
    {
      name: "Omar Hassan",
      role: "Senior Partner, Hassan Family Office", 
      company: "Multi-Family Office",
      content: "Exceptional market access and analytical capabilities. The team's expertise in UAE regulations and tax optimization strategies has added significant value to our real estate allocation strategy.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section - Strict Professional Style */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Dubai Real Estate Investment"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gray-900/70"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <div className="mb-4 inline-block bg-blue-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide">
            Institutional Real Estate Intelligence
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Professional Investment Solutions for
            <span className="block text-blue-400 mt-2">
              Dubai Real Estate
            </span>
          </h1>
          
          <p className="text-lg md:text-xl mb-6 max-w-3xl mx-auto leading-relaxed opacity-90">
            Institutional-grade market intelligence, exclusive deal access, and comprehensive 
            investment analysis trusted by family offices and investment funds across the MENA region.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/20">
              <input
                type="email"
                placeholder="Professional Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-none outline-none text-white placeholder-white/60 text-sm w-64"
              />
            </div>
            <Button 
              onClick={handleRegister}
              className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 text-sm font-semibold h-12 transition-colors"
            >
              Request Institutional Access
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-xs opacity-80">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              <span>Institutional-Grade Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              <span>Exclusive Deal Access</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              <span>Professional Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Professional */}
      <section className="py-8 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center bg-white p-6 border border-gray-200">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-900 mb-3">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.number}</div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
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
                          <div className="w-1.5 h-1.5 bg-blue-900 mt-2 flex-shrink-0"></div>
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
                      className="border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white px-6 py-2 h-10 font-semibold transition-colors"
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

      {/* Benefits Grid - Professional */}
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">
              Comprehensive Investment Services
            </h2>
            <p className="text-base text-gray-700 max-w-3xl mx-auto">
              Professional services designed for institutional investors, family offices, and high-net-worth individuals 
              seeking sophisticated real estate investment solutions in the UAE market.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-900 flex items-center justify-center">
                    <benefit.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{benefit.title}</h3>
                    <p className="text-sm font-semibold text-blue-900 uppercase tracking-wide">{benefit.subtitle}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">{benefit.description}</p>
                <ul className="space-y-1">
                  {benefit.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-blue-900 mt-2 flex-shrink-0"></div>
                      <span className="text-xs text-gray-600">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Market Analytics Section */}
      <MarketAnalytics />

      {/* Advanced Analytics Demo */}
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">
              Real-Time Market Intelligence Platform
            </h2>
            <p className="text-base text-gray-700 max-w-3xl mx-auto">
              Access institutional-grade analytics and comprehensive market intelligence through our 
              professional dashboard designed for serious real estate investors.
            </p>
          </div>
          <CompactAnalytics />
        </div>
      </section>

      {/* Real-time Indicators */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">
              Live Market Performance Indicators
            </h2>
            <p className="text-base text-gray-700 max-w-3xl mx-auto">
              Monitor real-time market metrics and performance indicators with our professional-grade 
              tracking system updated every 15 minutes during market hours.
            </p>
          </div>
          <RealtimeMarketIndicators />
        </div>
      </section>

      {/* Testimonials - Professional */}
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">
              Trusted by Leading Investment Professionals
            </h2>
            <p className="text-base text-gray-700 max-w-3xl mx-auto">
              Read testimonials from institutional clients who rely on our professional services 
              for their Middle East real estate investment strategies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 border border-gray-200">
                <div className="flex items-center mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 mb-4 italic leading-relaxed">"{testimonial.content}"</p>
                <div className="border-t border-gray-200 pt-4">
                  <div className="font-semibold text-gray-900 text-sm">{testimonial.name}</div>
                  <div className="text-xs text-gray-600">{testimonial.role}</div>
                  <div className="text-xs text-blue-900 font-medium">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Professional */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Schedule Your Institutional Consultation
            </h2>
            <p className="text-lg mb-6 max-w-3xl mx-auto text-gray-300">
              Connect with our institutional team to discuss your real estate investment requirements 
              and access our exclusive deal pipeline reserved for qualified institutional investors.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Button 
                onClick={handleRegister}
                className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-3 text-sm font-semibold h-12 transition-colors"
              >
                Schedule Consultation
                <Calendar className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-3 text-sm h-12 transition-colors"
              >
                Download Investment Guide
                <Download className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-8 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Confidential Service</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Dedicated Support Team</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>Institutional Standards</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}