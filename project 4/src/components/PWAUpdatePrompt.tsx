import React from 'react';
import { RefreshCw, X } from 'lucide-react';

interface PWAUpdatePromptProps {
  isVisible: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export const PWAUpdatePrompt: React.FC<PWAUpdatePromptProps> = ({
  isVisible,
  onUpdate,
  onDismiss,
}) => {
  // Don't show update prompt in StackBlitz/WebContainer environments
  if (typeof window !== 'undefined' && window.location.hostname.includes('webcontainer')) {
    return null;
  }
  
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-up">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg mr-3">
              <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                Update Available
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                A new version is ready
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors"
          >
            <X className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onDismiss}
            className="flex-1 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
          >
            Later
          </button>
          <button
            onClick={onUpdate}
            className="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Update Now
          </button>
        </div>
      </div>
    </div>
  );
};