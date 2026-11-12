import { state } from '../state';
import { db } from '../db/indexedDB';
import { StoreSettings } from '../types';
import { icons } from './icons';

export class SettingsView {
  static render(): string {
    const s = state.settings;
    const isInstalled = state.isInstalled;
    const canPrompt = Boolean(state.installPromptEvent);

    return `
      <div class="settings-view-container">
        <div class="settings-header">
          <h2>Configuración del Sistema</h2>
          <p>Personalizá los datos de tu comercio y administrá copias de seguridad</p>
        </div>

        <div class="settings-grid">
          <!-- 1. Store Business Information -->
          <div class="settings-card">
            <div class="card-header-group">
              ${icons.box}
              <h3>Datos del Comercio</h3>
            </div>
            <p class="card-subtext">Estos datos se imprimen en los tickets y se muestran en el encabezado.</p>

            <form id="formStoreSettings" class="settings-form">
              <div class="form-group">
                <label for="inputStoreName">Nombre del Comercio *</label>
                <input type="text" id="inputStoreName" class="form-input" value="${s.storeName}" required />
              </div>

              <div class="form-group">
                <label for="inputFantasyName">Nombre del Sistema / Marca</label>
                <input type="text" id="inputFantasyName" class="form-input" value="${s.fantasyName}" />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="inputStoreCuit">CUIT / Identificación</label>
                  <input type="text" id="inputStoreCuit" class="form-input" value="${s.cuit || ''}" placeholder="20-12345678-9" />
                </div>

                <div class="form-group">
                  <label for="inputStorePhone">Teléfono / WhatsApp</label>
                  <input type="text" id="inputStorePhone" class="form-input" value="${s.phone || ''}" placeholder="11 1234-5678" />
                </div>
              </div>

              <div class="form-group">
                <label for="inputStoreAddress">Dirección del Local</label>
                <input type="text" id="inputStoreAddress" class="form-input" value="${s.address || ''}" placeholder="Calle y número, Localidad" />
              </div>

              <div class="form-group">
                <label for="inputTicketFooter">Mensaje al pie del comprobante</label>
                <input type="text" id="inputTicketFooter" class="form-input" value="${s.ticketFooter || ''}" placeholder="¡Gracias por su compra!" />
              </div>

              <button type="submit" class="btn-primary-confirm">
                ${icons.check}
                <span>Guardar Datos del Comercio</span>
              </button>
            </form>
          </div>

          <!-- 2. System Audio & Scanner Preferences -->
          <div class="settings-card">
            <div class="card-header-group">
              ${icons.settings}
              <h3>Preferencias y Sonidos</h3>
            </div>
            <p class="card-subtext">Configurá la respuesta sonora y el comportamiento de la caja.</p>

            <div class="preferences-toggles-list">
              <label class="toggle-row">
                <div class="toggle-text">
                  <strong>Sonidos de éxito y advertencia</strong>
                  <span>Reproduce melodías al cobrar y confirmar ventas</span>
                </div>
                <input type="checkbox" id="chkSounds" class="toggle-checkbox" ${s.enableSounds ? 'checked' : ''} />
              </label>

              <label class="toggle-row">
                <div class="toggle-text">
                  <strong>Beep de escáner de código de barras</strong>
                  <span>Emite el clásico beep óptico al leer productos</span>
                </div>
                <input type="checkbox" id="chkScannerBeep" class="toggle-checkbox" ${s.enableScannerBeep ? 'checked' : ''} />
              </label>
            </div>
          </div>

          <!-- 3. Backup & Restore (IndexedDB JSON) -->
          <div class="settings-card">
            <div class="card-header-group">
              ${icons.download}
              <h3>Copia de Seguridad y Restauración</h3>
            </div>
            <p class="card-subtext">Guardá todos tus productos, precios, ventas y turnos de caja en un archivo para no perderlos nunca.</p>

            <div class="backup-actions-box">
              <div class="backup-action-item">
                <div class="backup-info">
                  <strong>Descargar copia de seguridad</strong>
                  <span>Crea un archivo JSON con todo el estado actual de la base de datos local.</span>
                </div>
                <button type="button" id="btnDownloadBackup" class="btn-secondary-action">
                  ${icons.download}
                  <span>Descargar Copia</span>
                </button>
              </div>

              <div class="backup-action-item">
                <div class="backup-info">
                  <strong>Restaurar copia de seguridad</strong>
                  <span>Importa productos y operaciones desde un archivo de respaldo previo.</span>
                </div>
                <label class="btn-secondary-action btn-upload-label">
                  ${icons.upload}
                  <span>Restaurar Archivo</span>
                  <input type="file" id="fileImportBackup" accept=".json" style="display: none;" />
                </label>
              </div>
            </div>
          </div>

          <!-- 4. PWA Installation Card -->
          <div class="settings-card">
            <div class="card-header-group">
              ${icons.install}
              <h3>Aplicación Web Progresiva (PWA)</h3>
            </div>
            
            <div class="pwa-status-box">
              <div class="pwa-badge ${isInstalled ? 'installed' : 'not-installed'}">
                <span class="pwa-dot"></span>
                <span>${isInstalled ? 'Aplicación Instalada en este dispositivo' : 'Ejecutando en el navegador web'}</span>
              </div>

              <p class="pwa-description">
                PUMPA CAJA está optimizada para funcionar como una aplicación nativa en celulares Android, con acceso sin conexión a internet y pantalla completa.
              </p>

              ${!isInstalled ? `
                <button type="button" id="btnInstallPwaSettings" class="btn-primary-confirm ${!canPrompt ? 'btn-guide' : ''}">
                  ${icons.install}
                  <span>${canPrompt ? 'Instalar PUMPA CAJA en este Celular' : 'Cómo instalar en la pantalla de inicio'}</span>
                </button>
              ` : `
                <div class="installed-check-message">
                  ${icons.check}
                  <span>PUMPA CAJA ya se encuentra instalada en el dispositivo.</span>
                </div>
              `}
            </div>
          </div>

          <!-- 5. About PUMPALABS -->
          <div class="settings-card about-card">
            <div class="about-brand-box">
              <div class="about-logo">${icons.cash}</div>
              <div class="about-titles">
                <h3>PUMPA CAJA v1.0</h3>
                <span class="about-tagline">Vendé fácil. Controlá todo.</span>
                <span class="about-by">Desarrollado por <strong>PUMPALABS</strong></span>
              </div>
            </div>
            <p class="about-text">
              Sistema de punto de venta y control de caja diseñado para pequeños comercios de Argentina: almacenes, kioscos, despensas, minimercados y autoservicios. Comercio piloto: Almacén Chiche.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  static attachEvents(container: HTMLElement): void {
    const form = container.querySelector('#formStoreSettings') as HTMLFormElement;
    const chkSounds = container.querySelector('#chkSounds') as HTMLInputElement;
    const chkScanner = container.querySelector('#chkScannerBeep') as HTMLInputElement;
    const btnDownload = container.querySelector('#btnDownloadBackup');
    const fileImport = container.querySelector('#fileImportBackup') as HTMLInputElement;
    const btnInstall = container.querySelector('#btnInstallPwaSettings');

    // Save store details
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const storeName = (container.querySelector('#inputStoreName') as HTMLInputElement).value.trim();
      const fantasyName = (container.querySelector('#inputFantasyName') as HTMLInputElement).value.trim() || 'PUMPA CAJA';
      const cuit = (container.querySelector('#inputStoreCuit') as HTMLInputElement).value.trim();
      const phone = (container.querySelector('#inputStorePhone') as HTMLInputElement).value.trim();
      const address = (container.querySelector('#inputStoreAddress') as HTMLInputElement).value.trim();
      const ticketFooter = (container.querySelector('#inputTicketFooter') as HTMLInputElement).value.trim();

      const updatedSettings: StoreSettings = {
        ...state.settings,
        storeName,
        fantasyName,
        cuit,
        phone,
        address,
        ticketFooter
      };

      await db.saveSettings(updatedSettings);
      state.settings = updatedSettings;

      state.showToast('Configuración del comercio guardada con éxito', 'success');
      state.notify();
    });

    // Sound toggles
    chkSounds?.addEventListener('change', async () => {
      state.settings.enableSounds = chkSounds.checked;
      await db.saveSettings(state.settings);
      state.showToast(`Sonidos ${chkSounds.checked ? 'activados' : 'desactivados'}`, 'info');
    });

    chkScanner?.addEventListener('change', async () => {
      state.settings.enableScannerBeep = chkScanner.checked;
      await db.saveSettings(state.settings);
      state.showToast(`Beep de escáner ${chkScanner.checked ? 'activado' : 'desactivado'}`, 'info');
    });

    // Download Backup JSON
    btnDownload?.addEventListener('click', async () => {
      const jsonStr = await db.exportFullDatabase();
      const dateStr = new Date().toISOString().split('T')[0];
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PUMPA_CAJA_CopiaSeguridad_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      state.showToast('Copia de seguridad descargada exitosamente', 'success');
    });

    // Import Backup JSON
    fileImport?.addEventListener('change', async () => {
      const file = fileImport.files?.[0];
      if (!file) return;

      if (!confirm('¿Deseás restaurar los datos desde este archivo? Los registros existentes se actualizarán.')) {
        fileImport.value = '';
        return;
      }

      try {
        const text = await file.text();
        const res = await db.importFullDatabase(text);
        await state.init();
        state.showToast(`Restauración exitosa: ${res.products} productos y ${res.sales} ventas cargadas`, 'success');
      } catch (err: any) {
        alert('Error al restaurar archivo: ' + (err.message || err));
      } finally {
        fileImport.value = '';
      }
    });

    // Install PWA
    btnInstall?.addEventListener('click', async () => {
      if (state.installPromptEvent) {
        state.installPromptEvent.prompt();
        const { outcome } = await state.installPromptEvent.userChoice;
        if (outcome === 'accepted') {
          state.isInstalled = true;
          state.installPromptEvent = null;
          state.showToast('¡Instalación completada!', 'success');
          state.notify();
        }
      } else {
        alert(
          'Para instalar en Android:\n' +
          '1. Tocá los tres puntos (⋮) de Chrome arriba a la derecha.\n' +
          '2. Seleccioná "Agregar a la pantalla principal" o "Instalar aplicación".\n\n' +
          'Para instalar en iPhone (Safari):\n' +
          '1. Tocá el botón Compartir (cuadrado con flecha hacia arriba).\n' +
          '2. Seleccioná "Agregar a inicio".'
        );
      }
    });
  }
}
