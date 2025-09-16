/*
  # Fix stored procedure column count mismatch

  1. Updates
    - Fix `sp_get_user_inventory` function to explicitly select only the 15 columns defined in the returns table clause
    - Exclude the `deleted` column from the SELECT statement to match the function signature
  
  2. Security
    - Maintains existing RLS filtering logic
    - Preserves user isolation by filtering on user_id
*/

CREATE OR REPLACE FUNCTION public.sp_get_user_inventory(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    category text,
    name text,
    manufacturer text,
    pattern text,
    year_manufactured integer,
    purchase_price numeric(10,2),
    current_value numeric(10,2),
    location text,
    description text,
    condition text,
    photo_url text,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.user_id,
        i.category,
        i.name,
        i.manufacturer,
        i.pattern,
        i.year_manufactured,
        i.purchase_price,
        i.current_value,
        i.location,
        i.description,
        i.condition,
        i.photo_url,
        i.created_at,
        i.updated_at
    FROM public.inventory_items i 
    WHERE i.user_id = p_user_id
    AND COALESCE(i.deleted, 0) != 1 
    ORDER BY i.created_at DESC;
END;
$$;