import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  ArrowLeft, Heart, Share2, MapPin, Home, Maximize2, Bath, Bed, 
  Car, Wifi, Shield, Waves, Dumbbell, User, Phone, MessageCircle,
  TrendingUp, Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import PremiumSidebar from '@/components/PremiumSidebar';
import EnhancedPriceTrends from '@/components/EnhancedPriceTrends';
import PropertyReport from '@/components/PropertyReport';

// Mock price data for charts
const priceData = [
  { month: 'Jan 2023', price: 2800000 },
  { month: 'Apr 2023', price: 2850000 },
  { month: 'Jul 2023', price: 2900000 },
  { month: 'Oct 2023', price: 2950000 },
  { month: 'Jan 2024', price: 3000000 },
  { month: 'Apr 2024', price: 3100000 },
  { month: 'Jul 2024', price: 3200000 },
  { month: 'Oct 2024', price: 3250000 },
];

// District information
const districtInfo: Record<string, any> = {
  'Dubai Marina': {
    description: 'A prestigious waterfront district with luxury high-rises, yacht clubs, and world-class dining. Features the iconic Marina Walk and JBR Beach nearby.',
    highlights: ['Waterfront Living', 'Marina Walk', 'Fine Dining', 'Beach Access', 'Metro Station'],
    avgPrice: '3.2M AED',
    priceGrowth: '+12%',
  },
  'Downtown Dubai': {
    description: 'The heart of modern Dubai, home to Burj Khalifa, Dubai Mall, and premium business district. Ultimate urban luxury living.',
    highlights: ['Burj Khalifa', 'Dubai Mall', 'Business District', 'Fine Dining', 'Metro Access'],
    avgPrice: '4.8M AED',
    priceGrowth: '+15%',
  },
  'Business Bay': {
    description: 'Dynamic business and residential hub with modern skyscrapers, canal views, and excellent connectivity to key Dubai areas.',
    highlights: ['Business Hub', 'Canal Views', 'Modern Architecture', 'Metro Station', 'Restaurants'],
    avgPrice: '2.1M AED',
    priceGrowth: '+8%',
  }
};

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Mock property data - in real app, fetch based on ID
  const property = {
    id: id,
    title: "Executive Marina Residence - Premium Commercial Grade Property",
    price: 3200000,
    location_area: "Dubai Marina",
    property_type: "Apartment",
    bedrooms: 3,
    bathrooms: 2,
    area_sqft: 1800,
    images: ["/placeholder.svg"],
    agent_name: "Sarah Johnson",
    agent_phone: "+971 50 123 4567",
    purpose: "for-sale",
    housing_status: "ready",
    description: "Premium executive residence featuring sophisticated architectural design, institutional-grade finishes, and comprehensive marina access. Property delivers exceptional investment performance with verified market positioning and certified compliance standards.",
    amenities: ["Executive Pool Facility", "Corporate Fitness Center", "Secure Parking", "24/7 Professional Security", "Marina Access", "Executive Balcony", "Climate Control Systems", "High-Speed Connectivity"],
    completion_status: "ready",
    is_furnished: true
  };

  const district = districtInfo[property.location_area] || districtInfo['Dubai Marina'];

  // Professional map placeholder
  const MapPlaceholder = () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100"></div>
      <div className="relative z-10 text-center">
        <div className="w-8 h-8 bg-blue-900 flex items-center justify-center mx-auto mb-2">
          <MapPin className="w-4 h-4 text-white" />
        </div>
        <div className="text-sm font-bold text-gray-900">{property.location_area}</div>
        <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Dubai, UAE</div>
      </div>
      <div className="absolute top-4 right-4 w-3 h-3 bg-blue-900"></div>
    </div>
  );

  const features = [
    { icon: Home, label: 'Type', value: property.property_type },
    { icon: Bed, label: 'Beds', value: property.bedrooms || 'Studio' },
    { icon: Bath, label: 'Baths', value: property.bathrooms },
    { icon: Maximize2, label: 'Area', value: `${property.area_sqft} sq.ft` },
    { icon: Car, label: 'Parking', value: '2 Executive Spots' },
    { icon: Calendar, label: 'Built', value: '2022' },
  ];

  const amenityIcons: Record<string, any> = {
    'Executive Pool Facility': Waves,
    'Corporate Fitness Center': Dumbbell,
    'Secure Parking': Car,
    '24/7 Professional Security': Shield,
    'High-Speed Connectivity': Wifi,
    'Climate Control Systems': Home,
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Professional Navigation Bar */}
        <div className="border-b border-gray-300 bg-white">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-900 font-semibold uppercase tracking-wide"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Properties
              </Button>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="flex items-center gap-2 text-gray-900 font-semibold uppercase tracking-wide border border-gray-300"
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-blue-900 text-blue-900' : ''}`} />
                  Save Property
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-900 font-semibold uppercase tracking-wide border border-gray-300">
                  <Share2 className="w-4 h-4" />
                  Share Property
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Professional Property Header */}
          <div className="mb-8 border-b border-gray-300 pb-6">
            <div className="mb-4">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">{property.title}</h1>
              <div className="flex items-center text-gray-600">
                <div className="w-5 h-5 bg-blue-900 flex items-center justify-center mr-2">
                  <MapPin className="w-3 h-3 text-white" />
                </div>
                <span className="font-semibold uppercase tracking-wide">{property.location_area}, Dubai</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-900 mb-1">
                  {property.price?.toLocaleString()} AED
                </div>
                <div className="text-sm text-gray-600 font-medium uppercase tracking-wide">
                  {property.purpose === 'for-rent' ? 'Annual Rate' : 'Investment Price'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Professional Media & Features Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Professional Photo Gallery */}
                <div className="lg:col-span-2">
                  {/* Main Professional Photo */}
                  <div className="relative h-96 mb-4 border border-gray-300">
                    <img
                      src={property.images?.[0] || "/placeholder.svg"}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 flex gap-3">
                      <div className="bg-blue-900 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider">
                        {property.purpose === 'for-sale' ? 'For Sale' : 'For Rent'}
                      </div>
                      {property.housing_status && (
                        <div className="bg-gray-900 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider">
                          {property.housing_status === 'primary' ? 'Off-plan' : 'Ready'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Professional Photo Grid */}
                  <div className="grid grid-cols-6 gap-2">
                    {[0,1,2,3,4,5].map((i) => (
                      <div key={i} className="aspect-square border border-gray-300">
                        <img
                          src="/placeholder.svg"
                          alt={`Property ${i + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Professional Features Panel */}
                <div className="lg:col-span-1">
                  <Card className="h-full border-gray-300">
                    <CardContent className="p-6 h-full">
                      <h3 className="text-sm font-bold mb-4 text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2">Property Specifications</h3>
                      <div className="space-y-4">
                        {features.map((feature, index) => (
                          <div key={index} className="border border-gray-300 p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-900 flex items-center justify-center">
                                <feature.icon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-900">{feature.value}</div>
                                <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide">{feature.label}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Professional Amenities Section */}
              <Card className="border-gray-300">
                <CardContent className="p-6">
                  <h3 className="text-sm font-bold mb-4 text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2">Executive Amenities</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {property.amenities?.slice(0, 8).map((amenity: string, index: number) => {
                      const IconComponent = amenityIcons[amenity] || Home;
                      return (
                        <div key={index} className="flex items-center gap-3 border border-gray-300 p-3">
                          <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                            <IconComponent className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Professional Description */}
              <Card className="border-gray-300">
                <CardContent className="p-6">
                  <h3 className="text-sm font-bold mb-4 text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2">Property Overview</h3>
                  <p className="text-sm text-gray-700 leading-relaxed font-medium">
                    {property.description}
                  </p>
                </CardContent>
              </Card>

              {/* Professional Location Analysis */}
              <Card className="border-gray-300">
                <CardContent className="p-6">
                  <h3 className="text-sm font-bold mb-4 text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2">Location Intelligence</h3>
                  <p className="text-sm text-gray-700 mb-4 font-medium">
                    {district.description}
                  </p>
                  
                  {/* Professional District Features */}
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {district.highlights.map((highlight: string, index: number) => (
                      <div key={index} className="bg-gray-900 text-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-center">
                        {highlight}
                      </div>
                    ))}
                  </div>

                  {/* Professional Map */}
                  <div className="h-64 border border-gray-300">
                    <MapPlaceholder />
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Price Trends */}
              <EnhancedPriceTrends 
                location={property.location_area || 'Dubai Marina'}
                propertyType={property.property_type}
                bedrooms={property.bedrooms}
              />

              {/* Property Report */}
              <PropertyReport property={property} />
            </div>

            {/* Professional Sidebar */}
            <div className="space-y-6">
              <PremiumSidebar property={property} />
              
              {/* Professional Agent Contact */}
              {property.agent_name && (
                <Card className="border-gray-300">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-bold mb-4 text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2">Licensed Agent</h3>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-blue-900 flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-lg text-gray-900">{property.agent_name}</div>
                        <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Certified Real Estate Professional</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Button className="w-full h-12 text-sm bg-blue-900 hover:bg-blue-800 text-white font-bold uppercase tracking-wider">
                        <Phone className="w-4 h-4 mr-2" />
                        Call Agent
                      </Button>
                      <Button variant="outline" className="w-full h-12 text-sm border-gray-300 text-gray-900 font-bold uppercase tracking-wider">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}