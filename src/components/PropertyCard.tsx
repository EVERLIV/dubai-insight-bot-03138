import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Share2, MapPin, Home, Maximize2, Bath, Car, MessageCircle, Globe, Zap } from "lucide-react";
import { useState } from "react";

interface PropertyCardProps {
  property: {
    id?: string;
    title: string;
    price: number;
    location_area?: string;
    property_type?: string;
    bedrooms?: number;
    bathrooms?: number;
    area_sqft?: number;
    images?: string[];
    agent_name?: string;
    agent_phone?: string;
    purpose?: string;
    housing_status?: string;
    source_type?: string;
    source_name?: string;
    scraped_at?: string;
    description?: string;
    amenities?: string[];
    completion_status?: string;
    is_furnished?: boolean;
  };
  onViewDetails?: (property: any) => void;
}

export default function PropertyCard({ property, onViewDetails }: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);

  const defaultImage = "/placeholder.svg";
  const displayImage = property.images?.[0] && !imageError ? property.images[0] : defaultImage;

  const getSourceIcon = () => {
    switch (property.source_type) {
      case 'telegram':
        return <MessageCircle className="w-3 h-3 text-blue-500" />;
      case 'website':
        return <Globe className="w-3 h-3 text-green-500" />;
      case 'api':
        return <Zap className="w-3 h-3 text-primary" />;
      default:
        return null;
    }
  };

  const getPurposeBadge = () => {
    if (property.purpose === 'for-sale') return 'Продажа';
    if (property.purpose === 'for-rent') return 'Аренда';
    return property.purpose;
  };

  const getPurposeColor = () => {
    if (property.purpose === 'for-sale') return 'bg-green-100 text-green-800 border-green-200';
    if (property.purpose === 'for-rent') return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Card 
      className="property-card group cursor-pointer relative overflow-hidden"
      onClick={() => onViewDetails?.(property)}
    >
      {/* Property Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={displayImage}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImageError(true)}
        />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge className={`${getPurposeColor()} font-medium`}>
            {getPurposeBadge()}
          </Badge>
        </div>

        {/* Housing Status Badge */}
        {property.housing_status && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-white/90 text-gray-700">
              {property.housing_status === 'primary' ? 'Первичное' : 'Вторичное'}
            </Badge>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="p-2 bg-white/90 hover:bg-white shadow-soft"
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="p-2 bg-white/90 hover:bg-white shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <Share2 className="w-4 h-4 text-gray-600" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Price */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-2xl font-bold text-primary">
            {property.price ? `${property.price.toLocaleString()} AED` : 'Цена по запросу'}
          </div>
          <div className="flex items-center gap-1">
            {getSourceIcon()}
            <span className="text-xs text-muted-foreground">
              {property.source_name || 'API'}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {property.title}
        </h3>

        {/* Location */}
        {property.location_area && (
          <div className="flex items-center text-muted-foreground mb-3">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="text-sm">{property.location_area}</span>
          </div>
        )}

        {/* Property Details */}
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          {property.property_type && (
            <div className="flex items-center">
              <Home className="w-4 h-4 mr-1" />
              <span>{property.property_type}</span>
            </div>
          )}
          {property.bedrooms && (
            <div className="flex items-center">
              <span className="font-medium">{property.bedrooms}</span>
              <span className="ml-1">спален</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center">
              <Bath className="w-4 h-4 mr-1" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          {property.area_sqft && (
            <div className="flex items-center">
              <Maximize2 className="w-4 h-4 mr-1" />
              <span>{property.area_sqft} кв.фт</span>
            </div>
          )}
        </div>

        {/* Agent Info */}
        {(property.agent_name || property.agent_phone) && (
          <div className="text-xs text-muted-foreground mb-3">
            {property.agent_name && <div>Агент: {property.agent_name}</div>}
            {property.agent_phone && <div>📞 {property.agent_phone}</div>}
          </div>
        )}

        {/* Last Updated */}
        {property.scraped_at && (
          <div className="text-xs text-muted-foreground mb-3">
            Обновлено: {new Date(property.scraped_at).toLocaleDateString('ru-RU')}
          </div>
        )}

        {/* Contact Button */}
        <Button 
          className="w-full btn-primary"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails?.(property);
          }}
        >
          Подробнее
        </Button>
      </CardContent>
    </Card>
  );
}