import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useStripe } from './hooks/useStripe';
import { AuthForm } from './components/auth/AuthForm';
import { SubscriptionPlans } from './components/subscription/SubscriptionPlans';
import { SuccessPage } from './components/subscription/SuccessPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardHome } from './components/dashboard/DashboardHome';
import { InventoryManager } from './components/inventory/InventoryManager';
import { WishlistPage } from './components/wishlist/WishlistPage';
import { ImportExportPage } from './components/import-export/ImportExportPage';
import { SettingsPage } from './components/settings/SettingsPage';
import SupabaseDebugInfo from './components/SupabaseDebugInfo';

const AppContent: React.FC = () => { 
  const { user, profile, loading } = useAuth();
  const { getSubscription } = useStripe();
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // Check for success page from URL params
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('session_id')) {
      setCurrentPage('success');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Check subscription status when user is authenticated
  React.useEffect(() => {
    const checkSubscription = async () => {
      if (user && profile && !subscription && !subscriptionLoading) {
        setSubscriptionLoading(true);
        try {
          const subData = await getSubscription();
          setSubscription(subData);
        } catch (error) {
          console.error('Error fetching subscription:', error);
          // Set default subscription state on error
          if (user?.email === 'sean.hoagland55@gmail.com') {
            setSubscription({ 
              subscription_status: 'active',
              price_id: 'price_1S3iyBCZfIVspKe9hG2VK67R' // Collector plan
            });
          } else {
            // For other users, set a basic subscription state so they can use the app
            setSubscription({ 
              subscription_status: 'active',
              price_id: 'price_1S5equCZfIVspKe98prCSSX2' // Starter plan
            });
          }
        } finally {
          setSubscriptionLoading(false);
        }
      }
    };

    checkSubscription();
  }, [user, profile, subscription, subscriptionLoading, getSubscription]);

  // Show update prompt when update is available
  React.useEffect(() => {
    // PWA update functionality disabled in this environment
  }, []);

  // Helper function to check if user has active subscription or is super admin
  const hasActiveSubscription = () => {
    // Check if user is super admin
    if (user?.email === 'sean.hoagland55@gmail.com') {
      return true;
    }
    
    if (!subscription) return false;
    
    const activeStatuses = ['active', 'trialing'];
    return activeStatuses.includes(subscription.subscription_status);
  };

  // Check if user needs to subscribe
  const needsSubscription = () => {
    // Super admin always has access
    if (user?.email === 'sean.hoagland55@gmail.com') {
      return false;
    }
    
    // If still loading subscription data, don't require subscription yet
    if (subscriptionLoading || !subscription) return false;
    
    const activeStatuses = ['active', 'trialing'];
    return !activeStatuses.includes(subscription.subscription_status);
  };

  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading MyGlassCase...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm mode={authMode} onModeChange={setAuthMode} />;
  }

  // If user is authenticated but needs subscription, show subscription plans
  if (user && needsSubscription() && currentPage !== 'subscription' && currentPage !== 'success') {
    return <SubscriptionPlans onNavigate={setCurrentPage} subscription={subscription} />;
  }


  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardHome onPageChange={setCurrentPage} />;
      case 'inventory':
        return <InventoryManager />;
      case 'wishlist':
        return <WishlistPage />;
      case 'import-export':
        return <ImportExportPage />;
      case 'settings':
        return <SettingsPage />;
      case 'subscription':
        return <SubscriptionPlans onNavigate={setCurrentPage} subscription={subscription} />;
      case 'success':
        return <SuccessPage onNavigate={setCurrentPage} />;
      case 'debug':
        return <SupabaseDebugInfo />;
      default:
        return <DashboardHome onPageChange={setCurrentPage} />;
    }
  };

  // Show subscription plans or success page without layout
  if (currentPage === 'subscription' || currentPage === 'success') {
    return renderPage();
  }

  return (
    <DashboardLayout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </DashboardLayout>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;