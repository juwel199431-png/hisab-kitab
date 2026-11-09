import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  ExternalLink,
  MessageCircle,
  Phone,
  Sparkles,
  Smartphone,
  Info,
} from 'lucide-react';
import {
  VoucherData,
  StatementData,
  drawVoucherCardCanvas,
  drawStatementCardCanvas,
  canvasToBlob,
  canvasToDataURL,
  downloadBlobAsImage,
  copyBlobToClipboard,
  shareFileNative,
  getWhatsAppUrl,
} from '../../utils/voucherImageGenerator';

interface WhatsAppImageShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'bn' | 'en';
  voucherData?: VoucherData | null;
  statementData?: StatementData | null;
  defaultPhone?: string;
}

export const WhatsAppImageShareModal: React.FC<WhatsAppImageShareModalProps> = ({
  isOpen,
  onClose,
  lang,
  voucherData,
  statementData,
  defaultPhone = '',
}) => {
  const [imgDataUrl, setImgDataUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [recipientPhone, setRecipientPhone] = useState(defaultPhone);
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // Check if device supports native file share (e.g. Mobile Android/iOS)
  useEffect(() => {
    const nav = navigator as any;
    if (nav.canShare && typeof nav.share === 'function') {
      try {
        const dummyFile = new File([''], 'test.png', { type: 'image/png' });
        if (nav.canShare({ files: [dummyFile] })) {
          setCanNativeShare(true);
        }
      } catch {
        setCanNativeShare(false);
      }
    }
  }, []);

  // Update recipient phone when props change
  useEffect(() => {
    if (defaultPhone) {
      setRecipientPhone(defaultPhone);
    } else if (voucherData?.recipientPhone) {
      setRecipientPhone(voucherData.recipientPhone);
    } else if (statementData?.phone) {
      setRecipientPhone(statementData.phone);
    }
  }, [defaultPhone, voucherData, statementData]);

  // Generate Canvas image on modal open
  useEffect(() => {
    if (!isOpen) {
      setImgDataUrl(null);
      setBlob(null);
      setStatusMessage(null);
      setIsCopied(false);
      return;
    }

    setIsGenerating(true);
    try {
      let canvas: HTMLCanvasElement | null = null;
      if (voucherData) {
        canvas = drawVoucherCardCanvas(voucherData);
      } else if (statementData) {
        canvas = drawStatementCardCanvas(statementData);
      }

      if (canvas) {
        const dataUrl = canvasToDataURL(canvas);
        setImgDataUrl(dataUrl);

        canvasToBlob(canvas).then((b) => {
          setBlob(b);
          setIsGenerating(false);
        });
      } else {
        setIsGenerating(false);
      }
    } catch (err) {
      console.error('Failed to generate canvas image:', err);
      setIsGenerating(false);
    }
  }, [isOpen, voucherData, statementData]);

  if (!isOpen) return null;

  const fileName = voucherData
    ? `voucher-${voucherData.voucherNo ? voucherData.voucherNo.replace(/[^a-zA-Z0-9_-]/g, '') : 'slip'}.png`
    : `statement-${statementData?.borrowerName ? statementData.borrowerName.replace(/[^a-zA-Z0-9_-]/g, '') : 'loan'}.png`;

  // 1. One-click Copy Image & Open WhatsApp
  const handleCopyAndOpenWhatsApp = async () => {
    if (!blob) return;

    // A. Copy image to clipboard so user can press Ctrl+V
    const copyOk = await copyBlobToClipboard(blob);
    if (copyOk) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    }

    // B. Also auto download as backup
    downloadBlobAsImage(blob, fileName);

    // C. Open WhatsApp
    const waUrl = getWhatsAppUrl(recipientPhone);
    window.open(waUrl, '_blank');

    setStatusMessage(
      lang === 'bn'
        ? '✓ ভাউচারের ছবি কপি ও ডাউনলোড হয়েছে! হোয়াটসঅ্যাপ চ্যাট বক্সে গিয়ে Ctrl + V (Paste) চাপুন।'
        : '✓ Image copied & downloaded! Press Ctrl + V (Paste) into WhatsApp chat.'
    );
  };

  // 2. Just Copy Image to Clipboard
  const handleCopyImageOnly = async () => {
    if (!blob) return;
    const ok = await copyBlobToClipboard(blob);
    if (ok) {
      setIsCopied(true);
      setStatusMessage(
        lang === 'bn'
          ? '✓ ছবিটি কপি হয়েছে! হোয়াটসঅ্যাপ বা মেসেঞ্জারে গিয়ে Paste (Ctrl+V) করুন।'
          : '✓ Image copied! Paste (Ctrl+V) into WhatsApp.'
      );
      setTimeout(() => setIsCopied(false), 3000);
    } else {
      // Fallback: download if browser doesn't allow clipboard image
      downloadBlobAsImage(blob, fileName);
      setStatusMessage(
        lang === 'bn'
          ? 'ক্লিপবোর্ড সাপোর্ট নেই, ছবিটি ডাউনলোড করা হয়েছে।'
          : 'Clipboard not supported. Image downloaded.'
      );
    }
  };

  // 3. Download Image file directly
  const handleDownloadOnly = () => {
    if (!blob) return;
    downloadBlobAsImage(blob, fileName);
    setStatusMessage(lang === 'bn' ? '✓ ছবিটি ডাউনলোড হয়েছে!' : '✓ Image downloaded!');
  };

  // 4. Mobile Native Share
  const handleMobileShare = async () => {
    if (!blob) return;
    const file = new File([blob], fileName, { type: 'image/png' });
    const ok = await shareFileNative(file, 'হিসাব কিতাব ভাউচার');
    if (ok) {
      setStatusMessage(lang === 'bn' ? '✓ শেয়ার উইন্ডো ওপেন হয়েছে!' : '✓ Shared successfully!');
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-emerald-700 text-white flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                {lang === 'bn' ? 'হোয়াটসঅ্যাপে ছবি আকারে ভাউচার পাঠান' : 'Share Voucher Image to WhatsApp'}
              </h3>
              <p className="text-[11px] text-emerald-100">
                {lang === 'bn' ? 'টেক্সট নয়, সরাসরি প্রফেশনাল ছবি (PNG) যাবে' : 'Sends as a high-res image, not text'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alert Feedback Banner */}
        {statusMessage && (
          <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/80 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* How it works guidance */}
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">
                {lang === 'bn' ? '💡 ছবি পাঠানোর সহজ উপায়:' : '💡 Easy steps to send image:'}
              </span>
              <p className="text-[11px] leading-relaxed">
                {lang === 'bn'
                  ? 'নিচের বড় সবুজ বাটনে ক্লিক করলেই ছবিটি সাথে সাথে কপি হয়ে হোয়াটসঅ্যাপ খুলে যাবে। হোয়াটসঅ্যাপে গিয়ে শুধু Ctrl + V চাপলেই ছবিটি চলে যাবে!'
                  : 'Click the green button below: it copies the image and opens WhatsApp. In WhatsApp, just press Ctrl + V to send the image!'}
              </p>
            </div>
          </div>

          {/* Recipient Phone input (optional) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপ মোবাইল নম্বর (ঐচ্ছিক):' : 'WhatsApp Phone Number (Optional):'}</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="+965... বা +880... (খালি রাখলে WhatsApp Web খুলবে)"
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Image Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold">{lang === 'bn' ? 'ভাউচার ছবির প্রিভিউ (HD 2x):' : 'Voucher Image Preview:'}</span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">PNG Format</span>
            </div>

            <div className="bg-slate-100 dark:bg-slate-950 p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[220px] max-h-[340px] overflow-auto">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-2 py-8 text-slate-500">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium">{lang === 'bn' ? 'ছবি তৈরি হচ্ছে...' : 'Generating image...'}</span>
                </div>
              ) : imgDataUrl ? (
                <img
                  src={imgDataUrl}
                  alt="Voucher Receipt"
                  className="max-w-full h-auto rounded-lg shadow-md border border-slate-200 dark:border-slate-700"
                  style={{ maxHeight: '310px', objectFit: 'contain' }}
                />
              ) : (
                <span className="text-xs text-rose-500">
                  {lang === 'bn' ? 'ছবি লোড করা যায়নি' : 'Failed to generate image'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {/* Main Primary Button: Copy Image & Open WhatsApp */}
          <button
            type="button"
            onClick={handleCopyAndOpenWhatsApp}
            disabled={isGenerating || !blob}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>
              {lang === 'bn'
                ? '📋 ছবি কপি করুন & হোয়াটসঅ্যাপে পেস্ট করতে খুলুন'
                : '📋 Copy Image & Open WhatsApp to Paste'}
            </span>
          </button>

          {/* Secondary Buttons Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Copy image button */}
            <button
              type="button"
              onClick={handleCopyImageOnly}
              disabled={isGenerating || !blob}
              className="flex-1 min-w-[130px] py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'ছবি কপি' : 'Copy Image')}</span>
            </button>

            {/* Download button */}
            <button
              type="button"
              onClick={handleDownloadOnly}
              disabled={isGenerating || !blob}
              className="flex-1 min-w-[130px] py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ছবি ডাউনলোড' : 'Download PNG'}</span>
            </button>

            {/* Mobile native share (if available) */}
            {canNativeShare && (
              <button
                type="button"
                onClick={handleMobileShare}
                disabled={isGenerating || !blob}
                className="flex-1 min-w-[130px] py-2 px-3 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'মোবাইলে শেয়ার' : 'Mobile Share'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
