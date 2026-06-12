import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Point3D, ProjectivePoint, ViewState } from '../types';
import { hslToRgb, rgbToHex } from '../colorUtils';
import { translations } from '../translations';
import { 
  Eye, 
  RotateCw, 
  RefreshCw, 
  Layers, 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  Scissors, 
  Navigation, 
  Plane, 
  RotateCcw,
  ArrowBigUp,
  ArrowBigDown,
  ChevronUp,
  ChevronDown,
  Info
} from 'lucide-react';

interface ColorSphereCanvasProps {
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  selectedPoint: Point3D | null;
  onSelectPoint: (point: Point3D) => void;
  hueDensity: number; // e.g. 12, 18, 24, 36
  lang: 'es' | 'en';
}

export default function ColorSphereCanvas({
  viewState,
  setViewState,
  selectedPoint,
  onSelectPoint,
  hueDensity,
  lang
}: ColorSphereCanvasProps) {
  const t = translations[lang || 'es'];
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas size and mouse states
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredPoint, setHoveredPoint] = useState<Point3D | null>(null);

  // 1. Camera position for first-person flight controls
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0, z: 0 });
  const [isLockedAtCore, setIsLockedAtCore] = useState(false);
  
  // Track active keys for dynamic cockpit highlights and continuous flight execution
  const [keysDown, setKeysDown] = useState<Record<string, boolean>>({});

  // Toggle for HUD information & telemetry cockpit panel
  const [showCockpit, setShowCockpit] = useState(false);

  // Refs for low-latency updates inside the frame loop
  const anglesRef = useRef({ rx: viewState.rx, ry: viewState.ry });
  anglesRef.current.rx = viewState.rx;
  anglesRef.current.ry = viewState.ry;

  const activeKeysRef = useRef<Set<string>>(new Set());

  // Handle auto-rotation & WASD flight loop with delta-time
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000); // delta time in seconds, max 50ms cap
      lastTime = time;

      let rotationChanged = false;

      // 1. Handle auto-rotation
      let targetRy = anglesRef.current.ry;
      if (viewState.autoRotate) {
        targetRy = (targetRy + 0.15 * dt) % (Math.PI * 2);
        rotationChanged = true;
      }

      // 2. Handle WASD / flight controls
      if (activeKeysRef.current.size > 0) {
        setIsLockedAtCore(false);
        const speed = 1.35 * dt; // movement unit per second

        // Current look angles
        const rx = anglesRef.current.rx;
        const ry = anglesRef.current.ry;

        const cosX = Math.cos(rx);
        const sinX = Math.sin(rx);
        const cosY = Math.cos(ry);
        const sinY = Math.sin(ry);

        // Direction vectors in world coordinates
        // Forward vector (looking inside coordinate system Z increases/decreases dynamically)
        const fwdX = -sinY * cosX;
        const fwdY = sinX;
        const fwdZ = -cosY * cosX;

        // Strafe right vector
        const rgtX = cosY;
        const rgtY = 0;
        const rgtZ = -sinY;

        // Vertical ascend vector
        const upX = sinY * sinX;
        const upY = cosX;
        const upZ = cosY * sinX;

        let mx = 0;
        let my = 0;
        let mz = 0;

        if (activeKeysRef.current.has('w')) {
          mx += fwdX; my += fwdY; mz += fwdZ;
        }
        if (activeKeysRef.current.has('s')) {
          mx -= fwdX; my -= fwdY; mz -= fwdZ;
        }
        if (activeKeysRef.current.has('a')) {
          mx -= rgtX; my -= rgtY; mz -= rgtZ;
        }
        if (activeKeysRef.current.has('d')) {
          mx += rgtX; my += rgtY; mz += rgtZ;
        }
        if (activeKeysRef.current.has('q')) {
          mx += upX; my += upY; mz += upZ;
        }
        if (activeKeysRef.current.has('e')) {
          mx -= upX; my -= upY; mz -= upZ;
        }

        const len = Math.sqrt(mx * mx + my * my + mz * mz);
        if (len > 0.0001) {
          const moveX = (mx / len) * speed;
          const moveY = (my / len) * speed;
          const moveZ = (mz / len) * speed;

          setCameraPos(prev => ({
            x: prev.x + moveX,
            y: prev.y + moveY,
            z: prev.z + moveZ
          }));
        }
      }

      if (rotationChanged) {
        setViewState(prev => ({
          ...prev,
          ry: targetRy
        }));
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [viewState.autoRotate, setViewState]);

  // Keep camera locked to the exact core focal coordinates if isLockedAtCore is active
  useEffect(() => {
    if (isLockedAtCore) {
      const rx = viewState.rx;
      const ry = viewState.ry;
      setCameraPos({
        x: -2.5 * Math.sin(ry) * Math.cos(rx),
        y: -2.5 * Math.sin(rx),
        z: -2.5 * Math.cos(ry) * Math.cos(rx)
      });
    }
  }, [isLockedAtCore, viewState.rx, viewState.ry]);

  // Read container dimensions automatically
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      // Keep canvas height and width responsive and fill entire screen
      setDimensions({ width: Math.floor(width), height: Math.floor(height) });
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Keyboard action listeners for WASD & Q/E
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      let actKey = '';

      if (key === 'w' || e.key === 'ArrowUp') actKey = 'w';
      else if (key === 's' || e.key === 'ArrowDown') actKey = 's';
      else if (key === 'a' || e.key === 'ArrowLeft') actKey = 'a';
      else if (key === 'd' || e.key === 'ArrowRight') actKey = 'd';
      else if (key === 'q' || key === ' ') actKey = 'q';
      else if (key === 'e' || e.key === 'Shift') actKey = 'e';

      if (actKey) {
        if (key === ' ' || e.key === 'Shift') {
          e.preventDefault();
        }
        activeKeysRef.current.add(actKey);
        setKeysDown(prev => ({ ...prev, [actKey]: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      let actKey = '';

      if (key === 'w' || e.key === 'ArrowUp') actKey = 'w';
      else if (key === 's' || e.key === 'ArrowDown') actKey = 's';
      else if (key === 'a' || e.key === 'ArrowLeft') actKey = 'a';
      else if (key === 'd' || e.key === 'ArrowRight') actKey = 'd';
      else if (key === 'q' || key === ' ') actKey = 'q';
      else if (key === 'e' || e.key === 'Shift') actKey = 'e';

      if (actKey) {
        activeKeysRef.current.delete(actKey);
        setKeysDown(prev => ({ ...prev, [actKey]: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Virtual mouse hold navigation helpers
  const startVirtualKey = (key: string) => {
    activeKeysRef.current.add(key);
    setKeysDown(prev => ({ ...prev, [key]: true }));
  };

  const stopVirtualKey = (key: string) => {
    activeKeysRef.current.delete(key);
    setKeysDown(prev => ({ ...prev, [key]: false }));
  };

  const stopAllVirtualKeys = () => {
    activeKeysRef.current.clear();
    setKeysDown({});
  };

  // Generate the master grid of 3D HSL points
  const points = useMemo(() => {
    const list: Point3D[] = [];

    // 1. Center Point (Black origin, r = 0, L = 0)
    list.push({
      pointId: 'center',
      x: 0,
      y: 0,
      z: 0,
      r: 0,
      theta: 0,
      phi: 0,
      hsl: { h: 0, s: viewState.saturationDecay ? viewState.saturationBase : 100, l: 0 },
      rgb: { r: 0, g: 0, b: 0 },
      hex: '#000000'
    });

    // 2. Generate shells step by step
    for (let L = 5; L <= 100; L += 5) {
      const r = L / 100;

      // Saturation decays linearly outwards
      const S = viewState.saturationDecay
        ? Math.max(0, Math.round((1 - r) * viewState.saturationBase))
        : 100;

      // Hues distributed uniformly as rays based on density
      const hueStep = 360 / hueDensity;
      for (let h = 0; h < 360; h += hueStep) {
        if (viewState.hueFilter !== null && Math.abs(h - viewState.hueFilter) > 0.1) {
          continue;
        }

        const phi = (h * Math.PI) / 180; // azimuth in horizontal plane (xz)

        // Elevation steps: from North pole to South pole.
        const thetaDegrees = [15, 40, 65, 90, 115, 140, 165];
        
        for (const thetaDeg of thetaDegrees) {
          const theta = (thetaDeg * Math.PI) / 180; // elevation

          const x = r * Math.sin(theta) * Math.cos(phi);
          const y = r * Math.cos(theta); // vertical
          const z = r * Math.sin(theta) * Math.sin(phi);

          // Filtering by cross section / slice parameters
          let keep = true;
          if (viewState.sliceMode === 'half') {
            if (z < -0.01) keep = false;
          } else if (viewState.sliceMode === 'wedge') {
            if (x > 0 && z < 0) keep = false;
          } else if (viewState.sliceMode === 'quarter') {
            if (y > 0 && x > 0) keep = false;
          }

          // Layer filter
          if (viewState.layerFilter !== null && Math.abs(L - viewState.layerFilter) > 0.1) {
            keep = false;
          }

          if (keep) {
            const rgb = hslToRgb(h, S, L);
            const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

            list.push({
              pointId: `node-${L}-${h}-${thetaDeg}`,
              x,
              y,
              z,
              r,
              theta,
              phi,
              hsl: { h, s: S, l: L },
              rgb,
              hex
            });
          }
        }
      }
    }
    return list;
  }, [hueDensity, viewState.layerFilter, viewState.hueFilter, viewState.sliceMode, viewState.saturationDecay, viewState.saturationBase]);

  // Project points into 2D screen space with Painter's depth sorting and clipping
  const projectedPoints: ProjectivePoint[] = useMemo(() => {
    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Scale size: we want the sphere to comfortably occupy ~70% of the canvas area
    const sphereRadiusScale = Math.min(width, height) * 0.35 * viewState.zoom;

    const rx = viewState.rx;
    const ry = viewState.ry;

    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);
    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);

    const D = 2.5; // distance from eyeball to projection screen

    const translatedMapped = points.map(pt => {
      // 1. Translate point coordinates based on first-person aircraft camera position
      const dx = pt.x - cameraPos.x;
      const dy = pt.y - cameraPos.y;
      const dz = pt.z - cameraPos.z;

      // 2. Rotate around Y axis (azimuth / look orbit angle)
      const x1 = dx * cosY - dz * sinY;
      const z1 = dx * sinY + dz * cosY;
      const y1 = dy;

      // 3. Rotate around X axis (elevation / look tilt angle)
      const x2 = x1;
      const y2 = y1 * cosX - z1 * sinX;
      const z2 = y1 * sinX + z1 * cosX; // Depth coordinate relative to viewport

      return {
        point: pt,
        x2,
        y2,
        z2
      };
    });

    // Clip elements that are behind the observer's focal center plane (z2 >= D)
    const visibleOnes = translatedMapped.filter(item => item.z2 < D - 0.20);

    return visibleOnes.map(item => {
      const { point, x2, y2, z2 } = item;
      const perspectiveFactor = D / (D - z2);

      const px = centerX + x2 * sphereRadiusScale * perspectiveFactor;
      const py = centerY - y2 * sphereRadiusScale * perspectiveFactor;

      return {
        point,
        px,
        py,
        pz: z2 // Higher is closer
      };
    })
    .sort((a, b) => a.pz - b.pz);
  }, [points, dimensions, viewState.rx, viewState.ry, viewState.zoom, cameraPos]);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) * 0.35 * viewState.zoom;

    const D = 2.5;
    const rx = viewState.rx;
    const ry = viewState.ry;
    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);
    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);

    // Clear with elegant deep dark grid canvas background
    ctx.fillStyle = '#090d16'; 
    ctx.fillRect(0, 0, width, height);

    // Draw subtle radial glow representing ambient luminosity center
    const radialGlow = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, scale * 1.5);
    radialGlow.addColorStop(0, '#101726');
    radialGlow.addColorStop(1, '#090d16');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);

    // Draw white translucent atmosphere shell if enabled and centered
    if (viewState.atmosphereOpacity > 0 && viewState.sliceMode === 'full') {
      // Calculate relative atmosphere center by checking where camera relative origin is
      const dxA = 0 - cameraPos.x;
      const dyA = 0 - cameraPos.y;
      const dzA = 0 - cameraPos.z;

      const x1_a = dxA * cosY - dzA * sinY;
      const z1_a = dxA * sinY + dzA * cosY;
      const y1_a = dyA;

      const x2_a = x1_a;
      const y2_a = y1_a * cosX - z1_a * sinX;
      const z2_a = y1_a * sinX + z1_a * cosX;

      if (z2_a < D - 0.1) {
        const pFactor_a = D / (D - z2_a);
        const atmosCx = centerX + x2_a * scale * pFactor_a;
        const atmosCy = centerY - y2_a * scale * pFactor_a;
        const atmosSize = scale * pFactor_a;

        if (atmosSize > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(atmosCx, atmosCy, atmosSize, 0, Math.PI * 2);
          const atmosGradient = ctx.createRadialGradient(
            atmosCx - atmosSize * 0.1, atmosCy - atmosSize * 0.1, atmosSize * 0.5,
            atmosCx, atmosCy, atmosSize
          );
          atmosGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
          atmosGradient.addColorStop(0.8, `rgba(129, 140, 248, ${viewState.atmosphereOpacity * 0.04 / 100})`);
          atmosGradient.addColorStop(1, `rgba(99, 102, 241, ${viewState.atmosphereOpacity * 0.15 / 100})`);
          ctx.fillStyle = atmosGradient;
          ctx.fill();
          ctx.strokeStyle = `rgba(129, 140, 248, ${viewState.atmosphereOpacity * 0.1 / 100})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Grid center lines helpers (relative to the cockpit center)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(centerX - scale * 1.1, centerY);
    ctx.lineTo(centerX + scale * 1.1, centerY);
    ctx.moveTo(centerX, centerY - scale * 1.1);
    ctx.lineTo(centerX, centerY + scale * 1.1);
    ctx.stroke();

    // 1. Draw RAY lines radiating from the relative center point
    if (viewState.viewMode === 'rays' || viewState.viewMode === 'hybrid') {
      // Find projected position of center node manually
      const dxC = 0 - cameraPos.x;
      const dyC = 0 - cameraPos.y;
      const dzC = 0 - cameraPos.z;

      const x1_c = dxC * cosY - dzC * sinY;
      const z1_c = dxC * sinY + dzC * cosY;
      const y1_c = dyC;

      const x2_c = x1_c;
      const y2_c = y1_c * cosX - z1_c * sinX;
      const z2_c = y1_c * sinX + z1_c * cosX;

      let cx = centerX;
      let cy = centerY;
      let centerInView = z2_c < D - 0.1;

      if (centerInView) {
        const pFactor_c = D / (D - z2_c);
        cx = centerX + x2_c * scale * pFactor_c;
        cy = centerY - y2_c * scale * pFactor_c;

        projectedPoints.forEach(pProj => {
          const pt = pProj.point;
          if (pt.pointId === 'center') return;

          // Color transitions smoothly from dark center outwards
          const rayGrad = ctx.createLinearGradient(cx, cy, pProj.px, pProj.py);
          rayGrad.addColorStop(0, '#020617');
          
          const alphaDistance = Math.max(0.12, Math.min(0.85, (pProj.pz + 1) / 2.5));
          rayGrad.addColorStop(1, `rgba(${pt.rgb.r}, ${pt.rgb.g}, ${pt.rgb.b}, ${alphaDistance * 0.65})`);

          ctx.beginPath();
          ctx.strokeStyle = rayGrad;
          ctx.lineWidth = 1.0;
          ctx.moveTo(cx, cy);
          ctx.lineTo(pProj.px, pProj.py);
          ctx.stroke();
        });
      }
    }

    // 2. Draw DOT nodes
    if (viewState.viewMode === 'dots' || viewState.viewMode === 'hybrid') {
      projectedPoints.forEach(pProj => {
        const pt = pProj.point;
        
        // Dynamically compute dot size based on distance and projection depth
        const depthMultiplier = (pProj.pz + 1.5) / 2.5; // normalized 0.15 to 1.3
        let dotSize = Math.max(1.8, Math.min(18, pt.r * 6.0 * depthMultiplier + 1.2));
        
        if (pt.pointId === 'center') {
          dotSize = 5;
        }

        ctx.beginPath();
        ctx.arc(pProj.px, pProj.py, dotSize, 0, Math.PI * 2);
        
        // Create 3D spherical shading effect
        const nodeGrad = ctx.createRadialGradient(
          pProj.px - dotSize * 0.2, pProj.py - dotSize * 0.2, dotSize * 0.1,
          pProj.px, pProj.py, dotSize
        );
        
        nodeGrad.addColorStop(0, '#ffffff'); // shiny spec
        nodeGrad.addColorStop(0.35, `rgb(${pt.rgb.r}, ${pt.rgb.g}, ${pt.rgb.b})`);
        
        const darkR = Math.max(0, pt.rgb.r - 60);
        const darkG = Math.max(0, pt.rgb.g - 60);
        const darkB = Math.max(0, pt.rgb.b - 60);
        nodeGrad.addColorStop(1, `rgb(${darkR}, ${darkG}, ${darkB})`);

        ctx.fillStyle = nodeGrad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Hovered highlight
        if (hoveredPoint && hoveredPoint.pointId === pt.pointId) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(pProj.px, pProj.py, dotSize + 4, 0, Math.PI * 2);
          ctx.strokeStyle = '#22c55e'; // Green hover indicator
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }

        // Selected pulsing glow
        if (selectedPoint && selectedPoint.pointId === pt.pointId) {
          ctx.save();
          const pulse = (Date.now() % 1400) / 1400 * 7;
          ctx.beginPath();
          ctx.arc(pProj.px, pProj.py, dotSize + 3 + pulse, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${1 - pulse/7})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(pProj.px, pProj.py, dotSize + 3, 0, Math.PI * 2);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
      });
    }

    // Interactive cabin cockpit HUD overlay (subtle grid details on canvas)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.lineWidth = 1;
    // Crosshair lines
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.moveTo(centerX - 40, centerY); ctx.lineTo(centerX - 10, centerY);
    ctx.moveTo(centerX + 10, centerY); ctx.lineTo(centerX + 40, centerY);
    ctx.moveTo(centerX, centerY - 40); ctx.lineTo(centerX, centerY - 10);
    ctx.moveTo(centerX, centerY + 10); ctx.lineTo(centerX, centerY + 40);
    ctx.stroke();

    // Flight guide indicators in corners
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '10px monospace';
    ctx.fillText(`Corte: ${viewState.sliceMode.toUpperCase()} | Rotación X: ${Math.round(viewState.rx * 180 / Math.PI)}° Y: ${Math.round(viewState.ry * 180 / Math.PI)}°`, 15, height - 20);
    ctx.fillText(`Nodos: ${projectedPoints.length} | Zoom: ${viewState.zoom.toFixed(1)}x`, 15, height - 35);
  }, [projectedPoints, dimensions, hoveredPoint, selectedPoint, viewState.viewMode, viewState.atmosphereOpacity, viewState.sliceMode, viewState.zoom, cameraPos]);

  // Handle Drag mouse orbit rotations
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    if (viewState.autoRotate) {
      setViewState(prev => ({ ...prev, autoRotate: false }));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setDragStart({ x: e.clientX, y: e.clientY });

      const sensitivity = 0.007;
      setViewState(prev => {
        let newRx = prev.rx + deltaY * sensitivity;
        const maxTilt = Math.PI / 2.1;
        if (newRx > maxTilt) newRx = maxTilt;
        if (newRx < -maxTilt) newRx = -maxTilt;

        return {
          ...prev,
          ry: (prev.ry + deltaX * sensitivity) % (Math.PI * 2),
          rx: newRx
        };
      });
    } else {
      if (viewState.viewMode !== 'rays') {
        let minDistance = 14; 
        let foundPt: Point3D | null = null;

        projectedPoints.forEach(pProj => {
          const dx = pProj.px - mx;
          const dy = pProj.py - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDistance) {
            minDistance = dist;
            foundPt = pProj.point;
          }
        });

        if (foundPt !== hoveredPoint) {
          setHoveredPoint(foundPt);
        }
      }
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (hoveredPoint) {
      onSelectPoint(hoveredPoint);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
    setViewState(prev => ({
      ...prev,
      zoom: Math.max(0.4, Math.min(3.0, prev.zoom * zoomFactor))
    }));
  };

  // Reset actions
  const resetOrientation = () => {
    setViewState(prev => ({
      ...prev,
      rx: -Math.PI / 8,
      ry: Math.PI / 6,
      zoom: 1.0
    }));
  };

  const resetCameraPosition = () => {
    setCameraPos({ x: 0, y: 0, z: 0 });
  };

  const toggleAutoRotate = () => {
    setViewState(prev => ({
      ...prev,
      autoRotate: !prev.autoRotate
    }));
  };

  const distanceFromCenter = Math.sqrt(cameraPos.x * cameraPos.x + cameraPos.y * cameraPos.y + cameraPos.z * cameraPos.z);

  return (
    <div className="relative w-full h-full flex flex-col bg-black overflow-hidden" ref={containerRef} id="canvas-wrapper">
      
      {/* Immersive starfield canvas covering the absolute full container size */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onClick={handleClick}
        onWheel={handleWheel}
        className="absolute inset-0 w-full h-full block outline-none select-none z-0 cursor-grab active:cursor-grabbing bg-[#090d16]"
      />

      {/* Floating HUD controls layer - transparent and click-through */}
      <div className="absolute inset-0 w-full h-full flex flex-col justify-between pointer-events-none z-10">
        
        {/* Top Banner & Zoom Toolbars */}
        <div className="p-4 flex flex-wrap gap-2 items-center justify-between pointer-events-none select-none">
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 pointer-events-auto shadow-md">
            <Compass className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '10s' }} />
            <span className="text-[11px] font-medium text-slate-200">COLOR PLANET (Vuelo WASD habilitado)</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/95 backdrop-blur-md p-1 rounded-full border border-slate-800 pointer-events-auto shadow-lg">
            <button
              onClick={() => setViewState(prev => ({ ...prev, zoom: Math.min(3.0, prev.zoom + 0.1) }))}
              className="p-1.5 hover:bg-slate-850 rounded-full text-slate-300 hover:text-white transition cursor-pointer"
              title="Acercar (Zoom +)"
              aria-label="Acercar"
              id="btn-zoom-in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewState(prev => ({ ...prev, zoom: Math.max(0.4, prev.zoom - 0.1) }))}
              className="p-1.5 hover:bg-slate-850 rounded-full text-slate-300 hover:text-white transition cursor-pointer"
              title="Alejar (Zoom -)"
              aria-label="Alejar"
              id="btn-zoom-out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3.5 bg-slate-800 self-center mx-1"></div>
            <button
              onClick={toggleAutoRotate}
              className={`p-1.5 rounded-full transition cursor-pointer ${viewState.autoRotate ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-slate-850 text-slate-300'}`}
              title="Auto-rotación libre"
              aria-label="Rotación Automática"
              id="btn-auto-rotate"
            >
              <RotateCw className={`w-3.5 h-3.5 ${viewState.autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
            </button>
            <button
              onClick={resetOrientation}
              className="p-1.5 hover:bg-slate-850 rounded-full text-slate-300 hover:text-white transition cursor-pointer"
              title="Reiniciar Vista de Giro"
              aria-label="Giro Inicial"
              id="btn-reset-view"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3.5 bg-slate-800 self-center mx-1"></div>
            <button
              onClick={() => setShowCockpit(prev => !prev)}
              className={`p-1.5 rounded-full transition cursor-pointer ${showCockpit ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'hover:bg-slate-850 text-slate-300'}`}
              title={lang === "es" ? "Mostrar información y cabina (vuelo)" : "Show info and flight cockpit"}
              aria-label="Información de Vuelo"
              id="btn-toggle-cockpit"
            >
              <Info className={`w-3.5 h-3.5 ${showCockpit ? 'animate-pulse' : ''}`} />
            </button>
          </div>
        </div>

        {/* Middle Floating HUD region with Slice label & Node info bubble */}
        <div className="flex-grow w-full relative pointer-events-none">
          {/* Floating cross section slice label */}
          {viewState.sliceMode !== 'full' && (
            <div className="absolute top-4 right-4 bg-amber-500/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-amber-500/30 text-[11px] font-mono text-amber-300 flex items-center gap-1.5 shadow-lg shadow-black/30 z-10 pointer-events-auto">
              <Scissors className="w-3.5 h-3.5 animate-pulse" />
              <span>Esfera Seccionada</span>
            </div>
          )}

          {/* Hover Hint Info Bubble */}
          {hoveredPoint && (
            <div
              className="absolute bg-zinc-950/95 backdrop-blur-md border border-zinc-900 text-white rounded-lg p-3 text-[11px] leading-relaxed shadow-xl pointer-events-none transition-all flex flex-col gap-1 font-mono items-start min-w-[130px] shadow-black/80 ring-1 ring-emerald-555/30 z-20"
              style={{
                left: `calc(${projectedPoints.find(p => p.point.pointId === hoveredPoint.pointId)?.px ?? dimensions.width / 2}px + 12px)`,
                top: `calc(${projectedPoints.find(p => p.point.pointId === hoveredPoint.pointId)?.py ?? dimensions.height / 2}px - 55px)`
              }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: hoveredPoint.hex }}></span>
                <span className="font-semibold text-slate-100">{hoveredPoint.hex}</span>
              </div>
              <span className="text-[10px] text-slate-300 font-mono">H:{hoveredPoint.hsl.h}° S:{hoveredPoint.hsl.s}% L:{hoveredPoint.hsl.l}%</span>
              <span className="text-[9px] text-emerald-400 font-bold tracking-normal">
                {lang === "es" ? "Clic para inspeccionar" : "Click to inspect"}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Cockpit Interface */}
        {showCockpit && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl pointer-events-auto select-none z-20 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
            {/* FLIGHT COCKPIT DASHBOARD (Control Navigation panel WASD) */}
            <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-900/80 p-4 rounded-xl relative" id="cockpit-flight-hud">
              
              {/* Close Button on Top Right */}
              <button
                onClick={() => setShowCockpit(false)}
                className="absolute top-2.5 right-2.5 p-1 hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition cursor-pointer"
                title={lang === "es" ? "Cerrar" : "Close"}
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pr-2">
              
              {/* Telemetry Display */}
              <div className="flex flex-col gap-2 border-r border-zinc-900/60 pr-2">
                <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {t.cockpitTitle}
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-zinc-300">
                  <div className="bg-black p-1.2 rounded border border-zinc-900">
                    <div className="text-[8px] text-zinc-500 uppercase">{t.posX}</div>
                    <div className="text-zinc-200 font-semibold text-xs">{cameraPos.x.toFixed(2)}</div>
                  </div>
                  <div className="bg-black p-1.2 rounded border border-zinc-900">
                    <div className="text-[8px] text-zinc-500 uppercase">{t.posY}</div>
                    <div className="text-zinc-200 font-semibold text-xs">{cameraPos.y.toFixed(2)}</div>
                  </div>
                  <div className="bg-black p-1.2 rounded border border-zinc-900">
                    <div className="text-[8px] text-zinc-500 uppercase">{t.posZ}</div>
                    <div className="text-zinc-200 font-semibold text-xs">{cameraPos.z.toFixed(2)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>{t.distCenter}</span>
                  <span className={`font-semibold ${distanceFromCenter < 1.0 ? 'text-indigo-400' : 'text-zinc-400'}`}>
                    {distanceFromCenter.toFixed(3)}
                    {distanceFromCenter < 1.0 ? ` (${t.interior})` : ` (${t.exterior})`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pb-0.5">
                  <span>{t.camState}</span>
                  {isLockedAtCore ? (
                    <span className="text-[8px] text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/30 animate-pulse uppercase">
                      {t.core360}
                    </span>
                  ) : (
                    <span className="text-zinc-500 uppercase text-[8px] font-bold bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">
                      {t.freeFlight}
                    </span>
                  )}
                </div>
              </div>

              {/* Interactive Keyboard Indicator & Touch Steering clicker */}
              <div className="flex flex-col items-center justify-center gap-1.5 border-r border-zinc-900/60 px-2">
                <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">{t.flightControls}</span>
                
                {/* WASD Layout Grid */}
                <div className="flex gap-4 items-center">
                  {/* Direction crosshair */}
                  <div className="grid grid-cols-3 gap-1">
                    <div></div>
                    <button
                      onMouseDown={() => startVirtualKey('w')}
                      onMouseUp={() => stopVirtualKey('w')}
                      onMouseLeave={() => stopVirtualKey('w')}
                      onTouchStart={(e) => { e.preventDefault(); startVirtualKey('w'); }}
                      onTouchEnd={() => stopVirtualKey('w')}
                      className={`w-7 h-7 rounded border select-none text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                        keysDown['w'] 
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 scale-95 font-black' 
                          : 'bg-black text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                      }`}
                      title={lang === "es" ? "Volar Adelante (W)" : "Fly Forward (W)"}
                    >
                      W
                    </button>
                    <div></div>

                    <button
                      onMouseDown={() => startVirtualKey('a')}
                      onMouseUp={() => stopVirtualKey('a')}
                      onMouseLeave={() => stopVirtualKey('a')}
                      onTouchStart={(e) => { e.preventDefault(); startVirtualKey('a'); }}
                      onTouchEnd={() => stopVirtualKey('a')}
                      className={`w-7 h-7 rounded border select-none text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                        keysDown['a'] 
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 scale-95 font-black' 
                          : 'bg-black text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                      }`}
                      title={lang === "es" ? "Volar Izquierda (A)" : "Fly Left (A)"}
                    >
                      A
                    </button>
                    <button
                      onMouseDown={() => startVirtualKey('s')}
                      onMouseUp={() => stopVirtualKey('s')}
                      onMouseLeave={() => stopVirtualKey('s')}
                      onTouchStart={(e) => { e.preventDefault(); startVirtualKey('s'); }}
                      onTouchEnd={() => stopVirtualKey('s')}
                      className={`w-7 h-7 rounded border select-none text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                        keysDown['s'] 
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 scale-95 font-black' 
                          : 'bg-black text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                      }`}
                      title={lang === "es" ? "Volar Atrás (S)" : "Fly Backward (S)"}
                    >
                      S
                    </button>
                    <button
                      onMouseDown={() => startVirtualKey('d')}
                      onMouseUp={() => stopVirtualKey('d')}
                      onMouseLeave={() => stopVirtualKey('d')}
                      onTouchStart={(e) => { e.preventDefault(); startVirtualKey('d'); }}
                      onTouchEnd={() => stopVirtualKey('d')}
                      className={`w-7 h-7 rounded border select-none text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                        keysDown['d'] 
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 scale-95 font-black' 
                          : 'bg-black text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                      }`}
                      title={lang === "es" ? "Volar Derecha (D)" : "Fly Right (D)"}
                    >
                      D
                    </button>
                  </div>

                  {/* Vertical control buttons */}
                  <div className="flex flex-col gap-1">
                    <button
                      onMouseDown={() => startVirtualKey('q')}
                      onMouseUp={() => stopVirtualKey('q')}
                      onMouseLeave={() => stopVirtualKey('q')}
                      onTouchStart={(e) => { e.preventDefault(); startVirtualKey('q'); }}
                      onTouchEnd={() => stopVirtualKey('q')}
                      className={`px-1.5 py-0.5 select-none text-[8px] font-mono rounded border flex items-center gap-1 transition cursor-pointer ${
                        keysDown['q'] 
                          ? 'bg-indigo-600 text-white border-indigo-400 scale-95 font-bold' 
                          : 'bg-black text-zinc-350 border-zinc-800 hover:text-white'
                      }`}
                      title={t.volateUp}
                    >
                      <ChevronUp className="w-2.5 h-2.5" />
                      Q / {t.subir}
                    </button>
                    <button
                      onMouseDown={() => startVirtualKey('e')}
                      onMouseUp={() => stopVirtualKey('e')}
                      onMouseLeave={() => stopVirtualKey('e')}
                      onTouchStart={(e) => { e.preventDefault(); startVirtualKey('e'); }}
                      onTouchEnd={() => stopVirtualKey('e')}
                      className={`px-1.5 py-0.5 select-none text-[8px] font-mono rounded border flex items-center gap-1 transition cursor-pointer ${
                        keysDown['e'] 
                          ? 'bg-indigo-600 text-white border-indigo-400 scale-95 font-bold' 
                          : 'bg-black text-zinc-350 border-zinc-800 hover:text-white'
                      }`}
                      title={t.volateDown}
                    >
                      <ChevronDown className="w-2.5 h-2.5" />
                      E / {t.bajar}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Resets and Info */}
              <div className="flex flex-col gap-1.5 pl-2">
                <div className="text-[10px] font-mono text-zinc-555 text-center md:text-left leading-normal">
                  {t.flyGuideText}
                </div>

                {/* Core View Button */}
                <button
                  onClick={() => {
                    setIsLockedAtCore(!isLockedAtCore);
                    if (!isLockedAtCore) {
                      // Stop auto rotation so they have stable look
                      setViewState(prev => ({ ...prev, autoRotate: false }));
                    }
                  }}
                  className={`w-full py-1 px-2.5 rounded border font-mono text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    isLockedAtCore
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-lg'
                      : 'border-zinc-800 bg-black text-zinc-350 hover:bg-zinc-900 hover:border-zinc-700'
                  }`}
                  id="btn-lock-core"
                >
                  <Eye className="w-3 h-3" />
                  {isLockedAtCore ? t.anchoredCoreActive : t.anchorCore}
                </button>

                {/* Reset Cockpit Button */}
                <button
                  onClick={() => {
                    setIsLockedAtCore(false);
                    resetCameraPosition();
                  }}
                  disabled={!isLockedAtCore && cameraPos.x === 0 && cameraPos.y === 0 && cameraPos.z === 0}
                  className={`w-full py-1 px-2.5 rounded border font-mono text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    !isLockedAtCore && cameraPos.x === 0 && cameraPos.y === 0 && cameraPos.z === 0
                      ? 'border-zinc-900 bg-zinc-950 text-zinc-650 cursor-not-allowed'
                      : 'border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300'
                  }`}
                >
                  <RotateCcw className="w-3 h-3" />
                  {t.resetPos}
                </button>

                {/* Developer credit line inside telemetry */}
                <div className="text-[9px] font-mono text-zinc-700 pt-1 border-t border-zinc-900/40 flex items-center justify-between w-full">
                  <span>© 2026</span>
                  <a href="https://2026.diegobogota.com" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-emerald-400 transition underline">
                    Diego Bogotá
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      </div>

    </div>
  );
}
