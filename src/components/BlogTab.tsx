import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  Search, 
  Calendar, 
  User, 
  Clock, 
  ArrowLeft, 
  Tag, 
  Share2, 
  Check, 
  BookOpen, 
  Loader2, 
  ChevronRight,
  ChevronDown,
  AlertCircle,
  SlidersHorizontal,
  Rss,
  ExternalLink,
  Globe,
  RefreshCw,
  Cpu
} from 'lucide-react';
import ProjectCard from './ProjectCard';

interface BlogIndexItem {
  Article: string;
  Name: string;
  Author: string;
  Desc: string;
  Img: string;
  Url: string;
  Date: string;
  Cat: string[];
  Tags: string[];
  Status: string;
}

interface BlogPostData {
  Title?: string;
  Desc?: string;
  Author?: string;
  Id?: string;
  Tags?: string[];
  Categories?: string[];
  Date?: string;
  Img?: string;
  Status?: string;
  Data: string;
}

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  creator: string;
  contentSnippet: string;
  categories: string[];
  thumbnail: string;
}

interface BlogTabProps {
  repos?: any[];
  onOpenReadme?: (repoName: string, hasReadme: boolean) => void;
  onOpenPreview?: (repoName: string, previewUrl: string) => void;
  handleLanguageHover?: (languages: Record<string, number>, e: React.MouseEvent) => void;
  handleLanguageLeave?: () => void;
  // Sync state props
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  sortBy: 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';
  setSortBy: (val: 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc') => void;
  setActiveBlogPostTitle: (title: string | null) => void;
}

const DB_PATH = "https://raw.githubusercontent.com/MainRoute-Core/Clogs/output/blogs.json";
const LOGS_PATH = "https://raw.githubusercontent.com/MainRoute-Core/Clogs/main/Logs/";

export default function BlogTab({
  repos = [],
  onOpenReadme,
  onOpenPreview,
  handleLanguageHover,
  handleLanguageLeave,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  setActiveBlogPostTitle
}: BlogTabProps) {
  const [blogs, setBlogs] = useState<BlogIndexItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // RSS Feed Reader State
  const [blogSource, setBlogSource] = useState<'static' | 'rss'>('static');
  const [rssUrl, setRssUrl] = useState('https://dev.to/feed');
  const [rssItems, setRssItems] = useState<RSSItem[]>([]);
  const [rssLoading, setRssLoading] = useState(false);
  const [rssError, setRssError] = useState<string | null>(null);

  const parseRSS = async (url: string) => {
    if (!url) return;
    setRssLoading(true);
    setRssError(null);
    setRssItems([]);
    
    try {
      // First attempt direct client-side fetch (which might be CORS-blocked depending on source)
      let text = "";
      let directFetchSucceeded = false;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          text = await res.text();
          directFetchSucceeded = true;
        }
      } catch (e) {
        console.log("Direct RSS fetch was blocked by CORS or timed out. Falling back to rss2json proxy...");
      }

      if (!directFetchSucceeded) {
        // Fallback to free public rss2json converter to safely bypass CORS
        const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error("Could not retrieve feed via direct or proxy connection.");
        const json = await res.json();
        if (json.status !== 'ok') {
          throw new Error(json.message || "XML Feed translation failed.");
        }
        
        const mapped: RSSItem[] = (json.items || []).map((item: any) => {
          let thumbnail = item.thumbnail || '';
          if (!thumbnail && item.description) {
            const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch) thumbnail = imgMatch[1];
          }
          return {
            title: item.title || '',
            link: item.link || '',
            pubDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString() : '',
            creator: item.author || 'Anonymous',
            contentSnippet: item.description ? item.description.replace(/<[^>]*>/g, '').slice(0, 180) + '...' : '',
            categories: Array.isArray(item.categories) ? item.categories : [],
            thumbnail: thumbnail
          };
        });
        setRssItems(mapped);
        setRssLoading(false);
        return;
      }

      // If direct fetch succeeded, parse the XML
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/xml");
      const items = doc.querySelectorAll("item");
      const parsed: RSSItem[] = [];

