import { state } from '../state';
import { db } from '../db/indexedDB';
import { Sale } from '../types';
import { formatCurrency, formatDateTime } from '../services/formatters';
import { icons } from './icons';
import { ExportService } from '../services/exportService';
import { SaleSuccessModal } from './SaleSuccessModal';

export class HistoryView {
  private static cachedSales: Sale[] = [];
  private static filterPeriod: 'hoy' | 'ayer' | 'semana' | 'mes' | 'todas' = 'hoy';
  private static filterMethod: string = 'todos';
  private static searchQuery: string = '';

  static async loadSales(): Promise<void> {
    this.cachedSales = await db.getSales();
  }

  static render(): string {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 6 * 86400000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const filtered = this.cachedSales.filter((sale) => {
      const saleTime = new Date(sale.timestamp).getTime();

      // Period filter
      if (this.filterPeriod === 'hoy') {
        if (saleTime < todayStart) return false;
      } else if (this.filterPeriod === 'ayer') {
        if (saleTime < yesterdayStart || saleTime >= todayStart) return false;
      } else if (this.filterPeriod === 'semana') {
        if (saleTime < weekStart) return false;
      } else if (this.filterPeriod === 'mes') {
        if (saleTime < monthStart) return false;
      }

      // Method filter
      if (this.filterMethod !== 'todos' && sale.paymentMethod !== this.filterMethod) {
        return false;
      }

      // Search filter (number or item name)
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        const matchNumber = sale.receiptNumber.toLowerCase().includes(q);
        const matchItem = sale.items.some((i) => i.name.toLowerCase().includes(q));
        return matchNumber || matchItem;
      }

      return true;
    });

    const totalFiltered = filtered.reduce((sum, s) => sum + s.total, 0);

    return `
      <div class="history-view-container">
        <!-- Top Summary and Toolbar -->
        <div class="history-toolbar">
          <div class="history-title-group">
            <h2>Historial de Ventas</h2>
            <span class="history-count-badge">${filtered.length} operaciones (${formatCurrency(totalFiltered)})</span>
          </div>

          <div class="history-actions">
            <button type="button" id="btnExportSalesCSV" class="btn-toolbar-action" title="Exportar ventas a Excel">
              ${icons.download}
              <span>Exportar a Excel (CSV)</span>
            </button>
          </div>
        </div>

        <!-- Filters Row -->
        <div class="history-filters-box">
          <!-- Periods -->
          <div class="periods-row">
            <span class="filter-label">Período:</span>
            <button type="button" class="period-btn ${this.filterPeriod === 'hoy' ? 'active' : ''}" data-period="hoy">Hoy</button>
            <button type="button" class="period-btn ${this.filterPeriod === 'ayer' ? 'active' : ''}" data-period="ayer">Ayer</button>
            <button type="button" class="period-btn ${this.filterPeriod === 'semana' ? 'active' : ''}" data-period="semana">Últimos 7 días</button>
            <button type="button" class="period-btn ${this.filterPeriod === 'mes' ? 'active' : ''}" data-period="mes">Este mes</button>
            <button type="button" class="period-btn ${this.filterPeriod === 'todas' ? 'active' : ''}" data-period="todas">Todas</button>
          </div>

          <!-- Payment methods & Search -->
          <div class="filter-inputs-row">
            <div class="search-input-wrapper">
              <span class="search-icon">${icons.search}</span>
              <input 
                type="text" 
                id="inputHistorySearch" 
                class="form-input" 
                placeholder="Buscar por Nro de comprobante o producto..." 
                value="${this.searchQuery}"
              />
            </div>

            <select id="selectHistoryMethod" class="form-select">
              <option value="todos" ${this.filterMethod === 'todos' ? 'selected' : ''}>Todos los medios de pago</option>
              <option value="efectivo" ${this.filterMethod === 'efectivo' ? 'selected' : ''}>Efectivo</option>
              <option value="transferencia" ${this.filterMethod === 'transferencia' ? 'selected' : ''}>Transferencia</option>
              <option value="debito" ${this.filterMethod === 'debito' ? 'selected' : ''}>Tarjeta Débito</option>
              <option value="credito" ${this.filterMethod === 'credito' ? 'selected' : ''}>Tarjeta Crédito</option>
              <option value="otro" ${this.filterMethod === 'otro' ? 'selected' : ''}>Otro</option>
            </select>
          </div>
        </div>

        <!-- Sales list table -->
        <div class="history-table-card">
          ${filtered.length === 0 ? `
            <div class="empty-history-state">
              <div class="empty-icon-circle">${icons.history}</div>
              <h4>No se encontraron ventas</h4>
              <p>No hay operaciones que coincidan con los filtros seleccionados.</p>
            </div>
          ` : `
            <div class="history-table-wrapper">
              <table class="history-table">
                <thead>
                  <tr>
                    <th>Comprobante</th>
                    <th>Fecha y Hora</th>
                    <th>Artículos</th>
                    <th>Medio de Pago</th>
                    <th>Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.map((s) => {
                    const totalQty = s.items.reduce((acc, i) => acc + i.quantity, 0);
                    const itemsSummary = s.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');

                    return `
                      <tr>
                        <td class="col-receipt"><strong>${s.receiptNumber}</strong></td>
                        <td class="col-datetime">${formatDateTime(s.timestamp)}</td>
                        <td class="col-items-detail" title="${itemsSummary}">
                          <span class="items-count-tag">${totalQty} art.</span>
                          <span class="items-preview-text">${itemsSummary}</span>
                        </td>
                        <td class="col-method">
                          <span class="method-tag method-${s.paymentMethod}">
                            ${s.paymentMethod.toUpperCase()}
                          </span>
                        </td>
                        <td class="col-total"><strong>${formatCurrency(s.total)}</strong></td>
                        <td class="col-action">
                          <button type="button" class="btn-view-ticket" data-id="${s.id}" title="Ver e imprimir ticket">
                            ${icons.printer}
                            <span>Ver Ticket</span>
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;
  }

  static attachEvents(container: HTMLElement): void {
    const periodBtns = container.querySelectorAll('.period-btn');
    const selectMethod = container.querySelector('#selectHistoryMethod') as HTMLSelectElement;
    const inputSearch = container.querySelector('#inputHistorySearch') as HTMLInputElement;
    const btnExport = container.querySelector('#btnExportSalesCSV');
    const viewTicketBtns = container.querySelectorAll('.btn-view-ticket');

    periodBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.filterPeriod = btn.getAttribute('data-period') as any;
        state.notify();
      });
    });

    selectMethod?.addEventListener('change', () => {
      this.filterMethod = selectMethod.value;
      state.notify();
    });

    inputSearch?.addEventListener('input', () => {
      this.searchQuery = inputSearch.value;
      state.notify();
    });

    btnExport?.addEventListener('click', () => {
      ExportService.exportSalesToCSV(this.cachedSales);
      state.showToast('Ventas exportadas en formato CSV para Excel', 'success');
    });

    viewTicketBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const sale = this.cachedSales.find((s) => s.id === id);
        if (sale) {
          SaleSuccessModal.open(sale);
        }
      });
    });
  }
}
