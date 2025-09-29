import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ModernPropertySearch from "@/components/ModernPropertySearch";

const Properties = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        <ModernPropertySearch />
      </main>
      <Footer />
    </div>
  );
};

export default Properties;