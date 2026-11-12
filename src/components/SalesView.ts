import { state } from '../state';
import { Product } from '../types';
import { formatCurrency } from '../services/formatters';
import { icons } from './icons';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { PaymentModal } from './PaymentModal';
import { QuickProductModal } from './QuickProductModal';

export class SalesView {
  private static searchQuery: string = '';
  private static selectedCategory: string = 'todos';

  static render(): string {
    const total = state.getCartTotal();
    const itemCount = state.getCartItemCount();
    const categories = ['todos', 'Almacén', 'Bebidas', 'Kiosco', 'Galletitas', 'Lácteos', 'Fiambrería', 'Panadería', 'Limpieza'];

    // Filter products
    const filteredProducts = state.products.filter((prod) => {
      const matchCat = this.selectedCategory === 'todos' || prod.category.toLowerCase() === this.selectedCategory.toLowerCase();
      if (!matchCat) return false;

      if (!this.searchQuery.trim()) return true;

      const q = this.searchQuery.toLowerCase().trim();
      const matchName = prod.name.toLowerCase().includes(q);
      const matchBarcode = prod.barcode.toLowerCase().includes(q);
      return matchName || matchBarcode;
    });

    const isSearching = Boolean(this.searchQuery.trim());
    const hasNoResults = isSearching && filteredProducts.length === 0;

    return `
      <div class="sales-view-container">
        <!-- Left / Top: Catalog & Fast Entry -->
        <div class="sales-catalog-panel">
          <!-- Top Barcode & Search Input -->
          <div class="sales-search-bar">
            <div class="search-input-wrapper">
              <span class="search-icon">${icons.search}</span>
              <input 
                type="text" 
                id="inputSalesSearch" 
                class="input-sales-search" 
                placeholder="Buscar por nombre o código..." 
                value="${this.searchQuery}" 
                autocomplete="off"
              />
              ${this.searchQuery ? `
                <button type="button" id="btnClearSearch" class="btn-clear-search" aria-label="Limpiar búsqueda">
                  ${icons.close}
                </button>
              ` : ''}
            </div>

            <button type="button" id="btnOpenScanner" class="btn-camera-scan" title="Escanear código de barras con la cámara">
              ${icons.barcode}
              <span>Escanear</span>
            </button>
          </div>

          <!-- Quick Category Filters -->
          <div class="category-chips-scroll">
            ${categories.map((cat) => {
              const active = this.selectedCategory.toLowerCase() === cat.toLowerCase();
              return `
                <button type="button" class="chip-btn ${active ? 'active' : ''}" data-category="${cat}">
                  ${cat === 'todos' ? 'Todos' : cat}
                </button>
              `;
            }).join('')}
          </div>

          <!-- Quick Add / Unlisted Item Button -->
          <div class="quick-helpers-bar">
            <button type="button" id="btnQuickSaleItem" class="btn-quick-helper">
              ${icons.plus}
              <span>Venta Rápida / Sin Código</span>
            </button>
            <button type="button" id="btnAddNewProductDirect" class="btn-quick-helper secondary">
              ${icons.box}
              <span>+ Nuevo Producto</span>
            </button>
          </div>

          <!-- Empty search result card: Allows creating product on the fly -->
          ${hasNoResults ? `
            <div class="no-results-banner">
              <div class="no-results-text">
                <strong>No se encontró ningún producto</strong>
                <p>¿Querés registrar "${this.searchQuery}" en el catálogo ahora?</p>
              </div>
              <button type="button" id="btnRegisterMissingProduct" class="btn-register-missing">
                ${icons.plus}
                <span>Crear y Agregar</span>
              </button>
            </div>
          ` : ''}

          <!-- Products Grid -->
          <div class="products-quick-grid">
            ${filteredProducts.map((prod) => {
              const isLowStock = prod.stock <= prod.minStock;
              return `
                <div class="product-tile" data-product-id="${prod.id}">
                  <div class="tile-header">
                    <span class="tile-category">${prod.category}</span>
                    <span class="tile-stock ${isLowStock ? 'stock-low' : ''}">
                      ${prod.stock} disp.
                    </span>
                  </div>
                  <h4 class="tile-title">${prod.name}</h4>
                  <div class="tile-footer">
                    <span class="tile-price">${formatCurrency(prod.price)}</span>
                    <span class="tile-add-btn">${icons.plus}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Right / Bottom: Current Cart Panel -->
        <div class="sales-cart-panel">
          <div class="cart-header">
            <div class="cart-title-group">
              ${icons.cart}
              <h3>Venta Actual</h3>
              <span class="cart-count-badge">${itemCount} ${itemCount === 1 ? 'artículo' : 'artículos'}</span>
            </div>
            ${state.cart.length > 0 ? `
              <button type="button" id="btnClearCart" class="btn-clear-cart" title="Vaciar carrito">
                ${icons.trash}
                <span>Vaciar</span>
              </button>
            ` : ''}
          </div>

          <!-- Cart items list -->
          <div class="cart-items-scroll">
            ${state.cart.length === 0 ? `
              <div class="cart-empty-placeholder">
                <div class="empty-icon-circle">
                  ${icons.cart}
                </div>
                <h4>El carrito está vacío</h4>
                <p>Escaneá con la cámara o tocá un producto para agregarlo a la venta.</p>
              </div>
            ` : `
              <div class="cart-items-list">
                ${state.cart.map((item) => `
                  <div class="cart-item-row" data-product-id="${item.product.id}">
                    <div class="item-info">
                      <span class="item-name">${item.product.name}</span>
                      <span class="item-unit-price">${formatCurrency(item.product.price)} c/u</span>
                    </div>

                    <div class="item-stepper">
                      <button type="button" class="btn-step btn-minus" data-id="${item.product.id}">
                        ${icons.minus}
                      </button>
                      <input 
                        type="number" 
                        class="input-qty" 
                        data-id="${item.product.id}" 
                        value="${item.quantity}" 
                        min="1"
                      />
                      <button type="button" class="btn-step btn-plus" data-id="${item.product.id}">
                        ${icons.plus}
                      </button>
                    </div>

                    <div class="item-subtotal">
                      <span>${formatCurrency(item.subtotal)}</span>
                    </div>

                    <button type="button" class="btn-item-delete" data-id="${item.product.id}" title="Eliminar artículo">
                      ${icons.trash}
                    </button>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Cart Summary & Charge Action -->
          <div class="cart-summary-footer">
            <div class="summary-details">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>${formatCurrency(total)}</span>
              </div>
              <div class="summary-total-row">
                <span class="label-total">TOTAL</span>
                <span class="amount-total">${formatCurrency(total)}</span>
              </div>
            </div>

            <div class="cart-actions-row">
              <button 
                type="button" 
                id="btnCancelSale" 
                class="btn-cancel-sale" 
                ${state.cart.length === 0 ? 'disabled' : ''}
              >
                Cancelar
              </button>
              
              <button 
                type="button" 
                id="btnCheckoutSale" 
                class="btn-checkout-sale" 
                ${state.cart.length === 0 ? 'disabled' : ''}
              >
                <div class="btn-checkout-content">
                  <span class="checkout-text">COBRAR</span>
                  <span class="checkout-amount">${formatCurrency(total)}</span>
                </div>
                ${icons.arrowRight}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static attachEvents(container: HTMLElement): void {
    const inputSearch = container.querySelector('#inputSalesSearch') as HTMLInputElement;
    const btnClearSearch = container.querySelector('#btnClearSearch');
    const btnScanner = container.querySelector('#btnOpenScanner');
    const chipBtns = container.querySelectorAll('.chip-btn');
    const productTiles = container.querySelectorAll('.product-tile');
    const btnQuickItem = container.querySelector('#btnQuickSaleItem');
    const btnAddNewProduct = container.querySelector('#btnAddNewProductDirect');
    const btnRegisterMissing = container.querySelector('#btnRegisterMissingProduct');
    const btnClearCart = container.querySelector('#btnClearCart');
    const btnCancelSale = container.querySelector('#btnCancelSale');
    const btnCheckout = container.querySelector('#btnCheckoutSale');

    // Steppers and item controls
    const minusBtns = container.querySelectorAll('.btn-minus');
    const plusBtns = container.querySelectorAll('.btn-plus');
    const deleteBtns = container.querySelectorAll('.btn-item-delete');
    const qtyInputs = container.querySelectorAll('.input-qty');

    // Search events
    inputSearch?.addEventListener('input', () => {
      this.searchQuery = inputSearch.value;
      state.notify();
    });

    inputSearch?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = inputSearch.value.trim();
        if (!query) return;

        // Try exact barcode match first
        const match = state.products.find(
          (p) => p.barcode === query || p.name.toLowerCase() === query.toLowerCase()
        );

        if (match) {
          state.addToCart(match, 1);
          this.searchQuery = '';
          inputSearch.value = '';
          state.notify();
        } else if (state.products.length > 0) {
          // Check if partial search matches exactly 1 item
          const partials = state.products.filter((p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) || p.barcode.includes(query)
          );
          if (partials.length === 1) {
            state.addToCart(partials[0], 1);
            this.searchQuery = '';
            inputSearch.value = '';
            state.notify();
          }
        }
      }
    });

