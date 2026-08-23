import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Terminal,
  Database,
  Cpu,
  Server,
  Layout,
  Play,
  FolderUp,
  Check,
  AlertTriangle,
  Menu,
  X,
  FileCode,
  LineChart,
  HelpCircle,
  ShieldCheck,
  Binary,
  Layers,
  Loader2,
  LogOut
} from 'lucide-react';
import { PacmanIcon, GhostIcon, PelletIcon, GithubIcon } from './components/PixelArt';
import { login, getCurrentUser, logout, type AuthUser } from './api/auth';
import { getToken } from './api/client';
import {
  listPresentations,
  createPresentation,
  publishPresentation,
  type Presentation,
} from './api/presentations';
import { uploadFiles } from './api/files';
import { getDashboard, type AdminDashboard } from './api/admin';
import { listUsers, createUser, changeUserRole, removeUser, type ManagedUser } from './api/users';

// ----------------------------------------------------
// PROJECT CURRENT PHASE CONFIGURATION
// Change this value to update the team's project progress.
// Options: 'FOUNDATIONS' | 'INGESTION' | 'BASELINES' | 'MODELING' | 'DASHBOARD' | 'FINAL EVALUATION'
// ----------------------------------------------------
export const CURRENT_PHASE: 'FOUNDATIONS' | 'INGESTION' | 'BASELINES' | 'MODELING' | 'DASHBOARD' | 'FINAL EVALUATION' = 'FOUNDATIONS';

interface Phase {
  name: 'FOUNDATIONS' | 'INGESTION' | 'BASELINES' | 'MODELING' | 'DASHBOARD' | 'FINAL EVALUATION';
  weeks: string;
  tasks: string[];
}

const phases: Phase[] = [
  { name: 'FOUNDATIONS', weeks: 'WEEKS 1–3', tasks: ['Literature review', 'Repository selection', 'Hypotheses', 'Data schema'] },
  { name: 'INGESTION', weeks: 'WEEKS 4–6', tasks: ['Pipeline build', 'Bot filtering', 'Data cleaning', 'Reproducible dataset'] },
  { name: 'BASELINES', weeks: 'WEEKS 7–9', tasks: ['Descriptive analysis', 'Baseline models'] },
  { name: 'MODELING', weeks: 'WEEKS 10–12', tasks: ['Hierarchical modeling', 'Uncertainty estimation', 'Controlled/injected-shift experiments'] },
  { name: 'DASHBOARD', weeks: 'WEEKS 13–15', tasks: ['Hosted dashboard', 'Explanations', 'Repository comparison', 'User testing'] },
  { name: 'FINAL EVALUATION', weeks: 'WEEKS 16–17', tasks: ['Held-out evaluation', 'System testing', 'Documentation', 'Deployment', 'Final report'] }
];

