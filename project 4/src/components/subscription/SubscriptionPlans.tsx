import React, { useState } from 'react';
import { Check, Crown, Star, Zap, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStripe } from '../../hooks/useStripe';
import { stripeProducts } from '../../stripe-config'; 

interface SubscriptionPlansProps {
  onNavigate?: (page: string) => void;
  subscription?: any;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onNavigate, subscription }) => {
  const { profile, user, signOut } = useAuth();
  const { createCheckoutSession, loading, error } = useStripe();

  const getIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'basic':
        return <Star className="h-6 w-6" />;
      case 'pro':
        return <Crown className="h-6 w-6" />;
      case 'collector':
        return <Zap className="h-6 w-6" />;
      default:
        return <Star className="h-6 w-6" />;
    }
  };

  const handleSubscribe = async (priceId: string) => {
    await createCheckoutSession(priceId, 'subscription');
  };

  const isCurrentPlan = (priceId: string) => {
    return subscription?.price_id === priceId;
  };

  const handleBackToLogin = async () => {
    // Always sign out when "Back to Login" is clicked
    await signOut();
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleBackToLogin}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </button>
        </div>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Select the perfect plan for your collection. Upgrade or downgrade anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {stripeProducts.map((plan) => (
            <div
              disabled={loading || isCurrentPlan(plan.priceId) || plan.price === 0}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 transition-all duration-300 hover:scale-105 ${
                plan.popular
                  ? 'border-green-500 ring-2 ring-green-200 dark:ring-green-800'
                  : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                <div className="flex items-center justify-center mb-4">
                  <div className={`p-3 rounded-full ${
                    plan.popular 
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {getIcon(plan.name)}
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                  {plan.name}
                </h3>

                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300 ml-1">
                    /{plan.interval || 'month'}
                  </span>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.priceId)}
                  disabled={loading || isCurrentPlan(plan.priceId) || !user}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors duration-200 ${
                    plan.popular
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </div>
                  ) : !user ? (
                    'Please Sign In'
                  ) : isCurrentPlan(plan.priceId) ? (
                    'Current Plan'
                  ) : (
                    'Get Started'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="max-w-md mx-auto mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-400">
            Free plans include up to 10 items.
          </p>
        </div>
      </div>
    </div>
  );
};