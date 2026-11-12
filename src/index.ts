import { state } from './state';
import { renderHeader, attachHeaderEvents } from './components/Header';
import { renderBottomNav, attachBottomNavEvents } from './components/BottomNav';
import { SalesView } from './components/SalesView';
import { ProductsView } from './components/ProductsView';
import { CashView } from './components/CashView';
import { HistoryView } from './components/HistoryView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';

// Register Service Worker for offline PWA operation
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('PUMPA CAJA ServiceWorker registrado con éxito:', reg.scope);
      })
      .catch((err) => {
        console.warn('Error al registrar ServiceWorker:', err);
      });
  });
}

const root = document.getElementById('root') as HTMLElement;

async function renderApp(): Promise<void> {
  if (!root) return;

  // Pre-load data depending on current tab
  if (state.currentTab === 'caja') {
    await CashView.loadData();
  } else if (state.currentTab === 'historial') {
    await HistoryView.loadSales();
  } else if (state.currentTab === 'informes') {
    await ReportsView.loadData();
  }

  let mainContentHtml = '';

  switch (state.currentTab) {
    case 'ventas':
      mainContentHtml = SalesView.render();
      break;
    case 'productos':
      mainContentHtml = ProductsView.render();
      break;
    case 'caja':
      mainContentHtml = CashView.render();
      break;
    case 'historial':
      mainContentHtml = HistoryView.render();
      break;
    case 'informes':
      mainContentHtml = ReportsView.render();
      break;
    case 'configuracion':
      mainContentHtml = SettingsView.render();
      break;
    default:
      mainContentHtml = SalesView.render();
  }

  const toastHtml = state.toastMessage
    ? `<div class="pumpa-toast toast-${state.toastMessage.type}">${state.toastMessage.text}</div>`
    : '';

  root.innerHTML = `
    ${toastHtml}
    ${renderHeader()}
    <main class="main-content">
      ${mainContentHtml}
    </main>
    ${renderBottomNav()}
  `;

  // Attach interactive listeners
  attachHeaderEvents(root);
  attachBottomNavEvents(root);

  switch (state.currentTab) {
    case 'ventas':
      SalesView.attachEvents(root);
      break;
    case 'productos':
      ProductsView.attachEvents(root);
      break;
    case 'caja':
      CashView.attachEvents(root);
      break;
    case 'historial':
      HistoryView.attachEvents(root);
      break;
    case 'informes':
      ReportsView.attachEvents(root);
      break;
    case 'configuracion':
      SettingsView.attachEvents(root);
      break;
  }
}

// Subscribe renderer to state changes
state.subscribe(() => {
  renderApp();
});

// Initial boot
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await state.init();
    await renderApp();
  } catch (err) {
    console.error('Error al inicializar PUMPA CAJA:', err);
  }
});
