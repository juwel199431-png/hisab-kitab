export interface VoucherData {
  voucherNo?: string;
  id?: string;
  date: string;
  currency: 'BDT' | 'KWD';
  amount: number;
  type: 'income' | 'expense' | 'transfer' | 'loan';
  sectionNameBn?: string;
  sectionNameEn?: string;
  categoryNameBn?: string;
  categoryNameEn?: string;
  borrowerName?: string;
  bankName?: string;
  status?: 'paid' | 'unpaid';
  note?: string;
  recipientPhone?: string;
}

export interface StatementData {
  borrowerName: string;
  phone?: string;
  date: string;
  totalLent: number;
  totalCollected: number;
  remainingDue: number;
  currency: 'BDT' | 'KWD';
  dueDate?: string;
  recentTransactions?: Array<{
    date: string;
    type: string;
    amount: number;
    voucherNo?: string;
    note?: string;
  }>;
}

/**
 * Draws rounded rectangle with fallback for older browsers.
 */
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

/**
 * Draw a clean multi-line wrapped text inside maxWidth.
 */
function wrapAndFillText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, curY);
  return curY + lineHeight;
}

/**
 * Pure HTML5 2D Canvas Generator for Transaction Audit Vouchers.
 * 100% reliable - Does NOT depend on html2canvas, CSS variables, or oklch.
 * Generates ultra-sharp, high-DPI (2x retina) PNG receipt card.
 */
