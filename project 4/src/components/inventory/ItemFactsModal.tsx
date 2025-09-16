import React from 'react';
import { X, Calendar, MapPin, Info, DollarSign, Award, Clock, Heart, TrendingUp, Edit, Trash2, RotateCcw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { InventoryItem } from '../../hooks/useInventory';

interface ItemFactsModalProps {
  item: InventoryItem;
  onClose: () => void;
  onItemUpdated?: (updatedItem: InventoryItem) => void;
  viewMode?: 'active' | 'archived';
  hasProOrCollectorAccess?: () => boolean;
  handleToggleFavorite?: (item: InventoryItem) => Promise<any>;
  handleMarketAnalysis?: (item: InventoryItem) => void;
  handleEdit?: (item: InventoryItem, onEditComplete?: () => void) => void;
  handleDelete?: (id: string) => void;
  handleRestoreItem?: (item: InventoryItem) => void;
  analysisLoading?: boolean;
  analyzingItem?: InventoryItem | null;
  onRefresh?: () => void;
}

export const ItemFactsModal: React.FC<ItemFactsModalProps> = ({ 
  item, 
  onClose,
  onItemUpdated,
  viewMode = 'active',
  hasProOrCollectorAccess = () => true,
  handleToggleFavorite,
  handleMarketAnalysis,
  handleEdit,
  handleDelete,
  handleRestoreItem,
  analysisLoading = false,
  analyzingItem = null,
  onRefresh
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [localFavoriteStatus, setLocalFavoriteStatus] = React.useState(item.favorites || 0);

  const handleLocalToggleFavorite = async () => {
    if (!handleToggleFavorite || isProcessing) return;
    
    console.log('handleLocalToggleFavorite called for item:', item.id);
    setIsProcessing(true);
    
    const currentStatus = localFavoriteStatus;
    const newStatus = currentStatus === 1 ? 0 : 1;
    
    // Optimistic update
    setLocalFavoriteStatus(newStatus);
    
    try {
      const result = await handleToggleFavorite({ ...item, favorites: currentStatus });
      
      if (result?.error) {
        // Revert on error
        setLocalFavoriteStatus(currentStatus);
        console.error('Failed to toggle favorite:', result.error);
      } else {
        console.log('Favorite toggle completed successfully');
        // Update parent if callback provided
        if (onItemUpdated) {
          onItemUpdated({ ...item, favorites: newStatus });
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // Revert on error
      setLocalFavoriteStatus(currentStatus);
    } finally {
      setIsProcessing(false);
    }
  };

  // Update local state when item prop changes
  React.useEffect(() => {
    setLocalFavoriteStatus(item.favorites || 0);
  }, [item.favorites]);

  const handleLocalMarketAnalysis = async () => {
    if (!handleMarketAnalysis || isProcessing) return;
    setIsProcessing(true);
    try {
      await handleMarketAnalysis(item);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLocalEdit = () => {
    if (!handleEdit) return;
    
    // Create callback for after edit completion
    const onEditComplete = () => {
      console.log('Edit completed, triggering soft refresh');
      // Trigger refresh after a short delay to allow edit modal to complete
      setTimeout(() => {
        if (onRefresh) {
          onRefresh();
        }
        // Also trigger onItemUpdated if available to update local state
        if (onItemUpdated) {
          // This will cause the parent to re-fetch and update the item
          onItemUpdated(item);
        }
      }, 100);
    };
    
    // Call handleEdit with the callback
    handleEdit(item, onEditComplete);
    onClose();
  };

  const handleLocalDelete = () => {
    if (!handleDelete) return;
    handleDelete(item.id);
    onClose();
  };

  const handleLocalRestore = async () => {
    if (!handleRestoreItem || isProcessing) return;
    setIsProcessing(true);
    try {
      await handleRestoreItem(item);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const getCollectibleFacts = (item: InventoryItem) => {
    const facts = [];
    
    // Category-specific facts
    if (item.category === 'milk_glass') {
      facts.push({
        icon: Info,
        title: 'About Milk Glass',
        content: 'Milk glass is an opaque or translucent, milk-colored or colored glass that can be blown or pressed into a wide variety of shapes. Popular from the 1800s through the 1980s.'
      });
      
      if (item.manufacturer.toLowerCase().includes('fenton')) {
        facts.push({
          icon: Award,
          title: 'Fenton Art Glass',
          content: 'Founded in 1905, Fenton was known for their handcrafted art glass. Their milk glass pieces are highly collectible, especially hobnail patterns.'
        });
      }
      
      if (item.pattern.toLowerCase().includes('hobnail')) {
        facts.push({
          icon: Info,
          title: 'Hobnail Pattern',
          content: 'The hobnail pattern features raised bumps resembling the nails used on boot soles. This pattern was extremely popular in the mid-20th century.'
        });
      }
    } else if (item.category === 'jadite') {
      facts.push({
        icon: Info,
        title: 'About Jadite',
        content: 'Jadite (or Jadeite) is a type of green glass made popular by Anchor Hocking\'s Fire-King line. Produced mainly from 1940s-1970s for restaurant and home use.'
      });
      
      if (item.manufacturer.toLowerCase().includes('fire-king')) {
        facts.push({
          icon: Award,
          title: 'Fire-King Jadite',
          content: 'Fire-King jadite was produced by Anchor Hocking from 1945-1976. Restaurant ware pieces are especially sought after by collectors.'
        });
      }
    }

    // Year-based facts
    if (item.year_manufactured) {
      if (item.year_manufactured >= 1940 && item.year_manufactured <= 1960) {
        facts.push({
          icon: Clock,
          title: 'Golden Age of Production',
          content: `Items from the ${item.year_manufactured}s are from the golden age of American glassware production, making them highly desirable to collectors.`
        });
      }
      
      if (item.year_manufactured < 1950) {
        facts.push({
          icon: Calendar,
          title: 'Pre-1950 Rarity',
          content: 'Pre-1950 pieces are considered vintage and often command higher prices due to their age and historical significance.'
        });
      }
    }

    // Condition-based facts
    if (item.condition === 'excellent') {
      facts.push({
        icon: Award,
        title: 'Excellent Condition',
        content: 'Items in excellent condition with no chips, cracks, or wear can be worth 50-100% more than similar pieces in lesser condition.'
      });
    }

    return facts;
  };

  const facts = getCollectibleFacts(item);
  const profitLoss = item.current_value - item.purchase_price;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Item Details & Facts
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h4>
          
          {viewMode === 'active' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Favorite Button */}
              {handleToggleFavorite && (
                <button
                  onClick={handleLocalToggleFavorite}
                  disabled={isProcessing}
                  className={`relative flex flex-col items-center p-4 rounded-xl transition-all duration-200 disabled:opacity-50 transform hover:scale-105 ${
                    localFavoriteStatus === 1
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 ring-2 ring-yellow-200 dark:ring-yellow-800 shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500'
                  }`}
                >
                  <Heart className={`h-5 w-5 mb-2 transition-all duration-200 ${
                    localFavoriteStatus === 1 
                      ? 'fill-current transform scale-110' 
                      : 'transform hover:scale-110'
                  }`} />
                  <span className="text-sm font-medium">
                    {localFavoriteStatus === 1 ? 'Favorited' : 'Favorite'}
                  </span>
                  {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 rounded-xl">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                </button>
              )}

              {/* Market Analysis Button */}
              {handleMarketAnalysis && (
                <button
                  onClick={handleLocalMarketAnalysis}
                  disabled={isProcessing || (analysisLoading && analyzingItem?.id === item.id)}
                  className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-colors disabled:opacity-50"
                >
                  {analysisLoading && analyzingItem?.id === item.id ? (
                    <Loader2 className="h-5 w-5 mb-2 animate-spin" />
                  ) : (
                    <TrendingUp className="h-5 w-5 mb-2" />
                  )}
                  <span className="text-sm font-medium">
                    {analysisLoading && analyzingItem?.id === item.id ? 'Analyzing...' : 'Market Analysis'}
                  </span>
                </button>
              )}

              {/* Edit Button */}
              {handleEdit && (
                <button
                  onClick={handleLocalEdit}
                  disabled={isProcessing}
                  className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-xl transition-colors disabled:opacity-50"
                >
                  <Edit className="h-5 w-5 mb-2" />
                  <span className="text-sm font-medium">Edit Item</span>
                </button>
              )}

              {/* Delete Button */}
              {handleDelete && hasProOrCollectorAccess && hasProOrCollectorAccess() && (
                <button
                  onClick={handleLocalDelete}
                  disabled={isProcessing}
                  className="flex flex-col items-center p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-5 w-5 mb-2" />
                  <span className="text-sm font-medium">Delete Item</span>
                </button>
              )}
            </div>
          ) : (
            /* Archived Item Actions */
            handleRestoreItem && (
              <div className="flex justify-center">
                <button
                  onClick={handleLocalRestore}
                  disabled={isProcessing}
                  className="flex items-center px-6 py-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-xl transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  <span className="font-medium">
                    {isProcessing ? 'Restoring...' : 'Restore Item'}
                  </span>
                </button>
              </div>
            )
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Item Overview */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              {item.photo_url ? (
                <img
                  src={item.photo_url}
                  alt={item.name}
                  className="w-full aspect-square object-cover rounded-xl"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                  <Info className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="md:w-2/3 space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {item.name}
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    item.category === 'milk_glass'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  }`}>
                    {item.category === 'milk_glass' ? 'Milk Glass' : 'Jadite'}
                  </span>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    item.condition === 'excellent' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                    item.condition === 'very_good' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                    item.condition === 'good' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                  }`}>
                    {(item.condition || 'good').replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  {item.manufacturer && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Manufacturer</p>
                      <p className="font-medium text-gray-900 dark:text-white">{item.manufacturer}</p>
                    </div>
                  )}
                  {item.pattern && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pattern</p>
                      <p className="font-medium text-gray-900 dark:text-white">{item.pattern}</p>
                    </div>
                  )}
                  {item.year_manufactured && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Year</p>
                      <p className="font-medium text-gray-900 dark:text-white">{item.year_manufactured}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quantity</p>
                    <p className="font-medium text-gray-900 dark:text-white">{item.quantity || 1}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current Value</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      ${item.current_value.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Purchase Price</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      ${item.purchase_price.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(item.current_value - item.purchase_price) >= 0 ? 'Profit' : 'Loss'}
                    </p>
                    <p className={`font-bold ${
                      (item.current_value - item.purchase_price) >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      ${Math.abs(item.current_value - item.purchase_price).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {item.location && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{item.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
              <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
            </div>
          )}

          {/* Collectible Facts */}
          {getCollectibleFacts(item).length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Collectible Facts & History
              </h4>
              <div className="space-y-4">
                {getCollectibleFacts(item).map((fact, index) => (
                  <div key={index} className="flex items-start p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <fact.icon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                        {fact.title}
                      </h5>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {fact.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Item Timeline</h4>
            <div className="space-y-2 text-sm">
              {item.year_manufactured && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>{item.year_manufactured} - Manufactured</span>
                </div>
              )}
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span>{format(new Date(item.created_at), 'MMM dd, yyyy')} - Added to collection</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                <span>{format(new Date(item.updated_at), 'MMM dd, yyyy')} - Last updated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};