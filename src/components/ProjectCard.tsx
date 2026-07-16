import React, { useState, useEffect } from 'react';
import { ExternalLink, Github, CodeXml, Calendar, Sparkles, Star, Share2, Check, GitFork, Archive } from 'lucide-react';
import { Repository, LANGUAGE_COLORS } from '../types';
import { calculateComplexityScore, getRepositoryTags } from '../utils';

const githubStatsCache: Record<string, { stars: number; forks: number; archived: boolean }> = {};

interface ProjectCardProps {
  repo: Repository;
  onOpenReadme: (repoName: string, hasReadme: boolean) => void;
  onOpenPreview: (repoName: string, previewUrl: string) => void;
  onLanguageHover: (languages: Record<string, number>, e: React.MouseEvent) => void;
  onLanguageLeave: () => void;
}

export default function ProjectCard({
  repo,
  onOpenReadme,
  onOpenPreview,
  onLanguageHover,
  onLanguageLeave,
}: ProjectCardProps) {
  const [copied, setCopied] = useState(false);

  const stats = {
    stars: repo.Stars ?? 0,
    forks: (repo as any).Forks ?? 0,
    archived: (repo as any).Archived ?? false,
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(repo.Repo)}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Check if repository is "new" (created within last 30 days)
  const isNewRepository = () => {
    if (!repo.Date) return false;
    const createdDate = new Date(repo.Date);
    const timeDiff = new Date().getTime() - createdDate.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    return daysDiff <= 30; // 30 days for new repos
  };

  const isNew = isNewRepository();

  const isRecentlyUpdated = () => {
    if (!repo.UpdatedAt || isNew) return false;
    const updatedDate = new Date(repo.UpdatedAt);
    const timeDiff = new Date().getTime() - updatedDate.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    return daysDiff <= 30; // 30 days for recently updated
  };

  const isUpdated = isRecentlyUpdated();
  const sortedLangs = repo.Langs ? Object.entries(repo.Langs).sort((a, b) => b[1] - a[1]) : [];
  const tags = getRepositoryTags(repo);
  
  // Format dates elegantly
  const formatRepoDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const getRelativeTimestamp = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    
    if (isNaN(diffTime) || diffTime < 0) {
      return 'Recently updated';
    }
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffTime / (1000 * 60));
        if (diffMins <= 1) return 'Updated just now';
        return `Updated ${diffMins}m ago`;
      }
      if (diffHours === 1) return 'Updated 1h ago';
      return `Updated ${diffHours}h ago`;
    }
    if (diffDays === 1) {
      return 'Updated yesterday';
    }
    if (diffDays < 7) {
      return `Updated ${diffDays}d ago`;
    }
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      if (weeks === 1) return 'Updated 1w ago';
      return `Updated ${weeks}w ago`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      if (months === 1) return 'Updated 1mo ago';
      return `Updated ${months}mo ago`;
    }
    const years = Math.floor(diffDays / 365);
    if (years === 1) return 'Updated 1y ago';
    return `Updated ${years}y ago`;
  };


  const socialBanner = repo.Banner || `https://socialify.git.ci/Pro-bandey/${repo.Repo}/image?theme=Dark&font=Inter&pattern=Solid&logo=Github&logoColor=6366f1`;

  return (
    <div className="glass-panel group relative flex flex-col h-full overflow-hidden border border-white/10 hover:border-primary/30 bg-white/5 backdrop-blur-md transition-all duration-300">
      {/* New / Updated Badge */}
      {isNew && (
        <div className="absolute top-3 left-3 z-10 bg-[#00dd00] text-slate-950 font-mono font-bold text-[10px] px-2 py-0.5 rounded shadow-[0_0_12px_rgba(0,221,0,0.4)] flex items-center gap-1">
          <Sparkles className="w-3 h-3 animate-pulse" />
          <span>NEW</span>
        </div>
      )}
      {!isNew && isUpdated && (
        <div className="absolute top-3 left-3 z-10 bg-amber-500 text-slate-950 font-mono font-bold text-[10px] px-2 py-0.5 rounded shadow-[0_0_12px_rgba(245,158,11,0.4)] flex items-center gap-1">
          <Sparkles className="w-3 h-3 animate-pulse" />
          <span>UPDATED</span>
        </div>
      )}

      {/* Date & Archived Overlay Badges */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5">
        {stats.archived && (
          <div className="bg-rose-500/90 backdrop-blur-md text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded shadow-[0_0_12px_rgba(239,68,68,0.4)] flex items-center gap-1 border border-rose-400/20">
            <Archive className="w-2.5 h-2.5" />
            <span>ARCHIVED</span>
          </div>
        )}
        <div className="bg-black/70 backdrop-blur-md text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded border border-white/10 flex items-center gap-1 shadow-sm">
          <Calendar className="w-3 h-3 text-primary" />
          <span>{formatRepoDate(repo.Date)}</span>
        </div>
      </div>

      {/* Banner Area */}
      <div 
        onClick={() => onOpenReadme(repo.Repo, repo.ReadMeIs)}
        className="relative aspect-[1.91/1] overflow-hidden bg-slate-950 border-b border-white/5 cursor-pointer"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent z-[1] pointer-events-none" />
        
        {/* Placeholder gradient banner while fetching / in case socialify is slow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/10 opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
        
        <img
          src={socialBanner}
          alt={`${repo.Repo} banner`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          onError={(e) => {
            // Replace with fallback custom typography box if socialify fails
            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="314" viewBox="0 0 600 314"><rect width="100%" height="100%" fill="%23090d16"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="28" fill="%23ff9900" font-weight="bold">%3Cpro_bandey /%3E</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="20" fill="%2394a3b8">' + repo.Repo + '</text></svg>';
          }}
        />

        {/* Dynamic Visual Tag Badges overlaid on bottom-left of the banner image */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span 
              key={tag} 
              className="px-2 py-0.5 rounded bg-slate-950/85 backdrop-blur-md border border-white/10 text-primary-hover font-mono text-[9px] font-bold tracking-wider uppercase shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Repo Title */}
        <h3 
          onClick={() => onOpenReadme(repo.Repo, repo.ReadMeIs)}
          className="text-lg font-mono font-bold text-slate-100 hover:text-primary transition-colors cursor-pointer mb-1 inline-flex items-center gap-1.5"
        >
          {repo.Repo}
        </h3>

        {/* Dynamic Metadata Row: Relative Maintenance Timestamp & GitHub Stats Badges */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3 text-[11px] font-mono">
          {repo.UpdatedAt && (
            <span className="text-slate-400 flex items-center gap-1 mr-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/70 animate-pulse" />
              {getRelativeTimestamp(repo.UpdatedAt)}
            </span>
          )}

          {/* Stars Pill Badge */}
          <span className="inline-flex items-center gap-0.5 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 text-amber-400" title="GitHub Stars">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-bold">{stats.stars}</span>
          </span>

          {/* Forks Pill Badge */}
          <span className="inline-flex items-center gap-0.5 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 text-emerald-400" title="GitHub Forks">
            <GitFork className="w-3 h-3" />
            <span className="text-[10px] font-bold">{stats.forks}</span>
          </span>

          {/* Archived/Active indicator */}
          {stats.archived ? (
            <span className="inline-flex items-center gap-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/10 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider" title="Repository is Archived">
              Archived
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 bg-[#00dd00]/10 text-[#00dd00] border border-[#00dd00]/10 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider" title="Active Repository">
              Active
            </span>
          )}
        </div>

        {/* Small Metrics Widget */}
        <div className="grid grid-cols-2 gap-2 bg-black/25 border border-white/5 rounded-xl p-2.5 mb-4 text-xs font-mono select-none">
          <div className="space-y-0.5">
            <span className="text-[8px] text-slate-500 uppercase tracking-widest block">LAST MODIFIED</span>
            <span className="text-[10px] text-slate-300 font-bold flex items-center gap-1 truncate">
              <Calendar className="w-3 h-3 text-primary/80 shrink-0" />
              <span className="truncate">{repo.UpdatedAt ? new Date(repo.UpdatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
            </span>
          </div>
          <div className="space-y-0.5 border-l border-white/5 pl-2.5">
            <span className="text-[8px] text-slate-500 uppercase tracking-widest block">COMPLEXITY INDEX</span>
            <span className="text-[10px] text-primary font-black flex items-center gap-1 truncate">
              <Sparkles className="w-3 h-3 text-primary shrink-0 animate-pulse" />
              <span>{calculateComplexityScore(repo)} / 10.0</span>
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-400 mb-5 flex-1 line-clamp-3 group-hover:text-slate-300 transition-colors">
          {repo.Desc}
        </p>

        {/* Dynamic Language Track Bar */}
        <div className="space-y-1.5 mb-5 select-none">
          <div className="flex justify-between items-center text-[11px] font-mono text-slate-500">
            <span>LANGUAGE PROFILE</span>
            <span className="text-[10px] text-primary/70 group-hover:text-primary transition-colors">Hover bar for details</span>
          </div>
          
          <div 
            onMouseMove={(e) => repo.Langs && onLanguageHover(repo.Langs, e)}
            onMouseLeave={onLanguageLeave}
            className="flex h-2 w-full bg-slate-900/60 rounded-full overflow-hidden cursor-help border border-slate-800/60"
          >
            {sortedLangs.length > 0 ? (
              sortedLangs.map(([lang, percent]) => {
                const color = LANGUAGE_COLORS[lang] || '#8b5cf6';
                return (
                  <div
                    key={lang}
                    style={{ 
                      width: `${percent}%`, 
                      backgroundColor: color 
                    }}
                    className="h-full transition-all duration-300 hover:brightness-110"
                  />
                );
              })
            ) : (
              <div className="h-full w-full bg-slate-700" />
            )}
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => onOpenReadme(repo.Repo, repo.ReadMeIs)}
            className="flex-1 bg-slate-900/80 hover:bg-slate-800 text-primary font-mono font-bold text-xs py-2 px-2 rounded flex items-center justify-center gap-1 transition-all duration-200 border border-primary/20 hover:border-primary/40 active:scale-95 cursor-pointer"
            title="Open Details & Readme Tab"
          >
            <CodeXml className="w-3.5 h-3.5" />
            <span className="text-[10px]">DETAILS</span>
          </button>

          {repo.PreviewUrl && (
            <button
              onClick={() => onOpenPreview(repo.Repo, repo.PreviewUrl!)}
              className="flex-1 bg-primary text-slate-950 hover:bg-primary/90 font-mono font-bold text-xs py-2 px-2 rounded flex items-center justify-center gap-1 transition-all duration-200 active:scale-95 shadow-lg shadow-primary/20 cursor-pointer"
              title="Open Live Sandbox Tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="text-[10px]">PREVIEW</span>
            </button>
          )}

          <button
            onClick={handleShareClick}
            className="p-2 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-slate-100 border border-slate-800 hover:border-slate-700 rounded transition-all cursor-pointer flex items-center justify-center min-w-[34px]"
            title={copied ? "Link Copied!" : "Share Project Link"}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[#00dd00]" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>

          <a
            href={`https://github.com/Pro-bandey/${repo.Repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-slate-100 border border-slate-800 hover:border-slate-700 rounded flex items-center justify-center transition-all duration-200"
            title="View Source on GitHub"
          >
            <Github className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
