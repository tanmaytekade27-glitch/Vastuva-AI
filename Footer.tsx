import React from 'react';
import { AppSection } from '../types/vastuva';
import { VastuLogo } from './VastuLogo';

interface FooterProps {
  onNavigate: (section: AppSection, anchorId?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-[#172B36]/15 bg-[#172B36] text-[#F4EFE6]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <VastuLogo size={40} variant="light" />
              <div>
                <p className="font-display text-2xl font-bold tracking-tight text-white">
                  VASTUVA AI
                </p>
                <p className="text-xs tracking-wide text-[#C49A60]">
                  Smart Spaces. Inspired Living.
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#F4EFE6]/75">
              An offline-capable residential space planner combining algorithmic 2D floor plan generation, real-time Three.js 3D house modeling, and transparent Indian construction budgeting.
            </p>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-sm font-semibold text-white">Navigation</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#F4EFE6]/75">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home', 'top')}
                  className="transition-colors hover:text-[#C49A60]"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('design')}
                  className="transition-colors hover:text-[#C49A60]"
                >
                  Design Your Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home', 'features')}
                  className="transition-colors hover:text-[#C49A60]"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home', 'how-it-works')}
                  className="transition-colors hover:text-[#C49A60]"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="transition-colors hover:text-[#C49A60]"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="transition-colors hover:text-[#C49A60]"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h3 className="text-sm font-semibold text-white">Project & Team</h3>
            <div className="mt-4 space-y-2 text-sm text-[#F4EFE6]/75">
              <p className="font-medium text-[#C49A60]">THE TECH TITANS</p>
              <p>Computer Science and Design (CSD)</p>
              <p>Madhav Institute of Technology and Science, MITS Gwalior</p>
              <p className="pt-2 text-xs text-[#F4EFE6]/60">
                Tanmay Tekade (BTCD26O1145) · Pranav Salotkar (BTCD26O1102)
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-[#F4EFE6]/60 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} VASTUVA AI · Built by The Tech Titans, MITS Gwalior.</p>
          <p>Free, offline-capable architectural planning software.</p>
        </div>
      </div>
    </footer>
  );
};
