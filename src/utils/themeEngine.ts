export const THEME_PREFS_STORAGE_KEY = 'hisab_kitab_theme_prefs_v1';
export const LEGACY_THEME_MODE_KEY = 'hisab_kitab_theme';

export type ThemeMode = 'light' | 'dark';

export interface ThemePreferences {
  mode: ThemeMode;
  brandColorId: string;
  customBrandHex: string;
  fontId: string;
  userName: string;
  profileTitle: string;
}

export type ShadeKey =
  | '50'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900'
  | '950';

export type BrandPalette = Record<ShadeKey, string>;

export interface BrandColorPreset {
  id: string;
  nameBn: string;
  nameEn: string;
  swatchHex: string;
  palette: BrandPalette;
}

export interface FontPreset {
  id: string;
  nameBn: string;
  nameEn: string;
  categoryBn: string;
  categoryEn: string;
  sampleBn: string;
  sampleEn: string;
  cssStack: string;
}

export const BRAND_COLOR_PRESETS: BrandColorPreset[] = [
  {
    id: 'emerald',
    nameBn: 'এমারেল্ড গ্রিন (ডিফল্ট)',
    nameEn: 'Emerald Classic',
    swatchHex: '#047857',
    palette: {
      '50': '#ecfdf5',
      '100': '#d1fae5',
      '200': '#a7f3d0',
      '300': '#6ee7b7',
      '400': '#34d399',
      '500': '#10b981',
      '600': '#059669',
      '700': '#047857',
      '800': '#065f46',
      '900': '#064e3b',
      '950': '#022c22',
    },
  },
  {
    id: 'blue',
    nameBn: 'রয়্যাল ব্লু',
    nameEn: 'Royal Blue',
    swatchHex: '#1d4ed8',
    palette: {
      '50': '#eff6ff',
      '100': '#dbeafe',
      '200': '#bfdbfe',
      '300': '#93c5fd',
      '400': '#60a5fa',
      '500': '#3b82f6',
      '600': '#2563eb',
      '700': '#1d4ed8',
      '800': '#1e40af',
      '900': '#1e3a8a',
      '950': '#172554',
    },
  },
  {
    id: 'indigo',
    nameBn: 'ইন্ডিগো প্রো',
    nameEn: 'Indigo Pro',
    swatchHex: '#4338ca',
    palette: {
      '50': '#eef2ff',
      '100': '#e0e7ff',
      '200': '#c7d2fe',
      '300': '#a5b4fc',
      '400': '#818cf8',
      '500': '#6366f1',
      '600': '#4f46e5',
      '700': '#4338ca',
      '800': '#3730a3',
      '900': '#312e81',
      '950': '#1e1b4b',
    },
  },
  {
    id: 'violet',
    nameBn: 'ভায়োলেট লাক্স',
    nameEn: 'Amethyst Violet',
    swatchHex: '#6d28d9',
    palette: {
      '50': '#f5f3ff',
      '100': '#ede9fe',
      '200': '#ddd6fe',
      '300': '#c4b5fd',
      '400': '#a78bfa',
      '500': '#8b5cf6',
      '600': '#7c3aed',
      '700': '#6d28d9',
      '800': '#5b21b6',
      '900': '#4c1d95',
      '950': '#2e1065',
    },
  },
  {
    id: 'teal',
    nameBn: 'ওশান টিল',
    nameEn: 'Ocean Teal',
    swatchHex: '#0f766e',
    palette: {
      '50': '#f0fdfa',
      '100': '#ccfbf1',
      '200': '#99f6e4',
      '300': '#5eead4',
      '400': '#2dd4bf',
      '500': '#14b8a6',
      '600': '#0d9488',
      '700': '#0f766e',
      '800': '#115e59',
      '900': '#134e4a',
      '950': '#042f2e',
    },
  },
  {
    id: 'rose',
    nameBn: 'ক্রিমসন রোজ',
    nameEn: 'Crimson Rose',
    swatchHex: '#be123c',
    palette: {
      '50': '#fff1f2',
      '100': '#ffe4e6',
      '200': '#fecdd3',
      '300': '#fda4af',
      '400': '#fb7185',
      '500': '#f43f5e',
      '600': '#e11d48',
      '700': '#be123c',
      '800': '#9f1239',
      '900': '#881337',
      '950': '#4c0519',
    },
  },
  {
    id: 'amber',
    nameBn: 'গোল্ডেন অ্যাম্বার',
    nameEn: 'Golden Amber',
    swatchHex: '#b45309',
    palette: {
      '50': '#fffbeb',
      '100': '#fef3c7',
      '200': '#fde68a',
      '300': '#fcd34d',
      '400': '#fbbf24',
      '500': '#f59e0b',
      '600': '#d97706',
      '700': '#b45309',
      '800': '#92400e',
      '900': '#78350f',
      '950': '#451a03',
    },
  },
  {
    id: 'slate',
    nameBn: 'চারকোল স্লেট',
    nameEn: 'Charcoal Slate',
    swatchHex: '#334155',
    palette: {
      '50': '#f8fafc',
      '100': '#f1f5f9',
      '200': '#e2e8f0',
      '300': '#cbd5e1',
      '400': '#94a3b8',
      '500': '#64748b',
      '600': '#475569',
      '700': '#334155',
      '800': '#1e293b',
      '900': '#0f172a',
      '950': '#020617',
    },
  },
];

