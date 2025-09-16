/*
  # Create wishlist tables

  1. New Tables
    - `wishlist_items`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `item_name` (text, user's reference name)
      - `ebay_search_term` (text, keywords for eBay searches)
      - `facebook_marketplace_url` (text, URL for reference)
      - `desired_price_max` (numeric, optional price alert threshold)
      - `status` (text, tracking status)
      - `last_checked_at` (timestamp, last monitoring check)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `found_listings`
      - `id` (uuid, primary key)
      - `wishlist_item_id` (uuid, foreign key to wishlist_items)
      - `platform` (text, 'ebay' or 'facebook')
      - `listing_title` (text)
      - `listing_price` (numeric)
      - `listing_url` (text)
      - `listing_image_url` (text, optional)
      - `found_at` (timestamp)
      - `notified` (boolean, whether user was notified)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create wishlist_items table
CREATE TABLE IF NOT EXISTS wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  ebay_search_term text DEFAULT '',
  facebook_marketplace_url text DEFAULT '',
  desired_price_max numeric(10,2) DEFAULT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'found')),
  last_checked_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create found_listings table
CREATE TABLE IF NOT EXISTS found_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_item_id uuid NOT NULL REFERENCES wishlist_items(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('ebay', 'facebook')),
  listing_title text NOT NULL,
  listing_price numeric(10,2) NOT NULL,
  listing_url text NOT NULL,
  listing_image_url text DEFAULT NULL,
  found_at timestamptz DEFAULT now(),
  notified boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE found_listings ENABLE ROW LEVEL SECURITY;

-- Create policies for wishlist_items
CREATE POLICY "Users can read own wishlist items"
  ON wishlist_items
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own wishlist items"
  ON wishlist_items
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own wishlist items"
  ON wishlist_items
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own wishlist items"
  ON wishlist_items
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for found_listings
CREATE POLICY "Users can read found listings for their wishlist items"
  ON found_listings
  FOR SELECT
  TO authenticated
  USING (
    wishlist_item_id IN (
      SELECT id FROM wishlist_items WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert found listings"
  ON found_listings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    wishlist_item_id IN (
      SELECT id FROM wishlist_items WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update found listings for their items"
  ON found_listings
  FOR UPDATE
  TO authenticated
  USING (
    wishlist_item_id IN (
      SELECT id FROM wishlist_items WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_status ON wishlist_items(status);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_last_checked ON wishlist_items(last_checked_at);
CREATE INDEX IF NOT EXISTS idx_found_listings_wishlist_item_id ON found_listings(wishlist_item_id);
CREATE INDEX IF NOT EXISTS idx_found_listings_found_at ON found_listings(found_at DESC);