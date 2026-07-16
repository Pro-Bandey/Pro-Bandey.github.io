import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Monitor, RefreshCw, Compass, Smartphone, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PreviewDrawerProps {
  repoName: string | null;
  previewUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PreviewDrawer({ repoName, previewUrl, isOpen, onClose }: PreviewDrawerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isFullscreen]);

  return (
    <AnimatePresence>
      {isOpen && previewUrl && repoName && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className={
            isFullscreen
              ? "fixed top-20 md:top-24 inset-x-0 bottom-0 md:inset-x-4 md:bottom-4 z-[2100] bg-bg-main overflow-hidden flex flex-col space-y-6 p-4 md:p-6 rounded-t-2xl md:rounded-2xl border border-border shadow-2xl"
              : "fixed inset-x-0 bottom-0 top-20 md:top-24 md:inset-x-8 lg:inset-x-24 z-[2100] bg-bg-main overflow-hidden flex flex-col space-y-6 p-4 md:p-8 rounded-t-2xl md:rounded-2xl border border-border shadow-[0_-20px_60px_rgba(0,0,0,0.5)]"
          }
        >
          {/* Header / Simulator Address Bar */}
          <div className="bg-slate-900/60 border border-white/5 rounded-xl px-4 md:px-6 py-3 flex flex-wrap gap-3 items-center justify-between select-none shrink-0">
            <div className="flex items-center gap-2.5">
              <Monitor className="w-5 h-5 text-primary hidden sm:block" />
              <Smartphone className="w-5 h-5 text-primary sm:hidden" />
              <span className="font-mono text-xs font-bold text-primary uppercase tracking-wider hidden sm:inline">
                {repoName.toLowerCase()}_live_sandbox_
              </span>
              <span className="font-mono text-xs font-bold text-primary uppercase tracking-wider sm:hidden">
                sandbox_
              </span>
            </div>

            {/* Simulated Address Bar */}
            <div className="hidden md:flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 w-[35%] max-w-lg font-mono text-[10px] text-slate-400">
              <Compass className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate select-all">{previewUrl}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center bg-slate-950 border border-slate-800 rounded p-0.5 mr-2">
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'desktop' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                  title="Desktop View"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'mobile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                  title="Mobile View"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>

              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300 hover:text-primary transition-colors bg-slate-900/60 border border-white/5 hover:border-primary/30 px-3 py-1.5 rounded cursor-pointer"
                title="Open in new tab"
              >
                <span>NEW TAB</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors bg-slate-950 border border-slate-800 hover:border-slate-700 px-3.5 py-1.5 rounded cursor-pointer"
                title={isFullscreen ? "Restore size" : "Expand to full screen"}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isFullscreen ? 'RESTORE' : 'EXPAND'}</span>
              </button>

              <button
                onClick={onClose}
                className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors bg-slate-950 border border-slate-800 hover:border-slate-700 px-3.5 py-1.5 rounded cursor-pointer"
              >
                <span>[←] CATALOG</span>
              </button>
            </div>
          </div>

          {/* Simulated Monitor Frame */}
          <div className={`relative bg-slate-950 border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl backdrop-blur-md mx-auto transition-all duration-300 ${
            viewMode === 'mobile' ? 'w-[375px] max-w-full h-[812px] max-h-full shrink-0' : 'w-full flex-1'
          } ${isFullscreen && viewMode === 'desktop' ? 'h-full flex-1' : (viewMode === 'desktop' ? 'h-[70vh]' : '')}`}>
            {/* Sandbox IFrame */}
            <div className="flex-1 bg-white relative">
              <iframe
                src={previewUrl}
                title={`Interactive Sandbox: ${repoName}`}
                sandbox="allow-scripts allow-same-origin allow-forms"
                className="w-full h-full border-none bg-white select-none"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
