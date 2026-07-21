/**
 * Application Configuration
 * Centralized configuration for all environment variables and constants
 */

// API Configuration
export const API_CONFIG = {
  // Base URL for API requests
  baseURL: import.meta.env.VITE_API_BASE_URL ,
  
  // API version (if needed)
  version: 'v1',
  
  // Request timeout in milliseconds
  timeout: 30000,
  
  // Headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Application Environment
export const APP_ENV = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  environment: import.meta.env.MODE,
};

// Storage Keys
export const STORAGE_KEYS = {
  USER: 'nexus_user',
  TOKEN: 'nexus_token',
  THEME: 'nexus_theme',
  LANGUAGE: 'nexus_language',
};

// API Endpoints (for reference/constants)
export const API_ENDPOINTS = {
  // Sales
  SALES_ORDERS: '/sales-orders',
  CUSTOMERS: '/customers',
  
  // Purchase
  PURCHASE_ORDERS: '/purchase-orders',
  VENDORS: '/vendors',
  
  // Inventory
  PRODUCTS: '/products',
  INVENTORY_LOCATIONS: '/inventory-locations',
  PRODUCT_ALLOCATIONS: '/product-allocations',
  INVENTORY_MOVEMENTS: '/inventory-movements',
  
  // Tasks
  TASKS: '/tasks',
};

export default API_CONFIG;
