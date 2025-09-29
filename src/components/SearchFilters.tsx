import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Filter, MapPin, Home, DollarSign, Bed, RefreshCw } from "lucide-react";
import { Select, Slider, Space, Tag, Divider, Typography, Row, Col, Button as AntButton } from "antd";
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
  { value: "all", label: "Все" },
  { value: "primary", label: "Первичное" },
  { value: "secondary", label: "Вторичное" }
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
    <Card className="shadow-medium border-0 rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b-0">
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Search Properties</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Space direction="vertical" size="middle" className="w-full">
          {/* Purpose & Housing Status */}
          <Row gutter={[8, 8]}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" size={4} className="w-full">
                <Text strong className="flex items-center gap-1 text-xs">
                  <DollarSign className="w-3 h-3 text-primary" />
                  Transaction Type
                </Text>
                <Select
                  value={filters.purpose}
                  onChange={(value) => updateFilter('purpose', value)}
                  placeholder="Select type"
                  size="small"
                  className="w-full"
                  options={[
                    { value: "all", label: "All Types" },
                    { value: "for-sale", label: "Buy" },
                    { value: "for-rent", label: "Rent" }
                  ]}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" size={4} className="w-full">
                <Text strong className="flex items-center gap-1 text-xs">
                  <Home className="w-3 h-3 text-primary" />
                  Market
                </Text>
                <Select
                  value={filters.housingStatus}
                  onChange={(value) => updateFilter('housingStatus', value)}
                  placeholder="Select market"
                  size="small"
                  className="w-full"
                  options={[
                    { value: "all", label: "All" },
                    { value: "primary", label: "Off-plan" },
                    { value: "secondary", label: "Ready" }
                  ]}
                />
              </Space>
            </Col>
          </Row>

          <Divider className="my-2" />

          {/* Location & Property Type */}
          <Row gutter={[8, 8]}>
            <Col xs={24}>
              <Space direction="vertical" size={4} className="w-full">
                <Text strong className="flex items-center gap-1 text-xs">
                  <MapPin className="w-3 h-3 text-primary" />
                  Area
                </Text>
                <Select
                  value={filters.location}
                  onChange={(value) => updateFilter('location', value)}
                  placeholder="Select area"
                  size="small"
                  className="w-full"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={[
                    { value: "all", label: "All Areas" },
                    ...locations.slice(1).map(loc => ({ value: loc, label: loc }))
                  ]}
                />
              </Space>
            </Col>
            <Col xs={24}>
              <Space direction="vertical" size={4} className="w-full">
                <Text strong className="flex items-center gap-1 text-xs">
                  <Home className="w-3 h-3 text-primary" />
                  Property Type
                </Text>
                <Select
                  value={filters.propertyType}
                  onChange={(value) => updateFilter('propertyType', value)}
                  placeholder="Select type"
                  size="small"
                  className="w-full"
                  options={[
                    { value: "all", label: "All Types" },
                    ...propertyTypes.slice(1).map(type => ({ value: type, label: type }))
                  ]}
                />
              </Space>
            </Col>
          </Row>

          <Divider className="my-2" />

          {/* Bedrooms */}
          <Space direction="vertical" size={4} className="w-full">
            <Text strong className="flex items-center gap-1 text-xs">
              <Bed className="w-3 h-3 text-primary" />
              Bedrooms
            </Text>
            <Space wrap className="w-full">
              {[
                { value: "all", label: "Any" },
                { value: "0", label: "Studio" },
                { value: "1", label: "1" },
                { value: "2", label: "2" },
                { value: "3", label: "3" },
                { value: "4", label: "4" },
                { value: "5", label: "5" },
                { value: "6+", label: "6+" }
              ].map((bedroom) => (
                <Tag.CheckableTag
                  key={bedroom.value}
                  checked={filters.bedrooms === bedroom.value}
                  onChange={() => handleBedroomsChange(bedroom.value)}
                  className="px-2 py-0.5 rounded-md border transition-all duration-200 text-xs"
                  style={{
                    backgroundColor: filters.bedrooms === bedroom.value ? 'hsl(var(--primary))' : 'transparent',
                    borderColor: 'hsl(var(--primary))',
                    color: filters.bedrooms === bedroom.value ? 'hsl(var(--primary-foreground))' : 'hsl(var(--primary))'
                  }}
                >
                  {bedroom.label}
                </Tag.CheckableTag>
              ))}
            </Space>
          </Space>

          <Divider className="my-2" />

          {/* Budget Range */}
          <Space direction="vertical" size={4} className="w-full">
            <div className="flex justify-between items-center">
              <Text strong className="flex items-center gap-1 text-xs">
                <DollarSign className="w-3 h-3 text-primary" />
                Budget
              </Text>
              <Text className="text-primary font-semibold text-xs">
                {filters.budget[0].toLocaleString()} AED
              </Text>
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
                trackStyle={{ backgroundColor: 'hsl(var(--primary))' }}
                handleStyle={{ borderColor: 'hsl(var(--primary))' }}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>500K AED</span>
                <span>10M+ AED</span>
              </div>
            </div>
          </Space>

          <Divider className="my-2" />

          {/* Action Buttons */}
          <Space className="w-full" size="small">
            <Button 
              disabled={isLoading}
              onClick={onSearch}
              className="flex-1 h-8 rounded-lg font-medium btn-primary text-sm"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-3 h-3 mr-1" />
                  Search Properties
                </>
              )}
            </Button>
            
            <Button 
              disabled={isRefreshing}
              onClick={onRefresh}
              variant="outline"
              className="h-8 px-3 rounded-lg"
            >
              {isRefreshing ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
            </Button>
          </Space>
        </Space>
      </CardContent>
    </Card>
  );
}