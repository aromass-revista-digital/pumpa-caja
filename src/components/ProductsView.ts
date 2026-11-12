import { state } from '../state';
import { db } from '../db/indexedDB';
import { Product } from '../types';
import { formatCurrency, formatDateTime } from '../services/formatters';
import { icons } from './icons';
import { QuickProductModal } from './QuickProductModal';
import { ExportService } from '../services/exportService';

export class ProductsView {
  private static searchQuery: string = '';
  private static selectedCategory: string = 'todas';
  private static filterLowStockOnly: boolean = false;
  private static editingProduct: Product | null = null;

  static render(): string {
    const categories = ['todas', 'Almacén', 'Bebidas', 'Kiosco', 'Galletitas', 'Lácteos', 'Fiambrería', 'Panadería', 'Limpieza', 'Varios'];

    // Filter products
    const filtered = state.products.filter((p) => {
      if (this.selectedCategory !== 'todas' && p.category.toLowerCase() !== this.selectedCategory.toLowerCase()) {
        return false;
      }
      if (this.filterLowStockOnly && p.stock > p.minStock) {
        return false;
      }
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchBarcode = p.barcode.toLowerCase().includes(q);
        return matchName || matchBarcode;
      }
      return true;
    });

    const lowStockCount = state.products.filter((p) => p.stock <= p.minStock).length;

