import React from 'react';
import { GraduationCap, Compass, Layers } from 'lucide-react';

interface TeamMember {
  name: string;
  initials: string;
  enrollment: string;
  branch: string;
  college: string;
  focus: string;
  photo: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Tanmay Tekade',
    initials: 'TT',
    photo: ' /tanmay.jpg',
    enrollment: 'BTCD26O1145',
    branch: 'Computer Science and Design (CSD)',
    college: 'Madhav Institute of Technology and Science, MITS Gwalior',
    focus: 'Algorithmic Spatial Planning, 2D Blueprint Engine & Architectural Systems',
  },
  {
    name: 'Pranav Salotkar',
    initials: 'PS',
    enrollment: 'BTCD26O1102',
    photo: ' /pranav.jpg',
    branch: 'Computer Science and Design (CSD)',
    college: 'Madhav Institute of Technology and Science, MITS Gwalior',
    focus: '3D Three.js House Visualization, UI/UX Architecture & Budget Modeling',
  },
];

export const AboutPage: React.FC = () => {
  return (
    <div className="bg-[#FAF7F2] py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-[#9F7840]">About Our Team</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[#172B36] sm:text-5xl">
            THE TECH TITANS
          </h1>
          <p className="mt-3 text-sm font-semibold text-[#667C70]">
            Madhav Institute of Technology and Science, MITS Gwalior · Computer Science and Design (CSD)
          </p>
          <p className="mt-5 text-base leading-relaxed text-[#172B36]/85">
            We are The Tech Titans, a team of Computer Science and Design students at MITS Gwalior. Our goal is to combine technology, creativity and intelligent space planning to make dream-home designing easier and more accessible.
          </p>
        </div>

        {/* Team Member Profile Cards (clean architectural portrait placeholders, zero fake photos) */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          {TEAM_MEMBERS.map((member) => (
            <article
              key={member.enrollment}
              className="flex flex-col justify-between rounded-xl border border-[#172B36]/12 bg-white p-7"
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                {/* Architectural Monogram Portrait Placeholder */}
                <div
                  className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-xl border border-[#C49A60]/50 bg-[#172B36] text-[#F4EFE6]"
                  aria-label={`Portrait placeholder for ${member.name}`}
                >
                  <img
                  src={member.photo}
                  alt={member.name}
                  className="relative z-10 w-full h-full object-cover rounded-2x1"/>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-[#172B36]">
                    {member.name}
                  </h2>
                  <p className="mt-1 font-mono text-sm font-semibold text-[#9F7840] tabular-nums">
                    Enrollment No: {member.enrollment}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#172B36]">{member.branch}</p>
                  <p className="mt-0.5 text-xs text-[#667C70]">{member.college}</p>
                </div>
              </div>

              <div className="mt-6 border-t border-[#172B36]/10 pt-4 text-sm text-[#172B36]/80">
                <span className="font-semibold text-[#172B36]">Contribution: </span>
                {member.focus}
              </div>
            </article>
          ))}
        </div>

        {/* Project Philosophy Strip */}
        <div className="mt-12 grid grid-cols-1 gap-6 rounded-xl border border-[#172B36]/12 bg-[#172B36] p-8 text-[#F4EFE6] md:grid-cols-3">
          <div>
            <GraduationCap className="h-6 w-6 text-[#C49A60]" />
            <h3 className="mt-3 text-base font-semibold text-white">Academic Engineering</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#F4EFE6]/75">
              Built as a completely transparent, zero-subscription residential space planner powered by computational geometry.
            </p>
          </div>
          <div>
            <Compass className="h-6 w-6 text-[#C49A60]" />
            <h3 className="mt-3 text-base font-semibold text-white">Indian Plot Context</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#F4EFE6]/75">
              Tailored for standard Indian residential plots (sq ft dimensions, G to G+3 levels, pooja room, Vastu orientation, and INR estimates).
            </p>
          </div>
          <div>
            <Layers className="h-6 w-6 text-[#C49A60]" />
            <h3 className="mt-3 text-base font-semibold text-white">100% Free &amp; Offline</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#F4EFE6]/75">
              Every 2D floor plan, 3D Three.js house model, PDF report, and saved project runs directly inside your browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
