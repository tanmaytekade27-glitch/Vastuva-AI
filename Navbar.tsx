import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AppSection } from '../types/vastuva';
import { VastuLogo } from './VastuLogo';

interface NavbarProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection, anchorId?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeSection, onNavigate }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLink = (section: AppSection, anchorId?: string) => {
    setMobileOpen(false);
    onNavigate(section, anchorId);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#172B36]/10 bg-[#FAF7F2]/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleLink('home', 'top')}
          className="flex shrink-0 items-center gap-2.5 text-left whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C49A60]"
        >
          <VastuLogo size={34} />
          <span className="font-display text-xl font-bold tracking-tight text-[#172B36] whitespace-nowrap shrink-0">
            VASTUVA AI
          </span>
        </button>

        {/* Zone 2: Concise single-line Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-6 lg:flex"
        >
          <button
            type="button"
            onClick={() => handleLink('home', 'top')}
            className={`whitespace-nowrap shrink-0 border-b-2 py-1 text-sm font-medium transition-colors duration-150 ${
              activeSection === 'home'
                ? 'border-[#C49A60] text-[#172B36]'
                : 'border-transparent text-[#172B36]/75 hover:border-[#C49A60]/50 hover:text-[#172B36]'
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => handleLink('design')}
            className={`whitespace-nowrap shrink-0 border-b-2 py-1 text-sm font-medium transition-colors duration-150 ${
              activeSection === 'design'
                ? 'border-[#C49A60] text-[#172B36]'
                : 'border-transparent text-[#172B36]/75 hover:border-[#C49A60]/50 hover:text-[#172B36]'
            }`}
          >
            Design Your Home
          </button>
          <button
            type="button"
            onClick={() => handleLink('home', 'features')}
            className="whitespace-nowrap shrink-0 border-b-2 border-transparent py-1 text-sm font-medium text-[#172B36]/75 transition-colors duration-150 hover:border-[#C49A60]/50 hover:text-[#172B36]"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => handleLink('home', 'how-it-works')}
            className="whitespace-nowrap shrink-0 border-b-2 border-transparent py-1 text-sm font-medium text-[#172B36]/75 transition-colors duration-150 hover:border-[#C49A60]/50 hover:text-[#172B36]"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => handleLink('about')}
            className={`whitespace-nowrap shrink-0 border-b-2 py-1 text-sm font-medium transition-colors duration-150 ${
              activeSection === 'about'
                ? 'border-[#C49A60] text-[#172B36]'
                : 'border-transparent text-[#172B36]/75 hover:border-[#C49A60]/50 hover:text-[#172B36]'
            }`}
          >
            About Us
          </button>
          <button
            type="button"
            onClick={() => handleLink('contact')}
            className={`whitespace-nowrap shrink-0 border-b-2 py-1 text-sm font-medium transition-colors duration-150 ${
              activeSection === 'contact'
                ? 'border-[#C49A60] text-[#172B36]'
                : 'border-transparent text-[#172B36]/75 hover:border-[#C49A60]/50 hover:text-[#172B36]'
            }`}
          >
            Contact
          </button>
        </nav>

        {/* Zone 3: Single Primary Action + Mobile Menu Trigger */}
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => handleLink('design')}
            className="hidden whitespace-nowrap shrink-0 rounded-lg bg-[#172B36] px-5 py-2.5 text-sm font-medium text-[#FAF7F2] transition-colors duration-150 hover:bg-[#0F1E26] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C49A60] sm:inline-flex"
          >
            Start Designing
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#172B36]/15 text-[#172B36] transition-colors hover:bg-[#172B36]/5 lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-[#172B36]/10 bg-[#FAF7F2] px-4 py-3 lg:hidden"
        >
          <div className="flex flex-col gap-1">
            {[
              { label: 'Home', section: 'home' as AppSection, anchor: 'top' },
              { label: 'Design Your Home', section: 'design' as AppSection },
              { label: 'Features', section: 'home' as AppSection, anchor: 'features' },
              { label: 'How It Works', section: 'home' as AppSection, anchor: 'how-it-works' },
              { label: 'About Us', section: 'about' as AppSection },
              { label: 'Contact', section: 'contact' as AppSection },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleLink(item.section, item.anchor)}
                className="min-h-[44px] rounded-lg px-3 py-2 text-left text-sm font-medium text-[#172B36] transition-colors hover:bg-[#172B36]/5"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleLink('design')}
              className="mt-2 min-h-[44px] rounded-lg bg-[#172B36] px-4 py-2.5 text-center text-sm font-medium text-[#FAF7F2]"
            >
              Start Designing
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};
