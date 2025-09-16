import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Camera, RotateCcw, AlertCircle } from 'lucide-react';
import { useInventory, type InventoryItem } from '../../hooks/useInventory';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getAllCategories, getAllConditions, categoryNameToId, conditionNameToId, categoryIdToName } from '../../utils/customFields';

interface ItemModalProps {
  item?: InventoryItem | null;
  onClose: () => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({ item, onClose }) => {
  const { addItem, updateItem, uploadPhoto, refreshItems } = useInventory();
  const { user } = useAuth();
  
  // Force close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, item]);
  
  const [conditions, setConditions] = useState<Array<{ title: string }>>([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    manufacturer: '',
    pattern: '',
    year_manufactured: '',
    purchase_price: '',
    current_value: '',
    location: '',
    description: '',
    condition: 'good',
    quantity: '',
  });

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      // Convert category ID back to display name for the form
      const categoryDisplayName = categoryIdToName(item.category, user?.id);
      
      setFormData({
        name: item.name || '',
        category: categoryDisplayName,
        manufacturer: item.manufacturer || '',
        pattern: item.pattern || '',
        year_manufactured: item.year_manufactured ? item.year_manufactured.toString() : '',
        purchase_price: item.purchase_price ? item.purchase_price.toString() : '',
        current_value: item.current_value ? item.current_value.toString() : '',
        location: item.location || '',
        description: item.description || '',
        condition: item.condition || 'good',
        quantity: item.quantity ? item.quantity.toString() : '1',
      });
    } else {
      // Reset form for new items
      setFormData({
        name: '',
        category: '',
        manufacturer: '',
        pattern: '',
        year_manufactured: '',
        purchase_price: '',
        current_value: '',
        location: '',
        description: '',
        condition: 'good',
        quantity: '1',
      });
    }
  }, [item, user?.id]);

  const [photo, setPhoto] = useState<File | null>(null);
   const [photoPreview, setPhotoPreview] = useState(item?.photo_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [allCategories, setAllCategories] = useState(getAllCategories(user?.id));
  const [allConditions, setAllConditions] = useState(getAllConditions(user?.id));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Update categories and conditions when user changes
  useEffect(() => {
    setAllCategories(getAllCategories(user?.id));
    setAllConditions(getAllConditions(user?.id));
  }, [user?.id]);

  // Cleanup camera stream when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCameraModal(false);
  };

  const flipCamera = async () => {
    const newFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(newFacing);
    
    // Restart camera with new facing mode
    if (stream) {
      await startCamera();
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setPhoto(file);
        
        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        
        // Close camera modal
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  };

  const handleCameraClick = async () => {
    setShowCameraOptions(false);
    setShowCameraModal(true);
    await startCamera();
  };
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setShowCameraOptions(false);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setShowCameraOptions(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate quantity
    const quantity = formData.quantity.trim();
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) < 1 || !Number.isInteger(Number(quantity))) {
      setError('Quantity must be a whole number greater than 0');
      setLoading(false);
      return;
    }

    try {
      let photoUrl = item?.photo_url || null;

      // Handle photo upload
      if (photo) {
        const tempId = item?.id || `temp_${Date.now()}`;
        console.log('Starting photo upload process for:', tempId);
        const { data: uploadedUrl, error: uploadError } = await uploadPhoto(photo, tempId);
        if (uploadError) {
          console.error('Photo upload failed:', uploadError);
          console.log('Continuing with item save despite photo upload failure');
        } else if (uploadedUrl) {
          photoUrl = uploadedUrl;
          console.log('Photo upload successful, URL:', uploadedUrl);
        }
      }

      const itemData = {
        ...formData,
        category: categoryNameToId(formData.category),
        condition: formData.condition as 'excellent' | 'very_good' | 'good' | 'fair' | 'poor',
        year_manufactured: formData.year_manufactured && formData.year_manufactured.toString().trim() !== '' 
          ? Number(formData.year_manufactured) 
          : null,
        purchase_price: formData.purchase_price ? Number(formData.purchase_price) : 0,
        current_value: formData.current_value ? Number(formData.current_value) : 0,
        quantity: Number(formData.quantity),
        photo_url: photoUrl,
      };

      let result;
      if (item) {
        // For existing items, handle photo upload after update if needed
        if (photo && !photoUrl) {
          const { data: uploadedUrl, error: uploadError } = await uploadPhoto(photo, item.id);
          if (!uploadError && uploadedUrl) {
            itemData.photo_url = uploadedUrl;
          }
        }
        // Use the updateItem function from useInventory hook
        result = await updateItem(item.id, itemData);
      } else {
        // For new items, create first then upload photo if storage is available
        result = await addItem(itemData);
        if (result?.data && photo && !photoUrl) {
          const { data: uploadedUrl, error: uploadError } = await uploadPhoto(photo, result.data.id);
          if (!uploadError && uploadedUrl) {
            await updateItem(result.data.id, { photo_url: uploadedUrl });
          }
        }
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      // Force refresh the inventory list to show changes immediately
      await refreshItems();
      
      onClose();
      
    } catch (err: any) {
      console.error('Error saving item:', err);
      if (err.message && err.message.includes('User has reached the maximum of 10 records')) {
        setError('You have reached the maximum item limit for your current plan. Please upgrade your subscription to add more items.');
        setShowErrorModal(true);
      } else {
        setError(err.message || 'An error occurred while saving the item');
        setShowErrorModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {item ? 'Edit Item' : 'Add New Item'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Photo
            </label>
            <div className="flex items-center gap-4">
              {photoPreview && (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setPhotoPreview('');
                      setShowCameraOptions(false);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                      if (cameraInputRef.current) cameraInputRef.current.value = '';
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCameraOptions(!showCameraOptions)}
                  className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Photo
                </button>
                
                {showCameraOptions && (
                  <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[200px]">
                    <button
                      type="button"
                      onClick={handleCameraClick}
                      className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-600"
                    >
                      <Camera className="h-4 w-4 mr-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-gray-700 dark:text-gray-300">Take Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowCameraOptions(false);
                      }}
                      className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Upload className="h-4 w-4 mr-3 text-green-600 dark:text-green-400" />
                      <span className="text-gray-700 dark:text-gray-300">Choose from Gallery</span>
                    </button>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
              />
            </div>
            {showCameraOptions && (
              <div 
                className="fixed inset-0 z-5"
                onClick={() => setShowCameraOptions(false)}
              />
            )}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter item name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a category</option>
                {allCategories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Manufacturer
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Anchor Hocking, Fire-King"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pattern
              </label>
              <input
                type="text"
                value={formData.pattern}
                onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="Pattern name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Year Manufactured
              </label>
              <input
                type="number"
                value={formData.year_manufactured}
                onChange={(e) => setFormData({ ...formData, year_manufactured: e.target.value })}
                min="1800"
                max={new Date().getFullYear()}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 1950"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Purchase Price ($)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={formData.purchase_price}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  setFormData({ ...formData, purchase_price: value });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter price"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Value ($)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={formData.current_value}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  setFormData({ ...formData, current_value: value });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter value"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Condition
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              >
                {allConditions.map((condition) => (
                  <option key={condition.id} value={condition.id}>
                    {condition.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantity
              </label>
              <input
                type="text"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 3"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Display cabinet, Storage room"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Enter item description..."
            />
          </div>

          {/* Sticky Actions */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 -mx-6 -mb-6 flex gap-3">
            <button
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg transition-colors font-medium"
            >
              {loading ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
            </button>
          </div>
          </form>
        </div>
      </div>

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full mr-3">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Error
                </h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {error}
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Take Photo
              </h3>
              <button
                onClick={stopCamera}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={flipCamera}
                  className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Flip Camera
                </button>
                
                <button
                  onClick={capturePhoto}
                  className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Capture Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};