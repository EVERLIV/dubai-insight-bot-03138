import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const HCMC_DISTRICTS = [
  "District 1", "District 2", "District 3", "District 4", "District 5",
  "District 6", "District 7", "District 8", "District 9", "District 10",
  "District 11", "District 12", "Binh Thanh", "Go Vap", "Phu Nhuan",
  "Tan Binh", "Tan Phu", "Thu Duc", "Binh Tan", "Nha Be",
  "Can Gio", "Cu Chi", "Hoc Mon", "Binh Chanh"
];

const RENTAL_PERIODS = [
  { value: "short-term", label: "Краткосрочная (< 6 мес)" },
  { value: "long-term", label: "Долгосрочная (6+ мес)" },
  { value: "both", label: "Любая" }
];

export const ManualPropertyForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    district: '',
    location_area: '',
    property_type: 'Apartment',
    bedrooms: '',
    bathrooms: '',
    area_sqft: '',
    pets_allowed: '',
    rental_period: '',
    agent_name: '',
    agent_phone: ''
  });

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

    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('property_listings')
        .insert({
          title: formData.title,
          price: formData.price ? parseFloat(formData.price) : null,
          district: formData.district || null,
          location_area: null, // Not used - district field is sufficient
          property_type: formData.property_type,
          purpose: 'for-rent',
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
          area_sqft: formData.area_sqft ? parseInt(formData.area_sqft) : null,
          pets_allowed: formData.pets_allowed === 'yes' ? true : formData.pets_allowed === 'no' ? false : null,
          rental_period: formData.rental_period || null,
          images: imageUrls.length > 0 ? imageUrls : null,
          agent_name: formData.agent_name || null,
          agent_phone: formData.agent_phone || null,
          source_name: 'manual',
          source_category: 'manual',
          housing_status: 'secondary'
        })
        .select('id')
        .single();

      if (error) throw error;

      toast({ title: "Success!", description: `Property #${data.id} created successfully` });

      setFormData({
        title: '',
        price: '',
        district: '',
        location_area: '',
        property_type: 'Apartment',
        bedrooms: '',
        bathrooms: '',
        area_sqft: '',
        pets_allowed: '',
        rental_period: '',
        agent_name: '',
        agent_phone: ''
      });
      setImageUrls([]);

    } catch (error) {
      console.error('Submit error:', error);
      toast({ title: "Error", description: "Failed to create property", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Property Manually
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="md:col-span-2 lg:col-span-3 space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Modern 2BR Apartment in District 1"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>District</Label>
              <Select value={formData.district} onValueChange={(v) => handleChange('district', v)}>
                <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                <SelectContent>
                  {HCMC_DISTRICTS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Address field removed - district is sufficient */}

            <div className="space-y-2">
              <Label htmlFor="price">Price (VND/month)</Label>
              <Input
                id="price"
                type="number"
                placeholder="e.g., 15000000"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
              />
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
              <Label>Rental Period</Label>
              <Select value={formData.rental_period} onValueChange={(v) => handleChange('rental_period', v)}>
                <SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger>
                <SelectContent>
                  {RENTAL_PERIODS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pets Allowed</Label>
              <Select value={formData.pets_allowed} onValueChange={(v) => handleChange('pets_allowed', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">🐾 Yes</SelectItem>
                  <SelectItem value="no">🚫 No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
                placeholder="e.g., 2"
                value={formData.bedrooms}
                onChange={(e) => handleChange('bedrooms', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                type="number"
                placeholder="e.g., 1"
                value={formData.bathrooms}
                onChange={(e) => handleChange('bathrooms', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Area (m²)</Label>
              <Input
                id="area"
                type="number"
                placeholder="e.g., 65"
                value={formData.area_sqft}
                onChange={(e) => handleChange('area_sqft', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent_name">Agent Name</Label>
              <Input
                id="agent_name"
                placeholder="Contact person"
                value={formData.agent_name}
                onChange={(e) => handleChange('agent_name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent_phone">Phone</Label>
              <Input
                id="agent_phone"
                placeholder="+84..."
                value={formData.agent_phone}
                onChange={(e) => handleChange('agent_phone', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Property Images</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploadingImages}
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center cursor-pointer py-4"
              >
                {uploadingImages ? (
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground mt-2">
                  {uploadingImages ? 'Uploading...' : 'Click to upload images'}
                </span>
              </label>
            </div>
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img src={url} alt={`Property ${index + 1}`} className="w-full h-20 object-cover rounded" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Property
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};