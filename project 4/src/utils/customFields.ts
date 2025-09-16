// Utility functions for managing custom categories and conditions

export interface CustomField {
  id: string;
  name: string;
  isDefault: boolean;
}

// Default categories
export const DEFAULT_CATEGORIES: CustomField[] = [
  { id: 'milk_glass', name: 'Milk Glass', isDefault: true },
  { id: 'jadite', name: 'Jadite', isDefault: true },
  { id: 'blue_glass', name: 'Blue Glass', isDefault: true },
];

// Default conditions
export const DEFAULT_CONDITIONS: CustomField[] = [
  { id: 'excellent', name: 'Excellent', isDefault: true },
  { id: 'very_good', name: 'Very Good', isDefault: true },
  { id: 'good', name: 'Good', isDefault: true },
  { id: 'fair', name: 'Fair', isDefault: true },
  { id: 'poor', name: 'Poor', isDefault: true },
];

// Get custom categories from localStorage
export const getCustomCategories = (userId?: string): string[] => {
  if (!userId) return [];
  try {
    const stored = localStorage.getItem(`custom_categories_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Get deleted default categories from localStorage
export const getDeletedDefaultCategories = (userId?: string): string[] => {
  if (!userId) return [];
  try {
    const stored = localStorage.getItem(`deleted_default_categories_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save deleted default categories to localStorage
export const saveDeletedDefaultCategories = (deletedCategories: string[], userId?: string): void => {
  if (!userId) return;
  try {
    localStorage.setItem(`deleted_default_categories_${userId}`, JSON.stringify(deletedCategories));
  } catch (error) {
    console.error('Failed to save deleted default categories:', error);
  }
};
// Save custom categories to localStorage
export const saveCustomCategories = (categories: string[], userId?: string): void => {
  if (!userId) return;
  try {
    localStorage.setItem(`custom_categories_${userId}`, JSON.stringify(categories));
  } catch (error) {
    console.error('Failed to save custom categories:', error);
  }
};

// Get custom conditions from localStorage
export const getCustomConditions = (userId?: string): string[] => {
  if (!userId) return [];
  try {
    const stored = localStorage.getItem(`custom_conditions_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Get deleted default conditions from localStorage
export const getDeletedDefaultConditions = (userId?: string): string[] => {
  if (!userId) return [];
  try {
    const stored = localStorage.getItem(`deleted_default_conditions_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save deleted default conditions to localStorage
export const saveDeletedDefaultConditions = (deletedConditions: string[], userId?: string): void => {
  if (!userId) return;
  try {
    localStorage.setItem(`deleted_default_conditions_${userId}`, JSON.stringify(deletedConditions));
  } catch (error) {
    console.error('Failed to save deleted default conditions:', error);
  }
};
// Save custom conditions to localStorage
export const saveCustomConditions = (conditions: string[], userId?: string): void => {
  if (!userId) return;
  try {
    localStorage.setItem(`custom_conditions_${userId}`, JSON.stringify(conditions));
  } catch (error) {
    console.error('Failed to save custom conditions:', error);
  }
};

// Get all categories (default + custom)
export const getAllCategories = (userId?: string): CustomField[] => {
  const deletedDefaults = getDeletedDefaultCategories(userId);
  const availableDefaults = DEFAULT_CATEGORIES.filter(cat => !deletedDefaults.includes(cat.name));
  const customCategories = getCustomCategories(userId);
  const customFields: CustomField[] = customCategories.map(name => ({
    id: name.toLowerCase().replace(/\s+/g, '_'),
    name,
    isDefault: false,
  }));
  
  return [...availableDefaults, ...customFields];
};

// Get all conditions (default + custom)
export const getAllConditions = (userId?: string): CustomField[] => {
  const deletedDefaults = getDeletedDefaultConditions(userId);
  const availableDefaults = DEFAULT_CONDITIONS.filter(cond => !deletedDefaults.includes(cond.name));
  const customConditions = getCustomConditions(userId);
  const customFields: CustomField[] = customConditions.map(name => ({
    id: name.toLowerCase().replace(/\s+/g, '_'),
    name,
    isDefault: false,
  }));
  
  return [...availableDefaults, ...customFields];
};

// Convert category name to ID format
export const categoryNameToId = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, '_');
};

// Convert category ID to display name
export const categoryIdToName = (id: string, userId?: string): string => {
  const allCategories = getAllCategories(userId);
  const category = allCategories.find(cat => cat.id === id);
  if (category) {
    return category.name;
  }
  
  // Fallback: convert underscore format to title case
  return id.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

// Convert condition name to ID format
export const conditionNameToId = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, '_');
};

// Convert condition ID to display name
export const conditionIdToName = (id: string, userId?: string): string => {
  const allConditions = getAllConditions(userId);
  const condition = allConditions.find(cond => cond.id === id);
  return condition ? condition.name : id;
};