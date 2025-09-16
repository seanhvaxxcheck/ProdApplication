import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Package, Crown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStripe } from '../../hooks/useStripe';
import { getProductByPriceId } from '../../stripe-config';

interface SuccessPageProps {
  onNavigate: (page: string) => void; 
}

export const SuccessPage: React.FC<SuccessPageProps> = ({ onNavigate }) => {
  const { profile } = useAuth();
  const { getSubscription } = useStripe();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const subData = await getSubscription();
        setSubscription(subData);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const subscribedProduct = subscription?.price_id ? getProductByPriceId(subscription.price_id) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to MyGlassCase!
          </h1>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your subscription has been successfully activated. You're now ready to start managing your collection.
          </p>

          {subscribedProduct && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <Crown className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                <span className="font-semibold text-green-800 dark:text-green-200">
                  {subscribedProduct.name} Plan Active
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                {subscribedProduct.itemLimit === -1 
                  ? 'Unlimited items' 
                  : `Track up to ${subscribedProduct.itemLimit} items`}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => onNavigate('inventory')}
              className="w-full flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            >
              <Package className="h-5 w-5 mr-2" />
              Start Adding Items
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Need help getting started? Check out our{' '}
              <button
                onClick={() => onNavigate('settings')}
                className="text-green-600 dark:text-green-400 hover:underline"
              >
                settings page
              </button>
              {' '}for more options.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};