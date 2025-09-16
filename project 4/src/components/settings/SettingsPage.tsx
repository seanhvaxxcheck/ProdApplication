import React, { useState } from 'react';
import { User, CreditCard, Bell, Shield, Download, Trash2, Upload, FileText, Smartphone, Plus, Edit, LogOut, Monitor } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useInventory } from '../../hooks/useInventory';
import { useStripe } from '../../hooks/useStripe';
import { getProductByPriceId } from '../../stripe-config';
import { usePWA } from '../../hooks/usePWA';
import { 
  getCustomCategories, 
  saveCustomCategories, 
  getCustomConditions, 
  saveCustomConditions,
  getDeletedDefaultCategories,
  saveDeletedDefaultCategories,
  getDeletedDefaultConditions,
  saveDeletedDefaultConditions,
  DEFAULT_CATEGORIES,
  DEFAULT_CONDITIONS
} from '../../utils/customFields';
import { UpgradeModal } from '../subscription/UpgradeModal';

interface SettingsPageProps {
  onPageChange?: (page: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onPageChange }) => {
  const { profile, user, signOut } = useAuth();
  const { items } = useInventory();
  const { getSubscription } = useStripe();
  const { requestNotificationPermission, isInstalled } = usePWA();
  const [activeTab, setActiveTab] = useState('profile');
  const [subscription, setSubscription] = useState<any>(null);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customConditions, setCustomConditions] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [editingConditionIndex, setEditingConditionIndex] = useState<number | null>(null);
  const [editingConditionValue, setEditingConditionValue] = useState('');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Load deleted defaults
  const [deletedDefaultCategories, setDeletedDefaultCategories] = useState<string[]>([]);
  const [deletedDefaultConditions, setDeletedDefaultConditions] = useState<string[]>([]);

  // Load custom categories and conditions on component mount
  React.useEffect(() => {
    if (user) {
      setCustomCategories(getCustomCategories(user.id));
      setCustomConditions(getCustomConditions(user.id));
      setDeletedDefaultCategories(getDeletedDefaultCategories(user.id));
      setDeletedDefaultConditions(getDeletedDefaultConditions(user.id));
    }
  }, [user]);

  React.useEffect(() => {
    const fetchSubscription = async () => {
      if (user) {
        const subData = await getSubscription();
        setSubscription(subData);
      }
    };
    fetchSubscription();
  }, [user]);

  const subscribedProduct = subscription?.price_id ? getProductByPriceId(subscription.price_id) : null;

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'subscription', name: 'Subscription', icon: CreditCard },
    { id: 'categories', name: 'Categories & Conditions', icon: FileText },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'privacy', name: 'Privacy & Security', icon: Shield },
    { id: 'import-export', name: 'Import & Export', icon: Upload },
    { id: 'pwa', name: 'App Settings', icon: Smartphone },
  ];

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      const updatedCategories = [...customCategories, newCategory.trim()];
      setCustomCategories(updatedCategories);
      saveCustomCategories(updatedCategories, user?.id);
      setNewCategory('');
    }
  };

  const handleAddCondition = () => {
    if (newCondition.trim()) {
      const updatedConditions = [...customConditions, newCondition.trim()];
      setCustomConditions(updatedConditions);
      saveCustomConditions(updatedConditions, user?.id);
      setNewCondition('');
    }
  };

  const handleEditCategory = (index: number, value: string) => {
    setEditingCategoryIndex(index);
    setEditingCategoryValue(value);
  };

  const handleEditCondition = (index: number, value: string) => {
    setEditingConditionIndex(index);
    setEditingConditionValue(value);
  };

  const handleSaveCategory = (index: number) => {
    if (editingCategoryValue.trim()) {
      const updated = [...customCategories];
      updated[index] = editingCategoryValue.trim();
      setCustomCategories(updated);
      saveCustomCategories(updated, user?.id);
    }
    setEditingCategoryIndex(null);
    setEditingCategoryValue('');
  };

  const handleSaveCondition = (index: number) => {
    if (editingConditionValue.trim()) {
      const updated = [...customConditions];
      updated[index] = editingConditionValue.trim();
      setCustomConditions(updated);
      saveCustomConditions(updated, user?.id);
    }
    setEditingConditionIndex(null);
    setEditingConditionValue('');
  };

  const handleDeleteCategory = (index: number) => {
    const updated = customCategories.filter((_, i) => i !== index);
    setCustomCategories(updated);
    saveCustomCategories(updated, user?.id);
  };

  const handleDeleteCondition = (index: number) => {
    const updated = customConditions.filter((_, i) => i !== index);
    setCustomConditions(updated);
    saveCustomConditions(updated, user?.id);
  };

  const handleDeleteDefaultCategory = (categoryName: string) => {
    const updated = [...deletedDefaultCategories, categoryName];
    setDeletedDefaultCategories(updated);
    saveDeletedDefaultCategories(updated, user?.id);
  };

  const handleDeleteDefaultCondition = (conditionName: string) => {
    const updated = [...deletedDefaultConditions, conditionName];
    setDeletedDefaultConditions(updated);
    saveDeletedDefaultConditions(updated, user?.id);
  };

  const exportAllData = () => {
    const data = {
      profile,
      inventory: items,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collector-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = [
      'Name', 'Category', 'Manufacturer', 'Pattern', 'Year', 'Quantity',
      'Purchase Price', 'Current Value', 'Condition', 'Location', 'Description'
    ];
    
    const csvContent = [
      headers.join(','),
      ...items.map(item => [
        `"${item.name}"`,
        `"${item.category}"`,
        `"${item.manufacturer}"`,
        `"${item.pattern}"`,
        item.year_manufactured || '',
        item.quantity || 1,
        item.purchase_price,
        item.current_value,
        `"${item.condition}"`,
        `"${item.location}"`,
        `"${item.description}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collection-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const data = {
      collection: items,
      exportedAt: new Date().toISOString(),
      totalItems: items.length,
      categories: {
        milk_glass: items.filter(item => item.category === 'milk_glass').length,
        jadite: items.filter(item => item.category === 'jadite').length,
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collection-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleNotificationPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your account and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 w-full">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <tab.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                      <span className="text-left leading-tight">{tab.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
              
              {/* Logout Button */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={signOut}
                  className="w-full flex items-center px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span className="text-left leading-tight font-medium">Sign Out</span>
                </button>
              </div>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              
              {activeTab === 'profile' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Profile Information
                  </h2>
                  
                  {/* Profile Summary Card */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 mb-6 border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                          {(profile?.full_name || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {profile?.full_name || 'User'}
                        </h3>
                        <p className="text-green-600 dark:text-green-400">
                          {user?.email}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Member since {new Date(user?.created_at || '').toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Account Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {items.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Items in Collection
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        ${items.reduce((sum, item) => sum + (item.current_value * (item.quantity || 1)), 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total Collection Value
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {subscribedProduct?.name || 'Free'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Current Plan
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profile?.full_name || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white max-w-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white max-w-md"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'subscription' && (
                <div className="p-6 max-w-4xl">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Subscription Details
                  </h2>
                  <div className="space-y-4">
                    {subscribedProduct ? (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-green-800 dark:text-green-200">
                              {subscribedProduct.name} Plan
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400 capitalize">
                              Status: {subscription.subscription_status || 'active'}
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              ${subscribedProduct.price}/month
                            </p>
                          </div>
                          <button
                            onClick={() => setUpgradeModalOpen(true)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                          >
                            Upgrade Plan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-400">
                          You are currently on the free plan.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="p-6 space-y-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Notification Settings
                  </h2>
                  
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">
                        Email notifications for value changes
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">
                        Push notifications
                      </span>
                    </label>
                  </div>

                  {/* Logout Section */}
                </div>
              )}

              {activeTab === 'categories' && (
                <div className="p-6 space-y-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Categories & Conditions
                  </h2>
                  
                  {/* Categories Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Categories
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Manage your collection categories. Default categories cannot be deleted.
                    </p>
                    
                    <div className="space-y-3">
                      {/* Default Categories */}
                      {DEFAULT_CATEGORIES.filter(cat => !deletedDefaultCategories.includes(cat.name)).map((category) => (
                        <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center">
                            <span className="text-gray-900 dark:text-white">{category.name}</span>
                            <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                              Default
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteDefaultCategory(category.name)}
                              className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                              title="Delete this default category"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Custom Categories */}
                      {customCategories.map((category, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                          {editingCategoryIndex === index ? (
                            <input
                              type="text"
                              value={editingCategoryValue}
                              onChange={(e) => setEditingCategoryValue(e.target.value)}
                              onBlur={() => handleSaveCategory(index)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveCategory(index)}
                              className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                              autoFocus
                            />
                          ) : (
                            <span className="text-gray-900 dark:text-white">{category}</span>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditCategory(index, category)}
                              className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(index)}
                              className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add New Category */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                          placeholder="Enter new category name"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          onClick={handleAddCategory}
                          disabled={!newCategory.trim()}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Conditions Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Conditions
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Manage condition options for your items. Default conditions cannot be deleted.
                    </p>
                    
                    <div className="space-y-3">
                      {/* Default Conditions */}
                      {DEFAULT_CONDITIONS.filter(cond => !deletedDefaultConditions.includes(cond.name)).map((condition) => (
                        <div key={condition.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center">
                            <span className="text-gray-900 dark:text-white">{condition.name}</span>
                            <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                              Default
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteDefaultCondition(condition.name)}
                              className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                              title="Delete this default condition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Custom Conditions */}
                      {customConditions.map((condition, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                          {editingConditionIndex === index ? (
                            <input
                              type="text"
                              value={editingConditionValue}
                              onChange={(e) => setEditingConditionValue(e.target.value)}
                              onBlur={() => handleSaveCondition(index)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveCondition(index)}
                              className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                              autoFocus
                            />
                          ) : (
                            <span className="text-gray-900 dark:text-white">{condition}</span>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditCondition(index, condition)}
                              className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCondition(index)}
                              className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add New Condition */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCondition}
                          onChange={(e) => setNewCondition(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddCondition()}
                          placeholder="Enter new condition name"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          onClick={handleAddCondition}
                          disabled={!newCondition.trim()}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Privacy & Security
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Data Export
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Download a complete copy of your data including your profile and inventory.
                      </p>
                      <button
                        onClick={exportAllData}
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export My Data
                      </button>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-3">
                        Danger Zone
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <button className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'import-export' && (
                <div className="p-6 space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Import & Export Data
                  </h2>
                  
                  {/* Export Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Export Your Collection
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Download your collection data for backup or external use.
                    </p>
                    
                    <div className="space-y-3">
                      <button
                        onClick={exportToCSV}
                        className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                          <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-white">CSV Format</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Compatible with Excel and spreadsheet applications
                            </p>
                          </div>
                        </div>
                        <Download className="h-4 w-4 text-gray-400" />
                      </button>

                      <button
                        onClick={exportToJSON}
                        className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                          <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-white">JSON Format</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Complete backup with metadata for re-import
                            </p>
                          </div>
                        </div>
                        <Download className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature="subscription upgrade"
      />
    </div>
  );
};