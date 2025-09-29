import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MapPin, Home, DollarSign, Bed, RefreshCw } from "lucide-react";

interface SearchFiltersProps {
  filters: {
    budget: number[];
    propertyType: string;
    location: string;
    purpose: string;
    bedrooms: string;
    housingStatus: string;
  };
  onFiltersChange: (filters: any) => void;
  onSearch: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  isRefreshing: boolean;
}

const locations = [
  "all", "Downtown Dubai", "Dubai Marina", "JBR", "Palm Jumeirah", 
  "Business Bay", "DIFC", "JLT", "Dubai Hills", "Emirates Hills",
  "Jumeirah", "Al Barsha", "Dubai South", "International City"
];

const propertyTypes = [
  "all", "Apartment", "Villa", "Penthouse", "Townhouse", "Studio", "Office", "Shop"
];

const purposes = [
  { value: "all", label: "Все типы" },
  { value: "for-sale", label: "Продажа" },
  { value: "for-rent", label: "Аренда" }
];

const bedroomOptions = [
  "all", "0", "1", "2", "3", "4", "5", "6+"
];

const housingStatuses = [
  { value: "all", label: "Все" },
  { value: "primary", label: "Первичное" },
  { value: "secondary", label: "Вторичное" }
];

export default function SearchFilters({
  filters,
  onFiltersChange,
  onSearch,
  onRefresh,
  isLoading,
  isRefreshing
}: SearchFiltersProps) {
  
  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Filter className="w-5 h-5 text-primary" />
          Поиск недвижимости
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Purpose & Housing Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Тип сделки
            </label>
            <Select value={filters.purpose} onValueChange={(value) => updateFilter('purpose', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                {purposes.map((purpose) => (
                  <SelectItem key={purpose.value} value={purpose.value}>
                    {purpose.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Home className="w-4 h-4 text-primary" />
              Рынок
            </label>
            <Select value={filters.housingStatus} onValueChange={(value) => updateFilter('housingStatus', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите рынок" />
              </SelectTrigger>
              <SelectContent>
                {housingStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Location & Property Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Район
            </label>
            <Select value={filters.location} onValueChange={(value) => updateFilter('location', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите район" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Любой район</SelectItem>
                {locations.slice(1).map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Home className="w-4 h-4 text-primary" />
              Тип недвижимости
            </label>
            <Select value={filters.propertyType} onValueChange={(value) => updateFilter('propertyType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Любой тип</SelectItem>
                {propertyTypes.slice(1).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bedrooms */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Bed className="w-4 h-4 text-primary" />
            Количество спален
          </label>
          <div className="flex flex-wrap gap-2">
            {bedroomOptions.map((bedroom) => (
              <Badge
                key={bedroom}
                variant={filters.bedrooms === bedroom ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  filters.bedrooms === bedroom ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
                onClick={() => updateFilter('bedrooms', bedroom)}
              >
                {bedroom === "all" ? "Любое" : bedroom === "6+" ? "6+" : `${bedroom} спален`}
              </Badge>
            ))}
          </div>
        </div>

        {/* Budget Range */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Бюджет (AED)</label>
            <span className="text-lg font-semibold text-primary">
              {filters.budget[0].toLocaleString()} AED
            </span>
          </div>
          <Slider
            value={filters.budget}
            onValueChange={(value) => updateFilter('budget', value)}
            max={10000000}
            min={500000}
            step={100000}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>500,000 AED</span>
            <span>10,000,000+ AED</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            className="flex-1 btn-primary h-12 text-base font-medium"
            onClick={onSearch}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Поиск...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Найти недвижимость
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className="h-12 px-6"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}