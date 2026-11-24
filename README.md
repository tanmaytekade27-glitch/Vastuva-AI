# VASTUVA AI — Smart Spaces. Inspired Living.

**Project:** AI-Based Home Layout Designer  
**Team:** THE TECH TITANS  
**College:** Madhav Institute of Technology and Science (MITS), Gwalior  
**Branch:** Computer Science and Design (CSD)  
**Team Members:**
- **Tanmay Tekade** — Enrollment No: `BTCD26O1145`
- **Pranav Salotkar** — Enrollment No: `BTCD26O1102`

---

## Overview

VASTUVA AI is a **100% free, offline-capable** residential space planning web application. It requires **no API keys, no paid AI subscriptions, and no database servers**. Everything runs locally in your browser.

### Core Capabilities
1. **5-Step Architectural Input Wizard**: Captures plot dimensions (with automatic Length × Width area comparison), floor configuration (`Ground Floor` to `G+3`), room counts, utility/Vastu preferences, design style, and budget tier.
2. **Algorithmic 2D Floor Plan Generator (`src/engine/floorplanGenerator.ts`)**: Computes buildable setbacks, wall/circulation allowances, vertical staircase/lift core alignment across floors, non-overlapping room geometry, door swing arcs, exterior windows, North compass orientation, and capacity warnings when rooms exceed plot bounds.
3. **Interactive 3D House Generator (`src/components/House3DViewer.tsx`)**: Uses **Three.js** to extrude a live 3D architectural model directly from the 2D floor-plan data—including walls, windows, doors, staircase steps, interior furniture, front garden, car parking bay, floor switching, camera presets, and Day/Night lighting.
4. **Construction Budget Calculator (`src/engine/budgetCalculator.ts`)**: Calculates approximate costs across 8 construction phases (Foundation, Structural RCC, Brickwork, Flooring, Electrical, Plumbing, Painting, Finishing) with customizable per-sq-ft rates.
5. **Local Save & Export**: Saves designs in `localStorage`, exports high-DPI **PNG** blueprints, and generates multi-section **PDF** reports via `jsPDF`.

---

## Free Open-Source Libraries Used
- **React + TypeScript + Vite** (Frontend UI & bundling)
- **Tailwind CSS** (Styling)
- **Three.js** (`three`) — Free MIT-licensed 3D WebGL engine
- **jsPDF** (`jspdf`) — Free MIT-licensed client-side PDF generator
- **Lucide React** (`lucide-react`) — Free ISC-licensed icon set

---

## Step-by-Step Visual Studio Code (VS Code) Setup

1. **Install Node.js (Free LTS version):**  
   Download and install Node.js from [https://nodejs.org](https://nodejs.org).
2. **Open the Project Folder in VS Code:**  
   Open VS Code → `File` → `Open Folder...` → select this project folder.
3. **Open the Integrated Terminal in VS Code:**  
   Press `` Ctrl + ` `` (or go to `Terminal` → `New Terminal`).
4. **Install Dependencies (one-time setup):**
   ```bash
   npm install
   ```
5. **Run the Local Development Server:**
   ```bash
   npm run dev
   ```
6. **Open in Your Browser:**  
   Click the local URL shown in the terminal (e.g., `http://localhost:3000`).  
   Once dependencies are installed, the entire application runs locally on your machine—even offline, with zero external API keys needed!

---

## Folder Structure

```text
VASTUVA-AI/
├── index.html
├── metadata.json
├── package.json
├── README.md
└── src/
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    ├── types/
    │   └── vastuva.ts
    ├── assets/
    │   └── images/
    ├── engine/
    │   ├── defaults.ts
    │   ├── floorplanGenerator.ts
    │   ├── floorplanGenerator.test.ts
    │   ├── budgetCalculator.ts
    │   ├── budgetCalculator.test.ts
    │   └── storage.ts
    └── components/
        ├── VastuLogo.tsx
        ├── Navbar.tsx
        ├── Footer.tsx
        ├── HomePage.tsx
        ├── DesignStudio.tsx
        ├── DesignWizard.tsx
        ├── FloorPlan2DCanvas.tsx
        ├── House3DViewer.tsx
        ├── BudgetCalculator.tsx
        ├── SavedDesignsPanel.tsx
        ├── AboutPage.tsx
        └── ContactPage.tsx
```
