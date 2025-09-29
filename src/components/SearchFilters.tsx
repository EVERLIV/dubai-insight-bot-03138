import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Filter, MapPin, Home, DollarSign, Bed, RefreshCw } from "lucide-react";
import { Select, Slider, Space, Tag, Divider, Typography, Row, Col } from "antd";
import { useState } from "react";

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
  { value: "all", label: "All Types" },
  { value: "for-sale", label: "For Sale" },
  { value: "for-rent", label: "For Rent" }
];

const bedroomOptions = [
  { value: "all", label: "Any" },
  { value: "0", label: "Studio" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6+", label: "6+" }
];

const housingStatuses = [
  { value: "all", label: "All" },
  { value: "primary", label: "Off-plan" },
  { value: "secondary", label: "Ready" }
];

const { Title, Text } = Typography;

export default function SearchFilters({
  filters,
  onFiltersChange,
  onSearch,
  onRefresh,
  isLoading,
  isRefreshing
}: SearchFiltersProps) {
  const [selectedBedrooms, setSelectedBedrooms] = useState<string[]>([filters.bedrooms]);
  
  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleBedroomsChange = (bedroom: string) => {
    updateFilter('bedrooms', bedroom);
    setSelectedBedrooms([bedroom]);
  };

  return (
    <div className="bg-white border border-gray-200">
      {/* Professional Header */}
      <div className="bg-gray-900 text-white p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-blue-500 flex items-center justify-center">
            <Filter className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-sm">Professional Search Filters</h3>
        </div>
        <p className="text-xs text-gray-300 mt-1">Advanced property search criteria</p>
      </div>

      <div className="p-4">
        <Space direction="vertical" size="middle" className="w-full">
          {/* Purpose & Housing Status */}
          <Row gutter={[8, 8]}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" size={4} className="w-full">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-3 h-3 text-blue-900" />
                  <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Transaction Type</span>
                </div>
                <Select
                  value={filters.purpose}
                  onChange={(value) => updateFilter('purpose', value)}
                  placeholder="Select type"
                  size="small"
                  className="w-full"
                  style={{ borderRadius: 0 }}
                  options={[
                    { value: "all", label: "All Types" },
                    { value: "for-sale", label: "Purchase" },
                    { value: "for-rent", label: "Rental" }
                  ]}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" size={4} className="w-full">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-3 h-3 text-blue-900" />
                  <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Market Segment</span>
                </div>
                <Select
                  value={filters.housingStatus}
                  onChange={(value) => updateFilter('housingStatus', value)}
                  placeholder="Select market"
                  size="small"
                  className="w-full"
                  style={{ borderRadius: 0 }}
                  options={housingStatuses}
                />
              </Space>
            </Col>
          </Row>

          <div className="border-t border-gray-200 my-4"></div>

          {/* Location & Property Type */}
          <Row gutter={[8, 8]}>
            <Col xs={24}>
              <Space direction="vertical" size={4} className="w-full">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-3 h-3 text-blue-900" />
                  <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Location</span>
                </div>
                <Select
                  value={filters.location}
                  onChange={(value) => updateFilter('location', value)}
                  placeholder="Select district"
                  size="small"
                  className="w-full"
                  style={{ borderRadius: 0 }}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={[
                    { value: "all", label: "All Districts" },
                    ...locations.slice(1).map(loc => ({ value: loc, label: loc }))
                  ]}
                />
              </Space>
            </Col>
            <Col xs={24}>
              <Space direction="vertical" size={4} className="w-full">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-3 h-3 text-blue-900" />
                  <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Property Type</span>
                </div>
                <Select
                  value={filters.propertyType}
                  onChange={(value) => updateFilter('propertyType', value)}
                  placeholder="Select property type"
                  size="small"
                  className="w-full"
                  style={{ borderRadius: 0 }}
                  options={[
                    { value: "all", label: "All Types" },
                    ...propertyTypes.slice(1).map(type => ({ value: type, label: type }))
                  ]}
                />
              </Space>
            </Col>
          </Row>

          <div className="border-t border-gray-200 my-4"></div>

          {/* Bedrooms */}
          <Space direction="vertical" size={4} className="w-full">
            <div className="flex items-center gap-2 mb-2">
              <Bed className="w-3 h-3 text-blue-900" />
              <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Bedrooms</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {bedroomOptions.map((bedroom) => (
                <button
                  key={bedroom.value}
                  onClick={() => handleBedroomsChange(bedroom.value)}
                  className={`px-2 py-1 text-xs font-medium border transition-all ${
                    filters.bedrooms === bedroom.value 
                      ? 'bg-blue-900 text-white border-blue-900' 
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-900'
                  }`}
                >
                  {bedroom.label}
                </button>
              ))}
            </div>
          </Space>

          <div className="border-t border-gray-200 my-4"></div>

          {/* Budget Range */}
          <Space direction="vertical" size={4} className="w-full">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-3 h-3 text-blue-900" />
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Budget Range</span>
              </div>
              <span className="text-xs font-bold text-blue-900">
                {filters.budget[0].toLocaleString()} AED
              </span>
            </div>
            <div className="px-1">
              <Slider
                range={false}
                value={filters.budget[0]}
                onChange={(value) => updateFilter('budget', [value])}
                max={10000000}
                min={500000}
                step={100000}
                tooltip={{
                  formatter: (value) => `${value?.toLocaleString()} AED`
                }}
                trackStyle={{ backgroundColor: '#1e40af' }}
                handleStyle={{ borderColor: '#1e40af', backgroundColor: '#1e40af' }}
                railStyle={{ backgroundColor: '#e5e7eb' }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>500K AED</span>
                <span>10M+ AED</span>
              </div>
            </div>
          </Space>

          <div className="border-t border-gray-200 my-4"></div>

          {/* Professional Action Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <Button 
              disabled={isLoading}
              onClick={onSearch}
              className="col-span-3 bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium h-10"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-3 h-3 mr-1" />
                  Execute Search
                </>
              )}
            </Button>
            
            <Button 
              disabled={isRefreshing}
              onClick={onRefresh}
              className="border-gray-300 text-gray-700 hover:border-blue-900 hover:text-blue-900 text-xs h-10"
              variant="outline"
            >
              {isRefreshing ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
            </Button>
          </div>
        </Space>
      </div>
    </div>
  );
}