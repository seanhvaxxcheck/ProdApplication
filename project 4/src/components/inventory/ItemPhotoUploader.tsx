import React, { useState, useRef } from 'react';
import { Upload, X, Camera, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ItemPhotoUploaderProps {
  inventoryId: string;
  userId: string;
  onPhotosUploaded: (photoUrls: string[]) => void;
  maxPhotos?: number;
}

interface PhotoUpload {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  publicUrl?: string;
}

export const ItemPhotoUploader: React.FC<ItemPhotoUploaderProps> = ({
  inventoryId,
  userId,
  onPhotosUploaded,
  maxPhotos = 10
}) => {
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [showUploadOptions, setShowUploadOptions] = useState(false);

  const handleFileSelection = (files: FileList | null) => {
    if (!files) return;

    const newPhotos: PhotoUpload[] = [];
    const remainingSlots = maxPhotos - photos.length;
    const filesToProcess = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        continue;
      }

      const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const preview = URL.createObjectURL(file);

      newPhotos.push({
        id: photoId,
        file,
        preview,
        status: 'pending'
      });
    }

    setPhotos(prev => [...prev, ...newPhotos]);
    setShowUploadOptions(false);
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prev => {
      const photoToRemove = prev.find(p => p.id === photoId);
      if (photoToRemove?.preview) {
        URL.revokeObjectURL(photoToRemove.preview);
      }
      return prev.filter(p => p.id !== photoId);
    });
  };

  const uploadSinglePhoto = async (photo: PhotoUpload): Promise<string | null> => {
    try {
      // Update status to uploading
      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? { ...p, status: 'uploading' as const } : p
      ));

      // Generate file path
      const fileExt = photo.file.name.split('.').pop();
      const fileName = `${inventoryId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      console.log('Uploading photo to path:', filePath);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('item-photos')
        .upload(filePath, photo.file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('item-photos')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('Generated public URL:', publicUrl);

      // Insert into database
      const { error: dbError } = await supabase
        .from('inventory_photos')
        .insert({
          inventory_id: inventoryId,
          user_id: userId,
          photo_url: publicUrl
        });

      if (dbError) {
        console.error('Database insert error:', dbError);
        // Try to clean up uploaded file
        await supabase.storage
          .from('item-photos')
          .remove([filePath]);
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Update status to success
      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? { 
          ...p, 
          status: 'success' as const, 
          publicUrl 
        } : p
      ));

      return publicUrl;
    } catch (error: any) {
      console.error('Photo upload failed:', error);
      
      // Update status to error
      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? { 
          ...p, 
          status: 'error' as const, 
          error: error.message 
        } : p
      ));

      return null;
    }
  };

  const uploadAllPhotos = async () => {
    const pendingPhotos = photos.filter(p => p.status === 'pending');
    if (pendingPhotos.length === 0) return;

    setIsUploading(true);

    try {
      const uploadPromises = pendingPhotos.map(photo => uploadSinglePhoto(photo));
      const results = await Promise.all(uploadPromises);
      
      // Filter out failed uploads and get successful URLs
      const successfulUrls = results.filter((url): url is string => url !== null);
      
      // Notify parent component
      if (successfulUrls.length > 0) {
        onPhotosUploaded(successfulUrls);
      }

      console.log(`Upload complete: ${successfulUrls.length}/${pendingPhotos.length} photos uploaded successfully`);
    } catch (error) {
      console.error('Batch upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: PhotoUpload['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const pendingCount = photos.filter(p => p.status === 'pending').length;
  const successCount = photos.filter(p => p.status === 'success').length;
  const errorCount = photos.filter(p => p.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Upload Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Item Photos
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload up to {maxPhotos} photos ({photos.length}/{maxPhotos} used)
          </p>
        </div>

        {photos.length < maxPhotos && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUploadOptions(!showUploadOptions)}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Add Photos
            </button>

            {showUploadOptions && (
              <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[200px]">
                <button
                  type="button"
                  onClick={() => {
                    cameraInputRef.current?.click();
                    setShowUploadOptions(false);
                  }}
                  className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-600"
                >
                  <Camera className="h-4 w-4 mr-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-700 dark:text-gray-300">Take Photos</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowUploadOptions(false);
                  }}
                  className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Upload className="h-4 w-4 mr-3 text-green-600 dark:text-green-400" />
                  <span className="text-gray-700 dark:text-gray-300">Choose from Gallery</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelection(e.target.files)}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={(e) => handleFileSelection(e.target.files)}
        className="hidden"
      />

      {/* Upload Status */}
      {photos.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {successCount > 0 && (
              <span className="text-green-600 dark:text-green-400 mr-4">
                ✓ {successCount} uploaded
              </span>
            )}
            {errorCount > 0 && (
              <span className="text-red-600 dark:text-red-400 mr-4">
                ✗ {errorCount} failed
              </span>
            )}
            {pendingCount > 0 && (
              <span className="text-gray-600 dark:text-gray-400">
                {pendingCount} pending
              </span>
            )}
          </div>

          {pendingCount > 0 && (
            <button
              onClick={uploadAllPhotos}
              disabled={isUploading}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors text-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {pendingCount} Photo{pendingCount !== 1 ? 's' : ''}
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Photo Previews Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden aspect-square"
            >
              <img
                src={photo.preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              
              {/* Status Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(photo.status)}
                  <span className="text-white text-sm capitalize">
                    {photo.status}
                  </span>
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>

              {/* Error Message */}
              {photo.status === 'error' && photo.error && (
                <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-2">
                  {photo.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close upload options */}
      {showUploadOptions && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setShowUploadOptions(false)}
        />
      )}
    </div>
  );
};