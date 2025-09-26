import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Home, Building, Star, RefreshCw, Zap, Globe, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PropertySearch = () => {
  const [budget, setBudget] = useState([1000000]);
  const [propertyType, setPropertyType] = useState("");
  const [location, setLocation] = useState("");
  const [sourceType, setSourceType] = useState("all");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [sources, setSources] = useState<string[]>([]);

  const handleSearch = async () => {
    setIsLoading(true);
    setSearchPerformed(false);
    
    try {
      // Call the property search with scraped data integration
      const { data, error } = await supabase.rpc('search_scraped_properties', {
        search_purpose: null,
        min_price_param: budget[0] * 0.8, // 20% buffer
        max_price_param: budget[0] * 1.2,
        property_type_param: propertyType || null,
        location_param: location || null,
        min_bedrooms_param: null,
        max_bedrooms_param: null,
        source_type_param: sourceType === "all" ? null : sourceType,
        limit_param: 20
      });

      if (error) {
        throw error;
      }

      // Also get regular properties for comparison
      const { data: regularData, error: regularError } = await supabase.rpc('search_properties', {
        search_purpose: null,
        min_price_param: budget[0] * 0.8,
        max_price_param: budget[0] * 1.2,
        property_type_param: propertyType || null,
        location_param: location || null,
        min_bedrooms_param: null,
        max_bedrooms_param: null,
        limit_param: 10
      });

      // Combine results
      const scrapedResults = (data || []).map((item: any) => ({
        ...item,
        source_category: 'scraped'
      }));
      
      const apiResults = (regularData || []).map((item: any) => ({
        ...item,
        source_category: 'api',
        source_name: 'API Database',
        source_type: 'api'
      }));

      const allResults = [...scrapedResults, ...apiResults];
      
      // Get unique sources
      const uniqueSources = [...new Set(allResults.map(r => r.source_name).filter(Boolean))];
      
      setSearchResults(allResults);
      setTotalResults(allResults.length);
      setSources(uniqueSources);
      setSearchPerformed(true);

      toast.success(`Найдено ${allResults.length} объектов из ${uniqueSources.length} источников`);

    } catch (error) {
      console.error('Search error:', error);
      toast.error('Ошибка при поиске недвижимости');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setIsUpdating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('property-scraper', {
        body: { action: 'scrape' }
      });

      if (data?.success) {
        toast.success('Данные успешно обновлены из всех источников!');
        // Refresh search results if search was performed
        if (searchPerformed) {
          handleSearch();
        }
      } else {
        throw new Error(data?.error || 'Ошибка обновления данных');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Ошибка при обновлении данных');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
            Найдите Идеальную
            <span className="block bg-gradient-to-r from-dubai-gold to-dubai-gold-light bg-clip-text text-transparent">
              Недвижимость
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Персонализированный поиск с данными из Telegram каналов, веб-сайтов и API
          </p>
          <div className="flex justify-center items-center mt-4 space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <MessageCircle className="w-4 h-4 text-dubai-gold mr-1" />
              <span>Telegram каналы</span>
            </div>
            <div className="flex items-center">
              <Globe className="w-4 h-4 text-dubai-gold mr-1" />
              <span>Веб-сайты</span>
            </div>
            <div className="flex items-center">
              <Zap className="w-4 h-4 text-dubai-gold mr-1" />
              <span>API источники</span>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <Card className="glass-dark border-dubai-gold/20 mb-16">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl font-display">
              <Filter className="w-6 h-6 text-dubai-gold mr-3" />
              Параметры Поиска
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Location & Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <label className="text-lg font-semibold text-foreground">Район Дубая</label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="bg-dubai-blue-lighter border-dubai-gold/20">
                    <SelectValue placeholder="Выберите район" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Любой район</SelectItem>
                    <SelectItem value="Downtown Dubai">Downtown Dubai</SelectItem>
                    <SelectItem value="Dubai Marina">Dubai Marina</SelectItem>
                    <SelectItem value="JBR">Jumeirah Beach Residence</SelectItem>
                    <SelectItem value="Palm Jumeirah">Palm Jumeirah</SelectItem>
                    <SelectItem value="Business Bay">Business Bay</SelectItem>
                    <SelectItem value="DIFC">DIFC</SelectItem>
                    <SelectItem value="JLT">JLT</SelectItem>
                    <SelectItem value="Dubai Hills">Dubai Hills</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-lg font-semibold text-foreground">Тип недвижимости</label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="bg-dubai-blue-lighter border-dubai-gold/20">
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Любой тип</SelectItem>
                    <SelectItem value="Apartment">Квартира</SelectItem>
                    <SelectItem value="Villa">Вилла</SelectItem>
                    <SelectItem value="Penthouse">Пентхаус</SelectItem>
                    <SelectItem value="Townhouse">Таунхаус</SelectItem>
                    <SelectItem value="Studio">Студия</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-lg font-semibold text-foreground">Источник данных</label>
                <Select value={sourceType} onValueChange={setSourceType}>
                  <SelectTrigger className="bg-dubai-blue-lighter border-dubai-gold/20">
                    <SelectValue placeholder="Выберите источник" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все источники</SelectItem>
                    <SelectItem value="telegram">Telegram каналы</SelectItem>
                    <SelectItem value="website">Веб-сайты</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Budget Range */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-lg font-semibold text-foreground">Бюджет (AED)</label>
                <div className="text-xl font-bold text-dubai-gold">
                  {budget[0].toLocaleString()} AED
                </div>
              </div>
              <Slider
                value={budget}
                onValueChange={setBudget}
                max={10000000}
                min={500000}
                step={100000}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>500,000 AED</span>
                <span>10,000,000+ AED</span>
              </div>
            </div>

            {/* Search Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="flex-1 gradient-gold hover:shadow-gold transition-all duration-300 hover:scale-[1.02] py-6 text-lg font-semibold"
                onClick={handleSearch}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-6 h-6 mr-2 animate-spin" />
                    Поиск...
                  </>
                ) : (
                  <>
                    <Search className="w-6 h-6 mr-2" />
                    Найти Недвижимость
                  </>
                )}
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="border-dubai-gold text-dubai-gold hover:bg-dubai-gold hover:text-background py-6 px-8"
                onClick={handleRefreshData}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Обновление...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Обновить данные
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchPerformed && (
          <div className="mb-16">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-3xl font-display font-bold text-foreground">
                  Результаты поиска
                </h3>
                <p className="text-muted-foreground mt-2">
                  Найдено {totalResults} объектов из {sources.length} источников
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {sources.slice(0, 4).map((source, index) => (
                  <Badge key={index} variant="outline" className="border-dubai-gold text-dubai-gold">
                    {source}
                  </Badge>
                ))}
                {sources.length > 4 && (
                  <Badge variant="outline" className="border-dubai-gold text-dubai-gold">
                    +{sources.length - 4} еще
                  </Badge>
                )}
              </div>
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {searchResults.slice(0, 12).map((property, index) => (
                  <Card key={index} className="gradient-card border-dubai-gold/20 hover:shadow-elegant transition-all duration-500 hover:scale-105 group">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-xl font-display text-foreground group-hover:text-dubai-gold transition-colors line-clamp-2">
                          {property.title || 'Объект недвижимости'}
                        </CardTitle>
                        <div className="flex items-center space-x-1">
                          {property.source_type === 'telegram' && (
                            <MessageCircle className="w-4 h-4 text-blue-400" />
                          )}
                          {property.source_type === 'website' && (
                            <Globe className="w-4 h-4 text-green-400" />
                          )}
                          {property.source_type === 'api' && (
                            <Zap className="w-4 h-4 text-dubai-gold" />
                          )}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-dubai-gold">
                        {property.price ? `${property.price.toLocaleString()} AED` : 'Цена по запросу'}
                      </div>
                      <Badge variant="outline" className="text-xs w-fit">
                        {property.source_name || 'Неизвестный источник'}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {property.property_type && (
                          <div className="flex items-center text-muted-foreground">
                            <Home className="w-4 h-4 mr-2" />
                            {property.property_type}
                            {property.bedrooms && ` • ${property.bedrooms} спален`}
                          </div>
                        )}
                        {property.location_area && (
                          <div className="flex items-center text-muted-foreground">
                            <Building className="w-4 h-4 mr-2" />
                            {property.location_area}
                          </div>
                        )}
                        {property.area_sqft && (
                          <div className="text-sm text-muted-foreground">
                            📐 {property.area_sqft} кв.фт
                          </div>
                        )}
                        {property.agent_phone && (
                          <div className="text-sm text-muted-foreground">
                            📞 {property.agent_phone}
                          </div>
                        )}
                        {property.scraped_at && (
                          <div className="text-xs text-muted-foreground/60">
                            Обновлено: {new Date(property.scraped_at).toLocaleDateString('ru-RU')}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="glass-dark border-dubai-gold/20 p-12 text-center">
                <h3 className="text-2xl font-display font-bold text-foreground mb-4">
                  Ничего не найдено
                </h3>
                <p className="text-muted-foreground mb-6">
                  По вашим критериям поиска не найдено подходящих объектов.
                </p>
                <Button onClick={handleRefreshData} disabled={isUpdating}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Обновить данные из источников
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Featured Properties - показываем только если поиск не выполнялся */}
        {!searchPerformed && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "Luxury Marina Apartment",
              price: "2,500,000 AED",
              location: "Dubai Marina",
              type: "3 BR Apartment",
              rating: 4.9,
              roi: "+12%"
            },
            {
              title: "Downtown Penthouse",
              price: "8,900,000 AED", 
              location: "Downtown Dubai",
              type: "4 BR Penthouse",
              rating: 4.8,
              roi: "+15%"
            },
            {
              title: "Palm Villa Paradise",
              price: "15,500,000 AED",
              location: "Palm Jumeirah", 
              type: "5 BR Villa",
              rating: 5.0,
              roi: "+18%"
            }
            ].map((property, index) => (
              <Card key={index} className="gradient-card border-dubai-gold/20 hover:shadow-elegant transition-all duration-500 hover:scale-105 group">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl font-display text-foreground group-hover:text-dubai-gold transition-colors">
                      {property.title}
                    </CardTitle>
                    <div className="flex items-center space-x-1 text-dubai-gold">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-semibold">{property.rating}</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-dubai-gold">{property.price}</div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-muted-foreground">
                      <Home className="w-4 h-4 mr-2" />
                      {property.type}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Building className="w-4 h-4 mr-2" />
                      {property.location}
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm text-muted-foreground">Прогноз ROI</span>
                      <span className="text-lg font-bold text-green-400">{property.roi}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PropertySearch;