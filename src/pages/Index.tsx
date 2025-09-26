import Hero from "@/components/Hero";
import PropertySearch from "@/components/PropertySearch";
import MarketAnalytics from "@/components/MarketAnalytics";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <PropertySearch />
      <MarketAnalytics />
    </div>
  );
};

export default Index;