      items.forEach(node => {
        const title = node.querySelector("title")?.textContent || '';
        const link = node.querySelector("link")?.textContent || '';
        const pubDateText = node.querySelector("pubDate")?.textContent || '';
        const pubDate = pubDateText ? new Date(pubDateText).toLocaleDateString() : '';
        const creator = node.querySelector("creator")?.textContent || 
                        node.querySelector("dc\\:creator")?.textContent || 
                        node.querySelector("author")?.textContent || 'Anonymous';
        
        const description = node.querySelector("description")?.textContent || '';
        const contentSnippet = description.replace(/<[^>]*>/g, '').slice(0, 180) + '...';
        
        const categories: string[] = [];
        node.querySelectorAll("category").forEach(cat => {
          if (cat.textContent) categories.push(cat.textContent);
        });

        let thumbnail = '';
        const enclosure = node.querySelector("enclosure");
        if (enclosure && enclosure.getAttribute("type")?.startsWith("image")) {
          thumbnail = enclosure.getAttribute("url") || '';
        }
        if (!thumbnail) {
          const mediaContent = node.querySelector("media\\:content");
          if (mediaContent) {
            thumbnail = mediaContent.getAttribute("url") || '';
          }
        }
        if (!thumbnail) {
          const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
          if (imgMatch) thumbnail = imgMatch[1];
        }

        parsed.push({ title, link, pubDate, creator, contentSnippet, categories, thumbnail });
      });

      if (parsed.length === 0) {
        // Try Atom Feed mapping if RSS list was empty
        const entries = doc.querySelectorAll("entry");
        entries.forEach(node => {
          const title = node.querySelector("title")?.textContent || '';
          const linkNode = node.querySelector("link");
          const link = linkNode ? (linkNode.getAttribute("href") || linkNode.textContent || '') : '';
          const pubDateText = node.querySelector("published")?.textContent || node.querySelector("updated")?.textContent || '';
          const pubDate = pubDateText ? new Date(pubDateText).toLocaleDateString() : '';
          const creator = node.querySelector("author name")?.textContent || 'Anonymous';
          const description = node.querySelector("summary")?.textContent || node.querySelector("content")?.textContent || '';
          const contentSnippet = description.replace(/<[^>]*>/g, '').slice(0, 180) + '...';
          
          let thumbnail = '';
          const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
          if (imgMatch) thumbnail = imgMatch[1];

          parsed.push({ title, link, pubDate, creator, contentSnippet, categories: [], thumbnail });
        });
      }

