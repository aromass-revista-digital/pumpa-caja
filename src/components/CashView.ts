import { state } from '../state';
import { db } from '../db/indexedDB';
import { CashShift, CashMovement } from '../types';
import { formatCurrency, formatDateTime } from '../services/formatters';
import { icons } from './icons';
import { ExportService } from '../services/exportService';

export class CashView {
  private static cachedPastShifts: CashShift[] = [];
  private static cachedMovements: CashMovement[] = [];

  static async loadData(): Promise<void> {
    const allShifts = await db.getCashShifts();
    this.cachedPastShifts = allShifts.filter((s) => s.status === 'cerrada');
    if (state.activeShift) {
      this.cachedMovements = await db.getCashMovements(state.activeShift.id);
    } else {
      this.cachedMovements = [];
    }
  }

  static render(): string {
    const shift = state.activeShift;
    const isOpen = shift && shift.status === 'abierta';

    return `
      <div class="cash-view-container">
        <!-- Top Cash Drawer Status Card -->
        <div class="cash-status-hero-card ${isOpen ? 'status-open' : 'status-closed'}">
          <div class="hero-header-row">
            <div class="hero-title-group">
              <div class="hero-status-pill">
                <span class="status-pulse-dot"></span>
                <strong>${isOpen ? 'CAJA ABIERTA' : 'CAJA CERRADA'}</strong>
              </div>
              <span class="hero-timestamp">
                ${isOpen ? `Abierta desde el ${formatDateTime(shift.openedAt)}` : 'No hay ningún turno de caja activo en este momento'}
              </span>
            </div>

            <div class="hero-actions">
              ${isOpen ? `
                <button type="button" id="btnCloseCashShift" class="btn-hero-close-shift">
                  ${icons.check}
                  <span>Cerrar Caja (Arqueo)</span>
                </button>
              ` : `
                <button type="button" id="btnOpenCashShift" class="btn-hero-open-shift">
                  ${icons.plus}
                  <span>Abrir Caja de Turno</span>
                </button>
              `}
            </div>
          </div>

          ${isOpen ? `
            <!-- Live Active Shift Numbers -->
            <div class="cash-metrics-grid">
              <div class="metric-card primary-expected">
                <span class="metric-label">Efectivo Teórico en Caja</span>
                <span class="metric-value">${formatCurrency(shift.expectedCash)}</span>
                <span class="metric-subtext">Debe haber en el cajón de dinero</span>
              </div>

              <div class="metric-card">
                <span class="metric-label">Fondo Inicial (Cambio)</span>
                <span class="metric-value">${formatCurrency(shift.initialAmount)}</span>
                <span class="metric-subtext">Monto con el que abrió la caja</span>
              </div>

              <div class="metric-card">
                <span class="metric-label">Ventas en Efectivo (+)</span>
                <span class="metric-value text-green">${formatCurrency(shift.cashSales)}</span>
                <span class="metric-subtext">Cobrado en mano</span>
              </div>

              <div class="metric-card">
                <span class="metric-label">Ingresos Manuales (+)</span>
                <span class="metric-value text-blue">+${formatCurrency(shift.manualIncomes)}</span>
                <span class="metric-subtext">Aportes / cobranzas</span>
              </div>

              <div class="metric-card">
                <span class="metric-label">Egresos Manuales (-)</span>
                <span class="metric-value text-red">-${formatCurrency(shift.manualExpenses)}</span>
                <span class="metric-subtext">Gastos / proveedores</span>
              </div>
            </div>
          ` : `
            <div class="closed-shift-instructions">
              <p>Al abrir la caja podrás ingresar el fondo inicial para cambio, registrar ingresos y egresos de efectivo, y realizar el arqueo con cálculo automático de diferencias al finalizar la jornada.</p>
            </div>
          `}
        </div>

        ${isOpen ? `
          <!-- Electronic Sales & Drawer Actions -->
          <div class="cash-middle-row">
            <!-- Non-cash payment methods card -->
            <div class="cash-digital-card">
              <div class="section-title-row">
                ${icons.card}
                <h3>Cobros Digitales del Turno</h3>
              </div>
              <div class="digital-breakdown-list">
                <div class="digital-row">
                  <span>Transferencias (Mercado Pago / Alias)</span>
                  <strong>${formatCurrency(shift.transferSales)}</strong>
                </div>
                <div class="digital-row">
                  <span>Tarjetas de Débito</span>
                  <strong>${formatCurrency(shift.debitSales)}</strong>
                </div>
                <div class="digital-row">
                  <span>Tarjetas de Crédito</span>
                  <strong>${formatCurrency(shift.creditSales)}</strong>
                </div>
                <div class="digital-row">
                  <span>Otros medios</span>
                  <strong>${formatCurrency(shift.otherSales)}</strong>
                </div>
                <div class="digital-total-row">
                  <span>Total Facturado del Turno (Efectivo + Digital)</span>
                  <span class="big-turn-total">${formatCurrency(shift.cashSales + shift.transferSales + shift.debitSales + shift.creditSales + shift.otherSales)}</span>
                </div>
              </div>
            </div>

            <!-- Manual Movement Quick Buttons -->
            <div class="cash-actions-card">
              <div class="section-title-row">
                ${icons.cash}
                <h3>Movimientos Manuales de Efectivo</h3>
              </div>
              <p class="section-subtext">Registrá retiros para pago de proveedores o ingresos de cambio.</p>
              
              <div class="movement-buttons-row">
                <button type="button" id="btnAddIncome" class="btn-movement-income">
                  ${icons.plus}
                  <span>Ingreso de Efectivo</span>
                </button>
                <button type="button" id="btnAddExpense" class="btn-movement-expense">
                  ${icons.minus}
                  <span>Egreso / Retiro de Efectivo</span>
                </button>
              </div>

              <!-- List of movements in current shift -->
              <div class="movements-list-wrapper">
                <h4>Movimientos registrados en este turno (${this.cachedMovements.length})</h4>
                ${this.cachedMovements.length === 0 ? `
                  <p class="empty-movements-text">No se registraron movimientos manuales aún.</p>
                ` : `
                  <div class="movements-table-box">
                    ${this.cachedMovements.map((m) => `
                      <div class="movement-item-row ${m.type === 'ingreso' ? 'mov-income' : 'mov-expense'}">
                        <div class="mov-details">
                          <span class="mov-concept">${m.concept}</span>
                          <span class="mov-time">${formatDateTime(m.timestamp)}</span>
                        </div>
                        <span class="mov-amount">
                          ${m.type === 'ingreso' ? '+' : '-'}${formatCurrency(m.amount)}
                        </span>
                      </div>
                    `).join('')}
                  </div>
                `}
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Past Closed Shifts History -->
        <div class="past-shifts-card">
          <div class="section-title-row">
            ${icons.history}
            <h3>Historial de Cierres de Caja Anteriores</h3>
          </div>

          ${this.cachedPastShifts.length === 0 ? `
            <p class="empty-movements-text">Aún no hay cierres de caja archivados.</p>
          ` : `
            <div class="past-shifts-table-wrapper">
              <table class="past-shifts-table">
                <thead>
                  <tr>
                    <th>Fecha Apertura</th>
                    <th>Fecha Cierre</th>
                    <th>Fondo Inicial</th>
                    <th>Vendido Total</th>
                    <th>Efectivo Esperado</th>
                    <th>Efectivo Contado</th>
                    <th>Diferencia</th>
                    <th>Reporte</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.cachedPastShifts.map((s) => {
                    const diff = s.difference || 0;
                    const diffClass = diff === 0 ? 'diff-exact' : diff > 0 ? 'diff-surplus' : 'diff-shortage';
                    const diffText = diff === 0 ? 'Exacto' : diff > 0 ? `+${formatCurrency(diff)} (Sobrante)` : `${formatCurrency(diff)} (Faltante)`;
                    const totalTurno = s.cashSales + s.transferSales + s.debitSales + s.creditSales + s.otherSales;

                    return `
                      <tr>
                        <td>${formatDateTime(s.openedAt)}</td>
                        <td>${s.closedAt ? formatDateTime(s.closedAt) : '—'}</td>
                        <td>${formatCurrency(s.initialAmount)}</td>
                        <td><strong>${formatCurrency(totalTurno)}</strong></td>
                        <td>${formatCurrency(s.expectedCash)}</td>
                        <td><strong>${s.actualCash !== null ? formatCurrency(s.actualCash) : '—'}</strong></td>
                        <td><span class="diff-badge ${diffClass}">${diffText}</span></td>
                        <td>
                          <button type="button" class="btn-download-shift" data-id="${s.id}" title="Descargar reporte en CSV">
                            ${icons.download}
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
    const btnOpen = container.querySelector('#btnOpenCashShift');
    const btnClose = container.querySelector('#btnCloseCashShift');
    const btnIncome = container.querySelector('#btnAddIncome');
    const btnExpense = container.querySelector('#btnAddExpense');
    const downloadBtns = container.querySelectorAll('.btn-download-shift');

    btnOpen?.addEventListener('click', () => {
      this.openCashDrawerModal();
    });

    btnClose?.addEventListener('click', () => {
      if (state.activeShift) {
        this.openArqueoModal(state.activeShift);
      }
    });

    btnIncome?.addEventListener('click', () => {
      this.openMovementModal('ingreso');
    });

    btnExpense?.addEventListener('click', () => {
      this.openMovementModal('egreso');
    });

    downloadBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const shift = this.cachedPastShifts.find((s) => s.id === id);
        if (shift) {
          ExportService.exportShiftToCSV(shift);
          state.showToast('Reporte de turno descargado', 'success');
        }
      });
    });
  }

  // 1. Apertura de caja modal
  private static openCashDrawerModal(): void {
    const modal = document.createElement('div');
    modal.className = 'quick-modal-overlay';
    modal.innerHTML = `
      <div class="quick-modal-card">
        <div class="quick-modal-header">
          <div class="quick-title-group">
            ${icons.cash}
            <h3>Apertura de Caja</h3>
          </div>
          <button id="btnModalClose" class="btn-icon-close" aria-label="Cerrar modal">
            ${icons.close}
          </button>
        </div>

        <form id="formOpenShift" class="quick-product-form">
          <p class="modal-description-text">
            Ingresá el fondo inicial de dinero en efectivo con el que comienza el turno para dar cambio a los clientes.
          </p>

          <div class="form-group">
            <label for="inputInitialCash">Fondo inicial de efectivo (ARS) *</label>
            <div class="input-currency-wrapper">
              <span class="currency-prefix">$</span>
              <input type="number" id="inputInitialCash" class="form-input" value="10000" min="0" step="500" autofocus required />
            </div>
          </div>

          <div class="quick-bills-row">
            <button type="button" class="btn-quick-bill btn-quick-init" data-val="5000">$5.000</button>
            <button type="button" class="btn-quick-bill btn-quick-init" data-val="10000">$10.000</button>
            <button type="button" class="btn-quick-bill btn-quick-init" data-val="15000">$15.000</button>
            <button type="button" class="btn-quick-bill btn-quick-init" data-val="20000">$20.000</button>
          </div>

          <div class="form-group">
            <label for="inputShiftNotes">Observaciones / Nombre de cajero</label>
            <input type="text" id="inputShiftNotes" class="form-input" placeholder="Ej: Turno mañana - Chiche" />
          </div>

          <div class="quick-modal-actions">
            <button type="button" id="btnModalCancel" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary-confirm">
              ${icons.check}
              <span>Abrir Caja Ahora</span>
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const cleanup = () => {
      if (modal.parentNode) modal.parentNode.removeChild(modal);
    };

    modal.querySelector('#btnModalClose')?.addEventListener('click', cleanup);
    modal.querySelector('#btnModalCancel')?.addEventListener('click', cleanup);

    const inputVal = modal.querySelector('#inputInitialCash') as HTMLInputElement;
    modal.querySelectorAll('.btn-quick-init').forEach((b) => {
      b.addEventListener('click', () => {
        if (inputVal) inputVal.value = b.getAttribute('data-val') || '10000';
      });
    });

    modal.querySelector('#formOpenShift')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const amount = parseFloat(inputVal.value) || 0;
      const notes = (modal.querySelector('#inputShiftNotes') as HTMLInputElement).value.trim();

      try {
        await db.openCashShift(amount, notes);
        await state.refreshActiveShift();
        await CashView.loadData();
        state.showToast('Caja abierta correctamente', 'success');
        cleanup();
        state.notify();
      } catch (err: any) {
        alert(err.message || 'Error al abrir caja');
      }
    });
  }

  // 2. Registro de Ingreso o Egreso manual
  private static openMovementModal(type: 'ingreso' | 'egreso'): void {
    if (!state.activeShift) {
      alert('Debés tener una caja abierta para registrar movimientos de dinero.');
      return;
    }

    const isIncome = type === 'ingreso';

    const modal = document.createElement('div');
    modal.className = 'quick-modal-overlay';
    modal.innerHTML = `
      <div class="quick-modal-card">
        <div class="quick-modal-header">
          <div class="quick-title-group">
            ${isIncome ? icons.plus : icons.minus}
            <h3>${isIncome ? 'Registrar Ingreso de Efectivo' : 'Registrar Egreso / Retiro de Efectivo'}</h3>
          </div>
          <button id="btnMovClose" class="btn-icon-close" aria-label="Cerrar modal">
            ${icons.close}
          </button>
        </div>

        <form id="formMovement" class="quick-product-form">
          <div class="form-group">
            <label for="inputMovConcept">Motivo o Concepto *</label>
            <input 
              type="text" 
              id="inputMovConcept" 
              class="form-input" 
              placeholder="${isIncome ? 'Ej: Aporte de cambio extra' : 'Ej: Pago proveedor pan / Retiro'}" 
              required 
            />
          </div>

          <div class="form-group">
            <label for="inputMovAmount">Monto de Efectivo (ARS) *</label>
            <div class="input-currency-wrapper">
              <span class="currency-prefix">$</span>
              <input type="number" id="inputMovAmount" class="form-input" min="50" step="50" placeholder="0" autofocus required />
            </div>
          </div>

          <div class="quick-bills-row">
            <button type="button" class="btn-quick-bill btn-quick-m" data-val="1000">$1.000</button>
            <button type="button" class="btn-quick-bill btn-quick-m" data-val="2000">$2.000</button>
            <button type="button" class="btn-quick-bill btn-quick-m" data-val="5000">$5.000</button>
            <button type="button" class="btn-quick-bill btn-quick-m" data-val="10000">$10.000</button>
          </div>

          <div class="quick-modal-actions">
            <button type="button" id="btnMovCancel" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary-confirm ${!isIncome ? 'danger-btn' : ''}">
              ${icons.check}
              <span>${isIncome ? 'Registrar Ingreso' : 'Registrar Retiro'}</span>
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const cleanup = () => {
      if (modal.parentNode) modal.parentNode.removeChild(modal);
    };

    modal.querySelector('#btnMovClose')?.addEventListener('click', cleanup);
    modal.querySelector('#btnMovCancel')?.addEventListener('click', cleanup);

    const inputAmt = modal.querySelector('#inputMovAmount') as HTMLInputElement;
    modal.querySelectorAll('.btn-quick-m').forEach((b) => {
      b.addEventListener('click', () => {
        if (inputAmt) inputAmt.value = b.getAttribute('data-val') || '1000';
      });
    });

    modal.querySelector('#formMovement')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const concept = (modal.querySelector('#inputMovConcept') as HTMLInputElement).value.trim();
      const amount = parseFloat(inputAmt.value) || 0;

      if (!concept || amount <= 0) {
        alert('Por favor completá el motivo y un monto válido.');
        return;
      }

      const movement: CashMovement = {
        id: `mov-${Date.now()}`,
        shiftId: state.activeShift!.id,
        timestamp: new Date().toISOString(),
        type,
        amount,
        concept,
        operator: state.settings.storeName
      };

      await db.addCashMovement(movement);
      await state.refreshActiveShift();
      await CashView.loadData();

      state.showToast(`${isIncome ? 'Ingreso' : 'Egreso'} de ${formatCurrency(amount)} registrado`, 'info');
      cleanup();
      state.notify();
    });
  }

  // 3. Arqueo y Cierre de caja
  private static openArqueoModal(shift: CashShift): void {
    const expected = shift.expectedCash;

    const modal = document.createElement('div');
    modal.className = 'quick-modal-overlay';
    modal.innerHTML = `
      <div class="quick-modal-card arqueo-card">
        <div class="quick-modal-header">
          <div class="quick-title-group">
            ${icons.check}
            <h3>Cierre de Caja y Arqueo</h3>
          </div>
          <button id="btnArqueoClose" class="btn-icon-close" aria-label="Cerrar modal">
            ${icons.close}
          </button>
        </div>

        <form id="formArqueo" class="quick-product-form">
          <div class="arqueo-expected-banner">
            <span class="label">Efectivo Teórico Esperado</span>
            <span class="amount">${formatCurrency(expected)}</span>
            <span class="sub">Fondo Inicial ($${shift.initialAmount}) + Ventas Efectivo ($${shift.cashSales}) + Ingresos ($${shift.manualIncomes}) - Egresos ($${shift.manualExpenses})</span>
          </div>

          <div class="form-group">
            <label for="inputCountedCash">Efectivo Contado en Mano (Arqueo Real) *</label>
            <div class="input-currency-wrapper">
              <span class="currency-prefix">$</span>
              <input type="number" id="inputCountedCash" class="form-input" value="${expected}" min="0" step="50" autofocus required />
            </div>
          </div>

          <!-- Difference preview card -->
          <div id="diffCard" class="arqueo-diff-box diff-ok">
            <span class="diff-title">Diferencia de Caja</span>
            <span id="diffValue" class="diff-val">$ 0 (Caja Exacta)</span>
          </div>

          <div class="form-group">
            <label for="inputArqueoNotes">Notas de Cierre (Opcional)</label>
            <input type="text" id="inputArqueoNotes" class="form-input" placeholder="Ej: Todo cuadrado sin faltantes" />
          </div>

          <div class="quick-modal-actions">
            <button type="button" id="btnArqueoCancel" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary-confirm">
              ${icons.check}
              <span>Confirmar Cierre de Caja</span>
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const cleanup = () => {
      if (modal.parentNode) modal.parentNode.removeChild(modal);
    };

    modal.querySelector('#btnArqueoClose')?.addEventListener('click', cleanup);
    modal.querySelector('#btnArqueoCancel')?.addEventListener('click', cleanup);

    const inputCounted = modal.querySelector('#inputCountedCash') as HTMLInputElement;
    const diffCard = modal.querySelector('#diffCard') as HTMLElement;
    const diffValue = modal.querySelector('#diffValue') as HTMLElement;

    const updateDiff = () => {
      const counted = parseFloat(inputCounted.value) || 0;
      const diff = counted - expected;

      if (diff === 0) {
        diffCard.className = 'arqueo-diff-box diff-ok';
        diffValue.textContent = '$ 0 (Caja Exacta)';
      } else if (diff > 0) {
        diffCard.className = 'arqueo-diff-box diff-surplus';
        diffValue.textContent = `+${formatCurrency(diff)} (Sobrante de dinero)`;
      } else {
        diffCard.className = 'arqueo-diff-box diff-shortage';
        diffValue.textContent = `${formatCurrency(diff)} (Faltante de dinero)`;
      }
    };

    inputCounted?.addEventListener('input', updateDiff);

    modal.querySelector('#formArqueo')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const counted = parseFloat(inputCounted.value) || 0;
      const notes = (modal.querySelector('#inputArqueoNotes') as HTMLInputElement).value.trim();

      const closedShift = await db.closeCashShift(shift.id, counted, notes);
      await state.refreshActiveShift();
      await CashView.loadData();

      state.showToast('Caja cerrada correctamente. Turno archivado.', 'success');
      cleanup();

      // Offer to download shift report
      if (confirm('¿Deseás descargar el reporte en CSV de este cierre de caja para Excel?')) {
        ExportService.exportShiftToCSV(closedShift);
      }

      state.notify();
    });
  }
}
