import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePWA } from './usePWA';

export interface InventoryItem {
  id: string;
  user_id: string;
  category: 'milk_glass' | 'jadite';
  name: string;
  manufacturer: string;
  pattern: string;
  year_manufactured: number | null;
  purchase_price: number;
  current_value: number;
  location: string;
  description: string;
  condition: 'excellent' | 'very_good' | 'good' | 'fair' | 'poor';
  photo_url: string | null;
  quantity: number;
  deleted?: number;
  favorites?: number;
  created_at: string;
  updated_at: string;
}

export const useInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const { user } = useAuth();
  const { showNotification } = usePWA();

  const getConditionId = (condition: string): string => {
    const conditionMap: { [key: string]: string } = {
      'excellent': '1',
      'very_good': '2',
      'good': '3', 
      'fair': '4',
      'poor': '5'
    };
    return conditionMap[condition] || '3';
  };

  const fetchItems = async () => {
    if (!user) {
      console.log('No user found, clearing items');
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const procedureName = viewMode === 'active' ? 'sp_get_user_inventory' : 'sp_get_user_archived_inventory';
      console.log(`Fetching ${viewMode} inventory items using stored procedure for user:`, user.id);
      
      const { data, error } = await supabase.rpc(procedureName, { 
        p_user_id: user.id 
      });
      
      console.log(`${procedureName} response:`, { data, error });
      
      if (error) {
        console.error(`Error fetching ${viewMode} inventory items:`, error);
        // Don't throw error, just set empty items and show the error
        setItems([]);
        setLoading(false);
        return;
      }
      
      console.log(`Successfully fetched ${viewMode} inventory items:`, data?.length || 0, data);
      setItems(data || []);
    } catch (err) {
      console.error(`Error fetching ${viewMode} items:`, err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [user, viewMode]);

  const addItem = async (item: Omit<InventoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      console.error('Cannot add item: User not authenticated');
      return { data: null, error: 'User not authenticated' };
    }

    try {
      console.log('Adding item via stored procedure:', item);

      // Insert directly into inventory_items table
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([{
          user_id: user.id,
          category: item.category,
          name: item.name,
          manufacturer: item.manufacturer || '',
          pattern: item.pattern || '',
          year_manufactured: item.year_manufactured,
          purchase_price: item.purchase_price || 0,
          current_value: item.current_value || 0,
          location: item.location || '',
          description: item.description || '',
          condition: item.condition,
          photo_url: item.photo_url,
          quantity: item.quantity || 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      console.log('Successfully added item:', data);
      
      // Refresh the entire list to get the latest data
      await fetchItems();
      
      // Show notification for successful addition
      showNotification('Item Added', {
        body: `${item.name} has been added to your collection`,
        tag: 'item-added',
      });

      return { data: data, error: null };
    } catch (err: any) {
      console.error('Error adding item:', err);
      return { data: null, error: err.message };
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    if (!user) {
      console.error('Cannot update item: User not authenticated');
      return { data: null, error: 'User not authenticated' };
    }

    try {
      console.log('Updating item using stored procedure:', id, updates);

      // Get the current item to merge with updates
      const currentItem = items.find(item => item.id === id);
      if (!currentItem) {
        return { data: null, error: 'Item not found' };
      }

      // Merge current item with updates
      const updatedData = { ...currentItem, ...updates };

      const { error } = await supabase.rpc('sp_update_user_inventory', {
        p_user_id: user.id,
        p_id: id,
        p_category: updatedData.category,
        p_name: updatedData.name,
        p_manufacturer: updatedData.manufacturer || '',
        p_pattern: updatedData.pattern || '',
        p_year_manufactured: updatedData.year_manufactured,
        p_purchase_price: updatedData.purchase_price || 0,
        p_current_value: updatedData.current_value || 0,
        p_location: updatedData.location || '',
        p_description: updatedData.description || '',
        p_condition: updatedData.condition,
        p_photo_url: updatedData.photo_url,
        p_favorites: updatedData.favorites || 0,
        p_quantity: updatedData.quantity || 1
      });

      if (error) {
        console.error('Stored procedure update error:', error);
        return { data: null, error: error.message };
      }

      console.log('Successfully updated item using stored procedure:', id);
      
      // Refresh the entire list to get the latest data
      await fetchItems();
      
      // Show notification for successful update
      showNotification('Item Updated', {
        body: `${updatedData.name} has been updated`,
        tag: 'item-updated',
      });

      return { data: updatedData, error: null };
    } catch (err: any) {
      console.error('Error updating item:', err);
      return { data: null, error: err.message };
    }
  };

  const toggleFavorite = async (id: string, currentFavoriteStatus: number) => {
    const newFavoriteStatus = currentFavoriteStatus === 1 ? 0 : 1;
    
    console.log('toggleFavorite called:', {
      itemId: id,
      currentStatus: currentFavoriteStatus,
      newStatus: newFavoriteStatus
    });

    try {
      const result = await updateItem(id, { favorites: newFavoriteStatus });
      
      if (result?.error) {
        console.error('toggleFavorite failed:', result.error);
        return { error: result.error };
      }
      
      console.log('toggleFavorite successful');
      return { data: result?.data, error: null };
    } catch (error: any) {
      console.error('toggleFavorite exception:', error);
      return { error: error.message };
    }
  };

  const deleteItem = async (id: string) => {
    if (!user) {
      console.error('Cannot delete item: User not authenticated');
      return { error: 'User not authenticated' };
    }

    try {
      console.log('Attempting soft delete using stored procedure for item:', id, 'user:', user.id);
      const { data, error } = await supabase.rpc('soft_delete_inventory_item', {
        p_item_id: id,
        p_user_id: user.id
      });

      if (error) {
        console.error('Soft delete error:', error.message, error);
        return { error: error.message };
      }

      console.log('Successfully soft deleted item:', id, 'Response:', data);
      
      // Refresh the entire list to get the latest data
      await fetchItems();
      
      // Show notification for successful deletion
      showNotification('Item Archived', {
        body: 'Item has been moved to archive',
        tag: 'item-deleted',
      });

      return { error: null };
    } catch (err: any) {
      console.error('Soft delete catch error:', err);
      return { error: err.message };
    }
  };

  const restoreItem = async (id: string) => {
    if (!user) {
      console.error('Cannot restore item: User not authenticated');
      return { error: 'User not authenticated' };
    }

    try {
      console.log('Attempting to restore item using stored procedure for item:', id, 'user:', user.id);
      const { data, error } = await supabase.rpc('reactivate_inventory_item', {
        p_item_id: id,
        p_user_id: user.id
      });

      if (error) {
        console.error('Restore error:', error.message, error);
        return { error: error.message };
      }

      console.log('Successfully restored item:', id, 'Response:', data);
      
      // Refresh the entire list to get the latest data
      await fetchItems();
      
      // Show notification for successful restoration
      showNotification('Item Restored', {
        body: 'Item has been restored to your collection',
        tag: 'item-restored',
      });

      return { error: null };
    } catch (err: any) {
      console.error('Restore catch error:', err);
      return { error: err.message };
    }
  };
  const uploadPhoto = async (file: File, itemId: string) => {
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    console.log('=== PHOTO UPLOAD DEBUG START ===');
    console.log('User ID:', user.id);
    console.log('Item ID:', itemId);
    console.log('File name:', file.name);
    console.log('File type:', file.type);
    console.log('File size:', file.size);

    try {
      console.log('Uploading photo to Supabase Storage for item:', itemId);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${itemId}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Uploading to path:', filePath);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('item-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('item-photos')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('Generated public URL:', publicUrl);
      
      return { data: publicUrl, error: null };

    } catch (err: any) {
      console.error('Photo upload error:', err);
      return { data: null, error: err.message };
    }
  };

  return {
    items,
    loading,
    viewMode,
    setViewMode,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    restoreItem,
    uploadPhoto,
    toggleFavorite,
    refreshItems: fetchItems
  };
};