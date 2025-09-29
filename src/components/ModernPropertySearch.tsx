import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SearchFilters from "./SearchFilters";
import PropertyCard from "./PropertyCard";
import PropertyDetailModal from "./PropertyDetailModal";
import { BarChart3, TrendingUp, MapPin, Building2 } from "lucide-react";

export default function ModernPropertySearch() {
  const [filters, setFilters] = useState({
    budget: [1000000],
    propertyType: "all",
    location: "all",
    purpose: "all",
    bedrooms: "all",
    housingStatus: "all"
  });
  
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [sources, setSources] = useState<string[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    setSearchPerformed(false);
    
    try {
      // Prepare search parameters
      const searchLocation = filters.location === "all" ? null : filters.location;
      const searchPropertyType = filters.propertyType === "all" ? null : filters.propertyType;
      const searchPurpose = filters.purpose === "all" ? null : filters.purpose;
      const searchBedrooms = filters.bedrooms === "all" ? null : parseInt(filters.bedrooms);
      const searchHousingStatus = filters.housingStatus === "all" ? null : filters.housingStatus;

      // Search scraped properties
      const { data: scrapedData, error: scrapedError } = await supabase.rpc('search_scraped_properties', {
        search_purpose: searchPurpose,
        min_price_param: filters.budget[0] * 0.8,
        max_price_param: filters.budget[0] * 1.2,
        property_type_param: searchPropertyType,
        location_param: searchLocation,
        min_bedrooms_param: searchBedrooms,
        max_bedrooms_param: null,
        source_type_param: null,
        housing_status_param: searchHousingStatus,
        limit_param: 20
      });

      if (scrapedError) throw scrapedError;

      // Search API properties
      const { data: apiData, error: apiError } = await supabase.rpc('search_properties', {
        search_purpose: searchPurpose,
        min_price_param: filters.budget[0] * 0.8,
        max_price_param: filters.budget[0] * 1.2,
        property_type_param: searchPropertyType,
        location_param: searchLocation,
        min_bedrooms_param: searchBedrooms,
        max_bedrooms_param: null,
        housing_status_param: searchHousingStatus,
        limit_param: 10
      });

      // Combine results
      const scrapedResults = (scrapedData || []).map((item: any) => ({
        ...item,
        source_category: 'scraped'
      }));
      
      const apiResults = (apiData || []).map((item: any) => ({
        ...item,
        source_category: 'api',
        source_name: 'Bayut API',
        source_type: 'api'
      }));

      const allResults = [...scrapedResults, ...apiResults];
      const uniqueSources = [...new Set(allResults.map(r => r.source_name).filter(Boolean))];
      
      setSearchResults(allResults);
      setTotalResults(allResults.length);
      setSources(uniqueSources);
      setSearchPerformed(true);

      toast.success(`Found ${allResults.length} properties from ${uniqueSources.length} sources`);

    } catch (error) {
      console.error('Search error:', error);
      toast.error('Error searching properties');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (property: any) => {
    setSelectedProperty(property);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedProperty(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('property-scraper', {
        body: { action: 'scrape' }
      });

      if (data?.success) {
        toast.success('Data updated successfully!');
        if (searchPerformed) {
          handleSearch();
        }
      } else {
        throw new Error(data?.error || 'Ошибка обновления данных');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Error updating data');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 to-background py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Find Your Perfect
              <span className="block text-primary">Dubai Property</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-6">
              Over 800+ verified properties from trusted sources. 
              Telegram channels, websites, and API integrations.
            </p>
            
            {/* Stats */}
            <div className="flex justify-center items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span>800+ Properties</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Real-time Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Multiple Sources</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Search Filters Sidebar */}
          <div className="lg:col-span-1">
            <SearchFilters
              filters={filters}
              onFiltersChange={setFilters}
              onSearch={handleSearch}
              onRefresh={handleRefresh}
              isLoading={isLoading}
              isRefreshing={isRefreshing}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Results Header */}
            {searchPerformed && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-bold">Search Results</h2>
                    <p className="text-sm text-muted-foreground">
                      Found {totalResults} properties from {sources.length} sources
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sources.slice(0, 3).map((source, index) => (
                      <Badge key={index} variant="outline">
                        {source}
                      </Badge>
                    ))}
                    {sources.length > 3 && (
                      <Badge variant="outline">
                        +{sources.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Properties Grid */}
            {searchPerformed ? (
              searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {searchResults.slice(0, 12).map((property, index) => (
                    <PropertyCard 
                      key={index} 
                      property={property} 
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <div className="text-muted-foreground mb-4">
                    <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Properties Found</h3>
                    <p className="text-sm">No properties match your search criteria.</p>
                  </div>
                  <Button onClick={handleRefresh} disabled={isRefreshing} size="sm">
                    Refresh Data
                  </Button>
                </Card>
              )
            ) : (
              /* Default Featured Properties */
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Featured Properties</h2>
                  <Button variant="outline" size="sm" onClick={handleSearch}>
                    View All
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                  {[
                    {
                      title: "Luxury Marina Apartment",
                      price: 2500000,
                      location_area: "Dubai Marina",
                      property_type: "Apartment",
                      bedrooms: 3,
                      bathrooms: 2,
                      area_sqft: 1200,
                      purpose: "for-sale",
                      housing_status: "secondary",
                      source_name: "Premium Properties",
                      source_type: "api",
                      description: "Luxury apartment with stunning marina and bay views. Fully furnished and ready to move in.",
                      amenities: ["Pool", "Gym", "Parking", "Concierge", "Marina View"],
                      completion_status: "ready",
                      is_furnished: true
                    },
                    {
                      title: "Downtown Penthouse",
                      price: 8900000,
                      location_area: "Downtown Dubai",
                      property_type: "Penthouse",
                      bedrooms: 4,
                      bathrooms: 3,
                      area_sqft: 2500,
                      purpose: "for-sale",
                      housing_status: "primary",
                      source_name: "Elite Realty",
                      source_type: "website",
                      description: "Exclusive penthouse in the heart of Dubai with panoramic Burj Khalifa views.",
                      amenities: ["Private Terrace", "Elevator", "Smart Home", "Parking", "24/7 Security"],
                      completion_status: "under-construction",
                      is_furnished: false
                    },
                    {
                      title: "Business Bay Studio",
                      price: 45000,
                      location_area: "Business Bay",
                      property_type: "Studio",
                      bedrooms: 0,
                      bathrooms: 1,
                      area_sqft: 450,
                      purpose: "for-rent",
                      housing_status: "secondary",
                      source_name: "Rent Dubai",
                      source_type: "telegram",
                      description: "Modern studio in new complex with excellent transportation access.",
                      amenities: ["Pool", "Gym", "Balcony", "AC"],
                      completion_status: "ready",
                      is_furnished: true
                    }
                  ].map((property, index) => (
                    <PropertyCard 
                      key={index} 
                      property={property} 
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>

                {/* Market Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-4 text-center">
                      <BarChart3 className="w-6 h-6 text-primary mx-auto mb-2" />
                      <div className="text-xl font-bold mb-1">800+</div>
                      <div className="text-xs text-muted-foreground">Active Properties</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                      <div className="text-xl font-bold mb-1">+12%</div>
                      <div className="text-xs text-muted-foreground">Price Growth</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <MapPin className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                      <div className="text-xl font-bold mb-1">25+</div>
                      <div className="text-xs text-muted-foreground">City Areas</div>
                    </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Property Detail Modal */}
      <PropertyDetailModal
        property={selectedProperty}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
      />
    </div>
  );
}