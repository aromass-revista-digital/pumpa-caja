import { state } from '../state';
import { icons } from './icons';
import { ViewTab } from '../types';

export function renderBottomNav(): string {
  const cartCount = state.getCartItemCount();

  const tabs: Array<{ id: ViewTab; label: string; icon: string; badge?: number; isHero?: boolean }> = [
    { id: 'ventas', label: 'Venta', icon: icons.cart, badge: cartCount, isHero: true },
    { id: 'productos', label: 'Productos', icon: icons.box },
    { id: 'historial', label: 'Historial', icon: icons.history },
    { id: 'caja', label: 'Caja', icon: icons.cash },
    { id: 'informes', label: 'Informes', icon: icons.reports },
    { id: 'configuracion', label: 'Ajustes', icon: icons.settings }
  ];

  return `
    <nav class="pumpa-bottom-nav">
      ${tabs.map((tab) => {
        const isActive = state.currentTab === tab.id;
        return `
          <button class="nav-item ${isActive ? 'active' : ''} ${tab.isHero ? 'nav-hero' : ''}" data-tab="${tab.id}">
            <div class="nav-icon-wrapper">
              ${tab.icon}
              ${tab.badge && tab.badge > 0 ? `<span class="cart-badge">${tab.badge}</span>` : ''}
            </div>
            <span class="nav-label">${tab.label}</span>
          </button>
        `;
      }).join('')}
    </nav>
  `;
}

export function attachBottomNavEvents(container: HTMLElement): void {
  const buttons = container.querySelectorAll('.pumpa-bottom-nav .nav-item');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab') as ViewTab;
      if (targetTab) {
        state.setTab(targetTab);
      }
    });
  });
}