export function RoadmapSection() {
  const targetIndex = phases.findIndex(p => p.name === CURRENT_PHASE);
  const [pacmanIndex, setPacmanIndex] = useState(-1);
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(targetIndex);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setPacmanIndex(targetIndex);
      return;
    }
    
    // Start at -1 (entrance of track) for travel animation
    setPacmanIndex(-1);
    
    const delayTimer = setTimeout(() => {
      let current = -1;
      const interval = setInterval(() => {
        if (current < targetIndex) {
          current++;
          setPacmanIndex(current);
        } else {
          clearInterval(interval);
        }
      }, 500); // Step duration
      return () => clearInterval(interval);
    }, 500); // 500ms initial delay

    return () => clearTimeout(delayTimer);
  }, [targetIndex, prefersReducedMotion]);

  const activePhase = phases[selectedPhaseIndex];

  return (
    <section className="space-y-8">
      <div className="text-center">
        <h2 className="font-press-start text-lg text-white">ROADMAP</h2>
        <p className="font-press-start text-[10px] text-[#ffeb3b] mt-2">17 WEEKS. 6 PHASES. ONE AUDIT.</p>
        <div className="w-12 h-1 bg-[#2121de] mx-auto mt-3"></div>
      </div>

      {/* Phase Details Arcade Panel */}
      <div className="arcade-card p-6 max-w-xl mx-auto border-2 border-[#2121de]">
        <div className="flex justify-between items-center border-b border-[#2121de]/60 pb-3 mb-4">
          <div>
            <span className="font-press-start text-[9px] text-[#ffeb3b] block">PHASE {selectedPhaseIndex + 1}</span>
            <h3 className="font-press-start text-xs text-white mt-1">{activePhase.name}</h3>
          </div>
          <span className="font-vt323 text-lg text-[#6b7280]">{activePhase.weeks}</span>
        </div>
        <ul className="list-none space-y-2 text-left font-sans text-xs">
          {activePhase.tasks.map((task) => (
            <li key={task} className="flex items-center gap-2">
              <span className="text-[#ffeb3b] font-press-start text-[8px]">▪</span>
              <span className="text-[#fdfdcb]/90">{task}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Desktop Horizontal Roadmap */}
      <div className="relative w-full py-12 hidden md:block max-w-4xl mx-auto px-10">
        
        {/* Layer 1: Status Badges (Top) */}
        <div className="flex justify-between w-full mb-6">
          {phases.map((phase, idx) => {
            const isCompleted = idx < targetIndex;
            const isCurrent = idx === targetIndex;
            return (
              <div key={`badge-${phase.name}`} className="w-[120px] text-center">
                <span className={`inline-block font-press-start text-[8px] px-1.5 py-0.5 border ${
                  isCurrent 
                    ? 'text-[#ffeb3b] border-[#ffeb3b] animate-pulse bg-[#ffeb3b]/5 shadow-[0_0_5px_rgba(255,235,59,0.2)]' 
                    : isCompleted 
                      ? 'text-[#ffb847] border-[#ffb847]/40 bg-black/20' 
                      : 'text-[#6b7280] border-[#6b7280]/20 opacity-60'
                }`}>
                  {isCompleted ? 'DONE' : isCurrent ? 'CURRENT' : 'NEXT'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Layer 2: Roadmap Path + Pellets + Pacman (Middle) */}
        <div className="relative h-16 w-full">
          {/* Maze-blue path line */}
          <div className="absolute top-[28px] left-[60px] right-[60px] h-2 bg-black border-2 border-[#2121de] shadow-[0_0_8px_rgba(33,33,222,0.5)]"></div>
          
          {/* Pellets positioned along the line */}
          <div className="absolute inset-0 flex justify-between px-[48px] items-center pointer-events-none">
            {phases.map((phase, idx) => {
              const isEaten = idx <= pacmanIndex;
              return (
                <div 
                  key={`pellet-${phase.name}`} 
                  className={`w-6 h-6 flex items-center justify-center transition-all duration-300 ${
                    isEaten ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                  }`}
                >
                  <div className="w-2.5 h-2.5 bg-[#fdfdcb] ring-2 ring-[#ffeb3b]/20 shadow-[0_0_5px_#ffeb3b]"></div>
                </div>
              );
            })}
          </div>

          {/* Node buttons (invisible hitbox buttons overlaid on the path for hovering/clicking) */}
          <div className="absolute inset-0 flex justify-between px-[48px] items-center z-20">
            {phases.map((phase, idx) => {
              const isSelected = idx === selectedPhaseIndex;
              const isCurrent = idx === targetIndex;
              return (
                <button
                  key={`btn-${phase.name}`}
                  onClick={() => setSelectedPhaseIndex(idx)}
                  onMouseEnter={() => setSelectedPhaseIndex(idx)}
                  className={`w-8 h-8 rounded-none flex items-center justify-center border-2 transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-[#ffeb3b] bg-black shadow-[0_0_10px_#ffeb3b] scale-115' 
                      : isCurrent 
                        ? 'border-[#ffeb3b]/50 bg-black/60' 
                        : 'border-[#2121de]/60 bg-black/80 hover:border-[#00ffff]'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 ${isCurrent ? 'bg-[#ffeb3b] animate-ping' : 'bg-[#2121de]'}`}></div>
                </button>
              );
            })}
          </div>

          {/* Floating Animated Pacman traveling ON the path */}
          <div 
            className="absolute top-[20px] z-30 transition-all duration-500 ease-out pointer-events-none"
            style={{ 
              left: pacmanIndex === -1 ? '16px' : `calc(60px + (${pacmanIndex} * (100% - 120px) / 5))`,
              transform: `translateX(-50%)`
            }}
          >
            <div className="animate-chomp">
              <PacmanIcon className="w-6 h-6 text-[#ffeb3b] drop-shadow-[0_0_8px_rgba(255,235,59,1)]" />
            </div>
          </div>
        </div>

        {/* Layer 3: Phase Titles and Weeks (Bottom) */}
        <div className="flex justify-between w-full mt-6">
          {phases.map((phase, idx) => {
            const isCompleted = idx < targetIndex;
            const isCurrent = idx === targetIndex;
            const isSelected = idx === selectedPhaseIndex;
            
            return (
              <button 
                key={`label-${phase.name}`}
                onClick={() => setSelectedPhaseIndex(idx)}
                onMouseEnter={() => setSelectedPhaseIndex(idx)}
                className="w-[120px] text-center focus:outline-none transition-all cursor-pointer block"
              >
                <h4 className={`font-press-start text-[9px] tracking-wide leading-normal ${
                  isSelected ? 'text-[#ffeb3b]' : isCurrent ? 'text-[#ffeb3b]/80' : isCompleted ? 'text-white' : 'text-[#6b7280]'
                }`}>
                  {phase.name}
                </h4>
                <p className="font-vt323 text-xs text-[#6b7280] mt-1">{phase.weeks}</p>
              </button>
            );
          })}
        </div>

      </div>

      {/* Mobile Vertical Roadmap */}
      <div className="relative md:hidden pl-16 py-8 max-w-sm mx-auto h-[600px]">
        {/* Maze-blue vertical path line */}
        <div className="absolute top-[20px] bottom-[20px] left-[26px] w-2 bg-black border-2 border-[#2121de] shadow-[0_0_8px_rgba(33,33,222,0.5)] z-10"></div>
        
        {/* Nodes and Pellets */}
        <div className="absolute top-[20px] bottom-[20px] left-[15px] flex flex-col justify-between h-[560px] z-20">
          {phases.map((phase, idx) => {
            const isCurrent = idx === targetIndex;
            const isSelected = idx === selectedPhaseIndex;
            
            return (
              <button 
                key={`mob-node-${phase.name}`}
                onClick={() => setSelectedPhaseIndex(idx)}
                className={`w-8 h-8 rounded-none flex items-center justify-center border-2 z-20 cursor-pointer ${
                  isSelected ? 'border-[#ffeb3b] bg-black shadow-[0_0_8px_#ffeb3b]' : isCurrent ? 'border-[#ffeb3b]/50 bg-black/60' : 'border-[#2121de]/60 bg-black/80'
                }`}
              >
                {idx <= pacmanIndex ? (
                  <div className="w-1.5 h-1.5 bg-[#ffeb3b]/10"></div>
                ) : (
                  <div className="w-2.5 h-2.5 bg-[#fdfdcb] ring-2 ring-[#ffeb3b]/20 shadow-[0_0_5px_#ffeb3b]"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Floating Animated Pacman for Mobile (moving down) */}
        <div 
          className="absolute left-[19px] z-30 transition-all duration-500 ease-out pointer-events-none"
          style={{ 
            top: pacmanIndex === -1 ? '0px' : `calc(20px + (${pacmanIndex} * 560px / 5))`,
            transform: `translateY(0%)`
          }}
        >
          <div className="animate-chomp">
            <PacmanIcon className="w-6 h-6 text-[#ffeb3b] drop-shadow-[0_0_8px_rgba(255,235,59,1)] rotate-90" />
          </div>
        </div>

        {/* Text descriptions layered on the right */}
        <div className="flex flex-col justify-between h-[560px] pl-6">
          {phases.map((phase, idx) => {
            const isCompleted = idx < targetIndex;
            const isSelected = idx === selectedPhaseIndex;
            
            return (
              <div 
                key={`mob-desc-${phase.name}`}
                onClick={() => setSelectedPhaseIndex(idx)}
                className={`cursor-pointer transition-all flex flex-col justify-center py-1 ${
                  isSelected ? 'border-l-2 border-[#ffeb3b] pl-3' : 'pl-3 border-l border-transparent'
                }`}
                style={{ height: '32px' }}
              >
                <div className="flex items-center gap-2">
                  <h4 className={`font-press-start text-[9px] ${
                    isSelected ? 'text-[#ffeb3b]' : isCompleted ? 'text-white' : 'text-[#6b7280]'
                  }`}>
                    {phase.name}
                  </h4>
                  <span className="font-vt323 text-xs text-[#6b7280]">{phase.weeks}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------
// ROUTING CONSTANTS
// ----------------------------------------------------
type Route = 
  | 'home' 
  | 'project' 
  | 'team' 
  | 'presentations' 
  | 'planning-v1' 
  | 'architecture' 
  | 'admin';

const getRouteFromHash = (): Route => {
  const hash = window.location.hash;
  if (hash === '#/project') return 'project';
  if (hash === '#/team') return 'team';
  if (hash === '#/presentations') return 'presentations';
  if (hash === '#/presentations/planning-v1') return 'planning-v1';
  if (hash === '#/architecture') return 'architecture';
  if (hash === '#/admin') return 'admin';
  return 'home';
};

const setHashFromRoute = (route: Route) => {
  if (route === 'home') window.location.hash = '#/';
  else if (route === 'planning-v1') window.location.hash = '#/presentations/planning-v1';
  else window.location.hash = `#/${route}`;
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [crtActive, setCrtActive] = useState(true);

  // Sync with Hash Changes
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(getRouteFromHash());
      window.scrollTo(0, 0);
      setMobileMenuOpen(false);
    };

    window.addEventListener('hashchange', handleHashChange);
    // Init route
    setCurrentRoute(getRouteFromHash());

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const navigateTo = (route: Route) => {
    setHashFromRoute(route);
  };

  // Nav Item helper
  const renderNavItem = (label: string, route: Route, isAdmin = false) => {
    const isActive = currentRoute === route;
    return (
      <button
        onClick={() => navigateTo(route)}
        className={`font-press-start text-[10px] tracking-wider transition-all duration-150 relative py-2 px-1 focus:outline-none ${
          isActive 
            ? 'text-[#ffeb3b]' 
            : isAdmin 
              ? 'text-[#00ffff] border border-dashed border-[#00ffff]/40 px-2' 
              : 'text-[#fdfdcb]/80 hover:text-white hover:scale-105'
        }`}
      >
        {label}
        {isActive && (
          <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#ffeb3b] animate-pulse"></span>
        )}
      </button>
    );
  };

  return (
    <div className={`min-h-screen bg-[#05050d] text-[#fdfdcb] flex flex-col bg-pixel-grid selection:bg-[#ffeb3b] selection:text-[#05050d] ${crtActive ? 'crt-screen' : ''}`}>
      
      {/* ----------------------------------------------------
          GLOBAL HEADER / NAVBAR
          ---------------------------------------------------- */}
      <header className="border-b-4 border-[#2121de] bg-[#0c0c1e] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo / Wordmark */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('home')}>
            <PacmanIcon className="w-8 h-8 text-[#ffeb3b] animate-bounce" />
            <span className="font-press-start text-sm md:text-lg text-white tracking-widest hover:text-[#ffeb3b] transition-colors">
              REVAUDIT
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {renderNavItem('HOME', 'home')}
            {renderNavItem('PROJECT', 'project')}
            {renderNavItem('TEAM', 'team')}
            {renderNavItem('PRESENTATIONS', 'presentations')}
            {renderNavItem('ARCHITECTURE', 'architecture')}
            {renderNavItem('[ ADMIN ]', 'admin', true)}
          </nav>

          {/* Controls & Mobile menu toggle */}
          <div className="flex items-center gap-4">
            {/* CRT Toggle Switch */}
            <button 
              onClick={() => setCrtActive(!crtActive)}
              className="text-[10px] font-press-start px-2 py-1 bg-black border border-[#6b7280] text-[#6b7280] rounded hover:text-white hover:border-white transition-colors hidden sm:block"
            >
              CRT: {crtActive ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1 text-[#ffeb3b] border-2 border-[#ffeb3b] focus:outline-none"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t-2 border-[#2121de] bg-[#0c0c1e] px-4 py-4 flex flex-col gap-4">
            <button onClick={() => navigateTo('home')} className={`text-left font-press-start text-xs py-2 ${currentRoute === 'home' ? 'text-[#ffeb3b]' : 'text-white'}`}>HOME</button>
            <button onClick={() => navigateTo('project')} className={`text-left font-press-start text-xs py-2 ${currentRoute === 'project' ? 'text-[#ffeb3b]' : 'text-white'}`}>PROJECT</button>
            <button onClick={() => navigateTo('team')} className={`text-left font-press-start text-xs py-2 ${currentRoute === 'team' ? 'text-[#ffeb3b]' : 'text-white'}`}>TEAM</button>
            <button onClick={() => navigateTo('presentations')} className={`text-left font-press-start text-xs py-2 ${currentRoute === 'presentations' ? 'text-[#ffeb3b]' : 'text-white'}`}>PRESENTATIONS</button>
            <button onClick={() => navigateTo('architecture')} className={`text-left font-press-start text-xs py-2 ${currentRoute === 'architecture' ? 'text-[#ffeb3b]' : 'text-white'}`}>ARCHITECTURE</button>
            <button onClick={() => navigateTo('admin')} className={`text-left font-press-start text-xs py-2 text-[#00ffff] border border-dashed border-[#00ffff]/40 p-2`}>[ ADMIN ]</button>
            <button 
              onClick={() => setCrtActive(!crtActive)}
              className="text-[10px] font-press-start text-left py-2 text-[#6b7280]"
            >
              CRT EFFECT: {crtActive ? 'ON' : 'OFF'}
            </button>
          </div>
        )}
      </header>

      {/* ----------------------------------------------------
          MAIN CONTENT ROUTER
          ---------------------------------------------------- */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        {currentRoute === 'home' && <HomePage navigateTo={navigateTo} />}
        {currentRoute === 'project' && <ProjectPage />}
        {currentRoute === 'team' && <TeamPage />}
        {currentRoute === 'presentations' && <PresentationsPage navigateTo={navigateTo} />}
        {currentRoute === 'planning-v1' && <PlanningPresentationView />}
        {currentRoute === 'architecture' && <ArchitecturePage />}
        {currentRoute === 'admin' && <AdminPage />}
      </main>

      {/* ----------------------------------------------------
          GLOBAL FOOTER
          ---------------------------------------------------- */}
      <footer className="border-t-4 border-[#2121de] bg-[#0c0c1e] py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <PacmanIcon className="w-5 h-5 text-[#ffeb3b]" />
              <span className="font-press-start text-xs text-white">REVAUDIT</span>
            </div>
            <p className="font-vt323 text-lg text-[#6b7280]">
              UCS503 Software Engineering Lab — Team ArchCoders
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <span className="font-press-start text-[9px] text-[#6b7280]">
              ADVISOR: DR. SUKHPAL SINGH
            </span>
            <span className="font-press-start text-[8px] text-[#ffeb3b]">
              INSERT COIN TO START © 2026 ARCHCODERS
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ----------------------------------------------------
// 1. HOME PAGE COMPONENT
// ----------------------------------------------------
function HomePage({ navigateTo }: { navigateTo: (route: Route) => void }) {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-12 md:py-20 relative overflow-hidden">
        {/* Pellet visual background decorator */}
        <div className="absolute inset-0 flex justify-center items-center opacity-5 pointer-events-none">
          <div className="text-[120px] font-press-start text-[#ffeb3b]">C</div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <div className="flex justify-center gap-1">
            <PelletIcon />
            <PelletIcon />
            <PelletIcon power />
            <PelletIcon />
            <PelletIcon />
          </div>

          <h1 className="font-press-start text-3xl md:text-5xl lg:text-6xl text-[#ffeb3b] tracking-wider leading-tight animate-pulse">
            REVAUDIT
          </h1>
          
          <h2 className="font-press-start text-xs md:text-sm text-white max-w-2xl mx-auto leading-relaxed border-y-2 border-dashed border-[#2121de] py-4">
            STATISTICAL AUDIT OF CODE-REVIEW CONSISTENCY AND WORKLOAD IN OPEN-SOURCE REPOSITORIES
          </h2>

          <p className="max-w-2xl mx-auto text-base md:text-lg text-[#fdfdcb] leading-relaxed">
            RevAudit analyzes code-review activity to identify statistically unusual variation in review effort while accounting for pull-request, repository, contributor and reviewer-workload characteristics.
          </p>

          {/* Technical Data Concept Pipeline */}
          <div className="arcade-card p-4 max-w-lg mx-auto flex items-center justify-between text-[10px] font-press-start border-dashed border-2">
            <span className="text-[#ff0000]">GITHUB</span>
            <ArrowRight size={12} className="text-[#2121de]" />
            <span className="text-[#ffb8de]">PRs</span>
            <ArrowRight size={12} className="text-[#2121de]" />
            <span className="text-[#00ffff]">STATISTICS</span>
            <ArrowRight size={12} className="text-[#2121de]" />
            <span className="text-[#ffb847]">EVIDENCE</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-4">
            <button onClick={() => navigateTo('project')} className="arcade-btn w-full sm:w-auto">
              EXPLORE PROJECT
            </button>
            <button onClick={() => navigateTo('planning-v1')} className="arcade-btn w-full sm:w-auto border-[#ffb8de]">
              PLANNING V1
            </button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="font-press-start text-lg text-white">01 / THE PROBLEM</h2>
          <div className="w-12 h-1 bg-[#ff0000] mx-auto mt-2"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="arcade-card p-6 space-y-4">
            <div className="text-[#ff0000] font-press-start text-xs">INVISIBLE VARIATION</div>
            <p className="text-sm leading-relaxed font-sans text-[#fdfdcb]">
              Similar pull requests can receive substantially different review effort. Some are merged instantly without deep checks, while others are heavily gated without clear technical reasons.
            </p>
          </div>

          <div className="arcade-card p-6 space-y-4">
            <div className="text-[#ffb8de] font-press-start text-xs">NO BASELINE</div>
            <p className="text-sm leading-relaxed font-sans text-[#fdfdcb]">
              Teams lack a statistical baseline for what normal review effort looks like. Without adjusting for PR complexity, contributor relationship, and reviewer load, comparisons remain inaccurate.
            </p>
          </div>

          <div className="arcade-card p-6 space-y-4">
            <div className="text-[#00ffff] font-press-start text-xs">ACTIVITY ISN'T ENOUGH</div>
            <p className="text-sm leading-relaxed font-sans text-[#fdfdcb]">
              Existing analytics primarily expose activity counts (e.g., number of reviews, line changes) rather than statistically unusual variation after relevant factors are controlled.
            </p>
          </div>
        </div>

        <div className="arcade-card p-6 border-dashed border-2 border-[#ffeb3b] text-center max-w-3xl mx-auto">
          <p className="font-press-start text-xs md:text-sm text-[#ffeb3b] leading-relaxed">
            "RevAudit turns review-effort variation into a measurable, evidence-backed signal."
          </p>
        </div>
      </section>

      {/* System Pipeline Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="font-press-start text-sm md:text-lg text-white">SYSTEM PIPELINE</h2>
          <div className="w-12 h-1 bg-[#2121de] mx-auto mt-2"></div>
        </div>

        {/* Desktop Pipeline Flow */}
        <div className="hidden lg:flex items-center justify-between max-w-5xl mx-auto gap-2">
          {/* GITHUB */}
          <div className="flex-1 min-w-[110px] max-w-[150px] aspect-square flex flex-col justify-center items-center p-3 border-2 text-center arcade-card text-white">
            <GithubIcon className="mb-2 text-[#6b7280] w-6 h-6" />
            <span className="text-[9px] font-press-start leading-tight">GITHUB</span>
          </div>
          <div className="flex-shrink-0 text-[#2121de] font-bold text-lg">→</div>

          {/* INGESTION */}
          <div className="flex-1 min-w-[110px] max-w-[150px] aspect-square flex flex-col justify-center items-center p-3 border-2 text-center arcade-card text-[#ff0000] border-[#ff0000]/80">
            <Terminal className="mb-2 w-6 h-6" />
            <span className="text-[9px] font-press-start leading-tight">INGESTION</span>
          </div>
          <div className="flex-shrink-0 text-[#2121de] font-bold text-lg">→</div>

          {/* POSTGRESQL */}
          <div className="flex-1 min-w-[110px] max-w-[150px] aspect-square flex flex-col justify-center items-center p-3 border-2 text-center arcade-card text-[#ffb8de] border-[#ffb8de]/80">
            <Database className="mb-2 w-6 h-6" />
            <span className="text-[9px] font-press-start leading-tight">POSTGRES</span>
          </div>
          <div className="flex-shrink-0 text-[#2121de] font-bold text-lg">→</div>

          {/* STATS ENGINE */}
          <div className="flex-1 min-w-[110px] max-w-[150px] aspect-square flex flex-col justify-center items-center p-3 border-2 text-center arcade-card text-[#00ffff] border-[#00ffff]/80">
            <Cpu className="mb-2 w-6 h-6" />
            <span className="text-[9px] font-press-start leading-tight block w-full break-words">STATS<br/>ENGINE</span>
          </div>
          <div className="flex-shrink-0 text-[#2121de] font-bold text-lg">→</div>

          {/* FASTAPI */}
          <div className="flex-1 min-w-[110px] max-w-[150px] aspect-square flex flex-col justify-center items-center p-3 border-2 text-center arcade-card text-[#ffb847] border-[#ffb847]/80">
            <Server className="mb-2 w-6 h-6" />
            <span className="text-[9px] font-press-start leading-tight">FASTAPI</span>
          </div>
          <div className="flex-shrink-0 text-[#2121de] font-bold text-lg">→</div>

          {/* DASHBOARD */}
          <div className="flex-1 min-w-[110px] max-w-[150px] aspect-square flex flex-col justify-center items-center p-3 border-2 text-center arcade-card text-[#ffeb3b] border-[#ffeb3b]/80">
            <Layout className="mb-2 w-6 h-6" />
            <span className="text-[9px] font-press-start leading-tight">DASHBOARD</span>
          </div>
        </div>

        {/* Mobile / Tablet Stacked Pipeline */}
        <div className="lg:hidden flex flex-col items-center gap-2 max-w-sm mx-auto w-full px-4">
          {/* GITHUB */}
          <div className="arcade-card w-full max-w-xs p-4 flex items-center justify-start gap-4 font-press-start text-xs text-white">
            <GithubIcon className="text-[#6b7280] w-6 h-6 flex-shrink-0" />
            <span className="flex-1 text-left">GITHUB</span>
          </div>
          <div className="text-[#2121de] text-lg font-bold">↓</div>

          {/* INGESTION */}
          <div className="arcade-card w-full max-w-xs p-4 flex items-center justify-start gap-4 font-press-start text-xs text-[#ff0000] border-[#ff0000]/80">
            <Terminal className="w-6 h-6 flex-shrink-0" />
            <span className="flex-1 text-left">INGESTION</span>
          </div>
          <div className="text-[#2121de] text-lg font-bold">↓</div>

          {/* POSTGRESQL */}
          <div className="arcade-card w-full max-w-xs p-4 flex items-center justify-start gap-4 font-press-start text-xs text-[#ffb8de] border-[#ffb8de]/80">
            <Database className="w-6 h-6 flex-shrink-0" />
            <span className="flex-1 text-left">POSTGRESQL</span>
          </div>
          <div className="text-[#2121de] text-lg font-bold">↓</div>

          {/* STATS ENGINE */}
          <div className="arcade-card w-full max-w-xs p-4 flex items-center justify-start gap-4 font-press-start text-xs text-[#00ffff] border-[#00ffff]/80">
            <Cpu className="w-6 h-6 flex-shrink-0" />
            <span className="flex-1 text-left">STATS ENGINE</span>
          </div>
          <div className="text-[#2121de] text-lg font-bold">↓</div>

          {/* FASTAPI */}
          <div className="arcade-card w-full max-w-xs p-4 flex items-center justify-start gap-4 font-press-start text-xs text-[#ffb847] border-[#ffb847]/80">
            <Server className="w-6 h-6 flex-shrink-0" />
            <span className="flex-1 text-left">FASTAPI</span>
          </div>
          <div className="text-[#2121de] text-lg font-bold">↓</div>

          {/* DASHBOARD */}
          <div className="arcade-card w-full max-w-xs p-4 flex items-center justify-start gap-4 font-press-start text-xs text-[#ffeb3b] border-[#ffeb3b]/80">
            <Layout className="w-6 h-6 flex-shrink-0" />
            <span className="flex-1 text-left">DASHBOARD</span>
          </div>
        </div>
      </section>

      {/* Objectives Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="font-press-start text-lg text-white">OBJECTIVES</h2>
          <div className="w-12 h-1 bg-[#ffb847] mx-auto mt-2"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="arcade-card p-5 border-2 space-y-3">
            <div className="flex items-center gap-3">
              <LineChart className="w-6 h-6 text-[#ffeb3b]" />
              <h3 className="font-press-start text-xs text-white">1. Statistical Analysis</h3>
            </div>
            <p className="font-sans text-xs text-[#fdfdcb]/80 leading-relaxed">
              Model variations in review duration, feedback density, and revision loops using rigorous statistical modeling.
            </p>
          </div>

          <div className="arcade-card p-5 border-2 space-y-3">
            <div className="flex items-center gap-3">
              <Binary className="w-6 h-6 text-[#ff0000]" />
              <h3 className="font-press-start text-xs text-white">2. Pattern Detection</h3>
            </div>
            <p className="font-sans text-xs text-[#fdfdcb]/80 leading-relaxed">
              Identify systemic review anomalies such as rubber-stamping or critical gatekeeping that fall outside normal baseline ranges.
            </p>
          </div>

          <div className="arcade-card p-5 border-2 space-y-3">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-[#ffb8de]" />
              <h3 className="font-press-start text-xs text-white">3. Uncertainty</h3>
            </div>
            <p className="font-sans text-xs text-[#fdfdcb]/80 leading-relaxed">
              Provide uncertainty ranges and confidence indicators to separate statistical noise from structural process changes.
            </p>
          </div>

          <div className="arcade-card p-5 border-2 space-y-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#00ffff]" />
              <h3 className="font-press-start text-xs text-white">4. Validation</h3>
            </div>
            <p className="font-sans text-xs text-[#fdfdcb]/80 leading-relaxed">
              Validate modeling accuracy using controlled synthetic changes injected with known ground-truth anomalies.
            </p>
          </div>

          <div className="arcade-card p-5 border-2 space-y-3">
            <div className="flex items-center gap-3">
              <Layers className="w-6 h-6 text-[#ffb847]" />
              <h3 className="font-press-start text-xs text-white">5. Generalisation</h3>
            </div>
            <p className="font-sans text-xs text-[#fdfdcb]/80 leading-relaxed">
              Test analytical robustness by cross-evaluating the system across distinct, held-out open source repositories.
            </p>
          </div>

          <div className="arcade-card p-5 border-2 space-y-3">
            <div className="flex items-center gap-3">
              <FileCode className="w-6 h-6 text-[#ffeb3b]" />
              <h3 className="font-press-start text-xs text-white">6. Explainability</h3>
            </div>
            <p className="font-sans text-xs text-[#fdfdcb]/80 leading-relaxed">
              Present findings transparently, linking anomalies directly to pull request workload, size, and author context.
            </p>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <RoadmapSection />

      {/* Team Roster Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="font-press-start text-lg text-white">TEAM ARCHCODERS</h2>
          <div className="w-12 h-1 bg-[#00ffff] mx-auto mt-2"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Member 1 */}
          <div className="arcade-card-red p-6 text-center space-y-4 flex flex-col justify-between h-full">
            <div className="flex justify-center">
              <GhostIcon color="#ff0000" type="blinky" />
            </div>
            <div>
              <h3 className="font-press-start text-xs text-white">Dheeraj Kumar</h3>
              <p className="text-[10px] font-press-start text-[#6b7280] mt-1">1024170136</p>
            </div>
            <div className="text-xs font-press-start text-[#ff0000] border-t border-[#ff0000]/20 pt-2">
              TEAM LEAD
            </div>
          </div>

          {/* Member 2 */}
          <div className="arcade-card-pink p-6 text-center space-y-4 flex flex-col justify-between h-full">
            <div className="flex justify-center">
              <GhostIcon color="#ffb8de" type="pinky" />
            </div>
            <div>
              <h3 className="font-press-start text-xs text-white">Vaibhav Goyal</h3>
              <p className="text-[10px] font-press-start text-[#6b7280] mt-1">1024170002</p>
            </div>
            <div className="text-xs font-press-start text-[#ffb8de] border-t border-[#ffb8de]/20 pt-2">
              DATA PIPELINE & STATS MODELING
            </div>
          </div>

          {/* Member 3 */}
          <div className="arcade-card-cyan p-6 text-center space-y-4 flex flex-col justify-between h-full">
            <div className="flex justify-center">
              <GhostIcon color="#00ffff" type="inky" />
            </div>
            <div>
              <h3 className="font-press-start text-xs text-white">Adityaraj Singh</h3>
              <p className="text-[10px] font-press-start text-[#6b7280] mt-1">1024170148</p>
            </div>
            <div className="text-xs font-press-start text-[#00ffff] border-t border-[#00ffff]/20 pt-2">
              BACKEND & ARCHITECTURE
            </div>
          </div>

          {/* Member 4 */}
          <div className="arcade-card-orange p-6 text-center space-y-4 flex flex-col justify-between h-full">
            <div className="flex justify-center">
              <GhostIcon color="#ffb847" type="clyde" />
            </div>
            <div>
              <h3 className="font-press-start text-xs text-white">Sparsh Khandelwal</h3>
              <p className="text-[10px] font-press-start text-[#6b7280] mt-1">1024170139</p>
            </div>
            <div className="text-xs font-press-start text-[#ffb847] border-t border-[#ffb847]/20 pt-2">
              FRONTEND & DOCUMENTATION
            </div>
          </div>
        </div>

        {/* Instructor */}
        <div className="arcade-card p-6 max-w-md mx-auto text-center border-dashed">
          <div className="text-xs font-press-start text-[#6b7280] mb-2">INSTRUCTOR</div>
          <h3 className="font-press-start text-sm text-white">Dr. Sukhpal Singh</h3>
        </div>
      </section>

      {/* Latest Presentation Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="font-press-start text-lg text-white">LATEST SLIDE DECK</h2>
          <div className="w-12 h-1 bg-[#ffeb3b] mx-auto mt-2"></div>
        </div>

        <div className="arcade-card max-w-xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between border-b-2 border-dashed border-[#2121de] pb-4">
            <div>
              <h3 className="font-press-start text-xs text-white">PLANNING PRESENTATION</h3>
              <p className="font-press-start text-[10px] text-[#ffeb3b] mt-1">VERSION 1.0</p>
            </div>
            <div className="text-right">
              <span className="font-vt323 text-lg text-[#6b7280]">Aug 2026</span>
            </div>
          </div>

          <p className="font-sans text-sm text-[#fdfdcb]/80 leading-relaxed">
            Covers initial problem statements, statistical model layouts, detailed data schema structures, baseline evaluations, and the project's 17-week implementation timeline.
          </p>

          <div className="flex justify-center pt-2">
            <button 
              onClick={() => navigateTo('planning-v1')} 
              className="arcade-btn gap-2"
            >
              <Play size={12} fill="currentColor" />
              OPEN PRESENTATION
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ----------------------------------------------------
// 2. PROJECT DETAIL PAGE COMPONENT
// ----------------------------------------------------
function ProjectPage() {
  return (
    <div className="space-y-12">
      <div className="border-b-4 border-[#2121de] pb-4">
        <h1 className="font-press-start text-2xl text-white">PROJECT OVERVIEW</h1>
        <p className="font-vt323 text-xl text-[#6b7280] mt-1">Scope, Methodology and Objectives</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="arcade-card p-6 space-y-4">
            <h2 className="font-press-start text-xs text-[#ffeb3b]">PROJECT DEFINITION</h2>
            <p className="font-sans text-sm leading-relaxed text-[#fdfdcb]">
              RevAudit is a software system designed to analyze pull request review workflows in open source repositories. 
              The system's goal is to detect review inconsistency — occurrences where pull requests of identical complexity 
              experience stark differences in approval speed, review revisions, and comment density. By controlling for confounding factors, 
              RevAudit aims to provide objective, mathematical audit baselines.
            </p>
          </div>

          <div className="arcade-card p-6 space-y-4">
            <h2 className="font-press-start text-xs text-[#ff0000]">RESEARCH HYPOTHESES</h2>
            <div className="space-y-4">
              <div className="border-l-2 border-[#ff0000] pl-4 py-1">
                <span className="font-press-start text-[10px] text-white block">HYPOTHESIS H1</span>
                <p className="font-sans text-xs text-[#fdfdcb] mt-1">
                  Code review effort is influenced by factors beyond raw code differences. Repository patterns, contributor tenure, and reviewer workload represent significant variables.
                </p>
              </div>
              <div className="border-l-2 border-[#ffb8de] pl-4 py-1">
                <span className="font-press-start text-[10px] text-white block">HYPOTHESIS H2</span>
                <p className="font-sans text-xs text-[#fdfdcb] mt-1">
                  Non-code signals leave distinct trace patterns. A reviewer's active workload, timing, and relative familiarity with the codebase affect overall cycle duration.
                </p>
              </div>
              <div className="border-l-2 border-[#00ffff] pl-4 py-1">
                <span className="font-press-start text-[10px] text-white block">HYPOTHESIS H3</span>
                <p className="font-sans text-xs text-[#fdfdcb] mt-1">
                  Systemic process shifts are statistically identifiable. We can detect structural review deviations while controlling for expected random variations.
                </p>
              </div>
            </div>
          </div>

          <div className="arcade-card p-6 space-y-4">
            <h2 className="font-press-start text-xs text-[#00ffff]">STATISTICAL METHODOLOGY</h2>
            <p className="font-sans text-sm leading-relaxed text-[#fdfdcb]">
              Unlike typical metrics setups that calculate global averages, RevAudit models pull request review effort using 
              <strong> hierarchical mixed-effects regression</strong>. 
              This structure splits random variation across nested levels: the individual repository, the active reviewer, 
              the pull request context, and residual error. This technique prevents team-level bottlenecks from skewing individual reviewer metrics.
            </p>
          </div>

          <div className="arcade-card p-6 space-y-4">
            <h2 className="font-press-start text-xs text-[#ffb847]">ETHICAL SAFETY MARGINS</h2>
            <p className="font-sans text-sm leading-relaxed text-[#fdfdcb]">
              Statistical outputs are prone to misuse. To ensure compliance with ethical guidelines, RevAudit implements strict system boundaries:
            </p>
            <ul className="list-disc list-inside font-sans text-xs text-[#fdfdcb]/80 space-y-2">
              <li>No ranking lists of individual developers or reviewers.</li>
              <li>Complete anonymization of individual identifiers in diagnostic outputs.</li>
              <li>Results are formatted as system review suggestions rather than absolute judgments.</li>
            </ul>
          </div>
        </div>

        {/* Sidebar Data details */}
        <div className="space-y-6">
          <div className="arcade-card p-6 border-dashed">
            <h2 className="font-press-start text-xs text-white mb-4">TARGET DATA SCOPE</h2>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-[#2121de] pb-2">
                <span className="font-vt323 text-lg text-[#6b7280]">ACTIVE REPOSITORIES</span>
                <span className="font-press-start text-xs text-[#ffeb3b]">15+</span>
              </div>
              <div className="flex justify-between border-b border-[#2121de] pb-2">
                <span className="font-vt323 text-lg text-[#6b7280]">MIN PULL REQUESTS</span>
                <span className="font-press-start text-xs text-[#ffeb3b]">5,000+</span>
              </div>
              <div className="space-y-1">
                <span className="font-press-start text-[9px] text-[#6b7280]">COLLECTED VARIABLES:</span>
                <div className="flex flex-wrap gap-1 text-[8px] font-press-start">
                  <span className="bg-[#0c0c1e] px-1 py-0.5 border border-[#2121de]">PR SIZE</span>
                  <span className="bg-[#0c0c1e] px-1 py-0.5 border border-[#2121de]">REVIEWS</span>
                  <span className="bg-[#0c0c1e] px-1 py-0.5 border border-[#2121de]">COMMENTS</span>
                  <span className="bg-[#0c0c1e] px-1 py-0.5 border border-[#2121de]">BOT ACTIONS</span>
                  <span className="bg-[#0c0c1e] px-1 py-0.5 border border-[#2121de]">WORKLOADS</span>
                </div>
              </div>
            </div>
          </div>

          <div className="arcade-card p-6 border-2">
            <h2 className="font-press-start text-xs text-[#00ffff] mb-4">CURRENT DEVELOPMENT STATUS</h2>
            <div className="space-y-3 font-sans text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#ff0000] rounded-none animate-pulse"></div>
                <span className="text-[#ff0000] font-press-start text-[8px]">PHASE 1: PROTOTYPE ARCHITECTURE</span>
              </div>
              <p className="text-[#fdfdcb]/80">
                Core database schemas and layout designs are specified. Backend framework setups and database connectivity scripts are currently under construction.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. TEAM RASTER PAGE COMPONENT
// ----------------------------------------------------
function TeamPage() {
  return (
    <div className="space-y-12">
      <div className="border-b-4 border-[#2121de] pb-4">
        <h1 className="font-press-start text-2xl text-white">THE TEAM</h1>
        <p className="font-vt323 text-xl text-[#6b7280] mt-1">ArchCoders roster & lab supervisor details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Dheeraj */}
        <div className="arcade-card-red p-6 flex items-start gap-4">
          <div className="flex-shrink-0">
            <GhostIcon color="#ff0000" type="blinky" className="w-16 h-16" />
          </div>
          <div className="space-y-2">
            <h3 className="font-press-start text-xs text-white">Dheeraj Kumar</h3>
            <p className="font-press-start text-[9px] text-[#ff0000]">TEAM LEAD</p>
            <p className="font-vt323 text-base text-[#6b7280]">ROLL NUMBER: 1024170136</p>
            <p className="font-sans text-xs text-[#fdfdcb]/80 leading-relaxed">
              Manages global service boundaries, oversees API ingestion structures, and designs deployment specifications.
            </p>
          </div>
        </div>

        {/* Vaibhav */}
        <div className="arcade-card-pink p-6 flex items-start gap-4">
          <div className="flex-shrink-0">
            <GhostIcon color="#ffb8de" type="pinky" className="w-16 h-16" />
          </div>
          <div className="space-y-2">
            <h3 className="font-press-start text-xs text-white">Vaibhav Goyal</h3>
            <p className="font-press-start text-[9px] text-[#ffb8de]">DATA PIPELINE & STATS MODELING</p>
            <p className="font-vt323 text-base text-[#6b7280]">ROLL NUMBER: 1024170002</p>
            <p className="font-sans text-xs text-[#fdfdcb]/80 leading-relaxed">
              Responsible for database parsing configuration and designing the hierarchical model regressions using statsmodels.
            </p>
          </div>
        </div>

        {/* Adityaraj */}
        <div className="arcade-card-cyan p-6 flex items-start gap-4">
          <div className="flex-shrink-0">
            <GhostIcon color="#00ffff" type="inky" className="w-16 h-16" />
          </div>
          <div className="space-y-2">
            <h3 className="font-press-start text-xs text-white">Adityaraj Singh</h3>
            <p className="font-press-start text-[9px] text-[#00ffff]">BACKEND & ARCHITECTURE</p>
            <p className="font-vt323 text-base text-[#6b7280]">ROLL NUMBER: 1024170148</p>
            <p className="font-sans text-xs text-[#fdfdcb]/80 leading-relaxed">
              Builds the public presentation platform, user views, and constructs charts mapping model variances.
            </p>
          </div>
        </div>

        {/* Sparsh */}
        <div className="arcade-card-orange p-6 flex items-start gap-4">
          <div className="flex-shrink-0">
            <GhostIcon color="#ffb847" type="clyde" className="w-16 h-16" />
          </div>
          <div className="space-y-2">
            <h3 className="font-press-start text-xs text-white">Sparsh Khandelwal</h3>
            <p className="font-press-start text-[9px] text-[#ffb847]">FRONTEND & DOCUMENTATION</p>
            <p className="font-vt323 text-base text-[#6b7280]">ROLL NUMBER: 1024170139</p>
            <p className="font-sans text-xs text-[#fdfdcb]/80 leading-relaxed">
              Handles repository API scraping scripts, data validation controls, and maintains lab documentation logs.
            </p>
          </div>
        </div>
      </div>

      {/* Advisory block */}
      <div className="arcade-card max-w-xl mx-auto p-6 border-dashed space-y-4">
        <div className="text-center">
          <span className="font-press-start text-[10px] text-[#6b7280]">INSTRUCTOR & PROJECT SUPERVISOR</span>
          <h2 className="font-press-start text-sm text-white mt-2">Dr. Sukhpal Singh</h2>
          <p className="font-vt323 text-lg text-[#ffeb3b] mt-1">Department of Computer Science & Engineering</p>
        </div>
        <p className="font-sans text-xs text-[#fdfdcb]/80 text-center leading-relaxed">
          Provides academic oversight and guides experimental design methodologies throughout the Software Engineering Lab project lifecycle.
        </p>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 4. PRESENTATIONS ARCHIVE PAGE COMPONENT
// ----------------------------------------------------
function PresentationsPage({ navigateTo }: { navigateTo: (route: Route) => void }) {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listPresentations()
      .then((data) => {
        if (!cancelled) setPresentations(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load the archive');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-12">
      <div className="border-b-4 border-[#2121de] pb-4">
        <h1 className="font-press-start text-2xl text-white">PRESENTATION ARCHIVE</h1>
        <p className="font-vt323 text-xl text-[#6b7280] mt-1">High-score index board for permanent deck releases</p>
      </div>

      <div className="arcade-card max-w-4xl mx-auto p-4 md:p-8">
        <div className="border-2 border-[#2121de] overflow-x-auto">
          <table className="w-full text-left font-vt323 text-lg">
            <thead>
              <tr className="border-b-2 border-[#2121de] bg-[#0c0c1e] text-[#ffeb3b] text-sm md:text-base font-press-start">
                <th className="p-4">ID</th>
                <th className="p-4">PRESENTATION TITLE</th>
                <th className="p-4">VERSION</th>
                <th className="p-4">RELEASE DATE</th>
                <th className="p-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1 is pinned: the graded Planning Presentation v1.0 lives
                  in-app as a native slide viewer (see PlanningPresentationView),
                  not as an uploaded file in the backend archive, and must
                  remain reachable regardless of what's in the database. */}
              <tr className="border-b border-[#2121de]/60 hover:bg-[#2121de]/10 transition-colors">
                <td className="p-4 font-press-start text-xs text-[#ff0000]">01</td>
                <td className="p-4 font-sans text-sm font-semibold text-white">
                  Planning Presentation v1.0
                  <span className="block font-vt323 text-xs text-[#6b7280] font-normal mt-1">
                    Initial scope approval and statistical model designs
                  </span>
                </td>
                <td className="p-4 font-press-start text-[10px]">1.0</td>
                <td className="p-4 text-[#fdfdcb]/80">August 22, 2026</td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => navigateTo('planning-v1')}
                    className="px-3 py-1.5 border border-[#ffeb3b] text-[#ffeb3b] hover:bg-[#ffeb3b] hover:text-[#05050d] font-press-start text-[9px] tracking-wider transition-colors cursor-pointer"
                  >
                    OPEN
                  </button>
                </td>
              </tr>

              {/* Rows 2+: real published versions from the backend archive */}
              {loading && (
                <tr>
                  <td colSpan={5} className="p-6 text-center font-press-start text-[10px] text-[#6b7280] animate-pulse">
                    LOADING ARCHIVE...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={5} className="p-6 text-center font-press-start text-[10px] text-[#ff0000]">
                    FAILED TO LOAD: {error}
                  </td>
                </tr>
              )}

              {!loading && !error && presentations.length === 0 && (
                <tr className="text-[#6b7280]">
                  <td colSpan={5} className="p-6 text-center font-press-start text-[10px]">
                    NO ADDITIONAL RELEASES YET
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                presentations.map((p, idx) => (
                  <tr key={p.id} className="border-b border-[#2121de]/60 hover:bg-[#2121de]/10 transition-colors">
                    <td className="p-4 font-press-start text-xs text-[#00ffff]">
                      {String(idx + 2).padStart(2, '0')}
                    </td>
                    <td className="p-4 font-sans text-sm font-semibold text-white">
                      {p.title}
                      {p.changeSummary && (
                        <span className="block font-vt323 text-xs text-[#6b7280] font-normal mt-1">
                          {p.changeSummary}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-press-start text-[10px]">{p.version}</td>
                    <td className="p-4 text-[#fdfdcb]/80">{p.date}</td>
                    <td className="p-4 text-center font-press-start text-[8px] text-[#00ff00]">PUBLISHED</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 5. PLANNING PRESENTATION v1 VIEWER COMPONENT
// ----------------------------------------------------
interface Slide {
  title: string;
  subtitle?: string;
  content: React.ReactNode;
}

function PlanningPresentationView() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    {
      title: "1. Problem & Invisible Variation",
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed">
            Existing tools report simple activity outputs (e.g. comment counts or commit intervals). They do not evaluate whether a code review received disproportionately high or low developer effort relative to the pull request's complexity.
          </p>
          <div className="border-l-4 border-[#ff0000] bg-[#ff0000]/10 p-3">
            <h4 className="font-press-start text-[10px] text-white">THE INVISIBLE VARIATION PROBLEM:</h4>
            <p className="text-xs text-[#fdfdcb]/90 mt-1">
              Pull requests with identical line modifications can receive wildly inconsistent review checks. Some are approved instantly (rubber-stamping), while others face endless rounds of critical changes without valid technical reasons.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "2. Hypotheses",
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed">
            RevAudit evaluates the workflow pipeline across three central research hypotheses:
          </p>
          <ul className="space-y-3 text-xs">
            <li>
              <strong className="text-[#ffeb3b]">H1: Review Effort Variables</strong> — Pull request size is not the sole driver of review time. Repository age, reviewer context, and author tenure significantly predict cycle duration.
            </li>
            <li>
              <strong className="text-[#ffb8de]">H2: Process Signatures</strong> — Non-code factors leave distinct trace signals. Reviewer queue depth, time-of-day, and developer familiarity demonstrate correlation with speed and comment depth.
            </li>
            <li>
              <strong className="text-[#00ffff]">H3: Detection Reliability</strong> — Structural shifts in review patterns are statistically separable from normal day-to-day noise.
            </li>
          </ul>
        </div>
      )
    },
    {
      title: "3. Related Systems",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="border border-[#2121de] p-3 bg-black/40">
              <h4 className="font-press-start text-[9px] text-[#ffeb3b] mb-1">Standard Dev Dashboards</h4>
              <p>Expose raw, unadjusted averages (e.g. cycle times, commits per week) which misattribute bottlenecks and ignore PR complexity adjustments.</p>
            </div>
            <div className="border border-[#2121de] p-3 bg-black/40">
              <h4 className="font-press-start text-[9px] text-[#00ffff] mb-1">Academic Defect Predictors</h4>
              <p>Predict where bugs may reside in source files, but fail to evaluate the quality and workload distribution of the code review process itself.</p>
            </div>
          </div>
          <p className="text-xs border-t border-dashed border-[#2121de] pt-2 text-[#fdfdcb]/80">
            <strong>RevAudit Advantage:</strong> Integrates hierarchical regression to control for confounders and separate systemic bottlenecks from individual performance.
          </p>
        </div>
      )
    },
    {
      title: "4. Data Schema & Semantics",
      content: (
        <div className="space-y-4">
          <p className="text-xs">
            RevAudit enforces strict structural separation between **Reviews**, **Review Comments**, and general **Issue Comments**.
          </p>
          <div className="bg-black/60 p-3 rounded font-mono text-[10px] overflow-x-auto text-[#00ff00] border border-[#2121de]">
            {`[Pull Request] ---> (1:N) ---> [Review (State: Approved/Changes Requested)]
     |
     +--------------> (1:N) ---> [Review Comment (Target: Specific Line)]
     |
     +--------------> (1:N) ---> [Issue Comment (General Discussion)]`}
          </div>
          <p className="text-[10px] text-[#6b7280]">
            *Parsed via GitHub GraphQL API, tracking file revisions, comment sizes, and reviewer timestamps.
          </p>
        </div>
      )
    },
    {
      title: "5. Hierarchical Model Design",
      content: (
        <div className="space-y-4">
          <p className="text-sm">
            RevAudit avoids simple flat models in favor of a **hierarchical mixed-effects regression structure**.
          </p>
          <div className="border-2 border-dashed border-[#ffb847] p-3 text-center bg-[#ffb847]/5 font-mono text-xs">
            ReviewEffort ~ PRSize + Workload + (1 | Repository) + (1 | Reviewer)
          </div>
          <p className="text-xs text-[#fdfdcb]/80 leading-relaxed">
            By modeling Repository and Reviewer as random intercepts, the system separates team-level review habits and developer-specific velocities from general PR sizing variables.
          </p>
        </div>
      )
    },
    {
      title: "6. Baseline Comparisons",
      content: (
        <div className="space-y-4">
          <p className="text-xs">
            The modeling engine evaluates performance improvements relative to three established baselines:
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-[#2121de] pb-1">
              <span className="font-semibold text-white">1. Global Pooled Regression</span>
              <span className="text-[#6b7280]">Treats all repositories and developers as identical.</span>
            </div>
            <div className="flex justify-between border-b border-[#2121de] pb-1">
              <span className="font-semibold text-white">2. Raw Activity Counts</span>
              <span className="text-[#6b7280]">Unadjusted averages of review velocity metrics.</span>
            </div>
            <div className="flex justify-between border-b border-[#2121de] pb-1">
              <span className="font-semibold text-white">3. Academic Time-to-Merge Models</span>
              <span className="text-[#6b7280]">Predictive models based purely on modified lines of code.</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "7. Evaluation Protocol",
      content: (
        <div className="space-y-4">
          <p className="text-xs leading-relaxed">
            Evaluating performance on open-source repositories without ground truth requires a robust evaluation framework:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
            <div className="border border-[#ffb8de] p-3 bg-black/40">
              <span className="text-[#ffb8de] font-semibold">1. Controlled Injected Shifts</span>
              <p className="mt-1 text-[#fdfdcb]/80">Manually insert artificial delays and reviews into validation sets to verify if the detection engine flags them.</p>
            </div>
            <div className="border border-[#00ffff] p-3 bg-black/40">
              <span className="text-[#00ffff] font-semibold">2. Held-out Repository Tests</span>
              <p className="mt-1 text-[#fdfdcb]/80">Validate predictive metrics across five independent repositories excluded during initial training runs.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "8. Ethical Boundaries",
      content: (
        <div className="space-y-4">
          <div className="border-2 border-[#ff0000] p-4 bg-[#ff0000]/5 space-y-2">
            <div className="flex items-center gap-2 text-[#ff0000] font-press-start text-[10px]">
              <AlertTriangle size={14} />
              SYSTEM BOUNDARIES & SAFETY SAFEGUARDS
            </div>
            <ul className="list-disc list-inside text-xs space-y-2 text-[#fdfdcb]/95">
              <li>The engine does not output reviewer rank lists or score cards.</li>
              <li>Calculations do not label individual developers as slow or biased.</li>
              <li>Anonymized profiles are used across all evaluation structures.</li>
              <li>Outputs flag system process shifts, not individual behavior profiles.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "9. System & Deployment Architecture",
      content: (
        <div className="space-y-4">
          <p className="text-xs">
            RevAudit runs a lightweight data ingestion engine that publishes metadata to a PostgreSQL storage node.
          </p>
          <div className="bg-black/60 p-3 rounded font-mono text-[10px] overflow-x-auto text-[#00ffff] border border-[#2121de]">
            {`[GitHub REST/GraphQL API] 
          ↓ (Scrapes 15 Repos, 5k PRs)
[Python CLI Parser & Loader]
          ↓ (Bulk Writes)
[PostgreSQL Database] 
          ↓ (Query Engine)
[pandas + statsmodels Regression Engine]
          ↓ (Aggregated Model Outputs)
[FastAPI Server Node] 
          ↓ (React Dashboard JSON Delivery)
[Self-Hosted Nginx Deployment]`}
          </div>
        </div>
      )
    },
    {
      title: "10. 17-Week Timeline",
      content: (
        <div className="space-y-4">
          <p className="text-xs">
            The project deployment roadmap spans the current semester term:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-vt323 text-base">
            <div className="border border-[#2121de] p-2 bg-[#0c0c1e]">
              <span className="text-[#ff0000] font-press-start text-[8px] block">WEEKS 1-4</span>
              API ingestion loader scripts & DB schema definition.
            </div>
            <div className="border border-[#2121de] p-2 bg-[#0c0c1e]">
              <span className="text-[#ffb8de] font-press-start text-[8px] block">WEEKS 5-10</span>
              Prototyping statistical model queries & script modules.
            </div>
            <div className="border border-[#2121de] p-2 bg-[#0c0c1e]">
              <span className="text-[#00ffff] font-press-start text-[8px] block">WEEKS 11-17</span>
              FastAPI integration, verification, and VPS deployment.
            </div>
          </div>
        </div>
      )
    }
  ];

  // Key handlers for arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Home') {
        setCurrentSlide(0);
      } else if (e.key === 'End') {
        setCurrentSlide(slides.length - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [slides.length]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* HUD Bar */}
      <div className="arcade-card p-4 flex items-center justify-between text-[10px] font-press-start text-white border-dashed">
        <div>SCORE: {(currentSlide + 1).toString().padStart(2, '0')} / {slides.length.toString().padStart(2, '0')}</div>
        <div className="text-[#ffeb3b]">LEVEL: PLANNING V1.0</div>
        <div className="hidden sm:block text-[#00ffff]">TEAM: ARCHCODERS</div>
      </div>

      {/* Main Slide Screen Container */}
      <div className="arcade-card min-h-[350px] flex flex-col justify-between p-6 md:p-8 bg-[#0c0c1e] relative">
        {/* Retro scanline effect inside screen */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] pointer-events-none z-10"></div>
        
        {/* Slide Title */}
        <div className="border-b border-[#2121de] pb-4 mb-4">
          <h2 className="font-press-start text-xs md:text-sm text-[#ffeb3b] tracking-wider uppercase">
            {slides[currentSlide].title}
          </h2>
          <div className="flex items-center gap-1 text-[8px] font-press-start text-[#6b7280] mt-2">
            <span>VERSION 1.0</span>
            <span>•</span>
            <span>AUG 2026</span>
            <span>•</span>
            <span>AUTHORS: ARCHCODERS</span>
          </div>
        </div>

        {/* Slide Content */}
        <div className="flex-1 flex flex-col justify-center py-4">
          {slides[currentSlide].content}
        </div>

        {/* Navigation Buttons inside Cabinet */}
        <div className="border-t border-[#2121de] pt-4 mt-6 flex items-center justify-between">
          <button 
            onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
            disabled={currentSlide === 0}
            className={`arcade-btn py-2 px-3 text-[9px] flex items-center gap-1 ${
              currentSlide === 0 ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            <ArrowLeft size={10} /> PREV
          </button>

          <span className="font-press-start text-[9px] text-[#6b7280]">
            USE KEYBOARD ARROWS
          </span>

          <button 
            onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))}
            disabled={currentSlide === slides.length - 1}
            className={`arcade-btn py-2 px-3 text-[9px] flex items-center gap-1 ${
              currentSlide === slides.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            NEXT <ArrowRight size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 6. ARCHITECTURE PAGE COMPONENT
// ----------------------------------------------------
function ArchitecturePage() {
  return (
    <div className="space-y-12">
      <div className="border-b-4 border-[#2121de] pb-4">
        <h1 className="font-press-start text-2xl text-white">SYSTEM ARCHITECTURE</h1>
        <p className="font-vt323 text-xl text-[#6b7280] mt-1">Application processes and presentation workflows</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: System Flow */}
        <div className="arcade-card p-6 space-y-6">
          <div className="border-b border-[#2121de] pb-3">
            <h2 className="font-press-start text-xs text-[#ffeb3b]">REVAUDIT DATA PIPELINE</h2>
            <p className="font-vt323 text-base text-[#6b7280] mt-1">How statistical review patterns are captured and mapped</p>
          </div>

          <div className="space-y-4">
            <div className="border-2 border-[#2121de] p-3 bg-black/40">
              <span className="font-press-start text-[10px] text-white block">1. GitHub Scraper & Loader</span>
              <p className="font-sans text-xs text-[#fdfdcb]/80 mt-1">
                Reads commit headers, reviewer usernames, comments, and file revisions from target repositories via the Github API.
              </p>
            </div>

            <div className="border-2 border-[#2121de] p-3 bg-black/40">
              <span className="font-press-start text-[10px] text-[#ffb8de] block">2. Ingestion Store</span>
              <p className="font-sans text-xs text-[#fdfdcb]/80 mt-1">
                PostgreSQL database storing raw pull request metrics, review durations, and reviewer queue states.
              </p>
            </div>

            <div className="border-2 border-[#2121de] p-3 bg-black/40">
              <span className="font-press-start text-[10px] text-[#00ffff] block">3. Stats Modeling Engine</span>
              <p className="font-sans text-xs text-[#fdfdcb]/80 mt-1">
                A custom Python module utilizing pandas and statsmodels to run hierarchical regression calculations and predict expected review effort values.
              </p>
            </div>

            <div className="border-2 border-[#2121de] p-3 bg-black/40">
              <span className="font-press-start text-[10px] text-[#ffb847] block">4. API Interface</span>
              <p className="font-sans text-xs text-[#fdfdcb]/80 mt-1">
                FastAPI endpoints serving computed model coefficients, statistical residuals, and anomaly labels to the user dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Website Workflow */}
        <div className="arcade-card p-6 space-y-6">
          <div className="border-b border-[#2121de] pb-3">
            <h2 className="font-press-start text-xs text-[#00ffff]">PORTFOLIO PUBLISHING ARCHITECTURE</h2>
            <p className="font-vt323 text-base text-[#6b7280] mt-1">Structure for secure slide deck version updates</p>
          </div>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-[#00ffff]/40 p-3 bg-black/40">
              <span className="font-press-start text-[10px] text-[#00ffff] block">1. Administrator View</span>
              <p className="font-sans text-xs text-[#fdfdcb]/80 mt-1">
                Terminal-style administrative shell verifying upload credentials and validating submission payloads.
              </p>
            </div>

            <div className="border-2 border-dashed border-[#00ffff]/40 p-3 bg-black/40">
              <span className="font-press-start text-[10px] text-white block">2. Ingestion Handler</span>
              <p className="font-sans text-xs text-[#fdfdcb]/80 mt-1">
                Backend middleware processing file uploads and writing metadata logs (title, version, release date).
              </p>
            </div>

            <div className="border-2 border-dashed border-[#00ffff]/40 p-3 bg-black/40">
              <span className="font-press-start text-[10px] text-[#ffeb3b] block">3. Object Repository</span>
              <p className="font-sans text-xs text-[#fdfdcb]/80 mt-1">
                Secure S3 object bucket storage hosting raw document decks, slide PDFs, and presentation assets.
              </p>
            </div>

            <div className="border-2 border-dashed border-[#00ffff]/40 p-3 bg-black/40">
              <span className="font-press-start text-[10px] text-[#ff0000] block">4. Static Resolver</span>
              <p className="font-sans text-xs text-[#fdfdcb]/80 mt-1">
                Express/FastAPI routing rendering published versions under fixed, immutable routes like `/presentations/planning-v1`.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------------------
// 7. ADMIN TERMINAL COMPONENT
// ----------------------------------------------------
type UploadState = 'READY' | 'UPLOADING' | 'PROCESSING' | 'UPLOADED' | 'PUBLISHED' | 'FAILED';

function AdminPage() {
  // Session
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // User management — HEAD_ADMIN only, backend enforces this regardless of
  // what the UI shows.
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userActionError, setUserActionError] = useState<string | null>(null);
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'USER'>('ADMIN');
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [createUserLoading, setCreateUserLoading] = useState(false);

  // Upload form + real (not simulated) publish flow
  const [uploadState, setUploadState] = useState<UploadState>('READY');
  const [uploadStep, setUploadStep] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [publishedResult, setPublishedResult] = useState<Presentation | null>(null);
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [authorsInput, setAuthorsInput] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore a session from a previously-stored token on mount/reload.
  useEffect(() => {
    if (!getToken()) {
      setAuthChecking(false);
      return;
    }
    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null))
      .finally(() => setAuthChecking(false));
  }, []);

  // Load dashboard stats once logged in.
  useEffect(() => {
    if (!currentUser || currentUser.role === 'USER') return;
    setDashboardError(null);
    getDashboard()
      .then(setDashboard)
      .catch((err) => setDashboardError(err instanceof Error ? err.message : 'Failed to load dashboard'));
  }, [currentUser]);

  const refreshUsers = async () => {
    try {
      setUsersError(null);
      setUsers(await listUsers());
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'Failed to load users');
    }
  };

  // Only a HEAD_ADMIN ever sees this data — the backend enforces the same
  // gate independently, this is just what decides whether the frontend asks.
  useEffect(() => {
    if (currentUser?.role !== 'HEAD_ADMIN') return;
    setUsersLoading(true);
    refreshUsers().finally(() => setUsersLoading(false));
  }, [currentUser]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError(null);
    setCreateUserLoading(true);
    try {
      await createUser({ name: newUserName, email: newUserEmail, password: newUserPassword, role: newUserRole });
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('ADMIN');
      setShowCreateUserForm(false);
      await refreshUsers();
    } catch (err) {
      setCreateUserError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreateUserLoading(false);
    }
  };

  const handleChangeRole = async (id: string, role: 'ADMIN' | 'USER') => {
    setUserActionError(null);
    try {
      await changeUserRole(id, role);
      await refreshUsers();
    } catch (err) {
      setUserActionError(err instanceof Error ? err.message : 'Failed to change role');
    }
  };

  const handleRemoveUser = async (id: string, email: string) => {
    if (!window.confirm(`Remove ${email}? This cannot be undone.`)) return;
    setUserActionError(null);
    try {
      await removeUser(id);
      await refreshUsers();
    } catch (err) {
      setUserActionError(err instanceof Error ? err.message : 'Failed to remove user');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const user = await login(loginEmail, loginPassword);
      setCurrentUser(user);
      setLoginPassword('');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setDashboard(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = () => setDragActive(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    setSelectedFiles(Array.from(e.dataTransfer.files));
  };
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files ? Array.from(e.target.files) : []);
  };

  // Real three-step publish flow: create the version record, upload the
  // file(s) onto it, then flip it to published. Nothing here is simulated —
  // each step is an actual API call, and a failure at any step lands on
  // FAILED with the real error message instead of continuing anyway.
  const startUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const authors = authorsInput
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    if (!title || !version || !releaseDate || authors.length === 0) {
      setUploadError('Title, version, release date, and at least one author are required.');
      setUploadState('FAILED');
      return;
    }
    if (selectedFiles.length === 0) {
      setUploadError('Select at least one file to upload.');
      setUploadState('FAILED');
      return;
    }

    setUploadError(null);
    setUploadState('UPLOADING');
    setUploadStep(1);

    try {
      const presentation = await createPresentation({
        title,
        version,
        date: releaseDate,
        authors,
        changeSummary: changeSummary || undefined,
      });

      setUploadState('PROCESSING');
      setUploadStep(2);
      await uploadFiles(presentation.id, selectedFiles);

      setUploadState('UPLOADED');
      setUploadStep(3);
      const published = await publishPresentation(presentation.id);

      setPublishedResult(published);
      setUploadState('PUBLISHED');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
      setUploadState('FAILED');
    }
  };

  const resetForm = () => {
    setTitle('');
    setVersion('');
    setReleaseDate('');
    setAuthorsInput('');
    setChangeSummary('');
    setSelectedFiles([]);
    setUploadState('READY');
    setUploadStep(0);
    setUploadError(null);
    setPublishedResult(null);
  };

  return (
    <div className="space-y-12 max-w-2xl mx-auto">
      <div className="border-b-4 border-[#00ffff] pb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-press-start text-2xl text-white">ADMIN PORTAL</h1>
          <p className="font-vt323 text-xl text-[#6b7280] mt-1">Presentation publisher shell</p>
        </div>
        {currentUser && (
          <button
            onClick={handleLogout}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 border border-[#6b7280] text-[#6b7280] hover:text-white hover:border-white font-press-start text-[9px] transition-colors"
          >
            <LogOut size={12} /> LOGOUT
          </button>
        )}
      </div>

      <div className="arcade-card bg-black p-4 md:p-6 font-mono text-xs border-2 border-[#00ffff] relative overflow-hidden">
        {/* Scanlines inside shell */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.12)_50%)] bg-[length:100%_4px] pointer-events-none z-10"></div>

        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-[#00ffff]/30 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff0000]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffeb3b]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#00ff00]"></div>
          </div>
          <span className="text-[#00ffff]/60 font-bold tracking-widest text-[9px] font-press-start">
            ARCHCODERS-TERMINAL
          </span>
        </div>

        {authChecking ? (
          <div className="py-12 text-center text-[#00ffff] font-press-start text-xs animate-pulse relative z-20">
            CHECKING SESSION...
          </div>
        ) : !currentUser ? (
          <form onSubmit={handleLogin} className="space-y-6 relative z-20">
            <div className="text-[#00ffff] font-semibold mb-2">user@archcoders-admin:~$ login</div>

            <div className="space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[#00ffff] font-semibold uppercase text-[10px] font-press-start">EMAIL</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="bg-[#0c0c1e] border-2 border-[#2121de] px-3 py-2 text-[#fdfdcb] focus:outline-none focus:border-[#00ffff]"
                  required
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[#00ffff] font-semibold uppercase text-[10px] font-press-start">PASSWORD</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#0c0c1e] border-2 border-[#2121de] px-3 py-2 text-[#fdfdcb] focus:outline-none focus:border-[#00ffff]"
                  required
                />
              </div>
            </div>

            {loginError && (
              <div className="flex items-start gap-2 text-[#ff0000] text-[10px] border border-[#ff0000]/40 bg-[#ff0000]/5 p-3">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loginLoading}
                className="flex items-center gap-2 px-4 py-2 border-2 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black font-press-start text-[9px] tracking-wider transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading && <Loader2 size={12} className="animate-spin" />}
                {loginLoading ? 'AUTHENTICATING...' : 'LOGIN'}
              </button>
            </div>
          </form>
        ) : currentUser.role === 'USER' ? (
          <div className="py-12 text-center relative z-20 space-y-2">
            <AlertTriangle className="mx-auto text-[#ffb847]" size={28} />
            <div className="text-[#ffb847] font-press-start text-xs">NO ADMIN ACCESS</div>
            <p className="text-[10px] text-[#6b7280]">Your account is a standard USER — this portal is for admins only.</p>
          </div>
        ) : (
          <div className="space-y-8 relative z-20">
            {/* Dashboard */}
            <div>
              <div className="text-[#00ffff] font-semibold mb-3">user@archcoders-admin:~$ dashboard</div>
              {dashboardError ? (
                <div className="text-[#ff0000] text-[10px]">FAILED TO LOAD DASHBOARD: {dashboardError}</div>
              ) : !dashboard ? (
                <div className="text-[#6b7280] text-[10px] animate-pulse">LOADING STATS...</div>
              ) : (
                <div className="grid grid-cols-3 gap-3 font-press-start text-center">
                  <div className="border border-[#2121de] p-3">
                    <div className="text-lg text-white">{dashboard.presentations.total}</div>
                    <div className="text-[8px] text-[#6b7280] mt-1">TOTAL</div>
                  </div>
                  <div className="border border-[#00ff00]/50 p-3">
                    <div className="text-lg text-[#00ff00]">{dashboard.presentations.published}</div>
                    <div className="text-[8px] text-[#6b7280] mt-1">PUBLISHED</div>
                  </div>
                  <div className="border border-[#ffeb3b]/50 p-3">
                    <div className="text-lg text-[#ffeb3b]">{dashboard.presentations.draft}</div>
                    <div className="text-[8px] text-[#6b7280] mt-1">DRAFT</div>
                  </div>
                </div>
              )}
            </div>

            {/* User management — HEAD_ADMIN only */}
            {currentUser.role === 'HEAD_ADMIN' && (
              <div className="border-t border-[#00ffff]/20 pt-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-[#00ffff] font-semibold">user@archcoders-admin:~$ users</div>
                  <button
                    onClick={() => setShowCreateUserForm((v) => !v)}
                    className="px-3 py-1.5 border border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black font-press-start text-[9px] transition-colors"
                  >
                    {showCreateUserForm ? 'CANCEL' : '+ CREATE ADMIN'}
                  </button>
                </div>

                {showCreateUserForm && (
                  <form onSubmit={handleCreateUser} className="space-y-3 border border-[#00ffff]/30 p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[#00ffff] uppercase text-[10px] font-press-start">Name</label>
                        <input
                          type="text"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          className="bg-[#0c0c1e] border-2 border-[#2121de] px-3 py-2 text-[#fdfdcb] focus:outline-none focus:border-[#00ffff]"
                          required
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[#00ffff] uppercase text-[10px] font-press-start">Email</label>
                        <input
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          className="bg-[#0c0c1e] border-2 border-[#2121de] px-3 py-2 text-[#fdfdcb] focus:outline-none focus:border-[#00ffff]"
                          required
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[#00ffff] uppercase text-[10px] font-press-start">Password</label>
                        <input
                          type="password"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          className="bg-[#0c0c1e] border-2 border-[#2121de] px-3 py-2 text-[#fdfdcb] focus:outline-none focus:border-[#00ffff]"
                          required
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[#00ffff] uppercase text-[10px] font-press-start">Role</label>
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as 'ADMIN' | 'USER')}
                          className="bg-[#0c0c1e] border-2 border-[#2121de] px-3 py-2 text-[#fdfdcb] focus:outline-none focus:border-[#00ffff]"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="USER">USER</option>
                        </select>
                      </div>
                    </div>

                    {createUserError && (
                      <div className="flex items-start gap-2 text-[#ff0000] text-[10px] border border-[#ff0000]/40 bg-[#ff0000]/5 p-3">
                        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                        <span>{createUserError}</span>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={createUserLoading}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black font-press-start text-[9px] tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {createUserLoading && <Loader2 size={12} className="animate-spin" />}
                        {createUserLoading ? 'CREATING...' : 'CREATE USER'}
                      </button>
                    </div>
                  </form>
                )}

                {userActionError && <div className="text-[#ff0000] text-[10px]">{userActionError}</div>}

                {usersLoading ? (
                  <div className="text-[#6b7280] text-[10px] animate-pulse">LOADING USERS...</div>
                ) : usersError ? (
                  <div className="text-[#ff0000] text-[10px]">FAILED TO LOAD USERS: {usersError}</div>
                ) : (
                  <div className="overflow-x-auto border border-[#2121de]">
                    <table className="w-full text-left text-[10px] font-sans">
                      <thead>
                        <tr className="border-b border-[#2121de] text-[#ffeb3b] font-press-start text-[8px]">
                          <th className="p-2">NAME</th>
                          <th className="p-2">EMAIL</th>
                          <th className="p-2">ROLE</th>
                          <th className="p-2 text-center">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-b border-[#2121de]/40">
                            <td className="p-2 text-white">{u.name}</td>
                            <td className="p-2 text-[#fdfdcb]/80 break-all">{u.email}</td>
                            <td className="p-2">
                              <span
                                className={`font-press-start text-[8px] ${
                                  u.role === 'HEAD_ADMIN'
                                    ? 'text-[#ffeb3b]'
                                    : u.role === 'ADMIN'
                                      ? 'text-[#00ffff]'
                                      : 'text-[#6b7280]'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="p-2">
                              {u.role === 'HEAD_ADMIN' ? (
                                <div className="text-[8px] text-[#6b7280] font-press-start text-center">PROTECTED</div>
                              ) : (
                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                  <select
                                    value={u.role}
                                    onChange={(e) => handleChangeRole(u.id, e.target.value as 'ADMIN' | 'USER')}
                                    className="bg-[#0c0c1e] border border-[#2121de] text-[#fdfdcb] text-[9px] px-1 py-0.5 focus:outline-none focus:border-[#00ffff]"
                                  >
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="USER">USER</option>
                                  </select>
                                  {u.id !== currentUser.id && (
                                    <button
                                      onClick={() => handleRemoveUser(u.id, u.email)}
                                      className="px-2 py-1 border border-[#ff0000] text-[#ff0000] hover:bg-[#ff0000] hover:text-black font-press-start text-[8px] transition-colors"
                                    >
                                      REMOVE
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-[#00ffff]/20 pt-6">
              {uploadState === 'READY' && (
                <form onSubmit={startUpload} className="space-y-6">
                  <div className="text-[#00ffff] font-semibold mb-2">user@archcoders-admin:~$ upload</div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileInputChange}
                    accept=".pdf,.ppt,.pptx,.zip,.png,.jpg,.jpeg,.svg"
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed transition-all p-6 text-center cursor-pointer space-y-2 ${
                      dragActive
                        ? 'border-[#00ffff] bg-[#00ffff]/10'
                        : 'border-[#00ffff]/40 hover:border-[#00ffff] hover:bg-[#00ffff]/5'
                    }`}
                  >
                    <FolderUp className="mx-auto text-[#00ffff]" size={28} />
                    <div className="font-semibold text-white">DROP FILE / SLIDE DECK FOLDER HERE</div>
                    <div className="text-[10px] text-[#6b7280]">OR CLICK TO BROWSE LOCAL FILES</div>
                    {selectedFiles.length > 0 && (
                      <div className="text-[10px] text-[#00ff00] pt-2 break-words">
                        {selectedFiles.length} FILE{selectedFiles.length > 1 ? 'S' : ''} SELECTED:{' '}
                        {selectedFiles.map((f) => f.name).join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[#00ffff] font-semibold uppercase text-[10px] font-press-start">TITLE</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Planning Presentation v2"
                        className="bg-[#0c0c1e] border-2 border-[#2121de] px-3 py-2 text-[#fdfdcb] focus:outline-none focus:border-[#00ffff]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[#00ffff] font-semibold uppercase text-[10px] font-press-start">VERSION</label>
                        <input
                          type="text"
                          value={version}
                          onChange={(e) => setVersion(e.target.value)}
                          placeholder="e.g. 2.0"
                          className="bg-[#0c0c1e] border-2 border-[#2121de] px-3 py-2 text-[#fdfdcb] focus:outline-none focus:border-[#00ffff]"
                          required
                        />
                      </div>

                      <div className="flex flex-col space-y-1">
                        <label className="text-[#00ffff] font-semibold uppercase text-[10px] font-press-start">RELEASE DATE</label>
                        <input
                          type="date"
                          value={releaseDate}
                          onChange={(e) => setReleaseDate(e.target.value)}
                          className="bg-[#0c0c1e] border-2 border-[#2121de] px-3 py-2 text-[#fdfdcb] focus:outline-none focus:border-[#00ffff]"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[#00ffff] font-semibold uppercase text-[10px] font-press-start">AUTHORS</label>
                      <input
                        type="text"
                        value={authorsInput}
                        onChange={(e) => setAuthorsInput(e.target.value)}
                        placeholder="e.g. Dheeraj Kumar, Vaibhav Goyal"
                        className="bg-[#0c0c1e] border-2 border-[#2121de] px-3 py-2 text-[#fdfdcb] focus:outline-none focus:border-[#00ffff]"
                        required
                      />
                      <span className="text-[9px] text-[#6b7280]">Comma-separated</span>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[#00ffff] font-semibold uppercase text-[10px] font-press-start">CHANGE SUMMARY</label>
                      <textarea
                        value={changeSummary}
                        onChange={(e) => setChangeSummary(e.target.value)}
                        placeholder="Summarize changes and model revisions..."
                        className="bg-[#0c0c1e] border-2 border-[#2121de] px-3 py-2 text-[#fdfdcb] h-20 resize-none focus:outline-none focus:border-[#00ffff]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 border-2 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black font-press-start text-[9px] tracking-wider transition-colors cursor-pointer"
                    >
                      UPLOAD & PUBLISH
                    </button>
                  </div>
                </form>
              )}

              {uploadState !== 'READY' && (
                <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
                  {(uploadState === 'UPLOADING' || uploadState === 'PROCESSING' || uploadState === 'UPLOADED') && (
                    <>
                      <div className="text-[#00ffff] font-press-start text-xs animate-pulse">
                        {uploadState === 'UPLOADING' && 'CREATING PRESENTATION RECORD...'}
                        {uploadState === 'PROCESSING' && 'UPLOADING FILES...'}
                        {uploadState === 'UPLOADED' && 'PUBLISHING...'}
                      </div>
                      <div className="w-64 bg-[#0c0c1e] border-2 border-[#2121de] h-4 relative">
                        <div
                          className="bg-[#00ffff] h-full transition-all duration-300"
                          style={{ width: `${(uploadStep / 3) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-[10px] text-[#6b7280]">STEP {uploadStep} OF 3</div>
                    </>
                  )}

                  {uploadState === 'PUBLISHED' && publishedResult && (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="w-12 h-12 rounded-full border-4 border-[#00ff00] flex items-center justify-center text-[#00ff00] animate-scale">
                          <Check size={24} />
                        </div>
                      </div>
                      <div className="text-[#00ff00] font-press-start text-xs">DECK SUCCESSFULLY PUBLISHED!</div>

                      <div className="arcade-card p-4 border-dashed max-w-sm mx-auto text-left space-y-2">
                        <div className="text-[9px] text-[#6b7280] font-press-start">VERSION INFO</div>
                        <div><strong className="text-white">Title:</strong> {publishedResult.title}</div>
                        <div><strong className="text-white">Version:</strong> {publishedResult.version}</div>
                        <div><strong className="text-white">Date:</strong> {publishedResult.date}</div>
                        {publishedResult.changeSummary && (
                          <div className="text-[10px] text-[#6b7280] leading-relaxed">{publishedResult.changeSummary}</div>
                        )}
                      </div>

                      <div className="pt-4 flex gap-4 justify-center">
                        <button
                          onClick={resetForm}
                          className="px-3 py-1.5 border border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black font-press-start text-[9px] transition-colors"
                        >
                          UPLOAD ANOTHER
                        </button>
                      </div>
                    </div>
                  )}

                  {uploadState === 'FAILED' && (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <AlertTriangle size={36} className="text-[#ff0000]" />
                      </div>
                      <div className="text-[#ff0000] font-press-start text-xs">UPLOAD FAILED</div>
                      {uploadError && <p className="text-[10px] text-[#6b7280] max-w-sm mx-auto">{uploadError}</p>}
                      <div className="pt-2 flex gap-4 justify-center">
                        <button
                          onClick={() => setUploadState('READY')}
                          className="px-3 py-1.5 border border-[#ff0000] text-[#ff0000] hover:bg-[#ff0000] hover:text-black font-press-start text-[9px] transition-colors"
                        >
                          RETRY
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notice Banner */}
      <div className="arcade-card p-4 border-dashed border-[#ffb847] bg-[#ffb847]/5 flex items-start gap-3">
        <AlertTriangle className="text-[#ffb847] flex-shrink-0" size={18} />
        <div>
          <span className="font-press-start text-[9px] text-[#ffb847] block mb-1">STORAGE NOTICE</span>
          <p className="font-sans text-xs text-[#fdfdcb]/80 leading-relaxed">
            Files are written to disk behind a swappable storage interface. AWS S3 integration will replace that driver later without changing this workflow.
          </p>
        </div>
      </div>
    </div>
  );
}
