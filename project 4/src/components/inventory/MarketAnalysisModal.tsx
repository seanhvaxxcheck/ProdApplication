import React from 'react';
import { X, TrendingUp, ExternalLink, Calendar, DollarSign, Target } from 'lucide-react';
import { format } from 'date-fns';
import type { MarketAnalysisData } from '../../hooks/useMarketAnalysis';

interface MarketAnalysisModalProps {
  data: MarketAnalysisData;
  itemName: string;
  onClose: () => void;
  onUpdateValue: (newValue: number) => void;
}

export const MarketAnalysisModal: React.FC<MarketAnalysisModalProps> = ({
  data,
  itemName,
  onClose,
  onUpdateValue,
}) => {
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'very good':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'good':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'fair':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Market Analysis
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {itemName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Market Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Average Price</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    ${data.averagePrice.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Price Range</p>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                    ${data.priceRange.min} - ${data.priceRange.max}
                  </p>
                </div>
                <Target className="h-8 w-8 text-gray-600 dark:text-gray-400" />
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${getConfidenceColor(data.confidence)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Confidence</p>
                  <p className="text-lg font-bold capitalize">
                    {data.confidence}
                  </p>
                </div>
                <div className={`h-3 w-3 rounded-full ${
                  data.confidence === 'high' ? 'bg-green-500' :
                  data.confidence === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
              </div>
            </div>
          </div>

          {/* Update Value Button */}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Most Recent Sale</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Suggested Value Update
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Based on the most recent sold listing, consider updating your item's value
                </p>
              </div>
              <button
                onClick={() => {
                  onUpdateValue(data.averagePrice);
                  onClose();
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                Update to ${data.averagePrice.toFixed(2)}
              </button>
            </div>
          </div>

          {/* Recent Sales */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Sold Listings ({data.recentSales.length})
            </h3>
            <div className="space-y-3">
              {data.recentSales.map((sale, index) => (
                <div
                  key={index}
                  className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  {sale.imageUrl && (
                    <img
                      src={sale.imageUrl}
                      alt={sale.title}
                      className="w-16 h-16 object-cover rounded-lg mr-4"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {sale.title}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(sale.soldDate), 'MMM dd, yyyy')}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getConditionColor(sale.condition)}`}>
                        {sale.condition}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ${sale.price.toFixed(2)}
                    </p>
                    <a
                      href={sale.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
                    >
                      View <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search Terms Used */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Terms Used
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.searchTermsUsed.map((term, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded border border-gray-200 dark:border-gray-500"
                >
                  {term}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};