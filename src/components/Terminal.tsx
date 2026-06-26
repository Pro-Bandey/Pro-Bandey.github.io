import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Send, CornerDownLeft, Sparkles } from 'lucide-react';
import { TerminalLine } from '../types';

interface TerminalProps {
  onNavigateToProjects: () => void;
}

export default function Terminal({ onNavigateToProjects }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTypingInitial, setIsTypingInitial] = useState(true);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const initialCommands = [
    {
      cmd: 'fetch profile_stats',
      outputs: [
        'Searching internal system directories...',
        '🔒 Decrypting workspace signatures...',
        '👤 Profile identified: Pro Bandey [Systems Architect]',
        '🚀 Status: ACTIVE_&_READY_TO_DEPLOY'
      ]
    },
    {
      cmd: 'get_specialties',
      outputs: [
        '👉 High-Speed Progressive Web Applications (PWA)',
        '👉 Secure OAuth & Third-Party APIs Integration',
        '👉 Automated CI/CD Pipelines & Background Workers'
      ]
    }
  ];

  // Auto scroll to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  // Initial typing effect on mount
  useEffect(() => {
    let active = true;
    const runInitialSequence = async () => {
      setLines([{ text: 'system_initialize --verbose', type: 'input' }]);
      await delay(600);
      if (!active) return;
      setLines(prev => [
        ...prev,
        { text: 'Bootloader: v4.2.14-LTS loaded', type: 'output' },
        { text: 'Grid subsystem: ONLINE', type: 'success' }
      ]);
      await delay(800);

      for (const step of initialCommands) {
        if (!active) return;
        // Simulate typing command
        let currentTyped = '';
        const cmdText = step.cmd;
        setLines(prev => [...prev, { text: '', type: 'input' }]);

        for (let i = 0; i < cmdText.length; i++) {
          await delay(45);
          if (!active) return;
          currentTyped += cmdText[i];
          setLines(prev => {
            const next = [...prev];
            next[next.length - 1] = { text: currentTyped, type: 'input' };
            return next;
          });
        }

        await delay(300);
        if (!active) return;

        // Print outputs
        setLines(prev => [
          ...prev,
          ...step.outputs.map(out => ({
            text: out,
            type: out.includes('👤') || out.includes('👉') ? ('success' as const) : ('output' as const)
          }))
        ]);
        await delay(500);
      }

      if (!active) return;
      setLines(prev => [
        ...prev,
        { text: 'Interactive Terminal online. Type "help" for controls.', type: 'success' }
      ]);
      setIsTypingInitial(false);
    };

    runInitialSequence();
    return () => {
      active = false;
    };
  }, []);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleCommandSubmit = (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed) return;

    const newLines = [...lines, { text: trimmed, type: 'input' as const }];
    const cmd = trimmed.toLowerCase();

    if (cmd === 'clear') {
      setLines([]);
      setInputValue('');
      return;
    }

    let responseLines: TerminalLine[] = [];

    if (cmd === 'help') {
      responseLines = [
        { text: 'Available commands:', type: 'success' },
        { text: '  about      - Display systems engineering biography', type: 'output' },
        { text: '  skills     - Core capabilities & workspace tech stack', type: 'output' },
        { text: '  projects   - Navigate directly to Repository Registry', type: 'output' },
        { text: '  contact    - Retrieve official communication links', type: 'output' },
        { text: '  theme      - Cycle visual glow matrix parameters', type: 'output' },
        { text: '  clear      - Wipe terminal dashboard feed history', type: 'output' }
      ];
    } else if (cmd === 'about') {
      responseLines = [
        { text: '👤 BIO SPECIFICATIONS:', type: 'success' },
        { text: 'Independent systems developer specializing in the creation of performance-tuned, offline-capable progressive web apps, automated script execution flows, and secure API layers.', type: 'output' },
        { text: 'Philosophy: Elegant code is minimal, deterministic, and resilient.', type: 'output' }
      ];
    } else if (cmd === 'skills') {
      responseLines = [
        { text: '⚙️ CORE MATRIX SPECIFICATIONS:', type: 'success' },
        { text: '  • LANGUAGES: TypeScript, JavaScript, Go, HTML5, CSS3, Bash/Zsh', type: 'output' },
        { text: '  • FRONTEND: React, Vite, Tailwind CSS, Motion Animations', type: 'output' },
        { text: '  • BACKEND: Node.js, Express, Microservices, RESTful Endpoints', type: 'output' },
        { text: '  • AUTOMATION: GitHub Actions, Linux Scripts, Service Workers', type: 'output' }
      ];
    } else if (cmd === 'projects') {
      responseLines = [
        { text: '📁 NAVIGATING TO REGISTRY...', type: 'success' },
        { text: 'Spinning up repository catalog grid interface...', type: 'output' }
      ];
      // Navigate to projects with a tiny delay
      setTimeout(() => {
        onNavigateToProjects();
      }, 1000);
    } else if (cmd === 'contact') {
      responseLines = [
        { text: '📨 SYSTEM COMMUNICATION CHANNELS:', type: 'success' },
        { text: '  • Mail: pb@mrc.com', type: 'output' },
        { text: '  • GitHub: https://github.com/Pro-bandey', type: 'output' },
        { text: 'Feel free to open a transmission for engineering consultations.', type: 'output' }
      ];
    } else if (cmd === 'theme') {
      responseLines = [
        { text: '✨ GLOW PARAMETERS CALIBRATED', type: 'success' },
        { text: 'Recalibrating high-contrast visual grid... Applied standard Frosted Glass Theme successfully.', type: 'output' }
      ];
    } else {
      responseLines = [
        { text: `bash: command not found: ${trimmed}`, type: 'error' },
        { text: 'Type "help" to see valid commands.', type: 'output' }
      ];
    }

    setLines([...newLines, ...responseLines]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommandSubmit(inputValue);
    }
  };

  const handleTerminalClick = () => {
    if (!isTypingInitial) {
      inputRef.current?.focus();
    }
  };

  return (
    <div
      className="glass-panel overflow-hidden border border-white/10 flex flex-col h-[350px] cursor-text bg-white/5 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
      onClick={handleTerminalClick}
    >
      {/* Terminal Header */}
      <div className="bg-black/40 px-4 py-3 border-b border-white/5 flex items-center justify-between select-none">
        <div className="flex gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse"></span>
          <span className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></span>
          <span className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <TerminalIcon className="w-3.5 h-3.5 text-primary" />
          <span>zsh — pro_bandey@workspace</span>
        </div>
        <div className="w-16"></div>
      </div>

      {/* Terminal Lines */}
      <div className="flex-1 p-4 font-mono text-sm overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-primary/20">
        {lines.map((line, idx) => {
          if (line.type === 'input') {
            return (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-primary select-none font-bold">$</span>
                <span className="text-slate-100 break-all">{line.text}</span>
              </div>
            );
          }
          let colorClass = 'text-slate-300';
          if (line.type === 'success') colorClass = 'text-green-400 font-medium';
          if (line.type === 'error') colorClass = 'text-red-400 font-medium';

          return (
            <div key={idx} className={`${colorClass} break-all whitespace-pre-wrap pl-4 border-l-2 border-primary/5`}>
              {line.text}
            </div>
          );
        })}
        {isTypingInitial && (
          <div className="flex items-center gap-1.5 pl-4 text-xs text-primary/80 select-none">
            <Sparkles className="w-3 h-3 animate-spin" />
            <span>Simulating profile load...</span>
          </div>
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Suggested Commands Quick Deck */}
      {!isTypingInitial && (
        <div className="px-4 py-2 bg-black/20 border-t border-white/5 flex flex-wrap gap-2 select-none">
          <span className="text-[10px] text-slate-500 font-mono flex items-center">SUGGESTIONS:</span>
          {['help', 'about', 'skills', 'projects', 'contact'].map(cmd => (
            <button
              key={cmd}
              onClick={(e) => {
                e.stopPropagation();
                handleCommandSubmit(cmd);
              }}
              className="text-[11px] font-mono text-slate-400 bg-slate-900/60 hover:text-primary hover:bg-primary/10 border border-white/5 hover:border-primary/30 px-2 py-0.5 rounded transition-all duration-200 cursor-pointer"
            >
              {cmd}
            </button>
          ))}
        </div>
      )}

      {/* Terminal Input Line */}
      <div className="p-3 bg-black/30 border-t border-white/10 flex items-center gap-3">
        <span className="text-primary font-mono font-bold select-none">$</span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isTypingInitial}
          placeholder={isTypingInitial ? 'Booting shell...' : 'Type a system command (e.g. "help")...'}
          className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-slate-100 placeholder-slate-600 focus:ring-0 p-0"
        />
        <button
          onClick={() => handleCommandSubmit(inputValue)}
          disabled={isTypingInitial || !inputValue.trim()}
          className="text-slate-500 hover:text-primary disabled:text-slate-700 disabled:hover:text-slate-700 transition-colors cursor-pointer"
          title="Send command"
        >
          <CornerDownLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
