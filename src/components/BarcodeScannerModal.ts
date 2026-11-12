import { BarcodeScanner } from '../services/barcodeScanner';
import { sounds } from '../services/soundService';
import { icons } from './icons';

export class BarcodeScannerModal {
  private static scanner: BarcodeScanner = new BarcodeScanner();
  private static modalEl: HTMLElement | null = null;
  private static isTorchOn: boolean = false;

  static open(onScan: (barcode: string) => void): void {
    this.close(); // ensure any previous instance is cleaned up

    const modal = document.createElement('div');
    modal.className = 'scanner-modal-overlay';
    modal.id = 'scannerModal';
    modal.innerHTML = `
      <div class="scanner-card">
        <div class="scanner-header">
          <div class="scanner-title-group">
            ${icons.camera}
            <h3>Escanear Código de Barras</h3>
          </div>
          <button id="btnScannerClose" class="btn-icon-close" aria-label="Cerrar escáner">
            ${icons.close}
          </button>
        </div>

        <div class="scanner-viewport-wrapper">
          <video id="scannerVideo" class="scanner-video" playsinline muted autoplay></video>
          
          <div class="scanner-reticle">
            <div class="scanner-laser"></div>
            <div class="corner-tl"></div>
            <div class="corner-tr"></div>
            <div class="corner-bl"></div>
            <div class="corner-br"></div>
          </div>
          
          <div class="scanner-instructions">
            Apuntá la cámara al código de barras o QR
          </div>
        </div>

        <div class="scanner-footer">
          <button id="btnScannerTorch" class="btn-scanner-action">
            ${icons.flash}
            <span>Linterna</span>
          </button>
          <button id="btnScannerManual" class="btn-scanner-action">
            ${icons.edit}
            <span>Ingreso manual</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;

    const video = modal.querySelector('#scannerVideo') as HTMLVideoElement;
    const btnClose = modal.querySelector('#btnScannerClose');
    const btnTorch = modal.querySelector('#btnScannerTorch') as HTMLButtonElement;
    const btnManual = modal.querySelector('#btnScannerManual');

    btnClose?.addEventListener('click', () => this.close());

    btnTorch?.addEventListener('click', async () => {
      this.isTorchOn = !this.isTorchOn;
      const success = await this.scanner.toggleTorch(this.isTorchOn);
      if (success) {
        btnTorch.classList.toggle('active', this.isTorchOn);
      }
    });

    btnManual?.addEventListener('click', () => {
      const manualCode = prompt('Ingresá el código de barras numérico:');
      if (manualCode && manualCode.trim()) {
        sounds.playBeep();
        this.close();
        onScan(manualCode.trim());
      }
    });

    // Start scanner
    this.scanner.start(
      video,
      (barcode) => {
        sounds.playBeep();
        this.close();
        onScan(barcode);
      },
      (error) => {
        console.warn('Camera error', error);
        alert('No se pudo acceder a la cámara. Verificá los permisos del navegador o usá el buscador manual.');
        this.close();
      }
    );
  }

  static close(): void {
    if (this.scanner) {
      this.scanner.stop();
    }
    if (this.modalEl && this.modalEl.parentNode) {
      this.modalEl.parentNode.removeChild(this.modalEl);
      this.modalEl = null;
    }
    this.isTorchOn = false;
  }
}
