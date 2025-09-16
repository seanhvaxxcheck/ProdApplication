import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ExternalLink,
  Heart,
  DollarSign,
  Calendar,
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  X,
  Trash,
  Eye
} from 'lucide-react';
import { useWishlist, type WishlistItem } from '../../hooks/useWishlist';
import { WishlistModal } from './WishlistModal';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useStripe } from '../../hooks/useStripe';
import { getProductByPriceId } from '../../stripe-config';
import { UpgradeModal } from '../subscription/UpgradeModal';

interface WishlistPageProps {
  onPageChange?: (page: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ onPageChange }) => {
  const { items, foundListings, loading, deleteItem, updateItem, triggerEbaySearch, refreshWishlist, deleteFoundListing } = useWishlist();
  const { user } = useAuth();
  const { getSubscription } = useStripe();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'found'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [searchingItems, setSearchingItems] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<WishlistItem | null>(null);
  const [searchSuccessModal, setSearchSuccessModal] = useState(false);
  const [searchResultMessage, setSearchResultMessage] = useState('');
  const [subscription, setSubscription] = useState<any>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');

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

  const filteredItems = items.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.ebay_search_term.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleEdit = (item: WishlistItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const item = items.find(item => item.id === id);
    if (item) {
      setItemToDelete(item);
      setDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      await deleteItem(itemToDelete.id);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleToggleStatus = async (item: WishlistItem) => {
    const newStatus = item.status === 'active' ? 'paused' : 'active';
    await updateItem(item.id, { status: newStatus });
  };

  const handleManualSearch = async (item: WishlistItem) => {
    if (!item.ebay_search_term.trim()) {
      setSearchResultMessage('Please add an eBay search term to this wishlist item first.');
      setSearchSuccessModal(true);
      return;
    }

    setSearchingItems(prev => new Set(prev).add(item.id));
    
    try {
      const result = await triggerEbaySearch(item.id);
      if (result.error) {
        setSearchResultMessage(`Search completed but no new listings found. ${result.error}`);
      } else {
        const itemListings = getItemFoundListings(item.id);
        if (itemListings.length > 0) {
          setSearchResultMessage(`Search completed! Found ${itemListings.length} listing${itemListings.length !== 1 ? 's' : ''} for "${item.item_name}". Check the Found Listings section above.`);
        } else {
          setSearchResultMessage(`Search completed but no listings found for "${item.item_name}" within your price range.`);
        }
      }
    } catch (error) {
      setSearchResultMessage('Search failed. Please try again later.');
    } finally {
      setSearchingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
      setSearchSuccessModal(true);
    }
  };

  const handleDeleteFoundListing = async (listingId: string) => {
    try {
      const result = await deleteFoundListing(listingId);
      if (result?.error) {
        console.error('Delete found listing failed:', result.error);
      } else {
        await refreshWishlist();
      }
    } catch (error) {
      console.error('Delete found listing error:', error);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const getItemFoundListings = (itemId: string) => {
    return foundListings.filter(listing => listing.wishlist_item_id === itemId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Pinterest-style Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Wishlist
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Track items you're looking for with automated monitoring
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search wishlist items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-full focus:ring-2 focus:ring-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="found">Found</option>
            </select>

            <button
              onClick={() => {
                if (hasProOrCollectorAccess()) {
                  setModalOpen(true);
                } else {
                  setUpgradeFeature('Wishlist feature');
                  setUpgradeModalOpen(true);
                }
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-medium transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add to wishlist</span>
            </button>
          </div>
        </div>

        {/* Found Listings - Pinterest Style */}
        {foundListings.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Found listings ({foundListings.length})
              </h2>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Eye className="h-4 w-4 mr-1" />
                Recent finds
              </div>
            </div>
            
            <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
              {foundListings.map((listing) => {
                const wishlistItem = items.find(item => item.id === listing.wishlist_item_id);
                return (
                  <div
                    key={listing.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group break-inside-avoid mb-4"
                  >
                    <div className="relative aspect-[4/5] bg-gray-100 dark:bg-gray-700">
                      {listing.listing_image_url ? (
                        <img 
                          src={listing.listing_image_url} 
                          alt={listing.listing_title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Heart className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Platform badge */}
                      <div className="absolute top-3 left-3">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          listing.platform === 'ebay' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200'
                        }`}>
                          {listing.platform === 'ebay' ? 'eBay' : 'Facebook'}
                        </span>
                      </div>

                      {/* Remove button */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={() => handleDeleteFoundListing(listing.id)}
                          className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </button>
                      </div>

                      {/* Price overlay */}
                      <div className="absolute bottom-3 left-3">
                        <div className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-lg">
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">
                            ${listing.listing_price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {listing.listing_title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        For: {wishlistItem?.item_name}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Found {format(new Date(listing.found_at), 'MMM dd')}
                        </span>
                        <a
                          href={listing.listing_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-green-500 hover:text-green-600 text-sm font-medium"
                        >
                          View <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Wishlist Items - Pinterest Style */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your wishlist ({filteredItems.length})
            </h2>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Heart className="h-4 w-4 mr-1" />
              Items you want
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <Heart className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Start your wishlist
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Add items you're looking for and we'll help you find them
                </p>
                {hasProOrCollectorAccess() ? (
                  <button
                    onClick={() => setModalOpen(true)}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
                  >
                    Add your first wish
                  </button>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Wishlist feature is available for Pro and Collector subscribers only.
                    </p>
                    <button
                      onClick={() => {
                        setUpgradeFeature('Wishlist feature');
                        setUpgradeModalOpen(true);
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
                    >
                      Upgrade to Pro
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {filteredItems.map((item) => {
                const itemListings = getItemFoundListings(item.id);
                const isSearching = searchingItems.has(item.id);
                
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group break-inside-avoid mb-6"
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {item.item_name}
                          </h3>
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            item.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                            item.status === 'paused' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-3 mb-4">
                        {item.ebay_search_term && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Search className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">eBay: "{item.ebay_search_term}"</span>
                          </div>
                        )}
                        {item.facebook_marketplace_url && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                            <a 
                              href={item.facebook_marketplace_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-red-500 hover:text-red-600 truncate"
                            >
                              Facebook Marketplace
                            </a>
                          </div>
                        )}
                        {item.desired_price_max && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>Max price: ${item.desired_price_max}</span>
                          </div>
                        )}
                      </div>

                      {/* Found Listings Count */}
                      {itemListings.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center text-blue-700 dark:text-blue-300">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">
                              {itemListings.length} matching listing{itemListings.length !== 1 ? 's' : ''} found
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Last Checked */}
                      {item.last_checked_at && (
                        <div className="mb-4 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Last checked: {format(new Date(item.last_checked_at), 'MMM dd, yyyy HH:mm')}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-2">
                          {item.ebay_search_term && (
                            <button
                              onClick={() => handleManualSearch(item)}
                              disabled={isSearching}
                              className="flex items-center px-4 py-2 text-sm bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-full transition-colors font-medium"
                            >
                              {isSearching ? (
                                <div className="h-3 w-3 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                              ) : (
                                <Search className="h-3 w-3 mr-2" />
                              )}
                              {isSearching ? 'Searching...' : 'Search now'}
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleToggleStatus(item)}
                            className={`flex items-center px-4 py-2 text-sm rounded-full transition-colors font-medium ${
                              item.status === 'active' 
                                ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                                : 'bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            }`}
                          >
                            {item.status === 'active' ? (
                              <>
                                <Pause className="h-3 w-3 mr-1" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3 mr-1" />
                                Activate
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Remove from wishlist
                </h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to remove "{itemToDelete.item_name}" from your wishlist?
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {searchSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {searchResultMessage.includes('failed') ? (
                    <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {searchResultMessage.includes('failed') ? 'Search Failed' : 'Search Complete'}
                  </h3>
                </div>
                <button
                  onClick={() => setSearchSuccessModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchResultMessage}
              </p>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setSearchSuccessModal(false)}
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${
                    searchResultMessage.includes('failed')
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <WishlistModal
          item={editingItem}
          onClose={closeModal}
          onSaved={async () => {
            await refreshWishlist();
          }}
        />
      )}

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature={upgradeFeature}
      />
    </div>
  );
};