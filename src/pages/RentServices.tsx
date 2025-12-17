import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Key, 
  FileText, 
  Shield, 
  Calculator, 
  Users, 
  CheckCircle,
  Phone,
  Mail,
  Star,
  Clock,
  MapPin,
  Zap,
  Wifi,
  Wrench,
  Landmark,
  Search
} from "lucide-react";

const RentServices = () => {
  const [activeService, setActiveService] = useState(0);

  const services = [
    {
      title: "Tenant Sourcing & Screening",
      description: "Professional tenant identification and comprehensive verification",
      features: [
        "Credit history verification",
        "Employment verification",
        "Reference checks",
        "Income assessment"
      ],
      icon: Users
    },
    {
      title: "Property Management", 
      description: "Complete property maintenance and tenant relationship management",
      features: [
        "24/7 maintenance coordination",
        "Regular property inspections",
        "Tenant communication",
        "Emergency response services"
      ],
      icon: Home
    },
    {
      title: "Legal & Documentation",
      description: "Compliant contracts and legal protection services",
      features: [
        "Tenancy contract preparation",
        "Legal registration",
        "Security deposit management",
        "Dispute resolution support"
      ],
      icon: FileText
    },
    {
      title: "Financial Management",
      description: "Rental income optimization and financial reporting",
      features: [
        "Rent collection automation",
        "Financial reporting",
        "Market rent analysis",
        "Yield optimization strategies"
      ],
      icon: Calculator
    }
  ];

  const partners = [
    { name: "EVN", type: "Utility Partner", icon: Zap },
    { name: "Viettel & VNPT", type: "Telecom Partners", icon: Wifi },
    { name: "PMH Services", type: "Maintenance Partner", icon: Wrench },
    { name: "VARS", type: "Regulatory Authority", icon: Shield },
    { name: "HCMC Govt", type: "Government Partner", icon: Landmark },
    { name: "Batdongsan", type: "Marketing Partner", icon: Search }
  ];

  const rentalStats = [
    { label: "Average Rental Yield", value: "8.5%", change: "+0.5%" },
    { label: "Tenant Retention Rate", value: "89%", change: "+5%" },
    { label: "Average Days to Let", value: "10", change: "-3 days" },
    { label: "Properties Managed", value: "650+", change: "+80" }
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
                  Rental Management Services
                </h1>
                <p className="text-xl text-gray-300 max-w-3xl">
                  Professional property rental management with guaranteed tenant placement, 
                  comprehensive maintenance services, and maximized rental yields for property investors.
                </p>
              </div>
            </div>
            
            {/* Director's Signature Effect */}
            <div className="mt-12 relative">
              <div className="bg-white/10 border border-white/20 p-8 max-w-2xl">
                <div className="relative">
                  <p className="text-lg italic text-gray-200 leading-relaxed">
                    "Our rental management approach focuses on maximizing property value 
                    while ensuring exceptional tenant experiences. We handle every detail 
                    so you can enjoy passive income with complete peace of mind."
                  </p>
                  {/* Hand-written signature effect */}
                  <div className="mt-6 relative">
                    <div className="text-2xl font-light text-emerald-400 transform -rotate-1 inline-block">
                      Le Thi Mai
                    </div>
                    <div className="text-sm text-gray-400 mt-1">Head of Rental Services</div>
                    {/* Hand-drawn line effect */}
                    <div className="absolute -bottom-2 left-0 w-36 h-0.5 bg-emerald-400 transform -rotate-2 opacity-60"></div>
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
          
          {/* Performance Metrics */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-emerald-600"></div>
              <h2 className="text-2xl font-bold text-gray-900">Our Performance Metrics</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {rentalStats.map((stat, index) => (
                <div key={index} className="bg-white border border-gray-200 p-6 text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600 mb-2">{stat.label}</div>
                  <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                    {stat.change}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Service Selection */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-emerald-600"></div>
              <h2 className="text-2xl font-bold text-gray-900">Comprehensive Rental Services</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
              {services.map((service, index) => (
                <button
                  key={index}
                  onClick={() => setActiveService(index)}
                  className={`p-4 border text-left transition-all ${
                    activeService === index
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-600'
                  }`}
                >
                  <service.icon className={`w-6 h-6 mb-3 ${
                    activeService === index ? 'text-emerald-600' : 'text-gray-600'
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
                        className: "w-8 h-8 text-emerald-600" 
                      })}
                      <h3 className="text-2xl font-bold text-gray-900">
                        {services[activeService].title}
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                      {services[activeService].description}
                    </p>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Phone className="w-4 h-4 mr-2" />
                      Get Rental Quote
                    </Button>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Service Features</h4>
                    <div className="space-y-3">
                      {services[activeService].features.map((feature, idx) => (
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

          {/* Rental Process Timeline */}
          <div className="mb-16 bg-gray-50 border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-emerald-600"></div>
              <h2 className="text-2xl font-bold text-gray-900">Our Rental Process</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Property Assessment", time: "Day 1", icon: Home },
                { step: "2", title: "Marketing & Listing", time: "Day 2-3", icon: MapPin },
                { step: "3", title: "Tenant Screening", time: "Day 4-7", icon: Users },
                { step: "4", title: "Contract & Handover", time: "Day 8-10", icon: Key }
              ].map((phase, index) => (
                <div key={index} className="bg-white border border-gray-300 p-6 relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {phase.step}
                    </div>
                    <phase.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{phase.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {phase.time}
                  </div>
                  {index < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-emerald-600"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Our Partners Section */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-emerald-600"></div>
              <h2 className="text-2xl font-bold text-gray-900">Our Service Partners</h2>
            </div>
            
            <div className="bg-white border border-gray-200 p-8">
              <p className="text-gray-600 mb-8 max-w-3xl">
                We collaborate with trusted service providers and government entities 
                to ensure seamless rental operations and tenant satisfaction across all managed properties.
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
                <h3 className="text-2xl font-bold mb-4">Ready to Maximize Your Rental Income?</h3>
                <p className="text-gray-300 mb-6">
                  Let our rental specialists handle your property management while you enjoy 
                  guaranteed monthly income and property appreciation.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Phone className="w-4 h-4 mr-2" />
                    +84 28 1234 5679
                  </Button>
                  <Button variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                    <Mail className="w-4 h-4 mr-2" />
                    rentals@saigonproperties.vn
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
                  98% client satisfaction rate
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

export default RentServices;
