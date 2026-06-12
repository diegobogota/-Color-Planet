import { useState, useEffect } from 'react';
import { ViewState, Point3D, ColorDetailsData } from './types';
import ColorSphereCanvas from './components/ColorSphereCanvas';
import ColorDetails from './components/ColorDetails';
import ControlPanel from './components/ControlPanel';
import PaletteManager from './components/PaletteManager';
import { hslToRgb, rgbToHex } from './colorUtils';
import { translations } from './translations';
import { 
  Globe,
  Sliders, 
  Heart, 
  X, 
  Languages, 
  Sparkles, 
  ArrowRight,
  Info,
  RotateCcw,
  RotateCw
} from 'lucide-react';

export default function App() {
  // 1. Language state (Español by default as requested, toggleable to English)
  const [lang, setLang] = useState<'es' | 'en'>('es');
  
  // T = Translation dictionary helper
  const t = translations[lang];

  // 2. Core ViewState of the 3D space
  const [viewState, setViewState] = useState<ViewState>({
    rx: -Math.PI / 9,      // slightly tilted to reveal 3D volume on load
    ry: Math.PI / 5,       // default rotation orbit
    zoom: 1.0,
    autoRotate: true,
    sliceMode: 'full',
    viewMode: 'hybrid',    // beautiful dots + ray lines
    layerFilter: null,
    hueFilter: null,
    saturationDecay: true,
    saturationBase: 100,
    atmosphereOpacity: 35  // 35% default opacity looks great!
  });

  // Steps of hues radiating inside the coordinate space (step size)
  const [hueDensity, setHueDensity] = useState(24); // 24 rays default

  // 3. Current Selected color node state - Starts as NULL for cinematic minimalist start!
  // "los detalles del color deben aparecer unicamente al hacer click en cada un de los tonos y se debe abrir un sidepanel"
  const [selectedPoint, setSelectedPoint] = useState<Point3D | null>(null);

  // 4. Custom color palette state with client-side localStorage syncing
  const [palette, setPalette] = useState<ColorDetailsData[]>(() => {
    try {
      const saved = localStorage.getItem('esp_colors_palette');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // State to toggle Settings and Palette overlays in the minimalist UI
  const [activeOverlay, setActiveOverlay] = useState<'settings' | 'palette' | null>(null);

  // Method to sync palette updates
  const updatePalette = (newPalette: ColorDetailsData[]) => {
    setPalette(newPalette);
    localStorage.setItem('esp_colors_palette', JSON.stringify(newPalette));
  };

  // Add selected color to custom palette list with duplicates validation
  const handleSaveToPalette = (color: ColorDetailsData) => {
    const exists = palette.some(c => c.hex === color.hex);
    if (!exists) {
      updatePalette([...palette, color]);
    }
  };

  const handleRemoveFromPalette = (index: number) => {
    const updated = [...palette];
    updated.splice(index, 1);
    updatePalette(updated);
  };

  const handleClearPalette = () => {
    const confirmMsg = t.confirmClear;
    if (window.confirm(confirmMsg)) {
      updatePalette([]);
    }
  };

  // 5. Set Selected color directly from HSL coordinates (e.g. clicking on harmonies)
  const handleColorSelectByHsl = (h: number, s: number, l: number) => {
    const targetL = Math.round(l / 5) * 5; // round to closest 5 step
    const targetH = Math.round(h % 360);
    const r = targetL / 100;

    // Use current saturation configurations
    const S = viewState.saturationDecay
      ? Math.max(0, Math.round((1 - r) * viewState.saturationBase))
      : s;

    const phi = (targetH * Math.PI) / 180;
    const theta = Math.PI / 2; // Equator shell point by default
    const x = r * Math.sin(theta) * Math.cos(phi);
    const y = r * Math.cos(theta);
    const z = r * Math.sin(theta) * Math.sin(phi);
    const rgb = hslToRgb(targetH, S, targetL);

    setSelectedPoint({
      pointId: `node-${targetL}-${targetH}-90`,
      x, y, z, r, theta, phi,
      hsl: { h: targetH, s: S, l: targetL },
      rgb,
      hex: rgbToHex(rgb.r, rgb.g, rgb.b)
    });
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-100 relative font-sans">
      
      {/* 3D Canvas Background filling the entire screen */}
      <div className="absolute inset-0 w-full h-full z-0 block pointer-events-auto" aria-label={t.viewIn3D}>
        <ColorSphereCanvas
          viewState={viewState}
          setViewState={setViewState}
          selectedPoint={selectedPoint}
          onSelectPoint={(pt) => setSelectedPoint(pt)} // directly opens sidepanel on point select
          hueDensity={hueDensity}
          lang={lang}
        />
      </div>

      {/* 1. Header with minimalist futuristic cinematic look - styled as a semi-translucent overlapping HUD */}
      <header className="relative z-20 border-b border-zinc-900/40 bg-zinc-950/40 backdrop-blur-md px-4 py-3 sm:px-6 pointer-events-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3 items-center justify-between">
          
          {/* Logo Name & Diego Bogotá Credit link */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg shadow-emerald-500/5">
              <Globe className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-white tracking-wider uppercase font-mono">
                  {t.title}
                </h1>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {lang === 'es' ? (
                  <>
                    Rueda cromática interactiva de <a href="https://2026.diegobogota.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline font-medium transition">Diego Bogotá</a>. <a href="https://2026.diegobogota.com" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition font-mono text-[10px]">2026.diegobogota.com</a>
                  </>
                ) : (
                  <>
                    Interactive 3D color wheel by <a href="https://2026.diegobogota.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline font-medium transition">Diego Bogotá</a>. <a href="https://2026.diegobogota.com" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition font-mono text-[10px]">2026.diegobogota.com</a>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Minimalist Top Tools Container */}
          <div className="flex items-center gap-3">
            
            {/* Language Toggle Selector */}
            <button
              onClick={() => setLang(prev => prev === 'es' ? 'en' : 'es')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-mono text-zinc-300 transition-all hover:text-white cursor-pointer"
              title="Change Language / Cambiar Idioma"
              id="lang-toggle-btn"
              aria-label="Toggle language"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'es' ? 'English' : 'Español'}</span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase">{lang === 'es' ? 'EN' : 'ES'}</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. Main Viewport Layer: uses pointer-events-none to let drag actions bleed straight into background canvas */}
      <main className="flex-1 w-full relative pointer-events-none z-10" id="main-content">

        {/* Minimalist Floating dock toolbar for Settings & Palette */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-zinc-950/90 backdrop-blur-md rounded-full border border-zinc-800 shadow-2xl z-30 pointer-events-auto">
          <button
            onClick={() => setActiveOverlay(prev => prev === 'settings' ? null : 'settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wider transition cursor-pointer ${
              activeOverlay === 'settings'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
            id="panel-settings-toggle"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{t.parameters}</span>
          </button>

          <div className="w-[1px] h-4 bg-zinc-850"></div>

          <button
            onClick={() => setActiveOverlay(prev => prev === 'palette' ? null : 'palette')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wider relative transition cursor-pointer ${
              activeOverlay === 'palette'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
            id="panel-palette-toggle"
          >
            <Heart className="w-3.5 h-3.5" />
            <span>{t.palette}</span>
            {palette.length > 0 && (
              <span className="w-4 h-4 bg-indigo-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border border-zinc-955 absolute -top-1 -right-1">
                {palette.length}
              </span>
            )}
          </button>
        </div>

        {/* Floating Quick Planet Controllers on the Bottom Right */}
        <div className="absolute bottom-10 right-6 sm:right-10 flex items-center gap-2.5 pointer-events-auto z-30">
          {/* Subtle Auto-Rotation Toggle Button */}
          <button
            onClick={() => setViewState(prev => ({ ...prev, autoRotate: !prev.autoRotate }))}
            className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all cursor-pointer shadow-lg backdrop-blur-md ${
              viewState.autoRotate
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-zinc-950/90 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-900'
            }`}
            title={lang === 'es' ? 'Giro automático sutil' : 'Subtle auto-rotation'}
            aria-label="Toggle auto-rotate"
            id="btn-quick-auto-rotate"
          >
            <RotateCw className={`w-4 h-4 ${viewState.autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '10s' }} />
          </button>

          {/* Quick Planet Parameters and Angle Reset Button */}
          <button
            onClick={() => {
              setViewState({
                rx: -Math.PI / 9,
                ry: Math.PI / 5,
                zoom: 1.0,
                autoRotate: true,
                sliceMode: 'full',
                viewMode: 'hybrid',
                layerFilter: null,
                hueFilter: null,
                saturationDecay: true,
                saturationBase: 100,
                atmosphereOpacity: 35
              });
              setHueDensity(24);
            }}
            className="w-11 h-11 rounded-full bg-zinc-950/90 text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-900 flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md"
            title={lang === 'es' ? 'Restablecer órbita y parámetros' : 'Reset orbit and parameters'}
            aria-label="Reset planet coordinates"
            id="btn-quick-reset-view"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

      </main>

      {/* Overlays and Drawers that must appear above all layers (including header) */}
      {/* Floating Side panel / overlays from the bottom dock */}
      {activeOverlay !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 transition-all pointer-events-auto" onClick={() => setActiveOverlay(null)}>
          <div 
            className="bg-zinc-950 p-6 rounded-2xl border border-zinc-850 shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
              <span className="text-sm font-mono tracking-wider font-bold text-white uppercase flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                {activeOverlay === 'settings' ? t.parameters : t.palette}
              </span>
              <div className="flex items-center gap-2">
                {activeOverlay === 'settings' && (
                  <button
                    onClick={() => {
                      setViewState({
                        rx: -Math.PI / 9,
                        ry: Math.PI / 5,
                        zoom: 1.0,
                        autoRotate: true,
                        sliceMode: 'full',
                        viewMode: 'hybrid',
                        layerFilter: null,
                        hueFilter: null,
                        saturationDecay: true,
                        saturationBase: 100,
                        atmosphereOpacity: 35
                      });
                      setHueDensity(24);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-900 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-emerald-400 text-xs font-mono transition cursor-pointer"
                    title={lang === "es" ? "Restablecer todos los parámetros" : "Reset all parameters"}
                    id="btn-reset-settings"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t.reset}</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveOverlay(null)}
                  className="p-1 hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition cursor-pointer"
                  id="close-overlay-btn"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-grow">
              {activeOverlay === 'settings' ? (
                <ControlPanel
                  viewState={viewState}
                  setViewState={setViewState}
                  hueDensity={hueDensity}
                  setHueDensity={setHueDensity}
                  lang={lang}
                />
              ) : (
                <PaletteManager
                  palette={palette}
                  onRemoveFromPalette={handleRemoveFromPalette}
                  onClearPalette={handleClearPalette}
                  onSelectColor={handleColorSelectByHsl}
                  lang={lang}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop overlay for closing the drawer on outside click */}
      {selectedPoint !== null && (
        <div 
          className="fixed inset-0 bg-transparent z-40 pointer-events-auto cursor-default font-sans"
          onClick={() => setSelectedPoint(null)}
          id="drawer-backdrop"
          aria-hidden="true"
        />
      )}

      {/* 3. Slide-out Side panel Drawer for Color Details (opens ONLY on node click) */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[460px] bg-black/95 backdrop-blur-xl border-l border-zinc-850 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out pointer-events-auto ${
          selectedPoint !== null ? 'translate-x-0' : 'translate-x-full'
        }`}
        id="color-details-drawer"
      >
        {/* Sidepanel Header */}
        <div className="border-b border-zinc-900 px-6 py-5 flex items-center justify-between bg-zinc-950/80 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono tracking-widest font-bold uppercase text-zinc-300">
              {lang === 'es' ? 'Ficha de Inspección' : 'Spectral Sheet'}
            </span>
          </div>
          <button
            onClick={() => setSelectedPoint(null)}
            className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition flex items-center gap-1 text-[10px] font-mono border border-zinc-900 cursor-pointer"
            title="Close Panel"
            id="close-details-drawer"
          >
            <span>{t.close}</span>
            <X className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>

        {/* Sidepanel Content / Color details */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-800">
          {selectedPoint ? (
            <ColorDetails
              selectedPoint={selectedPoint}
              onColorSelect={handleColorSelectByHsl}
              onSaveToPalette={handleSaveToPalette}
              lang={lang}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <Info className="w-8 h-8 text-zinc-600 mb-3" />
              <p className="text-xs text-zinc-500">{t.noColorSelectedSub}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
