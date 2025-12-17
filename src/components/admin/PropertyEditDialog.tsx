import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, X, Upload } from "lucide-react";
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
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
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
      setImageUrls(property.images || []);
    }
  }, [property]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `properties/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }

      setImageUrls(prev => [...prev, ...newUrls]);
      toast({ title: "Uploaded", description: `${newUrls.length} image(s) uploaded` });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Error", description: "Failed to upload images", variant: "destructive" });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property || !formData.title.trim()) return;

    setIsSubmitting(true);
    try {
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
          images: imageUrls.length > 0 ? imageUrls : null,
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
            <Label>Property Images</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-3">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="edit-image-upload"
                disabled={uploadingImages}
              />
              <label
                htmlFor="edit-image-upload"
                className="flex flex-col items-center justify-center cursor-pointer py-2"
              >
                {uploadingImages ? (
                  <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground mt-1">
                  {uploadingImages ? 'Uploading...' : 'Click to upload'}
                </span>
              </label>
            </div>
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img src={url} alt={`Property ${index + 1}`} className="w-full h-16 object-cover rounded" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-0 right-0 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
