# 🪐 Esfera Cromática 3D / Color Planet

**3D Color Planet Palette, a new way of visualizing the color wheel in HSL.**

Color Planet transforms the flat, traditional color wheel into a fully interactive 3D spatial experience. By mapping Hue, Saturation, and Lightness (HSL) to a three-dimensional globe, this tool allows designers and developers to intuitively explore color relationships, generate palettes, and visualize harmony in a tangible way.

---

## ✨ Key Features

* **Spherical HSL Mapping:** Navigate Hue revolving around the equator, Lightness from pole to pole, and Saturation radiating from the core outward to the atmosphere.
* **Interactive 3D UI & Flight Cockpit:** Fly through the color sphere! Use smooth, low-latency drag-and-rotate controls or activate the custom telemetry cockpit panel using WASD/Arrow keys with dynamic speeds to navigate between nodes.
* **Inspect & Export ("Ficha de Inspección"):** Click any color node to reveal a slide-out drawer containing full spectral analytical data. Copy HEX, RGB, and HSL values instantly to your clipboard.
* **Smart Outside Dismissal:** Seamlessly close the inspecting drawer by clicking anywhere on the outside backdrop.
* **Unified Overlays & Header Depth:** Floating panels and settings overlays are stacked intelligently to appear clearly above the navigation header.
* **Global Parameters Control with Reset:** Toggle options like auto-rotation, Slice Mode (Full, Half-Sphere, Quarter-Sphere), View mode (Solid/Hybrid), layer filters, and saturation decay. Easily restore default configurations with the new global **Reset Button**.
* **Bilingual Experience:** Fluid, real-time toggling between English (US) and Spanish (ES).

---

## 🛠 Tech Stack

* **Framework:** React 19 (TypeScript) + Vite 6
* **3D Projection / Graphic Rendering:** Custom high-performance 3D projection on HTML5 `Canvas` and low-latency rendering engine
* **Animations & Micro-interactions:** `motion` (by Framer Motion) for smooth UI transitions
* **Styling:** Tailwind CSS v4
* **Iconography:** Lucide-React

---

## 🚀 Getting Started

### 1. Installation

Install all node dependencies:
```bash
npm install
```

### 2. Run Locally (Development)

Start the Vite development server:
```bash
npm run dev
```
Open `http://localhost:3000` to interact with the Color Planet.

### 3. Production Build

Build and bundle static assets for optimal production rendering:
```bash
npm run build
```
Validate compiled resources with:
```bash
npm run preview
```
