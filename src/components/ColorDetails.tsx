import { useState } from 'react';
import { Point3D, ColorDetailsData } from '../types';
import { getColorDetails, getColorHarmonies, getRelativeLuminance, getContrastRatio } from '../colorUtils';
import { translations } from '../translations';
import { Copy, Check, Heart, Info, Zap, BarChart2, Hash, RefreshCcw } from 'lucide-react';

interface ColorDetailsProps {
  selectedPoint: Point3D | null;
  onColorSelect: (h: number, s: number, l: number) => void;
  onSaveToPalette: (color: ColorDetailsData) => void;
  lang: 'es' | 'en';
}

export default function ColorDetails({
  selectedPoint,
  onColorSelect,
  onSaveToPalette,
  lang
}: ColorDetailsProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const t = translations[lang];

  // Compute full specifications for the current point
  const details: ColorDetailsData | null = selectedPoint
    ? getColorDetails(selectedPoint.hsl.h, selectedPoint.hsl.s, selectedPoint.hsl.l)
    : null;

  // Compute color harmonies
  const harmonies = details ? getColorHarmonies(details.hsl) : null;

  // Copy to clipboard handler
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 1800);
      })
      .catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 1800);
      });
  };

  if (!details || !harmonies) {
    return (
      <div className="bg-zinc-950 rounded-2xl border border-zinc-90 w-full p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-800">
          <Zap className="w-6 h-6 text-zinc-500 animate-pulse" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-300">{t.noColorSelected}</h3>
        <p className="text-xs text-zinc-500 mt-2 max-w-[240px] leading-relaxed">
          {t.noColorSelectedSub}
        </p>
      </div>
    );
  }

  // Calculate contrast ratios
  const colorLuminance = getRelativeLuminance(details.rgb.r, details.rgb.g, details.rgb.b);
  const contrastWithWhite = getContrastRatio(colorLuminance, 1.0); // white is 1.0
  const contrastWithBlack = getContrastRatio(colorLuminance, 0.0); // black is 0.0

  // WCAG criteria check (4.5 for Normal Text AA, 7.0 for Enhanced AAA)
  const isAALight = contrastWithWhite >= 4.5;
  const isAALightLarge = contrastWithWhite >= 3.0;
  const isAADark = contrastWithBlack >= 4.5;
  const isAADarkLarge = contrastWithBlack >= 3.0;

  // Render original name if in Spanish or translate category names roughly
  const displayedCategoryName = lang === 'es' ? details.category : details.category
    .replace('Rojo', 'Red')
    .replace('Naranja', 'Orange')
    .replace('Amarillo', 'Yellow')
    .replace('Verde', 'Green')
    .replace('Cian', 'Cyan')
    .replace('Azul', 'Blue')
    .replace('Magenta', 'Magenta')
    .replace('Gris', 'Gray')
    .replace('Espectro', 'Spectrum');

  const displayedColorName = lang === 'es' ? details.name : details.name
    .replace('Rojo', 'Red')
    .replace('Carmesí', 'Crimson')
    .replace('Rosado', 'Pink')
    .replace('Naranja', 'Orange')
    .replace('Ocre', 'Ochre')
    .replace('Ámbar', 'Amber')
    .replace('Amarillo', 'Yellow')
    .replace('Limón', 'Lemon')
    .replace('Lima', 'Lime')
    .replace('Verde', 'Green')
    .replace('Bosque', 'Forest')
    .replace('Esmeralda', 'Emerald')
    .replace('Menta', 'Mint')
    .replace('Aguamarina', 'Aquamarine')
    .replace('Cian', 'Cyan')
    .replace('Celeste', 'Sky Blue')
    .replace('Turquesa', 'Turquoise')
    .replace('Azul', 'Blue')
    .replace('Marino', 'Navy')
    .replace('Cobalto', 'Cobalt')
    .replace('Indigo', 'Indigo')
    .replace('Violeta', 'Violet')
    .replace('Púrpura', 'Purple')
    .replace('Magenta', 'Magenta')
    .replace('Fucsia', 'Fuchsia')
    .replace('Gris', 'Gray')
    .replace('Plata', 'Silver')
    .replace('Pizarra', 'Slate')
    .replace('Oscuro', 'Dark')
    .replace('Brillante', 'Bright')
    .replace('Pálido', 'Pale')
    .replace('Pastel', 'Pastel')
    .replace('Profundo', 'Deep')
    .replace('Luminoso', 'Luminous')
    .replace('Cálido', 'Warm')
    .replace('Eléctrico', 'Electric')
    .replace('Encendido', 'Vibrant')
    .replace('Suave', 'Soft');

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-zinc-300 font-sans" id="color-details-panel">
      
      {/* 1. Main Preview Box */}
      <div className="relative rounded-2xl overflow-hidden border border-zinc-850 bg-zinc-950 p-5 flex flex-col items-center text-center">
        {/* Large Color Circle preview with HSL coordinates */}
        <div 
          className="relative group w-32 h-32 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex-shrink-0 transition-transform duration-300 hover:scale-105" 
          style={{ backgroundColor: details.hex }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
          {/* Subtle gloss element */}
          <div className="absolute top-1 left-1 right-1 h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-lg"></div>
        </div>

        {/* Name and Basic Specs */}
        <div className="mt-4 min-w-0 w-full">
          <span className="inline-block text-[10px] font-mono font-bold tracking-widest uppercase px-3 py-1 bg-zinc-900 text-emerald-400 rounded-full border border-zinc-800 mb-2">
            {displayedCategoryName}
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight truncate px-2" title={displayedColorName}>
            {displayedColorName}
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            {t.radialLocation}: <span className="text-zinc-300 font-mono">r = {(details.hsl.l / 100).toFixed(2)}</span>
          </p>

          <div className="flex justify-center mt-3">
            <button
              onClick={() => onSaveToPalette(details)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-xs font-bold text-zinc-950 rounded-lg transition shadow-lg shadow-emerald-500/10 cursor-pointer"
              id="btn-save-harmony"
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              {t.saveToPalette}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Format Value Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* HEX */}
        <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-3 flex flex-col justify-between group relative overflow-hidden transition-colors hover:border-zinc-800">
          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{t.hexadecimal}</div>
          <div className="text-xs font-mono font-bold mt-2 text-white flex items-center justify-between">
            <span>{details.hex}</span>
            <button
              onClick={() => handleCopy(details.hex, 'hex')}
              className="p-1 hover:bg-zinc-900 rounded text-zinc-400 hover:text-white transition"
              title="Copy HEX"
              id="copy-hex"
            >
              {copiedKey === 'hex' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* HSL */}
        <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-3 flex flex-col justify-between group relative overflow-hidden transition-colors hover:border-zinc-800">
          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{t.hslSteps}</div>
          <div className="text-xs font-mono font-bold mt-2 text-white flex items-center justify-between">
            <span>{details.hsl.h}°, {details.hsl.s}%, {details.hsl.l}%</span>
            <button
              onClick={() => handleCopy(`hsl(${details.hsl.h}, ${details.hsl.s}%, ${details.hsl.l}%)`, 'hsl')}
              className="p-1 hover:bg-zinc-900 rounded text-zinc-400 hover:text-white transition"
              title="Copy HSL"
              id="copy-hsl"
            >
              {copiedKey === 'hsl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* RGB */}
        <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-3 flex flex-col justify-between group relative overflow-hidden transition-colors hover:border-zinc-800">
          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{t.rgbScale}</div>
          <div className="text-xs font-mono font-bold mt-2 text-white flex items-center justify-between">
            <span>{details.rgb.r}, {details.rgb.g}, {details.rgb.b}</span>
            <button
              onClick={() => handleCopy(`rgb(${details.rgb.r}, ${details.rgb.g}, ${details.rgb.b})`, 'rgb')}
              className="p-1 hover:bg-zinc-900 rounded text-zinc-400 hover:text-white transition"
              title="Copy RGB"
              id="copy-rgb"
            >
              {copiedKey === 'rgb' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* CMYK */}
        <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-3 flex flex-col justify-between group relative overflow-hidden transition-colors hover:border-zinc-800">
          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{t.cmykScale}</div>
          <div className="text-xs font-mono font-bold mt-2 text-white flex items-center justify-between">
            <span>C:{details.cmyk.c}% M:{details.cmyk.m}% Y:{details.cmyk.y}% K:{details.cmyk.k}%</span>
            <button
              onClick={() => handleCopy(`cmyk(${details.cmyk.c}%, ${details.cmyk.m}%, ${details.cmyk.y}%, ${details.cmyk.k}%)`, 'cmyk')}
              className="p-1 hover:bg-zinc-900 rounded text-zinc-400 hover:text-white transition"
              title="Copy CMYK"
              id="copy-cmyk"
            >
              {copiedKey === 'cmyk' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. WCAG Accessibility check */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
          <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
            {t.contrastTitle}
          </span>
          <span className="text-[9px] font-mono text-zinc-500">
            {t.luminosity}: {colorLuminance.toFixed(3)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Contrast with White */}
          <div className="flex flex-col gap-2 p-2 bg-black rounded-lg border border-zinc-900/60">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-zinc-500 font-mono leading-none">{t.textWhite}</span>
              <span className="text-xs font-bold font-mono text-zinc-200">{contrastWithWhite.toFixed(1)}:1</span>
            </div>
            
            <div className="flex flex-wrap gap-1">
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded leading-none font-mono ${isAALight ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500/70 border border-red-500/10'}`}>
                {t.normalText} {isAALight ? t.passed : t.failed}
              </span>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded leading-none font-mono ${isAALightLarge ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500/70 border border-red-500/10'}`}>
                {t.largeText} {isAALightLarge ? t.passed : t.failed}
              </span>
            </div>
            
            <div className="h-8 rounded flex items-center justify-center border font-sans text-xs font-semibold" style={{ backgroundColor: '#ffffff', color: details.hex, borderColor: 'rgba(255,255,255,0.1)' }}>
              Aa text
            </div>
          </div>

          {/* Contrast with Black */}
          <div className="flex flex-col gap-2 p-2 bg-black rounded-lg border border-zinc-900/60">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-zinc-500 font-mono leading-none">{t.textBlack}</span>
              <span className="text-xs font-bold font-mono text-zinc-200">{contrastWithBlack.toFixed(1)}:1</span>
            </div>
            
            <div className="flex flex-wrap gap-1">
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded leading-none font-mono ${isAADark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500/70 border border-red-500/10'}`}>
                {t.normalText} {isAADark ? t.passed : t.failed}
              </span>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded leading-none font-mono ${isAADarkLarge ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500/70 border border-red-500/10'}`}>
                {t.largeText} {isAADarkLarge ? t.passed : t.failed}
              </span>
            </div>

            <div className="h-8 rounded flex items-center justify-center border font-sans text-xs font-semibold" style={{ backgroundColor: '#000000', color: details.hex, borderColor: 'rgba(255,255,255,0.1)' }}>
              Aa text
            </div>
          </div>
        </div>
      </div>

      {/* 4. Sphere Location Details */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col gap-2.5">
        <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 font-mono uppercase tracking-wider">
          <Info className="w-3.5 h-3.5 text-emerald-400" />
          {t.sphereCoords}
        </span>
        <div className="text-xs text-zinc-400 space-y-1.5">
          <div className="flex justify-between items-center bg-black/60 px-3 py-1.5 rounded border border-zinc-900/50">
            <span>{t.cellLuminance}:</span>
            <span className="font-mono text-emerald-400 font-semibold">{t.layer} {details.hsl.l / 5} (L: {details.hsl.l}%)</span>
          </div>
          <div className="flex justify-between items-center bg-black/60 px-3 py-1.5 rounded border border-zinc-900/50">
            <span>{t.rayHue}:</span>
            <span className="font-mono text-emerald-400 font-semibold">H: {details.hsl.h}° ({t.anglePhi})</span>
          </div>
          <div className="flex justify-between items-center bg-black/60 px-3 py-1.5 rounded border border-zinc-900/50">
            <span>{t.decayRadialStat}:</span>
            <span className="font-mono text-emerald-400 font-semibold">S: {details.hsl.s}% (-{(100 - details.hsl.s)}% {t.decayDrop})</span>
          </div>
        </div>
      </div>

      {/* 5. Harmonious Color Combinations */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col gap-4">
        <span className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">
          {t.harmoniesTitle}
        </span>

        {/* Harmonies Circles */}
        <div className="grid grid-cols-2 gap-3">
          {/* Complementary */}
          <button
            onClick={() => onColorSelect(harmonies.complementary.hsl.h, harmonies.complementary.hsl.s, harmonies.complementary.hsl.l)}
            className="flex flex-col items-center gap-2 group p-3 bg-zinc-900/30 hover:bg-zinc-900/80 rounded-xl transition border border-zinc-900 hover:border-zinc-800 hover:scale-[1.02]"
            title={lang === "es" ? "Ver color complementario" : "View complementary color"}
            id="complementary-harmony"
          >
            <div className="w-10 h-10 rounded-full shadow-lg border border-white/10 cursor-pointer flex-shrink-0" style={{ backgroundColor: harmonies.complementary.hex }}></div>
            <div className="text-[10px] font-bold text-zinc-400 group-hover:text-emerald-400 transition text-center min-w-0 w-full truncate">
              {t.complementary}
            </div>
            <div className="text-[9px] font-mono text-zinc-500 leading-none">{harmonies.complementary.hex}</div>
          </button>

          {/* Analogous Left */}
          <button
            onClick={() => onColorSelect(harmonies.analogousLeft.hsl.h, harmonies.analogousLeft.hsl.s, harmonies.analogousLeft.hsl.l)}
            className="flex flex-col items-center gap-2 group p-3 bg-zinc-900/30 hover:bg-zinc-900/80 rounded-xl transition border border-zinc-900 hover:border-zinc-800 hover:scale-[1.02]"
            title={lang === "es" ? "Ver color análogo" : "View analogous color"}
            id="analogous-left-harmony"
          >
            <div className="w-10 h-10 rounded-full shadow-lg border border-white/10 cursor-pointer flex-shrink-0" style={{ backgroundColor: harmonies.analogousLeft.hex }}></div>
            <div className="text-[10px] font-bold text-zinc-400 group-hover:text-emerald-400 transition text-center min-w-0 w-full truncate">
              {t.analogousL}
            </div>
            <div className="text-[9px] font-mono text-zinc-500 leading-none">{harmonies.analogousLeft.hex}</div>
          </button>

          {/* Analogous Right */}
          <button
            onClick={() => onColorSelect(harmonies.analogousRight.hsl.h, harmonies.analogousRight.hsl.s, harmonies.analogousRight.hsl.l)}
            className="flex flex-col items-center gap-2 group p-3 bg-zinc-900/30 hover:bg-zinc-900/80 rounded-xl transition border border-zinc-900 hover:border-zinc-800 hover:scale-[1.02]"
            title={lang === "es" ? "Ver color análogo" : "View analogous color"}
            id="analogous-right-harmony"
          >
            <div className="w-10 h-10 rounded-full shadow-lg border border-white/10 cursor-pointer flex-shrink-0" style={{ backgroundColor: harmonies.analogousRight.hex }}></div>
            <div className="text-[10px] font-bold text-zinc-400 group-hover:text-emerald-400 transition text-center min-w-0 w-full truncate">
              {t.analogousR}
            </div>
            <div className="text-[9px] font-mono text-zinc-500 leading-none">{harmonies.analogousRight.hex}</div>
          </button>

          {/* Triadic Left */}
          <button
            onClick={() => onColorSelect(harmonies.triadicLeft.hsl.h, harmonies.triadicLeft.hsl.s, harmonies.triadicLeft.hsl.l)}
            className="flex flex-col items-center gap-2 group p-3 bg-zinc-900/30 hover:bg-zinc-900/80 rounded-xl transition border border-zinc-900 hover:border-zinc-800 hover:scale-[1.02]"
            title={lang === "es" ? "Ver color triádico" : "View triadic color"}
            id="triadic-left-harmony"
          >
            <div className="w-10 h-10 rounded-full shadow-lg border border-white/10 cursor-pointer flex-shrink-0" style={{ backgroundColor: harmonies.triadicLeft.hex }}></div>
            <div className="text-[10px] font-bold text-zinc-400 group-hover:text-emerald-400 transition text-center min-w-0 w-full truncate">
              {t.triadic}
            </div>
            <div className="text-[9px] font-mono text-zinc-500 leading-none">{harmonies.triadicLeft.hex}</div>
          </button>
        </div>

        {/* 6. Monochromatic Ray Progression */}
        <div className="flex flex-col gap-2 mt-2">
          <span className="text-[10px] font-mono font-bold text-zinc-550 flex items-center justify-between uppercase tracking-wider">
            <span>{t.monoRayText} {details.hsl.h}°</span>
            <span>{t.monoRange}</span>
          </span>
          <div className="flex w-full h-11 rounded-lg overflow-hidden border border-zinc-900 p-0.5 bg-black">
            {harmonies.monochromaticArray.map((mColor, idx) => (
              <button
                key={idx}
                onClick={() => onColorSelect(mColor.hsl.h, mColor.hsl.s, mColor.hsl.l)}
                className="flex-1 h-full cursor-pointer transition-all hover:flex-[1.5] hover:ring-1 hover:ring-white focus:outline-none relative group"
                style={{ backgroundColor: mColor.hex }}
                title={`L: ${mColor.hsl.l}% | ${mColor.hex}`}
                aria-label={`Mono ${idx}`}
                id={`mono-color-${idx}`}
              >
                <span className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 bg-black/90 px-1 py-0.5 rounded text-[8px] font-mono text-white transition-opacity border border-zinc-800">
                  {mColor.hsl.l}%
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
