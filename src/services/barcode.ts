import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

export class CodeGeneratorService {
  /**
   * Generates a Data URL for QR Code pointing to validation URL
   */
  public static async generateQrCodeDataUrl(textOrUrl: string): Promise<string> {
    try {
      return await QRCode.toDataURL(textOrUrl, {
        width: 240,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });
    } catch (err) {
      console.error('Failed to generate QR code', err);
      return '';
    }
  }

  /**
   * Renders Barcode directly to an SVG or Canvas element using JsBarcode
   */
  public static renderBarcodeToElement(
    element: SVGElement | HTMLCanvasElement,
    code: string,
    options?: { height?: number; displayValue?: boolean; fontSize?: number }
  ): void {
    try {
      JsBarcode(element, code, {
        format: 'CODE128',
        lineColor: '#0f172a',
        width: 1.6,
        height: options?.height ?? 32,
        displayValue: options?.displayValue ?? true,
        fontSize: options?.fontSize ?? 11,
        textMargin: 2,
        font: 'monospace',
      });
    } catch (err) {
      console.error('Failed to render barcode', err);
    }
  }

  /**
   * Generates validation URL for a participant
   */
  public static getValidationUrl(nomorOrId: string): string {
    const origin = window.location.origin;
    return `${origin}/#validasi?id=${encodeURIComponent(nomorOrId)}`;
  }
}