    return `
      <div class="products-view-container">
        <!-- Top Toolbar -->
        <div class="products-toolbar">
          <div class="toolbar-title-group">
            <h2>Catálogo de Productos</h2>
            <span class="products-count-badge">${state.products.length} productos registrados</span>
          </div>

          <div class="toolbar-actions">
            <button type="button" id="btnExportProductsCSV" class="btn-toolbar-action" title="Exportar catálogo a Excel">
              ${icons.download}
              <span>Exportar Excel</span>
            </button>
            <button type="button" id="btnMassPriceUpdate" class="btn-toolbar-action" title="Aumento masivo de precios por porcentaje">
              ${icons.edit}
              <span>Aumento Masivo %</span>
            </button>
            <button type="button" id="btnCreateProduct" class="btn-primary-create">
              ${icons.plus}
              <span>Nuevo Producto</span>
            </button>
          </div>
        </div>

        <!-- Filters row -->
        <div class="products-filters-row">
          <div class="search-input-wrapper">
            <span class="search-icon">${icons.search}</span>
            <input 
              type="text" 
              id="inputCatalogSearch" 
              class="input-catalog-search" 
              placeholder="Buscar por nombre o código de barras..." 
              value="${this.searchQuery}"
            />
            ${this.searchQuery ? `
              <button type="button" id="btnClearCatalogSearch" class="btn-clear-search">
                ${icons.close}
              </button>
            ` : ''}
          </div>

          <div class="filter-controls-group">
            <select id="selectCategoryFilter" class="form-select filter-select">
              ${categories.map((c) => `
                <option value="${c}" ${this.selectedCategory.toLowerCase() === c.toLowerCase() ? 'selected' : ''}>
                  ${c === 'todas' ? 'Todas las categorías' : c}
                </option>
              `).join('')}
            </select>

            <button type="button" id="btnToggleLowStock" class="btn-filter-stock ${this.filterLowStockOnly ? 'active' : ''}">
              ${icons.alert}
              <span>Bajo Stock (${lowStockCount})</span>
            </button>
          </div>
        </div>

        <!-- Products Table / Cards List -->
        <div class="products-list-card">
          ${filtered.length === 0 ? `
            <div class="empty-products-state">
              <div class="empty-icon-circle">${icons.box}</div>
              <h4>No se encontraron productos</h4>
              <p>Podés cambiar los filtros de búsqueda o dar de alta un nuevo producto.</p>
              <button type="button" id="btnEmptyStateCreate" class="btn-primary-confirm">
                ${icons.plus}
                <span>Crear Producto</span>
              </button>
            </div>
          ` : `
            <div class="products-table-wrapper">
              <table class="products-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Código</th>
                    <th>Categoría</th>
                    <th>Precio Venta</th>
                    <th>Costo</th>
                    <th>Margen</th>
                    <th>Stock</th>
                    <th>Actualizado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.map((prod) => {
                    const isLow = prod.stock <= prod.minStock;
                    const margin = prod.cost > 0 ? (((prod.price - prod.cost) / prod.cost) * 100).toFixed(0) : '—';
                    return `
                      <tr class="${isLow ? 'row-low-stock' : ''}">
                        <td class="col-name">
                          <strong>${prod.name}</strong>
                          ${isLow ? `<span class="badge-stock-alert">¡Stock Bajo!</span>` : ''}
                        </td>
                        <td class="col-barcode">${prod.barcode || '—'}</td>
                        <td class="col-category"><span class="category-tag">${prod.category}</span></td>
                        <td class="col-price"><strong>${formatCurrency(prod.price)}</strong></td>
                        <td class="col-cost">${prod.cost ? formatCurrency(prod.cost) : '—'}</td>
                        <td class="col-margin">${margin !== '—' ? `${margin}%` : '—'}</td>
                        <td class="col-stock">
                          <span class="stock-pill ${isLow ? 'pill-low' : 'pill-ok'}">
                            ${prod.stock} un.
                          </span>
                        </td>
                        <td class="col-date">${formatDateTime(prod.updatedAt)}</td>
                        <td class="col-actions">
                          <button type="button" class="btn-action-icon btn-edit-prod" data-id="${prod.id}" title="Modificar">
                            ${icons.edit}
                          </button>
                          <button type="button" class="btn-action-icon danger btn-delete-prod" data-id="${prod.id}" title="Eliminar">
                            ${icons.trash}
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
    const inputSearch = container.querySelector('#inputCatalogSearch') as HTMLInputElement;
    const btnClearSearch = container.querySelector('#btnClearCatalogSearch');
    const selectCat = container.querySelector('#selectCategoryFilter') as HTMLSelectElement;
    const btnLowStock = container.querySelector('#btnToggleLowStock');
    const btnCreate = container.querySelector('#btnCreateProduct');
    const btnEmptyCreate = container.querySelector('#btnEmptyStateCreate');
    const btnExport = container.querySelector('#btnExportProductsCSV');
    const btnMass = container.querySelector('#btnMassPriceUpdate');

    const editBtns = container.querySelectorAll('.btn-edit-prod');
    const deleteBtns = container.querySelectorAll('.btn-delete-prod');

    inputSearch?.addEventListener('input', () => {
      this.searchQuery = inputSearch.value;
      state.notify();
    });

    btnClearSearch?.addEventListener('click', () => {
      this.searchQuery = '';
      state.notify();
    });

    selectCat?.addEventListener('change', () => {
      this.selectedCategory = selectCat.value;
      state.notify();
    });

    btnLowStock?.addEventListener('click', () => {
      this.filterLowStockOnly = !this.filterLowStockOnly;
      state.notify();
    });

    btnCreate?.addEventListener('click', () => {
      QuickProductModal.openCreateProduct();
    });

    btnEmptyCreate?.addEventListener('click', () => {
      QuickProductModal.openCreateProduct();
    });

    btnExport?.addEventListener('click', () => {
      ExportService.exportProductsToCSV(state.products);
      state.showToast('Catálogo descargado en formato CSV', 'success');
    });

    // Mass price update modal
    btnMass?.addEventListener('click', () => {
      this.openMassPriceModal();
    });

    // Edit Product
    editBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prod = state.products.find((p) => p.id === id);
        if (prod) {
          this.openEditModal(prod);
        }
      });
    });

    // Delete Product (with strict confirmation)
    deleteBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const prod = state.products.find((p) => p.id === id);
        if (prod) {
          if (confirm(`¿Estás seguro de eliminar el producto "${prod.name}" del catálogo? Esta acción no se puede deshacer.`)) {
            await db.deleteProduct(prod.id);
            await state.refreshProducts();
            state.showToast(`Producto "${prod.name}" eliminado`, 'info');
          }
        }
      });
    });
  }

  private static openEditModal(prod: Product): void {
    const categories = ['Almacén', 'Bebidas', 'Kiosco', 'Galletitas', 'Lácteos', 'Fiambrería', 'Panadería', 'Limpieza', 'Varios'];

    const modal = document.createElement('div');
    modal.className = 'quick-modal-overlay';
    modal.innerHTML = `
      <div class="quick-modal-card">
        <div class="quick-modal-header">
          <div class="quick-title-group">
            ${icons.edit}
            <h3>Modificar Producto</h3>
          </div>
          <button id="btnEditClose" class="btn-icon-close" aria-label="Cerrar modal">
            ${icons.close}
          </button>
        </div>

        <form id="formEditProduct" class="quick-product-form">
          <div class="form-group">
            <label for="editProdBarcode">Código de barras</label>
            <input type="text" id="editProdBarcode" class="form-input" value="${prod.barcode || ''}" />
          </div>

          <div class="form-group">
            <label for="editProdName">Nombre del producto *</label>
            <input type="text" id="editProdName" class="form-input" value="${prod.name}" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="editProdPrice">Precio Venta (ARS) *</label>
              <input type="number" id="editProdPrice" class="form-input" value="${prod.price}" min="0" step="50" required />
            </div>

            <div class="form-group">
              <label for="editProdCost">Costo Compra (ARS)</label>
              <input type="number" id="editProdCost" class="form-input" value="${prod.cost || 0}" min="0" step="50" />
            </div>
          </div>

          <div class="form-group">
            <label for="editProdCategory">Categoría</label>
            <select id="editProdCategory" class="form-select">
              ${categories.map((c) => `<option value="${c}" ${c === prod.category ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="editProdStock">Stock disponible</label>
              <input type="number" id="editProdStock" class="form-input" value="${prod.stock}" min="0" step="1" />
            </div>

            <div class="form-group">
              <label for="editProdMinStock">Stock mínimo</label>
              <input type="number" id="editProdMinStock" class="form-input" value="${prod.minStock}" min="0" step="1" />
            </div>
          </div>

          <div class="quick-modal-actions">
            <button type="button" id="btnEditCancel" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary-confirm">
              ${icons.check}
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const btnClose = modal.querySelector('#btnEditClose');
    const btnCancel = modal.querySelector('#btnEditCancel');
    const form = modal.querySelector('#formEditProduct') as HTMLFormElement;

    const cleanup = () => {
      if (modal.parentNode) modal.parentNode.removeChild(modal);
    };

    btnClose?.addEventListener('click', cleanup);
    btnCancel?.addEventListener('click', cleanup);

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      prod.name = (modal.querySelector('#editProdName') as HTMLInputElement).value.trim();
      prod.barcode = (modal.querySelector('#editProdBarcode') as HTMLInputElement).value.trim();
      prod.price = parseFloat((modal.querySelector('#editProdPrice') as HTMLInputElement).value) || 0;
      prod.cost = parseFloat((modal.querySelector('#editProdCost') as HTMLInputElement).value) || 0;
      prod.category = (modal.querySelector('#editProdCategory') as HTMLSelectElement).value;
      prod.stock = parseInt((modal.querySelector('#editProdStock') as HTMLInputElement).value) || 0;
      prod.minStock = parseInt((modal.querySelector('#editProdMinStock') as HTMLInputElement).value) || 3;
      prod.updatedAt = new Date().toISOString();

      await db.saveProduct(prod);
      await state.refreshProducts();

      state.showToast(`Producto "${prod.name}" actualizado`, 'success');
      cleanup();
    });
  }

  private static openMassPriceModal(): void {
    const categories = ['todas', 'Almacén', 'Bebidas', 'Kiosco', 'Galletitas', 'Lácteos', 'Fiambrería', 'Panadería', 'Limpieza', 'Varios'];

    const modal = document.createElement('div');
    modal.className = 'quick-modal-overlay';
    modal.innerHTML = `
      <div class="quick-modal-card">
        <div class="quick-modal-header">
          <div class="quick-title-group">
            ${icons.edit}
            <h3>Aumento Masivo de Precios</h3>
          </div>
          <button id="btnMassClose" class="btn-icon-close" aria-label="Cerrar modal">
            ${icons.close}
          </button>
        </div>

        <form id="formMassPrice" class="quick-product-form">
          <p class="modal-description-text">
            Aumentá o actualizá los precios por porcentaje de forma instantánea ante cambios en las listas de proveedores.
          </p>

          <div class="form-group">
            <label for="selectMassCategory">Aplicar a la categoría</label>
            <select id="selectMassCategory" class="form-select">
              ${categories.map((c) => `<option value="${c}">${c === 'todas' ? 'Todas las categorías' : c}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label for="inputMassPercentage">Porcentaje de aumento (%)</label>
            <div class="input-currency-wrapper">
              <span class="currency-prefix">%</span>
              <input type="number" id="inputMassPercentage" class="form-input" value="10" min="1" max="500" step="1" required />
            </div>
          </div>

          <!-- Quick percentage chips -->
          <div class="quick-bills-row">
            <button type="button" class="btn-quick-bill btn-quick-pct" data-pct="5">+5%</button>
            <button type="button" class="btn-quick-bill btn-quick-pct" data-pct="10">+10%</button>
            <button type="button" class="btn-quick-bill btn-quick-pct" data-pct="15">+15%</button>
            <button type="button" class="btn-quick-bill btn-quick-pct" data-pct="20">+20%</button>
          </div>

          <div class="quick-modal-actions">
            <button type="button" id="btnMassCancel" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary-confirm">
              ${icons.check}
              <span>Aplicar Aumento</span>
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const cleanup = () => {
      if (modal.parentNode) modal.parentNode.removeChild(modal);
    };

    modal.querySelector('#btnMassClose')?.addEventListener('click', cleanup);
    modal.querySelector('#btnMassCancel')?.addEventListener('click', cleanup);

    const inputPct = modal.querySelector('#inputMassPercentage') as HTMLInputElement;
    modal.querySelectorAll('.btn-quick-pct').forEach((b) => {
      b.addEventListener('click', () => {
        if (inputPct) inputPct.value = b.getAttribute('data-pct') || '10';
      });
    });

    modal.querySelector('#formMassPrice')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cat = (modal.querySelector('#selectMassCategory') as HTMLSelectElement).value;
      const pct = parseFloat(inputPct.value) || 0;

      if (pct <= 0) {
        alert('Ingresá un porcentaje mayor a 0');
        return;
      }

      const count = await db.updateMultiplePrices(cat, pct);
      await state.refreshProducts();

      state.showToast(`Se actualizaron ${count} productos con +${pct}%`, 'success');
      cleanup();
    });
  }
}
