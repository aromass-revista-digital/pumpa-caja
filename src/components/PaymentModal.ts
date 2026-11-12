import { state } from '../state';
import { db } from '../db/indexedDB';
import { PaymentMethod, Sale, SaleItem } from '../types';
import { formatCurrency } from '../services/formatters';
import { sounds } from '../services/soundService';
import { icons } from './icons';
import { SaleSuccessModal } from './SaleSuccessModal';

export class PaymentModal {
  private static modalEl: HTMLElement | null = null;
  private static selectedMethod: PaymentMethod = 'efectivo';
  private static amountPaid: number = 0;

  static open(): void {
    const total = state.getCartTotal();
    if (total <= 0) {
      state.showToast('El carrito está vacío', 'warning');
      return;
    }

    this.selectedMethod = 'efectivo';
    this.amountPaid = total; // default to exact amount

    const isShiftOpen = state.activeShift && state.activeShift.status === 'abierta';

    const modal = document.createElement('div');
    modal.className = 'payment-modal-overlay';
    modal.id = 'paymentModal';
    modal.innerHTML = `
      <div class="payment-card">
        <div class="payment-header">
          <div class="payment-title-group">
            ${icons.cash}
            <h3>Cobrar Venta</h3>
          </div>
          <button id="btnPaymentClose" class="btn-icon-close" aria-label="Cerrar modal">
            ${icons.close}
          </button>
        </div>

        <div class="payment-total-banner">
          <span class="total-label">Total a cobrar</span>
          <span class="total-amount">${formatCurrency(total)}</span>
        </div>

        ${!isShiftOpen ? `
          <div class="shift-warning-banner">
            ${icons.alert}
            <span>Atención: La caja no está abierta. Se registrará la venta sin turno activo.</span>
          </div>
        ` : ''}

        <div class="payment-methods-selector">
          <label class="section-label">Medio de pago</label>
          <div class="methods-grid">
            <button type="button" class="method-btn active" data-method="efectivo">
              ${icons.cash}
              <span>Efectivo</span>
            </button>
            <button type="button" class="method-btn" data-method="transferencia">
              ${icons.transfer}
              <span>Transferencia</span>
            </button>
            <button type="button" class="method-btn" data-method="debito">
              ${icons.card}
              <span>Débito</span>
            </button>
            <button type="button" class="method-btn" data-method="credito">
              ${icons.card}
              <span>Crédito</span>
            </button>
            <button type="button" class="method-btn" data-method="otro">
              ${icons.box}
              <span>Otro</span>
            </button>
          </div>
        </div>

        <!-- Cash specific section -->
        <div id="cashDetailsSection" class="cash-details-section">
          <label class="section-label" for="inputAmountPaid">Monto recibido</label>
          <div class="input-currency-wrapper">
            <span class="currency-prefix">$</span>
            <input 
              type="number" 
              id="inputAmountPaid" 
              class="input-amount-paid" 
              value="${total}" 
              min="0" 
              step="50"
              autocomplete="off"
            />
          </div>

          <!-- Quick Cash Bills in ARS -->
          <div class="quick-bills-row">
            <button type="button" class="btn-quick-bill" data-amount="${total}">Exacto</button>
            <button type="button" class="btn-quick-bill" data-amount="1000">$1.000</button>
            <button type="button" class="btn-quick-bill" data-amount="2000">$2.000</button>
            <button type="button" class="btn-quick-bill" data-amount="5000">$5.000</button>
            <button type="button" class="btn-quick-bill" data-amount="10000">$10.000</button>
            <button type="button" class="btn-quick-bill" data-amount="20000">$20.000</button>
          </div>

          <!-- Change / Vuelto Calculation -->
          <div id="changeDisplayCard" class="change-display-card">
            <span class="change-label">Vuelto a entregar</span>
            <span id="changeAmount" class="change-amount">$ 0</span>
          </div>
        </div>

        <!-- Other payment message (transfer/cards) -->
        <div id="electronicDetailsSection" class="electronic-details-section" style="display: none;">
          <div class="electronic-info-box">
            <p>Se registrará el cobro exacto de <strong>${formatCurrency(total)}</strong> sin cálculo de vuelto.</p>
          </div>
        </div>

        <div class="payment-actions">
          <button type="button" id="btnPaymentCancel" class="btn-secondary">Cancelar</button>
          <button type="button" id="btnPaymentConfirm" class="btn-primary-confirm">
            ${icons.check}
            <span>Confirmar Cobro</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;

    this.attachEvents(modal, total);
    this.updateChangeCalculation(total);
  }

  private static attachEvents(modal: HTMLElement, total: number): void {
    const btnClose = modal.querySelector('#btnPaymentClose');
    const btnCancel = modal.querySelector('#btnPaymentCancel');
    const btnConfirm = modal.querySelector('#btnPaymentConfirm') as HTMLButtonElement;
    const inputPaid = modal.querySelector('#inputAmountPaid') as HTMLInputElement;
    const methodBtns = modal.querySelectorAll('.method-btn');
    const quickBills = modal.querySelectorAll('.btn-quick-bill');
    const cashSection = modal.querySelector('#cashDetailsSection') as HTMLElement;
    const electronicSection = modal.querySelector('#electronicDetailsSection') as HTMLElement;

    btnClose?.addEventListener('click', () => this.close());
    btnCancel?.addEventListener('click', () => this.close());

    // Switch payment methods
    methodBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        methodBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const method = btn.getAttribute('data-method') as PaymentMethod;
        this.selectedMethod = method;

        if (method === 'efectivo') {
          cashSection.style.display = 'block';
          electronicSection.style.display = 'none';
          this.amountPaid = parseFloat(inputPaid.value) || total;
          this.updateChangeCalculation(total);
        } else {
          cashSection.style.display = 'none';
          electronicSection.style.display = 'block';
          this.amountPaid = total;
          btnConfirm.disabled = false;
        }
      });
    });

    // Input paid amount
    inputPaid?.addEventListener('input', () => {
      this.amountPaid = parseFloat(inputPaid.value) || 0;
      this.updateChangeCalculation(total);
    });

    // Quick bill buttons
    quickBills.forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = parseFloat(btn.getAttribute('data-amount') || '0');
        if (inputPaid) {
          inputPaid.value = String(val);
        }
        this.amountPaid = val;
        this.updateChangeCalculation(total);
      });
    });

    // Confirm payment
    btnConfirm?.addEventListener('click', async () => {
      btnConfirm.disabled = true;
      btnConfirm.innerHTML = '<span>Procesando...</span>';

      try {
        await this.processSale(total);
        this.close();
      } catch (err: any) {
        alert('Error al registrar la venta: ' + (err.message || err));
        btnConfirm.disabled = false;
        btnConfirm.innerHTML = `${icons.check} <span>Confirmar Cobro</span>`;
      }
    });
  }

  private static updateChangeCalculation(total: number): void {
    if (!this.modalEl) return;
    const changeCard = this.modalEl.querySelector('#changeDisplayCard') as HTMLElement;
    const changeAmount = this.modalEl.querySelector('#changeAmount') as HTMLElement;
    const btnConfirm = this.modalEl.querySelector('#btnPaymentConfirm') as HTMLButtonElement;

    if (!changeCard || !changeAmount || !btnConfirm) return;

    if (this.selectedMethod !== 'efectivo') {
      btnConfirm.disabled = false;
      return;
    }

    const difference = this.amountPaid - total;

    if (difference >= 0) {
      changeCard.className = 'change-display-card change-ok';
      changeCard.querySelector('.change-label')!.textContent = 'Vuelto a entregar';
      changeAmount.textContent = formatCurrency(difference);
      btnConfirm.disabled = false;
    } else {
      changeCard.className = 'change-display-card change-short';
      changeCard.querySelector('.change-label')!.textContent = 'Importe insuficiente';
      changeAmount.textContent = `Faltan ${formatCurrency(Math.abs(difference))}`;
      btnConfirm.disabled = true;
    }
  }

  private static async processSale(total: number): Promise<void> {
    const costTotal = state.getCartCostTotal();
    const receiptNumber = await db.getNextReceiptNumber();

    const items: SaleItem[] = state.cart.map((cartItem) => ({
      productId: cartItem.product.id,
      name: cartItem.product.name,
      barcode: cartItem.product.barcode,
      quantity: cartItem.quantity,
      unitPrice: cartItem.product.price,
      unitCost: cartItem.product.cost,
      subtotal: cartItem.subtotal
    }));

    const changeGiven = this.selectedMethod === 'efectivo' ? Math.max(0, this.amountPaid - total) : 0;

    const sale: Sale = {
      id: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      receiptNumber,
      timestamp: new Date().toISOString(),
      items,
      total,
      costTotal,
      paymentMethod: this.selectedMethod,
      amountPaid: this.amountPaid,
      changeGiven,
      shiftId: state.activeShift ? state.activeShift.id : null
    };

    // Save to IndexedDB (updates sales, stock, and cash shift)
    await db.saveSale(sale);

    // Audio & Visual celebratory feedback
    sounds.playSuccess();

    // Reset cart and update caches
    state.clearCart();
    await state.refreshProducts();
    await state.refreshActiveShift();

    // Show completion ticket modal
    SaleSuccessModal.open(sale);
  }

  static close(): void {
    if (this.modalEl && this.modalEl.parentNode) {
      this.modalEl.parentNode.removeChild(this.modalEl);
      this.modalEl = null;
    }
  }
}
