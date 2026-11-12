import { CartItem, Product, Sale, CashShift, StoreSettings, ViewTab } from './types';
import { db } from './db/indexedDB';
import { sounds } from './services/soundService';

type Listener = () => void;

class AppState {
  // Current Navigation View
  public currentTab: ViewTab = 'ventas';

  // Active Store Settings
  public settings: StoreSettings = {
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

  // Active Cash Shift
  public activeShift: CashShift | null = null;

  // Cart for Current Sale
  public cart: CartItem[] = [];

  // Catalog Products Cache
  public products: Product[] = [];

  // Connectivity
  public isOnline: boolean = navigator.onLine;

  // PWA Install Event
  public installPromptEvent: any = null;
  public isInstalled: boolean = false;

  // Active Modals & Transient States
  public isScannerOpen: boolean = false;
  public isPaymentModalOpen: boolean = false;
  public isCashDrawerModalOpen: boolean = false;
  public lastCompletedSale: Sale | null = null;
  public toastMessage: { text: string; type: 'info' | 'success' | 'warning' | 'error' } | null = null;
  private toastTimeout: any = null;

  // Observers
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('Error in state subscriber', err);
      }
    }
  }

  async init(): Promise<void> {
    // 1. Load settings
    const savedSettings = await db.getSettings();
    if (savedSettings) {
      this.settings = savedSettings;
      sounds.enabled = savedSettings.enableSounds;
    }

    // 2. Load active cash shift
    this.activeShift = await db.getActiveCashShift();

    // 3. Load products
    await this.refreshProducts();

    // 4. Connectivity listeners
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showToast('Conexión a internet restablecida', 'info');
      this.notify();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showToast('Modo sin conexión activo — Funcionando con base de datos local', 'warning');
      this.notify();
    });

    // 5. PWA Install prompt listener
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPromptEvent = e;
      this.notify();
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.installPromptEvent = null;
      this.showToast('¡PUMPA CAJA se instaló correctamente!', 'success');
      this.notify();
    });

    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      this.isInstalled = true;
    }

    this.notify();
  }

  async refreshProducts(): Promise<void> {
    this.products = await db.getProducts();
    this.notify();
  }

  async refreshActiveShift(): Promise<void> {
    this.activeShift = await db.getActiveCashShift();
    this.notify();
  }

  setTab(tab: ViewTab): void {
    this.currentTab = tab;
    this.notify();
  }

  showToast(text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastMessage = { text, type };
    this.notify();
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
      this.notify();
    }, 3500);
  }

  // --- Cart Operations ---
  addToCart(product: Product, quantity: number = 1): void {
    if (quantity <= 0) return;

    const existingIndex = this.cart.findIndex((item) => item.product.id === product.id);

    if (existingIndex >= 0) {
      this.cart[existingIndex].quantity += quantity;
      this.cart[existingIndex].subtotal = this.cart[existingIndex].quantity * this.cart[existingIndex].product.price;
    } else {
      this.cart.push({
        product,
        quantity,
        subtotal: quantity * product.price
      });
    }

    if (this.settings.enableScannerBeep) {
      sounds.playBeep();
    }

    this.notify();
  }

  updateCartItemQuantity(productId: string, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    const item = this.cart.find((i) => i.product.id === productId);
    if (item) {
      item.quantity = newQuantity;
      item.subtotal = item.quantity * item.product.price;
      this.notify();
    }
  }

  removeFromCart(productId: string): void {
    this.cart = this.cart.filter((item) => item.product.id !== productId);
    this.notify();
  }

  clearCart(): void {
    this.cart = [];
    this.notify();
  }

  getCartTotal(): number {
    return this.cart.reduce((sum, item) => sum + item.subtotal, 0);
  }

  getCartCostTotal(): number {
    return this.cart.reduce((sum, item) => sum + item.quantity * (item.product.cost || 0), 0);
  }

  getCartItemCount(): number {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }
}

export const state = new AppState();
