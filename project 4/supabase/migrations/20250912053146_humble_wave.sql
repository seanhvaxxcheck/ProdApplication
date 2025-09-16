/*
  # Remove condition check constraint

  1. Changes
    - Remove the check constraint on inventory_items.condition column
    - This allows custom conditions to be stored in the database

  2. Security
    - Application-level validation will handle condition values
    - Custom conditions are managed through the UI
*/

-- Remove the condition check constraint
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_condition_check;