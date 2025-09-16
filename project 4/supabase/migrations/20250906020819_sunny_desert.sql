/*
  # Create sp_insert_inventory stored procedure

  1. New Functions
    - `sp_insert_inventory` - Stored procedure to insert inventory items
      - Handles text to integer conversion for year_manufactured
      - Maps location_id parameter to location column
      - Returns the complete inserted record
  
  2. Security
    - Grant execute permissions to authenticated users
    - Uses SECURITY DEFINER for proper access control
*/

CREATE OR REPLACE FUNCTION public.sp_insert_inventory(
    p_item_name text,
    p_category_id text,
    p_manufacturer text,
    p_pattern text,
    p_year text, -- Received as text, convert to integer or null
    p_purchase_price numeric,
    p_current_value numeric,
    p_condition_id text,
    p_description text,
    p_user_id uuid,
    p_photo_url text,
    p_location_id text -- This maps to 'location' column in table
)
RETURNS public.inventory_items -- Return the newly inserted row type
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_item public.inventory_items;
    parsed_year integer;
BEGIN
    -- Convert p_year to integer, handling empty string or non-numeric input
    IF p_year IS NOT NULL AND p_year != '' AND p_year ~ '^[0-9]+$' THEN
        parsed_year := p_year::integer;
    ELSE
        parsed_year := NULL;
    END IF;

    INSERT INTO public.inventory_items (
        user_id,
        category,
        name,
        manufacturer,
        pattern,
        year_manufactured,
        purchase_price,
        current_value,
        location,
        description,
        condition,
        photo_url
    )
    VALUES (
        p_user_id,
        CASE 
            WHEN p_category_id = '1' THEN 'milk_glass'
            WHEN p_category_id = '2' THEN 'jadite'
            ELSE 'milk_glass'
        END,
        p_item_name,
        COALESCE(p_manufacturer, ''),
        COALESCE(p_pattern, ''),
        parsed_year,
        COALESCE(p_purchase_price, 0),
        COALESCE(p_current_value, 0),
        COALESCE(p_location_id, ''),
        COALESCE(p_description, ''),
        CASE 
            WHEN p_condition_id = '1' THEN 'excellent'
            WHEN p_condition_id = '2' THEN 'very_good'
            WHEN p_condition_id = '3' THEN 'good'
            WHEN p_condition_id = '4' THEN 'fair'
            WHEN p_condition_id = '5' THEN 'poor'
            ELSE 'good'
        END,
        COALESCE(p_photo_url, '')
    )
    RETURNING * INTO new_item;

    RETURN new_item;
END;
$$;

-- Grant execution permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.sp_insert_inventory TO authenticated;