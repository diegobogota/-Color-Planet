import { HSL, RGB, CMYK, ColorDetailsData } from './types';

// HSL to RGB conversion
export function hslToRgb(h: number, s: number, l: number): RGB {
  h = (h % 360 + 360) % 360;
  const sFrac = s / 100;
  const lFrac = l / 100;

  const c = (1 - Math.abs(2 * lFrac - 1)) * sFrac;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lFrac - c / 2;

  let rPrime = 0, gPrime = 0, bPrime = 0;

  if (h >= 0 && h < 60) {
    rPrime = c; gPrime = x; bPrime = 0;
  } else if (h >= 60 && h < 120) {
    rPrime = x; gPrime = c; bPrime = 0;
  } else if (h >= 120 && h < 180) {
    rPrime = 0; gPrime = c; bPrime = x;
  } else if (h >= 180 && h < 240) {
    rPrime = 0; gPrime = x; bPrime = c;
  } else if (h >= 240 && h < 300) {
    rPrime = x; gPrime = 0; bPrime = c;
  } else if (h >= 300 && h < 360) {
    rPrime = c; gPrime = 0; bPrime = x;
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  };
}

// RGB to HEX conversion
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, c)).toString(16);
    return hex.length === 1 ? '0' : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// RGB to CMYK conversion
