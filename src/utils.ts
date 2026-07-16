import { Repository } from './types';

/**
 * Calculates a dynamic complexity score from 1.0 to 10.0 based on:
 * - Number of different technologies/languages used
 * - Number of total commits or repository stars
 * - Detail density in the project description
 */
export function calculateComplexityScore(repo: Repository): number {
  const languageCount = repo.Langs ? Object.keys(repo.Langs).length : 1;
  const descriptionLength = repo.Desc ? repo.Desc.length : 0;
  const starsCount = repo.Stars || 0;
  const commitsCount = repo.Commits || 0;

  // Base score from languages (more languages indicates a multi-tech codebase)
  let score = languageCount * 2.0;

  // Detail weight (longer description = more complex functionality explained)
  score += Math.min(descriptionLength / 50, 2.5);

  // Activity weight (more commits / stars = highly iterated system)
  if (commitsCount > 0) {
    score += Math.min(commitsCount / 40, 3.5);
  } else {
    score += Math.min(starsCount / 25, 2.5);
  }

  // Bound the score between 1.5 and 10.0 for aesthetic scaling
  const finalScore = Math.max(1.5, Math.min(10.0, score));
  return parseFloat(finalScore.toFixed(1));
}

/**
 * Categorizes a repository into tags based on keyword patterns
 * in the repository name, languages, and description.
 */
export function getRepositoryTags(repo: Repository): string[] {
  const tags: string[] = [];
  const desc = (repo.Desc || '').toLowerCase();
  const name = (repo.Repo || '').toLowerCase();
  const languages = repo.Langs ? Object.keys(repo.Langs).map(l => l.toLowerCase()) : [];

  if (desc.includes('pwa') || desc.includes('progressive web') || desc.includes('service worker')) {
    tags.push('PWA');
  }

  if (desc.includes('api') || desc.includes('rest') || desc.includes('endpoint') || desc.includes('aggregator')) {
    tags.push('API Integration');
  }

  if (desc.includes('pipeline') || desc.includes('ci') || desc.includes('workflow') || desc.includes('github-actions') || desc.includes('yml')) {
    tags.push('CI/CD');
  }

  if (desc.includes('automation') || desc.includes('automated') || desc.includes('script')) {
    tags.push('Automation');
  }

  if (desc.includes('full-stack') || desc.includes('full stack') || (languages.includes('typescript') && languages.includes('css') && desc.includes('web'))) {
    tags.push('Full-Stack');
  } else if (languages.includes('css') || languages.includes('html') || desc.includes('frontend') || desc.includes('responsive')) {
    tags.push('Frontend');
  }

  if (desc.includes('cli') || desc.includes('command line') || desc.includes('tool') || languages.includes('shell') || name.includes('cli')) {
    tags.push('CLI Tool');
  }

  if (desc.includes('worker') || desc.includes('asynchronous') || languages.includes('go') || languages.includes('rust')) {
    tags.push('Backend');
  }

  // Ensure we always have at least one highly descriptive category tag
  if (tags.length === 0) {
    if (languages.includes('typescript') || languages.includes('javascript')) {
      tags.push('Web App');
    } else {
      tags.push('Developer Tool');
    }
  }

  return tags.slice(0, 3);
}
