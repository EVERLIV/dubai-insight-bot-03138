import { Modal, Row, Col, Space, Typography, Divider, Tag, Button, Image, Carousel } from "antd";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, Share2, MapPin, Home, Maximize2, Bath, Car, 
  MessageCircle, Globe, Zap, Phone, User, Calendar,
  DollarSign, Building, Bed, Car as ParkingIcon
} from "lucide-react";
import { useState } from "react";

const { Title, Text, Paragraph } = Typography;

interface PropertyDetailModalProps {
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
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PropertyDetailModal({ property, isOpen, onClose }: PropertyDetailModalProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!property) return null;

  const getSourceIcon = () => {
    switch (property.source_type) {
      case 'telegram':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'website':
        return <Globe className="w-4 h-4 text-green-500" />;
      case 'api':
        return <Zap className="w-4 h-4 text-primary" />;
      default:
        return null;
    }
  };

  const getPurposeBadge = () => {
    if (property.purpose === 'for-sale') return { text: 'For Sale', color: 'green' };
    if (property.purpose === 'for-rent') return { text: 'For Rent', color: 'blue' };
    return { text: property.purpose || 'Not specified', color: 'default' };
  };

  const getHousingStatusBadge = () => {
    if (property.housing_status === 'primary') return { text: 'Off-plan', color: 'orange' };
    if (property.housing_status === 'secondary') return { text: 'Ready', color: 'purple' };
    return null;
  };

  const purposeBadge = getPurposeBadge();
  const housingBadge = getHousingStatusBadge();

  const defaultImages = ['/placeholder.svg'];
  const displayImages = property.images && property.images.length > 0 ? property.images : defaultImages;

