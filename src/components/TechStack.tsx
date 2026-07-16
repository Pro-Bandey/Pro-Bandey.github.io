import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Code2, 
  Cpu, 
  Layers, 
  Sparkles, 
  Terminal, 
  ArrowRight,
  Workflow,
  Globe2,
  Database,
  CheckCircle2,
  Lock,
  Unlock,
  Layers3
} from 'lucide-react';
import { Repository, LANGUAGE_COLORS } from '../types';

interface TechStackProps {
  repos: Repository[];
  onNavigateToProject: (repoName: string) => void;
}

interface SkillComp {
  id: string;
  name: string;
  category: 'Frontend' | 'Backend & API' | 'Systems' | 'Infrastructure';
  level: 'Expert' | 'Advanced' | 'Proficient';
  icon: React.ComponentType<any>;
  description: string;
  associatedLangs: string[];
  keyTools: string[];
}

const SKILL_COMPETENCIES: SkillComp[] = [
  {
    id: 'next-react',
    name: 'Modern Web Architectures',
    category: 'Frontend',
    level: 'Expert',
    icon: Globe2,
    description: 'Developing high-performance, responsive Single Page Applications (SPAs) and Progressive Web Applications (PWAs) with rich client-side state engines.',
    associatedLangs: ['TypeScript', 'JavaScript', 'CSS', 'HTML'],
    keyTools: ['React 18', 'Vite', 'Tailwind CSS', 'Service Workers', 'ES6+'],
  },
  {
    id: 'responsive-ui',
    name: 'Interface Engineering & UX',
    category: 'Frontend',
    level: 'Expert',
    icon: Layers3,
    description: 'Polishing user interactions with smooth layout transition animations, custom CSS variables, and dark/light adaptive color configurations.',
    associatedLangs: ['CSS', 'HTML', 'Markdown', 'TypeScript'],
    keyTools: ['Tailwind CSS', 'Motion (Framer)', 'CSS Variables', 'Responsive Layouts'],
  },
  {
    id: 'api-go',
    name: 'Concurrent Services & APIs',
    category: 'Backend & API',
    level: 'Advanced',
    icon: Database,
    description: 'Designing backend aggregators, concurrent fetching layers, and fast cache compilation mechanisms.',
    associatedLangs: ['Go', 'TypeScript', 'JavaScript'],
    keyTools: ['Go Channels', 'Node.js', 'REST APIs', 'Deduplication Cache'],
  },
  {
    id: 'ci-pipeline',
    name: 'Automated CI/CD Workflows',
    category: 'Systems',
    level: 'Advanced',
    icon: Workflow,
    description: 'Creating declarative workflows to handle lint execution, live builds, asset validation, and secure container endpoints.',
    associatedLangs: ['Shell', 'Yml', 'Markdown'],
    keyTools: ['GitHub Actions', 'YAML Pipelines', 'Bash Scripting', 'Linter Pipelines'],
  },
  {
    id: 'system-utils',
    name: 'System Utilities & Tools',
    category: 'Systems',
    level: 'Advanced',
    icon: Terminal,
    description: 'Writing shell utilities, background daemon systems, and optimized execution patterns for development environments.',
    associatedLangs: ['Shell', 'Go', 'Yml'],
    keyTools: ['POSIX Shell', 'Task Runners', 'CLI Compilers', 'Dockerfiles'],
  },
  {
    id: 'doc-systems',
    name: 'Technical Writing & Docs',
    category: 'Infrastructure',
    level: 'Proficient',
    icon: Code2,
    description: 'Documenting repository setups, structural dependencies, API parameters, and deployment pipelines.',
    associatedLangs: ['Markdown', 'HTML'],
    keyTools: ['Markdown Specifications', 'Readme Blueprints', 'Technical Design Docs'],
  }
];

