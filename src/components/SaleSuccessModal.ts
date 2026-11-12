import confetti from 'canvas-confetti';
import { Sale } from '../types';
import { state } from '../state';
import { formatCurrency, formatDateTime } from '../services/formatters';
import { icons } from './icons';

export class SaleSuccessModal {
  private static modalEl: HTMLElement | null = null;

  static open(sale: Sale): void {
    this.close();

    // Trigger confetti for celebration
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    const modal = document.createElement('div');
    modal.className = 'success-modal-overlay';
    modal.id = 'saleSuccessModal';

    const isCash = sale.paymentMethod === 'efectivo';

    modal.innerHTML = `
      <div class="success-card">
        <div class="success-top-badge">
          <div class="success-icon-circle">
            ${icons.check}
          </div>
          <h2>¡Venta Registrada!</h2>
          <span class="sale-number">Comprobante: ${sale.receiptNumber}</span>
        </div>

        ${isCash ? `
          <div class="success-change-banner">
            <span class="change-banner-title">Vuelto a entregar</span>
            <span class="change-banner-val">${formatCurrency(sale.changeGiven)}</span>
            <span class="change-banner-detail">Recibido: ${formatCurrency(sale.amountPaid)} — Total: ${formatCurrency(sale.total)}</span>
          </div>
        ` : `
          <div class="success-change-banner digital-banner">
            <span class="change-banner-title">Cobro Registrado</span>
            <span class="change-banner-val">${formatCurrency(sale.total)}</span>
            <span class="change-banner-detail">Medio de pago: ${sale.paymentMethod.toUpperCase()}</span>
          </div>
        `}

        <!-- Printable / Shareable Virtual Receipt -->
        <div class="ticket-preview-box" id="ticketPrintArea">
          <div class="ticket-header">
            <h3>${state.settings.storeName}</h3>
            <p>${state.settings.fantasyName}</p>
            ${state.settings.cuit ? `<p>CUIT: ${state.settings.cuit}</p>` : ''}
            ${state.settings.address ? `<p>${state.settings.address}</p>` : ''}
            ${state.settings.phone ? `<p>Tel: ${state.settings.phone}</p>` : ''}
            <div class="ticket-divider">================================</div>
            <p>Comprobante: ${sale.receiptNumber}</p>
            <p>Fecha: ${formatDateTime(sale.timestamp)}</p>
            <div class="ticket-divider">================================</div>
          </div>

          <div class="ticket-items-list">
            ${sale.items.map((item) => `
              <div class="ticket-item-row">
                <span class="ticket-item-name">${item.quantity}x ${item.name}</span>
                <span class="ticket-item-price">${formatCurrency(item.subtotal)}</span>
              </div>
            `).join('')}
          </div>

          <div class="ticket-divider">================================</div>
          
          <div class="ticket-totals">
            <div class="ticket-total-row">
              <strong>TOTAL</strong>
              <strong>${formatCurrency(sale.total)}</strong>
            </div>
            <div class="ticket-sub-row">
              <span>Pago (${sale.paymentMethod.toUpperCase()})</span>
              <span>${formatCurrency(sale.amountPaid || sale.total)}</span>
            </div>
            ${isCash ? `
              <div class="ticket-sub-row">
                <span>Vuelto</span>
                <span>${formatCurrency(sale.changeGiven)}</span>
              </div>
            ` : ''}
          </div>

          <div class="ticket-footer">
            <p>${state.settings.ticketFooter}</p>
            <p class="pumpa-watermark">PUMPA CAJA — Sistema de Ventas</p>
          </div>
        </div>

        <div class="success-actions">
          <div class="action-buttons-row">
            <button type="button" id="btnShareTicket" class="btn-ticket-secondary" title="Compartir ticket por WhatsApp o mensaje">
              ${icons.share}
              <span>Compartir</span>
            </button>
            <button type="button" id="btnPrintTicket" class="btn-ticket-secondary" title="Imprimir ticket térmico">
              ${icons.printer}
              <span>Imprimir</span>
            </button>
          </div>

          <button type="button" id="btnNewSale" class="btn-primary-new-sale">
            ${icons.plus}
            <span>Nueva Venta</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;

    this.attachEvents(modal, sale);
  }

  private static attachEvents(modal: HTMLElement, sale: Sale): void {
    const btnNewSale = modal.querySelector('#btnNewSale');
    const btnPrint = modal.querySelector('#btnPrintTicket');
    const btnShare = modal.querySelector('#btnShareTicket');

    btnNewSale?.addEventListener('click', () => {
      this.close();
      state.setTab('ventas');
    });

    btnPrint?.addEventListener('click', () => {
      window.print();
    });

    btnShare?.addEventListener('click', () => {
      this.shareTicket(sale);
    });
  }

  private static shareTicket(sale: Sale): void {
    const itemsText = sale.items
      .map((i) => `• ${i.quantity}x ${i.name}: ${formatCurrency(i.subtotal)}`)
      .join('\n');

    const ticketText = `🧾 *${state.settings.storeName}*\n` +
      `Ticket N°: ${sale.receiptNumber}\n` +
      `Fecha: ${formatDateTime(sale.timestamp)}\n\n` +
      `*DETALLE DE COMPRA:*\n${itemsText}\n\n` +
      `*TOTAL: ${formatCurrency(sale.total)}*\n` +
      `Medio de Pago: ${sale.paymentMethod.toUpperCase()}\n` +
      (sale.paymentMethod === 'efectivo' ? `Vuelto: ${formatCurrency(sale.changeGiven)}\n` : '') +
      `\n${state.settings.ticketFooter}\n` +
      `_PUMPA CAJA_`;

    if (navigator.share) {
      navigator.share({
        title: `Ticket ${sale.receiptNumber} - ${state.settings.storeName}`,
        text: ticketText
      }).catch(() => {
        // fallback to WhatsApp
        this.openWhatsApp(ticketText);
      });
    } else {
      this.openWhatsApp(ticketText);
    }
  }

  private static openWhatsApp(text: string): void {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  static close(): void {
    if (this.modalEl && this.modalEl.parentNode) {
      this.modalEl.parentNode.removeChild(this.modalEl);
      this.modalEl = null;
    }
  }
}
