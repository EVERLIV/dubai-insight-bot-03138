import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Home, 
  RefreshCw,
  Activity,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  created_at: string | null;
}

interface BotStats {
  totalUsers: number;
  totalMessages: number;
  activeToday: number;
  searchesToday: number;
}

const Admin = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [botStatus, setBotStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [botStats, setBotStats] = useState<BotStats>({
    totalUsers: 0,
    totalMessages: 0,
    activeToday: 0,
    searchesToday: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProperties();
    fetchBotStats();
    checkBotStatus();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('property_listings')
        .select('*')
        .eq('purpose', 'for-rent')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBotStats = async () => {
    try {
      // Fetch search history stats
      const { data: searchData, error: searchError } = await supabase
        .from('search_history')
        .select('telegram_user_id, created_at');

      if (!searchError && searchData) {
        const uniqueUsers = new Set(searchData.map(s => s.telegram_user_id)).size;
        const today = new Date().toDateString();
        const todaySearches = searchData.filter(s => 
          s.created_at && new Date(s.created_at).toDateString() === today
        ).length;
        const todayUsers = new Set(
          searchData
            .filter(s => s.created_at && new Date(s.created_at).toDateString() === today)
            .map(s => s.telegram_user_id)
        ).size;

        setBotStats({
          totalUsers: uniqueUsers,
          totalMessages: searchData.length,
          activeToday: todayUsers,
          searchesToday: todaySearches
        });
      }
    } catch (error) {
      console.error('Error fetching bot stats:', error);
    }
  };

  const checkBotStatus = async () => {
    setBotStatus('checking');
    // Simulated check - in production would ping the bot webhook
    setTimeout(() => {
      setBotStatus('offline'); // Bot not yet configured
    }, 1000);
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'Price on request';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
                <p className="text-sm text-muted-foreground">Saigon Properties Bot Management</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Back to Site
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Bot Analytics
            </TabsTrigger>
            <TabsTrigger value="listings" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Rental Listings
            </TabsTrigger>
          </TabsList>

          {/* Bot Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Bot Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Vietnam Bot Status
                </CardTitle>
                <div className="flex items-center gap-2">
                  {botStatus === 'checking' && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Checking...
                    </Badge>
                  )}
                  {botStatus === 'online' && (
                    <Badge className="bg-green-500 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Online
                    </Badge>
                  )}
                  {botStatus === 'offline' && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Not Configured
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {botStatus === 'offline' 
                    ? 'Telegram bot for Vietnam market is not yet configured. Add VIETNAM_BOT_TOKEN secret to activate.'
                    : 'Bot is running and accepting commands.'
                  }
                </p>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-3xl font-bold text-foreground">{botStats.totalUsers}</p>
                    </div>
                    <Users className="w-10 h-10 text-primary opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Searches</p>
                      <p className="text-3xl font-bold text-foreground">{botStats.totalMessages}</p>
                    </div>
                    <MessageSquare className="w-10 h-10 text-primary opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Today</p>
                      <p className="text-3xl font-bold text-foreground">{botStats.activeToday}</p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-primary opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Searches Today</p>
                      <p className="text-3xl font-bold text-foreground">{botStats.searchesToday}</p>
                    </div>
                    <Clock className="w-10 h-10 text-primary opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bot Configuration Info */}
            <Card>
              <CardHeader>
                <CardTitle>Bot Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Required Secrets</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• VIETNAM_BOT_TOKEN - Telegram Bot Token</li>
                      <li>• DEEPSEEK_API_KEY - AI Analysis (configured)</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Webhook Endpoint</h4>
                    <code className="text-xs bg-background p-2 rounded block">
                      /functions/v1/vietnam-bot
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rental Listings Tab */}
          <TabsContent value="listings" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Rental Properties</h2>
              <Button onClick={fetchProperties} variant="outline" className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-muted" />
                    <CardContent className="pt-4 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Home className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Rental Listings</h3>
                  <p className="text-muted-foreground">No rental properties found in database</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((property) => (
                  <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-muted relative">
                      {property.images && property.images[0] ? (
                        <img 
                          src={property.images[0]} 
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <Badge className="absolute top-2 right-2 bg-primary">
                        For Rent
                      </Badge>
                    </div>
                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-foreground line-clamp-2 mb-2">
                        {property.title}
                      </h3>
                      <p className="text-primary font-bold text-lg mb-2">
                        {formatPrice(property.price)}
                      </p>
                      <p className="text-sm text-muted-foreground mb-3">
                        {property.location_area || 'Ho Chi Minh City'}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {property.bedrooms && (
                          <span>{property.bedrooms} bed</span>
                        )}
                        {property.bathrooms && (
                          <span>{property.bathrooms} bath</span>
                        )}
                        {property.area_sqft && (
                          <span>{property.area_sqft} m²</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
