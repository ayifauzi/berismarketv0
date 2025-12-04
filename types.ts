
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  BRANCH_ADMIN = 'BRANCH_ADMIN',
  CASHIER = 'CASHIER',
  MOTORIST = 'MOTORIST'
}

export interface AppConfig {
  appName: string;
  appLogo: string; // Base64 string or URL
}

export interface UnitConversion {
  name: string; // e.g., "Slop", "Karton"
  quantity: number; // Conversion to base unit (e.g., 10, 100)
  price: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  branchId: string;
  baseUnit: string; // e.g., "Pcs"
  basePrice: number;
  stock: number; // Stored in base unit
  conversions: UnitConversion[];
  image?: string;
}

export interface CartItem extends Product {
  selectedUnit: string; // "Pcs" or one of the conversion names
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  branchId: string;
  date: string; // ISO String
  items: CartItem[];
  total: number;
  cashierName: string;
  paymentMethod: 'CASH' | 'QRIS';
  cashReceived?: number;
  change?: number;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  branchId: string;
  date: string;
  oldStock: number;
  newStock: number;
  delta: number;
  reason: string;
  adjustedBy: string;
}

export interface MotoristVisit {
  id: string;
  motoristName: string;
  shopName: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  notes: string;
  photoUrl?: string; // Placeholder for uploaded image
}

export interface Branch {
  id: string;
  name: string;
  location: string; // General Area/Region name (e.g. "Jakarta Pusat")
  street: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
}

export const MOCK_BRANCHES: Branch[] = [
  { 
    id: 'B001', 
    name: 'Cabang Pusat (Jakarta)', 
    location: 'Jakarta Pusat',
    street: 'Jl. Sudirman No. 45',
    city: 'Jakarta',
    state: 'DKI Jakarta',
    zipCode: '10220',
    latitude: -6.2088,
    longitude: 106.8456
  },
  { 
    id: 'B002', 
    name: 'Cabang Bandung', 
    location: 'Bandung Kota',
    street: 'Jl. Braga No. 10',
    city: 'Bandung',
    state: 'Jawa Barat',
    zipCode: '40111',
    latitude: -6.9175,
    longitude: 107.6191
  },
];

export const CURRENT_USER = {
  name: 'Demo User',
  branchId: 'B001'
};
