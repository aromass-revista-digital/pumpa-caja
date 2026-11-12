import { Product, Sale, CashShift, CashMovement, StoreSettings } from '../types';

const DB_NAME = 'pumpa_caja_db';
const DB_VERSION = 1;

export class Database {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase>;

  constructor() {
    this.initPromise = this.open();
  }

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('barcode', 'barcode', { unique: false });
          productStore.createIndex('name', 'name', { unique: false });
          productStore.createIndex('category', 'category', { unique: false });
        }

        // Sales store
        if (!db.objectStoreNames.contains('sales')) {
          const saleStore = db.createObjectStore('sales', { keyPath: 'id' });
          saleStore.createIndex('timestamp', 'timestamp', { unique: false });
          saleStore.createIndex('shiftId', 'shiftId', { unique: false });
          saleStore.createIndex('receiptNumber', 'receiptNumber', { unique: false });
        }

        // Cash shifts store
        if (!db.objectStoreNames.contains('cash_shifts')) {
          const shiftStore = db.createObjectStore('cash_shifts', { keyPath: 'id' });
          shiftStore.createIndex('status', 'status', { unique: false });
          shiftStore.createIndex('openedAt', 'openedAt', { unique: false });
        }

        // Cash movements store
        if (!db.objectStoreNames.contains('cash_movements')) {
          const movementStore = db.createObjectStore('cash_movements', { keyPath: 'id' });
          movementStore.createIndex('shiftId', 'shiftId', { unique: false });
          movementStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        await this.seedInitialDataIfNeeded();
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('PUMPA CAJA DB Error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return this.initPromise;
  }

  // --- Initial Seed for Almacén Chiche ---
  private async seedInitialDataIfNeeded(): Promise<void> {
    const products = await this.getAll<Product>('products');
    if (products.length === 0) {
      console.log('Sembrando catálogo inicial para Almacén Chiche...');
      const seedProducts: Product[] = [
        {
          id: 'prod-001',
          barcode: '7790895000997',
          name: 'Coca Cola Original 1.5 L',
          price: 2800,
          cost: 1950,
          category: 'Bebidas',
          stock: 24,
          minStock: 6,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-002',
          barcode: '7790895000454',
          name: 'Coca Cola Original 500 ml',
          price: 1500,
          cost: 980,
          category: 'Bebidas',
          stock: 36,
          minStock: 10,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-003',
          barcode: '7790310000010',
          name: 'Fernet Branca 750 ml',
          price: 13500,
          cost: 9900,
          category: 'Bebidas',
          stock: 12,
          minStock: 3,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-004',
          barcode: '7790070411707',
          name: 'Cerveza Quilmes Clásica 1 L',
          price: 3200,
          cost: 2200,
          category: 'Bebidas',
          stock: 30,
          minStock: 8,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-005',
          barcode: '7790742111029',
          name: 'Alfajor Guaymallén Triple Chocolate',
          price: 600,
          cost: 380,
          category: 'Kiosco',
          stock: 48,
          minStock: 12,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-006',
          barcode: '7790580123456',
          name: 'Galletitas Chocolinas 250 g',
          price: 1850,
          cost: 1250,
          category: 'Galletitas',
          stock: 18,
          minStock: 5,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-007',
          barcode: '7790580654321',
          name: 'Galletitas Criollitas 300 g',
          price: 1400,
          cost: 920,
          category: 'Galletitas',
          stock: 22,
          minStock: 6,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-008',
          barcode: '7790080000540',
          name: 'Leche La Serenísima Clásica 1 L',
          price: 1650,
          cost: 1180,
          category: 'Lácteos',
          stock: 20,
          minStock: 8,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-009',
          barcode: '7790080001202',
          name: 'Yogur Firme La Serenísima Vainilla 120 g',
          price: 950,
          cost: 620,
          category: 'Lácteos',
          stock: 15,
          minStock: 5,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-010',
          barcode: '7793147000123',
          name: 'Yerba Mate Playadito 500 g',
          price: 2950,
          cost: 2100,
          category: 'Almacén',
          stock: 25,
          minStock: 6,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-011',
          barcode: '7790060009112',
          name: 'Azúcar Ledesma Clásica 1 kg',
          price: 1200,
          cost: 820,
          category: 'Almacén',
          stock: 30,
          minStock: 10,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-012',
          barcode: '7790272001001',
          name: 'Aceite Natura Girasol 900 ml',
          price: 2400,
          cost: 1680,
          category: 'Almacén',
          stock: 20,
          minStock: 5,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-013',
          barcode: '7790070112345',
          name: 'Fideos Matarazzo Tirabuzón 500 g',
          price: 1550,
          cost: 1050,
          category: 'Almacén',
          stock: 24,
          minStock: 6,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-014',
          barcode: '7790580987654',
          name: 'Arroz Gallo Oro Parboil 1 kg',
          price: 2600,
          cost: 1790,
          category: 'Almacén',
          stock: 16,
          minStock: 4,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-015',
          barcode: '1001',
          name: 'Pan Francés / Criollo (1 kg)',
          price: 2200,
          cost: 1300,
          category: 'Panadería',
          stock: 40,
          minStock: 8,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-016',
          barcode: '1002',
          name: 'Queso Cremoso La Paulina (1 kg)',
          price: 8900,
          cost: 6400,
          category: 'Fiambrería',
          stock: 15,
          minStock: 3,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-017',
          barcode: '1003',
          name: 'Jamón Cocido Paladini Especial (1 kg)',
          price: 14500,
          cost: 10200,
          category: 'Fiambrería',
          stock: 8,
          minStock: 2,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-018',
          barcode: '7790314002345',
          name: 'Agua Villavicencio Sin Gas 1.5 L',
          price: 1300,
          cost: 850,
          category: 'Bebidas',
          stock: 28,
          minStock: 8,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-019',
          barcode: '7791290001010',
          name: 'Lavandina Ayudín Clásica 1 L',
          price: 1450,
          cost: 980,
          category: 'Limpieza',
          stock: 18,
          minStock: 5,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-020',
          barcode: '7791290002020',
          name: 'Detergente Magistral Limón 300 ml',
          price: 2100,
          cost: 1420,
          category: 'Limpieza',
          stock: 14,
          minStock: 4,
          updatedAt: new Date().toISOString()
        }
      ];

      for (const p of seedProducts) {
        await this.put('products', p);
      }
    }

    // Default settings
    const currentSettings = await this.getSettings();
    if (!currentSettings) {
      const defaultSettings: StoreSettings = {
        storeName: 'Almacén Chiche',
        fantasyName: 'PUMPA CAJA',
        cuit: '20-34567890-9',
        address: 'Av. San Martín 1420',
        phone: '11 4567-8901',
        ticketFooter: '¡Muchas gracias por su compra! Almacén Chiche',
        currencySymbol: '$',
        enableSounds: true,
        enableScannerBeep: true,
        lowStockThreshold: 5
      };
      await this.saveSettings(defaultSettings);
    }
  }

  // --- Generic Helpers ---
  private async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  private async get<T>(storeName: string, key: string): Promise<T | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  private async put<T>(storeName: string, value: T): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async delete(storeName: string, key: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Products CRUD ---
  async getProducts(): Promise<Product[]> {
    const items = await this.getAll<Product>('products');
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.get<Product>('products', id);
  }

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) return null;
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const index = store.index('barcode');
      const req = index.get(cleanBarcode);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async saveProduct(product: Product): Promise<void> {
    product.updatedAt = new Date().toISOString();
    return this.put('products', product);
  }

  async deleteProduct(id: string): Promise<void> {
    return this.delete('products', id);
  }

  async updateStock(productId: string, quantitySold: number): Promise<void> {
    const prod = await this.getProductById(productId);
    if (!prod) return;
    prod.stock = Math.max(0, prod.stock - quantitySold);
    await this.put('products', prod);
  }

  async updateMultiplePrices(category: string, percentage: number): Promise<number> {
    const products = await this.getProducts();
    const factor = 1 + percentage / 100;
    let count = 0;
    for (const prod of products) {
      if (category === 'todas' || prod.category === category) {
        prod.price = Math.round(prod.price * factor);
        prod.updatedAt = new Date().toISOString();
        await this.put('products', prod);
        count++;
      }
    }
    return count;
  }

  // --- Sales CRUD ---
  async getSales(): Promise<Sale[]> {
    const sales = await this.getAll<Sale>('sales');
    // Sort descending by date
    return sales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getSaleById(id: string): Promise<Sale | null> {
    return this.get<Sale>('sales', id);
  }

  async saveSale(sale: Sale): Promise<void> {
    // 1. Guardar la venta
    await this.put('sales', sale);

    // 2. Descontar stock de cada producto
    for (const item of sale.items) {
      await this.updateStock(item.productId, item.quantity);
    }

    // 3. Si hay un turno de caja abierto, sumar a las estadísticas del turno
    if (sale.shiftId) {
      const shift = await this.getCashShiftById(sale.shiftId);
      if (shift && shift.status === 'abierta') {
        if (sale.paymentMethod === 'efectivo') {
          shift.cashSales += sale.total;
          shift.expectedCash += sale.total;
        } else if (sale.paymentMethod === 'transferencia') {
          shift.transferSales += sale.total;
        } else if (sale.paymentMethod === 'debito') {
          shift.debitSales += sale.total;
        } else if (sale.paymentMethod === 'credito') {
          shift.creditSales += sale.total;
        } else {
          shift.otherSales += sale.total;
        }
        await this.put('cash_shifts', shift);
      }
    }
  }

  async getNextReceiptNumber(): Promise<string> {
    const sales = await this.getSales();
    const count = sales.length + 1;
    return `0001-${String(count).padStart(8, '0')}`;
  }

  // --- Cash Shifts ---
  async getCashShifts(): Promise<CashShift[]> {
    const shifts = await this.getAll<CashShift>('cash_shifts');
    return shifts.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  }

  async getCashShiftById(id: string): Promise<CashShift | null> {
    return this.get<CashShift>('cash_shifts', id);
  }

  async getActiveCashShift(): Promise<CashShift | null> {
    const shifts = await this.getCashShifts();
    return shifts.find((s) => s.status === 'abierta') || null;
  }

  async openCashShift(initialAmount: number, notes?: string): Promise<CashShift> {
    const active = await this.getActiveCashShift();
    if (active) {
      throw new Error('Ya existe una caja abierta en este momento.');
    }

    const shift: CashShift = {
      id: `shift-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      openedAt: new Date().toISOString(),
      closedAt: null,
      status: 'abierta',
      initialAmount,
      cashSales: 0,
      transferSales: 0,
      debitSales: 0,
      creditSales: 0,
      otherSales: 0,
      manualIncomes: 0,
      manualExpenses: 0,
      expectedCash: initialAmount,
      actualCash: null,
      difference: null,
      notes
    };

    await this.put('cash_shifts', shift);
    return shift;
  }

  async closeCashShift(shiftId: string, actualCash: number, notes?: string): Promise<CashShift> {
    const shift = await this.getCashShiftById(shiftId);
    if (!shift) throw new Error('Turno de caja no encontrado');
    if (shift.status === 'cerrada') throw new Error('Esta caja ya fue cerrada');

    shift.status = 'cerrada';
    shift.closedAt = new Date().toISOString();
    shift.actualCash = actualCash;
    shift.difference = actualCash - shift.expectedCash;
    if (notes) shift.notes = (shift.notes ? shift.notes + ' | ' : '') + notes;

    await this.put('cash_shifts', shift);
    return shift;
  }

  // --- Cash Movements (Ingresos y Egresos manuales) ---
  async getCashMovements(shiftId?: string): Promise<CashMovement[]> {
    const movements = await this.getAll<CashMovement>('cash_movements');
    const filtered = shiftId ? movements.filter((m) => m.shiftId === shiftId) : movements;
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async addCashMovement(movement: CashMovement): Promise<void> {
    await this.put('cash_movements', movement);

    const shift = await this.getCashShiftById(movement.shiftId);
    if (shift && shift.status === 'abierta') {
      if (movement.type === 'ingreso') {
        shift.manualIncomes += movement.amount;
        shift.expectedCash += movement.amount;
      } else {
        shift.manualExpenses += movement.amount;
        shift.expectedCash -= movement.amount;
      }
      await this.put('cash_shifts', shift);
    }
  }

  // --- Store Settings ---
  async getSettings(): Promise<StoreSettings | null> {
    const item = await this.get<{ key: string; value: StoreSettings }>('settings', 'store_config');
    return item ? item.value : null;
  }

  async saveSettings(settings: StoreSettings): Promise<void> {
    await this.put('settings', { key: 'store_config', value: settings });
  }

  // --- Backup & Restore ---
  async exportFullDatabase(): Promise<string> {
    const [products, sales, shifts, movements, settings] = await Promise.all([
      this.getAll<Product>('products'),
      this.getAll<Sale>('sales'),
      this.getAll<CashShift>('cash_shifts'),
      this.getAll<CashMovement>('cash_movements'),
      this.getSettings()
    ]);

    const backup = {
      app: 'PUMPA CAJA',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        products,
        sales,
        shifts,
        movements,
        settings
      }
    };

    return JSON.stringify(backup, null, 2);
  }

  async importFullDatabase(jsonString: string): Promise<{ products: number; sales: number }> {
    const backup = JSON.parse(jsonString);
    if (!backup.data || !Array.isArray(backup.data.products)) {
      throw new Error('Formato de archivo de copia de seguridad no válido para PUMPA CAJA');
    }

    // Restore products
    for (const p of backup.data.products) {
      await this.put('products', p);
    }

    // Restore sales if available
    if (Array.isArray(backup.data.sales)) {
      for (const s of backup.data.sales) {
        await this.put('sales', s);
      }
    }

    // Restore shifts if available
    if (Array.isArray(backup.data.shifts)) {
      for (const sh of backup.data.shifts) {
        await this.put('cash_shifts', sh);
      }
    }

    // Restore movements if available
    if (Array.isArray(backup.data.movements)) {
      for (const m of backup.data.movements) {
        await this.put('cash_movements', m);
      }
    }

    // Restore settings if available
    if (backup.data.settings) {
      await this.saveSettings(backup.data.settings);
    }

    return {
      products: backup.data.products.length,
      sales: backup.data.sales ? backup.data.sales.length : 0
    };
  }
}

export const db = new Database();
