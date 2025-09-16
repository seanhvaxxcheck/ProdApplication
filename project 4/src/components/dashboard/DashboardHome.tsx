import React, { useState } from 'react';
import { Package, Plus, TrendingUp, Image as ImageIcon, ArrowRight, Star, Heart, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import { ItemModal } from '../inventory/ItemModal';
import { format } from 'date-fns';

interface DashboardHomeProps {
  onPageChange?: (page: string) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ onPageChange }) => {
  const { items } = useInventory();
  const [modalOpen, setModalOpen] = useState(false);
  const [favoritesStartIndex, setFavoritesStartIndex] = useState(0);

  // Update page title
  React.useEffect(() => {
    document.title = 'Dashboard - MyGlassCase';
  }, []);

  const stats = React.useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const totalValue = items.reduce((sum, item) => sum + ((item.current_value || 0) * (item.quantity || 1)), 0);
    const totalInvested = items.reduce((sum, item) => sum + ((item.purchase_price || 0) * (item.quantity || 1)), 0);
    const favoriteItems = items.filter(item => item.favorites === 1);
    const recentItems = items
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);

    return {
      totalItems,
      totalValue,
      totalInvested,
      favoriteItems,
      recentItems,
    };
  }, [items]);

  // Auto-rotate favorites carousel with smooth transitions
  React.useEffect(() => {
    if (stats.favoriteItems.length > 3) {
      const interval = setInterval(() => {
        setFavoritesStartIndex(prev => {
          return (prev + 1) % stats.favoriteItems.length;
        });
      }, 5000); // Rotate every 5 seconds for more graceful viewing

      return () => clearInterval(interval);
    }
  }, [stats.favoriteItems.length]);

  const getCurrentFavorites = () => {
    if (stats.favoriteItems.length <= 3) {
      return stats.favoriteItems;
    }
    
    const current = [];
    for (let i = 0; i < 3; i++) {
      const index = (favoritesStartIndex + i) % stats.favoriteItems.length;
      current.push(stats.favoriteItems[index]);
    }
    return current;
  };

  const handlePrevFavorites = () => {
    setFavoritesStartIndex(prev => {
      return prev === 0 ? stats.favoriteItems.length - 1 : prev - 1;
    });
  };

  const handleNextFavorites = () => {
    setFavoritesStartIndex(prev => {
      return (prev + 1) % stats.favoriteItems.length;
    });
  };
  const handleItemClick = (itemId: string) => {
    console.log('Navigate to item:', itemId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Pinterest-style Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Your Collection
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Discover and organize your treasures
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards - Pinterest Style */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalItems}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Items</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.totalValue.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Value</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <Star className="h-6 w-6 text-yellow-500 fill-current" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {stats.favoriteItems.length}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Favorites</p>
            </div>
          </div>
        </div>

        {/* Favorites Carousel */}
        {stats.favoriteItems.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your favorites</h2>
              <div className="flex items-center space-x-2">
                {stats.favoriteItems.length > 3 && (
                  <>
                    <button
                      onClick={handlePrevFavorites}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleNextFavorites}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => onPageChange && onPageChange('inventory')}
                  className="flex items-center text-green-500 hover:text-green-600 font-medium transition-colors"
                >
                  See all
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>

            <div className="relative overflow-hidden max-w-4xl mx-auto">
              <div 
                className="flex transition-all duration-1000 ease-in-out transform"
                style={{
                  transform: `translateX(-${favoritesStartIndex * 100}%)`
                }}
              >
              {stats.favoriteItems.map((item, index) => (
                <div
                  key={item.id}
                  className="w-full flex-shrink-0 px-3"
                >
                  <div
                    onClick={() => handleItemClick(item.id)}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer opacity-0 animate-fade-in"
                    style={{
                      animationDelay: `${index * 150}ms`,
                      animationFillMode: 'forwards'
                    }}
                  >
                    <div className="relative aspect-[3/2] bg-gray-100 dark:bg-gray-700">
                      {item.photo_url ? (
                        <img 
                          src={item.photo_url} 
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-500">
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                          <button className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all">
                            <Heart className="h-4 w-4 text-red-500 fill-current" />
                          </button>
                        </div>
                      </div>

                      {/* Favorite badge */}
                      <div className="absolute top-3 left-3 transform transition-all duration-300 group-hover:scale-110">
                        <span className="inline-flex px-2 py-1 bg-yellow-500 text-white text-xs rounded-full font-medium">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Favorite
                        </span>
                      </div>
                    </div>

                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {item.name}
                      </h3>
                      {item.manufacturer && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {item.manufacturer}
                        </p>
                      )}
                      <p className="text-base font-bold text-green-600 dark:text-green-400">
                        ${item.current_value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>

            {/* Carousel indicators */}
            {stats.favoriteItems.length > 1 && (
              <div className="flex justify-center mt-8 space-x-3">
                {stats.favoriteItems.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setFavoritesStartIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 transform hover:scale-125 ${
                      favoritesStartIndex === index
                        ? 'bg-green-500 shadow-lg scale-110'
                        : 'bg-gray-300 dark:bg-gray-600 hover:bg-green-300 dark:hover:bg-green-700'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recent Items - Pinterest Masonry Style */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent additions</h2>
            <button
              onClick={() => onPageChange && onPageChange('inventory')}
              className="flex items-center text-green-500 hover:text-green-600 font-medium transition-colors"
            >
              See all
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>

          {stats.recentItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Start your collection
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create your first item to begin building your collection
                </p>
                <button
                  onClick={() => setModalOpen(true)}
                 className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create item</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {stats.recentItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer break-inside-avoid mb-4"
                >
                  <div className="relative aspect-[4/5] bg-gray-100 dark:bg-gray-700">
                    {item.photo_url ? (
                      <img 
                        src={item.photo_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300">
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all">
                          <Heart className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {/* New badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                        New
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {format(new Date(item.created_at), 'MMM dd')}
                    </p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      ${item.current_value.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Quick actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setModalOpen(true)}
              className="flex flex-col items-center p-6 bg-green-50 dark:bg-green-900/10 rounded-2xl hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors group"
            >
              <div className="p-4 bg-green-500 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Create item</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Add a new item to your collection
              </p>
            </button>

            <button
              onClick={() => onPageChange && onPageChange('inventory')}
              className="flex flex-col items-center p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors group"
            >
              <div className="p-4 bg-blue-500 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Browse collection</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Explore all your items
              </p>
            </button>

            <button
              onClick={() => onPageChange && onPageChange('wishlist')}
              className="flex flex-col items-center p-6 bg-purple-50 dark:bg-purple-900/10 rounded-2xl hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors group"
            >
              <div className="p-4 bg-purple-500 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Wishlist</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Track items you want
              </p>
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <ItemModal
          item={null}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};