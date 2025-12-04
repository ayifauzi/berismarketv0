
import { Product, Transaction, MotoristVisit, MOCK_BRANCHES, Branch, StockAdjustment, CURRENT_USER, AppConfig } from '../types';

// Initial Mock Data
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'P001',
    name: 'Kopi Kapal Api Mix',
    sku: '8991001',
    category: 'Beverage',
    branchId: 'B001',
    baseUnit: 'Sachet',
    basePrice: 1500,
    stock: 500, // 500 Sachets
    conversions: [
      { name: 'Renceng', quantity: 10, price: 14500 },
      { name: 'Karton', quantity: 120, price: 170000 }
    ],
    image: 'https://picsum.photos/200'
  },
  {
    id: 'P002',
    name: 'Indomie Goreng',
    sku: '8992002',
    category: 'Food',
    branchId: 'B001',
    baseUnit: 'Bungkus',
    basePrice: 3500,
    stock: 200,
    conversions: [
      { name: 'Karton', quantity: 40, price: 135000 }
    ],
    image: 'https://picsum.photos/201'
  }
];

const DEFAULT_CONFIG: AppConfig = {
  appName: 'OmniMarket',
  appLogo: ''
};

export const StorageService = {
  // --- App Config ---
  getAppConfig: (): AppConfig => {
    const data = localStorage.getItem('app_config');
    return data ? JSON.parse(data) : DEFAULT_CONFIG;
  },

  saveAppConfig: (config: AppConfig) => {
    localStorage.setItem('app_config', JSON.stringify(config));
  },

  getProducts: (branchId?: string): Product[] => {
    const data = localStorage.getItem('products');
    let products: Product[] = data ? JSON.parse(data) : INITIAL_PRODUCTS;
    if (branchId) {
      products = products.filter(p => p.branchId === branchId);
    }
    return products;
  },

  saveProduct: (product: Product) => {
    const products = StorageService.getProducts(); // Gets all products (no filter)
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem('products', JSON.stringify(products));
  },

  deleteProduct: (id: string) => {
    const products = StorageService.getProducts();
    const newProducts = products.filter(p => p.id !== id);
    localStorage.setItem('products', JSON.stringify(newProducts));
  },

  updateStock: (productId: string, qtyDeltaBaseUnit: number) => {
    const products = StorageService.getProducts();
    const product = products.find(p => p.id === productId);
    if (product) {
      product.stock -= qtyDeltaBaseUnit; // Negative delta adds stock, Positive removes (sales)
      StorageService.saveProduct(product);
    }
  },

  // Enhanced Stock Adjustment with Reason
  adjustProductStock: (productId: string, newStock: number, reason: string) => {
    const products = StorageService.getProducts();
    const product = products.find(p => p.id === productId);
    
    if (product) {
      const oldStock = product.stock;
      const delta = newStock - oldStock;
      
      // 1. Update Product
      product.stock = newStock;
      StorageService.saveProduct(product);

      // 2. Create Log
      const adjustment: StockAdjustment = {
        id: `ADJ-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        branchId: product.branchId,
        date: new Date().toISOString(),
        oldStock,
        newStock,
        delta,
        reason,
        adjustedBy: CURRENT_USER.name
      };
      
      StorageService.addStockAdjustment(adjustment);
    }
  },

  getStockAdjustments: (branchId?: string): StockAdjustment[] => {
    const data = localStorage.getItem('stock_adjustments');
    let adjs: StockAdjustment[] = data ? JSON.parse(data) : [];
    if (branchId) {
      adjs = adjs.filter(a => a.branchId === branchId);
    }
    return adjs;
  },

  addStockAdjustment: (adj: StockAdjustment) => {
    const adjs = StorageService.getStockAdjustments(); // Get all
    adjs.push(adj);
    localStorage.setItem('stock_adjustments', JSON.stringify(adjs));
  },

  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem('transactions');
    return data ? JSON.parse(data) : [];
  },

  addTransaction: (transaction: Transaction) => {
    const txs = StorageService.getTransactions();
    txs.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(txs));
    
    // Deduct stock
    transaction.items.forEach(item => {
      let deduction = item.qty;
      // If not base unit, convert to base unit
      if (item.selectedUnit !== item.baseUnit) {
        const conv = item.conversions.find(c => c.name === item.selectedUnit);
        if (conv) deduction = item.qty * conv.quantity;
      }
      StorageService.updateStock(item.id, deduction);
    });
  },

  getVisits: (): MotoristVisit[] => {
    const data = localStorage.getItem('visits');
    return data ? JSON.parse(data) : [];
  },

  addVisit: (visit: MotoristVisit) => {
    const visits = StorageService.getVisits();
    visits.push(visit);
    localStorage.setItem('visits', JSON.stringify(visits));
  },

  // Branch Management
  getBranches: (): Branch[] => {
    const data = localStorage.getItem('branches');
    if (data) return JSON.parse(data);
    // Initialize with mock data if empty
    localStorage.setItem('branches', JSON.stringify(MOCK_BRANCHES));
    return MOCK_BRANCHES;
  },

  addBranch: (branch: Branch) => {
    const branches = StorageService.getBranches();
    branches.push(branch);
    localStorage.setItem('branches', JSON.stringify(branches));
  },

  updateBranch: (branch: Branch) => {
    const branches = StorageService.getBranches();
    const index = branches.findIndex(b => b.id === branch.id);
    if (index !== -1) {
      branches[index] = branch;
      localStorage.setItem('branches', JSON.stringify(branches));
    }
  },

  deleteBranch: (id: string) => {
    const branches = StorageService.getBranches();
    const newBranches = branches.filter(b => b.id !== id);
    localStorage.setItem('branches', JSON.stringify(newBranches));
  }
};