  return (
    <Modal
      title={null}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width="90%"
      style={{ maxWidth: 1200, padding: 0 }}
      className="property-detail-modal"
      destroyOnClose
    >
      <div className="relative">
        {/* Header with Images */}
        <div className="relative h-96 mb-6">
          <Carousel
            autoplay
            dots={{ className: "custom-dots" }}
            className="h-full rounded-t-xl overflow-hidden"
          >
            {displayImages.map((image, index) => (
              <div key={index} className="relative h-96">
                <Image
                  src={image}
                  alt={`${property.title} - ${index + 1}`}
                  className="w-full h-96 object-cover"
                  fallback="/placeholder.svg"
                  preview={false}
                />
              </div>
            ))}
          </Carousel>
          
          {/* Overlay Controls */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <Button
              shape="circle"
              icon={<Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />}
              className="bg-white/90 backdrop-blur-sm border-0 shadow-soft"
              onClick={() => setIsFavorite(!isFavorite)}
            />
            <Button
              shape="circle"
              icon={<Share2 className="w-4 h-4 text-gray-600" />}
              className="bg-white/90 backdrop-blur-sm border-0 shadow-soft"
            />
          </div>

          {/* Status Badges */}
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            <Tag color={purposeBadge.color} className="font-medium">
              {purposeBadge.text}
            </Tag>
            {housingBadge && (
              <Tag color={housingBadge.color} className="font-medium">
                {housingBadge.text}
              </Tag>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <Row gutter={[24, 24]}>
            {/* Main Content */}
            <Col xs={24} lg={16}>
              <Space direction="vertical" size="large" className="w-full">
                {/* Title and Price */}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <Title level={2} className="m-0 flex-1 pr-4">
                      {property.title}
                    </Title>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <Title level={1} className="text-primary m-0">
                      {property.price ? `${property.price.toLocaleString()} AED` : 'Price on request'}
                    </Title>
                    {property.purpose === 'for-rent' && (
                      <Text type="secondary">/year</Text>
                    )}
                  </div>

                  {property.location_area && (
                    <div className="flex items-center text-muted-foreground mb-4">
                      <MapPin className="w-4 h-4 mr-2" />
                      <Text>{property.location_area}, Dubai</Text>
                    </div>
                  )}
                </div>

                <Divider />

                {/* Property Details */}
                <div>
                  <Title level={4}>Features</Title>
                  <Row gutter={[16, 16]}>
                    {property.property_type && (
                      <Col xs={12} sm={8}>
                        <Card className="text-center property-card h-full">
                          <CardContent className="p-4">
                            <Home className="w-6 h-6 text-primary mx-auto mb-2" />
                            <Text strong>{property.property_type}</Text>
                            <br />
                            <Text type="secondary" className="text-xs">Type</Text>
                          </CardContent>
                        </Card>
                      </Col>
                    )}
                    
                    {property.bedrooms !== undefined && (
                      <Col xs={12} sm={8}>
                        <Card className="text-center property-card h-full">
                          <CardContent className="p-4">
                            <Bed className="w-6 h-6 text-primary mx-auto mb-2" />
                            <Text strong>{property.bedrooms || 'Studio'}</Text>
                            <br />
                            <Text type="secondary" className="text-xs">Bedrooms</Text>
                          </CardContent>
                        </Card>
                      </Col>
                    )}
                    
                    {property.bathrooms && (
                      <Col xs={12} sm={8}>
                        <Card className="text-center property-card h-full">
                          <CardContent className="p-4">
                            <Bath className="w-6 h-6 text-primary mx-auto mb-2" />
                            <Text strong>{property.bathrooms}</Text>
                            <br />
                            <Text type="secondary" className="text-xs">Bathrooms</Text>
                          </CardContent>
                        </Card>
                      </Col>
                    )}
                    
                    {property.area_sqft && (
                      <Col xs={12} sm={8}>
                        <Card className="text-center property-card h-full">
                          <CardContent className="p-4">
                            <Maximize2 className="w-6 h-6 text-primary mx-auto mb-2" />
                            <Text strong>{property.area_sqft}</Text>
                            <br />
                            <Text type="secondary" className="text-xs">sq.ft</Text>
                          </CardContent>
                        </Card>
                      </Col>
                    )}

                    {property.is_furnished !== undefined && (
                      <Col xs={12} sm={8}>
                        <Card className="text-center property-card h-full">
                          <CardContent className="p-4">
                            <Building className="w-6 h-6 text-primary mx-auto mb-2" />
                            <Text strong>{property.is_furnished ? 'Furnished' : 'Unfurnished'}</Text>
                            <br />
                            <Text type="secondary" className="text-xs">Furniture</Text>
                          </CardContent>
                        </Card>
                      </Col>
                    )}

                    {property.completion_status && (
                      <Col xs={12} sm={8}>
                        <Card className="text-center property-card h-full">
                          <CardContent className="p-4">
                            <Calendar className="w-6 h-6 text-primary mx-auto mb-2" />
                            <Text strong>
                              {property.completion_status === 'ready' ? 'Ready' : 
                               property.completion_status === 'under-construction' ? 'Under Construction' : 
                               property.completion_status}
                            </Text>
                            <br />
                            <Text type="secondary" className="text-xs">Status</Text>
                          </CardContent>
                        </Card>
                      </Col>
                    )}
                  </Row>
                </div>

                {/* Description */}
                {property.description && (
                  <>
                    <Divider />
                    <div>
                      <Title level={4}>Description</Title>
                      <Paragraph>{property.description}</Paragraph>
                    </div>
                  </>
                )}

                {/* Amenities */}
                {property.amenities && property.amenities.length > 0 && (
                  <>
                    <Divider />
                    <div>
                      <Title level={4}>Amenities</Title>
                      <Space wrap>
                        {property.amenities.map((amenity, index) => (
                          <Tag key={index} className="px-3 py-1 rounded-full">
                            {amenity}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  </>
                )}
              </Space>
            </Col>

            {/* Sidebar */}
            <Col xs={24} lg={8}>
              <Space direction="vertical" size="middle" className="w-full">
                {/* Agent Card */}
                <Card className="shadow-medium">
                  <CardContent className="p-6">
                    <Title level={4} className="mb-4">DUBAI Invest Agent</Title>
                    
                    <Space className="w-full" direction="vertical" size="small">
                      <Button 
                        htmlType="button"
                        size="large" 
                        className="w-full rounded-xl"
                        style={{ 
                          backgroundColor: 'hsl(var(--primary))',
                          borderColor: 'hsl(var(--primary))',
                          color: 'white'
                        }}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call Now
                      </Button>
                      <Button 
                        htmlType="button"
                        size="large" 
                        className="w-full rounded-xl border-primary text-primary"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </Space>
                  </CardContent>
                </Card>

                {/* Property Info */}
                <Card className="shadow-medium">
                  <CardContent className="p-6">
                    <Title level={4} className="mb-4">Property Info</Title>
                    
                    <Space direction="vertical" size="small" className="w-full">
                      <div className="flex justify-between">
                        <Text type="secondary">Property ID:</Text>
                        <Text strong>{property.id || 'Not specified'}</Text>
                      </div>
                      
                      {property.scraped_at && (
                        <div className="flex justify-between">
                          <Text type="secondary">Updated:</Text>
                          <Text strong>
                            {new Date(property.scraped_at).toLocaleDateString('en-US')}
                          </Text>
                        </div>
                      )}
                    </Space>
                  </CardContent>
                </Card>

                {/* Calculate Mortgage */}
                {property.purpose === 'for-sale' && (
                  <Card className="shadow-medium">
                    <CardContent className="p-6">
                      <Title level={4} className="mb-4">Mortgage Calculator</Title>
                      <Text type="secondary" className="block mb-4">
                        Calculate monthly payment
                      </Text>
                      <Button 
                        htmlType="button"
                        size="large" 
                        className="w-full rounded-xl border-primary text-primary"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Calculate Mortgage
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </Space>
            </Col>
          </Row>
        </div>
      </div>
    </Modal>
  );
}