      setRssItems(parsed);
    } catch (err: any) {
      console.error("RSS Parsing failure:", err);
      setRssError(err.message || "Failed to parse the external RSS XML payload.");
    } finally {
      setRssLoading(false);
    }
  };

  // Trigger RSS parse on switching to RSS view or changing RSS URL
  useEffect(() => {
    if (blogSource === 'rss') {
      parseRSS(rssUrl);
    }
  }, [blogSource, rssUrl]);

  // Reading Post State
  const [activePostId, setActivePostId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('post');
  });
  const [postData, setPostData] = useState<BlogPostData | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [postError, setPostError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);

  // Sync URL for individual post sharing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (activePostId) {
      params.set('post', activePostId);
    } else {
      params.delete('post');
    }
    const newUrl = params.toString() 
      ? `${window.location.pathname}?${params.toString()}` 
      : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [activePostId]);

  // Handle browser back button for individual post navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setActivePostId(params.get('post'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync active blog post title with parent App component for dynamic browser tab title
  useEffect(() => {
    if (activePostId && blogs.length > 0) {
      const match = blogs.find(b => b.Article === activePostId);
      if (match) {
        setActiveBlogPostTitle(match.Name);
      } else {
        setActiveBlogPostTitle(null);
      }
    } else {
      setActiveBlogPostTitle(null);
    }
  }, [activePostId, blogs, setActiveBlogPostTitle]);

  // Fetch blogs database
  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(DB_PATH);
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        const data = await response.json();
        const rawBlogs = Array.isArray(data) ? data : (data.blogs || []);
        
        // Filter: Status must be "Pub" and Author must be "Pro Bandey" (case-insensitive)
        const proBandeyBlogs = rawBlogs.filter((item: any) => 
          item.Status === "Pub" && 
          item.Author && 
          item.Author.toLowerCase().trim() === "pro bandey"
        );
        
        setBlogs(proBandeyBlogs);
      } catch (err) {
        console.error("Error loading blogs from database:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  // Fetch individual post data when activePostId changes
  useEffect(() => {
    setIsTocOpen(false);
    if (!activePostId) {
      setPostData(null);
      return;
    }

    const fetchPostContent = async () => {
      setLoadingPost(true);
      setPostError(false);
      try {
        // Find index record to get file url
        const indexRecord = blogs.find(b => b.Article === activePostId);
        const fileName = indexRecord ? indexRecord.Url : `${activePostId}.json`;
        
        const response = await fetch(`${LOGS_PATH}${fileName}`);
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        const data: BlogPostData = await response.json();
        setPostData(data);
      } catch (err) {
        console.error(`Error loading blog post content for ${activePostId}:`, err);
        setPostError(true);
      } finally {
        setLoadingPost(false);
      }
    };

    if (blogs.length > 0) {
      fetchPostContent();
    }
  }, [activePostId, blogs]);

  // Extract unique categories across Pro Bandey blogs
  const categories = useMemo(() => {
    const cats = new Set<string>();
    blogs.forEach(b => {
      if (b.Cat) {
        b.Cat.forEach(c => cats.add(c));
      }
    });
    return ['All', ...Array.from(cats)];
  }, [blogs]);

  // Related posts computed from matching categories
  const relatedPosts = useMemo(() => {
    if (!activePostId || !postData || blogs.length === 0) return [];
    
    const currentCats = postData.Categories || [];
    if (currentCats.length === 0) return [];

    return blogs
      .filter(item => {
        // Exclude the current active post
        if (item.Article === activePostId) return false;
        // Check if there's any overlapping category
        return item.Cat && item.Cat.some(cat => currentCats.includes(cat));
      })
      .slice(0, 3); // Display top 3 related posts
  }, [activePostId, postData, blogs]);

  // Filtered and Sorted Blogs List
  const filteredBlogs = useMemo(() => {
    let result = blogs.filter(b => {
      const matchesCategory = selectedCategory === 'All' || (b.Cat && b.Cat.includes(selectedCategory));
      const matchesSearch = searchQuery === '' || 
        (b.Name && b.Name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.Desc && b.Desc.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.Tags && b.Tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchesCategory && matchesSearch;
    });

    // Apply sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.Date).getTime() - new Date(a.Date).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.Date).getTime() - new Date(b.Date).getTime();
      }
      if (sortBy === 'title-asc') {
        return a.Name.localeCompare(b.Name);
      }
      if (sortBy === 'title-desc') {
        return b.Name.localeCompare(a.Name);
      }
      return 0;
    });
  }, [blogs, selectedCategory, searchQuery, sortBy]);

  // Calculate estimated reading time
  const readingTime = (content: string) => {
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
  };

  const handleShare = (e: React.MouseEvent, title: string) => {
    e.stopPropagation();
    const url = window.location.href;
    navigator.clipboard.writeText(`Check out "${title}" by Pro Bandey:\n${url}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Render Table Of Contents from Markdown headers
  const tocItems = useMemo(() => {
    if (!postData?.Data) return [];
    const lines = postData.Data.split('\n');
    const items: { text: string; id: string; level: number }[] = [];
    
    lines.forEach((line) => {
      const match = line.match(/^(#{2,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length; // 2 for h2, 3 for h3
        const text = match[2].trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        items.push({ text, id, level });
      }
    });
    return items;
  }, [postData]);

  // Smooth scroll to element ID
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="container px-4 md:px-8 max-w-6xl space-y-10">
      <AnimatePresence mode="wait">
        {activePostId ? (
          // DETAIL READ VIEW
          <motion.div
            key="blog-post-detail"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 pt-4"
          >
            {/* Header / Back Action */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <button
                onClick={() => setActivePostId(null)}
                className="group flex items-center justify-center gap-2 font-mono text-xs text-slate-400 hover:text-primary transition-all duration-200 bg-slate-950/40 border border-white/5 hover:border-primary/20 rounded-full px-4 py-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>RETURN TO BLOG INDEX</span>
              </button>

              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={(e) => handleShare(e, postData?.Title || "Blog Post")}
                  className="flex items-center gap-2 font-mono text-xs text-slate-400 hover:text-primary transition-all duration-200 bg-slate-950/40 border border-white/5 hover:border-primary/20 rounded-full px-4 py-2 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#00dd00] animate-pulse" />
                      <span className="text-[#00dd00]">COPIED LINK!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>SHARE ARTICLE_</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {loadingPost ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="font-mono text-xs text-slate-500 uppercase tracking-widest animate-pulse">
                  Unpacking core encrypted log nodes...
                </p>
              </div>
            ) : postError || !postData ? (
              <div className="glass-panel p-12 text-center max-w-xl mx-auto space-y-4 border-rose-500/20">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                <h3 className="font-mono text-base font-bold text-slate-200 uppercase">
                  Log Connection Interrupted
                </h3>
                <p className="text-sm text-slate-400">
                  The encrypted log node packet failed to load or has been archived.
                </p>
                <button
                  onClick={() => setActivePostId(null)}
                  className="bg-primary/10 hover:bg-primary/20 text-primary font-mono text-xs px-6 py-2.5 rounded-lg border border-primary/30 transition-all cursor-pointer"
                >
                  Return to Index
                </button>
              </div>
            ) : (
              // FULL ARTICLE RENDER
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Article Main Content */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Metadata Card */}
                  <div className="glass-panel p-6 border border-white/5 space-y-4">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {postData.Date || "Classified"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-secondary" />
                        Pro Bandey
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        {readingTime(postData.Data)} min read
                      </span>
                    </div>

                    <h1 className="font-mono text-2xl md:text-3xl font-black text-slate-100 tracking-tight leading-tight uppercase">
                      {postData.Title}
                    </h1>

                    {postData.Desc && (
                      <p className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-primary/50 pl-4 bg-white/[0.02] py-2 rounded-r-lg">
                        {postData.Desc}
                      </p>
                    )}
                  </div>

                  {/* Collapsible Dropdown Table of Contents */}
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

                  {/* Markdown Body container */}
                  <div className="glass-panel p-6 md:p-10 border border-white/5 bg-slate-950/20">
                    <div className="markdown-body">
                      <ReactMarkdown 
                        components={{
                          h2: ({ node, ...props }) => {
                            const id = String(props.children || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                            return <h2 id={id} {...props} />;
                          },
                          h3: ({ node, ...props }) => {
                            const id = String(props.children || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                            return <h3 id={id} {...props} />;
                          }
                        }}
                      >
                        {postData.Data}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>

                {/* Right: Sidebar with Metadata */}
                <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
                  {/* Taxonomy / Categories & Tags Card */}
                  <div className="glass-panel p-5 border border-white/5 space-y-4">
                    <h3 className="font-mono text-xs font-bold text-text-muted uppercase tracking-wider">
                      TAG_TAXONOMY_MAP
                    </h3>

                    {postData.Categories && postData.Categories.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Categories</span>
                        <div className="flex flex-wrap gap-1.5">
                          {postData.Categories.map((cat, i) => (
                            <span key={i} className="bg-primary/10 border border-primary/20 text-primary font-mono text-[9px] px-2 py-0.5 rounded-full font-bold">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {postData.Tags && postData.Tags.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Tags</span>
                        <div className="flex flex-wrap gap-1.5">
                          {postData.Tags.map((tag, i) => (
                            <span key={i} className="bg-white/5 border border-white/5 text-slate-400 font-mono text-[9px] px-2 py-0.5 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Related Posts */}
                  {relatedPosts.length > 0 && (
                    <div className="glass-panel p-5 border border-white/5 space-y-4">
                      <h3 className="font-mono text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-primary" />
                        <span>RELATED_POSTS_</span>
                      </h3>
                      <div className="space-y-3">
                        {relatedPosts.map((post) => (
                          <button
                            key={post.Article}
                            onClick={() => {
                              setActivePostId(post.Article);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="w-full text-left flex gap-3 p-2 rounded-xl bg-white/[0.01] hover:bg-white/[0.04] border border-transparent hover:border-white/5 transition-all duration-200 group cursor-pointer"
                          >
                            {post.Img && (
                              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-white/5">
                                <img
                                  src={post.Img}
                                  alt={post.Name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <h4 className="font-mono text-[11px] font-bold text-slate-200 group-hover:text-primary transition-colors line-clamp-2 uppercase">
                                {post.Name}
                              </h4>
                              <span className="text-[9px] font-mono text-slate-500 mt-1 flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5 text-primary" />
                                {post.Date}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          // INDEX GRID VIEW
          <motion.div
            key="blog-index"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Title Block */}
            <div className="text-center max-w-xl mx-auto space-y-3 pt-6">
              <h1 className="font-mono text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-100">
                THE <span className="text-primary">BLOG_</span>
              </h1>
              <p className="text-sm text-slate-400">
                Parsed log streams, coding paradigms, and tech insights published directly by Pro Bandey.
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="flex justify-center select-none pt-2">
              <div className="inline-flex bg-slate-950/60 border border-white/5 rounded-xl p-1 gap-1 shadow-inner">
                <button
                  onClick={() => setBlogSource('static')}
                  className={`flex items-center gap-2 px-5 py-2 font-mono text-xs uppercase rounded-lg transition-all cursor-pointer ${
                    blogSource === 'static'
                      ? 'bg-primary/20 text-primary border border-primary/20 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>CLOGS PACKETS</span>
                </button>
                <button
                  onClick={() => setBlogSource('rss')}
                  className={`flex items-center gap-2 px-5 py-2 font-mono text-xs uppercase rounded-lg transition-all cursor-pointer ${
                    blogSource === 'rss'
                      ? 'bg-primary/20 text-primary border border-primary/20 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Rss className="w-3.5 h-3.5" />
                  <span>RSS FEED PARSER</span>
                </button>
              </div>
            </div>

            {blogSource === 'static' ? (
              <>
                {/* Collapsible Filter Panel */}
                <div className="glass-panel border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden transition-all duration-300">
                  {/* Header that toggles dropdown */}
                  <button
                    onClick={() => setFiltersExpanded(prev => !prev)}
                    className="w-full flex items-center justify-between p-4 font-mono text-xs text-slate-300 hover:text-primary transition-colors cursor-pointer focus:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-primary" />
                      <span className="uppercase font-bold tracking-wider">FILTER & SEARCH CONFIG_</span>
                      {(searchQuery || selectedCategory !== 'All' || sortBy !== 'date-desc') && (
                        <span className="bg-primary/20 text-primary border border-primary/30 rounded-full px-2.5 py-0.5 text-[9px] font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">{filtersExpanded ? "COLLAPSE" : "EXPAND"}</span>
                      <motion.div
                        animate={{ rotate: filtersExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </motion.div>
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {filtersExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="p-4 pt-0 border-t border-white/5 flex flex-col gap-4">
                          
                          <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-4">
                            {/* Search Bar */}
                            <div className="relative w-full md:w-[45%] max-w-md">
                              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filter blog logs by keyword..."
                                className="w-full bg-black/30 border border-white/5 hover:border-white/10 focus:border-primary/40 focus:ring-0 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-slate-200 outline-none placeholder-slate-600 transition-colors"
                              />
                            </div>

                            {/* Sort Control Row */}
                            <div className="flex w-full md:w-auto items-center justify-end gap-1.5 overflow-x-auto py-1 scrollbar-none select-none shrink-0">
                              <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider shrink-0 pr-1">Sort By:</span>
                              <button
                                onClick={() => setSortBy('date-desc')}
                                className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] uppercase transition-all duration-200 whitespace-nowrap cursor-pointer ${
                                  sortBy === 'date-desc'
                                    ? 'bg-primary/10 border-primary/40 text-primary font-bold'
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                                }`}
                              >
                                Newest
                              </button>
                              <button
                                onClick={() => setSortBy('date-asc')}
                                className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] uppercase transition-all duration-200 whitespace-nowrap cursor-pointer ${
                                  sortBy === 'date-asc'
                                    ? 'bg-primary/10 border-primary/40 text-primary font-bold'
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                                }`}
                              >
                                Oldest
                              </button>
                              <button
                                onClick={() => setSortBy('title-asc')}
                                className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] uppercase transition-all duration-200 whitespace-nowrap cursor-pointer ${
                                  sortBy === 'title-asc'
                                    ? 'bg-primary/10 border-primary/40 text-primary font-bold'
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                                }`}
                              >
                                A-Z
                              </button>
                              <button
                                onClick={() => setSortBy('title-desc')}
                                className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] uppercase transition-all duration-200 whitespace-nowrap cursor-pointer ${
                                  sortBy === 'title-desc'
                                    ? 'bg-primary/10 border-primary/40 text-primary font-bold'
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                                }`}
                              >
                                Z-A
                              </button>
                            </div>
                          </div>

                          {/* Filter Selector Row */}
                          {categories.length > 1 && (
                            <div className="flex w-full items-center gap-2 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-primary/10 select-none border-t border-white/5 pt-3">
                              <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider shrink-0 pr-1">Categories:</span>
                              {categories.map(cat => (
                                <button
                                  key={cat}
                                  onClick={() => setSelectedCategory(cat)}
                                  className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] uppercase transition-all duration-200 whitespace-nowrap cursor-pointer ${
                                    selectedCategory === cat
                                      ? 'bg-primary/10 border-primary/40 text-primary font-bold'
                                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                                  }`}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                          )}

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-6">
                  {loading ? (
                    // LOADING GRID
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="glass-panel border border-white/5 h-[360px] animate-pulse flex flex-col justify-between p-5">
                          <div className="w-full h-40 bg-white/5 rounded-xl mb-4" />
                          <div className="space-y-2">
                            <div className="h-3 bg-white/5 rounded w-1/3" />
                            <div className="h-4 bg-white/5 rounded w-3/4" />
                            <div className="h-4 bg-white/5 rounded w-1/2" />
                          </div>
                          <div className="h-8 bg-white/5 rounded w-full mt-4" />
                        </div>
                      ))}
                    </div>
                  ) : error ? (
                    // ERROR STATE
                    <div className="glass-panel p-12 text-center max-w-xl mx-auto space-y-4 border-rose-500/20">
                      <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                      <h3 className="font-mono text-base font-bold text-slate-200 uppercase">
                        Failed to Synchronize Logs
                      </h3>
                      <p className="text-sm text-slate-400">
                        Could not load published log packets from the remote database connection node.
                      </p>
                      <button
                        onClick={() => window.location.reload()}
                        className="bg-primary/10 hover:bg-primary/20 text-primary font-mono text-xs px-6 py-2.5 rounded-lg border border-primary/30 transition-all cursor-pointer"
                      >
                        RETRY LOOKUP
                      </button>
                    </div>
                  ) : filteredBlogs.length === 0 ? (
                    // EMPTY SEARCH STATE
                    <div className="glass-panel p-12 text-center max-w-xl mx-auto space-y-4 border-dashed border-white/5 bg-slate-950/20">
                      <Search className="w-12 h-12 text-slate-600 mx-auto" />
                      <h3 className="font-mono text-base font-bold text-slate-200 uppercase">
                        Zero Logs Resolved_
                      </h3>
                      <p className="text-sm text-slate-400">
                        No published blogs match your query filter parameters.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('All');
                        }}
                        className="bg-white/5 hover:bg-white/10 text-slate-200 font-mono text-xs px-6 py-2.5 rounded-lg border border-white/5 transition-all cursor-pointer"
                      >
                        RESET SEARCH FILTER
                      </button>
                    </div>
                  ) : (
                    // BLOGS GRID LIST
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredBlogs.map((post) => {
                        return (
                          <div 
                            key={post.Article}
                            className="glass-panel group border border-white/5 hover:border-primary/20 flex flex-col justify-between overflow-hidden relative shadow-lg hover:shadow-2xl transition-all duration-300"
                          >
                            {/* Corner accents */}
                            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div>
                              {/* Banner Wrapper */}
                              {post.Img && (
                                <div 
                                  onClick={() => setActivePostId(post.Article)}
                                  className="w-full h-44 overflow-hidden relative cursor-pointer"
                                >
                                  <img 
                                    src={post.Img} 
                                    alt={post.Name} 
                                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 select-none"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-slate-950/20" />
                                  
                                  {/* Categories Overlay */}
                                  <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
                                    {post.Cat && post.Cat.slice(0, 2).map((c, idx) => (
                                      <span 
                                        key={idx}
                                        className="bg-black/75 backdrop-blur-md text-primary font-mono text-[8px] font-bold px-2 py-0.5 rounded border border-white/10"
                                      >
                                        {c.toUpperCase()}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Card Body */}
                              <div className="p-5 space-y-2.5">
                                {/* Meta row */}
                                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-primary/70" />
                                    {post.Date}
                                  </span>
                                  <span className="flex items-center gap-1 text-slate-400 font-bold bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                                    <User className="w-2.5 h-2.5 text-secondary/70" />
                                    Pro Bandey
                                  </span>
                                </div>

                                {/* Title */}
                                <h2 
                                  onClick={() => setActivePostId(post.Article)}
                                  className="font-mono text-base font-bold text-slate-200 group-hover:text-primary transition-colors cursor-pointer line-clamp-2 uppercase pr-8"
                                >
                                  {post.Name}
                                </h2>

                                {/* Desc */}
                                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                                  {post.Desc}
                                </p>
                              </div>
                            </div>

                            {/* Footer Row */}
                            <div className="p-5 pt-0 border-t border-white/[0.03] mt-4 flex items-center justify-between">
                              <div className="flex flex-wrap gap-1">
                                {post.Tags && post.Tags.slice(0, 2).map((t, idx) => (
                                  <span key={idx} className="text-[9px] font-mono text-slate-500">
                                    #{t}
                                  </span>
                                ))}
                              </div>

                              <button
                                onClick={() => setActivePostId(post.Article)}
                                className="flex items-center gap-1 font-mono text-[10px] font-bold text-primary group-hover:translate-x-1 transition-transform cursor-pointer"
                              >
                                <span>READ_LOG</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              // LIVE RSS PARSER VIEW
              <div className="space-y-6">
                {/* Connection Box */}
                <div className="glass-panel p-5 border border-white/10 bg-white/5 space-y-4">
                  <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-200 uppercase">
                      <Globe className="w-4 h-4 text-primary animate-pulse" />
                      <span>TARGET_RSS_STREAM:</span>
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      <button
                        onClick={() => setRssUrl('https://dev.to/feed')}
                        className={`px-2.5 py-1 rounded border font-mono text-[9px] uppercase transition-all duration-150 cursor-pointer ${
                          rssUrl === 'https://dev.to/feed'
                            ? 'bg-primary/20 border-primary/40 text-primary font-bold'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        DEV.TO
                      </button>
                      <button
                        onClick={() => setRssUrl('https://github.blog/changelog/feed/')}
                        className={`px-2.5 py-1 rounded border font-mono text-[9px] uppercase transition-all duration-150 cursor-pointer ${
                          rssUrl === 'https://github.blog/changelog/feed/'
                            ? 'bg-primary/20 border-primary/40 text-primary font-bold'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        GITHUB CHANGELOG
                      </button>
                      <button
                        onClick={() => setRssUrl('https://blog.rust-lang.org/feed.xml')}
                        className={`px-2.5 py-1 rounded border font-mono text-[9px] uppercase transition-all duration-150 cursor-pointer ${
                          rssUrl === 'https://blog.rust-lang.org/feed.xml'
                            ? 'bg-primary/20 border-primary/40 text-primary font-bold'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        RUST_LANG
                      </button>
                      <button
                        onClick={() => setRssUrl('https://pro-bandey.github.io/TechFeeds/feeds/index.xml')}
                        className={`px-2.5 py-1 rounded border font-mono text-[9px] uppercase transition-all duration-150 cursor-pointer ${
                          rssUrl === 'https://pro-bandey.github.io/feed.xml'
                            ? 'bg-primary/20 border-primary/40 text-primary font-bold'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        PRO_BANDEY
                      </button>
                    </div>
                  </div>

                  {/* Input stream */}
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={rssUrl}
                      onChange={(e) => setRssUrl(e.target.value)}
                      placeholder="Paste any XML or RSS Feed URL node..."
                      className="flex-1 bg-black/40 border border-white/5 focus:border-primary/40 focus:ring-0 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-200 outline-none placeholder-slate-600 transition-colors"
                    />
                    <button
                      onClick={() => parseRSS(rssUrl)}
                      disabled={rssLoading}
                      className="bg-primary/10 hover:bg-primary/20 disabled:opacity-50 text-primary border border-primary/30 rounded-xl px-4 py-2.5 font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {rssLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      <span>CONNECT_</span>
                    </button>
                  </div>
                </div>

                {/* RSS LOADING */}
                {rssLoading && (
                  <div className="flex flex-col items-center justify-center py-24 space-y-4 bg-slate-950/20 rounded-3xl border border-white/5">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="font-mono text-xs text-slate-400 uppercase tracking-widest animate-pulse">
                      ESTABLISHING_SOCKET_DOM_PARSER...
                    </p>
                    <p className="font-mono text-[9px] text-slate-600 uppercase">
                      resolving node: {rssUrl}
                    </p>
                  </div>
                )}

                {/* RSS ERROR */}
                {rssError && !rssLoading && (
                  <div className="glass-panel p-12 text-center max-w-xl mx-auto space-y-4 border-rose-500/20 bg-slate-950/20">
                    <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                    <h3 className="font-mono text-sm font-bold text-slate-200 uppercase tracking-wider">
                      CORS OR SCHEMA_MISMATCH_ERROR
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                      Could not fetch or parse the RSS feed directly. Many domains block cross-origin requests.
                      Try one of the presets or input a standard CORS-enabled feed URL.
                    </p>
                    <div className="text-[10px] font-mono text-rose-400/80 bg-rose-950/30 border border-rose-500/10 p-2 rounded max-w-sm mx-auto truncate">
                      {rssError}
                    </div>
                    <button
                      onClick={() => parseRSS(rssUrl)}
                      className="bg-white/5 hover:bg-white/10 text-slate-200 font-mono text-xs px-4 py-2 rounded-lg border border-white/5 transition-all cursor-pointer"
                    >
                      RETRY STREAM CONNECTION
                    </button>
                  </div>
                )}

                {/* RSS ITEMS LIST */}
                {!rssLoading && !rssError && rssItems.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rssItems.map((item, idx) => (
                      <a
                        key={idx}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-panel group border border-white/5 hover:border-primary/20 flex flex-col justify-between overflow-hidden relative shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
                      >
                        {/* Corner accents */}
                        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div>
                          {/* Banner Wrapper */}
                          {item.thumbnail && (
                            <div className="w-full h-40 overflow-hidden relative">
                              <img 
                                src={item.thumbnail} 
                                alt={item.title} 
                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 select-none"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-slate-950/20" />
                            </div>
                          )}

                          {/* Card Body */}
                          <div className="p-5 space-y-2.5">
                            {/* Meta row */}
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-primary/70" />
                                {item.pubDate}
                              </span>
                              <span className="flex items-center gap-1 text-slate-400 font-bold bg-white/5 border border-white/5 px-2 py-0.5 rounded max-w-[120px] truncate">
                                <User className="w-2.5 h-2.5 text-secondary/70 shrink-0" />
                                {item.creator}
                              </span>
                            </div>

                            {/* Title */}
                            <h2 className="font-mono text-sm font-bold text-slate-200 group-hover:text-primary transition-colors line-clamp-2 uppercase pr-6">
                              {item.title}
                            </h2>

                            {/* Desc excerpt */}
                            <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                              {item.contentSnippet}
                            </p>
                          </div>
                        </div>

                        {/* Footer Row */}
                        <div className="p-5 pt-0 border-t border-white/[0.03] mt-4 flex items-center justify-between">
                          <div className="flex flex-wrap gap-1 max-w-[70%]">
                            {item.categories && item.categories.slice(0, 2).map((cat, catIdx) => (
                              <span 
                                key={catIdx} 
                                className="bg-primary/5 border border-primary/10 text-primary font-mono text-[8px] px-1.5 py-0.5 rounded"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-primary group-hover:translate-x-1 transition-transform shrink-0">
                            <span>LAUNCH_</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {/* RSS EMPTY */}
                {!rssLoading && !rssError && rssItems.length === 0 && (
                  <div className="glass-panel p-12 text-center max-w-xl mx-auto space-y-4 border-dashed border-white/5 bg-slate-950/20">
                    <Rss className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
                    <h3 className="font-mono text-base font-bold text-slate-200 uppercase">
                      NO_RSS_PACKETS_RESOLVED_
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      No feed logs could be loaded or parsed from this target endpoint. Please trigger connectivity or verify the node structure.
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    );
  }
