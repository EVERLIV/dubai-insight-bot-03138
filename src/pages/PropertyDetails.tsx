import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  ArrowLeft, Heart, Share2, MapPin, Home, Maximize2, Bath, Bed, 
  Car, Wifi, Shield, Waves, Dumbbell, User, Phone, MessageCircle,
  TrendingUp, Calendar, Sparkles, Loader2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import PremiumSidebar from '@/components/PremiumSidebar';
import EnhancedPriceTrends from '@/components/EnhancedPriceTrends';
import PropertyReport from '@/components/PropertyReport';
import { supabase } from '@/integrations/supabase/client';

// District information for HCMC
const districtInfo: Record<string, any> = {
  'District 1': {
    description: 'The vibrant heart of Ho Chi Minh City, featuring luxury high-rises, premium shopping centers, and world-class dining. Home to iconic landmarks like Notre-Dame Cathedral and Ben Thanh Market.',
    highlights: ['City Center', 'Premium Shopping', 'Fine Dining', 'Business Hub', 'Metro Access'],
    avgPrice: '50M VND',
    priceGrowth: '+15%',
  },
  'District 2': {
    description: 'Modern expat-friendly district with international schools, riverside living, and contemporary developments. Thu Thiem area offers premium waterfront properties.',
    highlights: ['Expat Community', 'International Schools', 'Riverside Views', 'Modern Living', 'Family Friendly'],
    avgPrice: '35M VND',
    priceGrowth: '+12%',
  },
  'District 7': {
    description: 'Planned urban district featuring Phu My Hung, known for its clean streets, green spaces, and family-oriented community. Popular with Korean and Japanese expats.',
    highlights: ['Phu My Hung', 'Green Spaces', 'Shopping Malls', 'Safe Area', 'International Community'],
    avgPrice: '30M VND',
    priceGrowth: '+10%',
  },
  'Binh Thanh': {
    description: 'Dynamic district bridging the city center and Thu Duc. Features Landmark 81, Vietnam\'s tallest building, and excellent connectivity.',
    highlights: ['Landmark 81', 'Central Location', 'Good Transport', 'Diverse Dining', 'Growing Area'],
    avgPrice: '25M VND',
    priceGrowth: '+8%',
  },
  'Thu Duc': {
    description: 'Emerging tech and education hub featuring universities, technology parks, and new urban developments. The future heart of Saigon\'s innovation district.',
    highlights: ['Tech Hub', 'Universities', 'New Developments', 'Investment Potential', 'Growing Infrastructure'],
    avgPrice: '20M VND',
    priceGrowth: '+18%',
  }
};

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isFavorite, setIsFavorite] = useState(false);
  const [aiDescription, setAiDescription] = useState<string>('');
  const [englishTitle, setEnglishTitle] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  // Get property from navigation state if available
  const propertyFromState = location.state?.property;
  
  const property = propertyFromState || {
    id: id,
    title: "Premium Executive Residence",
    price: 35000000,
    location_area: "District 2",
    district: "District 2",
    property_type: "Apartment",
    bedrooms: 3,
    bathrooms: 2,
    area_sqft: 120,
    images: ["/placeholder.svg"],
    agent_name: "Sarah Johnson",
    agent_phone: "+84 90 123 4567",
    purpose: "for-rent",
    housing_status: "ready",
    pets_allowed: true,
    amenities: ["Swimming Pool", "Fitness Center", "Secure Parking", "24/7 Security", "Balcony", "Air Conditioning", "High-Speed Internet", "Furnished"],
    completion_status: "ready",
    is_furnished: true
  };

  const district = districtInfo[property.district || property.location_area] || districtInfo['District 2'];

  // Generate AI description on mount
  useEffect(() => {
    generateAIDescription();
  }, [property.id]);

  const generateAIDescription = async () => {
    setIsLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-property-description', {
        body: { property }
      });

      if (error) throw error;

      if (data?.description) {
        setAiDescription(data.description);
      }
      if (data?.englishTitle) {
        setEnglishTitle(data.englishTitle);
      }
    } catch (error) {
      console.error('Error generating AI description:', error);
      // Fallback description
      setAiDescription(`This exceptional ${property.property_type?.toLowerCase() || 'property'} offers ${property.bedrooms || 'studio'} bedrooms and ${property.bathrooms || 1} bathrooms across ${property.area_sqft || 'a generous'} sqm of well-designed living space. Located in the desirable ${property.district || property.location_area || 'Ho Chi Minh City'} area, this property combines modern comfort with convenient urban living. ${property.pets_allowed ? 'Pet-friendly policy makes it perfect for animal lovers.' : ''} An excellent opportunity for discerning renters seeking quality accommodation.`);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Professional map placeholder
  const MapPlaceholder = () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100"></div>
      <div className="relative z-10 text-center">
        <div className="w-8 h-8 bg-emerald-700 flex items-center justify-center mx-auto mb-2">
          <MapPin className="w-4 h-4 text-white" />
        </div>
        <div className="text-sm font-bold text-gray-900">{property.district || property.location_area}</div>
        <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Ho Chi Minh City, Vietnam</div>
      </div>
      <div className="absolute top-4 right-4 w-3 h-3 bg-emerald-700"></div>
    </div>
  );

  const features = [
    { icon: Home, label: 'Type', value: property.property_type },
    { icon: Bed, label: 'Bedrooms', value: property.bedrooms || 'Studio' },
    { icon: Bath, label: 'Bathrooms', value: property.bathrooms },
    { icon: Maximize2, label: 'Area', value: `${property.area_sqft} sqm` },
    { icon: Car, label: 'Parking', value: 'Available' },
    { icon: Calendar, label: 'Status', value: property.housing_status === 'primary' ? 'Off-plan' : 'Ready' },
  ];

  const amenityIcons: Record<string, any> = {
    'Swimming Pool': Waves,
    'Fitness Center': Dumbbell,
    'Secure Parking': Car,
    '24/7 Security': Shield,
    'High-Speed Internet': Wifi,
    'Air Conditioning': Home,
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M VND`;
    }
    return `${(price / 1000).toFixed(0)}K VND`;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Professional Navigation Bar */}
        <div className="border-b border-gray-100 bg-white">
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
                  className="flex items-center gap-2 text-gray-900 font-semibold uppercase tracking-wide border border-gray-200"
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  Save Property
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-900 font-semibold uppercase tracking-wide border border-gray-200">
                  <Share2 className="w-4 h-4" />
                  Share Property
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Professional Property Header */}
          <div className="mb-8 border-b border-gray-100 pb-6">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                {isLoadingAI && (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Enhanced
                  </Badge>
                )}
              </div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 max-w-4xl">
                {englishTitle || property.title}
              </h1>
              <div className="flex items-center text-gray-600">
                <div className="w-5 h-5 bg-emerald-700 flex items-center justify-center mr-2">
                  <MapPin className="w-3 h-3 text-white" />
                </div>
                <span className="font-semibold uppercase tracking-wide text-sm">{property.district || property.location_area}, Ho Chi Minh City</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="max-w-xs">
                <div className="text-2xl md:text-3xl font-bold text-emerald-700 mb-1">
                  {formatPrice(property.price || 0)}
                </div>
                <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                  {property.purpose === 'for-rent' ? 'Monthly Rent' : 'Sale Price'}
                </div>
              </div>
              <div className="flex gap-2">
                {property.pets_allowed && (
                  <Badge className="bg-amber-500 text-white">🐾 Pets Allowed</Badge>
                )}
                <Badge className="bg-emerald-600 text-white">
                  {property.purpose === 'for-rent' ? 'For Rent' : 'For Sale'}
                </Badge>
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
                  <div className="relative h-96 mb-4 border border-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={property.images?.[0] || "/placeholder.svg"}
                      alt={englishTitle || property.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 flex gap-3">
                      <div className="bg-emerald-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider">
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
                    {(property.images?.slice(0, 6) || [0,1,2,3,4,5]).map((img: any, i: number) => (
                      <div key={i} className="aspect-square border border-gray-100 rounded overflow-hidden">
                        <img
                          src={typeof img === 'string' ? img : "/placeholder.svg"}
                          alt={`Property ${i + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Professional Features Panel */}
                <div className="lg:col-span-1">
                  <Card className="h-full border-gray-100">
                    <CardContent className="p-6 h-full">
                      <h3 className="text-sm font-bold mb-4 text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2">Property Specifications</h3>
                      <div className="space-y-4">
                        {features.map((feature, index) => (
                          <div key={index} className="border border-gray-300 p-3 rounded">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-700 flex items-center justify-center rounded">
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
              <Card className="border-gray-100">
                <CardContent className="p-6">
                  <h3 className="text-sm font-bold mb-4 text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2">Amenities & Features</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {(property.amenities || ['Swimming Pool', 'Fitness Center', 'Secure Parking', '24/7 Security', 'Balcony', 'Air Conditioning']).slice(0, 8).map((amenity: string, index: number) => {
                      const IconComponent = amenityIcons[amenity] || Home;
                      return (
                        <div key={index} className="flex items-center gap-3 border border-gray-200 p-3 rounded">
                          <div className="w-6 h-6 bg-emerald-700 flex items-center justify-center rounded">
                            <IconComponent className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* AI-Generated Description */}
              <Card className="border-gray-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4 border-b border-gray-300 pb-2">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Property Description</h3>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Generated
                    </Badge>
                  </div>
                  {isLoadingAI ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mr-2" />
                      <span className="text-gray-600">Generating AI description...</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                      {aiDescription || property.description}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Professional Location Analysis */}
              <Card className="border-gray-100">
                <CardContent className="p-6">
                  <h3 className="text-sm font-bold mb-4 text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2">Location Intelligence</h3>
                  <p className="text-sm text-gray-700 mb-4 font-medium">
                    {district.description}
                  </p>
                  
                  {/* Professional District Features */}
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {district.highlights.map((highlight: string, index: number) => (
                      <div key={index} className="bg-gray-900 text-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-center rounded">
                        {highlight}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <div className="text-lg font-bold text-emerald-700">{district.avgPrice}</div>
                      <div className="text-xs text-gray-600 uppercase">Avg. Monthly Rent</div>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <div className="text-lg font-bold text-emerald-700">{district.priceGrowth}</div>
                      <div className="text-xs text-gray-600 uppercase">Annual Growth</div>
                    </div>
                  </div>

                  {/* Professional Map */}
                  <div className="h-64 border border-gray-100 rounded-lg overflow-hidden">
                    <MapPlaceholder />
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Price Trends */}
              <EnhancedPriceTrends 
                property={property}
              />

              {/* Property Report */}
              <PropertyReport property={property} />
            </div>

            {/* Professional Sidebar */}
            <div className="space-y-6">
              <PremiumSidebar property={property} />
              
              {/* Professional Agent Contact */}
              <Card className="border-gray-100">
                <CardContent className="p-6">
                  <h3 className="text-sm font-bold mb-4 text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2">Contact Agent</h3>
                  
                  <div className="space-y-3">
                    <Button className="w-full h-12 text-sm bg-emerald-700 hover:bg-emerald-600 text-white font-bold uppercase tracking-wider">
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
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