export function rgbToCmyk(r: number, g: number, b: number): CMYK {
  const rFrac = r / 255;
  const gFrac = g / 255;
  const bFrac = b / 255;

  const kFrac = 1 - Math.max(rFrac, gFrac, bFrac);
  
  if (kFrac === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const cFrac = (1 - rFrac - kFrac) / (1 - kFrac);
  const mFrac = (1 - gFrac - kFrac) / (1 - kFrac);
  const yFrac = (1 - bFrac - kFrac) / (1 - kFrac);

  return {
    c: Math.round(cFrac * 100),
    m: Math.round(mFrac * 100),
    y: Math.round(yFrac * 100),
    k: Math.round(kFrac * 100),
  };
}

// Convert HEX back to HSL (helpful for palette loads)
export function hexToHsl(hex: string): HSL {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Approximate Spanish name for a color in HSL
export function getColorNameAndCategory(h: number, s: number, l: number): { name: string; category: string } {
  // Center check (black core)
  if (l <= 8) {
    return { name: 'Negro Núcleo Profundo', category: 'Núcleo Oscuro (Acromático)' };
  }
  
  // Outer layer check (white atmosphere)
  if (l >= 94) {
    return { name: 'Blanco Atmosférico', category: 'Atmósfera Externa (Acromático)' };
  }

  // Low saturation (Grayscale / Neutral)
  if (s <= 10) {
    if (l < 30) return { name: 'Gris Carbón Neutro', category: 'Neutros' };
    if (l < 55) return { name: 'Gris Mineral Medio', category: 'Neutros' };
    if (l < 75) return { name: 'Gris Platino', category: 'Neutros' };
    return { name: 'Blanco Alabastro / Nebuloso', category: 'Atmósfera Externa (Acromático)' };
  }

  // Pure categories with descriptions
  if (h >= 345 || h < 15) { // Red
    if (l < 35) return { name: 'Rojo Borgoña / Caoba', category: 'Cálido - Rojos' };
    if (l > 70) return { name: 'Rosa Melocotón Pálido', category: 'Cálido - Rosados' };
    if (s > 80 && l >= 45 && l <= 55) return { name: 'Rojo Carmesí Puro', category: 'Cálido - Rojos' };
    return { name: 'Rojo Bermellón Suave', category: 'Cálido - Rojos' };
  }

  if (h >= 15 && h < 45) { // Orange
    if (l < 35) return { name: 'Marrón Óxido / Chocolate', category: 'Cálido - Marrones' };
    if (l > 70) return { name: 'Crema Ámbar Pálido', category: 'Cálido - Anaranjados' };
    return { name: 'Naranja Cobre / Ámbar', category: 'Cálido - Anaranjados' };
  }

  if (h >= 45 && h < 75) { // Yellow
    if (l < 35) return { name: 'Amarillo Oliva / Umbría', category: 'Cálido - Terrosos' };
    if (l > 70) return { name: 'Amarillo Vainilla / Crema', category: 'Cálido - Amarillos' };
    return { name: 'Amarillo Dorado / Girasol', category: 'Cálido - Amarillos' };
  }

  if (h >= 75 && h < 115) { // Lime
    if (l < 35) return { name: 'Verde Oliva Oscuro', category: 'Fresco - Verdes' };
    if (l > 70) return { name: 'Verde Lima Translúcido', category: 'Fresco - Verdes' };
    return { name: 'Verde Kiwi / Ácido', category: 'Fresco - Verdes' };
  }

  if (h >= 115 && h < 165) { // Green
    if (l < 35) return { name: 'Verde Bosque Profundo', category: 'Frío - Verdes' };
    if (l > 70) return { name: 'Verde Menta Pálido', category: 'Frío - Verdes' };
    return { name: 'Verde Esmeralda Vibrante', category: 'Frío - Verdes' };
  }

  if (h >= 165 && h < 195) { // Cyan/Teal
    if (l < 35) return { name: 'Verde Pino / Petróleo', category: 'Frío - Turquesas' };
    if (l > 70) return { name: 'Aguamarina Suave', category: 'Frío - Turquesas' };
    return { name: 'Azul Turquesa Helado', category: 'Frío - Turquesas' };
  }

  if (h >= 195 && h < 225) { // Sky Blue
    if (l < 35) return { name: 'Azul Abismo / Marino', category: 'Frío - Azules' };
    if (l > 70) return { name: 'Azul Celeste Cristalino', category: 'Frío - Azules' };
    return { name: 'Azul Turquesa Glaciar', category: 'Frío - Azules' };
  }

  if (h >= 225 && h < 255) { // Blue
    if (l < 35) return { name: 'Azul Ultramar Oscuro', category: 'Frío - Azules' };
    if (l > 70) return { name: 'Azul Lavanda Pálido', category: 'Frío - Azules' };
    if (s > 80) return { name: 'Azul Cobalto Eléctrico', category: 'Frío - Azules' };
    return { name: 'Azul Índigo Sutil', category: 'Frío - Azules' };
  }

  if (h >= 255 && h < 285) { // Violet/Purple
    if (l < 35) return { name: 'Morado Berenjena Profunda', category: 'Fresco - Violetas' };
    if (l > 70) return { name: 'Violeta Lavanda Suave', category: 'Fresco - Violetas' };
    return { name: 'Morado Amatista', category: 'Fresco - Violetas' };
  }

  if (h >= 285 && h < 315) { // Magenta / Orchid
    if (l < 35) return { name: 'Morado Ciruela Oscuro', category: 'Fresco - Magentas' };
    if (l > 70) return { name: 'Púrpura Orquídea Pastel', category: 'Fresco - Magentas' };
    return { name: 'Orquídea Magenta Vibrante', category: 'Fresco - Magentas' };
  }

  // 315 to 345 Pink/Crimson
  if (l < 35) return { name: 'Rojo Vino Tinto', category: 'Cálido - Rosados' };
  if (l > 70) return { name: 'Rosa Chicle Pastel', category: 'Cálido - Rosados' };
  return { name: 'Rosa Fucsia Brillante', category: 'Cálido - Rosados' };
}

// Calculate Relative Luminance for WCAG Contrast
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const rs = r / 255;
  const gs = g / 255;
  const bs = b / 255;

  const rLin = rs <= 0.04045 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
  const gLin = gs <= 0.04045 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
  const bLin = bs <= 0.04045 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

// Calculate Contrast Ratio
export function getContrastRatio(l1: number, l2: number): number {
  const bright = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (bright + 0.05) / (dark + 0.05);
}

// Generate technical details of any selected HSL
export function getColorDetails(h: number, s: number, l: number): ColorDetailsData {
  const rgb = hslToRgb(h, s, l);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
  const { name, category } = getColorNameAndCategory(h, s, l);

  return {
    hex,
    hsl: { h, s, l },
    rgb,
    cmyk,
    name,
    category
  };
}

// Harmony Generator
export function getColorHarmonies(hsl: HSL): {
  complementary: ColorDetailsData;
  analogousLeft: ColorDetailsData;
  analogousRight: ColorDetailsData;
  triadicLeft: ColorDetailsData;
  triadicRight: ColorDetailsData;
  monochromaticArray: ColorDetailsData[];
} {
  const { h, s, l } = hsl;

  // Monochromatic track (showing the same ray transition! from center (dark) to outer white)
  // Let's take steps of 15% in luminance to showcase the exact tonal transition!
  const monoLuminances = [15, 30, 45, 60, 75, 90];
  const monochromaticArray = monoLuminances.map(monoL => {
    // Keep saturation decay consistent with location: S decays as L increases
    // S_decay = 100 - L
    const monoS = Math.max(0, 100 - monoL);
    return getColorDetails(h, monoS, monoL);
  });

  return {
    complementary: getColorDetails((h + 180) % 360, s, l),
    analogousLeft: getColorDetails((h - 30 + 360) % 360, s, l),
    analogousRight: getColorDetails((h + 30) % 360, s, l),
    triadicLeft: getColorDetails((h - 120 + 360) % 360, s, l),
    triadicRight: getColorDetails((h + 120) % 360, s, l),
    monochromaticArray
  };
}