    btnClearSearch?.addEventListener('click', () => {
      this.searchQuery = '';
      state.notify();
    });

    // Scanner
    btnScanner?.addEventListener('click', () => {
      BarcodeScannerModal.open((barcode) => {
        const match = state.products.find((p) => p.barcode === barcode);
        if (match) {
          state.addToCart(match, 1);
          state.showToast(`Agregado: ${match.name}`, 'success');
        } else {
          // If product not found by scanned barcode, offer to register it immediately!
          QuickProductModal.openCreateProduct(barcode, (createdProd) => {
            state.addToCart(createdProd, 1);
          });
        }
      });
    });

    // Category chips
    chipBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectedCategory = btn.getAttribute('data-category') || 'todos';
        state.notify();
      });
    });

    // Touch product tile to add to cart
    productTiles.forEach((tile) => {
      tile.addEventListener('click', () => {
        const prodId = tile.getAttribute('data-product-id');
        const prod = state.products.find((p) => p.id === prodId);
        if (prod) {
          state.addToCart(prod, 1);
        }
      });
    });

    // Quick Item (Venta Rápida / Sin Código)
    btnQuickItem?.addEventListener('click', () => {
      QuickProductModal.openQuickSaleItem();
    });

    // Direct new product
    btnAddNewProduct?.addEventListener('click', () => {
      QuickProductModal.openCreateProduct('', (newProd) => {
        state.addToCart(newProd, 1);
      });
    });

    // Register missing product
    btnRegisterMissing?.addEventListener('click', () => {
      QuickProductModal.openCreateProduct(this.searchQuery, (newProd) => {
        state.addToCart(newProd, 1);
        this.searchQuery = '';
      });
    });

    // Cart Steppers
    minusBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const item = state.cart.find((i) => i.product.id === id);
        if (item) {
          state.updateCartItemQuantity(item.product.id, item.quantity - 1);
        }
      });
    });

    plusBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const item = state.cart.find((i) => i.product.id === id);
        if (item) {
          state.updateCartItemQuantity(item.product.id, item.quantity + 1);
        }
      });
    });

    deleteBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) {
          state.removeFromCart(id);
        }
      });
    });

    qtyInputs.forEach((input) => {
      input.addEventListener('change', () => {
        const id = input.getAttribute('data-id');
        const val = parseInt((input as HTMLInputElement).value) || 0;
        if (id) {
          state.updateCartItemQuantity(id, val);
        }
      });
    });

    // Clear cart
    btnClearCart?.addEventListener('click', () => {
      if (confirm('¿Vaciar los productos del carrito?')) {
        state.clearCart();
      }
    });

    // Cancel sale
    btnCancelSale?.addEventListener('click', () => {
      if (confirm('¿Deseás cancelar esta venta y limpiar el carrito?')) {
        state.clearCart();
        state.showToast('Venta cancelada', 'info');
      }
    });

    // Checkout
    btnCheckout?.addEventListener('click', () => {
      PaymentModal.open();
    });
  }
}
