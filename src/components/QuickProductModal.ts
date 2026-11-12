import { state } from '../state';
import { db } from '../db/indexedDB';
import { Product } from '../types';
import { icons } from './icons';
import { BarcodeScannerModal } from './BarcodeScannerModal';

export class QuickProductModal {
  private static modalEl: HTMLElement | null = null;

  // 1. Full Product Creation (from search or products tab)
  static openCreateProduct(initialQuery: string = '', onCreated?: (prod: Product) => void): void {
    this.close();

    const isNumeric = /^\d+$/.test(initialQuery.trim());
    const initialBarcode = isNumeric ? initialQuery.trim() : '';
    const initialName = !isNumeric ? initialQuery.trim() : '';

    const categories = [
      'Almacén',
      'Bebidas',
      'Kiosco',
      'Galletitas',
      'Lácteos',
      'Fiambrería',
      'Panadería',
      'Limpieza',
      'Varios'
    ];

    const modal = document.createElement('div');
    modal.className = 'quick-modal-overlay';
    modal.id = 'quickProductModal';

    modal.innerHTML = `
      <div class="quick-modal-card">
        <div class="quick-modal-header">
          <div class="quick-title-group">
            ${icons.plus}
            <h3>Nuevo Producto</h3>
          </div>
          <button id="btnQuickClose" class="btn-icon-close" aria-label="Cerrar modal">
            ${icons.close}
          </button>
        </div>

        <form id="formCreateProduct" class="quick-product-form">
          <div class="form-group">
            <label for="inputProdBarcode">Código de barras</label>
            <div class="input-with-action">
              <input 
                type="text" 
                id="inputProdBarcode" 
                class="form-input" 
                placeholder="Escaneá o ingresá el código" 
                value="${initialBarcode}"
              />
              <button type="button" id="btnScanInForm" class="btn-scan-inside" title="Escanear con cámara">
                ${icons.camera}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="inputProdName">Nombre del producto *</label>
            <input 
              type="text" 
              id="inputProdName" 
              class="form-input" 
              placeholder="Ej: Alfajor Jorgito Chocolate" 
              value="${initialName}" 
              required
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="inputProdPrice">Precio Venta (ARS) *</label>
              <input 
                type="number" 
                id="inputProdPrice" 
                class="form-input" 
                placeholder="0" 
                min="0" 
                step="50" 
                required
              />
            </div>

            <div class="form-group">
              <label for="inputProdCost">Costo Compra (ARS)</label>
              <input 
                type="number" 
                id="inputProdCost" 
                class="form-input" 
                placeholder="0" 
                min="0" 
                step="50"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="selectProdCategory">Categoría</label>
            <select id="selectProdCategory" class="form-select">
              ${categories.map((c) => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="inputProdStock">Stock inicial</label>
              <input 
                type="number" 
                id="inputProdStock" 
                class="form-input" 
                value="10" 
                min="0" 
                step="1"
              />
            </div>

            <div class="form-group">
              <label for="inputProdMinStock">Stock mínimo</label>
              <input 
                type="number" 
                id="inputProdMinStock" 
                class="form-input" 
                value="3" 
                min="0" 
                step="1"
              />
            </div>
          </div>

          <div class="quick-modal-actions">
            <button type="button" id="btnQuickCancel" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary-confirm">
              ${icons.check}
              <span>Guardar Producto</span>
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;

    const btnClose = modal.querySelector('#btnQuickClose');
    const btnCancel = modal.querySelector('#btnQuickCancel');
    const btnScan = modal.querySelector('#btnScanInForm');
    const inputBarcode = modal.querySelector('#inputProdBarcode') as HTMLInputElement;
    const form = modal.querySelector('#formCreateProduct') as HTMLFormElement;

    btnClose?.addEventListener('click', () => this.close());
    btnCancel?.addEventListener('click', () => this.close());

    btnScan?.addEventListener('click', () => {
      BarcodeScannerModal.open((barcode) => {
        if (inputBarcode) {
          inputBarcode.value = barcode;
        }
      });
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = (modal.querySelector('#inputProdName') as HTMLInputElement).value.trim();
      const barcode = inputBarcode.value.trim() || String(Date.now()).slice(-8);
      const price = parseFloat((modal.querySelector('#inputProdPrice') as HTMLInputElement).value) || 0;
      const cost = parseFloat((modal.querySelector('#inputProdCost') as HTMLInputElement).value) || 0;
      const category = (modal.querySelector('#selectProdCategory') as HTMLSelectElement).value;
      const stock = parseInt((modal.querySelector('#inputProdStock') as HTMLInputElement).value) || 0;
      const minStock = parseInt((modal.querySelector('#inputProdMinStock') as HTMLInputElement).value) || 3;

      if (!name || price <= 0) {
        alert('Por favor completá el nombre y un precio válido.');
        return;
      }

      const newProduct: Product = {
        id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        barcode,
        name,
        price,
        cost,
        category,
        stock,
        minStock,
        updatedAt: new Date().toISOString()
      };

      await db.saveProduct(newProduct);
      await state.refreshProducts();

      state.showToast(`Producto "${name}" guardado correctamente`, 'success');
      this.close();

      if (onCreated) {
        onCreated(newProduct);
      }
    });
  }

  // 2. Quick Item for unlisted/bulk sales (pan suelto, carga, etc.)
  static openQuickSaleItem(): void {
    this.close();

    const modal = document.createElement('div');
    modal.className = 'quick-modal-overlay';
    modal.id = 'quickProductModal';

    modal.innerHTML = `
      <div class="quick-modal-card">
        <div class="quick-modal-header">
          <div class="quick-title-group">
            ${icons.box}
            <h3>Producto Rápido / Varios</h3>
          </div>
          <button id="btnQuickClose" class="btn-icon-close" aria-label="Cerrar modal">
            ${icons.close}
          </button>
        </div>

        <form id="formQuickItem" class="quick-product-form">
          <div class="form-group">
            <label for="inputQuickConcept">Concepto o Descripción</label>
            <input 
              type="text" 
              id="inputQuickConcept" 
              class="form-input" 
              placeholder="Ej: Pan suelto, Varios, Carga" 
              value="Varios" 
              required
            />
          </div>

          <div class="form-group">
            <label for="inputQuickPrice">Precio Total (ARS) *</label>
            <input 
              type="number" 
              id="inputQuickPrice" 
              class="form-input" 
              placeholder="0" 
              min="10" 
              step="50" 
              autofocus 
              required
            />
          </div>

          <!-- Quick price buttons -->
          <div class="quick-bills-row">
            <button type="button" class="btn-quick-bill" data-amount="500">$500</button>
            <button type="button" class="btn-quick-bill" data-amount="1000">$1.000</button>
            <button type="button" class="btn-quick-bill" data-amount="1500">$1.500</button>
            <button type="button" class="btn-quick-bill" data-amount="2000">$2.000</button>
            <button type="button" class="btn-quick-bill" data-amount="5000">$5.000</button>
          </div>

          <div class="quick-modal-actions">
            <button type="button" id="btnQuickCancel" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary-confirm">
              ${icons.plus}
              <span>Agregar al Carrito</span>
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;

    const btnClose = modal.querySelector('#btnQuickClose');
    const btnCancel = modal.querySelector('#btnQuickCancel');
    const form = modal.querySelector('#formQuickItem') as HTMLFormElement;
    const inputPrice = modal.querySelector('#inputQuickPrice') as HTMLInputElement;
    const quickBills = modal.querySelectorAll('.btn-quick-bill');

    btnClose?.addEventListener('click', () => this.close());
    btnCancel?.addEventListener('click', () => this.close());

    quickBills.forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-amount') || '0';
        if (inputPrice) inputPrice.value = val;
      });
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const concept = (modal.querySelector('#inputQuickConcept') as HTMLInputElement).value.trim() || 'Varios';
      const price = parseFloat(inputPrice.value) || 0;

      if (price <= 0) {
        alert('Ingresá un precio válido mayor a 0');
        return;
      }

      const tempProduct: Product = {
        id: `custom-${Date.now()}`,
        barcode: '',
        name: concept,
        price,
        cost: Math.round(price * 0.7), // estimated standard cost
        category: 'Varios',
        stock: 999,
        minStock: 0,
        updatedAt: new Date().toISOString()
      };

      state.addToCart(tempProduct, 1);
      state.showToast(`Agregado: ${concept} (${price})`, 'success');
      this.close();
    });
  }

  static close(): void {
    if (this.modalEl && this.modalEl.parentNode) {
      this.modalEl.parentNode.removeChild(this.modalEl);
      this.modalEl = null;
    }
  }
}