export const FONT_PRESETS: FontPreset[] = [
  {
    id: 'hind-siliguri',
    nameBn: 'হিন্দ শিলিগুড়ি (ডিফল্ট)',
    nameEn: 'Hind Siliguri (Default)',
    categoryBn: 'আধুনিক ও পরিচ্ছন্ন বাংলা',
    categoryEn: 'Clean Modern Bangla',
    sampleBn: 'হিসাব কিতাব • ১২,৫০০ টাকা',
    sampleEn: 'Hisab Kitab • 12,500 KWD',
    cssStack: "'Hind Siliguri', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  },
  {
    id: 'noto-sans-bengali',
    nameBn: 'নোটো স্যান্স বেঙ্গলি',
    nameEn: 'Noto Sans Bengali',
    categoryBn: 'স্ট্যান্ডার্ড প্রো ফন্ট',
    categoryEn: 'Standard Google Bangla',
    sampleBn: 'হিসাব কিতাব • ১২,৫০০ টাকা',
    sampleEn: 'Hisab Kitab • 12,500 KWD',
    cssStack: "'Noto Sans Bengali', 'Inter', system-ui, -apple-system, sans-serif",
  },
  {
    id: 'baloo-da-2',
    nameBn: 'বালু দা ২',
    nameEn: 'Baloo Da 2',
    categoryBn: 'রাউন্ডেড ও সফট লুক',
    categoryEn: 'Rounded Friendly UI',
    sampleBn: 'হিসাব কিতাব • ১২,৫০০ টাকা',
    sampleEn: 'Hisab Kitab • 12,500 KWD',
    cssStack: "'Baloo Da 2', 'Poppins', system-ui, -apple-system, sans-serif",
  },
  {
    id: 'anek-bangla',
    nameBn: 'অনেক বাংলা',
    nameEn: 'Anek Bangla',
    categoryBn: 'শার্প কর্পোরেট স্টাইল',
    categoryEn: 'Sharp Corporate Feel',
    sampleBn: 'হিসাব কিতাব • ১২,৫০০ টাকা',
    sampleEn: 'Hisab Kitab • 12,500 KWD',
    cssStack: "'Anek Bangla', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  },
  {
    id: 'tiro-bangla',
    nameBn: 'তিরো বাংলা (ক্লাসিক)',
    nameEn: 'Tiro Bangla (Classic)',
    categoryBn: 'প্রথাগত সেরিফ লেজার',
    categoryEn: 'Classic Editorial Serif',
    sampleBn: 'হিসাব কিতাব • ১২,৫০০ টাকা',
    sampleEn: 'Hisab Kitab • 12,500 KWD',
    cssStack: "'Tiro Bangla', 'Plus Jakarta Sans', Georgia, serif",
  },
  {
    id: 'plus-jakarta',
    nameBn: 'প্লাস জাকার্তা স্যান্স',
    nameEn: 'Plus Jakarta Sans',
    categoryBn: 'প্রিমিয়াম ফিনটেক লুক',
    categoryEn: 'Fintech Geometric UI',
    sampleBn: 'হিসাব কিতাব • ১২,৫০০ টাকা',
    sampleEn: 'Hisab Kitab • 12,500 KWD',
    cssStack: "'Plus Jakarta Sans', 'Hind Siliguri', system-ui, sans-serif",
  },
  {
    id: 'poppins',
    nameBn: 'পপিন্স',
    nameEn: 'Poppins',
    categoryBn: 'স্মুথ ড্যাশবোর্ড স্টাইল',
    categoryEn: 'Smooth Modern UI',
    sampleBn: 'হিসাব কিতাব • ১২,৫০০ টাকা',
    sampleEn: 'Hisab Kitab • 12,500 KWD',
    cssStack: "'Poppins', 'Hind Siliguri', system-ui, sans-serif",
  },
  {
    id: 'inter',
    nameBn: 'ইন্টার সিস্টেম',
    nameEn: 'Inter Minimal',
    categoryBn: 'মিনিমাল প্রফেশনাল',
    categoryEn: 'Crisp Minimal UI',
    sampleBn: 'হিসাব কিতাব • ১২,৫০০ টাকা',
    sampleEn: 'Hisab Kitab • 12,500 KWD',
    cssStack: "'Inter', 'Noto Sans Bengali', system-ui, sans-serif",
  },
];

export const DEFAULT_THEME_PREFS: ThemePreferences = {
  mode: 'light',
  brandColorId: 'emerald',
  customBrandHex: '#047857',
  fontId: 'hind-siliguri',
  userName: '',
  profileTitle: '',
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function mixHex(hexA: string, hexB: string, weightB: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return hexA;
  const w = Math.max(0, Math.min(1, weightB));
  const r = Math.round(a.r * (1 - w) + b.r * w);
  const g = Math.round(a.g * (1 - w) + b.g * w);
  const bl = Math.round(a.b * (1 - w) + b.b * w);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl
    .toString(16)
    .padStart(2, '0')}`;
}

/**
 * Generates a balanced 11-step Tailwind palette from any chosen custom hex color
 * by blending toward clean white for light tints and deep charcoal for dark shades.
 */
export function generatePaletteFromHex(baseHex: string): BrandPalette {
  const normalized = /^#[0-9a-fA-F]{6}$/.test(baseHex) ? baseHex : '#047857';
  return {
    '50': mixHex(normalized, '#ffffff', 0.92),
    '100': mixHex(normalized, '#ffffff', 0.84),
    '200': mixHex(normalized, '#ffffff', 0.68),
    '300': mixHex(normalized, '#ffffff', 0.48),
    '400': mixHex(normalized, '#ffffff', 0.25),
    '500': mixHex(normalized, '#ffffff', 0.08),
    '600': normalized,
    '700': mixHex(normalized, '#0f172a', 0.16),
    '800': mixHex(normalized, '#0f172a', 0.34),
    '900': mixHex(normalized, '#090d16', 0.52),
    '950': mixHex(normalized, '#020617', 0.72),
  };
}

export function resolvePalette(prefs: ThemePreferences): BrandPalette {
  if (prefs.brandColorId === 'custom') {
    return generatePaletteFromHex(prefs.customBrandHex);
  }
  const preset = BRAND_COLOR_PRESETS.find((p) => p.id === prefs.brandColorId);
  return preset ? preset.palette : BRAND_COLOR_PRESETS[0].palette;
}

export function loadThemePreferences(): ThemePreferences {
  const legacyMode =
    (localStorage.getItem(LEGACY_THEME_MODE_KEY) as ThemeMode) === 'dark' ? 'dark' : 'light';

  try {
    const raw = localStorage.getItem(THEME_PREFS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_THEME_PREFS, mode: legacyMode };
    }
    const parsed = JSON.parse(raw) as Partial<ThemePreferences>;
    return {
      mode: parsed.mode === 'dark' ? 'dark' : 'light',
      brandColorId:
        typeof parsed.brandColorId === 'string' ? parsed.brandColorId : DEFAULT_THEME_PREFS.brandColorId,
      customBrandHex:
        typeof parsed.customBrandHex === 'string' && /^#[0-9a-fA-F]{6}$/.test(parsed.customBrandHex)
          ? parsed.customBrandHex
          : DEFAULT_THEME_PREFS.customBrandHex,
      fontId:
        FONT_PRESETS.some((f) => f.id === parsed.fontId) && parsed.fontId
          ? parsed.fontId
          : DEFAULT_THEME_PREFS.fontId,
      userName:
        typeof parsed.userName === 'string' ? parsed.userName : DEFAULT_THEME_PREFS.userName,
      profileTitle:
        typeof parsed.profileTitle === 'string' ? parsed.profileTitle : DEFAULT_THEME_PREFS.profileTitle,
    };
  } catch {
    return { ...DEFAULT_THEME_PREFS, mode: legacyMode };
  }
}

export function saveThemePreferences(prefs: ThemePreferences): void {
  try {
    localStorage.setItem(THEME_PREFS_STORAGE_KEY, JSON.stringify(prefs));
    localStorage.setItem(LEGACY_THEME_MODE_KEY, prefs.mode);
  } catch (err) {
    console.error('Failed to save theme preferences:', err);
  }
}

export function applyThemePreferences(prefs: ThemePreferences): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // 1. Dark / Light mode class
  if (prefs.mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // 2. Font family CSS variable
  const fontPreset = FONT_PRESETS.find((f) => f.id === prefs.fontId) || FONT_PRESETS[0];
  root.style.setProperty('--font-sans', fontPreset.cssStack);

  // 3. Brand palette override across Tailwind v4 --color-emerald-* tokens
  const palette = resolvePalette(prefs);
  (Object.keys(palette) as ShadeKey[]).forEach((shade) => {
    root.style.setProperty(`--color-emerald-${shade}`, palette[shade]);
  });
  root.style.setProperty('--brand-primary', palette['700']);

  // 4. Sync browser address bar theme-color meta tag
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', palette['700']);
  }
}
