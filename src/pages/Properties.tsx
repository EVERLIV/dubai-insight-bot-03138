import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import SearchFilters from "@/components/SearchFilters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Search, Filter, MapPin, TrendingUp } from "lucide-react";

const Properties = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [filters, setFilters] = useState({
    budget: [2000000],
    propertyType: searchParams.get('type') || "all",
    location: searchParams.get('location') || "all",
    purpose: searchParams.get('purpose') || "all",
    bedrooms: searchParams.get('bedrooms') || "all",
    housingStatus: "all"
  });
  
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [sources, setSources] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(24);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadAllProperties();
  }, []);

  const loadAllProperties = async () => {
    setIsLoading(true);
    
    try {
      // Load properties from Bayut API first
      const { data: apiData, error: apiError } = await supabase.rpc('search_properties_unified', {
        p_purpose: null,
        p_min_price: null,
        p_max_price: null,
        p_property_type: null,
        p_location: null,
        p_min_bedrooms: null,
        p_max_bedrooms: null,
        p_housing_status: null,
        p_limit: 50
      });

      // Load scraped properties
      const { data: scrapedData, error: scrapedError } = await supabase.rpc('search_scraped_properties', {
        p_purpose: null,
        p_min_price: null,
        p_max_price: null,
        p_property_type: null,
        p_location: null,
        p_min_bedrooms: null,
        p_max_bedrooms: null,
        p_limit: 100
      });

      if (apiError) throw apiError;
      if (scrapedError) throw scrapedError;

      // Prioritize API results (with images) first
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
      
      const allResults = [...apiResults, ...scrapedResults];
      const uniqueSources = [...new Set(allResults.map(r => r.source_name).filter(Boolean))];
      
      setProperties(allResults);
      setTotalResults(allResults.length);
      setSources(uniqueSources);
      setCurrentPage(1);

    } catch (error) {
      console.error('Error loading properties:', error);
      toast.error('Error loading properties');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);
    
    try {
      // Prepare search parameters
      const searchLocation = filters.location === "all" ? null : filters.location;
      const searchPropertyType = filters.propertyType === "all" ? null : filters.propertyType;
      const searchPurpose = filters.purpose === "all" ? null : filters.purpose;
      const searchBedrooms = filters.bedrooms === "all" ? null : parseInt(filters.bedrooms);
      const searchHousingStatus = filters.housingStatus === "all" ? null : filters.housingStatus;

      // Search API properties first
      const { data: apiData, error: apiError } = await supabase.rpc('search_properties_unified', {
        p_purpose: searchPurpose,
        p_min_price: filters.budget[0] * 0.7,
        p_max_price: filters.budget[0] * 1.3,
        p_property_type: searchPropertyType,
        p_location: searchLocation,
        p_min_bedrooms: searchBedrooms,
        p_max_bedrooms: null,
        p_housing_status: searchHousingStatus,
        p_limit: 30
      });

      // Search scraped properties
      const { data: scrapedData, error: scrapedError } = await supabase.rpc('search_scraped_properties', {
        p_purpose: searchPurpose,
        p_min_price: filters.budget[0] * 0.7,
        p_max_price: filters.budget[0] * 1.3,
        p_property_type: searchPropertyType,
        p_location: searchLocation,
        p_min_bedrooms: searchBedrooms,
        p_max_bedrooms: null,
        p_limit: 60
      });

      if (apiError) throw apiError;
      if (scrapedError) throw scrapedError;

      // Combine results - API first
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
      
      const allResults = [...apiResults, ...scrapedResults];
      const uniqueSources = [...new Set(allResults.map(r => r.source_name).filter(Boolean))];
      
      setProperties(allResults);
      setTotalResults(allResults.length);
      setSources(uniqueSources);
      setCurrentPage(1);

      toast.success(`Found ${allResults.length} properties: ${apiResults.length} verified listings, ${scrapedResults.length} from other sources`);

    } catch (error) {
      console.error('Search error:', error);
      toast.error('Error searching properties');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('property-scraper', {
        body: { action: 'scrape' }
      });

      if (data?.success) {
        toast.success('Properties updated successfully!');
        loadAllProperties();
      } else {
        throw new Error(data?.error || 'Error updating properties');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Error updating properties');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewDetails = (property: any) => {
    // Use external_id for real property details, or a generated ID for scraped properties
    const propertyId = property.external_id || property.id || `scraped-${property.id || Math.random().toString(36).substr(2, 9)}`;
    navigate(`/property/${propertyId}`, { state: { property } });
  };

  // Calculate pagination
  const totalPages = Math.ceil(properties.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentResults = properties.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      {/* Professional Hero Section */}
      <div className="bg-gray-900 text-white py-16 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-16 bg-blue-500"></div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Dubai Property Listings
                </h1>
                <p className="text-xl text-gray-300 max-w-3xl">
                  Comprehensive database of verified properties from premium sources. 
                  Advanced search and filtering for investment opportunities across Dubai.
                </p>
              </div>
            </div>
            
            {/* Live Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/10 border border-white/20 p-4 text-center">
                <div className="text-2xl font-bold">{totalResults}</div>
                <div className="text-sm text-gray-300">Total Properties</div>
              </div>
              <div className="bg-white/10 border border-white/20 p-4 text-center">
                <div className="text-2xl font-bold">{sources.length}</div>
                <div className="text-sm text-gray-300">Data Sources</div>
              </div>
              <div className="bg-white/10 border border-white/20 p-4 text-center">
                <div className="text-2xl font-bold">{properties.filter(p => p.source_category === 'api').length}</div>
                <div className="text-sm text-gray-300">Verified Listings</div>
              </div>
              <div className="bg-white/10 border border-white/20 p-4 text-center">
                <div className="text-2xl font-bold">31+</div>
                <div className="text-sm text-gray-300">Dubai Districts</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1">
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
              
              {/* Results Header */}
              <div className="mb-8 bg-white border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-1 h-6 bg-blue-900"></div>
                      <h2 className="text-xl font-bold text-gray-900">Property Listings</h2>
                    </div>
                    <p className="text-sm text-gray-600">
                      Showing {startIndex + 1}-{Math.min(endIndex, properties.length)} of {totalResults} properties
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
                        +{sources.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Properties Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-gray-100 animate-pulse h-96 border border-gray-200"></div>
                  ))}
                </div>
              ) : properties.length > 0 ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                    {currentResults.map((property, index) => (
                      <PropertyCard 
                        key={property.id || index} 
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
                    <p className="text-sm text-gray-600">Try adjusting your search filters or refresh the data.</p>
                  </div>
                  <Button 
                    onClick={handleRefresh} 
                    disabled={isRefreshing} 
                    className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2"
                  >
                    {isRefreshing ? 'Refreshing...' : 'Refresh Properties'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Properties;