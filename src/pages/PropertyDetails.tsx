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
    title: "Luxury Marina Apartment with Stunning Views",
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
    description: "Experience luxury living in this stunning 3-bedroom apartment with breathtaking marina views. Features premium finishes, modern appliances, and access to world-class amenities.",
    amenities: ["Swimming Pool", "Gym", "Parking", "24/7 Security", "Marina View", "Balcony", "Air Conditioning", "WiFi"],
    completion_status: "ready",
    is_furnished: true
  };

  const district = districtInfo[property.location_area] || districtInfo['Dubai Marina'];

  // Simple map placeholder
  const MapPlaceholder = () => (
    <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50"></div>
      <div className="relative z-10 text-center">
        <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
        <div className="text-sm font-medium text-gray-700">{property.location_area}</div>
        <div className="text-xs text-gray-500">Dubai, UAE</div>
      </div>
      <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
    </div>
  );

  const features = [
    { icon: Home, label: 'Type', value: property.property_type },
    { icon: Bed, label: 'Beds', value: property.bedrooms || 'Studio' },
    { icon: Bath, label: 'Baths', value: property.bathrooms },
    { icon: Maximize2, label: 'Area', value: `${property.area_sqft} sq.ft` },
    { icon: Car, label: 'Parking', value: '2 Spots' },
    { icon: Calendar, label: 'Built', value: '2022' },
  ];

  const amenityIcons: Record<string, any> = {
    'Swimming Pool': Waves,
    'Gym': Dumbbell,
    'Parking': Car,
    '24/7 Security': Shield,
    'WiFi': Wifi,
    'Air Conditioning': Home,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Back Navigation */}
        <div className="border-b bg-white">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="flex items-center gap-1"
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  Save
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* Property Title & Price - Moved to top */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-muted-foreground">
                <MapPin className="w-4 h-4 mr-1" />
                {property.location_area}, Dubai
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {property.price?.toLocaleString()} AED
                </div>
                {property.purpose === 'for-rent' && (
                  <div className="text-sm text-muted-foreground">/year</div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Photos and Features Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Photo Gallery - Takes 2 columns */}
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-2 gap-2 h-80">
                    <div className="relative">
                      <img
                        src={property.images?.[0] || "/placeholder.svg"}
                        alt={property.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          {property.purpose === 'for-sale' ? 'For Sale' : 'For Rent'}
                        </Badge>
                        {property.housing_status && (
                          <Badge variant="secondary" className="text-xs">
                            {property.housing_status === 'primary' ? 'Off-plan' : 'Ready'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[1,2,3,4].map((i) => (
                        <img
                          key={i}
                          src="/placeholder.svg"
                          alt={`Property ${i}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Features - Takes 1 column beside photos */}
                <div className="lg:col-span-1">
                  <Card className="h-full">
                    <CardContent className="p-4 h-full flex flex-col">
                      <h3 className="text-sm font-semibold mb-3">Key Features</h3>
                      <div className="grid grid-cols-1 gap-3 flex-1">
                        {features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 bg-slate-50 rounded">
                            <feature.icon className="w-5 h-5 text-primary flex-shrink-0" />
                            <div>
                              <div className="text-sm font-medium">{feature.value}</div>
                              <div className="text-xs text-muted-foreground">{feature.label}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Amenities Section */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities?.slice(0, 8).map((amenity: string, index: number) => {
                      const IconComponent = amenityIcons[amenity] || Home;
                      return (
                        <div key={index} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded text-sm">
                          <IconComponent className="w-4 h-4 text-primary" />
                          {amenity}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {property.description}
                  </p>
                </CardContent>
              </Card>

              {/* Location & District Info */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-2">Location & Neighborhood</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {district.description}
                  </p>
                  
                  {/* District Highlights */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {district.highlights.map((highlight: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {highlight}
                      </Badge>
                    ))}
                  </div>

                  {/* Map */}
                  <div className="h-48 rounded-lg overflow-hidden border">
                    <MapPlaceholder />
                  </div>
                </CardContent>
              </Card>

              {/* Price Trends */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Price Trends - {property.location_area}</h3>
                    <div className="text-sm text-green-600 font-medium">
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      {district.priceGrowth} YoY
                    </div>
                  </div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={priceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="month" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10 }}
                          tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Average area price: {district.avgPrice}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Agent Info */}
              {property.agent_name && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-3">Contact Agent</h3>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{property.agent_name}</div>
                        <div className="text-xs text-muted-foreground">Licensed Agent</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Button className="w-full h-8 text-xs">
                        <Phone className="w-3 h-3 mr-1" />
                        Call Now
                      </Button>
                      <Button variant="outline" className="w-full h-8 text-xs">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Market Stats */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-3">Market Overview</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Avg. Price/sq.ft</span>
                      <span className="font-medium">1,780 AED</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Price Growth</span>
                      <span className="font-medium text-green-600">{district.priceGrowth}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Market Activity</span>
                      <span className="font-medium">High</span>
                    </div>
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