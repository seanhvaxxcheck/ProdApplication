/*
  # Fix archived inventory function query condition

  1. Changes
    - Update sp_get_user_archived_inventory to return deleted items (deleted = 1)
    - Currently it's returning active items (deleted = 0) which is incorrect
    - Add deleted column to return table structure

  2. Security
    - Maintains existing RLS through user_id filtering
*/

create or replace function public.sp_get_user_archived_inventory(p_user_id uuid)
returns table (
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
    deleted integer,
    created_at timestamptz,
    updated_at timestamptz
)
language plpgsql
as $$
begin
    return query
    select 
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
        i.deleted,
        i.created_at,
        i.updated_at
    from public.inventory_items i 
    where i.user_id = p_user_id
      and coalesce(i.deleted, 0) = 1  -- Changed from = 0 to = 1 to get deleted items
    order by i.created_at desc;
end;
$$;