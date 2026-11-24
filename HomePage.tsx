import React, { useState } from 'react';
import { ArrowRight, Compass, Layers, Ruler, Box, Calculator, FolderOpen } from 'lucide-react';
import { AppSection, SavedProject } from '../types/vastuva';
import { formatINRLakhs } from '../engine/budgetCalculator';

interface HomePageProps {
  savedProjects: SavedProject[];
  onStartDesigning: () => void;
  onLoadProject: (project: SavedProject) => void;
  onNavigate: (section: AppSection, anchorId?: string) => void;
}

const HERO_IMG = '/src/assets/images/hero_indian_villa_1795526449777.jpg';
const TRANSFORM_IMG = '/src/assets/images/blueprint_to_model_1795526451535.jpg';
const COURTYARD_IMG = '/src/assets/images/courtyard_living_space_1795526450947.jpg';

export const HomePage: React.FC<HomePageProps> = ({
  savedProjects,
  onStartDesigning,
  onLoadProject,
  onNavigate,
}) => {
  const [heroError, setHeroError] = useState(false);
  const [transformError, setTransformError] = useState(false);
  const [courtyardError, setCourtyardError] = useState(false);
  const [previewMode, setPreviewMode] = useState<'2d' | '3d'>('2d');

  return (
    <div id="top">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#172B36]/10 bg-[#FAF7F2]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Editorial Column */}
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-sm font-medium tracking-wide text-[#9F7840]">
                VASTUVA AI · Smart Spaces. Inspired Living.
              </p>
              <h1
                className="mt-4 font-display text-4xl font-bold leading-[1.08] tracking-tight text-[#172B36] sm:text-5xl lg:text-[3.5rem]"
                style={{ textWrap: 'balance' }}
              >
                Design Your Dream Home With Intelligence.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#172B36]/80 sm:text-lg">
                Transform your plot into your dream home with intelligent space planning, beautiful 2D floor plans and immersive 3D visualization.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onStartDesigning}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#172B36] px-6 py-3 text-sm font-semibold text-[#FAF7F2] transition-colors duration-150 hover:bg-[#0F1E26] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C49A60] whitespace-nowrap"
                >
                  Start Designing
                  <ArrowRight className="h-4 w-4 text-[#C49A60]" />
                </button>
                <a
                  href="#features"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('home', 'features');
                  }}
                  className="inline-flex min-h-[44px] items-center rounded-lg border border-[#172B36]/20 bg-white px-6 py-3 text-sm font-semibold text-[#172B36] transition-colors duration-150 hover:border-[#C49A60] hover:bg-[#F4EFE6] whitespace-nowrap"
                >
                  Explore Features
                </a>
              </div>

              <div className="mt-10 border-t border-[#172B36]/10 pt-6">
                <p className="text-xs font-medium text-[#667C70]">
                  Built for Indian residential plots · Ground to G+3 multi-floor solver · 100% browser-based & offline ready
                </p>
              </div>
            </div>

            {/* Right Hero Architectural Photography */}
            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[320px] overflow-hidden rounded-xl border border-[#172B36]/12 bg-[#172B36]">
                {!heroError ? (
                  <img
                    src={HERO_IMG}
                    alt="Contemporary luxury Indian residence with warm sandstone cladding, teak louvers, and courtyard pond at twilight"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroError(true)}
                    className="h-full w-full object-cover lg:min-h-[460px]"
                  />
                ) : (
                  <div className="flex h-full min-h-[360px] flex-col items-center justify-center bg-gradient-to-br from-[#172B36] via-[#223B48] to-[#0F1E26] p-8 text-center text-[#F4EFE6]">
                    <Compass className="h-12 w-12 text-[#C49A60]" />
                    <p className="mt-4 font-display text-2xl font-semibold">Modern Indian Courtyard Residence</p>
                    <p className="mt-2 max-w-sm text-sm text-[#F4EFE6]/70">
                      Sandstone facades, shaded teak louvers, and Vastu-aligned living zones.
                    </p>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0F1E26]/85 via-[#0F1E26]/35 to-transparent p-6">
                  <p className="text-xs font-medium text-[#C49A60]">
                    Modern Indian Architectural Study
                  </p>
                  <p className="mt-1 text-sm text-white/95">
                    Balanced setbacks, cross-ventilation corridors, and solar-responsive elevations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4-column Architectural KPI Strip below Hero split */}
          <div className="mt-12 grid grid-cols-2 gap-6 border-t border-[#172B36]/10 pt-8 md:grid-cols-4">
            <div>
              <p className="font-mono text-2xl font-semibold text-[#172B36] tabular-nums">G to G+3</p>
              <p className="mt-1 text-xs text-[#667C70]">Multi-floor core alignment</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold text-[#172B36] tabular-nums">Real 2D</p>
              <p className="mt-1 text-xs text-[#667C70]">Algorithmic Canvas blueprints</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold text-[#172B36] tabular-nums">Live 3D</p>
              <p className="mt-1 text-xs text-[#667C70]">Three.js geometry from layout</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold text-[#172B36] tabular-nums">Zero APIs</p>
              <p className="mt-1 text-xs text-[#667C70]">Free & offline in your browser</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2D-to-3D Transformation Preview Section */}
      <section className="border-b border-[#172B36]/10 bg-[#F4EFE6] py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="overflow-hidden rounded-xl border border-[#172B36]/12 bg-white">
                {!transformError ? (
                  <img
                    src={TRANSFORM_IMG}
                    alt="Architectural 2D floor plan transitioning into a 3D wooden and white scale model on a drafting table"
                    referrerPolicy="no-referrer"
                    onError={() => setTransformError(true)}
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-[#172B36] text-[#F4EFE6]">
                    <Box className="h-12 w-12 text-[#C49A60]" />
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-6">
              <p className="text-sm font-medium text-[#9F7840]">Unified Spatial Pipeline</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#172B36] sm:text-4xl">
                From Plot Dimensions to 2D Blueprint &amp; 3D Model
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#172B36]/80">
                Every wall, door swing, staircase flight, and garden setback calculated in the 2D blueprint directly extrudes into the interactive 3D house model.
              </p>

              {/* Interactive 2D / 3D Live Preview Switcher */}
              <div className="mt-6 rounded-xl border border-[#172B36]/12 bg-white p-5">
                <div className="flex items-center justify-between gap-4 border-b border-[#172B36]/10 pb-3">
                  <span className="text-xs font-semibold text-[#172B36]">
                    Transformation Preview · 30 × 50 ft East Plot
                  </span>
                  <div className="flex items-center gap-1 rounded-lg bg-[#F4EFE6] p-1">
                    <button
                      type="button"
                      onClick={() => setPreviewMode('2d')}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                        previewMode === '2d'
                          ? 'bg-[#172B36] text-white'
                          : 'text-[#172B36]/75 hover:text-[#172B36]'
                      }`}
                    >
                      2D Blueprint
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('3d')}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                        previewMode === '3d'
                          ? 'bg-[#172B36] text-white'
                          : 'text-[#172B36]/75 hover:text-[#172B36]'
                      }`}
                    >
                      3D Volume
                    </button>
                  </div>
                </div>

                {previewMode === '2d' ? (
                  <div className="mt-4 bg-architectural-grid rounded-lg border border-[#172B36]/10 p-4">
                    <svg viewBox="0 0 360 190" className="h-44 w-full" aria-label="Schematic 2D floor plan preview">
                      <rect x="20" y="12" width="320" height="166" fill="#FAF7F2" stroke="#172B36" strokeWidth="2.5" />
                      <rect x="20" y="12" width="120" height="82" fill="#E4EAE6" stroke="#172B36" strokeWidth="1.5" />
                      <rect x="140" y="12" width="90" height="82" fill="#F2E2CF" stroke="#172B36" strokeWidth="1.5" />
                      <rect x="230" y="12" width="110" height="82" fill="#EFE7D6" stroke="#172B36" strokeWidth="1.5" />
                      <rect x="20" y="94" width="75" height="84" fill="#D9D5CC" stroke="#172B36" strokeWidth="1.5" />
                      <rect x="95" y="94" width="155" height="84" fill="#EDE4D3" stroke="#172B36" strokeWidth="1.5" />
                      <rect x="250" y="94" width="90" height="84" fill="#D4E2D4" stroke="#172B36" strokeWidth="1.5" />
                      <text x="80" y="55" textAnchor="middle" fontSize="9" fill="#172B36" fontWeight="600">MASTER BED</text>
                      <text x="185" y="55" textAnchor="middle" fontSize="9" fill="#172B36" fontWeight="600">KITCHEN</text>
                      <text x="285" y="55" textAnchor="middle" fontSize="9" fill="#172B36" fontWeight="600">DINING</text>
                      <text x="57" y="138" textAnchor="middle" fontSize="9" fill="#172B36" fontWeight="600">STAIRS</text>
                      <text x="172" y="138" textAnchor="middle" fontSize="9" fill="#172B36" fontWeight="600">LIVING HALL</text>
                      <text x="295" y="138" textAnchor="middle" fontSize="9" fill="#172B36" fontWeight="600">COURTYARD</text>
                      {/* Door swing accent */}
                      <path d="M 140 94 A 18 18 0 0 1 158 76" fill="none" stroke="#C49A60" strokeWidth="1.5" />
                    </svg>
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-[#172B36]/10 bg-[#172B36] p-4">
                    <svg viewBox="0 0 360 190" className="h-44 w-full" aria-label="Isometric 3D architectural massing preview">
                      {/* Isometric ground plinth */}
                      <polygon points="180,172 320,122 180,72 40,122" fill="#223B48" stroke="#C49A60" strokeWidth="1" />
                      {/* Ground floor volume */}
                      <polygon points="75,112 180,150 180,104 75,66" fill="#FAF7F2" stroke="#172B36" strokeWidth="1.2" />
                      <polygon points="180,150 285,112 285,66 180,104" fill="#E3DACB" stroke="#172B36" strokeWidth="1.2" />
                      {/* First floor overhang */}
                      <polygon points="90,62 180,95 180,55 90,22" fill="#FFFFFF" stroke="#172B36" strokeWidth="1.2" />
                      <polygon points="180,95 270,62 270,22 180,55" fill="#D9CFBE" stroke="#172B36" strokeWidth="1.2" />
                      <polygon points="180,55 270,22 180,-8 90,22" transform="translate(0, 12)" fill="#C49A60" opacity="0.9" stroke="#172B36" strokeWidth="1.2" />
                      {/* Glazing accents */}
                      <polygon points="115,118 155,132 155,105 115,91" fill="#667C70" opacity="0.8" />
                      <polygon points="205,132 245,118 245,91 205,105" fill="#667C70" opacity="0.8" />
                    </svg>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between text-xs text-[#667C70]">
                  <span>Exact room coordinates shared across 2D &amp; 3D engines</span>
                  <button
                    type="button"
                    onClick={onStartDesigning}
                    className="font-semibold text-[#172B36] underline decoration-[#C49A60] underline-offset-4 hover:text-[#9F7840]"
                  >
                    Open Studio
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section (Asymmetric Bento Grid) */}
      <section id="features" className="border-b border-[#172B36]/10 bg-[#FAF7F2] py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[#9F7840]">Capabilities</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#172B36] sm:text-4xl">
              Precision Engineering Meets Indian Residential Design
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-12">
            <article className="rounded-xl border border-[#172B36]/12 bg-white p-7 md:col-span-7">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#172B36]">
                  01. Algorithmic 2D Floor Plan Solver
                </h3>
                <Ruler className="h-5 w-5 text-[#C49A60]" />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#172B36]/75">
                Reads your exact plot width and length, reserves perimeter setbacks and wall thickness, aligns staircases and lifts across G to G+3 floors, places doors and exterior windows, and warns you cleanly if requirements exceed buildable area.
              </p>
            </article>

            <article className="rounded-xl border border-[#172B36]/12 bg-white p-7 md:col-span-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#172B36]">
                  02. Interactive 3D House Model
                </h3>
                <Box className="h-5 w-5 text-[#C49A60]" />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#172B36]/75">
                Extrudes a real Three.js architectural model directly from the 2D layout—complete with walls, glazed windows, furniture, parking bay, garden trees, floor isolation, and Day/Night lighting.
              </p>
            </article>

            <article className="rounded-xl border border-[#172B36]/12 bg-white p-7 md:col-span-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#172B36]">
                  03. Vastu &amp; Orientation Compass
                </h3>
                <Compass className="h-5 w-5 text-[#C49A60]" />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#172B36]/75">
                Dynamic North compass rotation calibrated to your road facing direction, prioritizing natural daylight, ventilation, and quiet sacred zones.
              </p>
            </article>

            <article className="rounded-xl border border-[#172B36]/12 bg-white p-7 md:col-span-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#172B36]">
                  04. Construction Cost Estimator
                </h3>
                <Calculator className="h-5 w-5 text-[#C49A60]" />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#172B36]/75">
                Breaks down foundation, RCC structure, brickwork, flooring, electrical, plumbing, painting, and finishing with editable per-sq-ft rates.
              </p>
            </article>

            <article className="rounded-xl border border-[#172B36]/12 bg-white p-7 md:col-span-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#172B36]">
                  05. Offline Save &amp; PNG / PDF Export
                </h3>
                <Layers className="h-5 w-5 text-[#C49A60]" />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#172B36]/75">
                Save unlimited home configurations locally in browser storage and export crisp PNG blueprints or multi-section PDF architectural summaries.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-b border-[#172B36]/10 bg-[#F4EFE6] py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-sm font-medium text-[#9F7840]">Workflow</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#172B36] sm:text-4xl">
                Four Steps From Raw Plot to Walkable 3D Architecture
              </h2>

              <div className="mt-8 space-y-6">
                {[
                  {
                    step: '01',
                    title: 'Define Plot Geometry & Road Access',
                    desc: 'Enter plot length, width, total area, facing direction, and road width with instant area verification.',
                  },
                  {
                    step: '02',
                    title: 'Select Floors, Rooms & Lifestyle Needs',
                    desc: 'Choose Ground to G+3 floors, bedrooms, bathrooms, pooja room, parking, lift, Vastu, and aesthetic style.',
                  },
                  {
                    step: '03',
                    title: 'Generate & Inspect 2D Blueprints',
                    desc: 'Zoom, pan, switch floors, regenerate layout variations, and verify exact room dimensions.',
                  },
                  {
                    step: '04',
                    title: 'Explore 3D Model, Budget & Export',
                    desc: 'Orbit the live Three.js model in Day or Night mode, fine-tune construction rates, and download PNG or PDF.',
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex gap-5 border-b border-[#172B36]/10 pb-5 last:border-b-0 last:pb-0"
                  >
                    <span className="font-mono text-lg font-semibold text-[#9F7840] tabular-nums">
                      {item.step}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-[#172B36]">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-[#172B36]/75">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-xl border border-[#172B36]/12 bg-white">
                {!courtyardError ? (
                  <img
                    src={COURTYARD_IMG}
                    alt="Sunlit Indian minimalist living room opening to an internal garden courtyard with wooden jali shadows"
                    referrerPolicy="no-referrer"
                    onError={() => setCourtyardError(true)}
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-[#667C70] text-white">
                    <Compass className="h-12 w-12" />
                  </div>
                )}
                <div className="p-5">
                  <p className="text-sm font-semibold text-[#172B36]">
                    Designed for Light, Air &amp; Proportion
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#667C70]">
                    Every generated floor plan prioritizes perimeter window access and cohesive living-dining circulation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Saved Designs Quick Strip (if any exist) */}
      {savedProjects.length > 0 && (
        <section className="border-b border-[#172B36]/10 bg-[#FAF7F2] py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#172B36]">
                  Your Saved Home Designs
                </h2>
                <p className="text-sm text-[#667C70]">
                  Stored locally in your browser · Click any project to reopen its 2D &amp; 3D studio.
                </p>
              </div>
              <button
                type="button"
                onClick={onStartDesigning}
                className="text-sm font-semibold text-[#172B36] underline decoration-[#C49A60] underline-offset-4"
              >
                Create New Design
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedProjects.slice(0, 3).map((proj) => (
                <div
                  key={proj.id}
                  className="flex flex-col justify-between rounded-xl border border-[#172B36]/12 bg-white p-5"
                >
                  <div>
                    <h3 className="font-semibold text-[#172B36]">{proj.input.projectName}</h3>
                    <p className="mt-1 text-xs text-[#667C70]">
                      {proj.input.plot.widthFt} × {proj.input.plot.lengthFt} ft · {proj.input.floors.floorConfig} · {proj.input.design.style}
                    </p>
                    <p className="mt-2 font-mono text-sm font-medium text-[#172B36] tabular-nums">
                      {proj.totalBuiltUpAreaSqFt.toLocaleString()} sq ft · Est. {formatINRLakhs(proj.estimatedCost)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onLoadProject(proj)}
                    className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#9F7840] hover:text-[#172B36]"
                  >
                    <FolderOpen className="h-4 w-4" />
                    Open in Studio
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
