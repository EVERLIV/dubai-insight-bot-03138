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
    if (property.purpose === 'for-sale') return 'bg-green-700 text-white border-green-700';
    if (property.purpose === 'for-rent') return 'bg-blue-900 text-white border-blue-900';
    return 'bg-gray-700 text-white border-gray-700';
  };

  return (
    <div 
      className="bg-white border border-gray-200 cursor-pointer relative overflow-hidden hover:shadow-lg transition-shadow"
      onClick={() => onViewDetails?.(property)}
    >
      {/* Professional Property Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={displayImage}
          alt={property.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          onError={() => setImageError(true)}
        />
        
        {/* Professional Status Badges */}
        <div className="absolute top-3 left-3 z-10">
          <div className={`${getPurposeColor()} px-3 py-1 text-xs font-semibold uppercase tracking-wide`}>
            {getPurposeBadge()}
          </div>
        </div>

        {/* Housing Status Badge */}
        {property.housing_status && (
          <div className="absolute top-3 right-3 z-10">
            <div className="bg-white/90 text-gray-700 px-3 py-1 text-xs font-semibold border border-gray-300">
              {property.housing_status === 'primary' ? 'OFF-PLAN' : 'READY'}
            </div>
          </div>
        )}

        {/* Professional Action Buttons */}
        <div className="absolute bottom-3 right-3 z-20 opacity-0 hover:opacity-100 transition-opacity duration-200 flex gap-2">
          <button
            className="w-8 h-8 bg-white/90 hover:bg-white border border-gray-300 flex items-center justify-center transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-600 text-red-600' : 'text-gray-600'}`} />
          </button>
          <button
            className="w-8 h-8 bg-white/90 hover:bg-white border border-gray-300 flex items-center justify-center transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Share2 className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Professional Price Display */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-2xl font-bold text-gray-900">
            {property.price ? `${property.price.toLocaleString()} AED` : 'Price on request'}
          </div>
        </div>

        {/* Professional Title */}
        <h3 className="font-bold text-lg mb-2 text-gray-900 leading-tight">
          {property.title}
        </h3>

        {/* Professional Location */}
        {property.location_area && (
          <div className="flex items-center text-gray-600 mb-4">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">{property.location_area}</span>
          </div>
        )}

        {/* Professional Property Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {property.property_type && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200">
              <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                <Home className="w-3 h-3 text-white" />
              </div>
              <div>
                <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Type</div>
                <div className="text-sm font-bold text-gray-900">{property.property_type}</div>
              </div>
            </div>
          )}
          
          {property.bedrooms !== undefined && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200">
              <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                <Bed className="w-3 h-3 text-white" />
              </div>
              <div>
                <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Bedrooms</div>
                <div className="text-sm font-bold text-gray-900">{property.bedrooms || 'Studio'}</div>
              </div>
            </div>
          )}
          
          {property.bathrooms && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200">
              <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                <Bath className="w-3 h-3 text-white" />
              </div>
              <div>
                <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Bathrooms</div>
                <div className="text-sm font-bold text-gray-900">{property.bathrooms}</div>
              </div>
            </div>
          )}
          
          {property.area_sqft && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200">
              <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                <Maximize2 className="w-3 h-3 text-white" />
              </div>
              <div>
                <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Area</div>
                <div className="text-sm font-bold text-gray-900">{property.area_sqft} sq.ft</div>
              </div>
            </div>
          )}
        </div>

        {/* Professional Agent Info */}
        {property.agent_name && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 mb-3">
            <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
              <User className="w-3 h-3 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-blue-900">{property.agent_name}</div>
              <div className="text-xs text-blue-700 font-medium">Licensed Agent</div>
            </div>
          </div>
        )}

        {/* Professional Source Info */}
        {property.source_name && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 mb-4">
            <div className="w-6 h-6 bg-gray-700 flex items-center justify-center">
              <Clock className="w-3 h-3 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Source</div>
              <div className="text-sm font-bold text-gray-900">{property.source_name}</div>
            </div>
          </div>
        )}

        {/* Professional Action Button */}
        <Button 
          className="w-full bg-blue-900 hover:bg-blue-800 text-white h-10 text-sm font-semibold uppercase tracking-wide"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails?.(property);
          }}
        >
          View Property Details
        </Button>
      </div>
    </div>
  );
}