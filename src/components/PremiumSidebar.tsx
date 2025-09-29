import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crown, TrendingUp, Calculator, FileText, BarChart3, 
  DollarSign, Target, Shield, Star, Download, Sparkles,
  PieChart, LineChart, Users, Building2, MapPin, Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PremiumSidebarProps {
  property: {
    id: string;
    price: number;
    area_sqft?: number;
    location_area?: string;
    property_type?: string;
    bedrooms?: number;
    purpose?: string;
  };
}

interface InvestmentMetrics {
  roi: number;
  cashFlow: number;
  appreciation: number;
  rentYield: number;
  paybackPeriod: number;
  riskScore: number;
}

interface MarketComparison {
  avgPrice: number;
  pricePerSqft: number;
  marketPosition: 'below' | 'market' | 'above';
  similarProperties: number;
  daysOnMarket: number;
}

export default function PremiumSidebar({ property }: PremiumSidebarProps) {
  const [activeTab, setActiveTab] = useState('analysis');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [investmentMetrics, setInvestmentMetrics] = useState<InvestmentMetrics>({
    roi: 8.5,
    cashFlow: 15000,
    appreciation: 12.3,
    rentYield: 7.2,
    paybackPeriod: 12.8,
    riskScore: 3.2
  });

  const [marketComparison, setMarketComparison] = useState<MarketComparison>({
    avgPrice: property.price * 1.05,
    pricePerSqft: property.area_sqft ? Math.round(property.price / property.area_sqft) : 1800,
    marketPosition: 'below',
    similarProperties: 23,
    daysOnMarket: 32
  });

  const generateDetailedReport = async () => {
    setIsGeneratingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke('deepseek-market-analysis', {
        body: {
          type: 'investment_forecast',
          region: property.location_area || 'dubai',
          propertyData: property
        }
      });

      if (error) throw error;

      // Simulate report generation
      setTimeout(() => {
        setIsGeneratingReport(false);
        // In real app, would download or open report
        alert('Premium Property Report Generated! Check your downloads.');
      }, 3000);
    } catch (error) {
      console.error('Error generating report:', error);
      setIsGeneratingReport(false);
    }
  };

  const calculateMortgage = () => {
    // Simulate mortgage calculation
    alert('Premium Mortgage Calculator - Coming Soon!');
  };

  const getRiskColor = (score: number) => {
    if (score <= 2) return 'bg-green-600 text-white';
    if (score <= 3.5) return 'bg-yellow-600 text-white';
    return 'bg-red-600 text-white';
  };

  const getRiskLabel = (score: number) => {
    if (score <= 2) return 'Low Risk';
    if (score <= 3.5) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <div className="space-y-6">
      {/* Professional Premium Badge */}
      <Card className="border-2 border-blue-900 bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-900 flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 uppercase tracking-wider">Executive Analysis</span>
            <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-700 text-center font-medium">
            Institutional-grade market intelligence and investment analytics
          </p>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 border border-gray-300">
          <TabsTrigger value="analysis" className="text-xs font-semibold uppercase tracking-wide">Analysis</TabsTrigger>
          <TabsTrigger value="investment" className="text-xs font-semibold uppercase tracking-wide">Investment</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs font-semibold uppercase tracking-wide">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6 mt-6">
          {/* Professional Market Position */}
          <Card className="border-gray-300">
            <CardHeader className="pb-3 border-b border-gray-300">
              <CardTitle className="text-sm flex items-center gap-3 text-gray-900 font-bold uppercase tracking-wider">
                <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                  <Target className="w-3 h-3 text-white" />
                </div>
                Market Position
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Price vs Market</span>
                <Badge 
                  variant={marketComparison.marketPosition === 'below' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {marketComparison.marketPosition === 'below' ? 'Below Market' : 
                   marketComparison.marketPosition === 'market' ? 'Market Rate' : 'Above Market'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>This Property</span>
                  <span className="font-medium">{property.price.toLocaleString()} AED</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Market Average</span>
                  <span>{marketComparison.avgPrice.toLocaleString()} AED</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Price/sq.ft</span>
                  <span>{marketComparison.pricePerSqft} AED</span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between text-xs mb-1">
                  <span>Similar Properties</span>
                  <span className="font-medium">{marketComparison.similarProperties}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Avg. Days on Market</span>
                  <span className="font-medium">{marketComparison.daysOnMarket} days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Valuation */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                AI Valuation Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Conservative</span>
                    <span className="font-medium">{(property.price * 0.95).toLocaleString()} AED</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Market Value</span>
                    <span className="font-medium text-primary">{property.price.toLocaleString()} AED</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Optimistic</span>
                    <span className="font-medium">{(property.price * 1.08).toLocaleString()} AED</span>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Progress value={75} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    75% confidence in current pricing
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investment" className="space-y-4 mt-4">
          {/* Investment Metrics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Investment Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="text-lg font-bold text-primary">{investmentMetrics.roi}%</div>
                  <div className="text-xs text-muted-foreground">ROI</div>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="text-lg font-bold text-green-600">{investmentMetrics.rentYield}%</div>
                  <div className="text-xs text-muted-foreground">Rent Yield</div>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="text-lg font-bold text-blue-600">+{investmentMetrics.appreciation}%</div>
                  <div className="text-xs text-muted-foreground">Appreciation</div>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="text-lg font-bold text-purple-600">{investmentMetrics.paybackPeriod}y</div>
                  <div className="text-xs text-muted-foreground">Payback</div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-muted-foreground">Risk Assessment</span>
                  <Badge className={`text-xs ${getRiskColor(investmentMetrics.riskScore)}`}>
                    {getRiskLabel(investmentMetrics.riskScore)}
                  </Badge>
                </div>
                <Progress value={(5 - investmentMetrics.riskScore) * 20} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Cash Flow Analysis */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Cash Flow Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Monthly Rental Income</span>
                <span className="font-medium text-green-600">+{(investmentMetrics.cashFlow/12).toLocaleString()} AED</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Service Charges</span>
                <span className="font-medium text-red-600">-2,500 AED</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Maintenance</span>
                <span className="font-medium text-red-600">-800 AED</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t">
                <span className="font-medium">Net Cash Flow</span>
                <span className="font-bold text-primary">+{((investmentMetrics.cashFlow/12) - 3300).toLocaleString()} AED</span>
              </div>
            </CardContent>
          </Card>

          {/* Mortgage Calculator */}
          <Card>
            <CardContent className="p-4">
              <Button 
                onClick={calculateMortgage}
                className="w-full" 
                variant="outline"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Advanced Mortgage Calculator
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4 mt-4">
          {/* Detailed Report */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Premium Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Market Analysis & Trends</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Investment Projections</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Risk Assessment</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Comparative Analysis</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Exit Strategy Options</span>
                </div>
              </div>

              <Button 
                onClick={generateDetailedReport}
                disabled={isGeneratingReport}
                className="w-full"
              >
                {isGeneratingReport ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Reports */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                <PieChart className="w-3 h-3 mr-2" />
                Market Comparison
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                <LineChart className="w-3 h-3 mr-2" />
                Price History
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                <Building2 className="w-3 h-3 mr-2" />
                Neighborhood Analysis
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                <Users className="w-3 h-3 mr-2" />
                Demographic Insights
              </Button>
            </CardContent>
          </Card>

          {/* Premium Features */}
          <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardContent className="p-4 text-center">
              <Star className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-xs text-yellow-700 mb-2 font-medium">
                Unlock Premium Features
              </p>
              <ul className="text-xs text-yellow-600 space-y-1 mb-3">
                <li>• Advanced Market Forecasting</li>
                <li>• Investment Portfolio Tracking</li>
                <li>• Custom Alert Systems</li>
                <li>• Professional Valuations</li>
              </ul>
              <Button size="sm" className="w-full bg-yellow-600 hover:bg-yellow-700">
                <Crown className="w-3 h-3 mr-1" />
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}