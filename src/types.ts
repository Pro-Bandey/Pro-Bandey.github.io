export interface Repository {
  Repo: string;
  Status: string;
  Date: string;
  Banner?: string;
  Langs?: Record<string, number>;
  Desc: string;
  ReadMeIs: boolean;
  PreviewUrl?: string;
  Stars?: number;
}

export interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success';
}

export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Python: '#3572a5',
  TypeScript: '#3178c6',
  Shell: '#89e051',
  C: '#555555',
  'C++': '#f34b7d',
  Go: '#00add8',
  Rust: '#dea584',
  Java: '#b07219',
  Yml: '#e32626',
  Markdown: '#083fa1',
  Vue: '#41b883',
  React: '#61dafb',
};
