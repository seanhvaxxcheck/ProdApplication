import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface WishlistItem {
  id: string;
  user_id: string;
  item_name: string;
  ebay_search_term: string;
  facebook_marketplace_url: string;
  desired_price_max: number | null;
  status: 'active' | 'paused' | 'found';
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FoundListing {
  id: string;
  wishlist_item_id: string;
  platform: 'ebay' | 'facebook';
  listing_title: string;
  listing_price: number;
  listing_url: string;
  listing_image_url: string | null;
  found_at: string;
  notified: boolean;
}

export const useWishlist = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [foundListings, setFoundListings] = useState<FoundListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useOfflineMode, setUseOfflineMode] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        setUseOfflineMode(true);
        const savedItems = localStorage.getItem(`wishlist_${user.id}`);
        setItems(savedItems ? JSON.parse(savedItems) : []);
        return;
      }

      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      console.error('Error fetching wishlist items:', err);
      setError(err.message);
      setUseOfflineMode(true);
      const savedItems = localStorage.getItem(`wishlist_${user.id}`);
      setItems(savedItems ? JSON.parse(savedItems) : []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchFoundListings = useCallback(async () => {
    if (!user || useOfflineMode) return;

    try {
      const { data, error } = await supabase
        .from('found_listings')
        .select(`
          *,
          wishlist_items!inner(user_id)
        `)
        .eq('wishlist_items.user_id', user.id)
        .order('found_at', { ascending: false });

      if (error) throw error;
      setFoundListings(data || []);
    } catch (err: any) {
      console.error('Error fetching found listings:', err);
    }
  }, [user, useOfflineMode]);

  const saveToLocalStorage = (newItems: WishlistItem[]) => {
    if (user) {
      localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(newItems));
    }
  };

  const addItem = async (item: Omit<WishlistItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_checked_at'>) => {
    if (!user) return { data: null, error: 'User not authenticated' };

    try {
      if (useOfflineMode) {
        const newItem: WishlistItem = {
          id: `wishlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: user.id,
          ...item,
          last_checked_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const newItems = [newItem, ...items];
        setItems(newItems);
        saveToLocalStorage(newItems);
        return { data: newItem, error: null };
      }

      const { data, error } = await supabase
        .from('wishlist_items')
        .insert([{ user_id: user.id, ...item }])
        .select()
        .single();

      if (error) throw error;

      setItems(prev => [data, ...prev]);
      return { data, error: null };
    } catch (err: any) {
      console.error('Error adding wishlist item:', err);
      return { data: null, error: err.message };
    }
  };

  const updateItem = async (id: string, updates: Partial<WishlistItem>) => {
    if (!user) return { data: null, error: 'User not authenticated' };

    try {
      if (useOfflineMode) {
        const updatedItems = items.map(item => item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item);
        setItems(updatedItems);
        saveToLocalStorage(updatedItems);
        const updatedItem = updatedItems.find(item => item.id === id);
        return { data: updatedItem, error: null };
      }

      const { data, error } = await supabase
        .from('wishlist_items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setItems(prev => prev.map(item => item.id === id ? data : item));
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating wishlist item:', err);
      return { data: null, error: err.message };
    }
  };

  const deleteItem = async (id: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      if (useOfflineMode) {
        const updatedItems = items.filter(item => item.id !== id);
        setItems(updatedItems);
        saveToLocalStorage(updatedItems);
        return { error: null };
      }

      const { error } = await supabase.from('wishlist_items').delete().eq('id', id);
      if (error) throw error;
      setItems(prev => prev.filter(item => item.id !== id));
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting wishlist item:', err);
      return { error: err.message };
    }
  };

  const deleteFoundListing = async (listingId: string) => {
    if (!user) return { error: 'User not authenticated' };

    console.log('deleteFoundListing called with listingId:', listingId);
    console.log('Current user:', user.id);
    console.log('useOfflineMode:', useOfflineMode);

    try {
      if (useOfflineMode) {
        console.log('Using offline mode - removing from local state only');
        setFoundListings(prev => prev.filter(listing => listing.id !== listingId));
        return { error: null };
      }

      console.log('Attempting to delete from Supabase...');
      
      // First, let's check if the listing exists and belongs to the current user
      const { data: existingListing, error: fetchError } = await supabase
        .from('found_listings')
        .select(`
          id,
          wishlist_item_id,
          wishlist_items!inner(user_id)
        `)
        .eq('id', listingId)
        .eq('wishlist_items.user_id', user.id)
        .limit(1);

      if (fetchError) {
        console.error('Error fetching listing:', fetchError);
        return { error: `Failed to find listing: ${fetchError.message}` };
      }

      if (!existingListing || existingListing.length === 0) {
        console.error('Listing not found or does not belong to user');
        return { error: 'Listing not found or you do not have permission to delete it' };
      }

      console.log('Found listing to delete:', existingListing[0]);

      // Now delete the listing
      const { data: deleteData, error: deleteError } = await supabase
        .from('found_listings')
        .delete()
        .eq('id', listingId)
        .select(); // Add select() to see what was actually deleted

      if (deleteError) {
        console.error('Delete error:', deleteError);
        return { error: `Failed to delete listing: ${deleteError.message}` };
      }

      console.log('Delete operation returned:', deleteData);
      console.log('Number of records deleted:', deleteData?.length || 0);

      // Verify the deletion by trying to fetch the record again
      const { data: verifyData, error: verifyError } = await supabase
        .from('found_listings')
        .select('id')
        .eq('id', listingId)
        .limit(1);

      if (verifyError) {
        console.error('Verification error:', verifyError);
      } else if (verifyData && verifyData.length > 0) {
        console.error('❌ WARNING: Record still exists in database after delete!', verifyData[0]);
        return { error: 'Delete operation failed - record still exists in database' };
      } else {
        console.log('✅ Verified: Record successfully deleted from database');
      }

      console.log('Successfully deleted from database');
      
      // Remove the listing from local state
      setFoundListings(prev => {
        const filtered = prev.filter(listing => listing.id !== listingId);
        console.log('Updated local state. Before:', prev.length, 'After:', filtered.length);
        return filtered;
      });
      
      return { error: null };
    } catch (err: any) {
      console.error('Unexpected error deleting found listing:', err);
      return { error: err.message || 'An unexpected error occurred' };
    }
  };

  const refreshWishlist = async () => {
    await fetchItems();
    if (!useOfflineMode) {
      await fetchFoundListings();
    }
  };

  const triggerEbaySearch = async (itemId: string) => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ebay-monitor`;
      
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          wishlistItemId: itemId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to trigger eBay search');
      }

      const data = await response.json();
      
      // Refresh found listings after search
      await fetchFoundListings();
      
      return { data, error: null };
    } catch (err: any) {
      console.error('eBay search error:', err);
      return { data: null, error: err.message };
    }
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (!useOfflineMode) fetchFoundListings();
  }, [fetchFoundListings, useOfflineMode]);

  return {
    items,
    foundListings,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    deleteFoundListing,
    fetchItems,
    refreshWishlist,
    triggerEbaySearch,
  };
};