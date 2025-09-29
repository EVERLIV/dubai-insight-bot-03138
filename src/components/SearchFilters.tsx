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
  { value: "all", label: "Все типы" },
  { value: "for-sale", label: "Продажа" },
  { value: "for-rent", label: "Аренда" }
];

const bedroomOptions = [
  { value: "all", label: "Любое" },
  { value: "0", label: "Студия" },
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
          <Filter className="w-5 h-5 text-primary" />
          <Title level={4} className="m-0 text-foreground">Фильтры поиска</Title>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Space direction="vertical" size="middle" className="w-full">
          {/* Purpose & Housing Status */}
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" size="small" className="w-full">
                <Text strong className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Тип сделки
                </Text>
                <Select
                  value={filters.purpose}
                  onChange={(value) => updateFilter('purpose', value)}
                  placeholder="Выберите тип"
                  size="large"
                  className="w-full"
                  options={purposes}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" size="small" className="w-full">
                <Text strong className="flex items-center gap-2 text-sm">
                  <Home className="w-4 h-4 text-primary" />
                  Рынок
                </Text>
                <Select
                  value={filters.housingStatus}
                  onChange={(value) => updateFilter('housingStatus', value)}
                  placeholder="Выберите рынок"
                  size="large"
                  className="w-full"
                  options={housingStatuses}
                />
              </Space>
            </Col>
          </Row>

          <Divider className="my-4" />

          {/* Location & Property Type */}
          <Row gutter={[12, 12]}>
            <Col xs={24}>
              <Space direction="vertical" size="small" className="w-full">
                <Text strong className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                  Район
                </Text>
                <Select
                  value={filters.location}
                  onChange={(value) => updateFilter('location', value)}
                  placeholder="Выберите район"
                  size="large"
                  className="w-full"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={[
                    { value: "all", label: "Любой район" },
                    ...locations.slice(1).map(loc => ({ value: loc, label: loc }))
                  ]}
                />
              </Space>
            </Col>
            <Col xs={24}>
              <Space direction="vertical" size="small" className="w-full">
                <Text strong className="flex items-center gap-2 text-sm">
                  <Home className="w-4 h-4 text-primary" />
                  Тип недвижимости
                </Text>
                <Select
                  value={filters.propertyType}
                  onChange={(value) => updateFilter('propertyType', value)}
                  placeholder="Выберите тип"
                  size="large"
                  className="w-full"
                  options={[
                    { value: "all", label: "Любой тип" },
                    ...propertyTypes.slice(1).map(type => ({ value: type, label: type }))
                  ]}
                />
              </Space>
            </Col>
          </Row>

          <Divider className="my-4" />

          {/* Bedrooms */}
          <Space direction="vertical" size="small" className="w-full">
            <Text strong className="flex items-center gap-2 text-sm">
              <Bed className="w-4 h-4 text-primary" />
              Количество спален
            </Text>
            <Space wrap className="w-full">
              {bedroomOptions.map((bedroom) => (
                <Tag.CheckableTag
                  key={bedroom.value}
                  checked={filters.bedrooms === bedroom.value}
                  onChange={() => handleBedroomsChange(bedroom.value)}
                  className="px-3 py-1 rounded-full border-2 transition-all duration-200 hover:scale-105"
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

          <Divider className="my-4" />

          {/* Budget Range */}
          <Space direction="vertical" size="small" className="w-full">
            <div className="flex justify-between items-center">
              <Text strong className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-primary" />
                Бюджет
              </Text>
              <Text className="text-primary font-semibold">
                {filters.budget[0].toLocaleString()} AED
              </Text>
            </div>
            <div className="px-2">
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
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>500K AED</span>
                <span>10M+ AED</span>
              </div>
            </div>
          </Space>

          <Divider className="my-4" />

          {/* Action Buttons */}
          <Space className="w-full" size="middle">
            <Button 
              disabled={isLoading}
              onClick={onSearch}
              className="flex-1 h-12 rounded-xl font-medium btn-primary"
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
              disabled={isRefreshing}
              onClick={onRefresh}
              variant="outline"
              className="h-12 px-6 rounded-xl"
            >
              {isRefreshing ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
            </Button>
          </Space>
        </Space>
      </CardContent>
    </Card>
  );
}