import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  FileSearch, 
  Calculator, 
  Users, 
  TrendingUp, 
  MapPin, 
  Building2,
  CheckCircle,
  Phone,
  Mail,
  Star,
  Landmark,
  CreditCard,
  Hammer,
  Award
} from "lucide-react";

const BuyServices = () => {
  const [activeService, setActiveService] = useState(0);

  const services = [
    {
      title: "Property Sourcing & Analysis",
      description: "Professional property identification and comprehensive market analysis",
      features: [
        "Exclusive off-market opportunities",
        "Detailed financial projections",
        "Comparative market analysis",
        "Investment risk assessment"
      ],
      icon: FileSearch
    },
    {
      title: "Due Diligence & Legal Support", 
      description: "Complete legal verification and documentation services",
      features: [
        "Title deed verification",
        "Legal compliance check",
        "Legal documentation review",
        "Property inspection coordination"
      ],
      icon: Shield
    },
    {
      title: "Financial Advisory",
      description: "Strategic financing solutions and investment optimization",
      features: [
        "Mortgage arrangement",
        "Investment structuring",
        "Tax optimization strategies",
        "Portfolio diversification advice"
      ],
      icon: Calculator
    },
    {
      title: "Transaction Management",
      description: "End-to-end transaction coordination and completion",
      features: [
        "Negotiation management",
        "Contract administration",
        "Settlement coordination",
        "Post-purchase support"
      ],
      icon: Users
    }
  ];

  const partners = [
    { name: "Vietcombank", type: "Banking Partner", icon: Landmark },
    { name: "BIDV", type: "Mortgage Provider", icon: CreditCard },
    { name: "Novaland", type: "Developer Partner", icon: Hammer },
    { name: "Vingroup", type: "Premium Developer", icon: Building2 },
    { name: "HCMC Land Dept", type: "Government Partner", icon: Landmark },
    { name: "VARS", type: "Regulatory Authority", icon: Shield }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      {/* Professional Hero Section */}
      <div className="bg-gray-900 text-white py-20 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-16 bg-emerald-500"></div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Property Acquisition Services
                </h1>
                <p className="text-xl text-gray-300 max-w-3xl">
                  Professional property acquisition with comprehensive market intelligence, 
                  legal expertise, and strategic investment advisory for sophisticated investors.
                </p>
              </div>
            </div>
            
            {/* Director's Signature Effect */}
            <div className="mt-12 relative">
              <div className="bg-white/10 border border-white/20 p-8 max-w-2xl">
                <div className="relative">
                  <p className="text-lg italic text-gray-200 leading-relaxed">
                    "Our institutional approach to property acquisition combines 
                    deep market expertise with rigorous due diligence processes, 
                    ensuring every investment decision is backed by comprehensive analysis."
                  </p>
                  {/* Hand-written signature effect */}
                  <div className="mt-6 relative">
                    <div className="text-2xl font-light text-emerald-400 transform -rotate-2 inline-block">
                      Nguyen Thanh Tung
                    </div>
                    <div className="text-sm text-gray-400 mt-1">Managing Director</div>
                    {/* Hand-drawn line effect */}
                    <div className="absolute -bottom-2 left-0 w-40 h-0.5 bg-emerald-400 transform -rotate-1 opacity-60"></div>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-2 -right-2 w-4 h-4 border-2 border-emerald-400 rotate-45"></div>
              <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-emerald-400"></div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          
          {/* Service Selection */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-emerald-800"></div>
              <h2 className="text-2xl font-bold text-gray-900">Professional Services Portfolio</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
              {services.map((service, index) => (
                <button
                  key={index}
                  onClick={() => setActiveService(index)}
                  className={`p-4 border text-left transition-all ${
                    activeService === index
                      ? 'border-emerald-800 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-800'
                  }`}
                >
                  <service.icon className={`w-6 h-6 mb-3 ${
                    activeService === index ? 'text-emerald-800' : 'text-gray-600'
                  }`} />
                  <h3 className="font-semibold text-sm mb-2">{service.title}</h3>
                  <p className="text-xs text-gray-600">{service.description}</p>
                </button>
              ))}
            </div>

            {/* Active Service Details */}
            <Card className="border-gray-200">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      {React.createElement(services[activeService].icon, { 
                        className: "w-8 h-8 text-emerald-800" 
                      })}
                      <h3 className="text-2xl font-bold text-gray-900">
                        {services[activeService].title}
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                      {services[activeService].description}
                    </p>
                    <Button className="bg-emerald-800 hover:bg-emerald-700 text-white">
                      <Phone className="w-4 h-4 mr-2" />
                      Schedule Consultation
                    </Button>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Service Features</h4>
                    <div className="space-y-3">
                      {services[activeService].features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Intelligence Section */}
          <div className="mb-16 bg-gray-50 border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-emerald-800"></div>
              <h2 className="text-2xl font-bold text-gray-900">Market Intelligence & Analytics</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-300 p-6">
                <TrendingUp className="w-8 h-8 text-emerald-800 mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Market Trends Analysis</h3>
                <p className="text-sm text-gray-600">
                  Real-time market data and predictive analytics for informed investment decisions.
                </p>
              </div>
              <div className="bg-white border border-gray-300 p-6">
                <MapPin className="w-8 h-8 text-emerald-800 mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Location Intelligence</h3>
                <p className="text-sm text-gray-600">
                  Comprehensive area analysis including infrastructure, demographics, and growth potential.
                </p>
              </div>
              <div className="bg-white border border-gray-300 p-6">
                <Building2 className="w-8 h-8 text-emerald-800 mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Property Valuation</h3>
                <p className="text-sm text-gray-600">
                  Professional property valuations using advanced algorithms and market comparables.
                </p>
              </div>
            </div>
          </div>

          {/* Our Partners Section */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-emerald-800"></div>
              <h2 className="text-2xl font-bold text-gray-900">Our Strategic Partners</h2>
            </div>
            
            <div className="bg-white border border-gray-200 p-8">
              <p className="text-gray-600 mb-8 max-w-3xl">
                We maintain strategic partnerships with leading financial institutions, 
                government entities, and premium developers to provide our clients with 
                exclusive access and preferential terms.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {partners.map((partner, index) => (
                  <div key={index} className="border border-gray-200 p-4 text-center hover:border-emerald-800 transition-colors">
                    <partner.icon className="w-8 h-8 text-emerald-800 mx-auto mb-2" />
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
                <h3 className="text-2xl font-bold mb-4">Ready to Begin Your Property Acquisition?</h3>
                <p className="text-gray-300 mb-6">
                  Schedule a confidential consultation with our acquisition specialists 
                  to discuss your investment objectives and explore exclusive opportunities.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Phone className="w-4 h-4 mr-2" />
                    +84 28 1234 5678
                  </Button>
                  <Button variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                    <Mail className="w-4 h-4 mr-2" />
                    acquisition@saigonproperties.vn
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
                  Trusted by over 500+ high-net-worth clients
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

export default BuyServices;
