-- Create market analysis table
CREATE TABLE public.market_analysis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    analysis_date TIMESTAMP WITH TIME ZONE NOT NULL,
    sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    impact_factors TEXT[] NOT NULL DEFAULT '{}',
    price_prediction TEXT NOT NULL CHECK (price_prediction IN ('increase', 'decrease', 'stable')),
    confidence_score NUMERIC(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    summary TEXT NOT NULL,
    key_events TEXT[] NOT NULL DEFAULT '{}',
    news_articles JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.market_analysis ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to market analysis"
ON public.market_analysis
FOR SELECT
USING (true);

-- Create policy for service role to insert/update
CREATE POLICY "Allow service role to manage market analysis"
ON public.market_analysis
FOR ALL
USING (true);

-- Create index for faster queries
CREATE INDEX idx_market_analysis_date ON public.market_analysis(analysis_date DESC);
CREATE INDEX idx_market_analysis_sentiment ON public.market_analysis(sentiment);

-- Add trigger for updating timestamps
CREATE TRIGGER update_market_analysis_updated_at
    BEFORE UPDATE ON public.market_analysis
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for demo
INSERT INTO public.property_listings (
    external_id, source, title, price, property_type, purpose, 
    bedrooms, bathrooms, area_sqft, location_area, location_city,
    images, agent_name, agent_phone, raw_data
) VALUES 
('DEMO-001', 'demo', 'Luxury 2BR Apartment in Dubai Marina', 1800000, 'Apartment', 'for-sale', 2, 2, 1200, 'Dubai Marina', 'Dubai', '{"https://example.com/image1.jpg"}', 'Ahmed Ali', '+971501234567', '{}'),
('DEMO-002', 'demo', 'Spacious 3BR Villa in Emirates Hills', 4500000, 'Villa', 'for-sale', 3, 4, 3500, 'Emirates Hills', 'Dubai', '{"https://example.com/image2.jpg"}', 'Sarah Johnson', '+971507654321', '{}'),
('DEMO-003', 'demo', '1BR Studio for Rent in JVC', 65000, 'Studio', 'for-rent', 1, 1, 650, 'Jumeirah Village Circle', 'Dubai', '{"https://example.com/image3.jpg"}', 'Mohammed Hassan', '+971509876543', '{}'),
('DEMO-004', 'demo', 'Premium Penthouse Downtown Dubai', 8000000, 'Penthouse', 'for-sale', 4, 5, 4200, 'Downtown Dubai', 'Dubai', '{"https://example.com/image4.jpg"}', 'Elena Petrov', '+971502468135', '{}'),
('DEMO-005', 'demo', 'Modern 2BR Apartment in Business Bay', 120000, 'Apartment', 'for-rent', 2, 2, 1100, 'Business Bay', 'Dubai', '{"https://example.com/image5.jpg"}', 'Omar Al-Rashid', '+971508642097', '{}'),
('DEMO-006', 'demo', '4BR Townhouse in Arabian Ranches', 3200000, 'Townhouse', 'for-sale', 4, 3, 2800, 'Arabian Ranches', 'Dubai', '{"https://example.com/image6.jpg"}', 'Lisa Chen', '+971503691472', '{}'),
('DEMO-007', 'demo', 'Beachfront Villa Palm Jumeirah', 12000000, 'Villa', 'for-sale', 5, 6, 6000, 'Palm Jumeirah', 'Dubai', '{"https://example.com/image7.jpg"}', 'David Wilson', '+971504825936', '{}'),
('DEMO-008', 'demo', 'Cozy 1BR Apartment in JBR', 95000, 'Apartment', 'for-rent', 1, 1, 800, 'Jumeirah Beach Residence', 'Dubai', '{"https://example.com/image8.jpg"}', 'Fatima Al-Zahra', '+971506173829', '{}'),
('DEMO-009', 'demo', 'Commercial Office Space DIFC', 2500000, 'Office', 'for-sale', 0, 2, 1500, 'Dubai International Financial Centre', 'Dubai', '{"https://example.com/image9.jpg"}', 'Robert Kim', '+971507395184', '{}'),
('DEMO-010', 'demo', 'Family Villa in Dubai Hills Estate', 5200000, 'Villa', 'for-sale', 4, 5, 4000, 'Dubai Hills Estate', 'Dubai', '{"https://example.com/image10.jpg"}', 'Aisha Mohammed', '+971505829376', '{}');