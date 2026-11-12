import { state } from '../state';
import { db } from '../db/indexedDB';
import { Sale } from '../types';
import { formatCurrency } from '../services/formatters';
import { icons } from './icons';

export class ReportsView {
  private static cachedSales: Sale[] = [];
  private static period: 'hoy' | 'semana' | 'mes' | 'total' = 'hoy';

  static async loadData(): Promise<void> {
    this.cachedSales = await db.getSales();
  }

  static render(): string {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 6 * 86400000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const filtered = this.cachedSales.filter((sale) => {
      const saleTime = new Date(sale.timestamp).getTime();
      if (this.period === 'hoy') return saleTime >= todayStart;
      if (this.period === 'semana') return saleTime >= weekStart;
      if (this.period === 'mes') return saleTime >= monthStart;
      return true;
    });

    const totalSales = filtered.reduce((acc, s) => acc + s.total, 0);
    const totalCost = filtered.reduce((acc, s) => acc + s.costTotal, 0);
    const totalProfit = totalSales - totalCost;
    const count = filtered.length;
    const avgTicket = count > 0 ? totalSales / count : 0;
    const profitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : '0';

    // Payment methods breakdown
    const methods: Record<string, number> = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      otro: 0
    };

    filtered.forEach((s) => {
      methods[s.paymentMethod] = (methods[s.paymentMethod] || 0) + s.total;
    });

    // Top products breakdown
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    filtered.forEach((sale) => {
      sale.items.forEach((item) => {
        const existing = productMap.get(item.productId) || { name: item.name, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += item.subtotal;
        productMap.set(item.productId, existing);
      });
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return `
      <div class="reports-view-container">
        <!-- Header & Period Filter -->
        <div class="reports-header-card">
          <div class="reports-title-group">
            <h2>Informes y Rendimiento</h2>
            <p>Resumen financiero del comercio Almacén Chiche</p>
          </div>

          <div class="reports-period-selector">
            <button type="button" class="report-tab ${this.period === 'hoy' ? 'active' : ''}" data-p="hoy">Hoy</button>
            <button type="button" class="report-tab ${this.period === 'semana' ? 'active' : ''}" data-p="semana">Últimos 7 días</button>
            <button type="button" class="report-tab ${this.period === 'mes' ? 'active' : ''}" data-p="mes">Este Mes</button>
            <button type="button" class="report-tab ${this.period === 'total' ? 'active' : ''}" data-p="total">Histórico Total</button>
          </div>
        </div>

        <!-- 4 Key Metrics Cards -->
        <div class="kpi-grid">
          <div class="kpi-card highlight-green">
            <div class="kpi-header">
              <span>Total Facturado</span>
              ${icons.cash}
            </div>
            <span class="kpi-value">${formatCurrency(totalSales)}</span>
            <span class="kpi-footer">Ingresos brutos del período</span>
          </div>

          <div class="kpi-card highlight-blue">
            <div class="kpi-header">
              <span>Ganancia Estimada</span>
              ${icons.box}
            </div>
            <span class="kpi-value">${formatCurrency(totalProfit)}</span>
            <span class="kpi-footer">Margen neto sobre ventas: ${profitMargin}%</span>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <span>Ventas Realizadas</span>
              ${icons.cart}
            </div>
            <span class="kpi-value">${count}</span>
            <span class="kpi-footer">Tickets y operaciones</span>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <span>Ticket Promedio</span>
              ${icons.reports}
            </div>
            <span class="kpi-value">${formatCurrency(avgTicket)}</span>
            <span class="kpi-footer">Gasto medio por cliente</span>
          </div>
        </div>

        <!-- Detailed Visual Breakdown -->
        <div class="reports-sections-grid">
          <!-- Payment methods distribution -->
          <div class="report-box-card">
            <div class="box-card-header">
              ${icons.card}
              <h3>Medios de Pago Utilizados</h3>
            </div>

            <div class="methods-progress-list">
              ${Object.entries(methods).map(([method, amount]) => {
                const pct = totalSales > 0 ? ((amount / totalSales) * 100).toFixed(0) : '0';
                return `
                  <div class="method-bar-group">
                    <div class="method-bar-header">
                      <span class="method-title">${method.toUpperCase()}</span>
                      <span class="method-val">${formatCurrency(amount)} (${pct}%)</span>
                    </div>
                    <div class="method-progress-track">
                      <div class="method-progress-fill fill-${method}" style="width: ${pct}%"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Top products ranking -->
          <div class="report-box-card">
            <div class="box-card-header">
              ${icons.box}
              <h3>Productos Más Vendidos</h3>
            </div>

            ${topProducts.length === 0 ? `
              <p class="empty-movements-text">No hay suficientes ventas en este período para generar el ranking.</p>
            ` : `
              <div class="top-products-list">
                ${topProducts.map((p, idx) => `
                  <div class="top-product-row">
                    <div class="rank-badge rank-${idx + 1}">${idx + 1}</div>
                    <div class="top-product-info">
                      <strong>${p.name}</strong>
                      <span>${p.quantity} unidades vendidas</span>
                    </div>
                    <div class="top-product-revenue">
                      ${formatCurrency(p.revenue)}
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  static attachEvents(container: HTMLElement): void {
    const tabs = container.querySelectorAll('.report-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        this.period = tab.getAttribute('data-p') as any;
        state.notify();
      });
    });
  }
}
