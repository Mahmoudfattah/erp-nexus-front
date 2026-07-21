import React, { useState, useMemo, useEffect } from 'react';
import {
  Product,
  InventoryLocation,
  ProductAllocation,
  PurchaseOrder
} from '../types';
import {
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  Plus,
  X,
  BellRing,
  History,
  ShoppingBag,
  MapPin,
  Building,
  Package,
  TrendingUp,
  Tag,
  Palette,
  Building2,
  Calendar,
  Filter,
  Loader,
  Edit3,
  Trash2
} from 'lucide-react';
import { analyzeInventoryTrends, predictInventoryNeeds } from '../services/geminiService';
import { useLanguage } from './LanguageContext';
import { inventoryService } from '../api/inventoryService';

interface InventoryViewProps {
  inventory?: Product[];
  setInventory?: React.Dispatch<React.SetStateAction<Product[]>>;
  locations?: InventoryLocation[];
  setLocations?: React.Dispatch<React.SetStateAction<InventoryLocation[]>>;
  purchaseOrders?: PurchaseOrder[];
  user: User | null;
}

type ProductForm = {
  name: string;
  sku: string;
  category: string;
  brand: string;
  color: string;
  price: number;
  lowStockThreshold: number;
  locationAllocations: Record<string, number>;
  companyId?: number;
};