export const TechStack: React.FC<TechStackProps> = ({ repos, onNavigateToProject }) => {
  const [hoveredLang, setHoveredLang] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);

  // Active language filter prioritizes click selection, then hover
  const activeLanguage = selectedLang || hoveredLang;

  // Calculate language distribution percentages dynamically across the repository registry
  const languageStats = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalScore = 0;

    repos.forEach(repo => {
      if (repo.Langs) {
        Object.entries(repo.Langs).forEach(([lang, pct]) => {
          counts[lang] = (counts[lang] || 0) + pct;
          totalScore += pct;
        });
      }
    });

    if (totalScore === 0) return [];

    return Object.entries(counts)
      .map(([name, score]) => {
        const percentage = (score / totalScore) * 100;
        return {
          name,
          percentage,
          color: LANGUAGE_COLORS[name] || '#ff9900',
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [repos]);

  // Find repos associated with the active language
  const associatedRepos = useMemo(() => {
    if (!activeLanguage) return [];
    return repos.filter(repo => repo.Langs && Object.keys(repo.Langs).includes(activeLanguage));
  }, [activeLanguage, repos]);

  const handleLangClick = (lang: string) => {
    if (selectedLang === lang) {
      setSelectedLang(null); // Deselect
    } else {
      setSelectedLang(lang);
    }
  };

  return (
    <div className="space-y-8" id="tech-stack-module">
      {/* Header section with telemetry bar */}
      <div className="relative overflow-hidden bg-white/[0.02] border border-white/5 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)] animate-pulse" />
            <span className="font-mono text-[10px] text-primary tracking-widest font-black uppercase">
              MODULE_04 // SKILLSET ANALYSIS
            </span>
          </div>
          <h2 className="font-sans text-2xl font-black text-text-main uppercase tracking-tight">
            Interactive Tech Stack
          </h2>
          <p className="text-xs text-text-muted max-w-xl font-sans">
            A dynamic cross-reference board linking specific repository languages to engineering capabilities. Hover or click languages below to filter competencies.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-black/35 border border-white/5 px-4 py-3 rounded-xl font-mono text-center min-w-[110px]">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Stack Scope</p>
            <p className="text-xl font-bold text-slate-200 mt-0.5">{languageStats.length}</p>
            <p className="text-[8px] text-primary font-bold mt-0.5 uppercase">Languages</p>
          </div>
          <div className="bg-black/35 border border-white/5 px-4 py-3 rounded-xl font-mono text-center min-w-[110px]">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Capabilities</p>
            <p className="text-xl font-bold text-slate-200 mt-0.5">{SKILL_COMPETENCIES.length}</p>
            <p className="text-[8px] text-[#00dd00] font-bold mt-0.5 uppercase">Categories</p>
          </div>
        </div>
      </div>

      {/* Horizontal Languages Control Panel */}
      <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 relative overflow-hidden space-y-4">
        {/* Subtle decorative corners */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary/20" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/5" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/5" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary/20" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs font-black text-slate-200 uppercase tracking-wider">
              LANGUAGE_TELEMETRY_CONTROL_PANEL
            </span>
          </div>
          <span className="text-[9px] font-mono text-slate-500 uppercase">
            Click to lock filter • Hover to temporarily map associations_
          </span>
        </div>

        {/* Horizontal Row of Languages */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {languageStats.map((lang) => {
            const isActive = activeLanguage === lang.name;
            const isSelected = selectedLang === lang.name;
            const activeColor = lang.color;

            return (
              <button
                key={lang.name}
                onMouseEnter={() => setHoveredLang(lang.name)}
                onMouseLeave={() => setHoveredLang(null)}
                onClick={() => handleLangClick(lang.name)}
                className={`text-left p-3.5 rounded-xl border transition-all duration-300 relative group cursor-pointer ${
                  isActive 
                    ? 'bg-white/[0.03] border-white/15 shadow-[0_0_15px_rgba(255,153,0,0.03)] scale-[1.02]' 
                    : 'bg-transparent border-white/5 hover:border-white/10 hover:bg-white/[0.01]'
                }`}
              >
                {/* Glowing highlight indicator */}
                {isActive && (
                  <div 
                    className="absolute inset-x-0 bottom-0 h-[3px] rounded-b-full transition-all duration-300"
                    style={{ backgroundColor: activeColor }}
                  />
                )}

                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="flex items-center gap-2 font-bold text-slate-200 truncate">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-300 group-hover:scale-125" 
                      style={{ 
                        backgroundColor: activeColor,
                        boxShadow: isActive ? `0 0 10px ${activeColor}bb` : `0 0 5px ${activeColor}44`
                      }} 
                    />
                    <span className="truncate">{lang.name}</span>
                  </span>
                  <span className="text-slate-400 font-bold shrink-0">
                    {lang.percentage.toFixed(1)}%
                  </span>
                </div>

                {/* Styled dynamic progress bar */}
                <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden mt-2.5 p-[0.5px] border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${lang.percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full transition-all duration-300"
                    style={{ backgroundColor: activeColor }}
                  />
                </div>

                {/* Indicator text */}
                <div className="flex items-center justify-between text-[8px] font-mono mt-2 text-slate-500">
                  <span>
                    {isSelected ? 'Locked Filter' : 'Click to Lock'}
                  </span>
                  {isActive && (
                    <span className="font-bold uppercase animate-pulse" style={{ color: activeColor }}>
                      Active
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Split Section: Left is Associated Repos, Right is Engineering Competencies */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Section: Associated Repos */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              Associated Registries
            </span>
            <span className="font-mono text-[9px] text-primary uppercase font-bold bg-primary-alpha/5 px-2 py-0.5 rounded border border-primary-alpha-strong/10">
              {activeLanguage ? `Stack: ${activeLanguage}` : 'All Registries'}
            </span>
          </div>

          <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 space-y-4 relative overflow-hidden min-h-[300px] flex flex-col justify-between">
            {/* Ambient subtle outline decorations */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary/20" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/5" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/5" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary/20" />

            {/* Background glow in selected color */}
            {activeLanguage && (
              <div 
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-300"
                style={{ backgroundColor: LANGUAGE_COLORS[activeLanguage] || '#ff9900' }}
              />
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-mono text-xs font-black text-slate-200 uppercase tracking-widest">
                  {activeLanguage ? `Filtered Repositories (${associatedRepos.length})` : 'Featured Repositories'}
                </h4>
                <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                  {activeLanguage 
                    ? `Showing repositories utilizing ${activeLanguage} stack elements:`
                    : 'Hover/click languages above to filter by technology stack:'
                  }
                </p>
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {(activeLanguage ? associatedRepos : repos.slice(0, 6)).map(repo => (
                  <button
                    key={repo.Repo}
                    onClick={() => onNavigateToProject(repo.Repo)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 hover:border-primary/40 bg-black/25 hover:bg-black/45 text-left transition-all duration-200 group cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-mono text-xs font-bold text-slate-200 group-hover:text-primary transition-colors truncate uppercase">
                        {repo.Repo}
                      </p>
                      <p className="text-[10px] text-slate-500 font-sans truncate max-w-[280px] mt-0.5">
                        {repo.Desc}
                      </p>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/5 border border-white/5 group-hover:border-primary/20 text-slate-500 group-hover:text-primary transition-all">
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {!activeLanguage && (
              <div className="text-[10px] font-mono text-slate-500 bg-white/[0.02] border border-white/5 p-3 rounded-xl leading-relaxed flex items-center gap-2 mt-4">
                <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
                <span>Interact with horizontal telemetry above to cross-reference competencies!</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Engineering Competencies */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              Engineering Competencies
            </span>
            <span className="font-mono text-[9px] text-primary uppercase font-bold bg-primary-alpha/5 px-2 py-0.5 rounded border border-primary-alpha-strong/10">
              {activeLanguage ? `Filter: ${activeLanguage}` : 'All Competencies'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SKILL_COMPETENCIES.map((skill) => {
              const IconComponent = skill.icon;
              const matchesLanguage = activeLanguage ? skill.associatedLangs.includes(activeLanguage) : false;
              
              // Style variables based on matching filters
              let borderStyle = 'border-white/5 bg-white/[0.01]';
              let scaleStyle = 'hover:border-white/10 hover:bg-white/[0.015]';
              let opacityStyle = 'opacity-100';
              let shadowStyle = {};

              if (activeLanguage) {
                if (matchesLanguage) {
                  const targetColor = LANGUAGE_COLORS[activeLanguage] || '#ff9900';
                  borderStyle = 'bg-white/[0.015]';
                  scaleStyle = 'scale-[1.01] shadow-[0_4px_20px_rgba(0,0,0,0.4)]';
                  opacityStyle = 'opacity-100';
                  shadowStyle = {
                    borderColor: `${targetColor}50`,
                    boxShadow: `inset 0 0 12px ${targetColor}08, 0 4px 20px rgba(0,0,0,0.15)`
                  };
                } else {
                  opacityStyle = 'opacity-25 scale-[0.98] blur-[0.5px] pointer-events-none';
                  scaleStyle = '';
                }
              }

              return (
                <div
                  key={skill.id}
                  style={shadowStyle}
                  className={`p-5 rounded-2xl border flex flex-col justify-between h-64 transition-all duration-300 relative group ${borderStyle} ${scaleStyle} ${opacityStyle}`}
                >
                  <div className="space-y-3.5">
                    {/* Header: Icon & Categories */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl border transition-all duration-300 ${
                          matchesLanguage 
                            ? 'bg-primary-alpha/10 border-primary-alpha-strong/20 text-primary' 
                            : 'bg-white/5 border-white/5 text-slate-400 group-hover:text-primary group-hover:bg-primary-alpha/5 group-hover:border-primary-alpha-strong/10'
                        }`}>
                          <IconComponent className="w-4 h-4 transition-transform duration-300 group-hover:rotate-6" />
                        </div>
                        <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest font-black bg-white/5 border border-white/5 px-2 py-0.5 rounded-md">
                          {skill.category}
                        </span>
                      </div>
                      <span className="font-mono text-[8px] font-bold text-[#00dd00] uppercase tracking-wider bg-[#00dd00]/5 border border-[#00dd00]/10 px-1.5 py-0.5 rounded-md">
                        {skill.level}
                      </span>
                    </div>

                    {/* Content text */}
                    <div className="space-y-1">
                      <h4 className="font-mono text-xs font-black text-slate-200 uppercase tracking-wide group-hover:text-primary transition-colors">
                        {skill.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans line-clamp-3">
                        {skill.description}
                      </p>
                    </div>
                  </div>

                  {/* Footing: Key Tools & Language Mapping */}
                  <div className="space-y-3 pt-3 border-t border-white/5 mt-auto">
                    {/* Key tools pills */}
                    <div className="flex flex-wrap gap-1">
                      {skill.keyTools.slice(0, 3).map(tool => (
                        <span
                          key={tool}
                          className="font-mono text-[8px] text-slate-500 bg-white/[0.01] border border-white/5 px-1.5 py-0.5 rounded transition-colors duration-200 hover:border-white/10"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>

                    {/* Underlining language badges */}
                    <div className="flex items-center gap-1.5 text-[8px] font-mono">
                      <span className="text-slate-600 font-bold uppercase shrink-0">Stack match:</span>
                      <div className="flex flex-wrap gap-1 truncate">
                        {skill.associatedLangs.map(lang => {
                          const isCurrentlyActive = activeLanguage === lang;
                          const langColor = LANGUAGE_COLORS[lang] || '#ff9900';
                          return (
                            <span
                              key={lang}
                              className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.2 rounded transition-all duration-300 ${
                                isCurrentlyActive
                                  ? 'text-slate-950 font-bold'
                                  : 'text-slate-500 bg-transparent border border-white/5'
                              }`}
                              style={{ 
                                backgroundColor: isCurrentlyActive ? langColor : undefined,
                                borderColor: isCurrentlyActive ? langColor : undefined,
                                color: isCurrentlyActive ? '#11100d' : undefined
                              }}
                            >
                              {lang}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* High contrast visual corner markers */}
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-transparent group-hover:border-primary/30 transition-colors duration-300" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-transparent group-hover:border-primary/30 transition-colors duration-300" />
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
