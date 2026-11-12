import { state } from '../state';
import { icons } from './icons';

export function renderHeader(): string {
  const isShiftOpen = state.activeShift && state.activeShift.status === 'abierta';
  const showInstall = !state.isInstalled && state.installPromptEvent;

  return `
    <header class="pumpa-header">
      <div class="header-brand">
        <div class="brand-logo-icon">
          ${icons.cash}
        </div>
        <div class="brand-text">
          <h1 class="brand-title">${state.settings.fantasyName}</h1>
          <span class="store-name">${state.settings.storeName}</span>
        </div>
      </div>

      <div class="header-actions">
        <!-- Cash Drawer Status -->
        <button id="btnHeaderShift" class="shift-pill ${isShiftOpen ? 'shift-open' : 'shift-closed'}" title="Estado de la Caja">
          <span class="status-dot"></span>
          <span class="status-label">${isShiftOpen ? 'Caja Abierta' : 'Caja Cerrada'}</span>
        </button>

        <!-- Offline Status Badge (only if offline) -->
        ${!state.isOnline ? `
          <div class="offline-badge" title="Funcionando 100% sin conexión con base de datos local">
            <span class="offline-dot"></span>
            <span>Offline</span>
          </div>
        ` : ''}

        <!-- PWA Install Button -->
        ${showInstall ? `
          <button id="btnHeaderInstall" class="btn-install-header" title="Instalar en celular">
            ${icons.install}
            <span class="install-text">Instalar</span>
          </button>
        ` : ''}
      </div>
    </header>
  `;
}

export function attachHeaderEvents(container: HTMLElement): void {
  const btnShift = container.querySelector('#btnHeaderShift');
  if (btnShift) {
    btnShift.addEventListener('click', () => {
      state.setTab('caja');
    });
  }

  const btnInstall = container.querySelector('#btnHeaderInstall');
  if (btnInstall) {
    btnInstall.addEventListener('click', async () => {
      if (state.installPromptEvent) {
        state.installPromptEvent.prompt();
        const { outcome } = await state.installPromptEvent.userChoice;
        if (outcome === 'accepted') {
          state.isInstalled = true;
          state.installPromptEvent = null;
          state.showToast('Instalación aceptada', 'success');
        }
      }
    });
  }
}
