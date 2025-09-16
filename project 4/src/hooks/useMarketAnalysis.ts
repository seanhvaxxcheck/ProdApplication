import { useState } from 'react';

export interface eBayItem {
  title: string;
  price: number;
  soldDate: string;
  condition: string;
  url: string;
  imageUrl?: string;
}

export interface MarketAnalysisData {
  averagePrice: number;
  recentSales: eBayItem[];
  priceRange: {
    min: number;
    max: number;
  };
  confidence: 'high' | 'medium' | 'low';
  searchTermsUsed: string[];
}

export const useMarketAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeMarket = async (itemData: {
    item_name: string;
    manufacturer?: string;
    pattern?: string;
    category: string;
    description?: string;
    photoUrl?: string;
  }): Promise<MarketAnalysisData | null> => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/market-analysis`;
      
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          itemName: itemData.item_name,
          manufacturer: itemData.manufacturer,
          pattern: itemData.pattern,
          category: itemData.category,
          description: itemData.description,
          photoUrl: itemData.photoUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze market data');
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    analyzeMarket,
    loading,
    error,
  };
};