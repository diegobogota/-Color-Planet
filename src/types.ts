export interface HSL {
  h: number; // 0 to 360
  s: number; // 0 to 100
  l: number; // 0 to 100
}

export interface RGB {
  r: number; // 0 to 255
  g: number; // 0 to 255
  b: number; // 0 to 255
}

export interface CMYK {
  c: number; // 0 to 100
  m: number; // 0 to 100
  y: number; // 0 to 100
  k: number; // 0 to 100
}

export interface ColorDetailsData {
  hex: string;
  hsl: HSL;
  rgb: RGB;
  cmyk: CMYK;
  name: string;
  category: string;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
  r: number;       // distance from center (0 to 1)
  theta: number;   // inclination angle (0 to PI)
  phi: number;     // azimuth angle (0 to 2PI)
  hsl: HSL;
  rgb: RGB;
  hex: string;
  pointId: string; // unique ID
}

export interface ProjectivePoint {
  point: Point3D;
  px: number; // projected screen x
  py: number; // projected screen y
  pz: number; // depth value for sorting
}

export interface ViewState {
  rx: number;      // rotation around X-axis
  ry: number;      // rotation around Y-axis
  zoom: number;    // zoom multiplier
  autoRotate: boolean;
  sliceMode: 'full' | 'half' | 'wedge' | 'quarter';
  viewMode: 'dots' | 'rays' | 'hybrid';
  layerFilter: number | null; // null for all, or 0-100 step of luminance
  hueFilter: number | null;   // null for all, or 0-360 value
  saturationDecay: boolean;
  saturationBase: number;     // max saturation at center
  atmosphereOpacity: number;  // 0 to 100
}
