import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useWishlist, type WishlistItem } from '../../hooks/useWishlist';

interface WishlistModalProps {
  item?: WishlistItem | null;
  onClose: () => void;
  onSaved?: () => void; // callback to refresh parent
}

export const WishlistModal: React.FC<WishlistModalProps> = ({ item, onClose, onSaved }) => {
  const { addItem, updateItem, refreshWishlist } = useWishlist();
  const [formData, setFormData] = useState({
    item_name: item?.item_name || '',
    ebay_search_term: item?.ebay_search_term || '',
    facebook_marketplace_url: item?.facebook_marketplace_url || '',
    desired_price_max: item?.desired_price_max || '',
    status: (item?.status as any) || 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.item_name.trim()) {
      setError('Item name is required');
      setLoading(false);
      return;
    }

    if (!formData.ebay_search_term.trim() && !formData.facebook_marketplace_url.trim()) {
      setError('Please provide either an eBay search term or Facebook Marketplace URL');
      setLoading(false);
      return;
    }

    try {
      const itemData = {
        ...formData,
        desired_price_max: formData.desired_price_max ? Number(formData.desired_price_max) : null,
      };

      let result;
      if (item) {
        result = await updateItem(item.id, itemData);
      } else {
        result = await addItem(itemData);
      }

      if (result?.error) throw new Error(result.error);

      // ✅ Force refresh the wishlist data
      await refreshWishlist();
      
      // ✅ Notify parent component to refresh its UI if needed
      if (onSaved) {
        await onSaved();
      }

      // ✅ Small delay to ensure state updates before closing
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (err: any) {
      console.error('Error saving wishlist item:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {item ? 'Edit Wishlist Item' : 'Add Wishlist Item'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Item Name *</label>
            <input
              type="text"
              value={formData.item_name}
              onChange={e => setFormData({ ...formData, item_name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Fenton Hobnail Milk Glass Vase"
            />
          </div>

          {/* eBay Search Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">eBay Search Term</label>
            <input
              type="text"
              value={formData.ebay_search_term}
              onChange={e => setFormData({ ...formData, ebay_search_term: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., fenton hobnail milk glass vase"
            />
          </div>

          {/* Facebook Marketplace URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Facebook Marketplace URL</label>
            <input
              type="url"
              value={formData.facebook_marketplace_url}
              onChange={e => setFormData({ ...formData, facebook_marketplace_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              placeholder="https://www.facebook.com/marketplace/..."
            />
          </div>

          {/* Desired Max Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Maximum Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.desired_price_max}
              onChange={e => setFormData({ ...formData, desired_price_max: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              placeholder="0.00"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="found">Found</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.item_name}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg transition-colors font-medium"
            >
              {loading ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};