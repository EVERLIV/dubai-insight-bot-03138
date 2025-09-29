import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Heart, Share2, MapPin, Home, Maximize2, Bath,
  Bed, User, Clock
} from "lucide-react";
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

  const getPurposeBadge = () => {
    if (property.purpose === 'for-sale') return 'For Sale';
    if (property.purpose === 'for-rent') return 'For Rent';
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
        <div className="absolute top-3 left-3 z-10">
          <Badge className={`${getPurposeColor()} font-medium text-xs`}>
            {getPurposeBadge()}
          </Badge>
        </div>

        {/* Housing Status Badge */}
        {property.housing_status && (
          <div className="absolute top-3 right-14 z-10">
            <Badge variant="secondary" className="bg-white/90 text-gray-700 text-xs">
              {property.housing_status === 'primary' ? 'Off-plan' : 'Ready'}
            </Badge>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="w-8 h-8 p-0 bg-white/90 hover:bg-white shadow-soft rounded-full"
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
            className="w-8 h-8 p-0 bg-white/90 hover:bg-white shadow-soft rounded-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Share2 className="w-4 h-4 text-gray-600" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Price */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-2xl font-bold text-primary">
            {property.price ? `${property.price.toLocaleString()} AED` : 'Price on request'}
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

        {/* Property Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {property.property_type && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                <Home className="w-3 h-3 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Type</span>
                <span className="text-sm font-medium">{property.property_type}</span>
              </div>
            </div>
          )}
          
          {property.bedrooms !== undefined && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                <Bed className="w-3 h-3 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Bedrooms</span>
                <span className="text-sm font-medium">{property.bedrooms || 'Studio'}</span>
              </div>
            </div>
          )}
          
          {property.bathrooms && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                <Bath className="w-3 h-3 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Bathrooms</span>
                <span className="text-sm font-medium">{property.bathrooms}</span>
              </div>
            </div>
          )}
          
          {property.area_sqft && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                <Maximize2 className="w-3 h-3 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Area</span>
                <span className="text-sm font-medium">{property.area_sqft} sq.ft</span>
              </div>
            </div>
          )}
        </div>

        {/* Agent Info */}
        {property.agent_name && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg mb-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-3 h-3 text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-blue-900">{property.agent_name}</span>
              <span className="text-xs text-blue-700">Real Estate Agent</span>
            </div>
          </div>
        )}

        {/* Last Updated */}
        {property.scraped_at && (
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg mb-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <Clock className="w-3 h-3 text-green-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-green-600">Last Updated</span>
              <span className="text-sm font-medium text-green-900">
                {new Date(property.scraped_at).toLocaleDateString('en-US')}
              </span>
            </div>
          </div>
        )}

        {/* Contact Button */}
        <Button 
          className="w-full btn-primary h-9 text-sm font-medium"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails?.(property);
          }}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}