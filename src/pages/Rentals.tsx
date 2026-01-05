import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { 
  Building2, Search, MapPin, Bed, Bath, Maximize2, Heart, 
  SlidersHorizontal, X, ChevronDown, Home, DollarSign,
  Grid3X3, List, ArrowUpDown, Star, Eye
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";

interface Property {
  id: number;
  title: string;
  price: number;
  location_area: string | null;
  district: string | null;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  images: string[] | null;
  agent_name: string | null;
  agent_phone: string | null;
  created_at: string;
  pets_allowed: boolean | null;
  rental_period: string | null;
}

const districts = [
  "All Districts",
  "District 1",
  "District 2", 
  "District 3",
  "District 4",
  "District 5",
  "District 7",
  "Binh Thanh",
  "Thu Duc",
  "Phu Nhuan",
  "Tan Binh",
  "Go Vap"
];

const propertyTypes = [
  "All Types",
  "Apartment",
  "Villa",
  "House",
  "Studio",
  "Penthouse",
  "Duplex"
];

const bedroomOptions = [
  { value: "all", label: "Any Bedrooms" },
  { value: "0", label: "Studio" },
  { value: "1", label: "1 Bedroom" },
  { value: "2", label: "2 Bedrooms" },
  { value: "3", label: "3 Bedrooms" },
  { value: "4", label: "4+ Bedrooms" },
];

const Rentals = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedBedrooms, setSelectedBedrooms] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 100000000]);
  const [petsAllowed, setPetsAllowed] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [properties, searchQuery, selectedDistrict, selectedType, selectedBedrooms, priceRange, petsAllowed, sortBy]);

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('property_listings')
        .select('*')
        .eq('purpose', 'for-rent')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
      toast.error('Error loading properties');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...properties];

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(query) ||
        p.district?.toLowerCase().includes(query) ||
        p.location_area?.toLowerCase().includes(query)
      );
    }

    // District filter
    if (selectedDistrict !== 'All Districts') {
      filtered = filtered.filter(p => 
        p.district?.toLowerCase().includes(selectedDistrict.toLowerCase())
      );
    }

    // Property type filter
    if (selectedType !== 'All Types') {
      filtered = filtered.filter(p => 
        p.property_type?.toLowerCase() === selectedType.toLowerCase()
      );
    }

    // Bedrooms filter
    if (selectedBedrooms !== 'all') {
      const beds = parseInt(selectedBedrooms);
      if (beds === 4) {
        filtered = filtered.filter(p => (p.bedrooms || 0) >= 4);
      } else {
        filtered = filtered.filter(p => p.bedrooms === beds);
      }
    }

    // Price range filter
    filtered = filtered.filter(p => {
      const price = p.price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Pets filter
    if (petsAllowed) {
      filtered = filtered.filter(p => p.pets_allowed === true);
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-desc':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'area-desc':
        filtered.sort((a, b) => (b.area_sqft || 0) - (a.area_sqft || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    setFilteredProperties(filtered);
  };

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleViewDetails = (property: Property) => {
    navigate(`/property/${property.id}`, { state: { property } });
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M VND`;
    }
    return `${(price / 1000).toFixed(0)}K VND`;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDistrict('All Districts');
    setSelectedType('All Types');
    setSelectedBedrooms('all');
    setPriceRange([0, 100000000]);
    setPetsAllowed(false);
  };

  const activeFiltersCount = [
    selectedDistrict !== 'All Districts',
    selectedType !== 'All Types',
    selectedBedrooms !== 'all',
    priceRange[0] > 0 || priceRange[1] < 100000000,
    petsAllowed
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* Luxury Hero Section */}
      <div className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 text-white py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 px-4 py-2 text-sm font-medium">
              <Star className="w-4 h-4 mr-2 fill-amber-400 text-amber-400" />
              Premium Rentals in Ho Chi Minh City
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
              Discover Your Perfect
              <span className="block text-amber-400">Rental Home</span>
            </h1>
            
            <p className="text-lg md:text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
              Exclusive collection of apartments and villas for rent in the best districts of Ho Chi Minh City. 
              Find your perfect home for comfortable living.
            </p>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                    <Input 
                      type="text"
                      placeholder="Search by name or district..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 h-14 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:bg-white/20"
                    />
                  </div>
                  <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                    <SelectTrigger className="w-full md:w-48 h-14 bg-white/10 border-white/20 text-white rounded-xl">
                      <MapPin className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="District" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      {districts.map((district) => (
                        <SelectItem key={district} value={district}>{district}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => setIsFilterOpen(true)}
                    className="h-14 px-6 bg-amber-500 hover:bg-amber-400 text-emerald-900 font-semibold rounded-xl"
                  >
                    <SlidersHorizontal className="w-5 h-5 mr-2" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge className="ml-2 bg-emerald-900 text-white">{activeFiltersCount}</Badge>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Sheet */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-display text-2xl">Search Filters</SheetTitle>
            <SheetDescription>
              Configure parameters for precise search
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            {/* Property Type */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-3 block">Property Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full">
                  <Home className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-3 block">Bedrooms</label>
              <Select value={selectedBedrooms} onValueChange={setSelectedBedrooms}>
                <SelectTrigger className="w-full">
                  <Bed className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bedroomOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-3 block">
                Rental Price
              </label>
              <div className="px-2">
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={100000000}
                  min={0}
                  step={1000000}
                  className="mb-4"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
              </div>
            </div>

            {/* Pets Allowed */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🐾</span>
                <div>
                  <p className="font-medium">Pets Allowed</p>
                  <p className="text-sm text-muted-foreground">Show only pet-friendly</p>
                </div>
              </div>
              <Button
                variant={petsAllowed ? "default" : "outline"}
                size="sm"
                onClick={() => setPetsAllowed(!petsAllowed)}
              >
                {petsAllowed ? 'Yes' : 'No'}
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={clearFilters}
              >
                <X className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button 
                className="flex-1 bg-primary"
                onClick={() => setIsFilterOpen(false)}
              >
                Show {filteredProperties.length} properties
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          
          {/* Results Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} for rent
              </h2>
              <p className="text-muted-foreground mt-1">
                {selectedDistrict !== 'All Districts' ? selectedDistrict : 'All districts in Ho Chi Minh City'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 bg-background">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="area-desc">Area: Largest First</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex bg-background rounded-lg p-1 border border-border">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="px-3"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="px-3"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedDistrict !== 'All Districts' && (
                <Badge variant="secondary" className="px-3 py-1.5 gap-2">
                  <MapPin className="w-3 h-3" />
                  {selectedDistrict}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedDistrict('All Districts')} />
                </Badge>
              )}
              {selectedType !== 'All Types' && (
                <Badge variant="secondary" className="px-3 py-1.5 gap-2">
                  <Home className="w-3 h-3" />
                  {selectedType}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedType('All Types')} />
                </Badge>
              )}
              {selectedBedrooms !== 'all' && (
                <Badge variant="secondary" className="px-3 py-1.5 gap-2">
                  <Bed className="w-3 h-3" />
                  {bedroomOptions.find(o => o.value === selectedBedrooms)?.label}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedBedrooms('all')} />
                </Badge>
              )}
              {petsAllowed && (
                <Badge variant="secondary" className="px-3 py-1.5 gap-2">
                  🐾 Pet-friendly
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setPetsAllowed(false)} />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                Clear All
              </Button>
            </div>
          )}

          {/* Properties Grid/List */}
          {isLoading ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="h-48 bg-muted" />
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-1/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProperties.length > 0 ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {filteredProperties.map((property) => (
                <Card 
                  key={property.id} 
                  className={`group overflow-hidden hover:shadow-large transition-all duration-300 cursor-pointer border-border ${viewMode === 'list' ? 'flex flex-row' : ''}`}
                  onClick={() => handleViewDetails(property)}
                >
                  {/* Image */}
                  <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-72 shrink-0' : 'aspect-[4/3]'}`}>
                    <img
                      src={property.images?.[0] || '/placeholder.svg'}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className="bg-primary text-primary-foreground font-semibold">
                        For Rent
                      </Badge>
                      {property.pets_allowed && (
                        <Badge className="bg-amber-500 text-white">
                          🐾 Pets OK
                        </Badge>
                      )}
                    </div>

                    {/* Favorite Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 bg-white/80 hover:bg-white rounded-full h-9 w-9"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(property.id);
                      }}
                    >
                      <Heart className={`w-4 h-4 ${favorites.includes(property.id) ? 'fill-red-500 text-red-500' : 'text-foreground'}`} />
                    </Button>

                    {/* Price Overlay */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-2 rounded-lg inline-block">
                        <span className="text-lg font-bold">{formatPrice(property.price || 0)}</span>
                        <span className="text-emerald-100 text-sm">/month</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <CardContent className={`p-4 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-between' : ''}`}>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {property.title}
                      </h3>
                      
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{property.district || property.location_area || 'Ho Chi Minh City'}</span>
                      </div>

                      {/* Features */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {property.bedrooms !== null && (
                          <div className="flex items-center gap-1">
                            <Bed className="w-4 h-4" />
                            <span>{property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bed`}</span>
                          </div>
                        )}
                        {property.bathrooms && (
                          <div className="flex items-center gap-1">
                            <Bath className="w-4 h-4" />
                            <span>{property.bathrooms} bath</span>
                          </div>
                        )}
                        {property.area_sqft && (
                          <div className="flex items-center gap-1">
                            <Maximize2 className="w-4 h-4" />
                            <span>{property.area_sqft} sqm</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {viewMode === 'list' && (
                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                        <Button size="sm" className="gap-2">
                          <Eye className="w-4 h-4" />
                          View Details
                        </Button>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Heart className="w-4 h-4" />
                          Save
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Properties Found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Try adjusting your search parameters or reset filters
              </p>
              <Button onClick={clearFilters} variant="outline">
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Rentals;
