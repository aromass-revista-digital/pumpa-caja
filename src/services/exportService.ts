import { Sale, Product, CashShift } from '../types';
import { formatDateTime } from './formatters';

// Export service with Excel UTF-8 BOM and ';' delimiter
export class ExportService {
  private static downloadCSV(filename: string, content: string): void {
    const BOM = '\uFEFF'; // Byte Order Mark for Excel UTF-8 recognition
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static exportSalesToCSV(sales: Sale[]): void {
    const headers = [
      'Nro Operación',
      'Fecha y Hora',
      'Medio de Pago',
      'Cant. Artículos',
      'Total Venta (ARS)',
      'Costo Total (ARS)',
      'Ganancia Estimada (ARS)',
      'Monto Recibido',
      'Vuelto',
      'Detalle de Productos'
    ];

    const rows = sales.map((sale) => {
      const itemsCount = sale.items.reduce((acc, i) => acc + i.quantity, 0);
      const itemsDetail = sale.items
        .map((i) => `${i.quantity}x ${i.name.replace(/;/g, ' ')} ($${i.unitPrice})`)
        .join(' | ');

      const profit = sale.total - sale.costTotal;

      return [
        sale.receiptNumber,
        formatDateTime(sale.timestamp),
        sale.paymentMethod.toUpperCase(),
        itemsCount,
        sale.total.toFixed(2).replace('.', ','),
        sale.costTotal.toFixed(2).replace('.', ','),
        profit.toFixed(2).replace('.', ','),
        sale.amountPaid ? sale.amountPaid.toFixed(2).replace('.', ',') : '',
        sale.changeGiven ? sale.changeGiven.toFixed(2).replace('.', ',') : '0,00',
        `"${itemsDetail}"`
      ].join(';');
    });

    const csvContent = [headers.join(';'), ...rows].join('\r\n');
    const dateStr = new Date().toISOString().split('T')[0];
    this.downloadCSV(`PUMPA_CAJA_Ventas_${dateStr}.csv`, csvContent);
  }

  static exportProductsToCSV(products: Product[]): void {
    const headers = [
      'Código de Barras',
      'Nombre del Producto',
      'Categoría',
      'Precio de Venta (ARS)',
      'Costo de Compra (ARS)',
      'Margen %',
      'Stock Actual',
      'Stock Mínimo',
      'Última Modificación'
    ];

    const rows = products.map((prod) => {
      const margin = prod.cost > 0 ? (((prod.price - prod.cost) / prod.cost) * 100).toFixed(1) + '%' : '0%';
      return [
        prod.barcode || '',
        `"${prod.name.replace(/"/g, '""')}"`,
        prod.category,
        prod.price.toFixed(2).replace('.', ','),
        prod.cost.toFixed(2).replace('.', ','),
        margin,
        prod.stock,
        prod.minStock,
        formatDateTime(prod.updatedAt)
      ].join(';');
    });

    const csvContent = [headers.join(';'), ...rows].join('\r\n');
    const dateStr = new Date().toISOString().split('T')[0];
    this.downloadCSV(`PUMPA_CAJA_Catalogo_Productos_${dateStr}.csv`, csvContent);
  }

  static exportShiftToCSV(shift: CashShift): void {
    const headers = ['Concepto', 'Monto (ARS)'];
    const rows = [
      ['Turno ID', shift.id],
      ['Fecha Apertura', formatDateTime(shift.openedAt)],
      ['Fecha Cierre', shift.closedAt ? formatDateTime(shift.closedAt) : 'Abierta'],
      ['Fondo Inicial de Caja', shift.initialAmount.toFixed(2).replace('.', ',')],
      ['Ventas en Efectivo (+)', shift.cashSales.toFixed(2).replace('.', ',')],
      ['Ingresos Manuales (+)', shift.manualIncomes.toFixed(2).replace('.', ',')],
      ['Egresos Manuales (-)', shift.manualExpenses.toFixed(2).replace('.', ',')],
      ['Efectivo Teórico Esperado', shift.expectedCash.toFixed(2).replace('.', ',')],
      ['Efectivo Real Contado', shift.actualCash !== null ? shift.actualCash.toFixed(2).replace('.', ',') : 'Pendiente'],
      ['Diferencia de Caja', shift.difference !== null ? shift.difference.toFixed(2).replace('.', ',') : 'Pendiente'],
      ['---', '---'],
      ['Ventas Transferencia (Digital)', shift.transferSales.toFixed(2).replace('.', ',')],
      ['Ventas Débito (Digital)', shift.debitSales.toFixed(2).replace('.', ',')],
      ['Ventas Crédito (Digital)', shift.creditSales.toFixed(2).replace('.', ',')],
      ['Ventas Otros Medios', shift.otherSales.toFixed(2).replace('.', ',')],
      ['Total General Facturado', (shift.cashSales + shift.transferSales + shift.debitSales + shift.creditSales + shift.otherSales).toFixed(2).replace('.', ',')]
    ];

    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const dateStr = shift.openedAt.split('T')[0];
    this.downloadCSV(`PUMPA_CAJA_Cierre_Caja_${dateStr}.csv`, csvContent);
  }
}
