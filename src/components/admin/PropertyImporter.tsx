import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Save, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ParsedProperty {
  title: string;
  price: number | null;
  location_area: string | null;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  images: string[];
  agent_name: string | null;
  agent_phone: string | null;
}

export const PropertyImporter = () => {
  const [text, setText] = useState('');
  const [source, setSource] = useState('telegram');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedProperty, setParsedProperty] = useState<ParsedProperty | null>(null);
  const { toast } = useToast();

  const handleParse = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter listing text",
        variant: "destructive"
      });
      return;
    }

    setIsParsing(true);
    setParsedProperty(null);

    try {
      const response = await fetch(
        `https://qnmyostnzwlnauxhsgfw.supabase.co/functions/v1/parse-property`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFubXlvc3RuendsbmF1eGhzZ2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzc2MjIsImV4cCI6MjA3NDc1MzYyMn0.oAKyBS8l5B4pn7oM1R9Au-H7mYAerZzTkz1kdAvHunw`
          },
          body: JSON.stringify({ text, source, save: false })
        }
      );

      const data = await response.json();

      if (data.success && data.property) {
        setParsedProperty(data.property);
        toast({
          title: "Parsed successfully",
          description: "Review the details and save if correct"
        });
      } else {
        throw new Error(data.error || 'Failed to parse');
      }
    } catch (error) {
      console.error('Parse error:', error);
      toast({
        title: "Error",
        description: "Failed to parse listing. Try different text.",
        variant: "destructive"
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    if (!parsedProperty) return;

    setIsSaving(true);

    try {
      const response = await fetch(
        `https://qnmyostnzwlnauxhsgfw.supabase.co/functions/v1/parse-property`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFubXlvc3RuendsbmF1eGhzZ2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzc2MjIsImV4cCI6MjA3NDc1MzYyMn0.oAKyBS8l5B4pn7oM1R9Au-H7mYAerZzTkz1kdAvHunw`
          },
          body: JSON.stringify({ text, source, save: true })
        }
      );

      const data = await response.json();

      if (data.success && data.saved) {
        toast({
          title: "Saved!",
          description: `Property #${data.id} added to listings`
        });
        setText('');
        setParsedProperty(null);
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save property",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('vi-VN').format(price) + ' VND';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Property Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Source</label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="batdongsan">Batdongsan.com.vn</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Listing Text</label>
            <Textarea
              placeholder="Paste the listing text here... Include title, price, location, bedrooms, area, and any image URLs"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              className="resize-none font-mono text-sm"
            />
          </div>

          <Button 
            onClick={handleParse} 
            disabled={isParsing || !text.trim()}
            className="w-full"
          >
            {isParsing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Parsing with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Parse with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {parsedProperty && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Parsed Result</span>
              <Badge variant="outline" className="bg-primary/10">
                <Check className="w-3 h-3 mr-1" />
                Ready to Save
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Title:</span>
                <p className="font-medium">{parsedProperty.title}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Price:</span>
                <p className="font-medium text-primary">{formatPrice(parsedProperty.price)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Location:</span>
                <p className="font-medium">{parsedProperty.location_area || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="font-medium">{parsedProperty.property_type || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Bedrooms:</span>
                <p className="font-medium">{parsedProperty.bedrooms || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Bathrooms:</span>
                <p className="font-medium">{parsedProperty.bathrooms || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Area:</span>
                <p className="font-medium">{parsedProperty.area_sqft ? `${parsedProperty.area_sqft} m²` : 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Contact:</span>
                <p className="font-medium">{parsedProperty.agent_name || parsedProperty.agent_phone || 'N/A'}</p>
              </div>
            </div>

            {parsedProperty.images.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Images ({parsedProperty.images.length}):</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {parsedProperty.images.slice(0, 4).map((url, i) => (
                    <img 
                      key={i} 
                      src={url} 
                      alt={`Image ${i + 1}`}
                      className="w-20 h-20 object-cover rounded border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="w-full"
              variant="default"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save to Database
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};