export function drawVoucherCardCanvas(data: VoucherData): HTMLCanvasElement {
  const scale = 2;
  const width = 640;
  // Estimate height based on whether there's a note
  const hasNote = Boolean(data.note && data.note.trim());
  const baseHeight = hasNote ? 780 : 700;
  const height = baseHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Outer border & soft shadow
  ctx.save();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, 16, 16, width - 32, height - 32, 20);
  ctx.stroke();
  ctx.restore();

  // Top header banner background
  ctx.fillStyle = '#0f172a'; // Deep slate
  ctx.beginPath();
  drawRoundRect(ctx, 16, 16, width - 32, 88, 20);
  ctx.fill();
  // Flatten bottom corners of the header bar
  ctx.fillRect(16, 84, width - 32, 20);

  // Header Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Segoe UI", "Noto Sans Bengali", sans-serif';
  ctx.fillText('হিসাব কিতাব • ডিজিটাল অডিট ভাউচার', 36, 52);

  // Subtitle
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px "Segoe UI", "Noto Sans Bengali", sans-serif';
  ctx.fillText('অফিসিয়াল লেনদেন ও হিসাব রসিদ (Official Audit Slip)', 36, 74);

  // Verified Badge on Header Right
  ctx.fillStyle = '#10b981'; // Emerald
  ctx.beginPath();
  drawRoundRect(ctx, width - 156, 36, 120, 28, 14);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✓ VERIFIED', width - 96, 54);
  ctx.textAlign = 'left';

  // Subheader: Date & Voucher No
  const dateStr = `📅 তারিখ: ${data.date}`;
  const voucherStr = data.voucherNo ? `ভাউচার নং: #${data.voucherNo}` : `ID: ${data.id ? data.id.slice(0, 8) : 'AUTO'}`;

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 13px "Segoe UI", "Noto Sans Bengali", monospace';
  ctx.fillText(dateStr, 36, 134);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#4f46e5'; // Indigo
  ctx.font = 'bold 14px "Segoe UI", monospace';
  ctx.fillText(voucherStr, width - 36, 134);
  ctx.textAlign = 'left';

  // Amount Showcase Card
  const isIncome = data.type === 'income';
  const isExpense = data.type === 'expense';
  const isLoan = data.type === 'loan';

  let bannerBg = '#f0fdf4'; // emerald-50
  let bannerBorder = '#86efac'; // emerald-300
  let amountColor = '#15803d'; // emerald-700
  let typeTitle = 'তহবিলে প্রাপ্তি / জমা (Inflow / Deposit)';
  let sign = '+';

  if (isExpense) {
    bannerBg = '#fff1f2'; // rose-50
    bannerBorder = '#fca5a5'; // rose-300
    amountColor = '#be123c'; // rose-700
    typeTitle = 'ব্যয় / খরচ (Expense / Outflow)';
    sign = '-';
  } else if (isLoan) {
    bannerBg = '#eef2ff'; // indigo-50
    bannerBorder = '#a5b4fc'; // indigo-300
    amountColor = '#4338ca'; // indigo-700
    typeTitle = 'দিনার লোন প্রদান / ঋণ (Loan Given)';
    sign = '';
  } else if (data.type === 'transfer') {
    bannerBg = '#f0f9ff'; // sky-50
    bannerBorder = '#7dd3fc'; // sky-300
    amountColor = '#0369a1'; // sky-700
    typeTitle = 'অ্যাকাউন্ট ফান্ড ট্রান্সফার (Fund Transfer)';
    sign = '⇄ ';
  }

  // Draw Amount Card Box
  ctx.fillStyle = bannerBg;
  ctx.beginPath();
  drawRoundRect(ctx, 36, 156, width - 72, 84, 16);
  ctx.fill();

  ctx.strokeStyle = bannerBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  drawRoundRect(ctx, 36, 156, width - 72, 84, 16);
  ctx.stroke();

  // Amount Card Labels
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 12px "Segoe UI", "Noto Sans Bengali", sans-serif';
  ctx.fillText('লেনদেনের পরিমাণ (AMOUNT)', 56, 184);

  ctx.fillStyle = '#64748b';
  ctx.font = '11px "Segoe UI", "Noto Sans Bengali", sans-serif';
  ctx.fillText(typeTitle, 56, 204);

  // Formatted Amount Text
  const amountFormatted =
    data.currency === 'KWD'
      ? `${sign}${data.amount.toFixed(3)} KD`
      : `${sign}৳ ${data.amount.toLocaleString('en-US')}`;

  ctx.textAlign = 'right';
  ctx.fillStyle = amountColor;
  ctx.font = 'bold 28px "Segoe UI", monospace';
  ctx.fillText(amountFormatted, width - 56, 208);
  ctx.textAlign = 'left';

  // Details Table
  let curY = 270;
  const tableRows: Array<{ label: string; value: string; isHighlight?: boolean }> = [
    {
      label: 'অ্যাকাউন্ট / হেড:',
      value: data.sectionNameBn || data.sectionNameEn || 'General Account',
    },
    {
      label: 'খাত / ক্যাটাগরি:',
      value: data.categoryNameBn || data.categoryNameEn || 'Uncategorized',
    },
  ];

  if (data.borrowerName) {
    tableRows.push({
      label: 'সংশ্লিষ্ট ব্যক্তি / গ্রহীতা:',
      value: `👤 ${data.borrowerName}`,
      isHighlight: true,
    });
  }

  if (data.bankName) {
    tableRows.push({
      label: 'সংশ্লিষ্ট ব্যাংক:',
      value: `🏦 ${data.bankName}`,
    });
  }

  if (data.status) {
    tableRows.push({
      label: 'পেমেন্ট স্ট্যাটাস:',
      value: data.status === 'paid' ? '✓ পরিশোধিত (Paid)' : '⏱ বাকি (Unpaid)',
    });
  }

  // Draw table rows
  tableRows.forEach((row, idx) => {
    // Alternating row background
    if (row.isHighlight) {
      ctx.fillStyle = '#eff6ff'; // blue-50
      ctx.beginPath();
      drawRoundRect(ctx, 36, curY - 20, width - 72, 36, 8);
      ctx.fill();
    } else if (idx % 2 === 1) {
      ctx.fillStyle = '#f8fafc'; // slate-50
      ctx.beginPath();
      drawRoundRect(ctx, 36, curY - 20, width - 72, 36, 8);
      ctx.fill();
    }

    // Label
    ctx.fillStyle = '#64748b';
    ctx.font = '13px "Segoe UI", "Noto Sans Bengali", sans-serif';
    ctx.fillText(row.label, 52, curY + 2);

    // Value
    ctx.textAlign = 'right';
    ctx.fillStyle = row.isHighlight ? '#1e3a8a' : '#0f172a';
    ctx.font = 'bold 13px "Segoe UI", "Noto Sans Bengali", sans-serif';
    ctx.fillText(row.value, width - 52, curY + 2);
    ctx.textAlign = 'left';

    // Thin separator line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(36, curY + 16);
    ctx.lineTo(width - 36, curY + 16);
    ctx.stroke();

    curY += 38;
  });

  // Note Section (if available)
  if (hasNote && data.note) {
    curY += 10;
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 12px "Segoe UI", "Noto Sans Bengali", sans-serif';
    ctx.fillText('মন্তব্য / নোট (Remarks):', 40, curY);

    curY += 12;
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    drawRoundRect(ctx, 36, curY, width - 72, 64, 10);
    ctx.fill();

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    drawRoundRect(ctx, 36, curY, width - 72, 64, 10);
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.font = '12px "Segoe UI", "Noto Sans Bengali", sans-serif';
    wrapAndFillText(ctx, `"${data.note}"`, 52, curY + 24, width - 104, 18);
    curY += 74;
  }

  // Footer bar
  const footerY = height - 52;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, footerY - 14);
  ctx.lineTo(width - 36, footerY - 14);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '11px "Segoe UI", "Noto Sans Bengali", sans-serif';
  ctx.fillText('হিসাব কিতাব স্মার্ট ফাইন্যান্স সিস্টেম • অফিশিয়াল অডিট স্লিপ', 36, footerY + 8);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#059669'; // Emerald-600
  ctx.font = 'bold 11px "Segoe UI", sans-serif';
  ctx.fillText('100% VERIFIED RECORD', width - 36, footerY + 8);
  ctx.textAlign = 'left';

  return canvas;
}

