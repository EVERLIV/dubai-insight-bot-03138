import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Property {
  id: number;
  title: string;
  price: number | null;
  location_area: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  property_type: string | null;
  purpose: string | null;
  images: string[] | null;
  agent_name?: string | null;
  agent_phone?: string | null;
}

interface PropertyEditDialogProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export const PropertyEditDialog = ({ property, open, onOpenChange, onSaved }: PropertyEditDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    location_area: '',
    property_type: 'Apartment',
    bedrooms: '',
    bathrooms: '',
    area_sqft: '',
    agent_name: '',
    agent_phone: ''
  });

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || '',
        price: property.price?.toString() || '',
        location_area: property.location_area || '',
        property_type: property.property_type || 'Apartment',
        bedrooms: property.bedrooms?.toString() || '',
        bathrooms: property.bathrooms?.toString() || '',
        area_sqft: property.area_sqft?.toString() || '',
        agent_name: property.agent_name || '',
        agent_phone: property.agent_phone || ''
      });
      setImageUrls(property.images?.length ? property.images : ['']);
    }
  }, [property]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addImageUrl = () => setImageUrls(prev => [...prev, '']);
  const updateImageUrl = (index: number, value: string) => {
    setImageUrls(prev => prev.map((url, i) => i === index ? value : url));
  };
  const removeImageUrl = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property || !formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      const images = imageUrls.filter(url => url.trim());
      const { error } = await supabase
        .from('property_listings')
        .update({
          title: formData.title,
          price: formData.price ? parseFloat(formData.price) : null,
          location_area: formData.location_area || null,
          property_type: formData.property_type,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
          area_sqft: formData.area_sqft ? parseInt(formData.area_sqft) : null,
          images: images.length > 0 ? images : null,
          agent_name: formData.agent_name || null,
          agent_phone: formData.agent_phone || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', property.id);

      if (error) throw error;

      toast({ title: "Success!", description: "Property updated successfully" });
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Update error:', error);
      toast({ title: "Error", description: "Failed to update property", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Property #{property?.id}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label>Title *</Label>
              <Input value={formData.title} onChange={(e) => handleChange('title', e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Price (VND/month)</Label>
              <Input type="number" value={formData.price} onChange={(e) => handleChange('price', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={formData.location_area} onChange={(e) => handleChange('location_area', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Property Type</Label>
              <Select value={formData.property_type} onValueChange={(v) => handleChange('property_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Apartment">Apartment</SelectItem>
                  <SelectItem value="Studio">Studio</SelectItem>
                  <SelectItem value="Villa">Villa</SelectItem>
                  <SelectItem value="House">House</SelectItem>
                  <SelectItem value="Room">Room</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Area (m²)</Label>
              <Input type="number" value={formData.area_sqft} onChange={(e) => handleChange('area_sqft', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Bedrooms</Label>
              <Input type="number" value={formData.bedrooms} onChange={(e) => handleChange('bedrooms', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Bathrooms</Label>
              <Input type="number" value={formData.bathrooms} onChange={(e) => handleChange('bathrooms', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Agent Name</Label>
              <Input value={formData.agent_name} onChange={(e) => handleChange('agent_name', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={formData.agent_phone} onChange={(e) => handleChange('agent_phone', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Image URLs</Label>
            <div className="space-y-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input value={url} onChange={(e) => updateImageUrl(index, e.target.value)} placeholder="https://..." />
                  {imageUrls.length > 1 && (
                    <Button type="button" variant="outline" size="icon" onClick={() => removeImageUrl(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addImageUrl}>
                <Plus className="w-4 h-4 mr-1" /> Add Image
              </Button>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
