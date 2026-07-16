import React, { useState, useEffect, useMemo } from 'react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { 
  X, 
  Loader2, 
  Sparkles, 
  BookOpen, 
  Star, 
  Calendar, 
  Share2, 
  Check, 
  CodeXml, 
  Copy, 
  Maximize2, 
  Minimize2,
  Clock,
  User,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Repository, LANGUAGE_COLORS } from '../types';
import { getRepositoryTags } from '../utils';

interface ReadmeDrawerProps {
  repo: Repository | null;
  isOpen: boolean;
  onClose: () => void;
  allRepos?: Repository[];
  onOpenRepo?: (repoName: string) => void;
}

const copyToClipboard = async (text: string) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Navigator clipboard failed, falling back to document.execCommand', err);
  }

  // Fallback for iframe restrictions
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed', err);
    document.body.removeChild(textArea);
    return false;
  }
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700 cursor-pointer"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-[#00dd00]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

const rewriteMarkdownUrls = (text: string, repoName: string, owner: string, branch: string) => {
  const baseRawUrl = `https://raw.githubusercontent.com/${owner}/${repoName}/refs/heads/${branch}/`;
  
  // 1. Rewrite Markdown images: ![alt](relative_url)
  let transformed = text.replace(/(!\[.*?\]\()(.+?)(\))/g, (match, prefix, url, suffix) => {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return match;
    }
    const cleanUrl = url.replace(/^\.\//, '').replace(/^\//, '');
    return `${prefix}${baseRawUrl}${cleanUrl}${suffix}`;
  });

  // 2. Rewrite HTML images: <img src="relative_url" ...>
  transformed = transformed.replace(/(<img\s+[^>]*src=["'])([^"']*)(["'])/gi, (match, prefix, url, suffix) => {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return match;
    }
    const cleanUrl = url.replace(/^\.\//, '').replace(/^\//, '');
    return `${prefix}${baseRawUrl}${cleanUrl}${suffix}`;
  });

  // 3. Rewrite relative Links (excluding anchors # and absolute links)
  transformed = transformed.replace(/(\[.*?\]\()(.+?)(\))/g, (match, prefix, url, suffix) => {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('#')) {
      return match;
    }
    const cleanUrl = url.replace(/^\.\//, '').replace(/^\//, '');
    const baseGithubUrl = `https://github.com/${owner}/${repoName}/blob/${branch}/`;
    return `${prefix}${baseGithubUrl}${cleanUrl}${suffix}`;
  });

  return transformed;
};