/**
 * Pure HTML5 2D Canvas Generator for Borrower Loan Statement Cards.
 * Perfect for sending loan reminders / ledger summaries to WhatsApp as an image.
 */
export function drawStatementCardCanvas(data: StatementData): HTMLCanvasElement {
  const scale = 2;
  const width = 640;
  const height = 720;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Outer border & soft shadow
  ctx.save();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, 16, 16, width - 32, height - 32, 20);
  ctx.stroke();
  ctx.restore();

  // Top header banner background (Deep Indigo)
  ctx.fillStyle = '#1e1b4b'; // Indigo-950
  ctx.beginPath();
  drawRoundRect(ctx, 16, 16, width - 32, 94, 20);
  ctx.fill();
  ctx.fillRect(16, 88, width - 32, 22);

  // Header Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Segoe UI", "Noto Sans Bengali", sans-serif';
  ctx.fillText('কুয়েত পার্সোনাল লোন • হিসাব বিবরণী', 36, 52);

  ctx.fillStyle = '#a5b4fc';
  ctx.font = '12px "Segoe UI", "Noto Sans Bengali", sans-serif';
  ctx.fillText('Personal Loan Statement & Due Reminder', 36, 74);

  // Borrower Name Box
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  drawRoundRect(ctx, 36, 126, width - 72, 60, 12);
  ctx.fill();
  ctx.strokeStyle = '#e0e7ff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  drawRoundRect(ctx, 36, 126, width - 72, 60, 12);
  ctx.stroke();

  ctx.fillStyle = '#4338ca';
  ctx.font = 'bold 12px "Segoe UI", "Noto Sans Bengali", sans-serif';
  ctx.fillText('সম্মানিত গ্রাহক / গ্রহীতার নাম:', 52, 150);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px "Segoe UI", "Noto Sans Bengali", sans-serif';
  ctx.fillText(data.borrowerName, 52, 172);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#64748b';
  ctx.font = '12px "Segoe UI", monospace';
  ctx.fillText(`📅 ${data.date}`, width - 52, 150);
  if (data.phone) {
    ctx.fillText(`📱 ${data.phone}`, width - 52, 172);
  }
  ctx.textAlign = 'left';

  // 3-Column Summary Cards
  const cardW = (width - 72 - 24) / 3;
  const cardY = 202;

  // Card 1: Total Lent
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  drawRoundRect(ctx, 36, cardY, cardW, 80, 12);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '11px "Segoe UI", "Noto Sans Bengali", sans-serif';
  ctx.fillText('মোট গ্রহণ (Total Loan)', 48, cardY + 26);
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 17px "Segoe UI", monospace';
  ctx.fillText(`${data.totalLent.toFixed(3)} KD`, 48, cardY + 58);

  // Card 2: Total Collected
  const c2X = 36 + cardW + 12;
  ctx.fillStyle = '#f0fdf4';
  ctx.beginPath();
  drawRoundRect(ctx, c2X, cardY, cardW, 80, 12);
  ctx.fill();
  ctx.strokeStyle = '#86efac';
  ctx.stroke();

  ctx.fillStyle = '#166534';
  ctx.font = '11px "Segoe UI", "Noto Sans Bengali", sans-serif';
  ctx.fillText('ফেরত পরিশোধ (Paid)', c2X + 12, cardY + 26);
  ctx.fillStyle = '#15803d';
  ctx.font = 'bold 17px "Segoe UI", monospace';
  ctx.fillText(`${data.totalCollected.toFixed(3)} KD`, c2X + 12, cardY + 58);

  // Card 3: Remaining Due (High Impact)
  const c3X = c2X + cardW + 12;
  ctx.fillStyle = '#fff1f2';
  ctx.beginPath();
  drawRoundRect(ctx, c3X, cardY, cardW, 80, 12);
  ctx.fill();
  ctx.strokeStyle = '#fca5a5';
  ctx.stroke();

  ctx.fillStyle = '#9f1239';
  ctx.font = 'bold 11px "Segoe UI", "Noto Sans Bengali", sans-serif';
  ctx.fillText('অবশিষ্ট পাওনা (DUE)', c3X + 12, cardY + 26);
  ctx.fillStyle = '#be123c';
  ctx.font = 'bold 18px "Segoe UI", monospace';
  ctx.fillText(`${data.remainingDue.toFixed(3)} KD`, c3X + 12, cardY + 58);

  // Due Date (if present)
  let tableStartY = 302;
  if (data.dueDate) {
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    drawRoundRect(ctx, 36, tableStartY, width - 72, 34, 8);
    ctx.fill();
    ctx.strokeStyle = '#fde68a';
    ctx.stroke();

    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 12px "Segoe UI", "Noto Sans Bengali", sans-serif';
    ctx.fillText(`⏰ নির্ধারিত পরিশোধের শেষ তারিখ: ${data.dueDate}`, 52, tableStartY + 22);
    tableStartY += 46;
  }

  // Reminder Note Box
  const noteBoxY = tableStartY;
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  drawRoundRect(ctx, 36, noteBoxY, width - 72, 110, 12);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px "Segoe UI", "Noto Sans Bengali", sans-serif';
  ctx.fillText('সালামু আলাইকুম ভাই,', 52, noteBoxY + 30);

  ctx.fillStyle = '#334155';
  ctx.font = '13px "Segoe UI", "Noto Sans Bengali", sans-serif';
  ctx.fillText(
    `উপরে উল্লেখিত হিসাব বিবরণী অনুযায়ী আপনার নিকট বর্তমান অবশিষ্ট পাওনা ${data.remainingDue.toFixed(3)} KD।`,
    52,
    noteBoxY + 56
  );
  ctx.fillText(
    'মেহেরবানী করে দ্রুত পাওনা অর্থ পরিশোধ করার জন্য অনুরোধ করা হলো। জাযাকাল্লাহু খাইরান!',
    52,
    noteBoxY + 82
  );

  // Footer bar
  const footerY = height - 50;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, footerY - 14);
  ctx.lineTo(width - 36, footerY - 14);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '11px "Segoe UI", "Noto Sans Bengali", sans-serif';
  ctx.fillText('হিসাব কিতাব সিস্টেম থেকে স্বয়ংক্রিয়ভাবে প্রেরিত', 36, footerY + 8);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#4338ca';
  ctx.font = 'bold 11px "Segoe UI", sans-serif';
  ctx.fillText('OFFICIAL STATEMENT', width - 36, footerY + 8);
  ctx.textAlign = 'left';

  return canvas;
}

/**
 * Convert HTML Canvas to PNG Blob.
 */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas toBlob failed'));
      }
    }, 'image/png', 0.98);
  });
}

/**
 * Convert Canvas to Base64 Data URL.
 */
export function canvasToDataURL(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png', 0.98);
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
 * Try native share if device supports files (Mobile devices).
 */
export async function shareFileNative(file: File, title: string = 'Voucher Image'): Promise<boolean> {
  try {
    const nav = navigator as any;
    if (nav.canShare && nav.canShare({ files: [file] })) {
      await nav.share({
        files: [file],
        title,
      });
      return true;
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') return true;
    console.warn('Native share error:', err);
  }
  return false;
}

/**
 * Format phone number for WhatsApp URL.
 */
export function getWhatsAppUrl(phone?: string, text?: string): string {
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  if (cleanPhone && text) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
  }
  if (cleanPhone) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}`;
  }
  if (text) {
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  }
  return `https://web.whatsapp.com/`;
}
