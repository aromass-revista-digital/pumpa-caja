export interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;       // Precio de venta al público en ARS
  cost: number;        // Costo de compra en ARS
  category: string;    // Categoría del producto
  stock: number;       // Stock disponible en unidades
  minStock: number;    // Alerta de stock mínimo
  updatedAt: string;   // Fecha y hora de última actualización del precio
}

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export type PaymentMethod = 'efectivo' | 'transferencia' | 'debito' | 'credito' | 'otro';

export interface SaleItem {
  productId: string;
  name: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  receiptNumber: string; // ej: 0001-00000001
  timestamp: string;      // ISO String
  items: SaleItem[];
  total: number;
  costTotal: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;     // Monto entregado por el cliente
  changeGiven: number;    // Vuelto entregado
  shiftId: string | null; // ID del turno de caja activo
  notes?: string;
}

export interface CashShift {
  id: string;
  openedAt: string;
  closedAt: string | null;
  status: 'abierta' | 'cerrada';
  initialAmount: number;   // Monto inicial en caja (fondo de cambio)
  cashSales: number;       // Ventas cobradas en efectivo
  transferSales: number;   // Ventas por transferencia
  debitSales: number;      // Ventas con tarjeta de débito
  creditSales: number;     // Ventas con tarjeta de crédito
  otherSales: number;      // Otros medios de pago
  manualIncomes: number;   // Ingresos manuales de efectivo
  manualExpenses: number;  // Egresos manuales de efectivo
  expectedCash: number;    // Efectivo teórico que debe haber
  actualCash: number | null; // Efectivo contado real en arqueo
  difference: number | null; // Diferencia (actualCash - expectedCash)
  notes?: string;
}

export interface CashMovement {
  id: string;
  shiftId: string;
  timestamp: string;
  type: 'ingreso' | 'egreso';
  amount: number;
  concept: string;
  operator: string;
}

export interface StoreSettings {
  storeName: string;       // Nombre del comercio piloto (Almacén Chiche)
  fantasyName: string;     // Nombre de marca (PUMPA CAJA)
  cuit: string;            // CUIT o identificación tributaria
  address: string;         // Dirección física
  phone: string;           // Teléfono o WhatsApp
  ticketFooter: string;    // Mensaje en el comprobante ("¡Gracias por su compra!")
  currencySymbol: string;  // Símbolo monetario ("$")
  enableSounds: boolean;   // Sonidos del sistema
  enableScannerBeep: boolean; // Beep al escanear
  lowStockThreshold: number; // Umbral general para alertas
}

export type ViewTab = 'ventas' | 'productos' | 'historial' | 'caja' | 'informes' | 'configuracion';
