import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Search, Filter, Home, Building, Star } from "lucide-react";

const PropertySearch = () => {
  const [budget, setBudget] = useState([1000000]);
  const [propertyType, setPropertyType] = useState("");
  const [location, setLocation] = useState("");

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
            Найдите Идеальную
            <span className="block bg-gradient-to-r from-dubai-gold to-dubai-gold-light bg-clip-text text-transparent">
              Недвижимость
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Персонализированный поиск с учетом ваших предпочтений и инвестиционных целей
          </p>
        </div>

        {/* Search Form */}
        <Card className="glass-dark border-dubai-gold/20 mb-16">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl font-display">
              <Filter className="w-6 h-6 text-dubai-gold mr-3" />
              Параметры Поиска
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Location & Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-lg font-semibold text-foreground">Район Дубая</label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="bg-dubai-blue-lighter border-dubai-gold/20">
                    <SelectValue placeholder="Выберите район" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="downtown">Downtown Dubai</SelectItem>
                    <SelectItem value="marina">Dubai Marina</SelectItem>
                    <SelectItem value="jbr">Jumeirah Beach Residence</SelectItem>
                    <SelectItem value="palm">Palm Jumeirah</SelectItem>
                    <SelectItem value="business-bay">Business Bay</SelectItem>
                    <SelectItem value="difc">DIFC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-lg font-semibold text-foreground">Тип недвижимости</label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="bg-dubai-blue-lighter border-dubai-gold/20">
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Квартира</SelectItem>
                    <SelectItem value="villa">Вилла</SelectItem>
                    <SelectItem value="penthouse">Пентхаус</SelectItem>
                    <SelectItem value="townhouse">Таунхаус</SelectItem>
                    <SelectItem value="commercial">Коммерческая</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Budget Range */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-lg font-semibold text-foreground">Бюджет (AED)</label>
                <div className="text-xl font-bold text-dubai-gold">
                  {budget[0].toLocaleString()} AED
                </div>
              </div>
              <Slider
                value={budget}
                onValueChange={setBudget}
                max={10000000}
                min={500000}
                step={100000}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>500,000 AED</span>
                <span>10,000,000+ AED</span>
              </div>
            </div>

            {/* Search Button */}
            <Button size="lg" className="w-full gradient-gold hover:shadow-gold transition-all duration-300 hover:scale-[1.02] py-6 text-lg font-semibold">
              <Search className="w-6 h-6 mr-2" />
              Найти Недвижимость
            </Button>
          </CardContent>
        </Card>

        {/* Featured Properties */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "Luxury Marina Apartment",
              price: "2,500,000 AED",
              location: "Dubai Marina",
              type: "3 BR Apartment",
              rating: 4.9,
              roi: "+12%"
            },
            {
              title: "Downtown Penthouse",
              price: "8,900,000 AED", 
              location: "Downtown Dubai",
              type: "4 BR Penthouse",
              rating: 4.8,
              roi: "+15%"
            },
            {
              title: "Palm Villa Paradise",
              price: "15,500,000 AED",
              location: "Palm Jumeirah", 
              type: "5 BR Villa",
              rating: 5.0,
              roi: "+18%"
            }
          ].map((property, index) => (
            <Card key={index} className="gradient-card border-dubai-gold/20 hover:shadow-elegant transition-all duration-500 hover:scale-105 group">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-xl font-display text-foreground group-hover:text-dubai-gold transition-colors">
                    {property.title}
                  </CardTitle>
                  <div className="flex items-center space-x-1 text-dubai-gold">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-semibold">{property.rating}</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-dubai-gold">{property.price}</div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-muted-foreground">
                    <Home className="w-4 h-4 mr-2" />
                    {property.type}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Building className="w-4 h-4 mr-2" />
                    {property.location}
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-muted-foreground">Прогноз ROI</span>
                    <span className="text-lg font-bold text-green-400">{property.roi}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PropertySearch;