export default function ReadmeDrawer({ repo, isOpen, onClose, allRepos = [], onOpenRepo }: ReadmeDrawerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<'link' | 'banner' | 'snippet' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);

  const repoName = repo?.Repo || null;
  const owner = repo?.Owner || 'Pro-bandey';

  // Find related repositories that share tags with the current repository
  const currentTags = repo ? getRepositoryTags(repo) : [];
  const relatedRepos = repo && allRepos
    ? allRepos
        .filter(r => r.Repo !== repo.Repo)
        .map(r => {
          const rTags = getRepositoryTags(r);
          const sharedCount = rTags.filter(t => currentTags.includes(t)).length;
          return { repo: r, score: sharedCount, tags: rTags };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.repo)
        .slice(0, 3)
    : [];

  useEffect(() => {
    if (!isOpen || !repoName) return;

    const fetchReadme = async () => {
      setLoading(true);
      setError(false);
      setContent('');

      const mainUrl = `https://raw.githubusercontent.com/${owner}/${repoName}/refs/heads/main/README.md`;
      const masterUrl = `https://raw.githubusercontent.com/${owner}/${repoName}/refs/heads/master/README.md`;

      try {
        let response = await fetch(mainUrl);
        let resolvedBranch = 'main';

        if (!response.ok) {
          // Try fallback to master branch
          response = await fetch(masterUrl);
          resolvedBranch = 'master';
        }

        if (!response.ok) {
          throw new Error('README resolution failure');
        }

        const text = await response.text();
        const transformedText = rewriteMarkdownUrls(text, repoName, owner, resolvedBranch);
        setContent(transformedText);
      } catch (err) {
        console.error('Failed to retrieve markdown', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchReadme();
  }, [repoName, owner, isOpen]);

  // Handle ESC key to close drawer
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

  const handleShareCopy = async (text: string, type: 'link' | 'banner' | 'snippet') => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  // Extract headings for Table Of Contents
  const tocItems = useMemo(() => {
    if (!content) return [];
    const lines = content.split('\n');
    const items: { text: string; id: string; level: number }[] = [];
    
    lines.forEach((line) => {
      const match = line.match(/^(#{2,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length; // 2 for h2, 3 for h3
        const text = match[2]
          .replace(/\[.*?\]\(.*?\)/g, '') // Strip links
          .replace(/<.*?>/g, '') // Strip HTML tags
          .trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        items.push({ text, id, level });
      }
    });
    return items;
  }, [content]);

  // Calculate estimated reading time
  const readingTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
  };

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const PreBlock = ({ children, ...props }: any) => {
    const getCodeString = (children: any): string => {
      let codeString = '';
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          const props = (child as any).props;
          if (props && props.children) {
            if (typeof props.children === 'string') {
               codeString += props.children;
            } else if (Array.isArray(props.children)) {
               codeString += props.children.join('');
            }
          }
        } else if (typeof child === 'string') {
          codeString += child;
        }
      });
      return codeString;
    };
    
    const textContent = getCodeString(children);
  
    return (
      <div className="relative group my-4">
        <div className="absolute right-2 top-2 z-10">
          <CopyButton text={textContent} />
        </div>
        <pre className="!my-0 animate-fade-in" {...props}>
          {children}
        </pre>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && repo && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className={
            isFullscreen
              ? "fixed inset-0 z-[2100] bg-bg-main overflow-y-auto space-y-6 p-4 md:p-8 rounded-none border-none shadow-none"
              : "fixed inset-x-0 bottom-0 top-20 md:top-24 md:inset-x-8 lg:inset-x-24 z-[2100] bg-bg-main overflow-y-auto space-y-6 p-4 md:p-8 rounded-t-2xl md:rounded-2xl border border-border shadow-[0_-20px_60px_rgba(0,0,0,0.5)]"
          }
        >
          {/* Article Navigation Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-xl px-5 py-3 select-none">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
                {repo.Repo.toLowerCase()}_specifications_node_
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors bg-slate-950 border border-slate-800 hover:border-slate-700 px-3.5 py-1.5 rounded cursor-pointer"
                title={isFullscreen ? "Restore size" : "Expand to full screen"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isFullscreen ? 'RESTORE' : 'EXPAND'}</span>
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors bg-slate-950 border border-slate-800 hover:border-slate-700 px-3.5 py-1.5 rounded cursor-pointer"
              >
                <span>[←] RETURN TO REGISTRY</span>
              </button>
            </div>
          </div>

          {/* Main Blogger Frame */}
          <div className="relative bg-slate-950/40 border border-white/5 rounded-2xl w-full flex flex-col overflow-hidden shadow-2xl backdrop-blur-md p-6 md:p-8">
            
            {/* Content Container */}
            <div className="flex-1">
              {loading && (
                <div className="h-full flex flex-col items-center justify-center gap-3 py-24">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="font-mono text-xs text-slate-500 animate-pulse uppercase tracking-wider">
                    Querying GitHub raw nodes...
                  </p>
                </div>
              )}

              {error && (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-16 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                    <X className="w-6 h-6" />
                  </div>
                  <h3 className="font-mono text-md font-bold text-slate-200 uppercase">Document Read Fault</h3>
                  <p className="text-xs text-slate-400">
                    Could not resolve remote README markdown profile from public workspace repositories branches.
                  </p>
                  <button
                    onClick={onClose}
                    className="font-mono text-xs text-primary border border-primary/20 hover:border-primary/50 bg-primary/5 px-4 py-2 rounded mt-2 transition-all duration-200 cursor-pointer"
                  >
                    Go Back
                  </button>
                </div>
              )}

              {!loading && !error && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Side: README Markdown Content */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* Metadata Card (matches blog post style perfectly) */}
                    <div className="glass-panel p-6 border border-white/5 space-y-4 bg-white/[0.01]">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          {repo.Date ? new Date(repo.Date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Classified'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-secondary" />
                          {repo.Owner || 'Pro Bandey'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          {readingTime(content)} min read
                        </span>
                      </div>

                      <h1 className="font-mono text-2xl md:text-3xl font-black text-slate-100 tracking-tight leading-tight uppercase">
                        {repo.Repo}
                      </h1>

                      {repo.Desc && (
                        <p className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-primary/50 pl-4 bg-white/[0.02] py-2 rounded-r-lg">
                          {repo.Desc}
                        </p>
                      )}
                    </div>

                    {/* Table of Contents Dropdown (matches blog post style perfectly) */}
                    {tocItems.length > 0 && (
                      <div className="glass-panel border border-white/5 relative overflow-hidden transition-all duration-300 sticky top-20 md:top-24 z-[100] shadow-xl bg-slate-950/90 backdrop-blur-md">
                        {/* Corner accents */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/50" />
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/50" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/50" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/50" />
                        
                        <button 
                          onClick={() => setIsTocOpen(!isTocOpen)}
                          className="w-full flex items-center justify-between p-4 font-mono text-xs font-bold text-slate-200 uppercase tracking-wider hover:bg-white/[0.02] transition-colors focus:outline-none cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary" />
                            <span>Table of Contents ({tocItems.length} sections)</span>
                          </span>
                          <motion.div
                            animate={{ rotate: isTocOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          </motion.div>
                        </button>

                        <AnimatePresence initial={false}>
                          {isTocOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="p-5 pt-0 border-t border-white/[0.03] bg-slate-950/10 max-h-[45vh] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20">
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 font-mono text-xs text-slate-400 pt-4">
                                  {tocItems.map((item, idx) => (
                                    <li 
                                      key={idx} 
                                      style={{ paddingLeft: `${(item.level - 2) * 12}px` }}
                                      className="flex items-start gap-1.5 py-0.5 group"
                                    >
                                      <span className="text-primary select-none font-bold mt-0.5">›</span>
                                      <button
                                        onClick={() => scrollToHeading(item.id)}
                                        className="text-left hover:text-primary hover:underline transition-colors focus:outline-none cursor-pointer line-clamp-1"
                                      >
                                        {item.text}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Markdown Body container (matches blog post style perfectly) */}
                    <div className="glass-panel p-6 md:p-10 border border-white/5 bg-slate-950/20">
                      {content ? (
                        <div className="markdown-body prose prose-invert max-w-none prose-amber prose-headings:font-mono prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:text-slate-400 prose-p:leading-relaxed prose-a:text-primary prose-code:font-mono prose-code:text-primary/90 prose-pre:bg-slate-900/60 prose-pre:border prose-pre:border-primary/5">
                          <Markdown 
                            rehypePlugins={[rehypeRaw]}
                            components={{
                              pre: PreBlock,
                              h2: ({ node, ...props }) => {
                                const id = String(props.children || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                return <h2 id={id} className="scroll-mt-24" {...props} />;
                              },
                              h3: ({ node, ...props }) => {
                                const id = String(props.children || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                return <h3 id={id} className="scroll-mt-24" {...props} />;
                              }
                            }}
                          >
                            {content}
                          </Markdown>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-16 max-w-md mx-auto">
                          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                            <Sparkles className="w-6 h-6" />
                          </div>
                          <h3 className="font-mono text-md font-bold text-slate-200 uppercase">No Content Configured</h3>
                          <p className="text-xs text-slate-400">
                            This workspace repository does not have a public specification markdown document.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side Sidebar (with matching styling layout from blog post) */}
                  <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
                    
                    {/* 1. Repository Quick Stats Panel */}
                    <div className="glass-panel p-5 border border-white/5 space-y-4">
                      <h3 className="font-mono text-xs font-bold text-text-muted uppercase tracking-wider">
                        PROJECT_OVERVIEW_MAP
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-500 uppercase">Registry ID:</span>
                          <span className="text-slate-300 font-bold">{repo.Repo}</span>
                        </div>
                        {repo.Stars !== undefined && (
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-500 uppercase">Popularity Rank:</span>
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              {repo.Stars} Stars
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-500 uppercase">Release Date:</span>
                          <span className="text-slate-300 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            {repo.Date ? new Date(repo.Date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-500 uppercase">Status Node:</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#00dd00]/10 border border-[#00dd00]/30 text-[#00dd00] font-bold uppercase tracking-wider animate-pulse">
                            ACTIVE ONLINE
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Mini Code Language distribution sparklines */}
                    {repo.Langs && Object.keys(repo.Langs).length > 0 && (
                      <div className="glass-panel p-5 border border-white/5 space-y-4">
                        <h3 className="font-mono text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                          <CodeXml className="w-3.5 h-3.5 text-primary" />
                          <span>LANGUAGE_PROFILE_</span>
                        </h3>
                        
                        <div className="space-y-3">
                          {Object.entries(repo.Langs)
                            .sort((a, b) => b[1] - a[1])
                            .map(([lang, pct]) => {
                              const color = LANGUAGE_COLORS[lang] || '#ff9900';
                              return (
                                <div key={lang} className="space-y-1.5">
                                  <div className="flex justify-between text-xs font-mono">
                                    <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                                      {lang}
                                    </span>
                                    <span className="text-primary font-bold">{pct}%</span>
                                  </div>
                                  {/* Custom High-Fidelity SVG Sparkline Bar Chart */}
                                  <div className="relative">
                                    <svg className="w-full h-2 rounded-full bg-slate-950/60 overflow-hidden" xmlns="http://www.w3.org/2000/svg">
                                      <rect x="0" y="0" width={`${pct}%`} height="100%" fill={color} rx="4" />
                                    </svg>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* 3. Deep-Link Share Options Panel */}
                    <div className="glass-panel p-5 border border-white/5 space-y-4">
                      <h3 className="font-mono text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                        <Share2 className="w-3.5 h-3.5 text-primary" />
                        <span>SHARE_REPOSITORY_</span>
                      </h3>
                      
                      <div className="space-y-3">
                        {/* Option A: Deep-Link URL */}
                        <div className="space-y-1.5">
                          <label className="block font-mono text-[10px] text-slate-500 uppercase tracking-wider">Deep-Link URL</label>
                          <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-lg p-1.5 pl-3">
                            <span className="font-mono text-[10px] text-slate-400 truncate flex-1 select-all">
                              {`${window.location.origin}${window.location.pathname}?id=${repo.Repo}`}
                            </span>
                            <button
                              onClick={() => handleShareCopy(`${window.location.origin}${window.location.pathname}?id=${repo.Repo}`, 'link')}
                              className="flex-shrink-0 p-1.5 bg-primary hover:bg-primary/90 text-slate-950 font-mono text-[10px] font-bold rounded transition-all cursor-pointer flex items-center justify-center min-w-[50px]"
                              title="Copy deep-link to clipboard"
                            >
                              {copiedType === 'link' ? (
                                <Check className="w-3.5 h-3.5 text-slate-950" />
                              ) : (
                                <span>COPY</span>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Option B: Copy Image Banner URL */}
                        <div className="space-y-1.5">
                          <label className="block font-mono text-[10px] text-slate-500 uppercase tracking-wider">Social Banner image</label>
                          <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-lg p-1.5 pl-3">
                            <span className="font-mono text-[10px] text-slate-400 truncate flex-1 select-all">
                              {repo.Banner || `https://socialify.git.ci/${owner}/${repo.Repo}/image?theme=Dark&font=Inter&pattern=Solid&logo=Github&logoColor=6366f1`}
                            </span>
                            <button
                              onClick={() => handleShareCopy(repo.Banner || `https://socialify.git.ci/${owner}/${repo.Repo}/image?theme=Dark&font=Inter&pattern=Solid&logo=Github&logoColor=6366f1`, 'banner')}
                              className="flex-shrink-0 p-1.5 bg-primary hover:bg-primary/90 text-slate-950 font-mono text-[10px] font-bold rounded transition-all cursor-pointer flex items-center justify-center min-w-[50px]"
                              title="Copy social banner URL"
                            >
                              {copiedType === 'banner' ? (
                                <Check className="w-3.5 h-3.5 text-slate-950" />
                              ) : (
                                <span>COPY</span>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Option C: Copy Rich Share Snippet */}
                        <div className="space-y-1.5">
                          <label className="block font-mono text-[10px] text-slate-500 uppercase tracking-wider">Markdown Share Badge</label>
                          <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-lg p-1.5 pl-3">
                            <span className="font-mono text-[10px] text-slate-400 truncate flex-1 select-all">
                              {`[![${repo.Repo} Banner](https://socialify.git.ci/${owner}/${repo.Repo}/image?theme=Dark&font=Inter&pattern=Solid&logo=Github&logoColor=6366f1)](${window.location.origin}${window.location.pathname}?id=${repo.Repo})`}
                            </span>
                            <button
                              onClick={() => handleShareCopy(`[![${repo.Repo} Banner](https://socialify.git.ci/${owner}/${repo.Repo}/image?theme=Dark&font=Inter&pattern=Solid&logo=Github&logoColor=6366f1)](${window.location.origin}${window.location.pathname}?id=${repo.Repo})`, 'snippet')}
                              className="flex-shrink-0 p-1.5 bg-primary hover:bg-primary/90 text-slate-950 font-mono text-[10px] font-bold rounded transition-all cursor-pointer flex items-center justify-center min-w-[50px]"
                              title="Copy markdown rich share snippet"
                            >
                              {copiedType === 'snippet' ? (
                                <Check className="w-3.5 h-3.5 text-slate-950" />
                              ) : (
                                <span>COPY</span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4. Related Projects (styled identical to related blog posts) */}
                    {relatedRepos.length > 0 && (
                      <div className="glass-panel p-5 border border-white/5 space-y-4">
                        <h3 className="font-mono text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                          <span>RELATED_PROJECTS_</span>
                        </h3>
                        <div className="space-y-3">
                          {relatedRepos.map((related) => {
                            const relatedTags = getRepositoryTags(related);
                            return (
                              <button
                                key={related.Repo}
                                onClick={() => onOpenRepo && onOpenRepo(related.Repo)}
                                className="w-full text-left flex gap-3 p-2 rounded-xl bg-white/[0.01] hover:bg-white/[0.04] border border-transparent hover:border-white/5 transition-all duration-200 group/item cursor-pointer"
                              >
                                {related.Banner ? (
                                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-white/5">
                                    <img
                                      src={related.Banner}
                                      alt={related.Repo}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-14 h-14 rounded-lg shrink-0 bg-slate-900/60 border border-white/5 flex items-center justify-center text-primary font-mono text-[10px] uppercase font-bold">
                                    {related.Repo.slice(0, 3)}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                  <h4 className="font-mono text-[11px] font-bold text-slate-200 group-hover/item:text-primary transition-colors line-clamp-1 uppercase">
                                    {related.Repo}
                                  </h4>
                                  <p className="text-[10px] text-slate-500 font-sans line-clamp-1 mt-0.5">
                                    {related.Desc}
                                  </p>
                                  <span className="text-[8px] font-mono text-slate-500 mt-1 flex items-center gap-1 uppercase">
                                    <Calendar className="w-2.5 h-2.5 text-primary" />
                                    {related.Date ? new Date(related.Date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'N/A'}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
