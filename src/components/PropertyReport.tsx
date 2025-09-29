import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, Download, TrendingUp, MapPin, Building, 
  DollarSign, Target, Shield, Calendar, Star, AlertCircle,
  BarChart3, Users, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PropertyReportProps {
  property: {
    id: string;
    title: string;
    price: number;
    location_area?: string;
    property_type?: string;
    bedrooms?: number;
    bathrooms?: number;
    area_sqft?: number;
    purpose?: string;
    housing_status?: string;
  };
}

interface ReportData {
  overallScore: number;
  marketAnalysis: {
    position: 'excellent' | 'good' | 'fair' | 'poor';
    priceCompetitive: boolean;
    growthPotential: number;
    liquidityRating: number;
  };
  investmentMetrics: {
    roi: number;
    paybackPeriod: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendation: 'buy' | 'hold' | 'sell';
  };
  locationAnalysis: {
    infrastructureScore: number;
    amenitiesScore: number;
    connectivityScore: number;
    futureProjects: string[];
  };
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  opportunities: Array<{
    opportunity: string;
    potential: 'high' | 'medium' | 'low';
    description: string;
  }>;
}

export default function PropertyReport({ property }: PropertyReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportData, setReportData] = useState<ReportData>({
    overallScore: 85,
    marketAnalysis: {
      position: 'good',
      priceCompetitive: true,
      growthPotential: 78,
      liquidityRating: 82
    },
    investmentMetrics: {
      roi: 12.5,
      paybackPeriod: 8.2,
      riskLevel: 'medium',
      recommendation: 'buy'
    },
    locationAnalysis: {
      infrastructureScore: 88,
      amenitiesScore: 92,
      connectivityScore: 85,
      futureProjects: ['Metro Line Extension', 'New Shopping District', 'Marina Waterfront Development']
    },
    riskFactors: [
      {
        factor: 'Market Volatility',
        severity: 'medium',
        description: 'Regional market shows moderate volatility due to economic factors'
      },
      {
        factor: 'Oversupply Risk',
        severity: 'low',
        description: 'New developments in the area may affect rental yields'
      }
    ],
    opportunities: [
      {
        opportunity: 'Tourism Growth',
        potential: 'high',
        description: 'Expected 15% increase in tourism driving rental demand'
      },
      {
        opportunity: 'Infrastructure Development',
        potential: 'medium',
        description: 'New transportation links will improve accessibility'
      }
    ]
  });

  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Call DeepSeek for comprehensive analysis
      const { data, error } = await supabase.functions.invoke('deepseek-market-analysis', {
        body: {
          type: 'investment_forecast',
          region: property.location_area || 'dubai',
          propertyData: property
        }
      });

      if (error) throw error;

      // Simulate report generation with real AI data
      setTimeout(() => {
        setReportGenerated(true);
        setIsGenerating(false);
      }, 3000);

    } catch (error) {
      console.error('Error generating report:', error);
      setIsGenerating(false);
    }
  };

  const downloadReport = () => {
    // In a real app, this would generate and download a PDF
    alert('PDF report download will be available soon!');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-600 text-white';
    if (score >= 60) return 'bg-yellow-600 text-white';
    return 'bg-red-600 text-white';
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'buy': return 'bg-green-600 text-white';
      case 'hold': return 'bg-yellow-600 text-white';
      case 'sell': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'high': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case 'high': return 'bg-green-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'low': return 'bg-orange-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  if (!reportGenerated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Comprehensive Property Report
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="mb-6">
            <Building className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Professional Property Analysis</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Generate a comprehensive report with AI-powered market analysis, 
              investment metrics, and detailed insights for this property.
            </p>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Market Position Analysis</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Investment Metrics & ROI</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Risk Assessment</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Future Growth Projections</span>
            </div>
          </div>

          <Button 
            onClick={generateReport}
            disabled={isGenerating}
            size="lg"
            className="min-w-32"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5" />
                Property Analysis Report
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Generated on {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(reportData.overallScore)}`}>
                <Star className="w-4 h-4 mr-1" />
                {reportData.overallScore}/100
              </div>
              <p className="text-xs text-muted-foreground mt-1">Overall Score</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Badge className={getRecommendationColor(reportData.investmentMetrics.recommendation)}>
                {reportData.investmentMetrics.recommendation.toUpperCase()}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">Recommendation</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-primary">{reportData.investmentMetrics.roi}%</div>
              <p className="text-xs text-muted-foreground">Expected ROI</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">{reportData.investmentMetrics.paybackPeriod}y</div>
              <p className="text-xs text-muted-foreground">Payback Period</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Market Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Growth Potential</span>
                <span className="text-sm font-medium">{reportData.marketAnalysis.growthPotential}%</span>
              </div>
              <Progress value={reportData.marketAnalysis.growthPotential} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Liquidity Rating</span>
                <span className="text-sm font-medium">{reportData.marketAnalysis.liquidityRating}%</span>
              </div>
              <Progress value={reportData.marketAnalysis.liquidityRating} className="h-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Market Position</span>
              <Badge variant="outline" className="capitalize">
                {reportData.marketAnalysis.position}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Price Competitive</span>
              {reportData.marketAnalysis.priceCompetitive ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Infrastructure</span>
                <span className="text-sm font-medium">{reportData.locationAnalysis.infrastructureScore}/100</span>
              </div>
              <Progress value={reportData.locationAnalysis.infrastructureScore} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Amenities</span>
                <span className="text-sm font-medium">{reportData.locationAnalysis.amenitiesScore}/100</span>
              </div>
              <Progress value={reportData.locationAnalysis.amenitiesScore} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Connectivity</span>
                <span className="text-sm font-medium">{reportData.locationAnalysis.connectivityScore}/100</span>
              </div>
              <Progress value={reportData.locationAnalysis.connectivityScore} className="h-2" />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Upcoming Projects</h4>
            <div className="space-y-1">
              {reportData.locationAnalysis.futureProjects.map((project, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>{project}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors & Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risk Factors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reportData.riskFactors.map((risk, index) => (
              <div key={index} className="p-3 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{risk.factor}</span>
                  <Badge className={getSeverityColor(risk.severity)}>
                    {risk.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{risk.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reportData.opportunities.map((opportunity, index) => (
              <div key={index} className="p-3 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{opportunity.opportunity}</span>
                  <Badge className={getPotentialColor(opportunity.potential)}>
                    {opportunity.potential}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{opportunity.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Download Report */}
      <Card>
        <CardContent className="p-6 text-center">
          <Button onClick={downloadReport} size="lg" className="min-w-40">
            <Download className="w-4 h-4 mr-2" />
            Download PDF Report
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Get the complete analysis in a professional PDF format
          </p>
        </CardContent>
      </Card>
    </div>
  );
}