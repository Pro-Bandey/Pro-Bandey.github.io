import React, { useEffect } from 'react';
import { X, ExternalLink, Monitor, RefreshCw, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PreviewDrawerProps {
  repoName: string | null;
  previewUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PreviewDrawer({ repoName, previewUrl, isOpen, onClose }: PreviewDrawerProps) {
  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && previewUrl && repoName && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-6xl mx-auto space-y-6"
        >
          {/* Header / Simulator Address Bar */}
          <div className="bg-slate-900/60 border border-white/5 rounded-xl px-4 md:px-6 py-3 flex flex-wrap gap-3 items-center justify-between select-none">
            <div className="flex items-center gap-2.5">
              <Monitor className="w-5 h-5 text-primary" />
              <span className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
                {repoName.toLowerCase()}_live_sandbox_
              </span>
            </div>

            {/* Simulated Address Bar */}
            <div className="hidden md:flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 w-[45%] max-w-lg font-mono text-[10px] text-slate-400">
              <Compass className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate select-all">{previewUrl}</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300 hover:text-primary transition-colors bg-slate-900/60 border border-white/5 hover:border-primary/30 px-3 py-1.5 rounded cursor-pointer"
              >
                <span>NEW TAB</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={onClose}
                className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors bg-slate-950 border border-slate-800 hover:border-slate-700 px-3.5 py-1.5 rounded cursor-pointer"
              >
                <span>[←] CATALOG</span>
              </button>
            </div>
          </div>

          {/* Simulated Monitor Frame */}
          <div className="relative bg-slate-950 border border-white/10 rounded-2xl w-full h-[70vh] flex flex-col overflow-hidden shadow-2xl backdrop-blur-md">
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
