import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, 'dist');
const PUBLIC_DIR = path.resolve(__dirname, 'public');

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// 1. Generate robots.txt
const robotsTxt = `User-agent: *
Allow: /
Sitemap: https://pro-bandey.github.io/sitemap.xml
`;
fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robotsTxt);
console.log('✓ Generated robots.txt');

// 2. Generate sitemap.xml
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://pro-bandey.github.io/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml);
console.log('✓ Generated sitemap.xml');

// 3. Mock tags.json generation to fit prompt requirements
const tagsJson = {
  title: "Pro Bandey",
  description: "A professional full-stack portfolio, developer workspace, and public repository registry by Pro-bandey.",
  keywords: "portfolio, developer",
  author: "Pro bandey",
  themeColor: "#ff9900",
  siteName: "Pro Bandey",
  url: "https://github.com/Pro-bandey/",
  locale: "en_US",
  twitter: "@probandey",
  facebook: "probandeyofficail"
};
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}
fs.writeFileSync(path.join(PUBLIC_DIR, 'tags.json'), JSON.stringify(tagsJson, null, 2));
console.log('✓ Generated tags.json');
