import React, { useState, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  X,
  TrendingUp,
  Package,
  Star,
  RotateCcw,
  Grid,
  List
} from 'lucide-react';
import { useInventory, type InventoryItem } from '../../hooks/useInventory';
import { ItemModal } from './ItemModal';
import { MarketAnalysisModal } from './MarketAnalysisModal';
import { ItemFactsModal } from './ItemFactsModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { ToastNotification } from './ToastNotification';
import { useMarketAnalysis, type MarketAnalysisData } from '../../hooks/useMarketAnalysis';
import { useAuth } from '../../contexts/AuthContext';
import { useStripe } from '../../hooks/useStripe';
import { getProductByPriceId } from '../../stripe-config';
import { getAllCategories, getAllConditions, categoryIdToName, conditionIdToName } from '../../utils/customFields';
import { UpgradeModal } from '../subscription/UpgradeModal';

export const InventoryManager: React.FC = () => {
  const { items, loading, deleteItem, updateItem, viewMode, setViewMode, toggleFavorite, restoreItem, refreshItems } = useInventory();
  const { analyzeMarket, loading: analysisLoading } = useMarketAnalysis();
  const { user } = useAuth();
  const { getSubscription } = useStripe();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'milk_glass' | 'jadite'>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [marketAnalysisData, setMarketAnalysisData] = useState<MarketAnalysisData | null>(null);
  const [analyzingItem, setAnalyzingItem] = useState<InventoryItem | null>(null);
  const [factsModalItem, setFactsModalItem] = useState<InventoryItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [subscription, setSubscription] = useState<any>(null);
  const [viewType, setViewType] = useState<'masonry' | 'grid'>('masonry');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Get all available categories and conditions
  const allCategories = getAllCategories(user?.id);
  const allConditions = getAllConditions(user?.id);

  // Check subscription status
  React.useEffect(() => {
    const checkSubscription = async () => {
      if (user) {
        try {
          const subData = await getSubscription();
          setSubscription(subData);
        } catch (error) {
          console.error('Error fetching subscription:', error);
          setSubscription(null);
        }
      }
    };

    checkSubscription();
  }, [user]);

  // Helper function to check if user has Pro or Collector subscription
  const hasProOrCollectorAccess = () => {
    // Check if user is super admin
    if (user?.email === 'sean.hoagland55@gmail.com') {
      return true;
    }
    
    if (!subscription) return false;
    
    const subscribedProduct = subscription?.price_id ? getProductByPriceId(subscription.price_id) : null;
    return subscribedProduct && (subscribedProduct.name === 'Pro' || subscribedProduct.name === 'Collector');
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
                           (item.name || '').toLowerCase().includes(searchLower) ||
                           (item.manufacturer || '').toLowerCase().includes(searchLower) ||
                           (item.pattern || '').toLowerCase().includes(searchLower) ||
                           (item.category || '').toLowerCase().includes(searchLower) ||
                           (item.description || '').toLowerCase().includes(searchLower) ||
                           (item.location || '').toLowerCase().includes(searchLower) ||
                           (item.condition || '').toLowerCase().includes(searchLower) ||
                           item.purchase_price.toString().includes(searchTerm) ||
                           item.current_value.toString().includes(searchTerm) ||
                           (item.year_manufactured && item.year_manufactured.toString().includes(searchTerm)) ||
                           (item.quantity && item.quantity.toString().includes(searchTerm));
      
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesCondition = conditionFilter === 'all' || item.condition === conditionFilter;

      return matchesSearch && matchesCategory && matchesCondition;
    });
  }, [items, searchTerm, categoryFilter, conditionFilter]);

  const exportToCSV = () => {
    const headers = [
      'Name', 'Category', 'Manufacturer', 'Pattern', 'Year', 
      'Purchase Price', 'Current Value', 'Condition', 'Location', 'Description'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredItems.map(item => [
        `"${item.name}"`,
        `"${item.category}"`,
        `"${item.manufacturer}"`,
        `"${item.pattern}"`,
        item.year_manufactured || '',
        item.purchase_price,
        item.current_value,
        `"${item.condition}"`,
        `"${item.location}"`,
        `"${item.description}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collection-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    // Check if user has Pro or Collector access
    if (!hasProOrCollectorAccess()) {
      setUpgradeFeature('Item deletion');
      setUpgradeModalOpen(true);
      return;
    }

    const item = items.find(item => item.id === id);
    if (item) {
      setItemToDelete(item);
      setDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteItem(itemToDelete.id);
      if (result?.error) {
        console.error('Delete failed:', result.error);
        setToastMessage(`Failed to delete item: ${result.error}`);
      } else {
        setToastMessage(`Item "${itemToDelete.name}" successfully deleted.`);
      }
      setToastVisible(true);
    } catch (error) {
      console.error('Delete error:', error);
      setToastMessage('Failed to delete item. Please try again.');
      setToastVisible(true);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleMarketAnalysis = async (item: InventoryItem) => {
    // Check if user has Pro or Collector access
    if (!hasProOrCollectorAccess()) {
      setUpgradeFeature('Market analysis');
      setUpgradeModalOpen(true);
      return;
    }

    setAnalyzingItem(item);
    
    try {
      const analysisData = await analyzeMarket({
        item_name: item.name,
        manufacturer: item.manufacturer,
        pattern: item.pattern,
        category: item.category,
        description: item.description,
        photoUrl: item.photo_url || undefined,
      });

      if (analysisData) {
        setMarketAnalysisData(analysisData);
      } else {
        // If no data returned, still show modal with mock data
        setMarketAnalysisData({
          averagePrice: 75.00,
          recentSales: [
            {
              title: `${item.manufacturer} ${item.name} - Similar Item`,
              price: 85.00,
              soldDate: new Date(Date.now() - 86400000 * 3).toISOString(),
              condition: 'Very Good',
              url: 'https://ebay.com/item/demo',
              imageUrl: item.photo_url || undefined,
            },
            {
              title: `Vintage ${item.category.replace('_', ' ')} ${item.name}`,
              price: 65.00,
              soldDate: new Date(Date.now() - 86400000 * 7).toISOString(),
              condition: 'Good',
              url: 'https://ebay.com/item/demo2',
              imageUrl: item.photo_url || undefined,
            }
          ],
          priceRange: { min: 65.00, max: 85.00 },
          confidence: 'medium' as const,
          searchTermsUsed: [item.name, item.manufacturer, item.category],
        });
      }
    } catch (error) {
      console.error('Market analysis error:', error);
      // Show modal with fallback data even if there's an error
      setMarketAnalysisData({
        averagePrice: item.current_value || 50.00,
        recentSales: [
          {
            title: `${item.name} - Market Data Unavailable`,
            price: item.current_value || 50.00,
            soldDate: new Date().toISOString(),
            condition: 'Unknown',
            url: '#',
            imageUrl: item.photo_url || undefined,
          }
        ],
        priceRange: { min: (item.current_value || 50) * 0.8, max: (item.current_value || 50) * 1.2 },
        confidence: 'low' as const,
        searchTermsUsed: [item.name],
      });
    }
  };

  const handleUpdateValueFromAnalysis = async (newValue: number) => {
    if (analyzingItem) {
      await updateItem(analyzingItem.id, { current_value: newValue });
    }
  };

  const handleToggleFavorite = async (item: InventoryItem) => {
    console.log('InventoryManager: Toggling favorite for item:', item.id, 'current status:', item.favorites);
    const result = await toggleFavorite(item.id, item.favorites || 0);
    
    if (result?.error) {
      console.error('Toggle favorite failed:', result.error);
      setToastMessage(`Failed to update favorite: ${result.error}`);
      setToastVisible(true);
      return result;
    } else {
      console.log('InventoryManager: Favorite toggle successful');
      setToastMessage(`Item ${item.favorites === 1 ? 'removed from' : 'added to'} favorites`);
      setToastVisible(true);
      return { data: result.data, error: null };
    }
  };

  const handleRestoreItem = async (item: InventoryItem) => {
    try {
      const result = await restoreItem(item.id);
      if (result?.error) {
        console.error('Restore failed:', result.error);
        setToastMessage(`Failed to restore item: ${result.error}`);
      } else {
        setToastMessage(`Item "${item.name}" successfully restored to active collection.`);
      }
      setToastVisible(true);
    } catch (error) {
      console.error('Restore error:', error);
      setToastMessage('Failed to restore item. Please try again.');
      setToastVisible(true);
    }
  };

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingItem(null);
    // Refresh inventory after modal closes to ensure updates are visible
    refreshItems();
  }, []);

  const closeAnalysisModal = useCallback(() => {
    setMarketAnalysisData(null);
    setAnalyzingItem(null);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Collection</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading your collection...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Pinterest-style Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Collection</h1>
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span>{filteredItems.length} items</span>
                <span>•</span>
                <span>{viewMode === 'active' ? 'Active' : 'Archived'}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* View Toggle */}
              <div className="hidden sm:flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-full p-1">
                <button
                  onClick={() => setViewType('masonry')}
                  className={`p-2 rounded-full transition-colors ${
                    viewType === 'masonry'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Masonry View"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewType('grid')}
                  className={`p-2 rounded-full transition-colors ${
                    viewType === 'grid'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Export */}
              <button
                onClick={exportToCSV}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Export"
              >
                <Download className="h-5 w-5" />
              </button>

              {/* Add Item */}
              {viewMode === 'active' && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-medium transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Create</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pinterest-style Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search your collection..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-full focus:ring-2 focus:ring-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'all' | 'milk_glass' | 'jadite')}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Categories</option>
              {allCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Conditions</option>
              {allConditions.map((condition) => (
                <option key={condition.id} value={condition.id}>
                  {condition.name}
                </option>
              ))}
            </select>

          </div>
        </div>

        {/* Second Row - View Mode Toggle and Mobile Create Button */}
        <div className="flex items-center justify-between mb-8">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-full p-1">
            <button
              onClick={() => setViewMode('active')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                viewMode === 'active'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setViewMode('archived')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                viewMode === 'archived'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Archived
            </button>
          </div>

          {/* Create Button - Mobile */}
          {viewMode === 'active' && (
            <button
              onClick={() => setModalOpen(true)}
              className="sm:hidden bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-medium transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create</span>
            </button>
          )}
        </div>

        {/* Pinterest-style Masonry Grid */}
        {filteredItems.length > 0 ? (
          <div className={
            viewType === 'masonry' 
              ? "columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4"
              : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          }>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer ${
                  viewType === 'masonry' ? 'break-inside-avoid mb-4' : ''
                }`}
                onClick={() => setFactsModalItem(item)}
              >
                {/* Image */}
                <div className="relative aspect-[4/5] bg-gray-100 dark:bg-gray-700">
                  {item.photo_url ? (
                    <img
                      src={item.photo_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Overlay with actions */}

                  {/* Favorite Star */}
                  {item.favorites === 1 && (
                    <div className="absolute top-3 right-3">
                      <div className="p-2 bg-yellow-500 rounded-full shadow-lg">
                        <Star className="h-4 w-4 text-white fill-current" />
                      </div>
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      item.category === 'milk_glass'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                        : item.category === 'jadite'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                        : item.category === 'blue_glass'
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200'
                    }`}>
                      {categoryIdToName(item.category, user?.id)}
                    </span>
                  </div>

                  {/* Archived Badge */}
                  {viewMode === 'archived' && (
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex px-3 py-1 bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300 text-xs rounded-full font-medium">
                        Archived
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {item.name}
                  </h3>
                  
                  {item.manufacturer && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {item.manufacturer}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${item.current_value.toLocaleString()}
                      </p>
                      {item.purchase_price > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Paid: ${item.purchase_price.toLocaleString()}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      {item.quantity > 1 && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                          Qty: {item.quantity}
                        </p>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.condition === 'excellent' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                        item.condition === 'very_good' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                        item.condition === 'good' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                        item.condition === 'fair' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      }`}>
                        {conditionIdToName(item.condition || 'good', user?.id)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              {items.length === 0 ? (
                <>
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Start your collection
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Add your first item to begin tracking your collection
                  </p>
                  {viewMode === 'active' && (
                    <button
                      onClick={() => setModalOpen(true)}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
                    >
                      Create your first item
                    </button>
                  )}
                </>
              ) : (
                <>
                  <Filter className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No items match your search
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Try adjusting your filters or search terms
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('all');
                      setConditionFilter('all');
                    }}
                    className="text-green-500 hover:text-green-600 font-medium"
                  >
                    Clear all filters
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalOpen && (
        <ItemModal 
          item={editingItem}
          onClose={closeModal}
        />
      )}

      {factsModalItem && (
        <ItemFactsModal
          item={factsModalItem}
          onClose={() => setFactsModalItem(null)}
          onItemUpdated={(updatedItem) => {
            setFactsModalItem(updatedItem);
          }}
          viewMode={viewMode}
          hasProOrCollectorAccess={hasProOrCollectorAccess}
          handleToggleFavorite={handleToggleFavorite}
          handleMarketAnalysis={handleMarketAnalysis}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleRestoreItem={handleRestoreItem}
          analysisLoading={analysisLoading}
          analyzingItem={analyzingItem}
        />
      )}

      {marketAnalysisData && analyzingItem && (
        <MarketAnalysisModal
          data={marketAnalysisData}
          itemName={analyzingItem.name}
          onClose={closeAnalysisModal}
          onUpdateValue={handleUpdateValueFromAnalysis}
        />
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        itemName={itemToDelete?.name || ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />

      <ToastNotification
        isVisible={toastVisible}
        message={toastMessage}
        onClose={() => setToastVisible(false)}
        type="success"
      />

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature={upgradeFeature}
      />
    </div>
  );
};