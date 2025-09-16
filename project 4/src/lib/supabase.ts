import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging for environment variables
console.log('=== SUPABASE CONFIG DEBUG ===');
console.log('VITE_SUPABASE_URL:', supabaseUrl);
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined');
console.log('==============================');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due';
          subscription_tier: 'basic' | 'premium' | 'professional';
          subscription_expires_at: string | null;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'past_due';
          subscription_tier?: 'basic' | 'premium' | 'professional';
          subscription_expires_at?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'past_due';
          subscription_tier?: 'basic' | 'premium' | 'professional';
          subscription_expires_at?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          item_name: string;
          manufacturer: string;
          pattern: string;
          year_manufactured: number | null;
          purchase_price: number;
          current_value: number;
          location: string;
          description: string;
          condition_id: string;
          photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          item_name: string;
          manufacturer?: string;
          pattern?: string;
          year_manufactured?: number | null;
          purchase_price?: number;
          current_value?: number;
          location?: string;
          description?: string;
          condition_id?: string;
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          item_name?: string;
          manufacturer?: string;
          pattern?: string;
          year_manufactured?: number | null;
          purchase_price?: number;
          current_value?: number;
          location?: string;
          description?: string;
          condition_id?: string;
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      wishlist_items: {
        Row: {
          id: string;
          user_id: string;
          item_name: string;
          ebay_search_term: string;
          facebook_marketplace_url: string;
          desired_price_max: number | null;
          status: 'active' | 'paused' | 'found';
          last_checked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_name: string;
          ebay_search_term?: string;
          facebook_marketplace_url?: string;
          desired_price_max?: number | null;
          status?: 'active' | 'paused' | 'found';
          last_checked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_name?: string;
          ebay_search_term?: string;
          facebook_marketplace_url?: string;
          desired_price_max?: number | null;
          status?: 'active' | 'paused' | 'found';
          last_checked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      found_listings: {
        Row: {
          id: string;
          wishlist_item_id: string;
          platform: 'ebay' | 'facebook';
          listing_title: string;
          listing_price: number;
          listing_url: string;
          listing_image_url: string | null;
          found_at: string;
          notified: boolean;
        };
        Insert: {
          id?: string;
          wishlist_item_id: string;
          platform: 'ebay' | 'facebook';
          listing_title: string;
          listing_price: number;
          listing_url: string;
          listing_image_url?: string | null;
          found_at?: string;
          notified?: boolean;
        };
        Update: {
          id?: string;
          wishlist_item_id?: string;
          platform?: 'ebay' | 'facebook';
          listing_title?: string;
          listing_price?: number;
          listing_url?: string;
          listing_image_url?: string | null;
          found_at?: string;
          notified?: boolean;
        };
      };
      stripe_subscriptions: {
        Row: {
          id: number;
          customer_id: string;
          subscription_id: string | null;
          price_id: string | null;
          current_period_start: number | null;
          current_period_end: number | null;
          cancel_at_period_end: boolean;
          payment_method_brand: string | null;
          payment_method_last4: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          customer_id: string;
          subscription_id?: string | null;
          price_id?: string | null;
          current_period_start?: number | null;
          current_period_end?: number | null;
          cancel_at_period_end?: boolean;
          payment_method_brand?: string | null;
          payment_method_last4?: string | null;
          status: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: number;
          customer_id?: string;
          subscription_id?: string | null;
          price_id?: string | null;
          current_period_start?: number | null;
          current_period_end?: number | null;
          cancel_at_period_end?: boolean;
          payment_method_brand?: string | null;
          payment_method_last4?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
    };
  };
};