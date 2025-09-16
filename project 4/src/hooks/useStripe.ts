import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

export interface StripeSubscription {
  customer_id: string;
  subscription_id: string | null;
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export const useStripe = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, session, useOfflineMode } = useAuth();

  const createCheckoutSession = async (priceId: string, mode: 'subscription' | 'payment' = 'subscription') => {
    setLoading(true);
    setError(null);

    try {
      if (!stripePromise) {
        throw new Error('Stripe is not configured. Please check your environment variables.');
      }

      if (!session?.access_token) {
        throw new Error('Authentication required');
      }


      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: priceId,
          mode,
          success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/subscription`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSubscription = async (): Promise<StripeSubscription | null> => {
    // If we're in offline mode, return default state immediately
    if (useOfflineMode) {
      console.log('🔄 Using offline mode - returning default subscription state');
      return {
        customer_id: '',
        subscription_id: null,
        subscription_status: 'not_started',
        price_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
      };
    }

    // Ensure user is authenticated before attempting to fetch
    if (!user) {
      console.log('👤 No authenticated user - returning default subscription state');
      return {
        customer_id: '',
        subscription_id: null,
        subscription_status: 'not_started',
        price_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
      };
    }
    try {
      console.log('🔍 Attempting to fetch subscription data...');
      
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('stripe_subscriptions')
        .select('*')
        .maybeSingle();

      if (subscriptionError) {
        console.error('❌ Supabase subscription error:', subscriptionError);
        
        // If table doesn't exist, return null gracefully
        if (subscriptionError.code === 'PGRST116' || 
            subscriptionError.message?.includes('does not exist') || 
            subscriptionError.message?.includes('schema cache')) {
          console.log('💡 Stripe subscriptions table not found - this is normal if Stripe is not set up yet');
          return null;
        }
        // Return default state for other errors
        console.log('🔄 Returning default state due to subscription error');
        return {
          customer_id: '',
          subscription_id: null,
          subscription_status: 'not_started',
          price_id: null,
          current_period_start: null,
          current_period_end: null,
          cancel_at_period_end: false,
          payment_method_brand: null,
          payment_method_last4: null,
        };
      }

      console.log('✅ Successfully fetched subscription data:', subscriptionData);

      // If no subscription data found, check if user has any subscription record
      if (!subscriptionData) {
        console.log('📋 No subscription data found, checking customer record...');
        
        const { data: customerData, error: customerError } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .maybeSingle();

        if (customerError && customerError.code !== 'PGRST116') {
          console.error('❌ Error checking customer data:', customerError);
        }
        
        console.log('👤 Customer data:', customerData);
        
        // Return a default "no subscription" state
        return {
          customer_id: customerData?.customer_id || '',
          subscription_id: null,
          subscription_status: 'not_started',
          price_id: null,
          current_period_start: null,
          current_period_end: null,
          cancel_at_period_end: false,
          payment_method_brand: null,
          payment_method_last4: null,
        };
      }

      return {
        customer_id: subscriptionData.customer_id,
        subscription_id: subscriptionData.subscription_id,
        subscription_status: subscriptionData.status,
        price_id: subscriptionData.price_id,
        current_period_start: subscriptionData.current_period_start,
        current_period_end: subscriptionData.current_period_end,
        cancel_at_period_end: subscriptionData.cancel_at_period_end,
        payment_method_brand: subscriptionData.payment_method_brand,
        payment_method_last4: subscriptionData.payment_method_last4,
      };
    } catch (err: any) {
      console.error('❌ Subscription error:', err);
      
      // Always return default state on any error
      return {
        customer_id: '',
        subscription_id: null,
        subscription_status: 'not_started',
        price_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
      };
    }
  };

  return {
    createCheckoutSession,
    getSubscription,
    loading,
    error,
  };
};