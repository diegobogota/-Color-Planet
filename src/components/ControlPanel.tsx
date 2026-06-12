import React from 'react';
import { ViewState } from '../types';
import { translations } from '../translations';
import { Sliders, Sun, Eye, Scissors, CloudFog } from 'lucide-react';

interface ControlPanelProps {
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  hueDensity: number;
  setHueDensity: (density: number) => void;
  lang: 'es' | 'en';
}

export default function ControlPanel({
  viewState,
  setViewState,
  hueDensity,
  setHueDensity,
  lang
}: ControlPanelProps) {
  const t = translations[lang];

  // Hue Quick presets
  const huePresets = [
    { label: t.allHues, value: null },
    { label: t.red, value: 0 },
    { label: t.yellow, value: 60 },
    { label: t.green, value: 120 },
    { label: t.cyan, value: 180 },
    { label: t.blue, value: 240 },
    { label: t.magenta, value: 300 }
  ];

  const handleLuminanceShellChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (val === -1) {
      setViewState(prev => ({ ...prev, layerFilter: null }));
    } else {
      // Round to closest 5
      const rounded = Math.round(val / 5) * 5;
      setViewState(prev => ({ ...prev, layerFilter: rounded }));
    }
  };

  return (
    <div className="flex flex-col gap-6 text-zinc-300 font-sans" id="control-panel-settings">
      
      {/* 1. Visualization Mode */}
      <div className="bg-zinc-950 border border-zinc-90 w-full p-4 flex flex-col gap-3 rounded-xl">
        <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 font-mono uppercase tracking-wider">
          <Eye className="w-3.5 h-3.5 text-emerald-400" />
          {t.renderMode}
        </span>
        
        <div className="grid grid-cols-3 gap-2">
          {/* Points */}
          <button
            onClick={() => setViewState(prev => ({ ...prev, viewMode: 'dots' }))}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 border cursor-pointer ${
              viewState.viewMode === 'dots'
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-extrabold'
                : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200'
            }`}
            id="viewmode-dots"
          >
            <span className="text-[14px]">● ●</span>
            <span>{t.hslUnits}</span>
          </button>
          
          {/* Rays */}
          <button
            onClick={() => setViewState(prev => ({ ...prev, viewMode: 'rays' }))}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 border cursor-pointer ${
              viewState.viewMode === 'rays'
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-extrabold'
                : 'bg-zinc-900 border-zinc-805 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200'
            }`}
            id="viewmode-rays"
          >
            <span className="text-[14px]">╱ ╲</span>
            <span>{t.hueRays}</span>
          </button>

          {/* Hybrid */}
          <button
            onClick={() => setViewState(prev => ({ ...prev, viewMode: 'hybrid' }))}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 border cursor-pointer ${
              viewState.viewMode === 'hybrid'
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-extrabold'
                : 'bg-zinc-900 border-zinc-805 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200'
            }`}
            id="viewmode-hybrid"
          >
            <span className="text-[14px]">☀ ❄</span>
            <span>{t.hybrid}</span>
          </button>
        </div>
      </div>

      {/* 2. Cross section slices */}
      <div className="bg-zinc-950 border border-zinc-90 w-full p-4 flex flex-col gap-3 rounded-xl">
        <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 font-mono uppercase tracking-wider">
          <Scissors className="w-3.5 h-3.5 text-amber-500" />
          {t.sliceTitle}
        </span>
        <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
          {t.sliceSub}
        </p>
        
        <div className="grid grid-cols-2 gap-2 mt-1">
          {/* Full */}
          <button
            onClick={() => setViewState(prev => ({ ...prev, sliceMode: 'full' }))}
            className={`px-2.5 py-2.5 rounded-lg text-[11px] font-bold transition text-left pl-3 border cursor-pointer ${
              viewState.sliceMode === 'full'
                ? 'bg-amber-500/10 border-amber-500/55 text-amber-300'
                : 'bg-zinc-900 border-zinc-805 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200'
            }`}
            id="slice-full"
          >
            ◈ {t.fullSphere}
          </button>

          {/* Half */}
          <button
            onClick={() => setViewState(prev => ({ ...prev, sliceMode: 'half' }))}
            className={`px-2.5 py-2.5 rounded-lg text-[11px] font-bold transition text-left pl-3 border cursor-pointer ${
              viewState.sliceMode === 'half'
                ? 'bg-amber-500/10 border-amber-500/55 text-amber-300'
                : 'bg-zinc-900 border-zinc-805 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200'
            }`}
            id="slice-half"
          >
            ◧ {t.halfSphere}
          </button>

          {/* Wedge */}
          <button
            onClick={() => setViewState(prev => ({ ...prev, sliceMode: 'wedge' }))}
            className={`px-2.5 py-2.5 rounded-lg text-[11px] font-bold transition text-left pl-3 border cursor-pointer ${
              viewState.sliceMode === 'wedge'
                ? 'bg-amber-500/10 border-amber-500/55 text-amber-300'
                : 'bg-zinc-900 border-zinc-805 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200'
            }`}
            id="slice-wedge"
          >
            ◨ {t.wedgeSphere}
          </button>

          {/* Quarter */}
          <button
            onClick={() => setViewState(prev => ({ ...prev, sliceMode: 'quarter' }))}
            className={`px-2.5 py-2.5 rounded-lg text-[11px] font-bold transition text-left pl-3 border cursor-pointer ${
              viewState.sliceMode === 'quarter'
                ? 'bg-amber-500/10 border-amber-500/55 text-amber-300'
                : 'bg-zinc-900 border-zinc-805 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200'
            }`}
            id="slice-quarter"
          >
            ◪ {t.quarterSphere}
          </button>
        </div>
      </div>

      {/* 3. Iso-Luminance Shell */}
      <div className="bg-zinc-950 border border-zinc-90 w-full p-4 flex flex-col gap-3 rounded-xl">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            {t.isolateLuminance}
          </span>
          {viewState.layerFilter !== null && (
            <button
              onClick={() => setViewState(prev => ({ ...prev, layerFilter: null }))}
              className="text-[10px] font-mono text-indigo-400 hover:underline cursor-pointer"
              id="clear-layer-filter"
            >
              {t.reset}
            </button>
          )}
        </div>
        
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[11px] font-mono text-zinc-500">
            <span>{t.all}</span>
            <span className="text-indigo-400 font-bold">
              {viewState.layerFilter === null ? t.showAll : `L: ${viewState.layerFilter}%`}
            </span>
          </div>
          <input
            type="range"
            min="-1"
            max="100"
            step="5"
            value={viewState.layerFilter === null ? -1 : viewState.layerFilter}
            onChange={handleLuminanceShellChange}
            className="w-full accent-indigo-500 bg-black h-1.5 rounded-lg appearance-none cursor-pointer border border-zinc-800"
            title="Luminance Filter Slider"
            aria-label="Luminance Filter"
            id="slider-luminance"
          />
        </div>
      </div>

      {/* 4. Azimuthal Hue Density & Filtering */}
      <div className="bg-zinc-950 border border-zinc-90 w-full p-4 flex flex-col gap-3 rounded-xl">
        <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 font-mono uppercase tracking-wider">
          <Sun className="w-3.5 h-3.5 text-sky-400" />
          {t.hueFilterAndDensity}
        </span>

        {/* Hue presets selector */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-zinc-500 font-semibold tracking-wider font-mono uppercase">{t.selectSpecificRay}:</span>
          <div className="flex flex-wrap gap-1.5">
            {huePresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setViewState(prev => ({ ...prev, hueFilter: preset.value }))}
                className={`px-2 py-1 rounded-md text-[10px] font-mono tracking-normal transition cursor-pointer ${
                  viewState.hueFilter === preset.value
                    ? 'bg-sky-500/20 text-sky-450 border border-sky-500/30 font-bold'
                    : 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400'
                }`}
                id={`hue-preset-${idx}`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ray Density Slider */}
        <div className="flex flex-col gap-1.5 mt-2 border-t border-zinc-900 pt-3">
          <div className="flex justify-between text-[11px] font-mono text-zinc-500">
            <span>{t.rayDensity}</span>
            <span className="text-sky-400 font-bold">{hueDensity} {t.raysCount}</span>
          </div>
          <input
            type="range"
            min="6"
            max="36"
            step="6"
            value={hueDensity}
            onChange={(e) => setHueDensity(parseInt(e.target.value))}
            className="w-full accent-sky-400 bg-black h-1.5 rounded-lg appearance-none cursor-pointer border border-zinc-800"
            title="Ray Density Slider"
            aria-label="Ray Density"
            id="slider-ray-density"
          />
        </div>
      </div>

      {/* 5. Radially Decaying Saturation */}
      <div className="bg-zinc-950 border border-zinc-90 w-full p-4 flex flex-col gap-3 rounded-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            {t.decayTitle}
          </span>
          <label className="relative inline-flex items-center cursor-pointer" id="label-sat-decay" aria-label="Saturación de Decaimiento Radial">
            <input
              type="checkbox"
              checked={viewState.saturationDecay}
              onChange={() => setViewState(prev => ({ ...prev, saturationDecay: !prev.saturationDecay }))}
              className="sr-only peer"
              id="toggle-sat-decay"
            />
            <div className="w-8 h-4 bg-black peer-focus:outline-none rounded-full border border-zinc-800 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-zinc-650 after:border-zinc-800 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-950 peer-checked:after:bg-purple-400"></div>
          </label>
        </div>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          {t.decaySub}
        </p>

        {viewState.saturationDecay && (
          <div className="flex flex-col gap-1.5 mt-2 border-t border-zinc-900 pt-2">
            <div className="flex justify-between text-[11px] font-mono text-zinc-500">
              <span>{t.satBaseAtCenter}:</span>
              <span className="text-purple-400 font-bold">{viewState.saturationBase}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={viewState.saturationBase}
              onChange={(e) => setViewState(prev => ({ ...prev, saturationBase: parseInt(e.target.value) }))}
              className="w-full accent-purple-500 bg-black h-1.5 rounded-lg appearance-none cursor-pointer border border-zinc-800"
              title="Saturation Base Selector"
              aria-label="Saturation Base"
              id="slider-sat-base"
            />
          </div>
        )}
      </div>

      {/* 6. Translucent Atmosphere */}
      <div className="bg-zinc-950 border border-zinc-90 w-full p-4 flex flex-col gap-3 rounded-xl">
        <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 font-mono uppercase tracking-wider">
          <CloudFog className="w-3.5 h-3.5 text-zinc-400" />
          {t.atmosOpacity}
        </span>
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[11px] font-mono text-zinc-500">
            <span>0% (Transparent)</span>
            <span className="text-zinc-300 font-bold">{viewState.atmosphereOpacity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={viewState.atmosphereOpacity}
            onChange={(e) => setViewState(prev => ({ ...prev, atmosphereOpacity: parseInt(e.target.value) }))}
            className="w-full accent-zinc-500 bg-black h-1.5 rounded-lg appearance-none cursor-pointer border border-zinc-800"
            title="Atmosphere Opacity Selector"
            aria-label="Atmosphere Opacity"
            id="slider-atmosphere"
          />
        </div>
        <p className="text-[10px] text-zinc-550 leading-relaxed italic">
          {t.atmosSub}
        </p>
      </div>

    </div>
  );
}
