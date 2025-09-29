import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SearchFilters from "./SearchFilters";
import PropertyCard from "./PropertyCard";
import PropertyDetailModal from "./PropertyDetailModal";
import { BarChart3, TrendingUp, MapPin, Building2, Database, Clock, Target } from "lucide-react";

export default function ModernPropertySearch() {
  const navigate = useNavigate();
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
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(25);

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
        limit_param: 50
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
        limit_param: 25
      });

      // Combine results - Bayut API first (with images), then scraped properties
      const apiResults = (apiData || []).map((item: any) => ({
        ...item,
        source_category: 'api',
        source_name: 'Bayut API',
        source_type: 'api'
      }));

      const scrapedResults = (scrapedData || []).map((item: any) => ({
        ...item,
        source_category: 'scraped'
      }));
      
      // Show API results first (better quality, with images), then scraped
      const allResults = [...apiResults, ...scrapedResults];
      const uniqueSources = [...new Set(allResults.map(r => r.source_name).filter(Boolean))];
      
      setSearchResults(allResults);
      setTotalResults(allResults.length);
      setSources(uniqueSources);
      setSearchPerformed(true);
      setCurrentPage(1);

      toast.success(`Found ${allResults.length} properties: ${apiResults.length} from Bayut API, ${scrapedResults.length} from other sources`);

    } catch (error) {
      console.error('Search error:', error);
      toast.error('Error searching properties');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (property: any) => {
    navigate(`/property/${property.id || 'sample'}`, { state: { property } });
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
        throw new Error(data?.error || 'Error updating data');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Error updating data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(searchResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentResults = searchResults.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-white">
      {/* Professional Hero Section */}
      <div className="bg-gray-900 text-white py-16 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-12 bg-blue-500"></div>
              <h1 className="text-3xl md:text-4xl font-bold">
                Professional Property Search Platform
              </h1>
            </div>
            <p className="text-lg text-gray-300 mb-6 max-w-3xl">
              Access our comprehensive database of verified properties from institutional sources. 
              Advanced search capabilities with real-time market intelligence for professional investors.
            </p>
            
            {/* Professional Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 border border-white/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">Database Size</span>
                </div>
                <div className="text-xl font-bold">1400+</div>
                <div className="text-xs text-gray-400">Verified Properties</div>
              </div>
              <div className="bg-white/10 border border-white/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">Updates</span>
                </div>
                <div className="text-xl font-bold">Real-time</div>
                <div className="text-xs text-gray-400">Data Synchronization</div>
              </div>
              <div className="bg-white/10 border border-white/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">Sources</span>
                </div>
                <div className="text-xl font-bold">Multiple</div>
                <div className="text-xs text-gray-400">Verified Channels</div>
              </div>
              <div className="bg-white/10 border border-white/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">Coverage</span>
                </div>
                <div className="text-xl font-bold">31+</div>
                <div className="text-xs text-gray-400">Dubai Districts</div>
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
            {/* Professional Search Results Header */}
            {searchPerformed && (
              <div className="mb-8 bg-white border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-1 h-6 bg-blue-900"></div>
                      <h2 className="text-xl font-bold text-gray-900">Search Results</h2>
                    </div>
                    <p className="text-sm text-gray-600">
                      Showing {startIndex + 1}-{Math.min(endIndex, searchResults.length)} of {totalResults} properties from {sources.length} verified sources
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sources.slice(0, 3).map((source, index) => (
                      <div key={index} className="bg-gray-100 border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700">
                        {source}
                      </div>
                    ))}
                    {sources.length > 3 && (
                      <div className="bg-blue-100 border border-blue-300 px-3 py-1 text-xs font-medium text-blue-700">
                        +{sources.length - 3} more sources
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Properties Grid */}
            {searchPerformed ? (
              searchResults.length > 0 ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                    {currentResults.map((property, index) => (
                      <PropertyCard 
                        key={index} 
                        property={property} 
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="border-gray-300 text-gray-900"
                      >
                        Previous
                      </Button>
                      
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className={currentPage === pageNum 
                                ? "bg-blue-900 text-white" 
                                : "border-gray-300 text-gray-900"
                              }
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="border-gray-300 text-gray-900"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 p-12 text-center">
                  <div className="text-gray-600 mb-4">
                    <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Properties Found</h3>
                    <p className="text-sm text-gray-600">No properties match your current search criteria.</p>
                  </div>
                  <Button 
                    onClick={handleRefresh} 
                    disabled={isRefreshing} 
                    className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2"
                  >
                    Refresh Database
                  </Button>
                </div>
              )
            ) : (
              /* Professional Featured Properties */
              <div>
                <div className="flex items-center justify-between mb-6 bg-white border border-gray-200 p-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-1 h-6 bg-blue-900"></div>
                      <h2 className="text-xl font-bold text-gray-900">Featured Investment Opportunities</h2>
                    </div>
                    <p className="text-sm text-gray-600">Premium properties selected by our investment team</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleSearch}
                    className="border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white"
                  >
                    View All Properties
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
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

                {/* Professional Market Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-gray-200 p-6 text-center">
                    <div className="w-8 h-8 bg-blue-900 flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">1400+</div>
                    <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Active Properties</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-6 text-center">
                    <div className="w-8 h-8 bg-green-700 flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">+12%</div>
                    <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Annual Growth</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-6 text-center">
                    <div className="w-8 h-8 bg-blue-900 flex items-center justify-center mx-auto mb-3">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">31+</div>
                    <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Dubai Districts</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}