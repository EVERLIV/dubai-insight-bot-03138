import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, Search, Link as LinkIcon, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const BatdongsanScraper = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [singleUrl, setSingleUrl] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    setIsSearching(true);
    setResults([]);

    try {
      const response = await fetch(
        `https://qnmyostnzwlnauxhsgfw.supabase.co/functions/v1/scrape-batdongsan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFubXlvc3RuendsbmF1eGhzZ2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzc2MjIsImV4cCI6MjA3NDc1MzYyMn0.oAKyBS8l5B4pn7oM1R9Au-H7mYAerZzTkz1kdAvHunw`
          },
          body: JSON.stringify({ action: 'search', query: searchQuery })
        }
      );

      const data = await response.json();

      if (data.success) {
        setResults(data.results || []);
        toast({
          title: "Import Complete",
          description: `Imported ${data.imported} properties from batdongsan.com.vn`
        });
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Error",
        description: "Failed to search batdongsan.com.vn",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSingleScrape = async () => {
    if (!singleUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive"
      });
      return;
    }

    setIsScraping(true);

    try {
      const response = await fetch(
        `https://qnmyostnzwlnauxhsgfw.supabase.co/functions/v1/scrape-batdongsan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFubXlvc3RuendsbmF1eGhzZ2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzc2MjIsImV4cCI6MjA3NDc1MzYyMn0.oAKyBS8l5B4pn7oM1R9Au-H7mYAerZzTkz1kdAvHunw`
          },
          body: JSON.stringify({ action: 'single', url: singleUrl })
        }
      );

      const data = await response.json();

      if (data.success && data.saved) {
        toast({
          title: "Success!",
          description: `Property #${data.id} imported: ${data.property?.title?.slice(0, 50)}...`
        });
        setSingleUrl('');
      } else if (data.success && !data.saved) {
        toast({
          title: "Already exists",
          description: "This property is already in the database"
        });
      } else {
        throw new Error(data.error || 'Scrape failed');
      }
    } catch (error) {
      console.error('Scrape error:', error);
      toast({
        title: "Error",
        description: "Failed to scrape URL. Check if it's a valid batdongsan listing.",
        variant: "destructive"
      });
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Batdongsan.com.vn Scraper
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bulk Search */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Search className="w-4 h-4" />
              Bulk Import
            </h4>
            <p className="text-sm text-muted-foreground">
              Search and import multiple listings from batdongsan.com.vn
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Search query (optional, e.g., 'Quận 1', 'Thảo Điền')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search & Import
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            {/* Single URL */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Single URL Import
              </h4>
              <p className="text-sm text-muted-foreground">
                Paste a specific batdongsan.com.vn listing URL
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="https://batdongsan.com.vn/cho-thue-can-ho-..."
                  value={singleUrl}
                  onChange={(e) => setSingleUrl(e.target.value)}
                />
                <Button onClick={handleSingleScrape} disabled={isScraping}>
                  {isScraping ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      Scrape
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Imported Properties</h4>
              <div className="space-y-2">
                {results.map((result, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Badge variant="outline" className="bg-green-500/10">
                      <Check className="w-3 h-3 mr-1" />
                      #{result.id}
                    </Badge>
                    <span className="text-sm truncate">{result.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Bulk import searches HCMC rental apartments by default</p>
          <p>• Use Vietnamese keywords for better results: "Quận 2", "Thảo Điền"</p>
          <p>• Single URL works for any batdongsan.com.vn property page</p>
          <p>• Duplicates are automatically skipped</p>
        </CardContent>
      </Card>
    </div>
  );
};