import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ToastNotificationProps {
  isVisible: boolean;
  message: string;
  onClose: () => void;
  type?: 'success' | 'error';
  duration?: number;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  isVisible,
  message,
  onClose,
  type = 'success',
  duration = 3000,
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-up">
      <div className={`flex items-center p-4 rounded-lg shadow-lg border max-w-sm ${
        type === 'success' 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
      }`}>
        <div className="flex-shrink-0 mr-3">
          <CheckCircle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-3 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};