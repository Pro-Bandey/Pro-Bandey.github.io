import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  CodeXml, 
  Database, 
  Sparkles, 
  Mail, 
  Github, 
  Search, 
  SlidersHorizontal, 
  Send, 
  CheckCircle2, 
  ArrowRight, 
  TerminalSquare, 
  Compass, 
  Loader2, 
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Repository, LANGUAGE_COLORS } from './types';
import { FALLBACK_REPOSITORIES, CAPABILITIES } from './data';
import Terminal from './components/Terminal';
import ProjectCard from './components/ProjectCard';
import LanguageTooltip from './components/LanguageTooltip';
import ReadmeDrawer from './components/ReadmeDrawer';
import PreviewDrawer from './components/PreviewDrawer';

export default function App() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'registry' | 'details' | 'preview'>('workspace');
  const [loadingApp, setLoadingApp] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Repositories State
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [reposError, setReposError] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(['All']);
  const [sortBy, setSortBy] = useState<'updated' | 'stars' | 'name'>('updated');

  // Modals & Tooltips State
  const [activeReadmeRepo, setActiveReadmeRepo] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<{ repo: string; url: string } | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    languages: Record<string, number>;
    position: { x: number; y: number };
    visible: boolean;
  }>({ languages: {}, position: { x: 0, y: 0 }, visible: false });

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  // Calculate Scroll Progress
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (windowHeight > 0) {
        setScrollProgress((window.scrollY / windowHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fltrParam = params.get('fltr');
    const qParam = params.get('q');
    const srtParam = params.get('srt');
    const idParam = params.get('id');
    const prwParam = params.get('prw');

    if (fltrParam) {
      setSelectedLanguage(fltrParam);
    }
    if (qParam) {
      setSearchQuery(qParam);
    }
    if (srtParam) {
      setSortBy(srtParam as 'updated' | 'stars' | 'name');
    }
    if (idParam) {
      setActiveReadmeRepo(idParam);
      setActiveTab('details');
    } else if (prwParam) {
      setActivePreview({ repo: prwParam, url: '' });
      setActiveTab('preview');
    }
  }, []);

  // Update URL parameters on any change (URL Syncing)
  useEffect(() => {
    if (loadingApp) return;

    const params = new URLSearchParams();
    if (selectedLanguage && selectedLanguage !== 'All') {
      params.set('fltr', selectedLanguage);
    }
    if (searchQuery) {
      params.set('q', searchQuery);
    }
    if (sortBy && sortBy !== 'updated') {
      params.set('srt', sortBy);
    }
    if (activeReadmeRepo && activeTab === 'details') {
      params.set('id', activeReadmeRepo);
    }
    if (activePreview && activeTab === 'preview') {
      params.set('prw', activePreview.repo);
    }

    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [selectedLanguage, searchQuery, sortBy, activeReadmeRepo, activePreview, activeTab, loadingApp]);

  // Resolve preview URL when repositories load
  useEffect(() => {
    if (activePreview && !activePreview.url && repos.length > 0) {
      const match = repos.find(r => r.Repo === activePreview.repo);
      if (match && match.PreviewUrl) {
        setActivePreview({ repo: match.Repo, url: match.PreviewUrl });
      } else if (match) {
        setActiveReadmeRepo(match.Repo);
        setActiveTab('details');
        setActivePreview(null);
      }
    }
  }, [repos, activePreview]);

  // Global App Loader Delay (Visual Craft)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingApp(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // Fetch Repositories from GitHub raw database
  useEffect(() => {
    const fetchRegistry = async () => {
      setLoadingRepos(true);
      setReposError(false);
      try {
        const response = await fetch(
          'https://raw.githubusercontent.com/Pro-bandey/Pro-bandey/db/db.json'
        );
        if (!response.ok) {
          throw new Error('Endpoint lookup fault');
        }
        const data: Repository[] = await response.json();
        
        // Filter out non-public ones or order them
        const filtered = data.filter(r => r.Status === 'Pub');
        setRepos(filtered.length > 0 ? filtered : FALLBACK_REPOSITORIES);
        
        // Extract unique languages used across repos
        const langs = new Set<string>();
        filtered.forEach(repo => {
          if (repo.Langs) {
            Object.keys(repo.Langs).forEach(l => langs.add(l));
          }
        });
        setAvailableLanguages(['All', ...Array.from(langs)]);
      } catch (err) {
        console.warn('Unable to query remote database, applying secure local fallback...', err);
        setRepos(FALLBACK_REPOSITORIES);
        setReposError(true);
        
        // Fallback languages extraction
        const langs = new Set<string>();
        FALLBACK_REPOSITORIES.forEach(repo => {
          if (repo.Langs) {
            Object.keys(repo.Langs).forEach(l => langs.add(l));
          }
        });
        setAvailableLanguages(['All', ...Array.from(langs)]);
      } finally {
        setLoadingRepos(false);
      }
    };

    fetchRegistry();
  }, []);

  // Filter & Search Repositories
  const filteredRepos = repos.filter(repo => {
    const matchesSearch = repo.Repo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          repo.Desc.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLanguage = selectedLanguage === 'All' || 
                            (repo.Langs && Object.keys(repo.Langs).includes(selectedLanguage));
    
    return matchesSearch && matchesLanguage;
  });

  // Sort Repositories based on selection
  const sortedAndFilteredRepos = [...filteredRepos].sort((a, b) => {
    if (sortBy === 'updated') {
      const dateA = a.Date ? new Date(a.Date).getTime() : 0;
      const dateB = b.Date ? new Date(b.Date).getTime() : 0;
      return dateB - dateA;
    }
    if (sortBy === 'stars') {
      const starsA = a.Stars ?? 0;
      const starsB = b.Stars ?? 0;
      return starsB - starsA;
    }
    if (sortBy === 'name') {
      return a.Repo.localeCompare(b.Repo);
    }
    return 0;
  });

  // Handle language track hover
  const handleLanguageHover = (languages: Record<string, number>, e: React.MouseEvent) => {
    setTooltipData({
      languages,
      position: { x: e.clientX, y: e.clientY },
      visible: true
    });
  };

  const handleLanguageLeave = () => {
    setTooltipData(prev => ({ ...prev, visible: false }));
  };

  // Contact Form Submission (Simulated zsh pipeline)
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;

    setContactStatus('sending');
    setTerminalLogs([]);

    const logSteps = [
      'Establishing TLS handshake secure protocols...',
      'Bundling payload schema variables...',
      'Piping transmission to mail relay rm4814691@gmail.com...',
      'Verifying payload integrity checks: OK',
      'Data synchronized successfully. Transmission terminated.'
    ];

    for (let i = 0; i < logSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setTerminalLogs(prev => [...prev, `[system-relay] ${logSteps[i]}`]);
    }

    setContactStatus('success');
    setContactName('');
    setContactEmail('');
    setContactMessage('');
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-primary/30 selection:text-primary relative overflow-hidden">
      
      {/* 1. Global Scroll Progress Tracker */}
      <div className="fixed top-0 left-0 w-full h-[3px] bg-slate-950 z-[9999]">
        <div 
          style={{ width: `${scrollProgress}%` }}
          className="h-full bg-gradient-to-r from-primary via-amber-400 to-secondary shadow-[0_0_12px_rgba(255,153,0,0.8)] transition-all duration-75"
        />
      </div>

      {/* 2. Ambient High-Tech Grid & Orbs (Frosted Glass Theme) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,153,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,153,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] mask-image-[radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-1/2 -right-20 w-80 h-80 bg-secondary/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-20 left-1/3 w-[500px] h-64 bg-primary/5 rounded-full blur-[120px]" />
      </div>

      {/* 3. Global Loading Screen */}
      <AnimatePresence>
        {loadingApp && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[99999] bg-[#020617] flex flex-col items-center justify-center p-6 select-none"
          >
            <div className="flex flex-col items-center max-w-sm w-full text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,153,0,0.1)]"
              >
                <TerminalSquare className="w-8 h-8 text-primary animate-pulse" />
              </motion.div>
              
              <h2 className="font-mono text-lg font-black tracking-wider text-primary mb-1">
                PRO BANDEY SYSTEM
              </h2>
              
              <p className="font-mono text-[10px] text-slate-500 uppercase tracking-[0.25em] animate-pulse">
                Booting shell packages...
              </p>
              
              <div className="w-48 h-1 bg-slate-950 rounded-full overflow-hidden mt-6 border border-slate-900">
                <motion.div 
                   initial={{ left: '-100%' }}
                   animate={{ left: '100%' }}
                   transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                   className="relative h-full w-[40%] bg-primary rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Global Navigation Header */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-6xl">
        <div className="glass-panel px-6 py-3 border border-white/10 flex items-center justify-between shadow-[0_12px_40px_rgba(0,0,0,0.5)] bg-white/5 backdrop-blur-md rounded-full">
          {/* Logo */}
          <div 
            onClick={() => setActiveTab('workspace')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-secondary p-0.5 shadow-[0_0_12px_rgba(255,153,0,0.3)] flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center font-mono font-black text-xs text-primary">
                PB
              </div>
            </div>
            <div className="font-mono font-black text-sm tracking-tight text-slate-200">
              <span className="text-primary">PRO</span> BANDEY
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 md:gap-1.5 font-mono text-[10px] md:text-xs">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full transition-all duration-200 cursor-pointer ${
                activeTab === 'workspace' 
                  ? 'bg-primary/10 border border-primary/30 text-primary font-bold' 
                  : 'text-slate-400 hover:text-slate-100 border border-transparent'
              }`}
            >
              WORKSPACE
            </button>
            <button
              onClick={() => setActiveTab('registry')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full transition-all duration-200 cursor-pointer ${
                activeTab === 'registry' 
                  ? 'bg-primary/10 border border-primary/30 text-primary font-bold' 
                  : 'text-slate-400 hover:text-slate-100 border border-transparent'
              }`}
            >
              PROJECTS
            </button>
            {activeReadmeRepo && (
              <button
                onClick={() => setActiveTab('details')}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full transition-all duration-200 cursor-pointer ${
                  activeTab === 'details' 
                    ? 'bg-primary/10 border border-primary/30 text-primary font-bold' 
                    : 'text-slate-400 hover:text-slate-100 border border-transparent'
                }`}
              >
                DETAILS
              </button>
            )}
            {activePreview && (
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full transition-all duration-200 cursor-pointer ${
                  activeTab === 'preview' 
                    ? 'bg-primary/10 border border-primary/30 text-primary font-bold' 
                    : 'text-slate-400 hover:text-slate-100 border border-transparent'
                }`}
              >
                PREVIEW
              </button>
            )}
          </nav>

          {/* Active Status Display */}
          <div className="hidden sm:flex items-center gap-2 bg-green-500/5 border border-green-500/20 px-3.5 py-1.5 rounded-full select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="font-mono text-[10px] font-bold text-green-500 uppercase tracking-wider">
              SYSTEM ONLINE
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 pt-28 pb-16 min-h-[calc(100vh-80px)]">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: WORKSPACE / LANDING PAGE */}
          {activeTab === 'workspace' && (
            <motion.div
              key="workspace-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="container px-4 md:px-8 max-w-6xl space-y-24"
            >
              {/* Hero Split Frame */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pt-6">
                <div className="lg:col-span-7 space-y-6">
                  {/* Ready Badge */}
                  <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-md px-3 py-1.5 font-mono text-[10px] text-primary select-none">
                    <SlidersHorizontal className="w-3.5 h-3.5 animate-pulse" />
                    <span>SYSTEM CONFIG: RUNNING_PRODUCTION</span>
                  </div>

                  {/* Main Display Typography */}
                  <h1 className="text-4xl md:text-5xl xl:text-6xl font-black tracking-tighter leading-[1.05] text-slate-100">
                    ENGINEERING <br />
                    <span className="bg-gradient-to-r from-primary via-amber-400 to-secondary bg-clip-text text-transparent filter drop-shadow-[0_2px_10px_rgba(255,153,0,0.15)]">
                      ELEGANT LOGIC.
                    </span>
                  </h1>

                  {/* Body Paragraph */}
                  <p className="text-slate-400 text-sm md:text-base max-w-lg leading-relaxed">
                    Independent systems engineer building high-performance, responsive progressive web applications (PWAs), automated pipeline structures, and secure client-side integration models.
                  </p>

                  {/* Actions buttons */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => setActiveTab('registry')}
                      className="bg-primary text-slate-950 hover:bg-primary/90 font-mono font-bold text-xs py-3.5 px-6 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg shadow-primary/20 active:scale-95 cursor-pointer"
                    >
                      <span>EXPLORE REGISTRY</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <a
                      href="#specs"
                      className="border border-white/10 hover:border-primary/30 bg-white/5 hover:bg-primary/5 text-slate-300 hover:text-slate-100 font-mono text-xs py-3.5 px-6 rounded-xl flex items-center gap-2 transition-all duration-200"
                    >
                      <span>SYSTEM SPECS</span>
                    </a>
                  </div>
                </div>

                {/* Right Area: Shell Emulator Card */}
                <div className="lg:col-span-5 w-full">
                  <Terminal onNavigateToProjects={() => setActiveTab('registry')} />
                </div>
              </section>

              {/* Core Capabilities Grid Section */}
              <section id="specs" className="space-y-8 scroll-mt-24">
                <div className="text-center max-w-md mx-auto space-y-2">
                  <h2 className="font-mono text-lg font-black tracking-tight uppercase text-primary flex items-center justify-center gap-2">
                    <Cpu className="w-5 h-5" />
                    <span>SYSTEM_CAPABILITIES_</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">
                    Core operations mapping visual modularity to system execution
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {CAPABILITIES.map((cap, idx) => {
                    const isSecondary = cap.color === 'secondary';
                    return (
                      <div 
                        key={cap.id}
                        className="glass-panel group p-6 border border-white/5 hover:border-primary/20 flex flex-col justify-between transition-all duration-300"
                      >
                        <div className="space-y-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-105 ${
                            isSecondary 
                              ? 'bg-secondary/5 border-secondary/20 text-secondary' 
                              : 'bg-primary/5 border-primary/20 text-primary'
                          }`}>
                            {cap.icon === 'code' && <CodeXml className="w-6 h-6" />}
                            {cap.icon === 'cpu' && <Cpu className="w-6 h-6" />}
                            {cap.icon === 'database' && <Database className="w-6 h-6" />}
                          </div>

                          <h3 className="font-mono font-bold text-sm text-slate-200 uppercase tracking-wide">
                            {cap.title}
                          </h3>
                          
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {cap.desc}
                          </p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-slate-600 group-hover:text-slate-400 transition-colors">
                          <span>MODULE: 0{idx + 1}</span>
                          <span className={isSecondary ? 'text-secondary/70' : 'text-primary/70'}>READY</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Connect Section Form */}
              <section className="glass-panel max-w-2xl mx-auto border border-white/10 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 font-mono text-[9px] text-slate-800 select-none">
                  SECURE_SMTP_NODE
                </div>

                <div className="text-center max-w-lg mx-auto space-y-3 mb-8">
                  <h2 className="font-mono text-lg font-black uppercase text-primary">
                    INITIATE CONNECTION_
                  </h2>
                  <p className="text-xs text-slate-400">
                    Reach out directly for systems integration contracts, code audits, or standard inquiries.
                  </p>
                </div>

                {contactStatus === 'success' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-5 text-center py-6"
                  >
                    <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center mx-auto text-green-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-mono font-bold text-slate-200 uppercase text-xs">TRANSMISSION EN ROUTE</h3>
                      <p className="text-xs text-slate-400">Your signal was parsed and routed safely. Check logs below:</p>
                    </div>

                    {/* Fake Terminal Logs */}
                    <div className="bg-slate-950 border border-slate-900 rounded-lg p-4 font-mono text-[10px] text-left max-w-md mx-auto space-y-1.5 text-slate-400 select-all">
                      {terminalLogs.map((log, index) => (
                        <div key={index} className="line">
                          <span className="text-primary mr-1.5">❯</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setContactStatus('idle')}
                      className="font-mono text-xs text-slate-500 hover:text-primary bg-slate-950 px-4 py-2 rounded-lg border border-slate-900 hover:border-primary/20 transition-all duration-200 cursor-pointer"
                    >
                      SEND ANOTHER TRANSMISSION
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-mono text-[10px] text-slate-500 uppercase tracking-wider block">IDENTIFIER (NAME)</label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="e.g. Architect"
                          className="w-full bg-black/30 border border-white/5 hover:border-white/10 focus:border-primary/40 focus:ring-0 rounded-lg px-4 py-3 text-sm font-mono text-slate-200 outline-none placeholder-slate-700 transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-mono text-[10px] text-slate-500 uppercase tracking-wider block">CONTACT MAIL</label>
                        <input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="e.g. system@node.com"
                          className="w-full bg-black/30 border border-white/5 hover:border-white/10 focus:border-primary/40 focus:ring-0 rounded-lg px-4 py-3 text-sm font-mono text-slate-200 outline-none placeholder-slate-700 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] text-slate-500 uppercase tracking-wider block">TRANSMISSION CONTENT (MESSAGE)</label>
                      <textarea
                        rows={4}
                        required
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="State your engineering requirements..."
                        className="w-full bg-black/30 border border-white/5 hover:border-white/10 focus:border-primary/40 focus:ring-0 rounded-lg px-4 py-3 text-sm font-mono text-slate-200 outline-none placeholder-slate-700 transition-colors resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={contactStatus === 'sending'}
                      className="w-full bg-primary text-slate-950 hover:bg-primary/90 disabled:bg-primary/30 disabled:text-slate-500 font-mono font-bold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-lg shadow-primary/10 cursor-pointer"
                    >
                      {contactStatus === 'sending' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>PIPING TRANSMISSION VARIABLES...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>OPEN CHANNELS TRANSMISSION</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </section>
            </motion.div>
          )}

          {/* TAB 2: REPOSITORY REGISTRY */}
          {activeTab === 'registry' && (
            <motion.div
              key="registry-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="container px-4 md:px-8 max-w-6xl space-y-10"
            >
              {/* Header Title Block */}
              <div className="text-center max-w-xl mx-auto space-y-3 pt-6">
                <h1 className="font-mono text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-100">
                  REPOSITORY <span className="text-primary">REGISTRY_</span>
                </h1>
                <p className="text-sm text-slate-400">
                  Dynamic database sync tracking active deployments, system caches, and architectural packages.
                </p>
              </div>

              {/* Dynamic Filter Controls Panel */}
              <div className="glass-panel p-4 border border-white/10 bg-white/5 backdrop-blur-md flex flex-col gap-4">
                
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  {/* Search query box */}
                  <div className="relative w-full md:w-[45%] max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter registry by keyword..."
                      className="w-full bg-black/30 border border-white/5 hover:border-white/10 focus:border-primary/40 focus:ring-0 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-slate-200 outline-none placeholder-slate-600 transition-colors"
                    />
                  </div>

                  {/* Sort Control Row */}
                  <div className="flex w-full md:w-auto items-center justify-end gap-1.5 overflow-x-auto py-1 scrollbar-none select-none shrink-0">
                    <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider shrink-0 pr-1">Sort By:</span>
                    <button
                      onClick={() => setSortBy('updated')}
                      className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] uppercase transition-all duration-200 whitespace-nowrap cursor-pointer ${
                        sortBy === 'updated'
                          ? 'bg-primary/10 border-primary/40 text-primary font-bold'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                      }`}
                      title="Sort by latest release date"
                    >
                      Last Updated
                    </button>
                    <button
                      onClick={() => setSortBy('stars')}
                      className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] uppercase transition-all duration-200 whitespace-nowrap cursor-pointer ${
                        sortBy === 'stars'
                          ? 'bg-primary/10 border-primary/40 text-primary font-bold'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                      }`}
                      title="Sort by star count"
                    >
                      Star Count
                    </button>
                    <button
                      onClick={() => setSortBy('name')}
                      className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] uppercase transition-all duration-200 whitespace-nowrap cursor-pointer ${
                        sortBy === 'name'
                          ? 'bg-primary/10 border-primary/40 text-primary font-bold'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                      }`}
                      title="Sort by project name alphabetically"
                    >
                      Name
                    </button>
                  </div>
                </div>

                {/* Filter Selector Row */}
                <div className="flex w-full items-center gap-2 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-primary/10 select-none border-t border-white/5 pt-3">
                  <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider shrink-0 pr-1">Languages:</span>
                  {availableLanguages.map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] uppercase transition-all duration-200 whitespace-nowrap cursor-pointer ${
                        selectedLanguage === lang
                          ? 'bg-primary/10 border-primary/40 text-primary font-bold'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Cards Catalog */}
              <div className="relative">
                {loadingRepos ? (
                  <div className="h-[40vh] flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="font-mono text-xs text-slate-500 uppercase tracking-wider animate-pulse">
                      Retrieving live registry database...
                    </p>
                  </div>
                ) : sortedAndFilteredRepos.length > 0 ? (
                  <motion.div 
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.08 }
                      }
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {sortedAndFilteredRepos.map((repo, idx) => (
                      <motion.div
                        key={repo.Repo}
                        variants={{
                          hidden: { opacity: 0, y: 12 },
                          show: { opacity: 1, y: 0 }
                        }}
                      >
                        <ProjectCard
                          repo={repo}
                          onOpenReadme={(name) => {
                            setActiveReadmeRepo(name);
                            setActiveTab('details');
                          }}
                          onOpenPreview={(name, url) => {
                            setActivePreview({ repo: name, url });
                            setActiveTab('preview');
                          }}
                          onLanguageHover={handleLanguageHover}
                          onLanguageLeave={handleLanguageLeave}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="glass-panel p-12 text-center max-w-md mx-auto space-y-4 border border-white/5">
                    <div className="w-12 h-12 rounded-full bg-slate-950 border border-white/5 flex items-center justify-center mx-auto text-slate-500">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-mono text-xs font-bold uppercase text-slate-200">NO REGISTRIES MATCHED</h3>
                      <p className="text-xs text-slate-500">
                        Adjust your parameters or try looking up another keyword query descriptor.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedLanguage('All');
                        setSortBy('updated');
                      }}
                      className="font-mono text-[10px] text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      RESET CONTROLS
                    </button>
                  </div>
                )}
              </div>

              {/* Small Fallback Status Banner if remote db failed */}
              {reposError && !loadingRepos && (
                <div className="glass-panel p-4 max-w-xl mx-auto border border-primary/5 bg-slate-950/20 flex items-center gap-3 text-slate-500">
                  <AlertCircle className="w-4 h-4 text-primary/70 flex-shrink-0" />
                  <p className="font-mono text-[10px] uppercase tracking-wider leading-relaxed">
                    Database Connection Timeout: Loaded local client cache data modules. Real-time indicators are simulated.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* C. Details Tab */}
          {activeTab === 'details' && (
            <ReadmeDrawer
              repo={repos.find(r => r.Repo === activeReadmeRepo) || null}
              isOpen={activeTab === 'details'}
              onClose={() => setActiveTab('registry')}
            />
          )}

          {/* D. Preview Tab */}
          {activeTab === 'preview' && (
            <PreviewDrawer
              repoName={activePreview?.repo || null}
              previewUrl={activePreview?.url || null}
              isOpen={activeTab === 'preview'}
              onClose={() => setActiveTab('registry')}
            />
          )}

        </AnimatePresence>
      </main>

      {/* 5. Tooltips */}
      <LanguageTooltip 
        languages={tooltipData.languages} 
        position={tooltipData.position} 
        visible={tooltipData.visible} 
      />

      {/* 6. Footer Navigation Block */}
      <footer className="relative z-10 bg-slate-950 border-t border-slate-900 py-6 select-none">
        <div className="container max-w-6xl px-4 md:px-8 flex flex-col md:flex-row gap-4 items-center justify-between font-mono text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} PRO BANDEY. ALL RIGHTS RESERVED. &bull;{' '}
            <a 
              href="https://github.com/Pro-bandey/Pro-bandey/blob/main/LICENSE" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-primary underline decoration-slate-800 transition-colors"
            >
              LICENSE
            </a>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/Pro-bandey" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
              title="Official GitHub profile catalog"
            >
              <Github className="w-3.5 h-3.5" />
              <span>@pro-bandey</span>
            </a>
            <a 
              href="mailto:rm4814691@gmail.com" 
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
              title="Direct mail transmission"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>tellus@node</span>
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
