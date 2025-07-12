"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, LineChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Product } from '@/lib/contracts';
import { formatUnits } from 'viem';
import { marketAnalysis, type MarketAnalysisInput } from '@/ai/flows/market-analysis-flow';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsDashboardProps {
  products: Product[];
}

export function AnalyticsDashboard({ products }: AnalyticsDashboardProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);

  const chartData = products.map(product => ({
    name: product.name,
    stock: Number(product.stock),
  }));

  const handleGenerateAnalysis = async () => {
    setIsLoading(true);
    setAnalysisReport(null);
    try {
        const input: MarketAnalysisInput = {
            products: products.map(p => ({
                name: p.name,
                price: formatUnits(p.price, 18),
                unit: p.unit,
                stock: p.stock.toString(),
            }))
        };
        const result = await marketAnalysis(input);
        setAnalysisReport(result.report);
    } catch (error) {
        console.error("Failed to generate analysis:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to generate market analysis. Please try again."
        });
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <div className="grid gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Product Stock Levels</CardTitle>
          <CardDescription>A summary of your current inventory.</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="stock" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center">You have no products to analyze.</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <div className="flex items-center gap-4">
                <LineChart className="w-8 h-8 text-primary" />
                <div>
                    <CardTitle>AI Market Analysis</CardTitle>
                    <CardDescription>Get AI-powered insights and recommendations based on your product listings.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerateAnalysis} disabled={isLoading || products.length === 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Generating Report...' : 'Generate Market Analysis'}
          </Button>
          
          {analysisReport && (
            <div className="mt-6 p-4 border rounded-lg bg-muted/50 prose prose-sm max-w-none">
              <h3 className="text-lg font-semibold">Market Analysis Report</h3>
              <div dangerouslySetInnerHTML={{ __html: analysisReport.replace(/\n/g, '<br />') }} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
