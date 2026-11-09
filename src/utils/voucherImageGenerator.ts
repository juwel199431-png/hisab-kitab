import html2canvas from 'html2canvas';

export interface ShareVoucherOptions {
  element: HTMLElement;
  fileName?: string;
  recipientPhone?: string;
  voucherNo?: string;
  captionText?: string;
}

/**
 * Capture an HTML DOM element (e.g. Audit Voucher, Slip, Receipt) as a PNG Blob.
 */
export async function captureElementAsBlob(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2, // 2x Retina resolution for razor-sharp text and borders
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    scrollX: 0,
    scrollY: 0,
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to generate image blob from voucher canvas'));
      }
    }, 'image/png', 0.98);
  });
}

/**
 * Download a Blob as an image file on the client.
 */
export function downloadBlobAsImage(blob: Blob, fileName: string = 'voucher-slip.png'): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Copy an image Blob directly to clipboard for instant pasting (Ctrl+V) into WhatsApp Web / Desktop.
 */
export async function copyBlobToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard writeImage failed or not supported:', err);
  }
  return false;
}

/**
 * Share a transaction voucher strictly as an IMAGE to WhatsApp.
 * - If native Web Share API supports file sharing (Mobile Chrome/Safari, Android, iOS, macOS):
 *   Directly opens native share sheet with the image file attached!
 * - Also copies the image to clipboard so user can press Ctrl+V in WhatsApp Web.
 * - Downloads the PNG image file so user can drag-and-drop or attach.
 * - Opens WhatsApp chat.
 */
export async function shareVoucherAsImageToWhatsApp(
  options: ShareVoucherOptions
): Promise<{ success: boolean; method: 'native-share' | 'clipboard-and-download'; error?: string }> {
  try {
    const { element, fileName = 'transaction-voucher.png', recipientPhone, captionText = '' } = options;

    // 1. Generate crisp PNG Blob
    const blob = await captureElementAsBlob(element);
    const file = new File([blob], fileName, { type: 'image/png' });

    // 2. Check if native Web Share API with files is supported
    const nav = navigator as any;
    if (nav.canShare && nav.canShare({ files: [file] })) {
      try {
        await nav.share({
          files: [file],
          title: 'Transaction Voucher',
          text: captionText,
        });
        return { success: true, method: 'native-share' };
      } catch (shareErr: any) {
        // User cancelled share or abort error
        if (shareErr.name === 'AbortError') {
          return { success: true, method: 'native-share' };
        }
        console.warn('Native share failed, falling back to clipboard/download:', shareErr);
      }
    }

    // 3. Desktop / Fallback flow:
    // Copy image to clipboard for instant Ctrl+V
    await copyBlobToClipboard(blob);

    // Download the image file so it is directly on their device
    downloadBlobAsImage(blob, fileName);

    // Clean phone number if provided
    const cleanPhone = recipientPhone ? recipientPhone.replace(/[^0-9]/g, '') : '';
    const whatsappUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}`
      : `https://web.whatsapp.com/`;

    window.open(whatsappUrl, '_blank');

    return { success: true, method: 'clipboard-and-download' };
  } catch (err: any) {
    console.error('Error sharing voucher as image:', err);
    return { success: false, method: 'clipboard-and-download', error: err?.message || 'Unknown error' };
  }
}
