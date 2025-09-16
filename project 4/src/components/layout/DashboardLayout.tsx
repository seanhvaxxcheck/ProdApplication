import React, { useState } from 'react';
import { 
  Package, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Moon, 
  Sun,
  Crown,
  BarChart3,
  Heart,
  Home,
  Plus,
  Search,
  Bell
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useStripe } from '../../hooks/useStripe';
import { getProductByPriceId } from '../../stripe-config';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  currentPage, 
  onPageChange 
}) => {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { getSubscription } = useStripe();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  const subscribedProduct = subscription?.price_id ? getProductByPriceId(subscription.price_id) : null;

  const navigation = [
    { name: 'Home', id: 'dashboard', icon: Home },
    { name: 'Collection', id: 'inventory', icon: Package },
    { name: 'Wishlist', id: 'wishlist', icon: Heart },
    { name: 'Settings', id: 'settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    try {
      console.log('Sign out button clicked');
      await signOut();
      console.log('Sign out completed');
    } catch (error) {
      console.error('Sign out error in layout:', error);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Pinterest-style Top Navigation */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <div className="flex items-center">
                <img 
                  src="/icons/F11E94A8-7D46-41AA-B474-B6848FC8F2F9.PNG"
                  alt="MyGlassCase Logo"
                  className="h-8 w-8 mr-3"
                />
                <h1 className="text-xl font-bold text-green-500">MyGlassCase</h1>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-1">
                {navigation.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onPageChange(item.id)}
                    className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      currentPage === item.id
                        ? 'bg-black text-white dark:bg-white dark:text-black'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Right side - Actions and Profile */}
            <div className="flex items-center space-x-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </button>

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => onPageChange('settings')}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {(profile?.full_name || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-80 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out md:hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Profile Section */}
              <div className="flex items-center space-x-4 mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                <div className="h-12 w-12 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {(profile?.full_name || 'U')[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-2 mb-8">
                {navigation.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onPageChange(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-2xl transition-colors ${
                      currentPage === item.id
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </button>
                ))}
              </nav>

              {/* Subscription Status */}
              {subscribedProduct ? (
                <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 mb-6">
                  <div className="flex items-center">
                    <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        {subscribedProduct.name} Plan
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Active subscription
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onPageChange('subscription');
                    setSidebarOpen(false);
                  }}
                  className="w-full p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-colors mb-6"
                >
                  <div className="flex items-center">
                    <Crown className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                    <div className="text-left">
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Upgrade Plan
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Get more features
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-4 py-3 text-left text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-2xl transition-colors"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-pb">
        <div className="flex items-center justify-around py-2">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex flex-col items-center justify-center p-3 min-w-0 flex-1 transition-colors ${
                currentPage === item.id
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <item.icon className={`h-6 w-6 mb-1 ${
                currentPage === item.id ? 'text-green-600 dark:text-green-400' : ''
              }`} />
              <span className={`text-xs font-medium truncate ${
                currentPage === item.id ? 'text-green-600 dark:text-green-400' : ''
              }`}>
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
};