const InventoryView: React.FC<InventoryViewProps> = ({
  inventory: propInventory = [],
  setInventory: setPropInventory,
  locations: propLocations = [],
  setLocations: setPropLocations,
  purchaseOrders = [],
  user
}) => {
  const { t, language } = useLanguage();


 // =========== dynimac full company id ======

 const getUserId = (user: User | null): string => {
  if (!user) return '';
  
  // If role is an object with name property (from API)
  if (user.companyId ) {
    return  Number(user.companyId);
  }
  

};

 const companyId = getUserId(user) 



  // ========= Currency by Language =========
  const getCurrencyByLanguage = (lang: string) => {
    const l = (lang || '').toLowerCase();
    if (l.startsWith('es')) return { locale: 'es-ES', currency: 'EUR' };
    if (l.startsWith('ar')) return { locale: 'ar-EG', currency: 'EGP' };
    return { locale: 'en-US', currency: 'USD' };
  };

  const formatCurrency = (amount: number) => {
    const { locale, currency } = getCurrencyByLanguage(language);
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);
  };

  const emptyForm = (locs: InventoryLocation[] = []): ProductForm => ({
    name: '',
    sku: '',
    category: '',
    brand: '',
    color: '',
    price: 0,
    lowStockThreshold: 10,
    companyId: companyId,
    locationAllocations: Object.fromEntries(locs.map(l => [String(l.id), 0])),
  });

  // Local state to manage data
  const [inventory, setInventoryState] = useState<Product[]>(propInventory);
  const [locations, setLocationsState] = useState<InventoryLocation[]>(propLocations);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const data = await inventoryService.getProducts();
        const list = Array.isArray(data) ? data : [];
        setInventoryState(list);
        if (setPropInventory) setPropInventory(list);
      } catch (error: any) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [setPropInventory]);

  // Fetch locations from API
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoadingLocations(true);
        const data = await inventoryService.getLocations();
        const list = Array.isArray(data) ? data : [];
        setLocationsState(list);
        if (setPropLocations) setPropLocations(list);
      } catch (error: any) {
        console.error('Failed to fetch locations:', error);
      } finally {
        setIsLoadingLocations(false);
      }
    };

    fetchLocations();
  }, [setPropLocations]);

  const [viewMode, setViewMode] = useState<'products' | 'locations'>('products');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isForecasting, setIsForecasting] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [forecastReport, setForecastReport] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Add / Edit Item Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [skuSerial, setSkuSerial] = useState('0000');

  const [formData, setFormData] = useState<ProductForm>(() => emptyForm(propLocations));

  // Add / Edit Location Modal State
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<InventoryLocation | null>(null);
  const [newLocation, setNewLocation] = useState<Partial<InventoryLocation>>({
    name: '',
    address: '',
    description: '',
    code: '',
    status: 'Active',
  });

  // History/Details Modal State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'history' | 'purchases'>('history');

  // Forecast Modal State
  const [isForecastModalOpen, setIsForecastModalOpen] = useState(false);

  // Keep allocations keys synced with locations while modal open
  useEffect(() => {
    if (!isModalOpen) return;

    setFormData(prev => {
      const merged = { ...(prev.locationAllocations || {}) };

      // add new locations with 0
      locations.forEach(l => {
        const key = String(l.id);
        if (merged[key] === undefined) merged[key] = 0;
      });

      // remove deleted locations (optional)
      Object.keys(merged).forEach(k => {
        if (!locations.some(l => String(l.id) === k)) delete merged[k];
      });

      return { ...prev, locationAllocations: merged };
    });
  }, [locations, isModalOpen]);

  // Calculate alerts based on individual thresholds
  const lowStockAlerts = inventory?.filter(item => item.stock <= item.lowStockThreshold && item.stock > 0);
  const outOfStockAlerts = inventory?.filter(item => item.stock === 0);

  // Derive unique categories for dropdown
  const uniqueCategories = useMemo(() => {
    const categories = new Set(['Electronics', 'Furniture', 'Office Supplies', 'Hardware', 'Software']);
    inventory.forEach(item => {
      if (item.category) categories.add(item.category);
    });
    return Array.from(categories).sort();
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;

      // Normalize statuses to safely compare values from backend and UI filter
      const derivedStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' =
        item.stock === 0 ? 'Out of Stock' : item.stock <= item.lowStockThreshold ? 'Low Stock' : 'In Stock';

      const rawStatus = (item as any).status || derivedStatus;
      const normalizeStatus = (s: string) => s.toLowerCase().replace(/\s|_/g, '');

      const matchesStatus =
        statusFilter === 'All' ||
        normalizeStatus(rawStatus) === normalizeStatus(statusFilter);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inventory, searchTerm, categoryFilter, statusFilter]);

  // SKU Auto-Generation Effect
  useEffect(() => {
    if (!isModalOpen) return;

    const clean = (str: string | undefined) => {
      if (!str) return 'XXX';
      const s = str.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      return s.substring(0, 3).padEnd(3, 'X');
    };

    const brandPart = clean(formData.brand);
    const categoryPart = clean(formData.category === 'NEW_CATEGORY_OPTION' ? '' : formData.category);
    const colorPart = clean(formData.color);

    const newSku = `${brandPart}-${categoryPart}-${colorPart}-${skuSerial}`;

    setFormData(prev => ({ ...prev, sku: newSku }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.brand, formData.category, formData.color, skuSerial, isModalOpen]);

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    const dataSummary = JSON.stringify(inventory);
    const result = await analyzeInventoryTrends(dataSummary);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleForecast = async () => {
    setIsForecasting(true);
    setIsForecastModalOpen(true);

    const context = inventory.map(p => ({
      name: p.name,
      currentStock: p.stock,
      history: p.monthlySales || 'No history available'
    }));

    const result = await predictInventoryNeeds(JSON.stringify(context));
    setForecastReport(result);
    setIsForecasting(false);
  };

  const openAddItemModal = () => {
    setEditingProduct(null);
    setSkuSerial(Math.floor(1000 + Math.random() * 9000).toString());
    setFormData(emptyForm(locations));
    setIsModalOpen(true);
  };

  const openEditItemModal = (product: Product) => {
    setEditingProduct(product);
    setShowCustomCategoryInput(false);

    // base: all locations = 0
    const baseAllocations: Record<string, number> = Object.fromEntries(
      locations.map(l => [String(l.id), 0])
    );

    // override with existing allocations
    (product.allocations || []).forEach(a => {
      baseAllocations[String(a.locationId)] = Number(a.quantity) || 0;
    });

    // serial from SKU if possible
    const skuParts = String(product.sku || '').split('-');
    const lastPart = skuParts[skuParts.length - 1];
    const serial = /^\d{4}$/.test(lastPart)
      ? lastPart
      : Math.floor(1000 + Math.random() * 9000).toString();

    setSkuSerial(serial);

    setFormData({
      name: product.name ?? '',
      sku: product.sku ?? '',
      category: product.category ?? '',
      brand: product.brand ?? '',
      color: product.color ?? '',
      price: Number(product.price) || 0,
      lowStockThreshold: Number(product.lowStockThreshold) || 10,
      companyId,
      // companyId: (product as any).company_id ?? (product as any).companyId ?? undefined,
      locationAllocations: baseAllocations,
    });

    setIsModalOpen(true);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyId) {
      alert('Please provide a valid Company ID.');
      return;
    }

    // ✅ الباك عندك بيحتاج allocations فيها location_id واحد على الأقل
    if (locations.length === 0) {
      alert('Please add at least one inventory location first.');
      return;
    }

    // Backend-required fields
    if (!formData.name || !formData.name.trim()) {
      alert('Product name is required.');
      return;
    }

    if (!formData.sku || !formData.sku.trim()) {
      alert('SKU is required.');
      return;
    }

    if (!formData.category || !formData.category.trim()) {
      alert('Category is required.');
      return;
    }

    const numericPrice = Number(formData.price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      alert('Price must be greater than 0.');
      return;
    }

    const allocationEntries = Object.entries(formData.locationAllocations || {});

    /**
     * ✅ IMPORTANT CHANGE:
     * - quantity ممكن = 0 عادي
     * - المهم locationId يبقى موجود وصحيح
     * - فنبعت لكل locations allocations حتى لو 0
     */
    const allocations: ProductAllocation[] = allocationEntries
      .filter(([id]) => locations.some(loc => String(loc.id) === String(id)))
      .map(([id, qty]) => ({
        locationId: id,
        quantity: Number(qty) || 0,
      }));

    const totalStock = allocations.reduce((sum, a) => sum + (Number(a.quantity) || 0), 0);
    const threshold = Number(formData.lowStockThreshold) || 10;

    let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
    if (totalStock === 0) status = 'Out of Stock';
    else if (totalStock <= threshold) status = 'Low Stock';

    const productData: Partial<Product> & { companyId: number } = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      category: formData.category.trim(),
      brand: formData.brand || '',
      color: formData.color || '',
      price: numericPrice,
      stock: totalStock,
      lowStockThreshold: threshold,
      status,
      allocations, // ✅ ALWAYS send (even if all quantities are 0)
      companyId: formData.companyId,
      history: [
        {
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString().split('T')[0],
          quantity: totalStock,
          type: editingProduct ? 'Update' : 'Initial',
          reference: 'Manual Entry'
        }
      ],
      monthlySales: {},
    };

    try {
      let savedItem: Product;

      if (editingProduct) {
        savedItem = await inventoryService.updateProduct(editingProduct.id, productData);
        const updated = inventory.map(p => (p.id === savedItem.id ? savedItem : p));
        setInventoryState(updated);
        if (setPropInventory) setPropInventory(updated);
      } else {
        savedItem = await inventoryService.createProduct(productData);
        const updated = [savedItem, ...inventory];
        setInventoryState(updated);
        if (setPropInventory) setPropInventory(updated);
      }

      setIsModalOpen(false);
      setShowCustomCategoryInput(false);
      setEditingProduct(null);
    } catch (err: any) {
      console.error('Failed to save product:', err);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const locationData: Partial<InventoryLocation> = {
      name: newLocation.name || 'New Location',
      address: newLocation.address,
      description: newLocation.description,
      code: newLocation.code,
      status: newLocation.status || 'Active',
    };

    try {
      let loc: InventoryLocation;

      if (editingLocation) {
        // Update existing location
        loc = await inventoryService.updateLocation(editingLocation.id, locationData);
        const updatedLocations = locations.map(l => (l.id === loc.id ? loc : l));
        setLocationsState(updatedLocations);
        if (setPropLocations) setPropLocations(updatedLocations);
      } else {
        // Create new location
        loc = await inventoryService.createLocation(locationData);
        const updatedLocations = [...locations, loc];
        setLocationsState(updatedLocations);
        if (setPropLocations) setPropLocations(updatedLocations);
      }

      setIsLocationModalOpen(false);
      setEditingLocation(null);
      setNewLocation({ name: '', address: '', description: '', code: '', status: 'Active' });
    } catch (err: any) {
      console.error('Failed to save location:', err);
    }
  };

  const handleEditLocation = (loc: InventoryLocation) => {
    setEditingLocation(loc);
    setNewLocation({
      name: loc.name,
      address: loc.address,
      description: loc.description,
      code: (loc as any).code || '',
      status: loc.status || 'Active',
    });
    setIsLocationModalOpen(true);
  };

  const handleDeleteLocation = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return;

    try {
      await inventoryService.deleteLocation(id);
      const updatedLocations = locations.filter(l => String(l.id) !== String(id));
      setLocationsState(updatedLocations);
      if (setPropLocations) setPropLocations(updatedLocations);
    } catch (err: any) {
      console.error('Failed to delete location:', err);
    }
  };

  const openDetailsModal = (product: Product) => {
    setSelectedProduct(product);
    setActiveModalTab('history');
    setIsDetailsModalOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('All');
    setStatusFilter('All');
  };

  const isLoading = isLoadingProducts || isLoadingLocations;

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-slate-600">
        <Loader className="animate-spin me-2" size={18} />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      {(lowStockAlerts.length > 0 || outOfStockAlerts.length > 0) && viewMode === 'products' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-top-2">
          <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-full animate-pulse">
              <BellRing size={20} />
            </div>
            <div>
              <h3 className="font-bold text-amber-900">{t('inventory.alerts.title')}</h3>
              <p className="text-sm text-amber-700">Attention needed for the following items.</p>
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {outOfStockAlerts.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                <h4 className="text-xs font-bold text-red-800 uppercase mb-2 flex items-center gap-2">
                  <XCircle size={14} /> {t('inventory.alerts.out_of_stock')} ({outOfStockAlerts.length})
                </h4>
                <ul className="space-y-1">
                  {outOfStockAlerts.map(item => (
                    <li key={item.id} className="text-sm text-red-700 flex justify-between">
                      <span>{item.name}</span>
                      <span className="font-mono text-xs bg-red-100 px-1.5 py-0.5 rounded">0 remaining</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {lowStockAlerts.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                <h4 className="text-xs font-bold text-amber-800 uppercase mb-2 flex items-center gap-2">
                  <AlertCircle size={14} /> {t('inventory.alerts.low_stock')} ({lowStockAlerts.length})
                </h4>
                <ul className="space-y-1">
                  {lowStockAlerts.map(item => (
                    <li key={item.id} className="text-sm text-amber-800 flex justify-between">
                      <span>{item.name}</span>
                      <span className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">
                        {item.stock} left (Alert &lt; {item.lowStockThreshold + 1})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl sm:text-sm font-bold text-slate-800">{t('inventory.title')}</h2>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('products')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'products'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t('inventory.tabs.products')}
              </button>
              <button
                onClick={() => setViewMode('locations')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'locations'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t('inventory.tabs.locations')}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            {viewMode === 'products' ? (
              <>
                <button
                  onClick={openAddItemModal}
                  className="flex items-center sm:text-sm gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
                >
                  <Plus size={16} />
                  {t('inventory.buttons.add_item')}
                </button>
                <button
                  onClick={handleForecast}
                  className="flex items-center gap-2 sm:text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm shadow-blue-200"
                >
                  <TrendingUp size={16} />
                  {t('inventory.buttons.forecast')}
                </button>
                <button
                  onClick={handleAiAnalysis}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 sm:text-sm px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors disabled:opacity-70 shadow-sm shadow-emerald-200"
                >
                  <Zap size={16} className={isAnalyzing ? 'animate-pulse' : ''} />
                  {isAnalyzing ? 'Analyzing...' : t('inventory.buttons.ai_analysis')}
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setEditingLocation(null);
                  setNewLocation({ name: '', address: '', description: '', code: '' });
                  setIsLocationModalOpen(true);
                }}
                className="flex items-center gap-2 sm:text-sm  px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
              >
                <MapPin size={16} />
                {t('inventory.buttons.add_location')}
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        {viewMode === 'products' && (
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('inventory.filters.search')}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-400" />
                  <select
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none min-w-[140px]"
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                  >
                    <option value="All">{t('inventory.filters.all_categories')}</option>
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-slate-400" />
                  <select
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none min-w-[140px]"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="All">{t('inventory.filters.all_statuses')}</option>
                    <option value="In Stock">{t('inventory.filters.in_stock')}</option>
                    <option value="Low Stock">{t('inventory.filters.low_stock')}</option>
                    <option value="Out of Stock">{t('inventory.filters.out_of_stock')}</option>
                  </select>
                </div>

                {(searchTerm || categoryFilter !== 'All' || statusFilter !== 'All') && (
                  <button
                    onClick={clearFilters}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    title="Clear Filters"
                  >
                    <XCircle size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {aiAnalysis && viewMode === 'products' && (
          <div className="p-6 bg-emerald-50 border-b border-emerald-100 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg mt-1">
                <Zap size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-emerald-900">AI Insights</h3>
                <div
                  className="mt-2 text-emerald-800 text-sm leading-relaxed prose prose-emerald max-w-none"
                  dangerouslySetInnerHTML={{ __html: aiAnalysis }}
                />
                <button
                  onClick={() => setAiAnalysis(null)}
                  className="mt-3 text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto custom-scrollbar">
          {viewMode === 'products' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {t('inventory.table.info')}
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {t('inventory.table.sku')}
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {t('inventory.table.category')}
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {t('inventory.table.price')}
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {t('inventory.table.stock')}
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {t('inventory.table.status')}
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    {t('common.actions') ?? 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 font-medium text-slate-800">
                      {item.name}
                      {item.brand && (
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Tag size={10} /> {item.brand} {item.color && <span className="text-slate-300">|</span>}{' '}
                          {item.color}
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-slate-500 text-sm font-mono">{item.sku}</td>
                    <td className="p-4 text-slate-600 text-sm">{item.category}</td>
                    <td className="p-4 text-slate-800 font-medium">{formatCurrency(Number(item.price))}</td>

                    <td className="p-4">
                      <div className="flex flex-col">
                        <span
                          className={`font-medium ${
                            item.stock <= item.lowStockThreshold ? 'text-amber-600' : 'text-slate-800'
                          }`}
                        >
                          {item.stock}
                        </span>

                        {item.allocations && item.allocations.length > 0 && (
                          <div className="hidden group-hover:block absolute bg-white border border-slate-200 p-3 rounded-lg shadow-lg z-10 mt-6 text-xs">
                            <p className="font-bold text-slate-700 mb-1 border-b border-slate-100 pb-1">
                              Stock Locations
                            </p>
                            {item.allocations.map(alloc => {
                              const locName =
                                locations.find(l => String(l.id) === String(alloc.locationId))?.name || 'Unknown';
                              return (
                                <div key={String(alloc.locationId)} className="flex justify-between gap-4">
                                  <span>{locName}:</span>
                                  <span className="font-medium">{alloc.quantity}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {item.stock === 0 ? (
                          <XCircle size={16} className="text-red-500" />
                        ) : item.stock <= item.lowStockThreshold ? (
                          <AlertCircle size={16} className="text-amber-500" />
                        ) : (
                          <CheckCircle size={16} className="text-green-500" />
                        )}

                        <span
                          className={`text-sm font-medium ${
                            item.stock === 0
                              ? 'text-red-700'
                              : item.stock <= item.lowStockThreshold
                              ? 'text-amber-700'
                              : 'text-green-700'
                          }`}
                        >
                          {item.stock === 0
                            ? t('inventory.alerts.out_of_stock')
                            : item.stock <= item.lowStockThreshold
                            ? t('inventory.alerts.low_stock')
                            : 'In Stock'}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditItemModal(item)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => openDetailsModal(item)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Details & History"
                        >
                          <History size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredInventory.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400 italic">
                      No products match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {t('inventory.table.loc_name')}
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {t('inventory.table.address')}
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {t('inventory.table.description')}
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    {t('inventory.table.items_stored')}
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {locations.map(loc => {
                  const itemsInLocation = inventory.reduce((acc, product) => {
                    const qty = product.allocations?.find(a => String(a.locationId) === String(loc.id))?.quantity || 0;
                    return acc + qty;
                  }, 0);

                  return (
                    <tr key={loc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                        <Building size={16} className="text-indigo-400" />
                        {loc.name}
                      </td>
                      <td className="p-4 text-slate-600 text-sm">{loc.address || '-'}</td>
                      <td className="p-4 text-slate-500 text-sm">{loc.description || '-'}</td>
                      <td className="p-4 text-right text-sm font-bold text-slate-700">{itemsInLocation} units</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditLocation(loc)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
                            title="Edit location"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteLocation(loc.id)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                            title="Delete location"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {locations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 text-sm">
                      No locations defined.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Location Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingLocation ? 'Edit Location' : t('inventory.modal.add_location_title')}
              </h3>
              <button
                onClick={() => setIsLocationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddLocation} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.table.loc_name')}</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="e.g. Warehouse A"
                  value={newLocation.name}
                  onChange={e => setNewLocation({ ...newLocation, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="e.g. WH-A"
                  value={newLocation.code || ''}
                  onChange={e => setNewLocation({ ...newLocation, code: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.table.address')}</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="Address..."
                  value={newLocation.address}
                  onChange={e => setNewLocation({ ...newLocation, address: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.table.description')}</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="Details..."
                  value={newLocation.description}
                  onChange={e => setNewLocation({ ...newLocation, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  value={newLocation.status || 'Active'}
                  onChange={e => setNewLocation({ ...newLocation, status: e.target.value as 'Active' | 'Inactive' })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
                {editingLocation ? 'Update' : t('common.add')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingProduct ? 'Update Product' : t('inventory.modal.add_title')}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setShowCustomCategoryInput(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.modal.name')}</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="e.g. Ergonomic Mouse"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Tag size={14} /> {t('inventory.modal.brand')}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="e.g. Logitech"
                    value={formData.brand}
                    onChange={e => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.table.category')}</label>

                  {showCustomCategoryInput ? (
                    <div className="flex gap-2">
                      <input
                        required
                        type="text"
                        autoFocus
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                        placeholder="New Category"
                        value={formData.category}
                        onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomCategoryInput(false);
                          setFormData(prev => ({ ...prev, category: '' }));
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                        title="Back to list"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <select
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all bg-white"
                      value={formData.category}
                      onChange={e => {
                        if (e.target.value === 'NEW_CATEGORY_OPTION') {
                          setShowCustomCategoryInput(true);
                          setFormData(prev => ({ ...prev, category: '' }));
                        } else {
                          setFormData(prev => ({ ...prev, category: e.target.value }));
                        }
                      }}
                    >
                      <option value="">Select Category</option>
                      {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="NEW_CATEGORY_OPTION" className="font-semibold text-indigo-600">
                        + Create New Category
                      </option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block hidden text-sm font-medium text-slate-700 mb-1">Company ID</label>
                  <input
                    required
                    type="number"
                    min={1}
                    className="w-full hidden px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="e.g. 1"
                    defaultValue={formData.companyId ?? ''}
                   
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Palette size={14} /> {t('inventory.modal.color')}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="e.g. Black"
                    value={formData.color}
                    onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.modal.sku_auto')}</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-600 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="e.g. LOG-MOU-BLK-001"
                    value={formData.sku}
                    onChange={e => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.modal.price')}</label>
                  <input
                    required
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={e => setFormData(prev => ({ ...prev, price: Number(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.modal.low_stock_alert')}</label>
                  <input
                    required
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="e.g. 10"
                    value={formData.lowStockThreshold}
                    onChange={e => setFormData(prev => ({ ...prev, lowStockThreshold: Number(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              {/* Stock Allocation Section */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Package size={16} /> {t('inventory.modal.stock_allocation')}
                </h4>

                <div className="space-y-2">
                  {locations.map(loc => (
                    <div key={loc.id} className="flex items-center justify-between">
                      <label className="text-sm text-slate-600 flex-1">{loc.name}</label>
                      <input
                        type="number"
                        min={0}
                        className="w-24 px-2 py-1 border border-slate-200 rounded text-right text-sm"
                        placeholder="0"
                        value={formData.locationAllocations?.[String(loc.id)] ?? 0}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            locationAllocations: {
                              ...prev.locationAllocations,
                              [String(loc.id)]: Number(e.target.value) || 0,
                            },
                          }))
                        }
                      />
                    </div>
                  ))}

                  {locations.length === 0 && (
                    <p className="text-xs text-red-500">No locations defined. (Optional) You can still create/update product.</p>
                  )}
                </div>

                <div className="flex justify-between mt-3 pt-2 border-t border-slate-200">
                  <span className="text-sm font-bold text-slate-700">{t('inventory.modal.total_stock')}:</span>
                  <span className="text-sm font-bold text-indigo-600">
                    {Object.values(formData.locationAllocations || {}).reduce((a, b) => a + (Number(b) || 0), 0)}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setShowCustomCategoryInput(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  {t('common.cancel')}
                </button>

                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm shadow-indigo-200 transition-all hover:shadow-indigo-300"
                >
                  {editingProduct ? (t('common.update') ?? 'Update') : t('common.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Details & History Modal */}
      {isDetailsModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{t('inventory.table.details')}</h3>
                <p className="text-sm text-slate-500">
                  {selectedProduct.name} <span className="mx-1">•</span> {selectedProduct.sku}
                </p>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)}>
                <X size={20} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div className="flex border-b border-slate-100 px-6">
              <button
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeModalTab === 'history'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setActiveModalTab('history')}
              >
                Stock History
              </button>
              <button
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeModalTab === 'purchases'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setActiveModalTab('purchases')}
              >
                Purchase Orders
              </button>
            </div>

            <div className="p-0 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
              {activeModalTab === 'history' && (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">{t('common.date')}</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Event Type</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Details / Ref</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Change</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {selectedProduct.history && selectedProduct.history.length > 0 ? (
                      [...selectedProduct.history]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(log => (
                          <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3 text-sm text-slate-600">{log.date}</td>
                            <td className="px-6 py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1 ${
                                  log.type === 'Purchase'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : log.type === 'Sale'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                {log.type === 'Purchase' && <ShoppingBag size={10} />}
                                {log.type === 'Sale' && <Zap size={10} />}
                                {log.type}
                              </span>
                            </td>

                            <td className="px-6 py-3 text-sm font-medium text-slate-700">
                              {log.type === 'Purchase' && log.reference?.startsWith('PO-') ? (
                                <div className="flex flex-col">
                                  <span className="text-indigo-600 font-mono">{log.reference}</span>
                                  <span className="text-xs text-slate-400">Received</span>
                                </div>
                              ) : (
                                <span className="font-mono">{log.reference || '-'}</span>
                              )}
                            </td>

                            <td className="px-6 py-3 text-right font-medium text-slate-800">
                              <div
                                className={`flex items-center justify-end gap-1 ${
                                  log.type === 'Purchase' || log.type === 'Initial' || log.type === 'Update'
                                    ? 'text-emerald-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {log.type === 'Purchase' || log.type === 'Initial' || log.type === 'Update' ? '+' : '-'}
                                {log.quantity}
                              </div>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400 text-sm">
                          No history available for this item.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {activeModalTab === 'purchases' && (
                <div className="flex flex-col animate-in fade-in">
                  {(() => {
                    const linkedPOs = purchaseOrders.filter(
                      po =>
                        (po.status === 'Received' || po.status === 'Paid') &&
                        po.items.some(item => item.productId === selectedProduct.id || item.description === selectedProduct.name)
                    );

                    if (linkedPOs.length === 0) {
                      return (
                        <div className="p-12 text-center">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <ShoppingBag size={24} />
                          </div>
                          <p className="text-slate-500 font-medium">No received purchase orders found for this product.</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Orders with status 'Received' or 'Paid' will appear here.
                          </p>
                        </div>
                      );
                    }

                    const totalUnitsReceived = linkedPOs.reduce((acc, po) => {
                      const item = po.items.find(i => i.productId === selectedProduct.id || i.description === selectedProduct.name);
                      return acc + (item?.quantity || 0);
                    }, 0);

                    return (
                      <>
                        <div className="p-6 bg-white border-b border-slate-100">
                          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                                <TrendingUp size={20} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Total Received Units</p>
                                <p className="text-2xl font-black text-indigo-900">{totalUnitsReceived.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="text-end">
                              <p className="text-xs font-bold text-slate-500 uppercase">In-System Orders</p>
                              <p className="text-lg font-bold text-slate-700">{linkedPOs.length}</p>
                            </div>
                          </div>
                        </div>

                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                            <tr>
                              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">PO ID</th>
                              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor</th>
                              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                                Qty Received
                              </th>
                              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                                Unit Cost
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100 bg-white">
                            {linkedPOs.map(po => {
                              const itemDetails = po.items.find(
                                item => item.productId === selectedProduct.id || item.description === selectedProduct.name
                              );

                              return (
                                <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                      <span className="font-mono text-indigo-600 font-bold text-sm">{po.id}</span>
                                      <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold mt-1">
                                        <Calendar size={10} />
                                        {po.date}
                                      </div>
                                    </div>
                                  </td>

                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                        <Building2 size={14} />
                                      </div>
                                      <span className="text-sm text-slate-700 font-medium">{po.vendorName}</span>
                                    </div>
                                  </td>

                                  <td className="px-6 py-4 text-right">
                                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold border border-emerald-100">
                                      {itemDetails?.quantity}
                                    </span>
                                  </td>

                                  <td className="px-6 py-4 text-right text-sm font-medium text-slate-800">
                                    ${itemDetails?.unitPrice.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium text-sm"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forecast Modal */}
      {isForecastModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{t('inventory.forecasting.title')}</h3>
                  <p className="text-sm text-slate-500">AI-powered prediction for the next 3 months</p>
                </div>
              </div>
              <button onClick={() => setIsForecastModalOpen(false)}>
                <X size={20} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              {isForecasting ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <div className="relative w-20 h-20">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full animate-pulse"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-slate-600 font-medium animate-pulse">{t('inventory.forecasting.analyzing')}</p>
                </div>
              ) : forecastReport ? (
                <div className="prose prose-slate max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: forecastReport }} />
                </div>
              ) : (
                <div className="text-center text-slate-500 py-12">
                  Unable to generate forecast. Please ensure you have sufficient sales history data.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsForecastModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium text-sm"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;
