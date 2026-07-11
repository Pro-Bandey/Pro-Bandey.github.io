import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { X, Loader2, Sparkles, BookOpen, Star, Calendar, Share2, Check, CodeXml, Copy, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Repository, LANGUAGE_COLORS } from '../types';

interface ReadmeDrawerProps {
  repo: Repository | null;
  isOpen: boolean;
  onClose: () => void;
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
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

const rewriteMarkdownUrls = (text: string, repoName: string, branch: string) => {
  const baseRawUrl = `https://raw.githubusercontent.com/Pro-bandey/${repoName}/refs/heads/${branch}/`;
  
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
    const baseGithubUrl = `https://github.com/Pro-bandey/${repoName}/blob/${branch}/`;
    return `${prefix}${baseGithubUrl}${cleanUrl}${suffix}`;
  });

  return transformed;
};

export default function ReadmeDrawer({ repo, isOpen, onClose }: ReadmeDrawerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<'link' | 'banner' | 'snippet' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const repoName = repo?.Repo || null;

  useEffect(() => {
    if (!isOpen || !repoName) return;

    const fetchReadme = async () => {
      setLoading(true);
      setError(false);
      setContent('');

      const mainUrl = `https://raw.githubusercontent.com/Pro-bandey/${repoName}/refs/heads/main/README.md`;
      const masterUrl = `https://raw.githubusercontent.com/Pro-bandey/${repoName}/refs/heads/master/README.md`;

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
        const transformedText = rewriteMarkdownUrls(text, repoName, resolvedBranch);
        setContent(transformedText);
      } catch (err) {
        console.error('Failed to retrieve markdown', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchReadme();
  }, [repoName, isOpen]);

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
        <pre className="!my-0" {...props}>
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
              ? "fixed inset-0 md:inset-4 z-[2100] bg-bg-main overflow-y-auto space-y-6 p-4 md:p-6 rounded-none md:rounded-2xl border-none md:border md:border-border shadow-2xl"
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  
                  {/* Left Side: README Markdown Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {content ? (
                      <div className="markdown-body prose prose-invert max-w-none prose-amber prose-headings:font-mono prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:text-slate-400 prose-p:leading-relaxed prose-a:text-primary prose-code:font-mono prose-code:text-primary/90 prose-pre:bg-slate-900/60 prose-pre:border prose-pre:border-primary/5">
                        <Markdown 
                          rehypePlugins={[rehypeRaw]}
                          components={{
                            pre: PreBlock
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

                  {/* Right Side: High-Tech Stats, Sparklines, and Actions Sidebar */}
                  <div className="space-y-6">
                    
                    {/* 1. Repository Quick Stats Panel */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4 shadow-sm">
                      <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-white/5">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <span>Project Overview</span>
                      </div>
                      
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
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/10 border border-green-500/30 text-green-400 font-bold uppercase tracking-wider animate-pulse">
                            ACTIVE ONLINE
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Mini Code Language distribution sparklines */}
                    {repo.Langs && Object.keys(repo.Langs).length > 0 && (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-white/5">
                          <span className="flex items-center gap-2">
                            <CodeXml className="w-4 h-4 text-primary" />
                            Language profile
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal">SVG Sparkline</span>
                        </div>
                        
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
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4 shadow-sm">
                      <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-white/5">
                        <Share2 className="w-4 h-4 text-primary" />
                        <span>Share Repository</span>
                      </div>
                      
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
                              {repo.Banner || `https://socialify.git.ci/Pro-bandey/${repo.Repo}/image?theme=Dark&font=Inter&pattern=Solid&logo=Github&logoColor=6366f1`}
                            </span>
                            <button
                              onClick={() => handleShareCopy(repo.Banner || `https://socialify.git.ci/Pro-bandey/${repo.Repo}/image?theme=Dark&font=Inter&pattern=Solid&logo=Github&logoColor=6366f1`, 'banner')}
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
                              {`[![${repo.Repo} Banner](https://socialify.git.ci/Pro-bandey/${repo.Repo}/image?theme=Dark&font=Inter&pattern=Solid&logo=Github&logoColor=6366f1)](${window.location.origin}${window.location.pathname}?id=${repo.Repo})`}
                            </span>
                            <button
                              onClick={() => handleShareCopy(`[![${repo.Repo} Banner](https://socialify.git.ci/Pro-bandey/${repo.Repo}/image?theme=Dark&font=Inter&pattern=Solid&logo=Github&logoColor=6366f1)](${window.location.origin}${window.location.pathname}?id=${repo.Repo})`, 'snippet')}
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
