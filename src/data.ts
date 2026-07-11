import { Repository } from './types';

export const FALLBACK_REPOSITORIES: Repository[] = [
  {
    Repo: 'Pro-bandey',
    Status: 'Pub',
    Date: '2026-06-20T12:00:00Z',
    UpdatedAt: '2026-07-09T12:00:00Z',
    Desc: 'Personal developer profiles, configuration maps, and central system database. Fully responsive and progressive web architecture.',
    ReadMeIs: true,
    Langs: { TypeScript: 60, JavaScript: 20, CSS: 15, HTML: 5 },
    Stars: 142,
  },
  {
    Repo: 'pwa-speed-optimizer',
    Status: 'Pub',
    Date: '2026-06-25T08:00:00Z',
    UpdatedAt: '2026-07-05T08:00:00Z',
    Desc: 'High-performance offline progressive web asset cacher. Dramatically lowers first-contentful paint speeds using custom Service Worker logic.',
    ReadMeIs: true,
    PreviewUrl: 'https://pro-bandey.github.io/pwa-speed-optimizer',
    Langs: { TypeScript: 80, Shell: 15, Markdown: 5 },
    Stars: 58,
  },
  {
    Repo: 'dynamic-api-aggregator',
    Status: 'Pub',
    Date: '2026-06-15T15:30:00Z',
    UpdatedAt: '2026-06-16T15:30:00Z',
    Desc: 'Lightweight asynchronous background worker designed to query multi-node REST endpoints and compile robust local cache structures.',
    ReadMeIs: true,
    Langs: { Go: 70, TypeScript: 20, Shell: 10 },
    Stars: 12,
  },
  {
    Repo: 'automated-ci-pipeline',
    Status: 'Pub',
    Date: '2026-05-10T10:00:00Z',
    UpdatedAt: '2026-07-10T10:00:00Z',
    Desc: 'A unified workflow actions library designed to compile static pages, execute lint scans, and deploy instantly to target cloud nodes.',
    ReadMeIs: false,
    Langs: { Shell: 90, Yml: 10 },
    Stars: 4,
  }
];

export const CAPABILITIES = [
  {
    id: 'web-architecture',
    title: 'Web Architecture',
    desc: 'Designing high-speed progressive web applications featuring dynamic caching, intelligent Service Workers, and zero-latency pipelines.',
    icon: 'code',
    color: 'primary',
  },
  {
    id: 'custom-automation',
    title: 'Custom Automation',
    desc: 'Automated workflow architectures and script engineering processes that safely aggregate data feeds, compile configurations, and minimize overhead.',
    icon: 'cpu',
    color: 'secondary',
  },
  {
    id: 'full-stack-logic',
    title: 'Full-Stack Logic',
    desc: 'Developing lightning-fast client environments backed by structured JSON stores, responsive layout frameworks, and optimized modules.',
    icon: 'database',
    color: 'primary',
  }
];
