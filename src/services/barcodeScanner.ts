import { BrowserMultiFormatReader } from '@zxing/browser';

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): {
        detect(source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap): Promise<Array<{ rawValue: string }>>;
      };
      getSupportedFormats?(): Promise<string[]>;
    };
  }
}

export class BarcodeScanner {
  private videoElement: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private zxingReader: BrowserMultiFormatReader | null = null;
  private animFrameId: number | null = null;
  private isScanning: boolean = false;
  private nativeDetector: any = null;
  private torchTrack: MediaStreamTrack | null = null;

  async start(
    videoElement: HTMLVideoElement,
    onBarcodeFound: (barcode: string) => void,
    onError?: (error: Error) => void
  ): Promise<boolean> {
    this.videoElement = videoElement;
    this.isScanning = true;

    try {
      // 1. Request camera stream (back-facing camera preferred for scanning barcodes)
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      // Check for torch capability
      const track = this.stream.getVideoTracks()[0];
      if (track) {
        this.torchTrack = track;
      }

      // 2. Check if native BarcodeDetector is supported
      if ('BarcodeDetector' in window && typeof window.BarcodeDetector === 'function') {
        try {
          const formats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'];
          this.nativeDetector = new window.BarcodeDetector({ formats });
          this.scanNativeLoop(onBarcodeFound);
          return true;
        } catch (e) {
          console.warn('BarcodeDetector initialization fallback to ZXing', e);
        }
      }

      // 3. Fallback to ZXing BrowserMultiFormatReader
      this.zxingReader = new BrowserMultiFormatReader();
      this.zxingReader.decodeFromVideoElement(this.videoElement, (result, err) => {
        if (!this.isScanning) return;
        if (result) {
          const text = result.getText();
          if (text) {
            onBarcodeFound(text);
          }
        }
      });

      return true;
    } catch (err: any) {
      this.stop();
      if (onError) onError(err);
      return false;
    }
  }

  private scanNativeLoop(onBarcodeFound: (barcode: string) => void): void {
    if (!this.isScanning || !this.videoElement || !this.nativeDetector) return;

    if (this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
      this.nativeDetector
        .detect(this.videoElement)
        .then((barcodes: Array<{ rawValue: string }>) => {
          if (!this.isScanning) return;
          if (barcodes && barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            if (code) {
              onBarcodeFound(code);
            }
          }
        })
        .catch(() => {
          // ignore transient frame decode error
        })
        .finally(() => {
          if (this.isScanning) {
            this.animFrameId = requestAnimationFrame(() => this.scanNativeLoop(onBarcodeFound));
          }
        });
    } else {
      if (this.isScanning) {
        this.animFrameId = requestAnimationFrame(() => this.scanNativeLoop(onBarcodeFound));
      }
    }
  }

  async toggleTorch(enable: boolean): Promise<boolean> {
    if (!this.torchTrack) return false;
    try {
      const capabilities = this.torchTrack.getCapabilities ? (this.torchTrack.getCapabilities() as any) : {};
      if (capabilities.torch) {
        await (this.torchTrack as any).applyConstraints({
          advanced: [{ torch: enable }]
        });
        return true;
      }
    } catch {
      // torch not supported on this device
    }
    return false;
  }

  hasTorch(): boolean {
    if (!this.torchTrack || !this.torchTrack.getCapabilities) return false;
    const caps = (this.torchTrack.getCapabilities() as any) || {};
    return Boolean(caps.torch);
  }

  stop(): void {
    this.isScanning = false;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.zxingReader = null;
    this.nativeDetector = null;
    this.torchTrack = null;
  }
}
