import { useState } from 'react';
import { ColorDetailsData } from '../types';
import { translations } from '../translations';
import { Trash2, Copy, Check, FileCode, Sparkles } from 'lucide-react';

interface PaletteManagerProps {
  palette: ColorDetailsData[];
  onRemoveFromPalette: (index: number) => void;
  onClearPalette: () => void;
  onSelectColor: (h: number, s: number, l: number) => void;
  lang: 'es' | 'en';
}

export default function PaletteManager({
  palette,
  onRemoveFromPalette,
  onClearPalette,
  onSelectColor,
  lang
}: PaletteManagerProps) {
  const [copiedText, setCopiedText] = useState(false);
  const [exportFormat, setExportFormat] = useState<'css' | 'json'>('css');
  const t = translations[lang];

  if (palette.length === 0) {
    return (
      <div className="bg-zinc-950 rounded-2xl border border-zinc-90 w-full p-8 flex flex-col items-center justify-center text-center">
        <Sparkles className="w-8 h-8 text-emerald-400/40 mb-3" />
        <h3 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">{t.emptyPalette}</h3>
        <p className="text-[11px] text-zinc-500 mt-1 max-w-[280px] leading-relaxed">
          {t.emptyPaletteSub}
        </p>
      </div>
    );
  }

  // Generate exported code block based on selected format
  const generateExportText = () => {
    if (exportFormat === 'css') {
      return `:root {\n` +
        palette.map((color, idx) => {
          // Slugify name roughly
          const slug = color.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(/[^a-z0-9]+/g, '-');
          return `  --color-planet-${slug || idx}: ${color.hex}; /* H:${color.hsl.h} S:${color.hsl.s}% L:${color.hsl.l}% */`;
        }).join('\n') +
        `\n}`;
    } else {
      return JSON.stringify(
        palette.map(color => ({
          name: color.name,
          hex: color.hex,
          category: color.category,
          hsl: color.hsl,
          rgb: color.rgb,
          cmyk: color.cmyk
        })),
        null,
        2
      );
    }
  };

  const handleCopyExport = () => {
    const text = generateExportText();
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
      });
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 text-zinc-300 font-sans" id="palette-manager-section">
      
      {/* 1. Header with clear button */}
      <div className="flex items-center justify-between border-b border-zinc-90 w-full pb-3">
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-zinc-200 font-mono uppercase tracking-wider">
            {t.savedColors} ({palette.length})
          </h3>
          <span className="text-[9px] text-zinc-500">{t.persistLocal}</span>
        </div>
        <button
          onClick={onClearPalette}
          className="px-2.5 py-1 text-[9px] uppercase font-bold tracking-wider text-red-400 hover:text-white hover:bg-red-500/10 rounded transition border border-red-500/10 cursor-pointer"
          id="btn-clear-palette"
        >
          {t.clearAll}
        </button>
      </div>

      {/* 2. Grid of saved color pills */}
      <div className="grid grid-cols-1 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
        {palette.map((color, idx) => {
          // Translate card names appropriately
          const displayName = lang === 'es' ? color.name : color.name
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
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 bg-black border border-zinc-900 rounded-xl hover:border-zinc-800 transition"
            >
              {/* Left preview and selection */}
              <button
                onClick={() => onSelectColor(color.hsl.h, color.hsl.s, color.hsl.l)}
                className="flex items-center gap-2.5 text-left min-w-0 flex-1 hover:opacity-85 transition cursor-pointer"
                title={lang === 'es' ? "Ver detalles en inspector" : "Inspect details"}
                id={`palette-item-${idx}`}
              >
                <div className="w-8 h-8 rounded-lg shadow-sm border border-white/5 flex-shrink-0" style={{ backgroundColor: color.hex }}></div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-zinc-200 truncate pr-1">{displayName}</div>
                  <div className="text-[9px] font-mono text-zinc-500">
                    {color.hex} • H:{color.hsl.h}° S:{color.hsl.s}% L:{color.hsl.l}%
                  </div>
                </div>
              </button>

              {/* Right delete button */}
              <button
                onClick={() => onRemoveFromPalette(idx)}
                className="p-1.5 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                title="Remove color"
                id={`delete-palette-${idx}`}
                aria-label="Remove color"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* 3. Export formats & block */}
      <div className="bg-zinc-950 border border-zinc-90 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            {t.exportPaletteCode}
          </span>
          
          {/* Format toggles */}
          <div className="flex bg-black p-0.5 rounded border border-zinc-805">
            <button
              onClick={() => setExportFormat('css')}
              className={`px-2 py-0.5 text-[9px] font-mono rounded cursor-pointer ${exportFormat === 'css' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-500'}`}
              id="export-format-css"
            >
              CSS
            </button>
            <button
              onClick={() => setExportFormat('json')}
              className={`px-2 py-0.5 text-[9px] font-mono rounded cursor-pointer ${exportFormat === 'json' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-500'}`}
              id="export-format-json"
            >
              JSON
            </button>
          </div>
        </div>

        {/* Text Area display */}
        <div className="relative">
          <pre className="text-[9px] font-mono bg-black border border-zinc-900 rounded-lg p-3 text-zinc-400 max-h-[140px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {generateExportText()}
          </pre>
          
          {/* Floating Copy Button */}
          <button
            onClick={handleCopyExport}
            className={`absolute top-2 right-2 p-1.5 rounded-md transition border flex items-center gap-1 text-[9px] font-mono cursor-pointer ${
              copiedText
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-500 hover:text-zinc-305'
            }`}
            title="Copy Code"
            id="copy-palette-code"
          >
            {copiedText ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                {t.copied}
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                {t.copyText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
