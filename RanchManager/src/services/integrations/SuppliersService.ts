import { EventEmitter } from 'events';
import * as SecureStore from 'expo-secure-store';

export interface Supplier {
  id: string;
  name: string;
  type: 'feed' | 'equipment' | 'veterinary' | 'general';
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  payment: {
    terms: string;
    methods: string[];
    taxId?: string;
  };
  rating: number;
  lastOrderDate?: Date;
}

export interface Product {
  id: string;
  supplierId: string;
  name: string;
  category: string;
  description: string;
  unit: string;
  price: number;
  minOrder: number;
  inStock: boolean;
  leadTime: number; // days
  specifications?: Record<string, any>;
}

export interface Order {
  id: string;
  supplierId: string;
  date: Date;
  status: 'draft' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  notes?: string;
  expectedDelivery?: Date;
  tracking?: {
    number: string;
    carrier: string;
    status: string;
    lastUpdate: Date;
  };
}

export interface SupplierPreferences {
  apiKey: string;
  defaultSupplier?: string;
  autoReorder: boolean;
  inventory: {
    lowStockThreshold: number;
    reorderPoint: number;
    maxStock: number;
  };
  ordering: {
    approvalRequired: boolean;
    approvers: string[];
    defaultPaymentMethod: string;
    defaultShippingMethod: string;
  };
  notifications: {
    orderStatus: boolean;
    deliveryUpdates: boolean;
    priceChanges: boolean;
    stockAlerts: boolean;
  };
}

export class SuppliersService {
  private static instance: SuppliersService;
  private eventEmitter: EventEmitter;
  private preferences: SupplierPreferences;
  private readonly PREFERENCES_KEY = 'supplier_preferences';

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.preferences = this.getDefaultPreferences();
    this.initialize();
  }

  static getInstance(): SuppliersService {
    if (!SuppliersService.instance) {
      SuppliersService.instance = new SuppliersService();
    }
    return SuppliersService.instance;
  }

  private getDefaultPreferences(): SupplierPreferences {
    return {
      apiKey: '',
      autoReorder: false,
      inventory: {
        lowStockThreshold: 20,
        reorderPoint: 10,
        maxStock: 100,
      },
      ordering: {
        approvalRequired: true,
        approvers: [],
        defaultPaymentMethod: '',
        defaultShippingMethod: '',
      },
      notifications: {
        orderStatus: true,
        deliveryUpdates: true,
        priceChanges: true,
        stockAlerts: true,
      },
    };
  }

  private async initialize() {
    try {
      const savedPreferences = await this.loadPreferences();
      if (savedPreferences) {
        this.preferences = { ...this.preferences, ...savedPreferences };
      }
    } catch (error) {
      console.error('Error initializing suppliers service:', error);
    }
  }

  async getPreferences(): Promise<SupplierPreferences> {
    return { ...this.preferences };
  }

  async updatePreferences(updates: Partial<SupplierPreferences>): Promise<void> {
    try {
      this.preferences = { ...this.preferences, ...updates };
      await this.savePreferences();
    } catch (error) {
      console.error('Error updating supplier preferences:', error);
      throw error;
    }
  }

  private async savePreferences(): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        this.PREFERENCES_KEY,
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.error('Error saving supplier preferences:', error);
      throw error;
    }
  }

  private async loadPreferences(): Promise<SupplierPreferences | null> {
    try {
      const preferencesJson = await SecureStore.getItemAsync(this.PREFERENCES_KEY);
      return preferencesJson ? JSON.parse(preferencesJson) : null;
    } catch (error) {
      console.error('Error loading supplier preferences:', error);
      return null;
    }
  }

  async getSuppliers(type?: Supplier['type']): Promise<Supplier[]> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  async getProducts(supplierId?: string): Promise<Product[]> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  async createOrder(order: Omit<Order, 'id'>): Promise<Order> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  async getOrders(
    filters?: {
      supplierId?: string;
      status?: Order['status'];
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<Order[]> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  async checkInventory(productId: string): Promise<{
    currentStock: number;
    reorderNeeded: boolean;
    suggestedQuantity: number;
  }> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  // Event Handling
  onOrderStatusChanged(callback: (order: Order) => void): () => void {
    this.eventEmitter.on('orderStatusChanged', callback);
    return () => {
      this.eventEmitter.off('orderStatusChanged', callback);
    };
  }

  onDeliveryUpdated(callback: (order: Order) => void): () => void {
    this.eventEmitter.on('deliveryUpdated', callback);
    return () => {
      this.eventEmitter.off('deliveryUpdated', callback);
    };
  }

  onPriceChanged(callback: (product: Product) => void): () => void {
    this.eventEmitter.on('priceChanged', callback);
    return () => {
      this.eventEmitter.off('priceChanged', callback);
    };
  }

  onStockAlert(callback: (product: Product) => void): () => void {
    this.eventEmitter.on('stockAlert', callback);
    return () => {
      this.eventEmitter.off('stockAlert', callback);
    };
  }
} 